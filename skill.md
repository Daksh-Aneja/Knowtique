# Knowtique — SKILL.md · Agent Contract Registry
# Version: 3.0 | Classification: PLATFORM-CORE | Generated: 2026-04-30
# Registry: skills.knowtique.io | Protocol: MCP 1.2
# Architecture: L9 Multi-Agent Orchestration Runtime
# Disclosure: Progressive (L1-Metadata → L2-Instructions → L3-Resources)
#
# This file is the canonical skill registry for the Knowtique Epistemic OS.
# Skills are machine-readable, versioned, auditable contracts between the
# Knowledge Base and autonomous AI agents. Each skill compiles from validated
# rules in L3 Polystore via the L8 Skills Compiler Pipeline.
#
# Confidence Tiers:
#   SPECULATIVE (0.0–0.29)        → Log only, never execute
#   INFERRED (0.30–0.59)          → Execute with human confirmation
#   VALIDATED_EMPLOYEE (0.60–0.74) → Execute with post-action logging
#   VALIDATED_DEPARTMENT_HEAD (0.75–0.84) → Execute autonomously, log
#   VERIFIED_AGAINST_OUTCOMES (0.85–1.0)  → Execute at full autonomy
#
# Guardrail Enforcement: Pre-execution checks MUST pass before any step runs.
# Post-execution assertions are validated; failures trigger L10 feedback loop.
# All executions produce provenance entries in L11 Lineage Ledger.

---

## SKILL: handle_refund_request
```yaml
skill: handle_refund_request
department: customer_support
domain: support_cx
version: 2.7
last_validated: 2026-03-15
confidence: 0.91
confidence_tier: VERIFIED_AGAINST_OUTCOMES
execution_count: 1847
success_rate: 0.966
half_life_days: 90
expires_at: null
mcp_tool_bindings:
  - crm_write
  - ticket_update
  - escalation_notify
  - customer_profile_read
access_level: department
compliance_tags: [GDPR, CCPA]

triggers:
  - "customer requests refund"
  - "ticket tagged: billing, refund"
  - "customer mentions: 'want my money back', 'charge reversal', 'cancel and refund'"
  - intent_classifier: REFUND_REQUEST (confidence > 0.75)

guardrails:
  pre_execution:
    - verify: agent_has_crm_write_permission
    - verify: customer_account_not_flagged_fraud
    - check: rate_limit(refunds_per_agent_per_hour) < 20
  post_execution:
    - assert: crm_record_updated
    - assert: customer_notified
    - log: decision_with_reason_code

steps:
  1:
    action: fetch_customer_profile
    tool: crm_read
    params: {fields: [order_age_days, customer_tier, ltv_usd, fraud_flag, refund_history]}
    on_error: escalate_to_senior_support

  2:
    action: check_order_age
    condition: order_age_days > 30
    if_true:
      action: route_to_senior_support
      reason: "Order exceeds 30-day standard refund window"
      requires_human: true
    if_false: continue

  3:
    action: check_customer_tier
    condition: customer_tier == "enterprise" OR customer_tier == "strategic"
    if_true:
      action: flag_escalation_required
      notify: [account_manager, support_manager]
      pause_and_confirm: true

  4:
    action: evaluate_refund_amount
    thresholds:
      tier_auto_approve:   {max_usd: 50,   action: auto_approve, log: true}
      tier_approve_note:   {max_usd: 500,  action: approve_with_note, note_required: true}
      tier_manager:        {min_usd: 500,  action: escalate_to_support_manager, hitl: true}
    confidence_note: "Thresholds validated by Support Manager 2026-02-01 | Source: rule_0218"

  5:
    action: log_decision_crm
    tool: crm_write
    params:
      fields: {resolution_type: "REFUND", reason_code: "{derived}", agent_id: "{caller}", amount: "{refund_amount}"}
    mandatory: true

  6:
    action: notify_customer
    tool: email_send
    template: refund_confirmation_v3
    personalise: true

exceptions:
  - id: ltv_override
    condition: customer_ltv_usd > 10000
    override: "Always approve regardless of amount threshold"
    confidence: 0.88
    source: "47 historical decisions — rule_miner batch 2026-01-12"
    auto_apply: false
    requires_manager_ack: true

  - id: fraud_block
    condition: fraud_flag == true
    override: "Block refund. Route to trust_and_safety team immediately."
    auto_apply: true
    alert_level: P1

  - id: subscription_churn_risk
    condition: churn_risk_score > 0.8 AND refund_amount < 200
    override: "Auto-approve AND trigger retention workflow"
    confidence: 0.79
    requires_validation: true

confidence_notes:
  - "Base threshold ($500) validated by Sarah Chen, Support Manager, 2026-02-01"
  - "LTV override ($10K) inferred from 47 decisions, confidence 0.81, pending dept head review"
  - "Fraud block auto-apply approved by Legal, 2025-11-14"
  - "Churn-risk override added from 23 elicitation responses, awaiting head validation"

provenance:
  primary_sources: [zendesk_ticket_archive_2024, slack_support_channel_decisions, elicitation_batch_12]
  extraction_method: rule_miner_v2 + elicitation_responses
  conflict_history: []
  last_contradiction_check: 2026-04-01
```

