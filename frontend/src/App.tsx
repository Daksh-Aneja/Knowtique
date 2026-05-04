import React, { useState, lazy, Suspense } from 'react';
import {
  LayoutDashboard, Bot, BrainCircuit, Shield, Settings, Bell, Search, Sun, Moon,
  BookOpen, Workflow, Users, FileSearch, Network, Zap, Lock, BarChart3,
  Store, Eye, Atom, Globe, ShieldAlert, Activity, Database, ChevronDown, ChevronRight
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ThemeAdapter from './components/ThemeAdapter';

/* ─── Views (AEOS 5-View) ─── */
const CommandCenter = lazy(() => import('./views/CommandCenter'));
const AgentFactory = lazy(() => import('./views/AgentFactory'));
const CompanyBrain = lazy(() => import('./views/CompanyBrain'));
const TrustGovernance = lazy(() => import('./views/TrustGovernance'));
const SettingsView = lazy(() => import('./views/SettingsView'));

/* ─── Legacy Pages (Full L0-L24 Coverage) ─── */
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RulesExplorer = lazy(() => import('./pages/RulesExplorer'));
const SkillsRegistry = lazy(() => import('./pages/SkillsRegistry'));
const AgentMonitor = lazy(() => import('./pages/AgentMonitor'));
const HITLQueue = lazy(() => import('./pages/HITLQueue'));
const TopologyVisualizer = lazy(() => import('./pages/TopologyVisualizer'));
const ElicitationHub = lazy(() => import('./pages/ElicitationHub'));
const ExtractionHub = lazy(() => import('./pages/ExtractionHub'));
const ConflictArena = lazy(() => import('./pages/ConflictArena'));
const ProvenanceLedger = lazy(() => import('./pages/ProvenanceLedger'));
const ComplianceDashboard = lazy(() => import('./pages/ComplianceDashboard'));
const RedTeamDashboard = lazy(() => import('./pages/RedTeamDashboard'));
const SecurityFabric = lazy(() => import('./pages/SecurityFabric'));
const BenchmarkNetwork = lazy(() => import('./pages/BenchmarkNetwork'));
const IntegrationsHub = lazy(() => import('./pages/IntegrationsHub'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const PredictiveOps = lazy(() => import('./pages/PredictiveOps'));
const Knowtique10X = lazy(() => import('./pages/Knowtique10X'));
const LLMRoutingSettings = lazy(() => import('./pages/LLMRoutingSettings'));
const MCPToolManager = lazy(() => import('./pages/MCPToolManager'));
const FederatedSettings = lazy(() => import('./pages/FederatedSettings'));
const OntologyConfig = lazy(() => import('./pages/OntologyConfig'));
const ElicitationSimulator = lazy(() => import('./pages/ElicitationSimulator'));
const EnterpriseCommandCenter = lazy(() => import('./pages/EnterpriseCommandCenter'));

type NavItem = { id: string; label: string; icon: any; children?: NavItem[] };

const NAV: NavItem[] = [
  { id: 'command', label: 'Command Center', icon: LayoutDashboard },
  { id: 'factory', label: 'Agent Factory', icon: Bot },
  { id: 'brain', label: 'Company Brain', icon: BrainCircuit },
  { id: 'trust', label: 'Trust & Governance', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const LAYERS: NavItem[] = [
  { id: 'dashboard', label: 'KB Health Dashboard', icon: Activity },
  { id: 'rules', label: 'Rules Explorer', icon: BookOpen },
  { id: 'skills', label: 'Skills Registry', icon: Workflow },
  { id: 'agents', label: 'Agent Monitor', icon: Eye },
  { id: 'hitl', label: 'HITL Queue', icon: Users },
  { id: 'topology', label: 'Topology Graph', icon: Network },
  { id: 'elicitation', label: 'Elicitation Hub', icon: FileSearch },
  { id: 'extraction', label: 'Extraction Hub', icon: Database },
  { id: 'conflicts', label: 'Conflict Arena', icon: ShieldAlert },
  { id: 'provenance', label: 'Provenance Ledger', icon: Lock },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'redteam', label: 'Red Team', icon: Zap },
  { id: 'security', label: 'Security Fabric', icon: Lock },
  { id: 'benchmark', label: 'Benchmarks', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations Hub', icon: Globe },
  { id: 'marketplace', label: 'Marketplace', icon: Store },
  { id: 'predictive', label: 'Predictive Ops', icon: Atom },
  { id: '10x', label: '10X Capabilities', icon: Zap },
  { id: 'llm_routing', label: 'LLM Routing', icon: Workflow },
  { id: 'mcp_tools', label: 'MCP Tools', icon: Database },
  { id: 'ontology', label: 'Ontology & Decay', icon: Network },
  { id: 'federated', label: 'Federated Learning', icon: Globe },
  { id: 'elicitation_sim', label: 'Elicitation Sim', icon: FileSearch },
  { id: 'enterprise', label: 'Enterprise Ops', icon: LayoutDashboard },
];

function NavButton({ item, active, onClick, colors }: { item: NavItem; active: boolean; onClick: () => void; colors: any }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-200"
      style={{ background: active ? colors.navActive : 'transparent', color: active ? colors.navActiveText : colors.inkSubtle, fontWeight: active ? 500 : 400 }}>
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

function Shell() {
  const [view, setView] = useState('command');
  const [layersOpen, setLayersOpen] = useState(false);
  const { theme, toggle, colors } = useTheme();

  const allIds = [...NAV.map(n => n.id), ...LAYERS.map(l => l.id)];
  const activeLabel = NAV.find(n => n.id === view)?.label || LAYERS.find(l => l.id === view)?.label || view;

  const renderView = () => {
    switch (view) {
      /* AEOS 5-View */
      case 'command': return <CommandCenter />;
      case 'factory': return <AgentFactory />;
      case 'brain': return <CompanyBrain />;
      case 'trust': return <TrustGovernance />;
      case 'settings': return <SettingsView />;
      /* Full Layer Pages — wrapped in ThemeAdapter for dark-mode compat */
      case 'dashboard': return <ThemeAdapter><Dashboard /></ThemeAdapter>;
      case 'rules': return <ThemeAdapter><RulesExplorer /></ThemeAdapter>;
      case 'skills': return <ThemeAdapter><SkillsRegistry /></ThemeAdapter>;
      case 'agents': return <ThemeAdapter><AgentMonitor /></ThemeAdapter>;
      case 'hitl': return <ThemeAdapter><HITLQueue /></ThemeAdapter>;
      case 'topology': return <ThemeAdapter><TopologyVisualizer /></ThemeAdapter>;
      case 'elicitation': return <ThemeAdapter><ElicitationHub /></ThemeAdapter>;
      case 'extraction': return <ThemeAdapter><ExtractionHub /></ThemeAdapter>;
      case 'conflicts': return <ThemeAdapter><ConflictArena /></ThemeAdapter>;
      case 'provenance': return <ThemeAdapter><ProvenanceLedger /></ThemeAdapter>;
      case 'compliance': return <ThemeAdapter><ComplianceDashboard /></ThemeAdapter>;
      case 'redteam': return <ThemeAdapter><RedTeamDashboard /></ThemeAdapter>;
      case 'security': return <ThemeAdapter><SecurityFabric /></ThemeAdapter>;
      case 'benchmark': return <ThemeAdapter><BenchmarkNetwork /></ThemeAdapter>;
      case 'integrations': return <ThemeAdapter><IntegrationsHub /></ThemeAdapter>;
      case 'marketplace': return <ThemeAdapter><Marketplace /></ThemeAdapter>;
      case 'predictive': return <ThemeAdapter><PredictiveOps /></ThemeAdapter>;
      case '10x': return <ThemeAdapter><Knowtique10X /></ThemeAdapter>;
      case 'llm_routing': return <ThemeAdapter><LLMRoutingSettings /></ThemeAdapter>;
      case 'mcp_tools': return <ThemeAdapter><MCPToolManager /></ThemeAdapter>;
      case 'federated': return <ThemeAdapter><FederatedSettings /></ThemeAdapter>;
      case 'ontology': return <ThemeAdapter><OntologyConfig /></ThemeAdapter>;
      case 'elicitation_sim': return <ThemeAdapter><ElicitationSimulator /></ThemeAdapter>;
      case 'enterprise': return <ThemeAdapter><EnterpriseCommandCenter /></ThemeAdapter>;
      default: return <CommandCenter />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: colors.canvas, color: colors.ink }}>
      {/* Sidebar */}
      <aside className="w-[220px] flex flex-col flex-shrink-0 border-r overflow-hidden" style={{ borderColor: colors.hairline, background: colors.sidebar }}>
        <div className="h-14 flex items-center px-5 border-b flex-shrink-0" style={{ borderColor: colors.hairline }}>
          <div className="flex items-center gap-2.5 w-full">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5e6ad2, #828fff)' }}>
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight" style={{ color: colors.ink }}>Knowtique</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(94,106,210,0.15)', color: colors.primaryHover }}>AEOS</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
          {/* Primary Views */}
          <div className="px-1 pt-1 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: colors.inkTertiary }}>Platform</span>
          </div>
          {NAV.map(n => (
            <NavButton key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} colors={colors} />
          ))}

          {/* Layer Explorer - Collapsible */}
          <div className="pt-3">
            <button onClick={() => setLayersOpen(!layersOpen)}
              className="w-full flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: colors.inkTertiary }}>
              {layersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>All Layers (L0-L24)</span>
            </button>
            {layersOpen && (
              <div className="space-y-0.5">
                {LAYERS.map(l => (
                  <NavButton key={l.id} item={l} active={view === l.id} onClick={() => setView(l.id)} colors={colors} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t flex-shrink-0" style={{ borderColor: colors.hairline }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#5e6ad2' }}>K</div>
            <div className="flex flex-col flex-1">
              <span className="text-[12px] font-medium" style={{ color: colors.inkMuted }}>Admin</span>
              <span className="text-[10px]" style={{ color: colors.inkTertiary }}>Epistemic OS v2.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-11 flex items-center justify-between px-6 border-b flex-shrink-0" style={{ borderColor: colors.hairline, background: colors.canvas }}>
          <span className="text-[13px] font-medium" style={{ color: colors.ink }}>{activeLabel}</span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md" style={{ color: colors.inkSubtle }}><Search className="w-4 h-4" /></button>
            <button className="p-1.5 rounded-md relative" style={{ color: colors.inkSubtle }}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#5e6ad2' }} />
            </button>
            <button onClick={toggle} className="p-1.5 rounded-md" style={{ color: colors.inkSubtle }}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<div className="p-8" style={{ color: colors.inkTertiary }}>Loading…</div>}>
            {renderView()}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <ThemeProvider><Shell /></ThemeProvider>;
}
