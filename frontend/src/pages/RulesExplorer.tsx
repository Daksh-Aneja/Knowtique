import React, { useEffect, useState } from 'react';
import type { RuleItem } from '../api/client';
import { api } from '../api/client';
import { BookOpen, Search, ChevronDown, ChevronRight, Shield, Clock, CheckCircle } from 'lucide-react';

const TIER_STYLE: Record<string, string> = {
  SPECULATIVE: 'bg-red-100 text-red-700 border-red-200',
  INFERRED: 'bg-amber-100 text-amber-700 border-amber-200',
  VALIDATED_PEER: 'bg-blue-100 text-blue-700 border-blue-200',
  VALIDATED_MANAGER: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  VALIDATED_DH: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  VERIFIED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const DOMAINS = ['all', 'support', 'sales', 'engineering', 'finance', 'hr'];

export default function RulesExplorer() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [domain, setDomain] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = domain === 'all' ? {} : { domain };
    api.getRules(params).then((r) => { setRules(r.rules); setTotal(r.total); setLoading(false); });
  }, [domain]);

  const filteredRules = rules.filter(r =>
    r.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading Rules…</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Rules Explorer
          </h1>
          <p className="text-gray-500 mt-2">Knowledge Polystore — {total} rules across {DOMAINS.length - 1} domains</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 bg-white"
          />
        </div>
      </header>

      {/* Domain Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {DOMAINS.map((d) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
              domain === d
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8"></th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rule Statement</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Executable</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRules.map((r) => (
                <React.Fragment key={r.id}>
                  <tr
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-gray-400">
                      {expanded === r.id
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4 group-hover:text-gray-600" />}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{r.statement}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{r.domain}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold font-mono text-gray-900">{r.confidence_scalar.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${TIER_STYLE[r.confidence_tier] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {r.confidence_tier?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.is_executable
                        ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                        : <span className="text-xs text-gray-400">No</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {r.compliance_tags?.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded border border-blue-200">{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-indigo-600" /> Confidence Vector (L6)
                            </h3>
                            <div className="space-y-3">
                              {r.confidence_vector && Object.entries(r.confidence_vector).map(([dim, val]) => (
                                <div key={dim} className="flex items-center gap-3">
                                  <span className="w-36 text-xs text-gray-500 capitalize">{dim.replace(/_/g, ' ')}</span>
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(val as number) * 100}%` }} />
                                  </div>
                                  <span className="text-xs font-mono text-gray-700 w-10 text-right">{(val as number).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" /> Metadata
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between"><span>Half-Life</span><span className="font-medium text-gray-900">{r.half_life_days} days</span></div>
                              <div className="flex justify-between"><span>Created</span><span className="font-medium text-gray-900">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</span></div>
                              <div className="flex justify-between"><span>Validated</span><span className="font-medium text-gray-900">{r.validated_at ? new Date(r.validated_at).toLocaleDateString() : 'Pending'}</span></div>
                              <div className="flex justify-between"><span>Compliance</span><span className="font-medium text-gray-900">{r.compliance_tags?.join(', ') || 'None'}</span></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
