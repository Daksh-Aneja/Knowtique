/**
 * Knowtique — API Client
 * Typed fetch wrapper for all backend endpoints — ZERO hardcoded data
 */

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8001/api/v1`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('kaeos-token');
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders, ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API Error ${res.status}`);
  }
  return res.json();
}

// ─── Types ───
export interface DepartmentCoverage {
  department: string;
  coverage: number;
  rule_count: number;
  trend: string;
}

export interface ConfidenceDistribution {
  speculative: number;
  inferred: number;
  validated_peer: number;
  validated_dh: number;
  verified: number;
}

export interface DecayAlert {
  rule_id: string;
  statement: string;
  domain: string;
  current_confidence: number;
  days_since_validation: number;
  half_life_days: number;
  urgency: string;
}

export interface AgentMetrics {
  total_executions_7d: number;
  success_rate: number;
  rag_fallback_rate: number;
  human_overrides: number;
  avg_duration_ms: number;
  skills_used: number;
}

export interface ElicitationMetrics {
  questions_sent_7d: number;
  response_rate: number;
  entries_created: number;
  avg_time_to_answer_hours: number;
  top_contributors: { name: string; score: number; contributions: number }[];
}

export interface KBHealth {
  overall_score: number;
  score_trend: string;
  total_rules: number;
  total_skills: number;
  total_executions: number;
  coverage: DepartmentCoverage[];
  confidence_distribution: ConfidenceDistribution;
  decay_alerts: DecayAlert[];
  agent_metrics: AgentMetrics;
  elicitation_metrics: ElicitationMetrics;
  freshness: { within_half_life: number; decaying: number; expired: number };
}

export interface RuleItem {
  id: string;
  statement: string;
  domain: string;
  confidence_scalar: number;
  confidence_tier: string;
  confidence_vector: Record<string, number>;
  is_executable: boolean;
  compliance_tags: string[];
  half_life_days: number;
  created_at: string;
  validated_at: string | null;
}

export interface RuleListResponse {
  total: number;
  rules: RuleItem[];
}

export interface SkillItem {
  id: string;
  skill_id: string;
  department: string;
  domain: string;
  version: string;
  status: string;
  confidence: number;
  confidence_tier: string;
  confidence_vector: Record<string, number>;
  execution_count: number;
  success_rate: number;
  half_life_days: number;
  mcp_tool_bindings: string[];
  compliance_tags: string[];
  triggers: unknown[];
  steps: unknown[];
  exceptions: unknown[];
  guardrails: Record<string, unknown>;
}

export interface SkillRegistryResponse {
  total: number;
  total_executions: number;
  avg_success_rate: number;
  skills: SkillItem[];
}

export interface ExecutionItem {
  id: string;
  status: string;
  route_type: string;
  task_intent: string;
  duration_ms: number;
  hitl_required: boolean;
  outcome_type: string;
  confidence_delta: number;
  started_at: string;
  reasoning_chain: { step: number; action: string; status: string }[];
}

export interface QuestionItem {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  question_text: string;
  question_type: string;
  context_ref: string;
  delivery_channel: string;
  priority: string;
  status: string;
  specificity: number;
  groundedness: number;
  answerability: number;
  created_at: string;
  answered_at: string | null;
}

export interface ContributorItem {
  employee_id: string;
  display_name: string;
  department: string;
  role: string;
  total_contributions: number;
  confirmed_contributions: number;
  reputation_score: number;
  response_rate: number;
  badge: string | null;
}

export interface ElicitationDashboard {
  pending_questions: QuestionItem[];
  recent_answers: QuestionItem[];
  contributors: ContributorItem[];
  stats: Record<string, number>;
}

export interface ComplianceFramework {
  framework: string;
  coverage_pct: number;
  violations: number;
  blocker_count: number;
  last_audit: string | null;
  status: string;
}

export interface ComplianceDashboard {
  frameworks: ComplianceFramework[];
  total_tagged_rules: number;
  untagged_rules: number;
}

