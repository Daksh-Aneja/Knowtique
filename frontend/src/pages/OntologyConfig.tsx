import React, { useEffect, useState } from 'react';
import { Network, Search, Save, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import type { OntologyConfigItem } from '../api/client';

export default function OntologyConfig() {
  const [items, setItems] = useState<OntologyConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultDepartments = ['customer_support', 'engineering', 'sales', 'human_resources', 'finance', 'legal'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getOntologyConfig();
      const merged = defaultDepartments.map(d => {
        const existing = data.find(item => item.department === d);
        return existing || { department: d, default_half_life_days: 90 };
      });
      setItems(merged);
    } catch (error) {
      console.error('Failed to load Ontology config', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = (department: string, value: number) => {
    const newItems = [...items];
    const index = newItems.findIndex(i => i.department === department);
    if (index >= 0) {
      newItems[index] = { ...newItems[index], default_half_life_days: value };
      setItems(newItems);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    for (const item of items) {
      await api.updateOntologyConfig(item);
    }
    await fetchData();
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Network className="w-8 h-8 text-fuchsia-600" />
            Ontology & Decay Tuning
          </h1>
          <p className="text-gray-500 mt-2">Configure temporal decay rates (half-lives) for organizational knowledge domains.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-xl font-semibold hover:bg-fuchsia-700 transition-colors flex items-center gap-2"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Configuration</>}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Decay Engine Warning</h4>
          <p className="text-sm text-amber-800 mt-1">Shorter half-lives generate more elicitation questions and force higher HITL engagement. Ensure settings reflect actual business volatility (e.g., Sales Pricing = 30 days, HR Policy = 365 days).</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">Loading ontology parameters...</div>
        ) : (
          items.map(item => (
            <div key={item.department} className="bg-white rounded-2xl p-6 border border-gray-100 premium-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {item.department.replace(/_/g, ' ')}
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Half-Life (Days)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="7" 
                    max="365" 
                    step="1"
                    value={item.default_half_life_days}
                    onChange={(e) => handleUpdate(item.department, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fuchsia-600"
                  />
                  <div className="w-16 flex-shrink-0 text-center">
                    <span className="text-xl font-bold text-fuchsia-600">{item.default_half_life_days}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Highly Volatile (7d)</span>
                  <span>Stable (365d)</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
