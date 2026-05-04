import React, { useEffect, useState } from 'react';
import type { MarketplaceItem } from '../api/client';
import { api } from '../api/client';
import { Store, Star, Download, Shield, Plus, X } from 'lucide-react';

const Marketplace = () => {
 const [templates, setTemplates] = useState<MarketplaceItem[]>([]);
 const [categories, setCategories] = useState<string[]>([]);
 const [filter, setFilter] = useState('all');
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [formData, setFormData] = useState({ name: '', category: 'Sales', description: '', tags: '' });

 const loadData = () => {
  api.getMarketplace().then(d => { setTemplates(d.templates); setCategories(d.categories); setLoading(false); }).catch(() => setLoading(false));
 };

 useEffect(() => {
  loadData();
 }, []);

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   try {
     await api.createMarketplaceTemplate({
       ...formData,
       author: localStorage.getItem('username') || 'Developer',
       tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
     });
     setIsModalOpen(false);
     setFormData({ name: '', category: 'Sales', description: '', tags: '' });
     setLoading(true);
     loadData();
   } catch (err) {
     console.error(err);
   }
 };

 const filtered = filter === 'all' ? templates : templates.filter(t => t.category === filter);

 if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading marketplace…</div>;

 return (
  <div className="p-8 max-w-7xl mx-auto space-y-8">
   <header className="flex justify-between items-end pb-6 border-b border-[#E5E5EA]">
    <div>
     <h1 className="text-3xl font-bold tracking-tight text-gray-900 tracking-tight">Skills Marketplace</h1>
     <p className="text-gray-400 mt-1">Knowledge Templates & Agent Integrations</p>
    </div>
    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
     <Plus className="w-4 h-4" /> Publish Template
    </button>
   </header>
   <div className="flex gap-2">
    <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${filter === 'all' ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/40' : 'bg-gray-100 text-gray-400 border border-[#E5E5EA]'}`}>All</button>
    {categories.map(c => (
     <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize ${filter === c ? 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/40' : 'bg-gray-100 text-gray-400 border border-[#E5E5EA]'}`}>{c}</button>
    ))}
   </div>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {filtered.map(t => (
     <div key={t.id} className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6 hover:border-indigo-100 transition-colors">
      <div className="flex justify-between items-start mb-3">
       <div>
        <h3 className="text-gray-900 font-semibold text-lg">{t.name}</h3>
        <span className="text-xs text-gray-400">{t.author} · v{t.version}</span>
       </div>
       {t.certified && <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-100 text-emerald-600 text-xs rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />Certified</span>}
      </div>
      <p className="text-sm text-gray-400 mb-4">{t.description}</p>
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
       <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-600" />{t.rating}</span>
       <span className="flex items-center gap-1"><Download className="w-3 h-3" />{t.installs.toLocaleString()}</span>
       <span>{t.rules_count} rules · {t.skills_count} skills</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
       {t.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded">{tag}</span>)}
       {t.compliance_frameworks.map(cf => <span key={cf} className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded border border-indigo-200">{cf}</span>)}
      </div>
     </div>
    ))}
   </div>

   {isModalOpen && (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
     <div className="bg-white rounded-2xl p-6 w-full max-w-md premium-shadow border border-[#E5E5EA]">
      <div className="flex justify-between items-center mb-4">
       <h2 className="text-xl font-semibold text-gray-900">Publish New Template</h2>
       <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
       </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
         <option>Sales</option><option>Support</option><option>Engineering</option><option>HR</option><option>Finance</option>
        </select>
       </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" rows={3} />
       </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
        <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="e.g. negotiation, automated" />
       </div>
       <div className="flex justify-end gap-2 mt-6">
        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Publish</button>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 );
};

export default Marketplace;
