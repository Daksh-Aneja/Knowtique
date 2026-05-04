import React, { useEffect, useState } from 'react';
import type { ProvenanceEntry } from '../api/client';
import { api } from '../api/client';
import { Link2, Hash, Shield } from 'lucide-react';

const ProvenanceLedger = () => {
 const [ledger, setLedger] = useState<ProvenanceEntry[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  api.getGlobalLedger().then(d => { setLedger(d.ledger); setLoading(false); }).catch(() => setLoading(false));
 }, []);

 const eventColor = (t: string) => {
  if (t === 'CREATED') return 'bg-blue-500/20 text-blue-600 border-blue-100';
  if (t === 'VALIDATED') return 'bg-emerald-500/20 text-emerald-600 border-emerald-100';
  if (t === 'DECAYED') return 'bg-amber-500/20 text-amber-600 border-amber-100';
  return 'bg-gray-100 text-gray-400 border-[#E5E5EA]';
 };

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading provenance ledger…</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="pb-6 border-b border-[#E5E5EA]">
    <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Provenance Ledger</h1>
    <p className="text-gray-400 mt-1">Immutable, Tamper-Evident Knowledge Lineage</p>
   </header>
   <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl overflow-hidden">
    <div className="grid grid-cols-[120px_1fr_120px_80px_1fr_200px] gap-4 px-6 py-3 bg-gray-50 text-xs text-gray-400 uppercase font-semibold border-b border-[#E5E5EA]">
     <span>Event</span><span>Rule</span><span>Actor</span><span>Conf.</span><span>Reasoning</span><span>Chain Hash</span>
    </div>
    {ledger.map((e, i) => (
     <div key={e.id || i} className="grid grid-cols-[120px_1fr_120px_80px_1fr_200px] gap-4 px-6 py-4 border-b border-[#E5E5EA]/50 hover:bg-gray-100/30 transition-colors items-center">
      <span className={`px-2 py-0.5 rounded text-xs font-medium border inline-block w-fit ${eventColor(e.event_type)}`}>{e.event_type}</span>
      <span className="text-sm text-gray-700 truncate">{e.rule_statement || '—'}</span>
      <span className="text-xs text-gray-400">{e.actor_role}</span>
      <span className="text-sm text-gray-900 font-mono">{e.confidence_at?.toFixed(2)}</span>
      <span className="text-xs text-gray-400 truncate">{e.reasoning}</span>
      <span className="text-xs text-gray-600 font-mono truncate flex items-center gap-1"><Hash className="w-3 h-3" />{e.chain_hash?.slice(0, 16)}…</span>
     </div>
    ))}
   </div>
  </div>
 );
};

export default ProvenanceLedger;
