import React, { useEffect, useState } from 'react';
import { Globe2, ShieldCheck, Save, Users, Building2 } from 'lucide-react';
import { api } from '../api/client';
import type { FederatedConfigItem } from '../api/client';

export default function FederatedSettings() {
  const [items, setItems] = useState<FederatedConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultDepartments = ['customer_support', 'engineering', 'sales', 'human_resources', 'finance', 'legal'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getFederatedConfig();
      const merged = defaultDepartments.map(d => {
        const existing = data.find(item => item.department === d);
        return existing || { department: d, opt_in: false };
      });
      setItems(merged);
    } catch (error) {
      console.error('Failed to load Federated config', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = (department: string, value: boolean) => {
    const newItems = [...items];
    const index = newItems.findIndex(i => i.department === department);
    if (index >= 0) {
      newItems[index] = { ...newItems[index], opt_in: value };
      setItems(newItems);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    for (const item of items) {
      await api.updateFederatedConfig(item);
    }
    await fetchData();
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-sky-600" />
            Federated Benchmarking Network
          </h1>
          <p className="text-gray-500 mt-2">Manage cross-organizational data sharing preferences and opt-ins.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors flex items-center gap-2"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Preferences</>}
        </button>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 mb-8 flex gap-4">
        <ShieldCheck className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-base font-semibold text-sky-900">Zero-Trust Data Sovereignty</h4>
          <p className="text-sm text-sky-800 mt-2 leading-relaxed">
            Opting a department into the Federated Network shares strictly anonymized structural metadata (e.g., node count, workflow types, agent autonomy rate). <strong>No PII, raw signals, rule content, or custom YAML</strong> is ever transmitted. By opting in, your organization gains access to L14 Industry Median Benchmarking for that specific department.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 premium-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department Domain</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Type Shared</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Benefit Gained</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Opt-In Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading settings...</td></tr>
              ) : (
                items.map(item => (
                  <tr key={item.department} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900 capitalize">{item.department.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {['sales', 'finance'].includes(item.department) ? 'Strictly Aggregated Metrics' : 'Metadata & Structural Topology'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-sky-600">
                        <Users className="w-4 h-4" /> Peer Comparison Access
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <label className="flex items-center cursor-pointer">
                          <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${item.opt_in ? 'bg-sky-500' : 'bg-gray-300'}`}
                               onClick={() => handleUpdate(item.department, !item.opt_in)}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.opt_in ? 'translate-x-6' : 'translate-x-0'}`} />
                          </div>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
