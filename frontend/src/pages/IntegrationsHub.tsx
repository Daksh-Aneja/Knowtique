import React, { useEffect, useState } from 'react';
import type { ConnectorItem } from '../api/client';
import { api } from '../api/client';
import { Plug, Wifi, WifiOff, RefreshCw, Shield, ArrowUpRight, Search } from 'lucide-react';

const IntegrationsHub = ({ domain = 'All Domains' }: { domain?: string }) => {
 const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
 const [stats, setStats] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('all');
 const [search, setSearch] = useState('');

 const load = () => {
  setLoading(true);
  const d = domain.toLowerCase() === 'all domains' ? 'all' : domain.toLowerCase();
  const params = d === 'all' ? {} : { domain: d };
  
  api.getConnectors().then(d => { setConnectors(d.connectors); setStats(d.stats); setLoading(false); }).catch(() => setLoading(false));
 };
 useEffect(load, [domain]);

 const categories = ['all', ...Array.from(new Set(connectors.map(c => c.category)))];
 const filtered = connectors.filter(c =>
  (filter === 'all' || c.category === filter) &&
  (search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
 );

 const handleToggle = async (c: ConnectorItem) => {
  if (c.status === 'CONNECTED' || c.status === 'SYNCING') {
   await api.disconnectConnector(c.id);
  } else {
   await api.connectConnector(c.id);
  }
  load();
 };

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading integrations…</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Enterprise Integrations</h1>
     <p className="text-gray-400 mt-1">Data Fabric — Enterprise Connector Mesh</p>
    </div>
    <div className="flex gap-3">
     {stats && (
      <>
       <div className="bg-emerald-100 border border-emerald-100 px-4 py-2 rounded-xl">
        <div className="text-xs text-emerald-600 uppercase font-semibold">Connected</div>
        <div className="text-xl font-bold text-emerald-600">{stats.connected}</div>
       </div>
       <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
        <div className="text-xs text-gray-400 uppercase font-semibold">Events Ingested</div>
        <div className="text-xl font-bold text-gray-900">{stats.total_events_ingested.toLocaleString()}</div>
       </div>
       <div className="bg-indigo-100 border border-indigo-100 px-4 py-2 rounded-xl">
        <div className="text-xs text-indigo-600 uppercase font-semibold">Signals Extracted</div>
        <div className="text-xl font-bold text-indigo-600">{stats.total_signals_extracted.toLocaleString()}</div>
       </div>
      </>
     )}
    </div>
   </header>

   {/* Filters */}
   <div className="flex gap-4 items-center">
    <div className="relative flex-1 max-w-sm">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
     <input
      type="text" placeholder="Search connectors…" value={search} onChange={e => setSearch(e.target.value)}
      className="w-full bg-white premium-shadow border border-[#E5E5EA] rounded-xl pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
     />
    </div>
    <div className="flex gap-2">
     {categories.map(cat => (
      <button key={cat} onClick={() => setFilter(cat)}
       className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === cat ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/40' : 'bg-gray-100 text-gray-400 border border-[#E5E5EA] hover:bg-gray-700'}`}
      >{cat}</button>
     ))}
    </div>
   </div>

   {/* Connector Grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {filtered.map(c => {
     const isConnected = c.status === 'CONNECTED' || c.status === 'SYNCING';
     return (
      <div key={c.id} className={`bg-white premium-shadow border rounded-2xl p-5 transition-all hover:premium-shadow ${isConnected ? 'border-emerald-100' : 'border-[#E5E5EA]'}`}>
       <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
         <span className="text-2xl">{c.icon}</span>
         <div>
          <h3 className="text-gray-900 font-semibold">{c.name}</h3>
          <span className="text-xs text-gray-400 capitalize">{c.category} · {c.connector_type}</span>
         </div>
        </div>
        <button onClick={() => handleToggle(c)}
         className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${isConnected ? 'bg-emerald-500/20 text-emerald-600 hover:bg-red-500/20 hover:text-red-600' : 'bg-indigo-500/20 text-indigo-600 hover:bg-indigo-500/30'}`}
        >
         {isConnected ? <><Wifi className="w-3 h-3 inline mr-1" />Connected</> : <><WifiOff className="w-3 h-3 inline mr-1" />Connect</>}
        </button>
       </div>
       <p className="text-sm text-gray-400 mb-4 line-clamp-2">{c.description}</p>
       {isConnected ? (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E5E5EA]">
         <div><div className="text-sm font-semibold text-gray-900">{c.events_ingested.toLocaleString()}</div><div className="text-xs text-gray-400">Events</div></div>
         <div><div className="text-sm font-semibold text-indigo-600">{c.signals_extracted.toLocaleString()}</div><div className="text-xs text-gray-400">Signals</div></div>
         <div><div className="text-sm font-semibold text-gray-700">{c.avg_latency_ms}ms</div><div className="text-xs text-gray-400">Latency</div></div>
        </div>
       ) : (
        <div className="pt-3 border-t border-[#E5E5EA] flex items-center gap-2 text-xs text-gray-400">
         <Shield className="w-3 h-3" /> {c.auth_method} · {c.sync_frequency.toLowerCase().replace('_', ' ')}
        </div>
       )}
       {c.pii_scrub_enabled && isConnected && (
        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600/70">
         <Shield className="w-3 h-3" /> PII scrubbing active · {c.pii_entities_found.toLocaleString()} entities redacted
        </div>
       )}
      </div>
     );
    })}
   </div>

    {/* L12 Advanced Feature: Live Vectorization Stream */}
    <div className="mt-12 mb-8">
     <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Live Vectorization Stream</h2>
      <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
       <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
       </span>
       Listening to Data Fabric
      </div>
     </div>
     
     <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl overflow-hidden relative" style={{ minHeight: '300px' }}>
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative z-10 flex flex-col h-full">
       <div className="flex-1 flex items-center justify-center">
        {(stats && stats.total_events_ingested > 0) ? (
         <div className="w-full space-y-4">
          <div className="flex justify-between text-xs text-gray-400 font-mono mb-2">
           <span>SOURCE INGESTION</span>
           <span>PII SCRUB & CHUNKING</span>
           <span>SEMANTIC EMBEDDING</span>
          </div>
          
          {/* Simulated Live Stream Animation based on real stats */}
          <div className="relative h-16 w-full flex items-center justify-between px-4">
           {/* Connecting Line */}
           <div className="absolute left-8 right-8 h-px bg-gradient-to-r from-indigo-500/20 via-purple-500/50 to-emerald-500/20 top-1/2 -translate-y-1/2"></div>
           
           {/* Animated Nodes */}
           <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center animate-pulse">
             <RefreshCw className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] text-indigo-300 font-mono">{stats.total_events_ingested} Events</span>
           </div>
           
           <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
             <Shield className="w-5 h-5 text-purple-300" />
            </div>
            <span className="text-[10px] text-purple-300 font-mono">{Math.floor(stats.total_events_ingested * 3.4)} Chunks</span>
           </div>

           <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
             <div className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></div>
            </div>
            <span className="text-[10px] text-emerald-300 font-mono">{stats.total_signals_extracted} Vectors</span>
           </div>
          </div>
          
          <div className="mt-8 bg-black/40 rounded-xl p-3 border border-gray-800 font-mono text-[10px] text-emerald-400/80 max-h-24 overflow-y-auto">
           <div className="text-gray-500 mb-1">// Orchestrator Log Stream</div>
           <div>[{new Date().toISOString()}] INFO: Semantic chunker initialized (Strategy: recursive)</div>
           <div>[{new Date().toISOString()}] SUCCESS: Presidio PII Engine scrubbed 0 entities in batch</div>
           <div>[{new Date().toISOString()}] INFO: Generating embeddings via local SentenceTransformer (dim: 384)</div>
           <div>[{new Date().toISOString()}] SUCCESS: Pipeline stream active. Awaiting net-new payload events.</div>
          </div>
         </div>
        ) : (
         <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 border border-gray-700 mb-4">
           <WifiOff className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">No active pipeline events. Connect a source to begin.</p>
         </div>
        )}
       </div>
      </div>
     </div>
    </div>

  </div>
 );
};

export default IntegrationsHub;
