import React, { useEffect, useState } from 'react';
import type { ComplianceDashboard as CDType } from '../api/client';
import { api } from '../api/client';
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const ComplianceDashboard = () => {
 const [data, setData] = useState<CDType | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  api.getCompliance().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
 }, []);

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading compliance…</div>;
 if (!data) return <div className="p-8 text-red-600">Failed to load compliance data.</div>;

 const statusIcon = (s: string) => s === 'COMPLIANT' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : s === 'REVIEW' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <XCircle className="w-5 h-5 text-gray-400" />;
 const statusColor = (s: string) => s === 'COMPLIANT' ? 'border-emerald-100' : s === 'REVIEW' ? 'border-amber-100' : 'border-[#E5E5EA]';

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Compliance Engine</h1>
     <p className="text-gray-400 mt-1">Regulatory Policy Enforcement</p>
    </div>
    <div className="flex gap-3">
     <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
      <div className="text-xs text-gray-400 uppercase font-semibold">Tagged Rules</div>
      <div className="text-xl font-bold text-gray-900">{data.total_tagged_rules}</div>
     </div>
     <div className="bg-amber-100 border border-amber-100 px-4 py-2 rounded-xl">
      <div className="text-xs text-amber-600 uppercase font-semibold">Untagged</div>
      <div className="text-xl font-bold text-amber-600">{data.untagged_rules}</div>
     </div>
    </div>
   </header>

   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {data.frameworks.map(fw => (
     <div key={fw.framework} className={`bg-white premium-shadow border rounded-2xl p-6 ${statusColor(fw.status)}`}>
      <div className="flex items-center justify-between mb-4">
       <div className="flex items-center gap-3">
        {statusIcon(fw.status)}
        <h3 className="text-lg font-semibold text-gray-900">{fw.framework}</h3>
       </div>
       <span className={`px-2 py-0.5 rounded text-xs font-medium ${fw.status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-600' : fw.status === 'REVIEW' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>{fw.status.replace('_', ' ')}</span>
      </div>
      <div className="space-y-3">
       <div>
        <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Coverage</span><span className="text-gray-900">{Math.round(fw.coverage_pct * 100)}%</span></div>
        <div className="h-2 bg-gray-100 rounded-full"><div className={`h-full rounded-full ${fw.coverage_pct >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, Math.round(fw.coverage_pct * 100))}%` }}></div></div>
       </div>
       <div className="flex justify-between text-sm"><span className="text-gray-400">Violations</span><span className={fw.violations > 0 ? 'text-red-600' : 'text-emerald-600'}>{fw.violations} {fw.violations === 0 ? '✓' : 'blockers'}</span></div>
       <div className="flex justify-between text-sm"><span className="text-gray-400">Last Audit</span><span className="text-gray-700">{fw.last_audit || 'N/A'}</span></div>
      </div>
     </div>
    ))}
   </div>
  </div>
 );
};

export default ComplianceDashboard;
