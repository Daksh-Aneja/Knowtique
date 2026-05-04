import React, { useEffect, useState } from 'react';
import type { SecurityLog } from '../api/client';
import { api } from '../api/client';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const SecurityFabric = () => {
 const [logs, setLogs] = useState<SecurityLog[]>([]);
 const [stats, setStats] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  api.getSecurityLog().then(d => { setLogs(d.logs); setStats(d.stats); setLoading(false); }).catch(() => setLoading(false));
 }, []);

 const resultIcon = (r: string) => r === 'ALLOWED' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : r === 'BLOCKED' ? <XCircle className="w-4 h-4 text-red-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />;
 const eventColor = (t: string) => {
  if (t === 'AUTH_FAILURE') return 'bg-red-100 text-red-600 border-red-200';
  if (t === 'AGENT_EXEC') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (t === 'MODIFICATION') return 'bg-amber-100 text-amber-600 border-amber-200';
  if (t === 'EXPORT') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  return 'bg-gray-100 text-gray-400 border-[#E5E5EA]';
 };

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading security data…</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Security Fabric</h1>
     <p className="text-gray-400 mt-1">Zero-Trust Access Control & Audit Trail</p>
    </div>
    {stats && (
     <div className="flex gap-3">
      <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
       <div className="text-xs text-gray-400 uppercase">Total Events</div>
       <div className="text-xl font-bold text-gray-900">{stats.total_events}</div>
      </div>
      <div className="bg-emerald-100 border border-emerald-100 px-4 py-2 rounded-xl">
       <div className="text-xs text-emerald-600 uppercase">Allowed</div>
       <div className="text-xl font-bold text-emerald-600">{stats.allowed}</div>
      </div>
      <div className="bg-red-100 border border-red-100 px-4 py-2 rounded-xl">
       <div className="text-xs text-red-600 uppercase">Blocked</div>
       <div className="text-xl font-bold text-red-600">{stats.blocked}</div>
      </div>
     </div>
    )}
   </header>

   <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl overflow-hidden">
    <div className="grid grid-cols-[140px_100px_120px_80px_80px_80px_1fr_140px] gap-3 px-5 py-3 bg-gray-50 text-xs text-gray-400 uppercase font-semibold border-b border-[#E5E5EA]">
     <span>Event Type</span><span>Result</span><span>Actor</span><span>Resource</span><span>Action</span><span>IP</span><span>Details</span><span>Time</span>
    </div>
    {logs.map(l => (
     <div key={l.id} className="grid grid-cols-[140px_100px_120px_80px_80px_80px_1fr_140px] gap-3 px-5 py-3 border-b border-[#E5E5EA]/50 hover:bg-gray-100/30 transition-colors items-center text-sm">
      <span className={`px-2 py-0.5 rounded text-xs font-medium border w-fit ${eventColor(l.event_type)}`}>{l.event_type}</span>
      <span className="flex items-center gap-1">{resultIcon(l.result)}<span className="text-xs">{l.result}</span></span>
      <span className="text-gray-700 text-xs">{l.actor_role}</span>
      <span className="text-gray-400 text-xs">{l.resource_type}</span>
      <span className="text-gray-400 text-xs">{l.action}</span>
      <span className="text-gray-600 text-xs font-mono">{l.ip_address}</span>
      <span className="text-gray-400 text-xs truncate">{JSON.stringify(l.details).slice(0, 60)}</span>
      <span className="text-gray-400 text-xs">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</span>
     </div>
    ))}
   </div>
  </div>
 );
};

export default SecurityFabric;
