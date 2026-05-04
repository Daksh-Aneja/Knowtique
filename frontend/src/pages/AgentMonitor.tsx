import React, { useEffect, useState } from 'react';
import type { SkillItem, ExecutionItem } from '../api/client';
import { api } from '../api/client';
import { Bot, CheckCircle, XCircle, Clock, AlertTriangle, Zap, ArrowRight, Activity } from 'lucide-react';

export default function AgentMonitor() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [allExecs, setAllExecs] = useState<ExecutionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSkills(),
      ...['handle_refund_request', 'enterprise_discount_approval', 'incident_escalation_p1',
        'vendor_payment_approval', 'new_hire_onboarding_trigger', 'sales_deal_qualification'
      ].map((s) => api.getExecutions(s).catch(() => []))
    ]).then(([reg, ...execArrays]) => {
      setSkills(reg.skills);
      const flat = execArrays.flat() as ExecutionItem[];
      flat.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      setAllExecs(flat);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading Agent Monitor…</div>;

  const successCount = allExecs.filter((e) => e.status.includes('SUCCESS')).length;
  const overrideCount = allExecs.filter((e) => e.outcome_type === 'HUMAN_OVERRIDDEN').length;
  const failCount = allExecs.filter((e) => e.status.includes('FAILED')).length;
  const hitlCount = allExecs.filter((e) => e.hitl_required).length;

  const statusIcon = (status: string) => {
    if (status.includes('SUCCESS')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (status === 'HUMAN_OVERRIDDEN') return <Clock className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const statusStyle = (status: string) => {
    if (status.includes('SUCCESS')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'HUMAN_OVERRIDDEN') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const STATES = [
    { name: 'IDLE', desc: 'Awaiting task', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    { name: 'ROUTING', desc: 'Skill Router: exact → fuzzy → RAG', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { name: 'PRE_CHECK', desc: 'Guardrails + Compliance (L13)', color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
    { name: 'EXECUTING', desc: 'Sandbox execution with MCP tools', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    { name: 'POST_CHECK', desc: 'Audit verification + provenance write', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    { name: 'REPORTING', desc: 'L10 feedback bus → confidence update', color: 'bg-sky-100 text-sky-600 border-sky-200' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-indigo-600" />
            Agent Monitor
          </h1>
          <p className="text-gray-500 mt-2">L9 Runtime — Real-time agent execution tracking & HITL oversight</p>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white premium-shadow border border-[#E5E5EA] p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Successful</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-gray-900">{successCount}</div>
        </div>
        <div className="bg-white premium-shadow border border-[#E5E5EA] p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Overrides</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-gray-900">{overrideCount}</div>
        </div>
        <div className="bg-white premium-shadow border border-[#E5E5EA] p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg"><XCircle className="w-5 h-5 text-red-600" /></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Failed</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-gray-900">{failCount}</div>
        </div>
        <div className="bg-white premium-shadow border border-[#E5E5EA] p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Zap className="w-5 h-5 text-purple-600" /></div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Skills</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-gray-900">{skills.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Execution Feed — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Execution Feed</h2>
            <span className="text-xs text-gray-400 ml-auto">{allExecs.length} total</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {allExecs.slice(0, 30).map((e) => (
              <div key={e.id} className="px-6 py-3.5 hover:bg-gray-50/50 transition-colors flex items-center gap-3">
                {statusIcon(e.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{e.task_intent}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>{new Date(e.started_at).toLocaleString()}</span>
                    <span className="font-mono">{e.duration_ms}ms</span>
                    {e.hitl_required && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertTriangle className="w-3 h-3" /> HITL
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyle(e.status)}`}>
                  {e.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent State Machine — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Agent State Machine (L9)</h2>
            <div className="space-y-3">
              {STATES.map((state, i) => (
                <div key={state.name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${state.color}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{state.name}</div>
                    <div className="text-xs text-gray-500">{state.desc}</div>
                  </div>
                  {i < STATES.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300" />}
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning Chain Sample */}
          {allExecs[0]?.reasoning_chain?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 premium-shadow p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Latest Reasoning Chain</h2>
              <div className="space-y-2">
                {allExecs[0].reasoning_chain.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-bold text-indigo-600 font-mono w-12">Step {step.step}</span>
                    <span className="text-gray-700 flex-1">{step.action}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">{step.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
