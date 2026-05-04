import React, { useEffect, useState } from 'react';
import { Wrench, Shield, Key, CheckCircle, XCircle, Search } from 'lucide-react';
import { api } from '../api/client';
import type { MCPToolItem } from '../api/client';

export default function MCPToolManager() {
  const [tools, setTools] = useState<MCPToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const defaultTools = ['crm_bulk_api', 'payment_gateway', 'helpdesk_connector', 'issue_tracker'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getMCPTools();
      // Ensure default tools exist in the UI even if not in DB yet
      const merged = defaultTools.map(t => {
        const existing = data.find(d => d.tool_id === t);
        return existing || { tool_id: t, is_active: false, rate_limit_per_hour: 100, api_key: '' };
      });
      setTools(merged);
    } catch (error) {
      console.error('Failed to load MCP tools', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = (tool_id: string, field: string, value: any) => {
    const newTools = [...tools];
    const index = newTools.findIndex(t => t.tool_id === tool_id);
    if (index >= 0) {
      newTools[index] = { ...newTools[index], [field]: value };
      setTools(newTools);
    }
  };

  const handleSave = async (tool_id: string) => {
    const tool = tools.find(t => t.tool_id === tool_id);
    if (tool) {
      await api.updateMCPTool(tool);
      // Optional: show a toast notification here
      await fetchData();
    }
  };

  const filteredTools = tools.filter(t => t.tool_id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-emerald-600" />
            MCP Tool Registry
          </h1>
          <p className="text-gray-500 mt-2">Manage dynamic Model Context Protocol (MCP) tool bindings and rate limits.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading tools...</div>
        ) : (
          filteredTools.map(tool => (
            <div key={tool.tool_id} className="bg-white rounded-2xl p-6 border border-gray-100 premium-shadow">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                    {tool.tool_id}
                  </h3>
                  <div className="flex items-center gap-4 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${tool.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                           onClick={() => handleUpdate(tool.tool_id, 'is_active', !tool.is_active)}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${tool.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{tool.is_active ? 'Active' : 'Disabled'}</span>
                    </label>
                  </div>
                </div>
                <button 
                  onClick={() => handleSave(tool.tool_id)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Rate Limit (per hour)
                  </label>
                  <input 
                    type="number"
                    value={tool.rate_limit_per_hour}
                    onChange={(e) => handleUpdate(tool.tool_id, 'rate_limit_per_hour', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Hard cap to prevent excessive API consumption by agents.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" /> Provider API Key
                  </label>
                  <input 
                    type="password"
                    value={tool.api_key || ''}
                    onChange={(e) => handleUpdate(tool.tool_id, 'api_key', e.target.value)}
                    placeholder="Encrypted at rest..."
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">Required for tool execution. Never exposed to agents directly.</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
