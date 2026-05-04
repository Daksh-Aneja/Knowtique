import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, MousePointer2 } from 'lucide-react';
import type { GraphData } from '../api/client';
import { api } from '../api/client';

const TopologyVisualizer = () => {
 const [graphData, setGraphData] = useState<GraphData | null>(null);
 const [activeNode, setActiveNode] = useState<string | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  api.getGraph().then(d => { setGraphData(d); setLoading(false); }).catch(() => setLoading(false));
 }, []);

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading knowledge graph…</div>;
 if (!graphData || graphData.nodes.length === 0) return <div className="p-8 text-gray-400">No graph data available.</div>;

 // Layout nodes in a force-directed-like grid
 const nodes = graphData.nodes.map((n, i) => {
  const cols = Math.ceil(Math.sqrt(graphData.nodes.length));
  const row = Math.floor(i / cols);
  const col = i % cols;
  return { ...n, x: 15 + col * (120 / cols), y: 15 + row * (70 / Math.ceil(graphData.nodes.length / cols)) };
 });

 const edges = graphData.edges;

 const getNodeColor = (group: string, id: string) => {
  if (activeNode && activeNode !== id && !edges.find(e => (e.source === id && e.target === activeNode) || (e.target === id && e.source === activeNode))) {
   return { fill: '#F3F4F6', stroke: '#D1D5DB', text: '#9CA3AF' };
  }
  switch (group) {
   case 'workflow': return { fill: 'rgba(79,70,229,0.1)', stroke: '#4F46E5', text: '#4338CA' };
   case 'rule': return { fill: 'rgba(16,185,129,0.1)', stroke: '#10b981', text: '#059669' };
   default: return { fill: 'rgba(107,114,128,0.1)', stroke: '#6b7280', text: '#4b5563' };
  }
 };

 const selected = nodes.find(n => n.id === activeNode);

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
   <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Epistemic Topology</h1>
     <p className="text-gray-400 mt-1">Knowledge Graph — {nodes.length} nodes · {edges.length} edges (Live)</p>
    </div>
   </header>

   <div className="flex-1 bg-[#FAFAFA] border border-[#E5E5EA] rounded-2xl overflow-hidden premium-shadow relative min-h-[500px]">
    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.6 }}></div>

    {/* Legend */}
    <div className="absolute top-4 left-4 bg-white premium-shadow/80 backdrop-blur-sm border border-[#E5E5EA] p-4 rounded-xl z-10 flex flex-col gap-2">
     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Network className="w-3 h-3" /> Node Types</h4>
     <div className="flex items-center gap-2 text-sm text-gray-700"><span className="w-3 h-3 rounded-full bg-indigo-500/40 border border-indigo-500"></span> Workflow</div>
     <div className="flex items-center gap-2 text-sm text-gray-700"><span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500"></span> Rule</div>
    </div>

    {/* Selected Details */}
    {selected && (
     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 bg-white premium-shadow/90 backdrop-blur-md border border-[#E5E5EA] p-5 rounded-2xl z-10 w-80 premium-shadow"
     >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{selected.label}</h3>
      <div className="space-y-2 text-sm">
       <div className="flex justify-between"><span className="text-gray-400">Type</span><span className="text-gray-900 capitalize">{selected.group}</span></div>
       {selected.confidence !== undefined && (
        <div><span className="text-gray-400 block mb-1">Confidence</span>
         <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(selected.confidence || 0) * 100}%` }}></div></div>
          <span className="text-gray-900">{selected.confidence?.toFixed(2)}</span>
         </div>
        </div>
       )}
       {selected.domain && <div className="flex justify-between"><span className="text-gray-400">Domain</span><span className="text-gray-900">{selected.domain}</span></div>}
       <div className="flex justify-between"><span className="text-gray-400">Incoming</span><span className="text-gray-900">{edges.filter(e => e.target === activeNode).length}</span></div>
       <div className="flex justify-between"><span className="text-gray-400">Outgoing</span><span className="text-gray-900">{edges.filter(e => e.source === activeNode).length}</span></div>
      </div>
     </motion.div>
    )}

    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 150 100" preserveAspectRatio="xMidYMid meet">
     <defs>
      <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#D1D5DB" /></marker>
      <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#4F46E5" /></marker>
     </defs>

     {edges.map((edge, idx) => {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) return null;
      const isActive = activeNode === src.id || activeNode === tgt.id;
      const isFaded = activeNode && !isActive;
      return (
       <motion.line key={idx} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
        stroke={isActive ? '#4F46E5' : '#E5E5EA'} strokeWidth={isActive ? 0.8 : 0.4}
        markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: isFaded ? 0.15 : 1 }}
        transition={{ duration: 1, delay: idx * 0.03 }}
       />
      );
     })}

     {nodes.map(node => {
      const colors = getNodeColor(node.group, node.id);
      return (
       <g key={node.id} transform={`translate(${node.x}, ${node.y})`} onClick={() => setActiveNode(activeNode === node.id ? null : node.id)} className="cursor-pointer">
        <motion.circle r="3" fill={colors.fill} stroke={colors.stroke} strokeWidth="0.4"
         initial={{ scale: 0 }} animate={{ scale: activeNode === node.id ? 1.3 : 1 }}
         whileHover={{ scale: 1.4 }} transition={{ type: "spring", stiffness: 300 }}
        />
        <text y="6" textAnchor="middle" fontSize="1.8" fill={colors.text} className="font-medium select-none pointer-events-none">
         {node.label.length > 18 ? node.label.slice(0, 18) + '…' : node.label}
        </text>
       </g>
      );
     })}
    </svg>

    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white premium-shadow/60 backdrop-blur-sm border border-[#E5E5EA] px-4 py-2 rounded-full flex items-center gap-2 text-sm text-gray-400">
     <MousePointer2 className="w-4 h-4" /> Click nodes to explore · Live from DB
    </div>
   </div>
  </div>
 );
};

export default TopologyVisualizer;
