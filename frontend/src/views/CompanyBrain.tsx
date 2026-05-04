import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Network, MessageSquareText, ChevronDown, ChevronRight, Shield, Clock, ArrowUpRight, FileText, Users, Layers } from 'lucide-react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const CompanyBrain: React.FC = () => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'rules' | 'topology' | 'elicitation'>('rules');
  const [rules, setRules] = useState<any[]>([]);
  const [graph, setGraph] = useState<any>(null);
  const [elicitation, setElicitation] = useState<any>(null);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [r, g, e] = await Promise.allSettled([
        api.getRules?.() || api.globalSearch(''),
        api.getTopology(),
        api.getElicitationDashboard(),
      ]);
      if (r.status === 'fulfilled') setRules(r.value?.rules || []);
      if (g.status === 'fulfilled') setGraph(g.value);
      if (e.status === 'fulfilled') setElicitation(e.value);
      setLoading(false);
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    const res = await api.globalSearch(searchQ);
    setRules(res?.results?.rules || res?.rules || []);
  };

  const filteredRules = domainFilter === 'all' ? rules : rules.filter((r: any) => r.domain === domainFilter);
  const domains = [...new Set(rules.map((r: any) => r.domain).filter(Boolean))];

  const confColor = (c: number) => {
    if (c >= 0.85) return colors.success;
    if (c >= 0.6) return colors.info;
    if (c >= 0.4) return colors.warning;
    return colors.error;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight" style={{ letterSpacing: '-0.6px', color: colors.ink }}>Company Brain</h1>
        <p className="text-[13px] mt-0.5" style={{ color: colors.inkSubtle }}>Knowledge rules, topology graph, and active elicitation</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.inkTertiary }} />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search rules, skills, knowledge…" className="w-full pl-11 pr-4 py-2.5 rounded-lg text-[13px] outline-none transition-all"
          style={{ background: colors.surface1, border: `1px solid ${colors.hairline}`, color: colors.ink }}
          onFocus={e => (e.target.style.borderColor = colors.primary)} onBlur={e => (e.target.style.borderColor = colors.hairline)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
        {([['rules', 'Rules', BookOpen], ['topology', 'Topology', Network], ['elicitation', 'Elicitation', MessageSquareText]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as any)} className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all"
            style={{ background: tab === id ? colors.primary : 'transparent', color: tab === id ? '#fff' : colors.inkSubtle }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-4">
          {/* Domain Filter */}
          {domains.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setDomainFilter('all')} className="px-3 py-1 rounded-full text-[12px] font-medium transition-all"
                style={{ background: domainFilter === 'all' ? colors.primary : colors.surface2, color: domainFilter === 'all' ? '#fff' : colors.inkSubtle, border: `1px solid ${colors.hairline}` }}>All</button>
              {domains.map(d => (
                <button key={d} onClick={() => setDomainFilter(d)} className="px-3 py-1 rounded-full text-[12px] font-medium transition-all capitalize"
                  style={{ background: domainFilter === d ? colors.primary : colors.surface2, color: domainFilter === d ? '#fff' : colors.inkSubtle, border: `1px solid ${colors.hairline}` }}>{d}</button>
              ))}
            </div>
          )}

          {/* Rules List */}
          {filteredRules.length === 0 && !loading && (
            <div className="rounded-xl p-12 text-center" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: colors.inkTertiary }} />
              <p className="text-[14px]" style={{ color: colors.inkSubtle }}>No rules found</p>
            </div>
          )}
          {filteredRules.map((rule: any, i: number) => (
            <div key={rule.id || i} className="rounded-xl p-4 transition-all" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[13px] font-medium" style={{ color: colors.ink }}>{rule.statement}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] capitalize px-2 py-0.5 rounded-full" style={{ background: colors.surface2, color: colors.inkSubtle }}>{rule.domain || 'general'}</span>
                    <span className="text-[11px]" style={{ color: colors.inkTertiary }}>{rule.confidence_tier || 'INFERRED'}</span>
                    {rule.source_type && <span className="text-[11px]" style={{ color: colors.inkTertiary }}>via {rule.source_type}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center" style={{ background: `${confColor(rule.confidence_scalar || 0)}15` }}>
                    <span className="text-[14px] font-bold" style={{ color: confColor(rule.confidence_scalar || 0) }}>{Math.round((rule.confidence_scalar || 0) * 100)}</span>
                    <span className="text-[8px]" style={{ color: colors.inkTertiary }}>conf</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topology Tab */}
      {tab === 'topology' && (
        <div className="rounded-xl p-6" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5" style={{ color: colors.primary }} />
            <span className="text-[16px] font-medium" style={{ color: colors.ink }}>Knowledge Graph</span>
          </div>
          {graph ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-4" style={{ background: colors.surface2, border: `1px solid ${colors.hairline}` }}>
                  <span className="text-[24px] font-bold" style={{ color: colors.ink }}>{graph.nodes?.length || 0}</span>
                  <p className="text-[12px]" style={{ color: colors.inkSubtle }}>Nodes (Rules + Workflows)</p>
                </div>
                <div className="rounded-lg p-4" style={{ background: colors.surface2, border: `1px solid ${colors.hairline}` }}>
                  <span className="text-[24px] font-bold" style={{ color: colors.ink }}>{graph.edges?.length || 0}</span>
                  <p className="text-[12px]" style={{ color: colors.inkSubtle }}>Edges (Relationships)</p>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {(graph.nodes || []).slice(0, 30).map((n: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: i % 2 === 0 ? 'transparent' : colors.surface2 }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: n.group === 'workflow' ? colors.primary : colors.info }} />
                    <span className="text-[12px] flex-1" style={{ color: colors.ink }}>{n.label}</span>
                    <span className="text-[11px]" style={{ color: colors.inkTertiary }}>{n.group}</span>
                    {n.confidence != null && <span className="text-[11px] font-medium" style={{ color: confColor(n.confidence) }}>{Math.round(n.confidence * 100)}%</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-[13px]" style={{ color: colors.inkTertiary }}>Loading topology…</div>}
        </div>
      )}

      {/* Elicitation Tab */}
      {tab === 'elicitation' && (
        <div className="space-y-4">
          {/* Stats */}
          {elicitation?.stats && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Questions', val: elicitation.stats.total_questions },
                { label: 'Response Rate', val: `${Math.round((elicitation.stats.response_rate || 0) * 100)}%` },
                { label: 'Answered', val: elicitation.stats.total_answered },
                { label: 'Avg Quality', val: `${Math.round((elicitation.stats.avg_quality_score || 0) * 100)}%` },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
                  <span className="text-[22px] font-bold" style={{ color: colors.ink }}>{s.val}</span>
                  <p className="text-[11px] mt-1" style={{ color: colors.inkSubtle }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pending Questions */}
          <div className="rounded-xl overflow-hidden" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: colors.hairline }}>
              <span className="text-[14px] font-medium" style={{ color: colors.ink }}>Pending Questions</span>
            </div>
            {(elicitation?.pending_questions || []).length === 0 && (
              <div className="p-8 text-center text-[13px]" style={{ color: colors.inkTertiary }}>No pending questions</div>
            )}
            {(elicitation?.pending_questions || []).map((q: any, i: number) => (
              <div key={q.id || i} className="px-5 py-3 border-b flex gap-3" style={{ borderColor: colors.hairline }}>
                <Users className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                <div className="flex-1">
                  <p className="text-[13px]" style={{ color: colors.ink }}>{q.question_text}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[11px]" style={{ color: colors.inkSubtle }}>{q.employee_name}</span>
                    <span className="text-[11px]" style={{ color: colors.inkTertiary }}>{q.department}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBrain;
