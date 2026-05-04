import React, { useEffect, useState } from 'react';
import type { RedTeamScan } from '../api/client';
import { api } from '../api/client';
import { Shield, AlertTriangle, CheckCircle, XCircle, Play } from 'lucide-react';

const RedTeamDashboard = () => {
 const [scans, setScans] = useState<RedTeamScan[]>([]);
 const [summary, setSummary] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [scanning, setScanning] = useState<string | null>(null);

 const load = () => {
  api.getRecentScans().then(d => { setScans(d.scans); setSummary(d.summary); setLoading(false); }).catch(() => setLoading(false));
 };
 useEffect(load, []);

 const handleScan = async (skillId: string) => {
  setScanning(skillId);
  await api.runScan(skillId);
  setScanning(null);
  load();
 };

 const statusIcon = (s: string) => s === 'PASSED' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : s === 'WARNING' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <XCircle className="w-4 h-4 text-red-600" />;
 const statusBorder = (s: string) => s === 'PASSED' ? 'border-emerald-200' : s === 'WARNING' ? 'border-amber-200' : 'border-red-200';

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading red team scans…</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Red Team Harness</h1>
     <p className="text-gray-400 mt-1">Adversarial Testing & KB Vulnerability Scanner</p>
    </div>
    {summary && (
     <div className="flex gap-3">
      <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
       <div className="text-xs text-gray-400 uppercase">Skills Scanned</div>
       <div className="text-xl font-bold text-gray-900">{summary.total_skills_scanned}</div>
      </div>
      <div className={`px-4 py-2 rounded-xl border ${summary.total_vulnerabilities > 0 ? 'bg-red-100 border-red-100' : 'bg-emerald-100 border-emerald-100'}`}>
       <div className={`text-xs uppercase ${summary.total_vulnerabilities > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Vulnerabilities</div>
       <div className={`text-xl font-bold ${summary.total_vulnerabilities > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{summary.total_vulnerabilities}</div>
      </div>
     </div>
    )}
   </header>

   <div className="space-y-4">
    {scans.map(scan => (
     <div key={scan.skill_id} className={`bg-white premium-shadow border rounded-2xl p-5 ${statusBorder(scan.status)}`}>
      <div className="flex items-center justify-between mb-3">
       <div className="flex items-center gap-3">
        {statusIcon(scan.status)}
        <div>
         <h3 className="text-gray-900 font-semibold">{scan.skill_id}</h3>
         <span className="text-xs text-gray-400">{scan.department} · {scan.scan_count} tests · Last: {scan.last_scan ? new Date(scan.last_scan).toLocaleString() : 'Never'}</span>
        </div>
       </div>
       <div className="flex items-center gap-3">
        {scan.vulnerabilities > 0 && <span className="text-xs text-red-600 bg-red-100 border border-red-100 px-2 py-0.5 rounded">{scan.vulnerabilities} vulns</span>}
        <button onClick={() => handleScan(scan.skill_id)} disabled={scanning === scan.skill_id}
         className="px-3 py-1.5 bg-indigo-500/20 text-indigo-600 rounded-xl text-xs font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
        ><Play className="w-3 h-3" />{scanning === scan.skill_id ? 'Scanning…' : 'Re-scan'}</button>
       </div>
      </div>
      <div className="flex flex-wrap gap-2">
       {scan.details.map((d, i) => (
        <div key={i} className={`px-3 py-1.5 rounded-xl text-xs border ${d.status === 'PASSED' ? 'bg-emerald-500/5 border-emerald-200 text-emerald-600' : d.status === 'WARNING' ? 'bg-amber-500/5 border-amber-200 text-amber-600' : 'bg-red-500/5 border-red-200 text-red-600'}`}>
         {d.scan_type} · {d.status} {d.vulnerabilities > 0 && `(${d.vulnerabilities})`}
        </div>
       ))}
      </div>
     </div>
    ))}
   </div>
  </div>
 );
};

export default RedTeamDashboard;