---

## SKILL: enterprise_discount_approval
```yaml
skill: enterprise_discount_approval
department: sales
domain: commercial
version: 4.1
last_validated: 2026-04-10
confidence: 0.89
confidence_tier: VALIDATED_DEPARTMENT_HEAD
execution_count: 412
success_rate: 0.941
half_life_days: 30
expires_at: 2026-05-10
mcp_tool_bindings:
  - crm_opportunity_update
  - slack_notify
  - approval_workflow_trigger
  - pricing_engine_read
access_level: role_specific
compliance_tags: [SOX, INTERNAL_AUDIT]

triggers:
  - "discount requested on enterprise deal"
  - "opportunity stage: NEGOTIATION"
  - "CRM field: discount_pct > 0"
  - intent_classifier: DISCOUNT_REQUEST (confidence > 0.80)

guardrails:
  pre_execution:
    - verify: opportunity_exists_in_crm
    - verify: deal_size_confirmed
    - check: rate_card_version_is_current (max_age_days: 90)
  post_execution:
    - assert: approval_chain_documented
    - assert: crm_opportunity_updated_with_approved_discount

steps:
  1:
    action: fetch_opportunity_data
    tool: crm_opportunity_read
    fields: [deal_size_usd, customer_tier, competitive_flag, strategic_account, deal_age_days, requested_discount_pct]

  2:
    action: apply_discount_authority_matrix
    matrix:
      - {max_discount_pct: 5,  authority: account_executive,  auto_approve: true}
      - {max_discount_pct: 10, authority: sales_manager,       hitl: true, sla_hours: 4}
      - {max_discount_pct: 15, authority: vp_sales,            hitl: true, sla_hours: 8}
      - {max_discount_pct: 25, authority: cro,                 hitl: true, sla_hours: 24}
      - {max_discount_pct: 99, authority: ceo,                 hitl: true, sla_hours: 48}
    confidence_note: "Matrix confirmed by CRO office 2026-03-01 | rule_0445"

  3:
    action: check_competitive_pressure
    condition: competitive_flag == true AND requested_discount_pct <= authority_level + 5
    if_true:
      action: allow_competitive_override
      requires: [sales_manager_approval, competitive_intel_attachment]
      note: "Competitive exception permits +5% above standard authority level"

  4:
    action: trigger_approval_workflow
    tool: approval_workflow_trigger
    params:
      approver: "{derived_authority}"
      deadline_hours: "{sla_hours}"
      deal_context: "{opportunity_summary}"
      escalation_on_timeout: true

  5:
    action: update_crm_opportunity
    tool: crm_opportunity_update
    fields: {approved_discount_pct: "{approved}", approval_chain: "{chain}", discount_rationale: "{reason}"}

exceptions:
  - id: strategic_account_override
    condition: strategic_account == true AND requested_discount_pct <= 20
    override: "VP Sales auto-notified; CRO approval waived for strategic accounts ≤20%"
    confidence: 0.83
    source: "12 CRO approval emails, rule_miner 2026-02-08"

  - id: end_of_quarter_push
    condition: days_to_quarter_end <= 14 AND deal_size_usd >= 500000
    override: "CRO may approve additional 5% — trigger urgent approval path"
    confidence: 0.71
    requires_validation: true
    auto_apply: false

confidence_notes:
  - "Authority matrix last reviewed by CRO office 2026-03-01"
  - "Competitive override inferred from 31 approved exceptions — pending re-validation"
  - "EOQ rule: confidence below threshold — human confirmation required before execution"
```

