import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Cpu, Plug, Calendar, Globe2, Shield, RefreshCw, Save, Check, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const SettingsView: React.FC<{ domain?: string }> = ({ domain }) => {
  const { colors, theme, toggle } = useTheme();
  const [tab, setTab] = useState<'llm' | 'integrations' | 'calendar' | 'platform'>('llm');
  const [llmConfig, setLlmConfig] = useState<any>(null);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [l, c, cal, p] = await Promise.allSettled([
        api.getLLMConfig(),
        api.getConnectors(),
        api.getCalendarEvents(),
        api.getSystemStats(),
      ]);
      if (l.status === 'fulfilled') setLlmConfig(l.value);
      if (c.status === 'fulfilled') setConnectors(c.value?.connectors || []);
      if (cal.status === 'fulfilled') setCalEvents(cal.value?.events || []);
      if (p.status === 'fulfilled') setPlatformStats(p.value);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight" style={{ letterSpacing: '-0.6px', color: colors.ink }}>Settings</h1>
        <p className="text-[13px] mt-0.5" style={{ color: colors.inkSubtle }}>LLM routing, integrations, enterprise calendar, and platform config</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
        {([['llm', 'LLM Routing', Cpu], ['integrations', 'Integrations', Plug], ['calendar', 'Calendar', Calendar], ['platform', 'Platform', Globe2]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as any)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all"
            style={{ background: tab === id ? colors.primary : 'transparent', color: tab === id ? '#fff' : colors.inkSubtle }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* LLM Routing */}
      {tab === 'llm' && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="text-[16px] font-medium" style={{ color: colors.ink }}>Model Tier Routing</span>
            </div>
            <p className="text-[13px] mb-4" style={{ color: colors.inkSubtle }}>
              Configure which models power each tier. Quality-critical tasks use reasoning tier; classification and fast ops use cost-optimized models.
            </p>
            <div className="space-y-3">
              {[
                { tier: 'Reasoning', model: 'claude-sonnet-4-20250514', desc: 'Debates, fairness scoring, blueprint generation' },
                { tier: 'Classification', model: 'groq/llama-3.3-70b-versatile', desc: 'Intent routing, extraction, explainability' },
                { tier: 'Fast', model: 'groq/llama-3.3-70b-versatile', desc: 'Formatting, simple operations' },
              ].map(t => (
                <div key={t.tier} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: colors.surface2, border: `1px solid ${colors.hairline}` }}>
                  <div className="w-20">
                    <span className="text-[12px] font-medium" style={{ color: colors.primaryHover }}>{t.tier}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] font-mono" style={{ color: colors.ink }}>{t.model}</span>
                    <p className="text-[11px]" style={{ color: colors.inkTertiary }}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BYOK Config */}
          {llmConfig && (
            <div className="rounded-xl p-5" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
              <span className="text-[14px] font-medium" style={{ color: colors.ink }}>BYOK Configuration</span>
              <div className="mt-3 space-y-2">
                {Object.entries(llmConfig).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-[12px]" style={{ color: colors.inkSubtle }}>{key}</span>
                    <span className="text-[12px] font-mono" style={{ color: colors.ink }}>{typeof val === 'string' ? (val.length > 20 ? val.slice(0, 8) + '•••' : val) : JSON.stringify(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <div className="space-y-3">
          {connectors.length === 0 && !loading && (
            <div className="rounded-xl p-12 text-center" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
              <Plug className="w-10 h-10 mx-auto mb-3" style={{ color: colors.inkTertiary }} />
              <p className="text-[14px]" style={{ color: colors.inkSubtle }}>No connectors configured</p>
            </div>
          )}
          {connectors.map((c: any, i: number) => (
            <div key={i} className="rounded-xl p-4 flex items-center justify-between" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.status === 'ACTIVE' ? 'rgba(39,166,68,0.12)' : colors.surface2 }}>
                  <Plug className="w-4 h-4" style={{ color: c.status === 'ACTIVE' ? colors.success : colors.inkTertiary }} />
                </div>
                <div>
                  <span className="text-[13px] font-medium" style={{ color: colors.ink }}>{c.name || c.connector_type}</span>
                  <p className="text-[11px]" style={{ color: colors.inkTertiary }}>{c.connector_type}</p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: c.status === 'ACTIVE' ? 'rgba(39,166,68,0.12)' : 'rgba(138,143,152,0.12)', color: c.status === 'ACTIVE' ? colors.success : colors.inkSubtle }}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar */}
      {tab === 'calendar' && (
        <div className="rounded-xl overflow-hidden" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: colors.hairline }}>
            <span className="text-[14px] font-medium" style={{ color: colors.ink }}>Enterprise Calendar (AEOS P4)</span>
          </div>
          {calEvents.length === 0 && <div className="p-8 text-center text-[13px]" style={{ color: colors.inkTertiary }}>No calendar events configured</div>}
          {calEvents.map((ev: any, i: number) => (
            <div key={i} className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: colors.hairline }}>
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: ev.is_blocking ? colors.error : colors.info }} />
              <div className="flex-1">
                <span className="text-[13px] font-medium" style={{ color: colors.ink }}>{ev.event_name}</span>
                <p className="text-[11px]" style={{ color: colors.inkTertiary }}>{ev.department} · {ev.event_type}</p>
              </div>
              {ev.is_blocking && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(229,83,75,0.12)', color: colors.error }}>Blocking</span>}
            </div>
          ))}
        </div>
      )}

      {/* Platform */}
      {tab === 'platform' && (
        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="rounded-xl p-5" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
            <span className="text-[14px] font-medium" style={{ color: colors.ink }}>Appearance</span>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[13px]" style={{ color: colors.inkSubtle }}>Theme</span>
              <button onClick={toggle} className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all"
                style={{ background: colors.surface2, border: `1px solid ${colors.hairline}`, color: colors.ink }}>
                {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>

          {/* System Stats */}
          {platformStats && (
            <div className="rounded-xl p-5" style={{ background: colors.surface1, border: `1px solid ${colors.hairline}` }}>
              <span className="text-[14px] font-medium" style={{ color: colors.ink }}>System Stats</span>
              <div className="mt-3 space-y-2">
                {Object.entries(platformStats).map(([k, v]: [string, any]) => (
                  <div key={k} className="flex justify-between py-1">
                    <span className="text-[12px]" style={{ color: colors.inkSubtle }}>{k.replace(/_/g, ' ')}</span>
                    <span className="text-[12px] font-medium" style={{ color: colors.ink }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsView;
