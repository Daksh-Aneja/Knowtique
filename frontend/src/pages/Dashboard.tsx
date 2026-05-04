import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Zap, TrendingUp, Activity } from 'lucide-react';
import type { KBHealth } from '../api/client';
import { api } from '../api/client';

const Dashboard = () => {
 const [data, setData] = useState<KBHealth | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  api.getHealth().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
 }, []);

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading KB Health…</div>;
 if (!data) return <div className="p-8 text-red-600">Failed to load dashboard data.</div>;

 const { coverage, confidence_distribution: cd, freshness, agent_metrics: am, elicitation_metrics: em, decay_alerts } = data;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">KB Health & Intelligence Ops</h1>
     <p className="text-gray-400 mt-1">L18 Observability Dashboard — Live Data</p>
    </div>
    <div className="flex gap-4">
     <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
      <div className="text-xs text-gray-400 uppercase font-semibold">Overall KB Score</div>
      <div className="text-2xl font-bold tracking-tight text-emerald-600">{data.overall_score} / 100 <span className="text-sm text-emerald-600">▲ {data.score_trend}</span></div>
     </div>
     <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
      <div className="text-xs text-gray-400 uppercase font-semibold">Total Rules</div>
      <div className="text-2xl font-bold tracking-tight text-gray-900">{data.total_rules}</div>
     </div>
     <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
      <div className="text-xs text-gray-400 uppercase font-semibold">Active Skills</div>
      <div className="text-2xl font-bold tracking-tight text-indigo-600">{data.total_skills}</div>
     </div>
    </div>
   </header>

   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Coverage */}
    <div className="bg-white premium-shadow border border-[#E5E5EA] p-6 rounded-2xl ">
     <div className="flex items-center gap-3 mb-4">
      <CheckCircle className="text-emerald-600 w-6 h-6" />
      <h3 className="text-lg font-semibold text-gray-900">Coverage by Domain</h3>
     </div>
     <div className="space-y-4">
      {coverage.map(c => (
       <div key={c.department}>
        <div className="flex justify-between text-sm mb-1">
         <span className="text-gray-700 capitalize">{c.department}</span>
         <span className={c.coverage >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}>{Math.round(c.coverage * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full"><div className={`h-full rounded-full ${c.coverage >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.round(c.coverage * 100)}%` }}></div></div>
       </div>
      ))}
     </div>
    </div>

    {/* Confidence Distribution */}
    <div className="bg-white premium-shadow border border-[#E5E5EA] p-6 rounded-2xl ">
     <div className="flex items-center gap-3 mb-4">
      <ShieldAlert className="text-indigo-600 w-6 h-6" />
      <h3 className="text-lg font-semibold text-gray-900">Confidence Distribution</h3>
     </div>
     <div className="space-y-3">
      {[
       { label: 'Verified (0.95+)', value: cd.verified, color: 'text-emerald-600' },
       { label: 'Validated DH (0.75+)', value: cd.validated_dh, color: 'text-blue-600' },
       { label: 'Validated Peer', value: cd.validated_peer, color: 'text-blue-600' },
       { label: 'Inferred', value: cd.inferred, color: 'text-amber-600' },
       { label: 'Speculative', value: cd.speculative, color: 'text-red-600' },
      ].map(item => (
       <div key={item.label} className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{item.label}</span>
        <span className={`text-sm font-medium ${item.color}`}>{Math.round(item.value * 100)}%</span>
       </div>
      ))}
     </div>
    </div>

    {/* Decay Status */}
    <div className="bg-white premium-shadow border border-[#E5E5EA] p-6 rounded-2xl ">
     <div className="flex items-center gap-3 mb-4">
      <Clock className="text-blue-600 w-6 h-6" />
      <h3 className="text-lg font-semibold text-gray-900">Decay Status</h3>
     </div>
     <div className="space-y-3">
      <div>
       <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">Within Half-Life</span><span className="text-gray-900">{Math.round(freshness.within_half_life * 100)}%</span></div>
       <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(freshness.within_half_life * 100)}%` }}></div></div>
      </div>
      <div>
       <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">Decaying</span><span className="text-amber-600">{Math.round(freshness.decaying * 100)}%</span></div>
       <div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round(freshness.decaying * 100)}%` }}></div></div>
      </div>
      {decay_alerts.length > 0 && (
       <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
        <AlertTriangle className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">{decay_alerts.length} rules need urgent revalidation.</p>
       </div>
      )}
     </div>
    </div>

    {/* Agent Performance */}
    <div className="bg-white premium-shadow border border-[#E5E5EA] p-6 rounded-2xl ">
     <div className="flex items-center gap-3 mb-4">
      <Zap className="text-purple-400 w-6 h-6" />
      <h3 className="text-lg font-semibold text-gray-900">Agent Performance</h3>
     </div>
     <div className="space-y-3">
      {[
       { label: 'Executions (7d)', value: am.total_executions_7d.toLocaleString() },
       { label: 'Success Rate', value: `${Math.round(am.success_rate * 100)}%`, color: 'text-emerald-600' },
       { label: 'RAG Fallback', value: `${Math.round(am.rag_fallback_rate * 100)}%`, color: 'text-amber-600' },
       { label: 'Human Overrides', value: am.human_overrides.toString() },
       { label: 'Skills Used', value: am.skills_used.toString() },
       { label: 'Avg Duration', value: `${am.avg_duration_ms}ms` },
      ].map(item => (
       <div key={item.label} className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{item.label}</span>
        <span className={`text-sm font-medium ${item.color || 'text-gray-900'}`}>{item.value}</span>
       </div>
      ))}
     </div>
    </div>
   </div>

   {/* Elicitation Metrics */}
   <div className="bg-white premium-shadow border border-[#E5E5EA] p-6 rounded-2xl ">
    <div className="flex items-center gap-3 mb-4">
     <Activity className="text-blue-600 w-6 h-6" />
     <h3 className="text-lg font-semibold text-gray-900">Elicitation Health</h3>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
     <div><div className="text-2xl font-bold tracking-tight text-gray-900">{em.questions_sent_7d}</div><div className="text-xs text-gray-400 mt-1">Questions Sent (7d)</div></div>
     <div><div className="text-2xl font-bold tracking-tight text-emerald-600">{Math.round(em.response_rate * 100)}%</div><div className="text-xs text-gray-400 mt-1">Response Rate</div></div>
     <div><div className="text-2xl font-bold tracking-tight text-gray-900">{em.entries_created}</div><div className="text-xs text-gray-400 mt-1">KB Entries Created</div></div>
     <div><div className="text-2xl font-bold tracking-tight text-blue-600">{em.avg_time_to_answer_hours}h</div><div className="text-xs text-gray-400 mt-1">Avg Time-to-Answer</div></div>
    </div>
   </div>
  </div>
 );
};

export default Dashboard;