export interface ProvenanceEntry {
  id: string;
  event_type: string;
  timestamp: string;
  actor_role: string;
  confidence_at: number;
  reasoning: string;
  chain_hash: string;
  rule_statement?: string;
}

export interface Signal {
  id: string;
  source_type: string;
  source_entity: string;
  signal_type: string;
  domain: string;
  clean_payload: string;
  authority_score: number;
  novelty_score: number;
  pii_present: boolean;
  created_at: string;
}

export interface CandidateRule {
  id: string;
  statement: string;
  trigger_json: any;
  action_json: any;
  domain: string;
  confidence_basis: string;
}

export interface RedTeamScan {
  skill_id: string;
  department: string;
  status: string;
  vulnerabilities: number;
  scan_count: number;
  last_scan: string;
  scan_types: string[];
  details: {
    scan_type: string;
    status: string;
    vulnerabilities: number;
    details: any[];
    confidence_at_scan: number;
    duration_ms: number;
    scanned_at: string;
  }[];
}

export interface BenchmarkData {
  local_org: {
    kb_coverage_pct: number;
    agent_autonomy_pct: number;
    time_to_onboard_days: number;
    active_skills: number;
  };
  industry_median: {
    kb_coverage_pct: number;
    agent_autonomy_pct: number;
    time_to_onboard_days: number;
    active_skills: number;
  };
  top_quartile: {
    kb_coverage_pct: number;
    agent_autonomy_pct: number;
    time_to_onboard_days: number;
    active_skills: number;
  };
  department_benchmarks: {
    department: string;
    local_coverage: number;
    industry_median: number;
    status: string;
  }[];
}

export interface GraphData {
  nodes: { id: string; label: string; group: string; department?: string; confidence?: number; domain?: string }[];
  edges: { source: string; target: string; label: string }[];
}

export interface ConnectorItem {
  id: string;
  name: string;
  category: string;
  connector_type: string;
  status: string;
  icon: string;
  description: string;
  auth_method: string;
  sync_frequency: string;
  last_sync_at: string | null;
  events_ingested: number;
  signals_extracted: number;
  error_count: number;
  avg_latency_ms: number;
  pii_scrub_enabled: boolean;
  pii_entities_found: number;
  connected_at: string | null;
}

export interface ConnectorsResponse {
  connectors: ConnectorItem[];
  stats: {
    total: number;
    connected: number;
    available: number;
    total_events_ingested: number;
    total_signals_extracted: number;
  };
}

export interface ConflictItem {
  id: string;
  conflict_type: string;
  severity: string;
  status: string;
  assigned_to: string | null;
  deadline: string | null;
  detected_at: string;
  resolved_at: string | null;
  resolution_type: string | null;
  resolution_note: string | null;
  rule_a: { id: string; statement: string; domain: string; confidence: number; sources: number; validated_at: string | null } | null;
  rule_b: { id: string; statement: string; domain: string; confidence: number; sources: number; validated_at: string | null } | null;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  author: string;
  version: string;
  rating: number;
  installs: number;
  rules_count: number;
  skills_count: number;
  tags: string[];
  compliance_frameworks: string[];
  certified: boolean;
  preview_data: Record<string, any>;
}

export interface SecurityLog {
  id: string;
  event_type: string;
  actor_hash: string;
  actor_role: string;
  resource_type: string;
  resource_id: string | null;
  action: string;
  result: string;
  ip_address: string;
  details: Record<string, any>;
  timestamp: string;
}

// ─── L9 Configurations ───
export interface LLMConfigItem {
  id?: string;
  layer: string;
  model_name: string;
  api_key: string;
  provider: string;
}

export interface MCPToolItem {
  id?: string;
  tool_id: string;
  is_active: boolean;
  rate_limit_per_hour: number;
  api_key?: string;
}

export interface OntologyConfigItem {
  id?: string;
  department: string;
  default_half_life_days: number;
}

export interface FederatedConfigItem {
  id?: string;
  department: string;
  opt_in: boolean;
}