---

## SKILL: incident_escalation_p1
```yaml
skill: incident_escalation_p1
department: engineering
domain: incident_management
version: 3.3
last_validated: 2026-04-05
confidence: 0.94
confidence_tier: VERIFIED_AGAINST_OUTCOMES
execution_count: 2204
success_rate: 0.983
half_life_days: 90
mcp_tool_bindings:
  - pagerduty_alert
  - slack_incident_channel
  - statuspage_update
  - jira_incident_create
  - war_room_spin_up
access_level: department
compliance_tags: [SOC2, INTERNAL_SLA]

triggers:
  - "error rate > 5% for > 3 minutes"
  - "p99 latency > 5000ms sustained"
  - "service health check: CRITICAL"
  - "on-call engineer manually declares P1"
  - monitoring_alert: severity == P1

guardrails:
  pre_execution:
    - verify: incident_not_already_declared (dedup_window_minutes: 10)
  post_execution:
    - assert: war_room_created
    - assert: on_call_notified
    - assert: statuspage_updated
    - assert: jira_ticket_created

steps:
  1:
    action: classify_incident_severity
    inputs: [error_rate, latency_p99, affected_services, customer_impact_count]
    classification_rules:
      P1: "Customer-facing outage OR error_rate > 10% OR revenue-impacted"
      P2: "Degraded performance, <10% users affected, no revenue impact"
    on_P2: redirect_to_skill/incident_escalation_p2

  2:
    action: spin_up_war_room
    tool: slack_incident_channel
    params:
      channel_name: "incident-{date}-{short_id}"
      auto_invite: [on_call_engineer, engineering_manager, sre_lead]
      pin_message: incident_runbook_link

  3:
    action: page_on_call_engineer
    tool: pagerduty_alert
    params:
      escalation_policy: primary_on_call
      message: "P1 INCIDENT: {incident_summary}"
      ack_timeout_minutes: 5
    on_no_ack:
      action: escalate_to_secondary_on_call
      then: escalate_to_engineering_manager (if no ack in 10 min)

  4:
    action: update_status_page
    tool: statuspage_update
    status: INVESTIGATING
    message: "We are aware of an issue affecting {affected_service}. Our team is investigating."
    auto_update_interval_minutes: 15

  5:
    action: create_jira_incident_ticket
    tool: jira_incident_create
    fields:
      priority: P1
      assignee: on_call_engineer
      labels: [incident, p1, requires_postmortem]
      linked_alerts: "{monitoring_alert_ids}"

  6:
    action: start_incident_timer
    milestones:
      - {minutes: 15, action: "Require first update in war room"}
      - {minutes: 30, action: "Escalate to VP Engineering if not mitigated"}
      - {minutes: 60, action: "Executive notification required (CTO)"}
      - {minutes: 120, action: "Crisis protocol — CEO informed"}

exceptions:
  - id: maintenance_window
    condition: active_maintenance_window == true
    override: "Suppress P1 alert. Log incident. Notify maintenance lead only."
    auto_apply: true

  - id: known_issue_in_progress
    condition: related_known_issue_exists == true AND mitigation_in_progress == true
    override: "Link to existing incident. No new war room. Update existing ticket."
    auto_apply: true

confidence_notes:
  - "Escalation timing (30min/60min/120min) validated by VP Engineering 2025-12-01"
  - "Maintenance window suppression approved by SRE lead 2025-10-15"
  - "On-call ack timeout (5 min) confirmed across 2204 executions — 98.3% ack rate"
```

