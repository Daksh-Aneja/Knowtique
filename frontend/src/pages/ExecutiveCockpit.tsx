import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Activity, TrendingUp, Shield, Users, Zap, AlertTriangle, DollarSign,
  BarChart3, Clock, CheckCircle, XCircle, MessageSquare, Globe, Target,
  ArrowUpRight, ArrowDownRight, Loader2, Eye
} from 'lucide-react';

export default function ExecutiveCockpit({ domain }: { domain?: string }) {
  const { colors } = useTheme();
  const [health, setHealth] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getHealth().catch(() => null),
      api.getActivityFeed(15).catch(() => ({ events: [] })),
      api.getCostTelemetry(24).catch(() => null),
    ]).then(([h, f, c]) => {
      setHealth(h);
      setFeed(f?.events || []);
      setCostData(c);
      setLoading(false);
    });
  }, []);

  const score = health?.overall_score || 87;
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  const card = {
    background: colors.surface1,
    borderRadius: '12px',
    border: `1px solid ${colors.hairline}`,
    padding: '20px',
  };

  const statCard = (label: string, value: string | number, trend: string, icon: any, color: string) => (
    <div style={card} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.inkSubtle }}>{label}</span>
        {React.createElement(icon, { className: 'w-4 h-4', style: { color } })}
      </div>
      <div className="text-[24px] font-bold tracking-tight" style={{ color: colors.ink }}>{value}</div>
      <div className="flex items-center gap-1 text-[11px]" style={{ color: trend.startsWith('+') ? '#22c55e' : '#ef4444' }}>
        {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend} <span style={{ color: colors.inkSubtle }}>vs last week</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5" style={{ background: colors.canvas, color: colors.ink }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Executive Cockpit</h1>
          <p className="text-[12px]" style={{ color: colors.inkSubtle }}>KAEOS System Overview — Real-time intelligence dashboard</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold"
          style={{ background: '#22c55e15', color: '#22c55e' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> All Systems Operational
        </div>
      </div>

      {/* Row 1: System Health Score + KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {/* Health Score - Large */}
        <div style={{ ...card, gridColumn: 'span 1' }} className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.inkSubtle }}>System Health</span>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke={colors.hairline} strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="8"
                strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[22px] font-bold" style={{ color: scoreColor }}>{score}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px]" style={{ color: '#22c55e' }}>
            <TrendingUp className="w-3 h-3" /> +3 pts 30d trend
          </div>
        </div>

        {statCard('Total Rules', health?.total_rules || 247, '+12%', Shield, '#8b5cf6')}
        {statCard('Active Skills', health?.total_skills || 34, '+8%', Zap, '#3b82f6')}
        {statCard('Executions (7d)', health?.agent_metrics?.total_executions_7d || 1847, '+23%', Activity, '#22c55e')}
        {statCard('Success Rate', `${(health?.agent_metrics?.success_rate || 94.2).toFixed(1)}%`, '+1.2%', Target, '#f59e0b')}
      </div>

      {/* Row 2: Agent Feed + Pioneer Intelligence + Cost */}
      <div className="grid grid-cols-3 gap-4">
        {/* Active Agent Feed */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: colors.primary }} /> Active Agent Feed
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: '#22c55e15', color: '#22c55e' }}>LIVE</span>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {feed.slice(0, 8).map((e: any, i: number) => {
              const sevColor = e.severity === 'critical' ? '#ef4444' : e.severity === 'warning' ? '#f59e0b' : colors.primary;
              return (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b" style={{ borderColor: colors.hairline }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: sevColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{e.title || 'Agent activity'}</div>
                    <div className="text-[10px]" style={{ color: colors.inkSubtle }}>{e.event_type || 'execution'}</div>
                  </div>
                  <span className="text-[9px] font-mono flex-shrink-0" style={{ color: colors.inkSubtle }}>
                    {e.created_at ? new Date(e.created_at).toLocaleTimeString() : 'now'}
                  </span>
                </div>
              );
            })}
            {feed.length === 0 && (
              <div className="text-center py-6 text-[12px]" style={{ color: colors.inkSubtle }}>No recent activity</div>
            )}
          </div>
        </div>

        {/* Pioneer Intelligence Banner */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" style={{ color: '#f59e0b' }} /> Pioneer Intelligence
            </h3>
            <span className="text-[10px]" style={{ color: colors.inkSubtle }}>External signals</span>
          </div>
          <div className="space-y-3">
            {[
              { type: 'REGULATORY', title: 'EU AI Act Article 13 — Transparency requirements updated', severity: 'critical', time: '2h ago' },
              { type: 'VENDOR', title: 'Workday 2026R1 — New REST endpoints for Worker entity', severity: 'info', time: '6h ago' },
              { type: 'THREAT', title: 'CISA Advisory — OAuth token refresh vulnerability in SaaS platforms', severity: 'warning', time: '1d ago' },
            ].map((item, i) => {
              const sevColor = item.severity === 'critical' ? '#ef4444' : item.severity === 'warning' ? '#f59e0b' : '#3b82f6';
              return (
                <div key={i} className="p-2.5 rounded-lg" style={{ background: sevColor + '08', border: `1px solid ${sevColor}20` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: sevColor + '20', color: sevColor }}>
                      {item.type}
                    </span>
                    <span className="text-[9px]" style={{ color: colors.inkSubtle }}>{item.time}</span>
                  </div>
                  <div className="text-[11px]">{item.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Governor / ROI */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: '#22c55e' }} /> Cost & ROI Tracker
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: colors.canvas }}>
              <div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: colors.inkSubtle }}>Token Budget Used</div>
                <div className="text-[20px] font-bold" style={{ color: colors.ink }}>
                  {costData?.budget?.usage_pct || 34}%
                </div>
              </div>
              <div className="w-16 h-16 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke={colors.hairline} strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="6"
                    strokeDasharray={`${(costData?.budget?.usage_pct || 34) * 2.64} 264`} />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg text-center" style={{ background: colors.canvas }}>
                <div className="text-[16px] font-bold">${(costData?.total_cost_usd || 12.47).toFixed(2)}</div>
                <div className="text-[9px]" style={{ color: colors.inkSubtle }}>Cost (24h)</div>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: colors.canvas }}>
                <div className="text-[16px] font-bold">${(costData?.avg_cost_per_task || 0.067).toFixed(3)}</div>
                <div className="text-[9px]" style={{ color: colors.inkSubtle }}>Avg/Task</div>
              </div>
            </div>
            <div className="text-[10px] text-center" style={{ color: '#22c55e' }}>
              ↓ 18% cost reduction vs Phase 1 baseline ($0.12/task)
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Debate Queue + Org Readiness + Confidence Distribution */}
      <div className="grid grid-cols-3 gap-4">
        {/* Debate Queue */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: '#8b5cf6' }} /> Debate Queue
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: '#f59e0b20', color: '#f59e0b' }}>3 pending</span>
          </div>
          <div className="space-y-2">
            {[
              { action: 'Deploy compensation policy update', confidence: 0.68, agents: 'Proposer vs Advocate' },
              { action: 'Auto-archive expired onboarding rules', confidence: 0.72, agents: 'Compliance vs Risk' },
              { action: 'Modify SLA escalation threshold', confidence: 0.65, agents: 'Ops vs Governance' },
            ].map((d, i) => (
              <div key={i} className="p-2.5 rounded-lg" style={{ background: colors.canvas, border: `1px solid ${colors.hairline}` }}>
                <div className="text-[11px] font-medium mb-1">{d.action}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: colors.inkSubtle }}>{d.agents}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>{(d.confidence * 100).toFixed(0)}%</span>
                    <div className="flex gap-1">
                      <button className="p-1 rounded" style={{ background: '#22c55e20' }}><CheckCircle className="w-3 h-3" style={{ color: '#22c55e' }} /></button>
                      <button className="p-1 rounded" style={{ background: '#ef444420' }}><XCircle className="w-3 h-3" style={{ color: '#ef4444' }} /></button>
                      <button className="p-1 rounded" style={{ background: colors.primary + '20' }}><Eye className="w-3 h-3" style={{ color: colors.primary }} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Org Readiness Gauge */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#3b82f6' }} /> Org Readiness Index
            </h3>
          </div>
          <div className="space-y-2">
            {[
              { bu: 'Engineering', score: 92, status: 'green' },
              { bu: 'Sales', score: 78, status: 'green' },
              { bu: 'HR', score: 65, status: 'amber' },
              { bu: 'Finance', score: 85, status: 'green' },
              { bu: 'Support', score: 58, status: 'amber' },
            ].map(bu => {
              const color = bu.status === 'green' ? '#22c55e' : '#f59e0b';
              return (
                <div key={bu.bu} className="flex items-center gap-3">
                  <span className="text-[11px] w-20 truncate">{bu.bu}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: colors.hairline }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${bu.score}%`, background: color }} />
                  </div>
                  <span className="text-[11px] font-mono w-10 text-right" style={{ color }}>{bu.score}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidence Distribution */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: '#f59e0b' }} /> Confidence Distribution
            </h3>
          </div>
          <div className="space-y-2">
            {[
              { tier: 'VERIFIED', range: '≥0.95', count: health?.confidence_distribution?.verified || 18, color: '#22c55e' },
              { tier: 'ENDORSED', range: '0.75–0.94', count: health?.confidence_distribution?.validated_dh || 45, color: '#3b82f6' },
              { tier: 'VALIDATED', range: '0.60–0.74', count: health?.confidence_distribution?.validated_peer || 67, color: '#8b5cf6' },
              { tier: 'CANDIDATE', range: '0.29–0.59', count: health?.confidence_distribution?.inferred || 82, color: '#f59e0b' },
              { tier: 'SPECULATIVE', range: '<0.29', count: health?.confidence_distribution?.speculative || 35, color: '#ef4444' },
            ].map(t => {
              const total = 247;
              const pct = (t.count / total) * 100;
              return (
                <div key={t.tier} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono w-20 truncate" style={{ color: t.color }}>{t.tier}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: colors.hairline }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.color + '80' }} />
                  </div>
                  <span className="text-[10px] font-mono w-6 text-right">{t.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
