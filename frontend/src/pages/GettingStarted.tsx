import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Plug, Brain, FileCode2, Rocket, Monitor, RefreshCw,
  ArrowRight, ChevronRight, CheckCircle2, Globe, Database,
  Server, Cloud, Upload, Zap
} from 'lucide-react';

interface Props {
  onNavigate: (viewId: string) => void;
}

const FLOWS = [
  {
    id: 'onboarding',
    step: 1,
    title: 'Connect Your Systems',
    subtitle: 'Authenticate and ingest from any enterprise source',
    icon: Plug,
    gradient: 'linear-gradient(135deg, #5e6ad2, #828fff)',
    viewId: 'integrations',
    description: 'Connect your enterprise systems — HRIS, ERP, CRM, ticketing, communication tools, or upload data directly via API. Knowtique authenticates, pulls policies, historical transactions, and decision logs, then runs schema mapping, data normalization, and PII masking to create a domain-specific data graph.',
    capabilities: [
      'OAuth / API key authentication for any enterprise system',
      'Automatic schema mapping and data normalization',
      'PII masking and data sovereignty enforcement',
      'Domain-specific knowledge graph creation',
    ],
    connectorExamples: [
      { icon: Server, label: 'HRIS / HCM' },
      { icon: Database, label: 'ERP Systems' },
      { icon: Globe, label: 'CRM Platforms' },
      { icon: Cloud, label: 'Cloud APIs' },
      { icon: Upload, label: 'Direct Upload' },
    ],
  },
  {
    id: 'extraction',
    step: 2,
    title: 'Knowledge Extraction',
    subtitle: 'Discover decision rules from your data',
    icon: Brain,
    gradient: 'linear-gradient(135deg, #27a644, #4ade80)',
    viewId: 'extraction',
    description: 'The extraction engine clusters behavioral patterns (HDBSCAN), uses LLMs to infer implicit decision rules, detects contradictions, and calculates 5D confidence scores across source reliability, frequency, recency, outcome validation, and explicit validation.',
    capabilities: [
      'Automatic rule discovery from behavioral patterns',
      '5D confidence scoring (source, frequency, recency, outcome, validation)',
      'Contradiction detection and visual highlighting',
      'Approve, reject, or edit discovered rules inline',
    ],
  },
  {
    id: 'skill_builder',
    step: 3,
    title: 'Skill Builder',
    subtitle: 'Convert rules into executable agent contracts',
    icon: FileCode2,
    gradient: 'linear-gradient(135deg, #a855f7, #c084fc)',
    viewId: 'skills',
    description: 'Validated rules are compiled into SKILL.md contracts — machine-executable, versioned agent contracts with triggers, conditions, guardrails, exceptions, and confidence thresholds. Edit logic, add conditions, manage versions — all in a structured visual editor.',
    capabilities: [
      'Auto-generated SKILL.md from validated rules',
      'Structured editor for triggers, conditions, exceptions',
      'Version history and diff comparison',
      'MCP tool bindings and compliance tag assignment',
    ],
  },
  {
    id: 'deployment',
    step: 4,
    title: 'Agent Deployment',
    subtitle: 'Configure risk, confidence, and HITL policies',
    icon: Rocket,
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    viewId: 'factory',
    description: 'Deploy agents with enterprise-grade controls. Set risk levels, confidence thresholds, and human-in-the-loop escalation rules. The AEOS runtime registers the agent, applies risk policies, and links skills to the execution pipeline.',
    capabilities: [
      'Risk level configuration (Low / Medium / High)',
      'Confidence threshold tuning per agent',
      'HITL rules: Always / Conditional / Never',
      'Natural language agent creation via Agent Factory',
    ],
  },
  {
    id: 'execution',
    step: 5,
    title: 'Execution Monitor',
    subtitle: 'Real-time visibility into every decision',
    icon: Monitor,
    gradient: 'linear-gradient(135deg, #e5534b, #f87171)',
    viewId: 'agents',
    description: 'The most important screen. Every agent decision is logged with full transparency: which gates triggered, debate transcripts between adversarial agents, fairness assessments, confidence scores, and an immutable SHA-256 provenance trail.',
    capabilities: [
      '7-gate trust pipeline visualization (pass/fail per gate)',
      'Debate engine transcripts (Proposer vs Advocate vs Arbitrator)',
      'Fairness scoring across protected attributes',
      'Immutable audit trail with SHA-256 hash chain',
    ],
    highlight: true,
  },
  {
    id: 'feedback',
    step: 6,
    title: 'Feedback Loop',
    subtitle: 'Intelligence that compounds over time',
    icon: RefreshCw,
    gradient: 'linear-gradient(135deg, #539bf5, #93c5fd)',
    viewId: 'dashboard',
    description: 'Every execution outcome feeds back into the knowledge base. Bayesian confidence updates, drift detection, new pattern discovery, and automatic elicitation of domain experts when edge cases arise. The system gets smarter with every decision.',
    capabilities: [
      'Bayesian confidence recalibration on every execution',
      'Automatic rule evolution from production outcomes',
      'Drift and anomaly detection',
      'Auto-generated expert elicitation on failures',
    ],
  },
];

