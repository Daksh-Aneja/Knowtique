import React, { useState, lazy, Suspense } from 'react';
import {
  BrainCircuit, Bot, Activity, Search, Bell, Sun, Moon,
  ChevronDown, Settings, Database, Workflow, Shield, MessageSquare, LogOut
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ThemeAdapter from './components/ThemeAdapter';

// Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Core Views
const KnowledgeView = lazy(() => import('./views/KnowledgeView'));
const AgentsView = lazy(() => import('./views/AgentsView'));
const DecisionsView = lazy(() => import('./views/DecisionsView'));

// Chat Copilot
const ChatCopilot = lazy(() => import('./components/ChatCopilot'));

// User Management (ADMIN only)
const UserManagement = lazy(() => import('./pages/UserManagement'));

type NavItem = { id: string; label: string; icon: any; stratum?: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { id: 'knowledge', label: 'Knowledge', icon: Database, stratum: 'S0' },
  { id: 'agents', label: 'Agents', icon: Bot, stratum: 'S2' },
  { id: 'decisions', label: 'Decisions', icon: Activity, stratum: 'S4' },
  { id: 'users', label: 'User Management', icon: Shield, adminOnly: true },
];

function NavButton({ item, active, onClick, colors }: { item: NavItem; active: boolean; onClick: () => void; colors: any }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] transition-all duration-200 ${active ? 'font-medium' : ''}`}
      style={{
        background: active ? colors.navActive : 'transparent',
        color: active ? colors.navActiveText : colors.inkSubtle,
        borderLeft: active ? `3px solid ${colors.primary}` : '3px solid transparent'
      }}>
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.stratum && (
        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full opacity-50"
          style={{ background: colors.primary + '15', color: colors.primary }}>
          {item.stratum}
        </span>
      )}
    </button>
  );
}

function Shell() {
  const [view, setView] = useState('knowledge');
  const { theme, toggle, colors } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const [domain, setDomain] = useState('All Domains');
  const [domainOpen, setDomainOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const DOMAINS = ['All Domains', 'HR', 'Finance', 'Engineering', 'Sales', 'Support'];

  const activeLabel = NAV.find(n => n.id === view)?.label || view;

  const renderView = () => {
    switch (view) {
      case 'knowledge': return <ThemeAdapter><KnowledgeView domain={domain} /></ThemeAdapter>;
      case 'agents': return <ThemeAdapter><AgentsView domain={domain} /></ThemeAdapter>;
      case 'decisions': return <ThemeAdapter><DecisionsView domain={domain} /></ThemeAdapter>;
      case 'users': return <ThemeAdapter><UserManagement /></ThemeAdapter>;
      default: return <ThemeAdapter><KnowledgeView domain={domain} /></ThemeAdapter>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.surface1, color: colors.ink, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-[240px] flex flex-col flex-shrink-0 border-r overflow-hidden" style={{ borderColor: colors.hairline, background: colors.canvas }}>
        <div className="h-14 flex items-center px-5 border-b flex-shrink-0" style={{ borderColor: colors.hairline }}>
          <div className="flex items-center gap-2.5 w-full">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: colors.primary }}>
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[16px] font-semibold tracking-tight" style={{ color: colors.ink }}>KAEOS</span>
              <span className="text-[9px] -mt-0.5 tracking-wide uppercase" style={{ color: colors.inkSubtle }}>Epistemic OS</span>
            </div>
          </div>
        </div>

        {/* Stratum Labels */}
        <div className="px-4 pt-4 pb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: colors.inkSubtle }}>Core Modules</span>
        </div>

        <div className="flex-1 overflow-y-auto py-1 px-3 space-y-1">
          {NAV.filter(n => !n.adminOnly || isAdmin).map(n => (
            <NavButton key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} colors={colors} />
          ))}
        </div>

        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: colors.hairline }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center text-[12px] font-bold"
              style={{ background: colors.primary + '20', color: colors.primary }}>
              {(user?.display_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-medium truncate" style={{ color: colors.ink }}>{user?.display_name || 'User'}</span>
              <span className="text-[10px]" style={{ color: colors.inkTertiary }}>{user?.role || 'VIEWER'}</span>
            </div>
            <button onClick={logout} title="Sign out" className="p-1.5 rounded hover:bg-surface2 transition-colors" style={{ color: colors.inkSubtle }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b flex-shrink-0 z-10" style={{ borderColor: colors.hairline, background: colors.surface1 }}>
          <div className="flex items-center gap-4">
            {/* Domain Selector */}
            <div className="relative">
              <div onClick={() => setDomainOpen(!domainOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer hover:bg-surface2 transition-colors" style={{ borderColor: colors.hairline, background: colors.canvas }}>
                <span className="text-[13px] font-medium" style={{ color: colors.ink }}>Domain: {domain}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: colors.inkSubtle }} />
              </div>
              {domainOpen && (
                <div className="absolute top-full left-0 mt-1 w-full rounded border shadow-lg z-50 overflow-hidden" style={{ background: colors.surface1, borderColor: colors.hairline }}>
                  {DOMAINS.map(d => (
                    <div key={d} onClick={() => { setDomain(d); setDomainOpen(false); }} className="px-3 py-1.5 text-[13px] cursor-pointer hover:bg-surface2 transition-colors" style={{ color: colors.ink }}>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* System Status */}
            <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-medium text-green-500">System Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: colors.inkSubtle }} />
              <input 
                type="text" 
                placeholder="Search KAEOS..." 
                className="pl-8 pr-3 py-1.5 rounded border text-[12px] focus:outline-none focus:ring-1 transition-all"
                style={{ 
                  background: colors.canvas, 
                  borderColor: colors.hairline, 
                  color: colors.ink,
                  width: '200px'
                }}
              />
            </div>
            <button className="p-1.5 rounded hover:bg-surface2 transition-colors relative" style={{ color: colors.inkSubtle }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
            </button>
            {/* Chat Copilot Toggle */}
            <button onClick={() => setChatOpen(!chatOpen)}
              className="p-1.5 rounded hover:bg-surface2 transition-colors relative"
              style={{ color: chatOpen ? colors.primary : colors.inkSubtle }}>
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={toggle} className="p-1.5 rounded hover:bg-surface2 transition-colors" style={{ color: colors.inkSubtle }}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto" style={{ background: colors.canvas }}>
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px]" style={{ color: colors.inkSubtle }}>Loading Module...</span>
              </div>
            </div>
          }>
            {renderView()}
          </Suspense>
        </div>

        {/* Chat Copilot Overlay */}
        {chatOpen && (
          <Suspense fallback={null}>
            <ChatCopilot onClose={() => setChatOpen(false)} />
          </Suspense>
        )}
      </main>
    </div>
  );
}

function AuthGuard() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: colors.canvas }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: colors.primary, borderTopColor: 'transparent' }} />
          <span className="text-[13px]" style={{ color: colors.inkSubtle }}>Loading KAEOS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    );
  }

  return <Shell />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard />
      </AuthProvider>
    </ThemeProvider>
  );
}