export interface PendingHITLItem {
  id: string;
  skill_id_name: string;
  status: string;
  task_intent: string;
  context: any;
  started_at: string;
  reasoning_chain: any[];
}

// ─── API Functions ───
export const api = {
  // Auth
  authMe: () => request<any>('/auth/me'),
  authLogin: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  authUsers: () => request<any>('/auth/users'),
  authCreateUser: (data: any) => request<any>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  authUpdateRole: (id: string, role: string) => request<any>(`/auth/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  authDeleteUser: (id: string) => request<any>(`/auth/users/${id}`, { method: 'DELETE' }),

  // Dashboard
  getHealth: () => request<KBHealth>('/dashboard/health'),
  getCompliance: () => request<ComplianceDashboard>('/dashboard/compliance'),

  // Rules
  getRules: (params?: { domain?: string; confidence_tier?: string }) => {
    const qs = new URLSearchParams();
    if (params?.domain) qs.set('domain', params.domain);
    if (params?.confidence_tier) qs.set('confidence_tier', params.confidence_tier);
    return request<RuleListResponse>(`/rules?${qs}`);
  },
  getRule: (id: string) => request<RuleItem>(`/rules/${id}`),
  getProvenance: (id: string) => request<ProvenanceEntry[]>(`/rules/${id}/provenance`),

  // Skills
  getSkills: () => request<SkillRegistryResponse>('/skills'),
  getSkill: (id: string) => request<SkillItem>(`/skills/${id}`),
  getExecutions: (skillId: string) => request<ExecutionItem[]>(`/skills/${skillId}/executions`),
  executeSkill: (skillId: string, intent: string) =>
    request(`/skills/${skillId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ intent, context: {} }),
    }),

  // Elicitation
  getElicitation: () => request<ElicitationDashboard>('/elicitation/dashboard'),
  submitAnswer: (questionId: string, answer: string) =>
    request('/elicitation/answer', {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, answer_text: answer }),
    }),

  // Extraction (L2)
  getSignals: () => request<{ signals: Signal[] }>('/extraction/signals'),
  getCandidates: () => request<{ candidates: CandidateRule[] }>('/extraction/candidates'),
  detectConflict: (candidate: CandidateRule) => request('/extraction/detect-conflict', {
    method: 'POST',
    body: JSON.stringify(candidate),
  }),

  // Provenance (L11)
  getGlobalLedger: () => request<{ ledger: ProvenanceEntry[] }>('/provenance/global/ledger'),

  // RedTeam (L12)
  getRecentScans: () => request<{ scans: RedTeamScan[]; summary: any }>('/redteam/scans/recent'),
  runScan: (skillId: string) => request(`/redteam/scan/${skillId}`, { method: 'POST' }),

  // Benchmark (L14)
  getBenchmark: () => request<BenchmarkData>('/benchmark/network'),

  // Topology (L4)
  getGraph: () => request<GraphData>('/topology/graph'),

  // Connectors (L0)
  getConnectors: () => request<ConnectorsResponse>('/connectors'),
  connectConnector: (id: string) => request(`/connectors/${id}/connect`, { method: 'POST' }),
  disconnectConnector: (id: string) => request(`/connectors/${id}/disconnect`, { method: 'POST' }),

  // Conflicts (L16)
  getConflicts: () => request<{ conflicts: ConflictItem[]; open_count: number; total: number }>('/conflicts'),
  resolveConflict: (id: string, resolution_type: string, note?: string) =>
    request(`/conflicts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_type, resolution_note: note }),
    }),

  // Marketplace (L19)
  getMarketplace: () => request<{ templates: MarketplaceItem[]; total: number; categories: string[] }>('/marketplace'),
  createMarketplaceTemplate: (data: { name: string; category: string; description: string; author: string; tags: string[] }) =>
    request<{ status: string; id: string }>('/marketplace', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Security (L17)
  getSecurityLog: () => request<{ logs: SecurityLog[]; stats: { total_events: number; blocked: number; escalated: number; allowed: number } }>('/security/audit-log'),

  // Predictive Ops (L20)
  getGhostExecutions: () => request<{ ghost_executions: any[] }>('/predictive/ghost-executions'),

  // Knowtique 10X
  getQuantumEvents: () => request<any[]>('/10x/quantum-events'),
  getRegulatoryRules: () => request<any[]>('/10x/regulatory-rules'),
  getFederatedExports: () => request<any[]>('/10x/federated-exports'),
  getPolymorphicEvents: () => request<any[]>('/10x/polymorphic-events'),

  // --- New L9 Gaps ---
  // HITL
  getPendingHITL: () => request<PendingHITLItem[]>('/skills/hitl/pending'),
  approveHITL: (execId: string) => request(`/skills/hitl/${execId}/approve`, { method: 'POST' }),
  rejectHITL: (execId: string) => request(`/skills/hitl/${execId}/reject`, { method: 'POST' }),

  // LLM Routing / BYOK
  getLLMConfig: () => request<LLMConfigItem[]>('/config/llm-routing'),
  updateLLMConfig: (config: LLMConfigItem) => request<LLMConfigItem>('/config/llm-routing', {
    method: 'POST',
    body: JSON.stringify(config)
  }),

  // MCP Tools
  getMCPTools: () => request<MCPToolItem[]>('/config/mcp-tools'),
  updateMCPTool: (config: MCPToolItem) => request<MCPToolItem>('/config/mcp-tools', {
    method: 'POST',
    body: JSON.stringify(config)
  }),

  // Ontology Config
  getOntologyConfig: () => request<OntologyConfigItem[]>('/config/ontology'),
  updateOntologyConfig: (config: OntologyConfigItem) => request<OntologyConfigItem>('/config/ontology', {
    method: 'POST',
    body: JSON.stringify(config)
  }),

  // Federated Settings
  getFederatedConfig: () => request<FederatedConfigItem[]>('/config/federated'),
  updateFederatedConfig: (config: FederatedConfigItem) => request<FederatedConfigItem>('/config/federated', {
    method: 'POST',
    body: JSON.stringify(config)
  }),

  // ─── Enterprise Platform APIs ───
  getSystemStats: () => request<any>('/system/stats'),
  getReadiness: () => request<any>('/ready'),
  globalSearch: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),
  exportRules: (format: string = 'json') => request<any>(`/export/rules?format=${format}`),
  exportSkills: () => request<any>('/export/skills'),
  importRules: (rules: any[]) => request<any>('/import/rules', { method: 'POST', body: JSON.stringify({ rules }) }),
  getRuleVersions: (ruleId: string) => request<any>(`/rules/${ruleId}/versions`),
  cloneRule: (ruleId: string, newDomain?: string) => request<any>(`/rules/${ruleId}/clone`, {
    method: 'POST', body: JSON.stringify({ new_domain: newDomain })
  }),
  simulate: (ruleId: string, scenario: string, params?: any) => request<any>('/simulate', {
    method: 'POST', body: JSON.stringify({ rule_id: ruleId, scenario, params: params || {} })
  }),
  getHealthReport: () => request<any>('/reports/health'),
  getComplianceReport: () => request<any>('/reports/compliance'),
  getTenantStats: () => request<any>('/tenants/stats'),
  getWebhooks: () => request<any>('/webhooks'),
  createWebhook: (name: string, endpoint: string, events: string[]) => request<any>('/webhooks', {
    method: 'POST', body: JSON.stringify({ name, endpoint, events })
  }),
  deleteWebhook: (id: string) => request<any>(`/webhooks/${id}`, { method: 'DELETE' }),
  getEventLog: (limit: number = 50) => request<any>(`/events/log?limit=${limit}`),

  // ─── AEOS Agent Factory APIs ───
  // Blueprints
  createBlueprint: (prompt: string, createdBy?: string) => request<any>('/agents/blueprint', {
    method: 'POST', body: JSON.stringify({ prompt, created_by: createdBy })
  }),
  listBlueprints: () => request<any>('/agents/blueprints'),
  getBlueprint: (id: string) => request<any>(`/agents/blueprint/${id}`),
  refineBlueprint: (id: string, edits: any) => request<any>(`/agents/blueprint/${id}`, {
    method: 'PUT', body: JSON.stringify(edits)
  }),
  approveBlueprint: (id: string, approvedBy?: string) => request<any>(`/agents/blueprint/${id}/approve`, {
    method: 'POST', body: JSON.stringify({ approved_by: approvedBy })
  }),
  compileBlueprint: (id: string) => request<any>(`/agents/blueprint/${id}/compile`, { method: 'POST' }),
  deployBlueprint: (id: string, triggerConfig?: any) => request<any>(`/agents/blueprint/${id}/deploy`, {
    method: 'POST', body: JSON.stringify({ trigger_config: triggerConfig })
  }),

  // Deployed Agents
  listDeployedAgents: () => request<any>('/agents/deployed'),
  getDeployedAgent: (id: string) => request<any>(`/agents/deployed/${id}`),
  stopAgent: (id: string) => request<any>(`/agents/deployed/${id}/stop`, { method: 'POST' }),
  pauseAgent: (id: string) => request<any>(`/agents/deployed/${id}/pause`, { method: 'POST' }),

  // Activity Feed
  getActivityFeed: (limit: number = 50, unreadOnly: boolean = false) =>
    request<any>(`/agents/activity-feed?limit=${limit}&unread_only=${unreadOnly}`),
  markFeedRead: (eventIds: string[]) => request<any>('/agents/activity-feed/mark-read', {
    method: 'POST', body: JSON.stringify({ event_ids: eventIds })
  }),
  getActionRequired: () => request<any>('/agents/activity-feed/action-required'),

  // Debate Engine
  getDebateTranscript: (executionId: string) => request<any>(`/agents/debates/${executionId}`),
  getRecentDebates: () => request<any>('/agents/debates/recent'),

  // Fairness (AEOS P3)
  getFairnessLog: (limit: number = 50) => request<any>(`/fairness/audit-log?limit=${limit}`),
  overrideFairness: (logId: string, overrideBy: string, justification: string) =>
    request<any>(`/fairness/override/${logId}`, {
      method: 'POST', body: JSON.stringify({ override_by: overrideBy, justification })
    }),

  // Calendar (AEOS P4)
  getCalendarEvents: () => request<any>('/calendar/events'),
  createCalendarEvent: (data: any) => request<any>('/calendar/events', {
    method: 'POST', body: JSON.stringify(data)
  }),
  deleteCalendarEvent: (id: string) => request<any>(`/calendar/events/${id}`, { method: 'DELETE' }),
  getTemporalContext: (department?: string) =>
    request<any>(`/calendar/context?department=${department || 'general'}`),

  // ─── AEOS Pioneer Layer APIs ───
  // P1: External Intelligence
  ingestSignal: (data: { signal_type: string; source: string; title: string; content: string; severity?: string }) =>
    request<any>('/intelligence/signals', { method: 'POST', body: JSON.stringify(data) }),
  correlateSignal: (content: string) =>
    request<any>('/intelligence/correlate', { method: 'POST', body: JSON.stringify({ signal_content: content }) }),
  generateProactiveAlert: (data: any) =>
    request<any>('/intelligence/proactive-alert', { method: 'POST', body: JSON.stringify(data) }),

  // P2: Org Intelligence
  scoreChangeReadiness: (department: string, changeDescription: string) =>
    request<any>('/org-intelligence/change-readiness', {
      method: 'POST', body: JSON.stringify({ department, change_description: changeDescription })
    }),
  mapInfluencePath: (targetOutcome: string, department: string) =>
    request<any>('/org-intelligence/influence-path', {
      method: 'POST', body: JSON.stringify({ target_outcome: targetOutcome, department })
    }),
  getSkillsTopology: () => request<any>('/org-intelligence/skills-topology'),

  // Topology
  getTopology: () => request<any>('/topology/graph'),

  // Provenance Ledger
  getProvenanceLedger: () => request<any>('/provenance/global/ledger'),

  // Elicitation
  getElicitationDashboard: () => request<any>('/elicitation/dashboard'),

  // L6: Simulation
  runSimulation: (changeDescription: string, targetDomain: string, riskTolerance?: string) =>
    request<any>('/simulation/what-if', {
      method: 'POST', body: JSON.stringify({
        change_description: changeDescription, target_domain: targetDomain,
        risk_tolerance: riskTolerance || 'MEDIUM'
      })
    }),

  // ─── S1 Infrastructure Layer (KAEOS N1-N4) ───

  // N1: Model Management
  getModelRegistry: () => request<any[]>('/infrastructure/models'),
  registerModel: (data: any) => request<any>('/infrastructure/models', {
    method: 'POST', body: JSON.stringify(data)
  }),
  routeModel: (requestType: string) => request<any>('/infrastructure/models/route', {
    method: 'POST', body: JSON.stringify({ request_type: requestType })
  }),
  estimateTokens: (requestType: string) => request<any>(`/infrastructure/models/estimate?request_type=${requestType}`),
  getPromptTemplates: () => request<any[]>('/infrastructure/prompts'),
  registerPrompt: (data: any) => request<any>('/infrastructure/prompts', {
    method: 'POST', body: JSON.stringify(data)
  }),

  // N2: Cost Governor
  getCostTelemetry: (hours: number = 24) => request<any>(`/infrastructure/cost/telemetry?hours=${hours}`),
  getCostBudgets: () => request<any[]>('/infrastructure/cost/budgets'),
  createCostBudget: (data: any) => request<any>('/infrastructure/cost/budgets', {
    method: 'POST', body: JSON.stringify(data)
  }),
  checkBudget: (estimatedTokens: number) => request<any>('/infrastructure/cost/check', {
    method: 'POST', body: JSON.stringify({ estimated_tokens: estimatedTokens })
  }),

  // N3: Agent Protocol
  getAgentRegistry: () => request<any[]>('/infrastructure/agents/registry'),
  registerAgent: (data: any) => request<any>('/infrastructure/agents/register', {
    method: 'POST', body: JSON.stringify(data)
  }),
  discoverAgent: (capability: string) => request<any>('/infrastructure/agents/discover', {
    method: 'POST', body: JSON.stringify({ capability })
  }),
  sendAgentMessage: (data: any) => request<any>('/infrastructure/agents/message', {
    method: 'POST', body: JSON.stringify(data)
  }),
  getAgentMessages: (correlationId?: string) => request<any[]>(
    `/infrastructure/agents/messages${correlationId ? `?correlation_id=${correlationId}` : ''}`
  ),

  // N4: Onboarding
  getOnboardingList: () => request<any[]>('/infrastructure/onboarding'),
  getOnboardingStatus: (tenantId: string) => request<any>(`/infrastructure/onboarding/${tenantId}`),
  initiateOnboarding: (data: any) => request<any>('/infrastructure/onboarding', {
    method: 'POST', body: JSON.stringify(data)
  }),
  advanceOnboarding: (tenantId: string) => request<any>(`/infrastructure/onboarding/${tenantId}/advance`, {
    method: 'POST'
  }),
  proposeSchemaMappings: (connectorId: string, sourceFields: any[]) => request<any[]>(
    '/infrastructure/schema-mappings/propose', {
      method: 'POST', body: JSON.stringify({ connector_id: connectorId, source_fields: sourceFields })
    }
  ),
  getSchemaMappings: (connectorId?: string) => request<any[]>(
    `/infrastructure/schema-mappings${connectorId ? `?connector_id=${connectorId}` : ''}`
  ),
  confirmSchemaMapping: (mappingId: string, confirmedBy: string) => request<any>(
    `/infrastructure/schema-mappings/${mappingId}/confirm`, {
      method: 'POST', body: JSON.stringify({ confirmed_by: confirmedBy })
    }
  ),
};
