import React, { useEffect, useState } from 'react';
import type { ConflictItem } from '../api/client';
import { api } from '../api/client';
import { Swords, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ConflictArena = () => {
 const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
 const [openCount, setOpenCount] = useState(0);
 const [loading, setLoading] = useState(true);

 const load = () => {
  api.getConflicts().then(d => { setConflicts(d.conflicts); setOpenCount(d.open_count); setLoading(false); }).catch(() => setLoading(false));
 };
 useEffect(load, []);

 const handleResolve = async (id: string, type: string) => {
  await api.resolveConflict(id, type, `Resolved via ${type}`);
  load();
 };

 const sevColor = (s: string) => s === 'CRITICAL' ? 'text-red-600 bg-red-100 border-red-100' : s === 'MODERATE' ? 'text-amber-600 bg-amber-100 border-amber-100' : 'text-blue-600 bg-blue-100 border-blue-100';
 const statusIcon = (s: string) => s === 'RESOLVED' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : s === 'IN_REVIEW' ? <Clock className="w-4 h-4 text-amber-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />;

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading conflicts…</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Conflict Resolution Arena</h1>
     <p className="text-gray-400 mt-1">L16 — Structured Async Debate & Resolution</p>
    </div>
    <div className="bg-red-100 border border-red-100 px-4 py-2 rounded-xl">
     <div className="text-xs text-red-600 uppercase font-semibold">Open Conflicts</div>
     <div className="text-2xl font-bold tracking-tight text-red-600">{openCount}</div>
    </div>
   </header>

   <div className="space-y-6">
    {conflicts.map(c => (
     <div key={c.id} className={`bg-white premium-shadow border rounded-2xl p-6 ${c.status === 'RESOLVED' ? 'border-emerald-200 opacity-70' : 'border-[#E5E5EA]'}`}>
      <div className="flex items-center justify-between mb-4">
       <div className="flex items-center gap-3">
        {statusIcon(c.status)}
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${sevColor(c.severity)}`}>{c.severity}</span>
        <span className="text-xs text-gray-400">{c.conflict_type.replace(/_/g, ' ')}</span>
       </div>
       <div className="flex items-center gap-3 text-xs text-gray-400">
        {c.assigned_to && <span>Assigned: <span className="text-gray-900">{c.assigned_to}</span></span>}
        {c.deadline && <span>Deadline: {new Date(c.deadline).toLocaleDateString()}</span>}
       </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
       {c.rule_a && (
        <div className="bg-gray-50 border border-[#E5E5EA] rounded-xl p-4">
         <div className="text-xs text-gray-400 uppercase mb-1">Rule A — {c.rule_a.domain}</div>
         <p className="text-sm text-gray-800 mb-2">{c.rule_a.statement}</p>
         <div className="flex gap-4 text-xs text-gray-400">
          <span>Confidence: <span className="text-gray-900">{c.rule_a.confidence.toFixed(2)}</span></span>
          <span>Sources: {c.rule_a.sources}</span>
         </div>
        </div>
       )}
       {c.rule_b && (
        <div className="bg-gray-50 border border-[#E5E5EA] rounded-xl p-4">
         <div className="text-xs text-gray-400 uppercase mb-1">Rule B — {c.rule_b.domain}</div>
         <p className="text-sm text-gray-800 mb-2">{c.rule_b.statement}</p>
         <div className="flex gap-4 text-xs text-gray-400">
          <span>Confidence: <span className="text-gray-900">{c.rule_b.confidence.toFixed(2)}</span></span>
          <span>Sources: {c.rule_b.sources}</span>
         </div>
        </div>
       )}
      </div>

      {c.status === 'RESOLVED' ? (
       <div className="bg-emerald-100 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
        ✅ Resolved: {c.resolution_type?.replace(/_/g, ' ')} — {c.resolution_note}
       </div>
      ) : (
       <div className="flex gap-2 pt-3 border-t border-[#E5E5EA]">
        {['CHOOSE_A', 'CHOOSE_B', 'MERGE', 'SUPERSEDE'].map(rt => (
         <button key={rt} onClick={() => handleResolve(c.id, rt)}
          className="px-3 py-1.5 bg-gray-100 border border-[#E5E5EA] rounded-xl text-xs text-gray-700 hover:bg-indigo-500/20 hover:text-indigo-600 hover:border-indigo-500/40 transition-colors"
         >{rt.replace(/_/g, ' ')}</button>
        ))}
       </div>
      )}
     </div>
    ))}
   </div>
  </div>
 );
};

export default ConflictArena;
