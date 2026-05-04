import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Sparkles, Bot, AlertTriangle, PlayCircle, Eye, Activity } from 'lucide-react';

const PredictiveOps = () => {
  const [ghostExecutions, setGhostExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGhostExecutions()
      .then(res => {
        setGhostExecutions(res.ghost_executions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-indigo-400 animate-pulse">Loading Predictive Ops...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="pb-6 border-b border-[#E5E5EA]">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          Proactive Automation
        </h1>
        <p className="text-gray-500 mt-1">
          Automated intent detection and proactive task execution.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5EA] p-6 rounded-2xl flex items-start gap-4 premium-shadow">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Activity className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Monitored Channels</div>
            <div className="text-2xl font-bold tracking-tight text-gray-900 mt-1">Slack, Email, CRM</div>
            <div className="text-xs text-indigo-600 font-medium mt-1">Ingesting live signals</div>
          </div>
        </div>
        <div className="bg-white border border-[#E5E5EA] p-6 rounded-2xl flex items-start gap-4 premium-shadow">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Bot className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Automated Actions</div>
            <div className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{ghostExecutions.length}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Tasks executed automatically</div>
          </div>
        </div>
        <div className="bg-white border border-[#E5E5EA] p-6 rounded-2xl flex items-start gap-4 premium-shadow">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">HITL Reviews Needed</div>
            <div className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
              {ghostExecutions.filter(e => e.hitl_required).length}
            </div>
            <div className="text-xs text-amber-600 font-medium mt-1">Below autonomy threshold</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5EA] rounded-2xl premium-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5EA] flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Automation History</h2>
        </div>
        <div className="p-0">
          {ghostExecutions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No automated actions detected yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-[#E5E5EA]">
                <tr>
                  <th className="px-6 py-3 font-semibold tracking-wide">Predicted Intent</th>
                  <th className="px-6 py-3 font-semibold tracking-wide">Triggered Skill</th>
                  <th className="px-6 py-3 font-semibold tracking-wide">Status</th>
                  <th className="px-6 py-3 font-semibold tracking-wide">Confidence & HITL</th>
                  <th className="px-6 py-3 font-semibold tracking-wide">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {ghostExecutions.map(exec => (
                  <tr key={exec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium line-clamp-1">{exec.task_intent}</div>
                      {exec.context?.extracted_from && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
                          <Eye className="w-3 h-3" /> Captured from {exec.context.extracted_from}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-indigo-700 font-mono text-xs font-medium">{exec.skill_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
                        exec.status === 'QUEUED' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                        exec.status.includes('SUCCESS') ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {exec.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {exec.hitl_required ? (
                        <span className="flex items-center gap-1 text-amber-600 font-medium text-xs">
                          <AlertTriangle className="w-3 h-3" /> Review Required
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
                          <PlayCircle className="w-3 h-3" /> Fully Autonomous
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                      {new Date(exec.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveOps;