---

## SKILL: vendor_payment_approval
```yaml
skill: vendor_payment_approval
department: finance
domain: accounts_payable
version: 2.1
last_validated: 2026-03-20
confidence: 0.87
confidence_tier: VALIDATED_DEPARTMENT_HEAD
execution_count: 893
success_rate: 0.951
half_life_days: 180
mcp_tool_bindings:
  - erp_payment_queue
  - vendor_master_read
  - budget_ledger_read
  - approval_workflow_trigger
  - audit_log_write
access_level: role_specific
compliance_tags: [SOX, GAAP, PCI_DSS]

triggers:
  - "invoice submitted for payment"
  - "AP queue: payment_pending"
  - "vendor payment request received"

guardrails:
  pre_execution:
    - verify: vendor_exists_in_master_vendor_list
    - verify: invoice_not_duplicate (check_window_days: 90)
    - verify: purchase_order_exists_and_matches
    - check: budget_available_for_cost_center
  post_execution:
    - assert: payment_logged_in_erp
    - assert: audit_trail_written
    - assert: approver_chain_documented

steps:
  1:
    action: validate_invoice
    checks:
      - vendor_id_matches_po
      - amount_within_5pct_of_po
      - payment_terms_compliant (net30_standard)
      - tax_id_on_file
    on_validation_fail: route_to_ap_specialist

  2:
    action: apply_payment_authority_matrix
    matrix:
      - {max_usd: 5000,    authority: ap_specialist,       auto_approve: true}
      - {max_usd: 25000,   authority: finance_manager,      hitl: true, sla_hours: 8}
      - {max_usd: 100000,  authority: vp_finance,           hitl: true, sla_hours: 24}
      - {max_usd: 500000,  authority: cfo,                  hitl: true, sla_hours: 48}
      - {min_usd: 500001,  authority: cfo_plus_board_chair, hitl: true, sla_hours: 72}

  3:
    action: check_budget_availability
    tool: budget_ledger_read
    condition: available_budget < payment_amount
    if_true:
      action: flag_budget_exception
      notify: finance_manager
      block_payment: true
      create_budget_exception_request: true

  4:
    action: trigger_approval_chain
    tool: approval_workflow_trigger
    params:
      approver: "{derived_authority}"
      invoice_package: "{invoice_pdf, po_reference, budget_availability}"
      sla_hours: "{sla}"

  5:
    action: execute_payment
    tool: erp_payment_queue
    condition: all_approvals_received == true
    params:
      payment_method: "{vendor_preferred_method}"
      payment_date: "{next_batch_date}"

  6:
    action: write_audit_log
    tool: audit_log_write
    mandatory: true
    fields: {invoice_id, amount, approver_chain, payment_date, budget_impact}
    tamper_evident: true

exceptions:
  - id: emergency_vendor_payment
    condition: vendor_category == "critical_infrastructure" AND service_disruption_risk == true
    override: "CFO emergency approval path — 4-hour SLA — no budget block"
    requires: cfo_verbal_confirmation
    confidence: 0.82

  - id: duplicate_detected
    condition: duplicate_invoice_detected == true
    override: "Block immediately. Alert AP manager. Do not process."
    auto_apply: true
    alert_level: P1

confidence_notes:
  - "Payment matrix approved by CFO 2026-01-15. Next review: 2026-07-15"
  - "Emergency path: 3 precedents — CFO-approved. Confidence below threshold, HITL required."
```

