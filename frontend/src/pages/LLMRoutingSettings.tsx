import React, { useEffect, useState } from 'react';
import { Cpu, Key, Save, AlertCircle, TrendingDown } from 'lucide-react';
import { api } from '../api/client';
import type { LLMConfigItem } from '../api/client';

export default function LLMRoutingSettings() {
  const [configs, setConfigs] = useState<LLMConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultLayers = ['TIER_1_COMPLEX', 'TIER_2_STANDARD', 'TIER_3_FAST'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getLLMConfig();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to load LLM config', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = (layer: string, field: string, value: string) => {
    const existingIndex = configs.findIndex(c => c.layer === layer);
    if (existingIndex >= 0) {
      const newConfigs = [...configs];
      newConfigs[existingIndex] = { ...newConfigs[existingIndex], [field]: value };
      setConfigs(newConfigs);
    } else {
      setConfigs([...configs, { layer, model_name: '', api_key: '', provider: '', [field]: value }]);
    }
  };

  const getConfig = (layer: string) => {
    return configs.find(c => c.layer === layer) || { layer, model_name: '', api_key: '', provider: '' };
  };

  const handleSaveAll = async () => {
    setSaving(true);
    for (const layer of defaultLayers) {
      const cfg = getConfig(layer);
      if (cfg.model_name && cfg.api_key && cfg.provider) {
        await api.updateLLMConfig(cfg);
      }
    }
    await fetchData();
    setSaving(false);
  };

  const getLayerDescription = (layer: string) => {
    if (layer === 'TIER_1_COMPLEX') return 'Highest reasoning capability. Used for complex task planning, causal inference, and exact contract execution. High Cost.';
    if (layer === 'TIER_2_STANDARD') return 'Standard instruction following. Used for standard rule execution and extraction. Medium Cost.';
    return 'Fastest response time. Used for intent classification, NER, and PII scrubbing. Low Cost.';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-indigo-600" />
            LLM Routing & BYOK Configuration
          </h1>
          <p className="text-gray-500 mt-2">Explicitly map agent intents to cost-effective models using your own API keys.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Configuration</>}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex gap-3">
        <TrendingDown className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900">Unit Economics Optimization</h4>
          <p className="text-sm text-blue-800 mt-1">Configure models per execution tier. The L9 SkillRouter will automatically route standard NLP tasks to TIER 3, while preserving TIER 1 exclusively for complex reasoning. Bring Your Own Key (BYOK) ensures data sovereignty.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {defaultLayers.map(layer => {
          const cfg = getConfig(layer);
          return (
            <div key={layer} className="bg-white rounded-2xl p-6 border border-gray-100 premium-shadow">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {layer.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{getLayerDescription(layer)}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model Provider</label>
                  <select 
                    value={cfg.provider}
                    onChange={(e) => handleUpdate(layer, 'provider', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Provider...</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="OpenAI">OpenAI</option>
                    <option value="Google">Google Cloud</option>
                    <option value="Local">Local (Ollama/vLLM)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
                  <input 
                    type="text"
                    value={cfg.model_name}
                    onChange={(e) => handleUpdate(layer, 'model_name', e.target.value)}
                    placeholder="e.g., claude-3-opus-20240229"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" /> API Key (BYOK)
                  </label>
                  <div className="relative">
                    <input 
                      type="password"
                      value={cfg.api_key}
                      onChange={(e) => handleUpdate(layer, 'api_key', e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
