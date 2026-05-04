import React, { useEffect, useState } from 'react';
import type { BenchmarkData } from '../api/client';
import { api } from '../api/client';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

const BenchmarkNetwork = () => {
 const [data, setData] = useState<BenchmarkData | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  api.getBenchmark().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
 }, []);

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading benchmarks…</div>;
 if (!data) return <div className="p-8 text-red-600">Failed to load benchmark data.</div>;

 const metrics = [
  { label: 'KB Coverage', local: data.local_org.kb_coverage_pct, median: data.industry_median.kb_coverage_pct, top: data.top_quartile.kb_coverage_pct, unit: '%' },
  { label: 'Agent Autonomy', local: data.local_org.agent_autonomy_pct, median: data.industry_median.agent_autonomy_pct, top: data.top_quartile.agent_autonomy_pct, unit: '%' },
  { label: 'Time to Onboard', local: data.local_org.time_to_onboard_days, median: data.industry_median.time_to_onboard_days, top: data.top_quartile.time_to_onboard_days, unit: 'd', invert: true },
  { label: 'Active Skills', local: data.local_org.active_skills, median: data.industry_median.active_skills, top: data.top_quartile.active_skills, unit: '' },
 ];

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="pb-6 border-b border-[#E5E5EA]">
    <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Industry Benchmark Network</h1>
    <p className="text-gray-400 mt-1">L14 — Cross-Org Intelligence (Anonymized)</p>
   </header>

   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {metrics.map(m => {
     const isAhead = m.invert ? m.local < m.median : m.local > m.median;
     return (
      <div key={m.label} className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
       <h3 className="text-sm text-gray-400 mb-3">{m.label}</h3>
       <div className="text-3xl font-bold tracking-tight text-gray-900 mb-4">{m.local}{m.unit}</div>
       <div className="space-y-2">
        <div className="flex justify-between text-xs"><span className="text-gray-400">Industry Median</span><span className="text-gray-700">{m.median}{m.unit}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-400">Top Quartile</span><span className="text-indigo-600">{m.top}{m.unit}</span></div>
       </div>
       <div className={`mt-3 flex items-center gap-1 text-xs ${isAhead ? 'text-emerald-600' : 'text-amber-600'}`}>
        {isAhead ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isAhead ? 'Above median' : 'Below median'}
       </div>
      </div>
     );
    })}
   </div>

   <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Benchmarks</h3>
    <div className="space-y-4">
     {data.department_benchmarks.map(db => (
      <div key={db.department} className="flex items-center gap-4">
       <span className="text-sm text-gray-700 w-28">{db.department}</span>
       <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex items-center pl-2 z-10"><span className="text-xs text-gray-900 font-medium">{db.local_coverage}%</span></div>
        <div className={`h-full rounded-full ${db.status === 'LEADER' ? 'bg-emerald-500/40' : 'bg-amber-500/40'}`} style={{ width: `${db.local_coverage}%` }}></div>
        <div className="absolute top-0 h-full w-0.5 bg-gray-400/50" style={{ left: `${db.industry_median}%` }} title={`Median: ${db.industry_median}%`}></div>
       </div>
       <span className={`text-xs font-medium px-2 py-0.5 rounded ${db.status === 'LEADER' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{db.status}</span>
      </div>
     ))}
    </div>
   </div>
  </div>
 );
};

export default BenchmarkNetwork;