export default function GettingStarted({ onNavigate }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState<string | null>('onboarding');

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="text-center pb-2">
        <h1 className="text-[32px] font-bold tracking-tight" style={{ letterSpacing: '-0.8px', color: colors.ink }}>
          How Knowtique Works
        </h1>
        <p className="text-[15px] mt-2 max-w-2xl mx-auto" style={{ color: colors.inkSubtle }}>
          Six connected flows that form a continuous intelligence loop — from connecting your systems to autonomous decisions that get smarter over time.
        </p>
      </div>

      {/* Visual Loop Indicator */}
      <div className="flex items-center justify-center gap-1 py-3">
        {FLOWS.map((flow, i) => (
          <React.Fragment key={flow.id}>
            <button
              onClick={() => setExpanded(expanded === flow.id ? null : flow.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
              style={{
                background: expanded === flow.id ? flow.gradient : colors.surface2,
                color: expanded === flow.id ? '#fff' : colors.inkSubtle,
                border: `1px solid ${expanded === flow.id ? 'transparent' : colors.hairline}`,
                boxShadow: expanded === flow.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}>
              <flow.icon className="w-3.5 h-3.5" />
              {flow.step}
            </button>
            {i < FLOWS.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.hairlineStrong }} />
            )}
          </React.Fragment>
        ))}
        {/* Loop arrow back */}
        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.hairlineStrong }} />
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: colors.surface2, border: `1px solid ${colors.hairline}` }}>
          <RefreshCw className="w-3 h-3" style={{ color: colors.primary }} />
        </div>
      </div>

      {/* Flow Cards */}
      <div className="space-y-3">
        {FLOWS.map((flow) => {
          const isExpanded = expanded === flow.id;
          return (
            <div key={flow.id}
              className="rounded-xl overflow-hidden transition-all duration-300"
              style={{
                background: colors.surface1,
                border: `1px solid ${isExpanded ? (flow.highlight ? 'rgba(229,83,75,0.3)' : `${colors.primary}40`) : colors.hairline}`,
                boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
              }}>
              {/* Header Row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : flow.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = colors.surface2)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: flow.gradient, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                  <flow.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                      STEP {flow.step}
                    </span>
                    <span className="text-[15px] font-semibold" style={{ color: colors.ink }}>{flow.title}</span>
                    {flow.highlight && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(229,83,75,0.1)', color: colors.error, border: '1px solid rgba(229,83,75,0.2)' }}>
                        MOST IMPORTANT
                      </span>
                    )}
                  </div>
                  <span className="text-[12px]" style={{ color: colors.inkSubtle }}>{flow.subtitle}</span>
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0 transition-transform" style={{
                  color: colors.inkTertiary,
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }} />
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${colors.hairline}` }}>
                  <div className="pt-4">
                    <p className="text-[13px] leading-relaxed" style={{ color: colors.inkMuted }}>{flow.description}</p>
                  </div>

                  {/* Connector Examples (Flow 1 only) */}
                  {flow.connectorExamples && (
                    <div className="flex gap-2 flex-wrap">
                      {flow.connectorExamples.map((c) => (
                        <div key={c.label} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ background: colors.surface2, border: `1px solid ${colors.hairline}` }}>
                          <c.icon className="w-4 h-4" style={{ color: colors.primary }} />
                          <span className="text-[12px] font-medium" style={{ color: colors.inkMuted }}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Capabilities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {flow.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg"
                        style={{ background: colors.surface2 }}>
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
                        <span className="text-[12px]" style={{ color: colors.inkMuted }}>{cap}</span>
                      </div>
                    ))}
                  </div>

                  {/* Navigate Button */}
                  <button
                    onClick={() => onNavigate(flow.viewId)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
                    style={{ background: flow.gradient, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                    <Zap className="w-4 h-4" />
                    Go to {flow.title}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom: Loop Callout */}
      <div className="rounded-xl p-5 text-center" style={{ background: `${colors.primary}08`, border: `1px solid ${colors.primary}20` }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <RefreshCw className="w-5 h-5" style={{ color: colors.primary }} />
          <span className="text-[15px] font-semibold" style={{ color: colors.ink }}>The Intelligence Loop</span>
        </div>
        <p className="text-[13px] max-w-xl mx-auto" style={{ color: colors.inkSubtle }}>
          These flows aren't separate — they form a continuous loop. Execution outcomes feed back into extraction, rules evolve, skills update, and agents improve. This compounding intelligence flywheel is Knowtique's real product.
        </p>
      </div>
    </div>
  );
}
