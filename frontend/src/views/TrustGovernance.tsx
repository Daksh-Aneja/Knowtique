import React, { useEffect, useState } from 'react';
import { Shield, Scale, Link2, MessageSquare, ShieldAlert, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, FileText } from 'lucide-react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const TrustGovernance: React.FC<{ domain?: string }> = ({ domain }) => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'compliance' | 'provenance' | 'fairness' | 'debates'>('compliance');
  const [compliance, setCompliance] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [fairnessLog, setFairnessLog] = useState<any[]>([]);
  const [debates, setDebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, p, f, d] = await Promise.allSettled([
        api.getComplianceReport(),
        api.getProvenanceLedger(),
        api.getFairnessLog(30),
        api.getRecentDebates(),
      ]);
      if (c.status === 'fulfilled') setCompliance(c.value);
      if (p.status === 'fulfilled') setLedger(p.value?.ledger || []);
      if (f.status === 'fulfilled') setFairnessLog(f.value?.logs || []);
      if (d.status === 'fulfilled') setDebates(d.value?.transcripts || []);
      setLoading(false);
    })();
  }, []);

  const timeAgo = (iso: string) => {
    if (!iso) return '';
    const d = Date.now() - new Date(iso).getTime();
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight" style={{ letterSpacing: '-0.6px', color: colors.ink }}>Trust & Governance</h1>
        <p className="text-[13px] mt-0.5" style={{ color: colors.inkSubtle }}>Compliance, provenance audit trail, fairness scoring, and debate transcripts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
        {([['compliance', 'Compliance', Scale], ['provenance', 'Provenance', Link2], ['fairness', 'Fairness', Shield], ['debates', 'Debates', MessageSquare]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as any)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all"
            style={{ background: tab === id ? colors.primary : 'transparent', color: tab === id ? '#fff' : colors.inkSubtle }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Compliance */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          {compliance ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Compliance Score', val: compliance.compliance_score || compliance.overall_score || '—', accent: colors.success },
                  { label: 'Rules Audited', val: compliance.rules_audited || compliance.total_rules || '—', accent: colors.info },
                  { label: 'Violations', val: compliance.violations_count || 0, accent: colors.error },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl p-5" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: colors.inkSubtle }}>{m.label}</span>
                    <div className="text-[28px] font-bold mt-2" style={{ color: m.accent, letterSpacing: '-1px' }}>{m.val}</div>
                  </div>
                ))}
              </div>
              {compliance.frameworks && (
                <div className="rounded-xl p-5" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
                  <span className="text-[14px] font-medium" style={{ color: colors.ink }}>Framework Coverage</span>
                  <div className="mt-3 space-y-2">
                    {Object.entries(compliance.frameworks || {}).map(([name, status]: [string, any]) => (
                      <div key={name} className="flex items-center justify-between py-1">
                        <span className="text-[13px]" style={{ color: colors.inkMuted }}>{name}</span>
                        <span className="text-[12px] font-medium" style={{ color: status === 'COMPLIANT' ? colors.success : colors.warning }}>{String(status)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : <div className="text-[13px]" style={{ color: colors.inkTertiary }}>Loading compliance data…</div>}
        </div>
      )}

      {/* Provenance */}
      {tab === 'provenance' && (
        <div className="rounded-xl overflow-hidden" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
          <div className="px-5 py-3 border-b flex justify-between items-center" style={{ borderColor: colors.hairline }}>
            <span className="text-[14px] font-medium" style={{ color: colors.ink }}>Provenance Ledger</span>
            <span className="text-[12px]" style={{ color: colors.inkTertiary }}>{ledger.length} entries</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {ledger.length === 0 && <div className="p-8 text-center text-[13px]" style={{ color: colors.inkTertiary }}>No provenance entries yet</div>}
            {ledger.map((entry: any, i: number) => (
              <div key={i} className="px-5 py-3 border-b flex gap-3" style={{ borderColor: colors.hairline }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: colors.primary }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium" style={{ color: colors.ink }}>{entry.event_type}</span>
                    <span className="text-[11px]" style={{ color: colors.inkTertiary }}>{entry.actor_role}</span>
                  </div>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: colors.inkSubtle }}>{entry.reasoning || entry.rule_statement}</p>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: colors.inkTertiary }}>{entry.chain_hash?.slice(0, 16)}…</p>
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color: colors.inkTertiary }}>{timeAgo(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fairness */}
      {tab === 'fairness' && (
        <div className="rounded-xl overflow-hidden" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: colors.hairline }}>
            <span className="text-[14px] font-medium" style={{ color: colors.ink }}>Fairness Audit Log (AEOS P3)</span>
          </div>
          {fairnessLog.length === 0 && <div className="p-8 text-center text-[13px]" style={{ color: colors.inkTertiary }}>No fairness audits recorded yet</div>}
          {fairnessLog.map((log: any, i: number) => (
            <div key={i} className="px-5 py-3 border-b" style={{ borderColor: colors.hairline }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {log.passed ? <CheckCircle2 className="w-4 h-4" style={{ color: colors.success }} /> : <XCircle className="w-4 h-4" style={{ color: colors.error }} />}
                  <span className="text-[13px] font-medium" style={{ color: colors.ink }}>Score: {log.composite_score?.toFixed(2) || '—'}</span>
                </div>
                <span className="text-[11px]" style={{ color: colors.inkTertiary }}>{timeAgo(log.created_at)}</span>
              </div>
              {log.flagged_attributes?.length > 0 && (
                <div className="flex gap-1.5 mt-2">{log.flagged_attributes.map((a: string) => (
                  <span key={a} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(229,83,75,0.12)', color: colors.error }}>{a}</span>
                ))}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Debates */}
      {tab === 'debates' && (
        <div className="rounded-xl overflow-hidden" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: colors.hairline }}>
            <span className="text-[14px] font-medium" style={{ color: colors.ink }}>Debate Transcripts (AEOS P6)</span>
          </div>
          {debates.length === 0 && <div className="p-8 text-center text-[13px]" style={{ color: colors.inkTertiary }}>No debates recorded yet. Debates trigger on Tier-1 actions.</div>}
          {debates.map((d: any, i: number) => (
            <div key={i} className="px-5 py-4 border-b" style={{ borderColor: colors.hairline }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium" style={{ color: colors.ink }}>Exec: {d.execution_id?.slice(0, 12)}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: d.arbitrator_decision?.decision === 'PROCEED' ? 'rgba(39,166,68,0.12)' : 'rgba(229,83,75,0.12)', color: d.arbitrator_decision?.decision === 'PROCEED' ? colors.success : colors.error }}>
                  {d.arbitrator_decision?.decision || 'PENDING'}
                </span>
              </div>
              {d.arbitrator_decision?.rationale && <p className="text-[12px]" style={{ color: colors.inkSubtle }}>{d.arbitrator_decision.rationale}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrustGovernance;
