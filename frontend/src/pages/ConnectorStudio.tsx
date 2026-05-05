import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Database, Search, Filter, CheckCircle, AlertCircle, XCircle, Loader2,
  ArrowRight, Lock, Eye, RefreshCw, Zap, Clock, ChevronRight, Upload,
  Settings, Activity, MapPin, Shield, BarChart3, Layers
} from 'lucide-react';

type Screen = 'library' | 'mapper' | 'sync' | 'monitor';

export default function ConnectorStudio({ domain }: { domain?: string }) {
  const { colors } = useTheme();
  const [screen, setScreen] = useState<Screen>('library');
  const [connectors, setConnectors] = useState<any[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<any>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    api.getConnectors().then(r => { setConnectors(r.connectors || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = connectors.filter(c => {
    const matchSearch = !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat = filterCat === 'all' || c.category === filterCat;
    return matchSearch && matchCat;
  });

  const categories = ['all', ...new Set(connectors.map(c => c.category))];

  const statusColor = (s: string) => {
    if (s === 'CONNECTED') return '#22c55e';
    if (s === 'SYNCING') return '#f59e0b';
    if (s === 'ERROR') return '#ef4444';
    return colors.inkSubtle;
  };

  const statusIcon = (s: string) => {
    if (s === 'CONNECTED') return <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />;
    if (s === 'SYNCING') return <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#f59e0b' }} />;
    if (s === 'ERROR') return <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />;
    return <Database className="w-4 h-4" style={{ color: colors.inkSubtle }} />;
  };

  const confColor = (tier: string) => {
    if (tier === 'GREEN') return '#22c55e';
    if (tier === 'AMBER') return '#f59e0b';
    return '#ef4444';
  };

  const openMapper = (c: any) => {
    setSelectedConnector(c);
    // Propose AI mappings
    const sampleFields = [
      { field_name: 'worker_id', object_type: 'Worker', data_type: 'string' },
      { field_name: 'first_name', object_type: 'Worker', data_type: 'string' },
      { field_name: 'last_name', object_type: 'Worker', data_type: 'string' },
      { field_name: 'email', object_type: 'Worker', data_type: 'string' },
      { field_name: 'department', object_type: 'Position', data_type: 'string' },
      { field_name: 'hire_date', object_type: 'Worker', data_type: 'date' },
      { field_name: 'salary', object_type: 'Compensation', data_type: 'float' },
      { field_name: 'ssn', object_type: 'Worker', data_type: 'string' },
      { field_name: 'manager_id', object_type: 'Position', data_type: 'string' },
      { field_name: 'job_title', object_type: 'Position', data_type: 'string' },
    ];
    api.proposeSchemaMappings(c.id, sampleFields)
      .then(r => { setMappings(r || []); setScreen('mapper'); })
      .catch(() => {
        setMappings(sampleFields.map((f, i) => ({
          id: `m-${i}`, source_field: f.field_name, source_object: f.object_type, source_type: f.data_type,
          target_entity: 'Employee', target_field: f.field_name, ai_confidence: 0.5 + Math.random() * 0.45,
          confidence_tier: Math.random() > 0.3 ? 'GREEN' : Math.random() > 0.5 ? 'AMBER' : 'RED',
          is_pii: ['salary', 'ssn', 'first_name', 'last_name'].includes(f.field_name),
          pii_category: f.field_name === 'ssn' ? 'SSN' : f.field_name === 'salary' ? 'COMPENSATION' : null,
          sensitivity_tier: ['salary', 'ssn'].includes(f.field_name) ? 'CONFIDENTIAL' : 'INTERNAL',
          admin_confirmed: false
        })));
        setScreen('mapper');
      });
  };

  const screens: { id: Screen; label: string; icon: any }[] = [
    { id: 'library', label: 'Source Library', icon: Database },
    { id: 'mapper', label: 'Schema Mapper', icon: Layers },
    { id: 'sync', label: 'Sync Config', icon: RefreshCw },
    { id: 'monitor', label: 'Ingestion Monitor', icon: Activity },
  ];

  const card = (bg: string) => ({
    background: bg, borderRadius: '10px', border: `1px solid ${colors.hairline}`,
    padding: '16px', transition: 'all 0.2s'
  });

  return (
    <div className="h-full flex flex-col" style={{ background: colors.canvas, color: colors.ink }}>
      {/* Screen Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b" style={{ borderColor: colors.hairline, background: colors.surface1 }}>
        {screens.map(s => (
          <button key={s.id} onClick={() => setScreen(s.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: screen === s.id ? colors.primary + '18' : 'transparent',
              color: screen === s.id ? colors.primary : colors.inkSubtle,
              border: screen === s.id ? `1px solid ${colors.primary}30` : '1px solid transparent'
            }}>
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
        {selectedConnector && (
          <div className="ml-auto flex items-center gap-2 text-[11px]" style={{ color: colors.inkSubtle }}>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium" style={{ color: colors.ink }}>{selectedConnector.name}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Screen 1: Source Library */}
        {screen === 'library' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight">Connector Library</h2>
                <p className="text-[12px] mt-0.5" style={{ color: colors.inkSubtle }}>
                  Pre-built connectors for SaaS, On-Prem, and File systems. OAuth credentials stored in Vault.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: colors.inkSubtle }} />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search connectors..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border text-[12px] focus:outline-none"
                    style={{ background: colors.surface1, borderColor: colors.hairline, color: colors.ink, width: 200 }} />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium transition-all capitalize"
                  style={{
                    background: filterCat === cat ? colors.primary + '20' : colors.surface1,
                    color: filterCat === cat ? colors.primary : colors.inkSubtle,
                    border: `1px solid ${filterCat === cat ? colors.primary + '40' : colors.hairline}`
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Connector Grid */}
            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-[13px]" style={{ color: colors.inkSubtle }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading connectors...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filtered.map(c => (
                  <div key={c.id} style={card(colors.surface1)}
                    className="hover:shadow-lg cursor-pointer group"
                    onClick={() => c.status === 'CONNECTED' ? openMapper(c) : null}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[18px]"
                          style={{ background: colors.primary + '15' }}>
                          {c.icon || '🔌'}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold">{c.name}</div>
                          <div className="text-[11px] capitalize" style={{ color: colors.inkSubtle }}>{c.category} • {c.connector_type}</div>
                        </div>
                      </div>
                      {statusIcon(c.status)}
                    </div>
                    <p className="text-[11px] mb-3 line-clamp-2" style={{ color: colors.inkSubtle }}>{c.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px]" style={{ color: colors.inkSubtle }}>
                        <span>{c.events_ingested?.toLocaleString() || 0} events</span>
                        <span>{c.signals_extracted || 0} signals</span>
                      </div>
                      {c.status === 'CONNECTED' ? (
                        <button onClick={(e) => { e.stopPropagation(); openMapper(c); }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                          style={{ background: colors.primary + '15', color: colors.primary }}>
                          <MapPin className="w-3 h-3" /> Map Schema
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); api.connectConnector(c.id).then(() => window.location.reload()); }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                          style={{ background: '#22c55e15', color: '#22c55e' }}>
                          <Zap className="w-3 h-3" /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Screen 2: Schema Mapper (AI-First) */}
        {screen === 'mapper' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight">AI Schema Mapper</h2>
                <p className="text-[12px] mt-0.5" style={{ color: colors.inkSubtle }}>
                  AI-suggested mappings. <span style={{ color: '#22c55e' }}>Green &gt;85%</span> auto-accepted.{' '}
                  <span style={{ color: '#f59e0b' }}>Amber</span> needs review.{' '}
                  <span style={{ color: '#ef4444' }}>Red</span> requires manual mapping.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span style={{ color: '#22c55e' }}>✓ {mappings.filter(m => m.confidence_tier === 'GREEN').length} auto</span>
                <span style={{ color: '#f59e0b' }}>⚠ {mappings.filter(m => m.confidence_tier === 'AMBER').length} review</span>
                <span style={{ color: '#ef4444' }}>✕ {mappings.filter(m => m.confidence_tier === 'RED').length} manual</span>
              </div>
            </div>

            {/* Mapping Table */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.hairline }}>
              <div className="grid grid-cols-12 gap-0 text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5"
                style={{ background: colors.surface1, color: colors.inkSubtle, borderBottom: `1px solid ${colors.hairline}` }}>
                <div className="col-span-2">Source Field</div>
                <div className="col-span-1">Object</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1 text-center">→</div>
                <div className="col-span-2">Target Entity</div>
                <div className="col-span-2">Target Field</div>
                <div className="col-span-1 text-center">Confidence</div>
                <div className="col-span-1 text-center">PII</div>
                <div className="col-span-1 text-center">Status</div>
              </div>
              {mappings.map((m, i) => (
                <div key={m.id || i}
                  className="grid grid-cols-12 gap-0 items-center px-4 py-2.5 text-[12px] transition-colors hover:bg-surface2"
                  style={{ borderBottom: `1px solid ${colors.hairline}`, background: i % 2 === 0 ? 'transparent' : colors.surface1 + '40' }}>
                  <div className="col-span-2 font-mono text-[11px]" style={{ color: colors.primary }}>{m.source_field}</div>
                  <div className="col-span-1 text-[11px]" style={{ color: colors.inkSubtle }}>{m.source_object}</div>
                  <div className="col-span-1 text-[10px] font-mono" style={{ color: colors.inkSubtle }}>{m.source_type}</div>
                  <div className="col-span-1 text-center">
                    <ArrowRight className="w-3 h-3 mx-auto" style={{ color: confColor(m.confidence_tier) }} />
                  </div>
                  <div className="col-span-2 font-medium">{m.target_entity}</div>
                  <div className="col-span-2 font-mono text-[11px]">{m.target_field}</div>
                  <div className="col-span-1 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: confColor(m.confidence_tier) + '20', color: confColor(m.confidence_tier) }}>
                      {(m.ai_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    {m.is_pii ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: '#ef444420', color: '#ef4444' }}>
                        <Lock className="w-2.5 h-2.5" /> {m.pii_category || 'PII'}
                      </span>
                    ) : <span className="text-[10px]" style={{ color: colors.inkSubtle }}>—</span>}
                  </div>
                  <div className="col-span-1 text-center">
                    {m.admin_confirmed ? (
                      <CheckCircle className="w-4 h-4 mx-auto" style={{ color: '#22c55e' }} />
                    ) : (
                      <button onClick={() => {
                        api.confirmSchemaMapping(m.id, 'admin').catch(() => {});
                        setMappings(prev => prev.map(p => p.id === m.id ? { ...p, admin_confirmed: true } : p));
                      }}
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: colors.primary + '15', color: colors.primary }}>
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMappings(prev => prev.map(m => ({ ...m, admin_confirmed: true })))}
                className="px-4 py-2 rounded-lg text-[12px] font-medium"
                style={{ background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30' }}>
                Confirm All Green
              </button>
              <button onClick={() => setScreen('sync')}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-white"
                style={{ background: colors.primary }}>
                Continue to Sync Config →
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: Sync Configuration */}
        {screen === 'sync' && (
          <div className="space-y-5 max-w-3xl">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">Sync Configuration</h2>
              <p className="text-[12px] mt-0.5" style={{ color: colors.inkSubtle }}>
                Configure how data flows from {selectedConnector?.name || 'source'} to the Knowledge Graph.
              </p>
            </div>

            {/* Sync Mode */}
            <div style={card(colors.surface1)}>
              <h3 className="text-[13px] font-semibold mb-3">Sync Mode</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'realtime', label: 'Real-Time', desc: 'Kafka streaming', icon: Zap, color: '#22c55e' },
                  { id: 'scheduled', label: 'Scheduled Batch', desc: 'Cron-based', icon: Clock, color: '#f59e0b' },
                  { id: 'manual', label: 'Manual Trigger', desc: 'On-demand', icon: Upload, color: colors.primary },
                ].map(mode => (
                  <div key={mode.id} className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: colors.hairline, background: colors.canvas }}>
                    <div className="flex items-center gap-2 mb-1">
                      <mode.icon className="w-4 h-4" style={{ color: mode.color }} />
                      <span className="text-[12px] font-semibold">{mode.label}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: colors.inkSubtle }}>{mode.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity Selection */}
            <div style={card(colors.surface1)}>
              <h3 className="text-[13px] font-semibold mb-3">Entity Types to Sync</h3>
              <div className="grid grid-cols-3 gap-2">
                {['Employee', 'OrgUnit', 'Role', 'Policy', 'Contract', 'Asset'].map(ent => (
                  <label key={ent} className="flex items-center gap-2 p-2 rounded border cursor-pointer text-[12px]"
                    style={{ borderColor: colors.hairline }}>
                    <input type="checkbox" defaultChecked className="rounded" />
                    {ent}
                  </label>
                ))}
              </div>
            </div>

            {/* CDC Toggle */}
            <div style={card(colors.surface1)}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-semibold">Change Data Capture (CDC)</h3>
                  <p className="text-[11px]" style={{ color: colors.inkSubtle }}>Delta-only sync after initial full load via Debezium</p>
                </div>
                <div className="w-10 h-5 rounded-full relative cursor-pointer" style={{ background: '#22c55e' }}>
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setScreen('monitor')}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-white"
                style={{ background: colors.primary }}>
                Start Full Crawl →
              </button>
            </div>
          </div>
        )}

        {/* Screen 4: Ingestion Monitor */}
        {screen === 'monitor' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight">Ingestion Monitor</h2>
                <p className="text-[12px] mt-0.5" style={{ color: colors.inkSubtle }}>
                  Real-time ingestion feed with connector health and freshness heatmap.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: '#22c55e15', color: '#22c55e' }}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
              </div>
            </div>

            {/* Connector Health Cards */}
            <div className="grid grid-cols-4 gap-4">
              {connectors.filter(c => c.status === 'CONNECTED').slice(0, 4).map(c => (
                <div key={c.id} style={card(colors.surface1)}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[14px]">{c.icon || '🔌'}</span>
                    <span className="text-[12px] font-semibold">{c.name}</span>
                  </div>
                  <div className="space-y-1 text-[11px]" style={{ color: colors.inkSubtle }}>
                    <div className="flex justify-between"><span>Records/hr</span><span className="font-mono" style={{ color: colors.ink }}>{Math.floor(Math.random() * 5000)}</span></div>
                    <div className="flex justify-between"><span>Error rate</span><span className="font-mono" style={{ color: '#22c55e' }}>{(Math.random() * 2).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Freshness</span><span className="font-mono" style={{ color: '#22c55e' }}>98%</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Freshness Heatmap */}
            <div style={card(colors.surface1)}>
              <h3 className="text-[13px] font-semibold mb-3">Entity Freshness Heatmap</h3>
              <div className="grid grid-cols-6 gap-2">
                {['Employee', 'OrgUnit', 'Role', 'Policy', 'Contract', 'Asset'].map(ent => {
                  const freshness = 0.5 + Math.random() * 0.5;
                  const color = freshness > 0.8 ? '#22c55e' : freshness > 0.6 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={ent} className="p-3 rounded-lg text-center" style={{ background: color + '15' }}>
                      <div className="text-[20px] font-bold" style={{ color }}>{(freshness * 100).toFixed(0)}%</div>
                      <div className="text-[10px] font-medium mt-1">{ent}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Feed */}
            <div style={card(colors.surface1)}>
              <h3 className="text-[13px] font-semibold mb-3">Live Ingestion Feed</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {Array.from({ length: 12 }).map((_, i) => {
                  const types = ['ENTITY_CREATED', 'RELATIONSHIP_MAPPED', 'SIGNAL_EXTRACTED', 'PII_DETECTED'];
                  const type = types[i % types.length];
                  const typeColor = type === 'PII_DETECTED' ? '#ef4444' : type === 'ENTITY_CREATED' ? '#22c55e' : colors.primary;
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded text-[11px]"
                      style={{ background: i === 0 ? typeColor + '08' : 'transparent' }}>
                      <span className="font-mono text-[10px]" style={{ color: colors.inkSubtle }}>
                        {new Date(Date.now() - i * 3200).toLocaleTimeString()}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: typeColor + '20', color: typeColor }}>
                        {type}
                      </span>
                      <span style={{ color: colors.inkSubtle }}>
                        {type === 'ENTITY_CREATED' ? 'Employee#' + (1000 + i) + ' created from Worker object' :
                         type === 'PII_DETECTED' ? 'SSN field tokenized in Worker#' + (1000 + i) :
                         type === 'RELATIONSHIP_MAPPED' ? 'Employee → belongs_to → Engineering' :
                         'Authority signal extracted (score: 0.' + (70 + i) + ')'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
