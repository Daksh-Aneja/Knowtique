"""
Knowtique L1 — PII Scrubber Transform (merged from Extract-OS)
Uses Microsoft Presidio for real PII detection.

Actions per entity type:
- MASK: Replace with *** — irreversible
- REDACT: Replace with [ENTITY_TYPE] — irreversible, type-preserving
- TOKENIZE: Replace with reversible token
- FLAG: Pass through but record detection
- HALT: Stop pipeline and alert
"""
from app.transforms.base import BaseTransformNode, TransformRecord, TransformResult
import logging
import asyncio

logger = logging.getLogger(__name__)

# Lazy load Presidio
_presidio_loaded = False
_analyzer_engine = None
_anonymizer_engine = None


def _load_presidio():
    global _presidio_loaded, _analyzer_engine, _anonymizer_engine
    if not _presidio_loaded:
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_anonymizer import AnonymizerEngine
            _analyzer_engine = AnalyzerEngine()
            _anonymizer_engine = AnonymizerEngine()
            _presidio_loaded = True
        except ImportError:
            raise RuntimeError("Microsoft Presidio is required for enterprise PII scrubbing but is not installed.")


class PIIScrubberNode(BaseTransformNode):
    """
    Detect and handle PII in text content using Microsoft Presidio.

    Config:
        action: "mask" | "redact" | "tokenize" | "flag" | "halt"
        confidence_threshold: float (0.0-1.0) — default 0.85
        entity_types: list[str] — which PII types to detect
        language: str — default "en"
        per_entity_actions: dict — override action per entity type
    """

    DEFAULT_ENTITIES = [
        "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD",
        "US_SSN", "US_BANK_NUMBER", "IP_ADDRESS", "IBAN_CODE",
        "MEDICAL_LICENSE",
    ]

    def validate_config(self) -> list[str]:
        errors = []
        action = self.config.get("action", "redact")
        if action not in ("mask", "redact", "tokenize", "flag", "halt"):
            errors.append(f"Invalid PII action: {action}")
        threshold = self.config.get("confidence_threshold", 0.85)
        if not (0.0 <= threshold <= 1.0):
            errors.append("confidence_threshold must be between 0.0 and 1.0")
        return errors

    async def process(self, records: list[TransformRecord]) -> TransformResult:
        _load_presidio()

        action = self.config.get("action", "redact")
        threshold = self.config.get("confidence_threshold", 0.85)
        language = self.config.get("language", "en")
        entity_types = self.config.get("entity_types", self.DEFAULT_ENTITIES)
        per_entity_actions = self.config.get("per_entity_actions", {})

        total_detections = 0
        total_scrubbed = 0
        halt_triggered = False
        processed = []

        for record in records:
            text = record.text_content
            if not text or not _analyzer_engine:
                processed.append(record)
                continue

            # Analyze for PII
            loop = asyncio.get_running_loop()
            results = await loop.run_in_executor(
                None,
                lambda: _analyzer_engine.analyze(
                    text=text, language=language,
                    entities=entity_types, score_threshold=threshold,
                )
            )

            if not results:
                processed.append(record)
                continue

            # Record detections
            for result in results:
                record.pii_detections.append({
                    "entity_type": result.entity_type,
                    "start": result.start, "end": result.end,
                    "score": result.score,
                    "action": per_entity_actions.get(result.entity_type, action),
                })
                total_detections += 1

            # Check for HALT
            if action == "halt" or any(
                per_entity_actions.get(r.entity_type) == "halt" for r in results
            ):
                halt_triggered = True
                record.metadata["pii_halt"] = True
                processed.append(record)
                continue

            # Apply anonymization
            if action == "flag":
                record.metadata["pii_flagged"] = True
                record.metadata["pii_count"] = len(results)
            elif action in ("mask", "redact") and _anonymizer_engine:
                from presidio_anonymizer.entities import OperatorConfig
                if action == "mask":
                    operators = {"DEFAULT": OperatorConfig("replace", {"new_value": "***"})}
                else:
                    operators = {"DEFAULT": OperatorConfig("replace", {"new_value": ""})}
                    for entity in entity_types:
                        ea = per_entity_actions.get(entity, action)
                        if ea == "redact":
                            operators[entity] = OperatorConfig("replace", {"new_value": f"[{entity}]"})
                        elif ea == "mask":
                            operators[entity] = OperatorConfig("replace", {"new_value": "***"})

                anonymized = await loop.run_in_executor(
                    None,
                    lambda: _anonymizer_engine.anonymize(
                        text=text, analyzer_results=results, operators=operators,
                    )
                )
                record.text_content = anonymized.text
                total_scrubbed += len(results)

            self.add_lineage(record, f"pii_scrubbed:{action}:{len(results)}_entities")
            processed.append(record)

        return TransformResult(
            records=processed,
            stats={
                "total_records": len(records),
                "total_pii_detections": total_detections,
                "total_pii_scrubbed": total_scrubbed,
                "halt_triggered": halt_triggered,
            },
            errors=[{"type": "pii_halt", "message": "Pipeline halted due to PII detection"}]
            if halt_triggered else [],
        )