---

## SKILL: new_hire_onboarding_trigger
```yaml
skill: new_hire_onboarding_trigger
department: human_resources
domain: employee_lifecycle
version: 1.9
last_validated: 2026-02-28
confidence: 0.86
confidence_tier: VALIDATED_DEPARTMENT_HEAD
execution_count: 341
success_rate: 0.971
half_life_days: 180
mcp_tool_bindings:
  - hris_read
  - it_provisioning_request
  - slack_workspace_invite
  - calendar_schedule
  - buddy_assignment_system
  - compliance_training_enrol
access_level: department
compliance_tags: [I9, EEOC, SOC2]

triggers:
  - "new hire record created in HRIS"
  - "offer_status = ACCEPTED AND start_date within 14 days"
  - "onboarding_workflow_not_initiated == true"

steps:
  1:
    action: verify_hire_record_completeness
    required_fields: [legal_name, start_date, role, department, manager_id, location, employment_type]
    on_incomplete: alert_hr_coordinator

  2:
    action: trigger_it_provisioning
    tool: it_provisioning_request
    timeline_days_before_start: 5
    provision:
      - laptop (spec_by_role: {engineering: "MacBook Pro M4", default: "Dell XPS"})
      - email_account
      - slack_workspace
      - role_based_software_bundle
      - vpn_credentials
      - building_access_card_request

  3:
    action: assign_onboarding_buddy
    tool: buddy_assignment_system
    criteria:
      - same_department: true
      - tenure_months: ">= 6"
      - buddy_availability: not_on_leave
      - geographic_match: preferred
    notify_buddy: true
    buddy_briefing_doc: auto_generate

  4:
    action: schedule_onboarding_week
    tool: calendar_schedule
    events:
      day1: [hr_orientation_90min, it_setup_60min, manager_1on1_30min]
      day2: [department_intro_60min, buddy_lunch_60min]
      day3: [product_overview_90min, tool_training_60min]
      day4: [cross_functional_intros_60min]
      day5: [culture_session_60min, week1_retro_with_manager_30min]

  5:
    action: enrol_mandatory_compliance_training
    tool: compliance_training_enrol
    courses:
      - security_awareness (deadline_days: 7)
      - code_of_conduct (deadline_days: 7)
      - data_privacy_gdpr (deadline_days: 14)
      - anti_harassment (deadline_days: 30)
      - role_specific_courses: "{by_department}"

  6:
    action: create_30_60_90_day_plan
    generate_via_llm: true
    template_by_role: true
    manager_review_required: true
    schedule_checkin_at: [day_30, day_60, day_90]

exceptions:
  - id: executive_hire
    condition: job_level >= "VP"
    override: "CHRO personally oversees onboarding. Executive concierge service activated."
    auto_apply: true

  - id: remote_international_hire
    condition: location_country != company_hq_country
    override: "Add international employment compliance checklist. Legal review of local requirements."
    confidence: 0.84

confidence_notes:
  - "IT provisioning timeline (5 days) from 341 executions — 97.1% on-time delivery"
  - "Compliance training deadlines reviewed by Legal 2026-01-20"
  - "Executive onboarding path: CHRO-validated 2025-10-08"
```

---

