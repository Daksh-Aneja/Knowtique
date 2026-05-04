import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Search, Bot } from 'lucide-react';
import { api } from '../api/client';
import type { PendingHITLItem } from '../api/client';

export default function HITLQueue() {
  const [items, setItems] = useState<PendingHITLItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingHITL();
      setItems(data);
    } catch (error) {
      console.error('Failed to load HITL items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    await api.approveHITL(id);
    await fetchData();
  };

  const handleReject = async (id: string) => {
    await api.rejectHITL(id);
    await fetchData();
  };

  const filteredItems = items.filter(i => 
    i.skill_id_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.task_intent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
            Human-In-The-Loop Queue
          </h1>
          <p className="text-gray-500 mt-2">Manage paused agent executions requiring human approval.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search intents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading pending approvals...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 premium-shadow">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Queue is Clear</h3>
            <p className="text-gray-500">No agents are currently paused for HITL approval.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-100 premium-shadow group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                    <span className="text-sm font-mono text-gray-500">{item.id.split('-')[0]}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{item.task_intent}</h3>
                  <p className="text-sm text-gray-500 mt-1">Skill: <span className="font-mono bg-gray-50 px-1 rounded">{item.skill_id_name}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleReject(item.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => handleApprove(item.id)} className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-semibold transition-colors flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve Execution
                  </button>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Agent Reasoning Chain</h4>
                <div className="space-y-2">
                  {item.reasoning_chain.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                        {step.step}
                      </div>
                      <span className="text-gray-700">{step.action}</span>
                      <span className="text-gray-400 font-mono text-xs ml-auto">CONF: {step.confidence?.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-sm mt-4 pt-3 border-t border-gray-200">
                    <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-xs text-amber-600">
                      !
                    </div>
                    <span className="text-amber-700 font-medium">Confidence threshold missed. Human verification required.</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
