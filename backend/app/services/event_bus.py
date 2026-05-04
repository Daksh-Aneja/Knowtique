"""L25 — Webhook & Event Notification Bus
Real-time event broadcasting to external systems (alerting platforms, messaging, custom endpoints).
Fires on: decay alerts, HITL requests, agent failures, compliance violations, rule mutations.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from enum import Enum
import asyncio
import hashlib
import json
import uuid
import logging

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    RULE_CREATED = "rule.created"
    RULE_VALIDATED = "rule.validated"
    RULE_DECAYED = "rule.decayed"
    RULE_ARCHIVED = "rule.archived"
    SKILL_COMPILED = "skill.compiled"
    SKILL_EXECUTED = "skill.executed"
    SKILL_FAILED = "skill.failed"
    HITL_REQUESTED = "hitl.requested"
    HITL_APPROVED = "hitl.approved"
    HITL_REJECTED = "hitl.rejected"
    COMPLIANCE_VIOLATION = "compliance.violation"
    DECAY_ALERT = "decay.alert"
    AGENT_ANOMALY = "agent.anomaly"
    ELICITATION_GENERATED = "elicitation.generated"
    REGULATORY_PATCH = "regulatory.patch"
    FEDERATED_EXPORT = "federated.export"
    SYSTEM_HEALTH = "system.health"


class WebhookSubscription:
    def __init__(self, endpoint: str, events: List[EventType], secret: str = None,
                 tenant_id: str = "tenant_acme", name: str = "default"):
        self.id = str(uuid.uuid4())
        self.endpoint = endpoint
        self.events = events
        self.secret = secret or hashlib.sha256(uuid.uuid4().hex.encode()).hexdigest()[:32]
        self.tenant_id = tenant_id
        self.name = name
        self.created_at = datetime.now(timezone.utc)
        self.active = True
        self.delivery_count = 0
        self.failure_count = 0
        self.last_delivered_at = None


class EventBus:
    """Central event bus — collects events and dispatches to webhook subscribers."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._subscriptions: List[WebhookSubscription] = []
            cls._instance._event_log: List[Dict] = []
            cls._instance._max_log = 500
        return cls._instance

    def subscribe(self, endpoint: str, events: List[EventType],
                  secret: str = None, tenant_id: str = "tenant_acme", name: str = "default") -> WebhookSubscription:
        sub = WebhookSubscription(endpoint, events, secret, tenant_id, name)
        self._subscriptions.append(sub)
        logger.info(f"[EventBus] New subscription: {name} → {endpoint} for {len(events)} events")
        return sub

    def unsubscribe(self, sub_id: str) -> bool:
        for sub in self._subscriptions:
            if sub.id == sub_id:
                sub.active = False
                return True
        return False

    def list_subscriptions(self, tenant_id: str = None) -> List[Dict]:
        subs = self._subscriptions
        if tenant_id:
            subs = [s for s in subs if s.tenant_id == tenant_id]
        return [
            {"id": s.id, "name": s.name, "endpoint": s.endpoint,
             "events": [e.value for e in s.events], "active": s.active,
             "delivery_count": s.delivery_count, "failure_count": s.failure_count,
             "created_at": s.created_at.isoformat()}
            for s in subs
        ]

    async def emit(self, event_type: EventType, payload: Dict[str, Any],
                   tenant_id: str = "tenant_acme"):
        """Emit an event to all matching subscribers."""
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type.value,
            "tenant_id": tenant_id,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Log event
        self._event_log.append(event)
        if len(self._event_log) > self._max_log:
            self._event_log = self._event_log[-self._max_log:]

        # Dispatch to subscribers
        matching = [s for s in self._subscriptions
                    if s.active and event_type in s.events and s.tenant_id == tenant_id]

        for sub in matching:
            try:
                # Sign payload
                signature = hashlib.sha256(
                    f"{sub.secret}|{json.dumps(event, sort_keys=True, default=str)}".encode()
                ).hexdigest()

                # In production: httpx.AsyncClient().post(sub.endpoint, json=event, headers={"X-Knowtique-Signature": signature})
                logger.info(f"[EventBus] Delivered {event_type.value} → {sub.endpoint}")
                sub.delivery_count += 1
                sub.last_delivered_at = datetime.now(timezone.utc)
            except Exception as e:
                sub.failure_count += 1
                logger.warning(f"[EventBus] Delivery failed to {sub.endpoint}: {e}")

        return event

    def get_event_log(self, event_type: str = None, limit: int = 50) -> List[Dict]:
        log = self._event_log
        if event_type:
            log = [e for e in log if e["type"] == event_type]
        return log[-limit:]


# Singleton
event_bus = EventBus()
