import React, { useEffect, useState } from 'react';
import type { SkillItem, ExecutionItem } from '../api/client';
import { api } from '../api/client';
import { BrainCircuit, Search, Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Zap } from 'lucide-react';

export default function SkillsRegistry() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [totalExec, setTotalExec] = useState(0);
  const [avgSr, setAvgSr] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [execs, setExecs] = useState<ExecutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getSkills().then((r) => {
      setSkills(r.skills);
      setTotalExec(r.total_executions);
      setAvgSr(r.avg_success_rate);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      api.getExecutions(selected).then(setExecs);
    }
  }, [selected]);

  const filteredSkills = skills.filter(s =>
    s.skill_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading Skills…</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-purple-600" />
            Skills Registry
          </h1>
          <p className="text-gray-500 mt-2">L8 Compiler — {skills.length} compiled skills · {totalExec.toLocaleString()} total executions · {(avgSr * 100).toFixed(1)}% avg success</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64 bg-white"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSkills.map((s) => (
          <div
            key={s.id}
            className={`bg-white rounded-2xl border premium-shadow transition-all ${
              selected === s.skill_id ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-100'
            }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{s.skill_id.replace(/_/g, ' ')}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{s.department} · v{s.version}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
                  s.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>{s.status}</span>
              </div>

              {/* Confidence Gauge */}
              <div className="flex items-center gap-4 mb-5">
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#E5E5EA" strokeWidth="4" />
                  <circle
                    cx="28" cy="28" r="24" fill="none"
                    stroke={s.confidence >= 0.9 ? '#10B981' : s.confidence >= 0.8 ? '#6366F1' : '#F59E0B'}
                    strokeWidth="4"
                    strokeDasharray={`${s.confidence * 150.8} 150.8`}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                  />
                  <text x="28" y="32" textAnchor="middle" fill="#1d1d1f" fontSize="13" fontWeight="700">
                    {(s.confidence * 100).toFixed(0)}
                  </text>
                </svg>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Confidence</div>
                  <div className="text-sm text-gray-700 font-medium">{s.confidence_tier?.replace(/_/g, ' ')}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 bg-gray-50 rounded-xl p-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Executions</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">{s.execution_count.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Success</div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">{(s.success_rate * 100).toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Half-Life</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">{s.half_life_days}d</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Tools</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">{s.mcp_tool_bindings?.length || 0}</div>
                </div>
              </div>

              {/* Compliance Tags */}
              {s.compliance_tags?.length > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {s.compliance_tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded border border-blue-200">{t}</span>
                  ))}
                </div>
              )}

              {/* Expand Toggle */}
              <button
                onClick={() => setSelected(selected === s.skill_id ? null : s.skill_id)}
                className="mt-4 w-full text-center text-xs text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1 transition-colors"
              >
                {selected === s.skill_id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {selected === s.skill_id ? 'Collapse' : 'View Details'}
              </button>
            </div>

            {/* Expanded Detail */}
            {selected === s.skill_id && (
              <div className="border-t border-gray-100 p-6 bg-gray-50/50 space-y-5">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" /> MCP Tool Bindings
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {s.mcp_tool_bindings?.map((t) => (
                      <span key={t} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-indigo-600">{t}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-600" /> Recent Executions
                  </h4>
                  <div className="space-y-2">
                    {execs.slice(0, 5).map((e) => (
                      <div key={e.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                        {e.status.includes('SUCCESS')
                          ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          : e.status === 'HUMAN_OVERRIDDEN'
                          ? <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <span className="text-sm text-gray-700 flex-1 truncate">{e.task_intent}</span>
                        <span className="text-xs text-gray-400 font-mono">{e.duration_ms}ms</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          e.status.includes('SUCCESS') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{e.status.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                    {execs.length === 0 && (
                      <div className="text-xs text-gray-400 text-center py-4">No executions recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
