import { useState, useEffect } from 'react';
import { Search, FlaskConical, Webhook, FileDown, GitBranch, FileBarChart, Building2, Activity, Shield, ChevronRight } from 'lucide-react';
import { api } from '../api/client';

export default function EnterpriseCommandCenter() {
  const [stats, setStats] = useState<any>(null);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [complianceReport, setComplianceReport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [simResult, setSimResult] = useState<any>(null);
  const [simRuleId, setSimRuleId] = useState('');
  const [simScenario, setSimScenario] = useState('decay_30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, h, c, w, e, t] = await Promise.all([
        api.getSystemStats(), api.getHealthReport(), api.getComplianceReport(),
        api.getWebhooks(), api.getEventLog(30), api.getTenantStats(),
      ]);
      setStats(s); setHealthReport(h); setComplianceReport(c);
      setWebhooks(w.subscriptions || []); setEventLog(e.events || []);
      setTenants(t.tenants || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleSearch() {
    if (searchQuery.length < 2) return;
    try { setSearchResults(await api.globalSearch(searchQuery)); } catch (err) { console.error(err); }
  }

  async function handleSimulate() {
    if (!simRuleId) return;
    try { setSimResult(await api.simulate(simRuleId, simScenario)); }
    catch (err: any) { setSimResult({ error: err.message }); }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'simulation', label: 'Simulation', icon: FlaskConical },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'tenants', label: 'Tenants', icon: Building2 },
  ];

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Loading Enterprise Data…</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center pb-6 border-b border-[#E5E5EA]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Enterprise Command Center</h1>
          <p className="text-gray-400 mt-1">L25 Platform Operations — Search, Simulation, Webhooks, Reports</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
            <div className="text-xs text-gray-400 uppercase font-semibold">API Routes</div>
            <div className="text-2xl font-bold tracking-tight text-indigo-600">82</div>
          </div>
          <div className="bg-gray-100 px-4 py-2 rounded-xl border border-[#E5E5EA]">
            <div className="text-xs text-gray-400 uppercase font-semibold">Event Types</div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600">17</div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-[#E5E5EA]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-white text-gray-900 shadow-sm border border-[#E5E5EA]'
                : 'text-gray-400 hover:text-gray-700'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(stats.entity_counts || {}).map(([key, val]) => (
              <div key={key} className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-4">
                <div className="text-2xl font-bold text-indigo-600">{String(val)}</div>
                <div className="text-xs text-gray-400 mt-1 capitalize">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>

          {healthReport?.summary && (
            <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="text-emerald-600 w-6 h-6" />
                <h3 className="text-lg font-semibold text-gray-900">KB Health Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['Coverage', (healthReport.summary.coverage_score * 100).toFixed(1) + '%', 'text-emerald-600'],
                  ['Avg Confidence', healthReport.summary.avg_confidence, 'text-blue-600'],
                  ['Success Rate', healthReport.summary.avg_success_rate, 'text-indigo-600'],
                  ['Speculative Rules', healthReport.summary.speculative_rules, 'text-red-500'],
                  ['Executions', healthReport.summary.total_executions, 'text-amber-600'],
                  ['Executable Rules', healthReport.summary.executable_rules, 'text-emerald-600'],
                  ['Total Skills', healthReport.summary.total_skills, 'text-purple-600'],
                  ['Total Rules', healthReport.summary.total_rules, 'text-gray-900'],
                ].map(([label, val, color]) => (
                  <div key={String(label)} className="bg-gray-50 rounded-xl p-3 border border-[#E5E5EA]">
                    <div className={`text-xl font-bold ${color}`}>{String(val)}</div>
                    <div className="text-xs text-gray-400">{String(label)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {healthReport?.domain_breakdown && (
            <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Coverage Breakdown</h3>
              <div className="space-y-3">
                {healthReport.domain_breakdown.map((d: any) => (
                  <div key={d.domain} className="flex items-center gap-4">
                    <div className="w-28 text-sm text-gray-700 capitalize font-medium">{d.domain}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${d.avg_confidence >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(d.avg_confidence * 100, 100)}%` }} />
                    </div>
                    <div className="text-sm text-gray-400 w-20">{d.rule_count} rules</div>
                    <div className="text-sm font-mono font-medium text-gray-900 w-12">{d.avg_confidence.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search across rules, skills, signals, questions..."
              className="flex-1 bg-white border border-[#E5E5EA] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            <button onClick={handleSearch}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors shadow-sm">
              Search
            </button>
          </div>
          {searchResults && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">{searchResults.total_results} results for "<span className="text-gray-700">{searchResults.query}</span>"</p>
              {['rules', 'skills', 'signals', 'questions'].map(cat => {
                const items = searchResults.results[cat] || [];
                if (!items.length) return null;
                return (
                  <div key={cat}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat} ({items.length})</h3>
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <div key={item.id} className="bg-white border border-[#E5E5EA] rounded-xl p-4 flex justify-between items-center hover:shadow-sm transition-shadow">
                          <div className="flex-1">
                            <div className="text-sm text-gray-900 font-medium">{item.statement || item.skill_id || item.source || item.question}</div>
                            <div className="text-xs text-gray-400 mt-1">{item.domain || item.type_}</div>
                          </div>
                          {item.confidence !== undefined && (
                            <div className={`text-sm font-mono font-bold ${item.confidence >= 0.6 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {item.confidence?.toFixed(2)}
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-300 ml-3" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SIMULATION */}
      {activeTab === 'simulation' && (
        <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="text-purple-600 w-6 h-6" />
            <h3 className="text-lg font-semibold text-gray-900">What-If Scenario Simulator</h3>
          </div>
          <p className="text-sm text-gray-400">Project confidence decay, simulate validation boosts, or assess rule removal impact — without modifying data.</p>
          <div className="flex gap-3">
            <input type="text" value={simRuleId} onChange={e => setSimRuleId(e.target.value)}
              placeholder="Paste Rule ID..."
              className="flex-1 bg-gray-50 border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400" />
            <select value={simScenario} onChange={e => setSimScenario(e.target.value)}
              className="bg-gray-50 border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-sm text-gray-900">
              <option value="decay_30d">Decay 30 Days</option>
              <option value="decay_90d">Decay 90 Days</option>
              <option value="boost_confidence">Dept Head Validation</option>
              <option value="remove_rule">Remove Rule Impact</option>
            </select>
            <button onClick={handleSimulate}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-500 text-sm shadow-sm">
              Run Simulation
            </button>
          </div>
          {simResult && (
            <div className="bg-gray-50 rounded-xl p-4 border border-[#E5E5EA]">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto font-mono">{JSON.stringify(simResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Webhook className="text-emerald-600 w-6 h-6" />
              <h3 className="text-lg font-semibold text-gray-900">Webhook Subscriptions</h3>
            </div>
            {webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Webhook className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No webhooks configured yet.</p>
                <p className="text-xs text-gray-300 mt-1">Use POST /api/v1/webhooks to create one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((w: any) => (
                  <div key={w.id} className="bg-gray-50 rounded-xl p-4 border border-[#E5E5EA] flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{w.name}</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">{w.endpoint}</div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {w.events?.slice(0, 5).map((e: string) => (
                          <span key={e} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-full font-medium">{e}</span>
                        ))}
                        {w.events?.length > 5 && <span className="text-xs text-gray-400">+{w.events.length - 5} more</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${w.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {w.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <div className="text-xs text-gray-400 mt-2">{w.delivery_count} delivered</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Log</h3>
            {eventLog.length === 0 ? (
              <p className="text-sm text-gray-400">No events emitted yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {eventLog.map((e: any) => (
                  <div key={e.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 border border-[#E5E5EA]">
                    <span className="text-sm font-mono text-indigo-600">{e.type}</span>
                    <span className="text-xs text-gray-400">{new Date(e.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORTS */}
      {activeTab === 'reports' && complianceReport && (
        <div className="space-y-6">
          <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-blue-600 w-6 h-6" />
              <h3 className="text-lg font-semibold text-gray-900">Compliance Posture Report</h3>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {complianceReport.framework_coverage?.map((f: any) => (
                <div key={f.framework} className={`rounded-2xl p-4 border-2 text-center ${
                  f.coverage === 'COVERED'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="text-lg font-bold text-gray-900">{f.framework}</div>
                  <div className="text-sm text-gray-500 mt-1">{f.rule_count} rules</div>
                  <div className={`text-xs font-bold mt-2 ${f.coverage === 'COVERED' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {f.coverage}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Total audit events: <span className="font-medium text-gray-700">{complianceReport.total_audit_events}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => api.exportRules('json').then(r => {
              const blob = new Blob([JSON.stringify(r.rules, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'knowtique_rules.json'; a.click();
            })} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 shadow-sm">
              <FileDown className="w-4 h-4" /> Export Rules (JSON)
            </button>
            <button onClick={() => api.exportSkills().then(r => {
              const blob = new Blob([JSON.stringify(r.skills, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'knowtique_skills.json'; a.click();
            })} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 shadow-sm">
              <FileDown className="w-4 h-4" /> Export Skills (JSON)
            </button>
          </div>
        </div>
      )}

      {/* TENANTS */}
      {activeTab === 'tenants' && (
        <div className="bg-white premium-shadow border border-[#E5E5EA] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="text-indigo-600 w-6 h-6" />
            <h3 className="text-lg font-semibold text-gray-900">Tenant Management</h3>
          </div>
          {tenants.length === 0 ? (
            <p className="text-sm text-gray-400">No tenant data available.</p>
          ) : (
            <div className="space-y-3">
              {tenants.map((t: any) => (
                <div key={t.tenant_id} className="bg-gray-50 rounded-xl p-4 border border-[#E5E5EA] flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.tenant_id}</div>
                    <div className="text-xs text-gray-400 mt-1">{t.rule_count} rules · {t.skill_count} skills</div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-blue-600">{t.avg_confidence?.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">confidence</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-emerald-600">{t.avg_success_rate?.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">success</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