## SKILL: sales_deal_qualification
```yaml
skill: sales_deal_qualification
department: sales
domain: pipeline_management
version: 3.0
last_validated: 2026-04-01
confidence: 0.88
confidence_tier: VERIFIED_AGAINST_OUTCOMES
execution_count: 678
success_rate: 0.891
half_life_days: 60
mcp_tool_bindings:
  - crm_opportunity_update
  - sales_intel_read
  - competitive_intel_read
  - slack_notify_sales_manager
access_level: department
compliance_tags: []

triggers:
  - "new opportunity created in CRM"
  - "opportunity stage: DISCOVERY"
  - "sales rep requests deal qualification"

qualification_framework: MEDDPICC

steps:
  1:
    action: score_meddpicc
    dimensions:
      metrics:
        question: "Is the economic impact of solving this problem quantified?"
        scoring: {defined_roi: 3, estimated_roi: 2, no_roi: 0}
      economic_buyer:
        question: "Have we identified and met the economic buyer?"
        scoring: {met_confirmed: 3, identified_not_met: 1, unknown: 0}
      decision_criteria:
        question: "Do we understand their evaluation criteria?"
        scoring: {formal_criteria_obtained: 3, informal_understanding: 1, unknown: 0}
      decision_process:
        question: "Do we know the buying process and timeline?"
        scoring: {documented: 3, verbal_understanding: 1, unknown: 0}
      paper_process:
        question: "Do we understand procurement and legal requirements?"
        scoring: {requirements_known: 3, partial: 1, unknown: 0}
      identified_pain:
        question: "Is the business pain formally documented?"
        scoring: {quantified_pain: 3, qualitative_pain: 1, unknown: 0}
      champion:
        question: "Do we have an internal champion who will fight for us?"
        scoring: {strong_champion: 3, potential_champion: 1, no_champion: 0}
      competition:
        question: "Do we understand the competitive landscape?"
        scoring: {full_intel: 3, partial: 1, unknown: 0}

  2:
    action: classify_deal_quality
    score_thresholds:
      STRONG:   {min_score: 18, action: advance_to_solution, probability_pct: 70}
      MODERATE: {min_score: 12, action: continue_with_gaps_to_fill, probability_pct: 40}
      WEAK:     {min_score: 6,  action: flag_for_manager_review, probability_pct: 20}
      NO_GO:    {max_score: 5,  action: recommend_no_pursue, probability_pct: 5}

  3:
    action: identify_qualification_gaps
    output: gap_report_by_dimension
    trigger_elicitation_for_gaps: true

  4:
    action: update_crm_opportunity
    tool: crm_opportunity_update
    fields:
      meddpicc_score: "{total}"
      deal_quality: "{classification}"
      win_probability: "{probability_pct}"
      qualification_gaps: "{gap_report}"
      next_action: "{recommended_action}"

  5:
    action: notify_sales_manager
    condition: deal_quality == "WEAK" OR deal_quality == "NO_GO"
    tool: slack_notify_sales_manager
    message_template: deal_qualification_review_required

exceptions:
  - id: strategic_account_override
    condition: account_is_strategic == true AND deal_quality == "WEAK"
    override: "Do not auto-recommend no-pursue. Escalate to VP Sales for manual review."
    confidence: 0.91

confidence_notes:
  - "MEDDPICC scoring validated by Sales Leadership 2026-02-15"
  - "Probability thresholds calibrated against 678 historical outcomes — 89.1% accuracy"
  - "Strategic account override: VP Sales directive 2025-11-20"
```

---

## META: Skill Registry Index
```yaml
registry:
  version: 3.0
  last_updated: 2026-04-30
  total_skills: 6
  total_executions: 6375
  avg_success_rate: 0.951

skills:
  - id: handle_refund_request
    dept: customer_support
    confidence: 0.91
    executions: 1847
    status: ACTIVE

  - id: enterprise_discount_approval
    dept: sales
    confidence: 0.89
    executions: 412
    status: ACTIVE_EXPIRING_SOON
    expires_at: 2026-05-10

  - id: incident_escalation_p1
    dept: engineering
    confidence: 0.94
    executions: 2204
    status: ACTIVE

  - id: vendor_payment_approval
    dept: finance
    confidence: 0.87
    executions: 893
    status: ACTIVE

  - id: new_hire_onboarding_trigger
    dept: human_resources
    confidence: 0.86
    executions: 341
    status: ACTIVE

  - id: sales_deal_qualification
    dept: sales
    confidence: 0.88
    executions: 678
    status: ACTIVE
```
