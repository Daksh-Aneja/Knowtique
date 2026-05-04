import React, { useEffect, useState } from 'react';
import type { Signal, CandidateRule } from '../api/client';
import { api } from '../api/client';
import { FileSearch, Beaker, AlertTriangle, ShieldCheck } from 'lucide-react';

const ExtractionHub = () => {
 const [signals, setSignals] = useState<Signal[]>([]);
 const [candidates, setCandidates] = useState<CandidateRule[]>([]);
 const [loading, setLoading] = useState(true);
 const [tab, setTab] = useState<'signals' | 'candidates'>('signals');

 useEffect(() => {
  Promise.all([api.getSignals(), api.getCandidates()])
   .then(([s, c]) => { setSignals(s.signals); setCandidates(c.candidates); setLoading(false); })
   .catch(() => setLoading(false));
 }, []);

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading extraction data…</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="pb-6 border-b border-[#E5E5EA]">
    <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Candidate Broker</h1>
    <p className="text-gray-400 mt-1">Knowledge Extraction & Rule Mining</p>
   </header>

   <div className="flex gap-2 mb-4">
    {(['signals', 'candidates'] as const).map(t => (
     <button key={t} onClick={() => setTab(t)}
      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${tab === t ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/40' : 'bg-gray-100 text-gray-400 border border-[#E5E5EA]'}`}
     >{t} ({t === 'signals' ? signals.length : candidates.length})</button>
    ))}
   </div>

   {tab === 'signals' && (
    <div className="space-y-3">
     {signals.length === 0 ? (
      <div className="text-gray-400 text-center py-12">No signals ingested yet. Connect enterprise apps to start harvesting.</div>
     ) : signals.map(s => (
      <div key={s.id} className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-4">
       <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
         <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded border border-blue-200">{s.source_type}</span>
         <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded">{s.domain}</span>
         {s.pii_present && (
           <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-200 flex items-center gap-1">
             <ShieldCheck className="w-3 h-3" /> PII Scrubbed (L17)
           </span>
         )}
        </div>
        <span className="text-xs text-gray-400">Authority: {s.authority_score.toFixed(2)}</span>
       </div>
       <p className="text-sm text-gray-700">{s.clean_payload}</p>
      </div>
     ))}
    </div>
   )}

   {tab === 'candidates' && (
    <div className="space-y-3">
     {candidates.length === 0 ? (
      <div className="text-gray-400 text-center py-12">No candidate rules mined yet. Minimum 3 signals per domain required.</div>
     ) : candidates.map(c => (
      <div key={c.id} className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-4">
       <div className="flex items-center gap-2 mb-2">
        <Beaker className="w-4 h-4 text-indigo-600" />
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded border border-indigo-200">{c.domain}</span>
       </div>
       <p className="text-sm text-gray-800 mb-2">{c.statement}</p>
       <span className="text-xs text-gray-400">Basis: {c.confidence_basis}</span>
      </div>
     ))}
    </div>
   )}
  </div>
 );
};

export default ExtractionHub;
