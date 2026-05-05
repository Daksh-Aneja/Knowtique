import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Eye, Compass, Brain, Zap, ArrowRight, CheckCircle, Clock, AlertTriangle,
  Activity, Shield, Users, Loader2, ChevronRight
} from 'lucide-react';

interface OODAEvent {
  id: string;
  phase: 'OBSERVE' | 'ORIENT' | 'DECIDE' | 'ACT';
  status: 'active' | 'complete' | 'blocked' | 'pending';
  title: string;
  detail: string;
  confidence?: number;
  gate?: string;
  timestamp: Date;
}

export default function OODAMonitor({ domain }: { domain?: string }) {
  const { colors } = useTheme();
  const [events, setEvents] = useState<OODAEvent[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  useEffect(() => {
    // Generate realistic OODA events
    const demoEvents: OODAEvent[] = [
      { id: '1', phase: 'OBSERVE', status: 'complete', title: 'Workday CDC event: Org restructure detected', detail: 'Engineering dept split into 3 sub-units. 47 position changes, 12 reporting line updates.', confidence: 0.95, timestamp: new Date(Date.now() - 300000) },
      { id: '2', phase: 'ORIENT', status: 'complete', title: 'Knowledge Graph traversal complete', detail: 'Loaded 23 related entities, 8 dependency chains. P4 Temporal: fiscal quarter end in 18 days.', confidence: 0.88, timestamp: new Date(Date.now() - 240000) },
      { id: '3', phase: 'DECIDE', status: 'active', title: 'Strategy: Update escalation rules + recompile 3 skills', detail: 'P3 Ethics gate PASSED (0.91). Debate Engine triggered — Tier-1 write action proposed.', confidence: 0.78, gate: 'DEBATE_REQUIRED', timestamp: new Date(Date.now() - 180000) },
      { id: '4', phase: 'ACT', status: 'pending', title: 'Awaiting debate resolution', detail: 'Proposer vs Advocate deliberation in progress. HITL checkpoint queued if score < 0.70.', timestamp: new Date(Date.now() - 120000) },
      { id: '5', phase: 'OBSERVE', status: 'complete', title: 'Regulatory feed: EEOC guidance update', detail: 'New hiring audit requirements effective 2026-07-01. Cross-correlated with 4 HR rules.', confidence: 0.92, timestamp: new Date(Date.now() - 600000) },
      { id: '6', phase: 'ORIENT', status: 'complete', title: 'P2 Org Intelligence: Change readiness scored', detail: 'HR department readiness: 65%. Sales: 78%. Influence path computed for optimal rollout.', confidence: 0.85, timestamp: new Date(Date.now() - 540000) },
      { id: '7', phase: 'DECIDE', status: 'complete', title: 'Auto-execute: Update compliance tags', detail: '5D confidence 0.89 (ENDORSED). Non-Tier-1 action. Auto-approved.', confidence: 0.89, gate: 'AUTO_APPROVED', timestamp: new Date(Date.now() - 480000) },
      { id: '8', phase: 'ACT', status: 'complete', title: 'Compliance tags updated on 4 rules', detail: 'Provenance entry written. Decay timer reset. B12 benchmark delta logged.', confidence: 0.89, timestamp: new Date(Date.now() - 420000) },
    ];
    setEvents(demoEvents);
  }, []);

  const phases = [
    { id: 'OBSERVE', label: 'Observe', icon: Eye, color: '#3b82f6', desc: 'Kafka events + P1 External Intel' },
    { id: 'ORIENT', label: 'Orient', icon: Compass, color: '#8b5cf6', desc: 'KG traversal + P2/P4 context' },
    { id: 'DECIDE', label: 'Decide', icon: Brain, color: '#f59e0b', desc: 'Strategy + P3 Ethics + Debate' },
    { id: 'ACT', label: 'Act', icon: Zap, color: '#22c55e', desc: 'HITL + Execute + Provenance' },
  ];

  const phaseEvents = (phase: string) => events.filter(e => e.phase === phase);
  const statusColor = (s: string) => s === 'complete' ? '#22c55e' : s === 'active' ? '#f59e0b' : s === 'blocked' ? '#ef4444' : colors.inkSubtle;

  return (
    <div className="p-6 space-y-5" style={{ background: colors.canvas, color: colors.ink }}>
      <div>
        <h2 className="text-[18px] font-semibold tracking-tight">OODA Control Loop Monitor</h2>
        <p className="text-[12px]" style={{ color: colors.inkSubtle }}>
          The cognitive heartbeat of AEOS — every event flows Observe → Orient → Decide → Act
        </p>
      </div>

      {/* OODA Pipeline Visualization */}
      <div className="flex items-center gap-0">
        {phases.map((p, i) => {
          const active = phaseEvents(p.id).some(e => e.status === 'active');
          const count = phaseEvents(p.id).length;
          return (
            <React.Fragment key={p.id}>
              <button onClick={() => setSelectedPhase(selectedPhase === p.id ? null : p.id)}
                className="flex-1 relative rounded-xl p-4 transition-all border"
                style={{
                  background: active ? p.color + '10' : colors.surface1,
                  borderColor: selectedPhase === p.id ? p.color : active ? p.color + '40' : colors.hairline,
                  boxShadow: active ? `0 0 20px ${p.color}15` : 'none'
                }}>
                {active && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: p.color }} />
                )}
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(p.icon, { className: 'w-5 h-5', style: { color: p.color } })}
                  <span className="text-[14px] font-bold" style={{ color: p.color }}>{p.label}</span>
                </div>
                <div className="text-[10px] mb-2" style={{ color: colors.inkSubtle }}>{p.desc}</div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: p.color + '20', color: p.color }}>
                    {count} events
                  </span>
                  {active && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse"
                      style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                      ACTIVE
                    </span>
                  )}
                </div>
              </button>
              {i < phases.length - 1 && (
                <div className="flex-shrink-0 px-1">
                  <ArrowRight className="w-5 h-5" style={{ color: colors.hairline }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Event Timeline */}
      <div className="rounded-xl border" style={{ borderColor: colors.hairline, background: colors.surface1 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: colors.hairline }}>
          <h3 className="text-[13px] font-semibold">Event Timeline</h3>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} /> Complete</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#f59e0b' }} /> Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: colors.inkSubtle }} /> Pending</span>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: colors.hairline }}>
          {events
            .filter(e => !selectedPhase || e.phase === selectedPhase)
            .map(e => {
              const phase = phases.find(p => p.id === e.phase)!;
              return (
                <div key={e.id} className="px-4 py-3 flex items-start gap-3 transition-colors hover:bg-canvas/50">
                  {/* Phase Badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: phase.color + '15' }}>
                      {React.createElement(phase.icon, { className: 'w-4 h-4', style: { color: phase.color } })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold">{e.title}</span>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(e.status) }} />
                    </div>
                    <div className="text-[11px]" style={{ color: colors.inkSubtle }}>{e.detail}</div>
                    {/* Gates */}
                    {e.gate && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {e.gate === 'DEBATE_REQUIRED' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
                            ⚖ Debate Engine Active
                          </span>
                        )}
                        {e.gate === 'AUTO_APPROVED' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: '#22c55e15', color: '#22c55e' }}>
                            ✓ Auto-Approved (ENDORSED tier)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confidence + Time */}
                  <div className="flex-shrink-0 text-right">
                    {e.confidence && (
                      <div className="text-[12px] font-mono font-bold"
                        style={{ color: e.confidence >= 0.8 ? '#22c55e' : e.confidence >= 0.6 ? '#f59e0b' : '#ef4444' }}>
                        {(e.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                    <div className="text-[9px] font-mono" style={{ color: colors.inkSubtle }}>
                      {e.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
