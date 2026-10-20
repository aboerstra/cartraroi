# Manus Research Playbook for Building a Carry-On-Style ROI Calculator

## 1) Objective

Use this guide to run a **repeatable research workflow** with Manus so you can produce calculator-ready inputs for any company.

The end goal is to generate:
- a validated baseline of current performance,
- high-confidence assumptions for change,
- scenario forecasts (conservative / expected / aggressive), and
- a structured metric set that can be implemented in an ROI calculator.

---

## 2) What “Good” Looks Like

A successful Manus run produces outputs that are:
1. **Decision-useful**: directly tied to business outcomes (revenue, cost, risk, time).
2. **Calculator-ready**: normalized units, clear formulas, explicit assumptions.
3. **Source-backed**: every key figure linked to a citation and confidence rating.
4. **Scenario-capable**: supports sensitivity testing and multi-variable forecasts.

---

## 3) Inputs You Provide to Manus (Company Profile Packet)

Before running Manus, provide a profile with as many of the following as possible:

### A. Company Context
- Company name, business model, product/service lines
- Geographies and segments served
- Approximate size (revenue, employees, locations)
- Strategic priorities (growth, margin, compliance, CX, etc.)

### B. Operating Model
- Core workflows (e.g., sales, service, production, fulfillment)
- Current systems stack (CRM, ERP, data tools, mobile tools)
- Current process pain points

### C. Buyer/Customer Context
- ICPs/personas and top use cases
- Typical customer journey stages
- Conversion and retention challenges

### D. Financial & KPI Hints (if available)
- Revenue composition, gross margin ranges
- Volume metrics (leads, orders, units, claims, tickets)
- Productivity metrics (cycle time, touches, throughput)
- Quality/risk metrics (error rates, rework, compliance events)

### E. Initiative Scope
- What intervention is being modeled (new app/process/automation/etc.)
- Deployment scope (team/site/region/enterprise)
- Timeline and constraints

---

## 4) Manus Operating Instructions (Master Prompt)

Use this as the default instruction block:

```text
You are a research analyst supporting ROI calculator design.

Task: Given the company profile, produce a calculator-ready research package that includes:
1) company/industry context,
2) competitive position,
3) customer journey economics,
4) baseline metric architecture,
5) scenario assumptions for projected change,
6) sensitivity analysis guidance,
7) source-backed confidence scoring.

Requirements:
- Quantify all metrics with units and time windows.
- Separate observed facts vs inferred assumptions.
- Provide conservative/expected/aggressive assumptions.
- Include formulas and variable definitions for each KPI.
- Flag missing data and propose proxy benchmarks.
- Cite sources for all external numbers.
- Return outputs in the exact table schemas requested.
```

---

## 5) Research Workflow (Phase-by-Phase)

## Phase 1 — Company & Operating Model Baseline
Ask Manus to produce:
- Value chain map (where value is created/lost)
- Core process map (current-state journey)
- Top bottlenecks and their measurable impact

**Output target:** list of candidate value drivers tied to measurable KPIs.

## Phase 2 — Industry Economics & Benchmarking
Ask Manus to gather:
- Industry norms for conversion, cycle time, error rates, labor productivity, margin structure
- Regulatory/compliance risk factors (if relevant)
- Typical ranges by company maturity

**Output target:** benchmark ranges and proxy inputs for gaps.

## Phase 3 — Competitive Position
Ask Manus to map:
- Key competitors/substitutes
- Relative strengths/weaknesses by capability
- Strategic differentiation opportunities tied to measurable outcomes

**Output target:** priority improvement levers with strategic rationale.

## Phase 4 — Customer Journey Economics
Ask Manus to quantify each stage:
- Awareness → consideration → purchase → onboarding → retention/expansion
- Stage conversion rates, cycle times, drop-off points, support burden

**Output target:** where journey improvements create most economic lift.

## Phase 5 — Baseline KPI Architecture
Ask Manus to define:
- Input variables, formulas, dependencies, units, cadence
- Baseline values, ranges, confidence score per metric
- Data source map (system, owner, quality notes)

**Output target:** calculator data dictionary and baseline dataset.

## Phase 6 — Forecast Scenarios
Ask Manus to build:
- Conservative / Expected / Aggressive scenario assumptions
- Change vectors by driver (e.g., conversion +3%, cycle time -20%)
- Modeled effect by metric and total value

**Output target:** scenario matrix ready for calculator ingestion.

## Phase 7 — Sensitivity & Prioritization
Ask Manus to run:
- One-variable sensitivity (tornado-style ranking)
- Multi-variable scenario combinations
- Break-even and payback thresholds

**Output target:** ranked “highest-impact drivers” and thresholds.

---

## 6) ROI Metric Framework (Use This Structure)

Organize metrics into these buckets:

1. **Revenue / Conversion**
   - Lead-to-opportunity rate
   - Opportunity-to-close rate
   - Average deal/order value
   - Retention/churn impacts

2. **Productivity / Throughput**
   - Time per transaction/case/unit
   - Units per FTE
   - Touches/interventions per workflow

3. **Quality / Risk / Compliance**
   - Error rate, rework rate
   - SLA miss rate
   - Compliance incident frequency/severity

4. **Cost Structure**
   - Labor cost per unit/outcome
   - Tooling/hardware/software costs
   - Maintenance/support overhead

5. **Financial Outputs**
   - Annual benefit ($)
   - Annual recurring cost ($)
   - One-time implementation cost ($)
   - Net annual value, payback period, ROI %, NPV (optional)

---

## 7) Required Output Schemas (What Manus Must Return)

## Table A — Metric Dictionary

| metric_id | metric_name | category | formula | numerator | denominator | unit | time_window | owner | source_type | confidence (1-5) |
|---|---|---|---|---|---|---|---|---|---|---|

## Table B — Baseline Values

| metric_id | baseline_value | baseline_min | baseline_max | period | source | source_date | confidence (1-5) | notes |
|---|---:|---:|---:|---|---|---|---:|---|

## Table C — Scenario Assumptions

| scenario | metric_id | change_type (abs/% ) | delta_value | rationale | source/proxy | confidence (1-5) |
|---|---|---|---:|---|---|---:|

## Table D — Financial Impact Summary

| scenario | annual_benefit_usd | annual_cost_usd | one_time_cost_usd | net_annual_value_usd | payback_months | roi_percent |
|---|---:|---:|---:|---:|---:|---:|

## Table E — Sensitivity Ranking

| rank | driver_metric_id | tested_range | impact_on_net_value_usd | impact_on_payback_months | interpretation |
|---:|---|---|---:|---:|---|

## Table F — Source & Evidence Log

| claim_id | metric_id | claim_text | source_url_or_doc | source_type (primary/secondary/proxy) | reliability_note |
|---|---|---|---|---|---|

---

## 8) Calculator Logic Requirements

Instruct Manus to ensure all modeled outputs support:

1. **Baseline vs Future State comparison**
2. **Scenario switching** (conservative/expected/aggressive)
3. **Sensitivity testing** (single variable and grouped variables)
4. **Value-driver traceability** (which assumption drives which output)
5. **Auditability** (every key assumption tied to evidence)

---

## 9) Standard Assumption Rules

To keep models credible:

1. Use primary company data first, external benchmarks second.
2. Distinguish:
   - **Observed** (directly sourced)
   - **Estimated** (inferred from proxies)
3. Apply confidence scores:
   - 5 = strong internal source
   - 4 = strong public source
   - 3 = reasonable proxy
   - 2 = weak proxy/older source
   - 1 = directional only
4. For low-confidence metrics (≤2), require a validation note.
5. Keep units consistent (monthly/quarterly/annual conversions explicit).

---

## 10) Prompt Pack by Phase (Copy/Paste)

## Prompt 1 — Company + Operating Baseline
```text
Using the provided company profile, map the end-to-end operating model and identify the top 8 measurable value leak points.
For each leak point, include affected KPI, estimated current impact, and likely root cause.
Return as a structured table.
```

## Prompt 2 — Industry Benchmarks
```text
Research industry benchmark ranges for conversion, cycle time, error/rework, labor productivity, and margin structure relevant to this company.
Include source citations, publication dates, and reliability notes.
Return benchmark min/median/max values.
```

## Prompt 3 — Competitive Position
```text
Assess this company’s competitive position across capability areas that affect ROI outcomes.
Identify where performance likely lags/leads peers and estimate impact magnitude by KPI.
Return prioritized opportunities with confidence scores.
```

## Prompt 4 — Customer Journey Economics
```text
Build a stage-by-stage customer journey economics model.
For each stage, provide conversion rate, average cycle time, primary friction points, and economic impact of improving that stage.
Include formulas.
```

## Prompt 5 — Baseline KPI Dataset
```text
Produce the Metric Dictionary (Table A) and Baseline Values (Table B) using the required schemas.
Normalize units and include confidence scoring and source logging.
```

## Prompt 6 — Scenario Build
```text
Create conservative, expected, and aggressive scenarios using the baseline dataset.
Populate Scenario Assumptions (Table C) and Financial Impact Summary (Table D).
Explain rationale for each changed driver.
```

## Prompt 7 — Sensitivity & Break-even
```text
Run sensitivity analysis and rank top value drivers using Table E.
Show break-even thresholds and identify which assumptions most influence payback and ROI.
```

---

## 11) Handoff Format for Calculator Build

Require Manus to provide final deliverables as:

1. **Narrative summary (max 2 pages)**
   - key findings, key drivers, risks

2. **Structured tables (CSV/JSON ready)**
   - Tables A–F exactly as defined

3. **Implementation map**
   - input fields required in UI
   - formulas required in engine
   - scenario toggles and sensitivity controls

4. **Validation queue**
   - list of assumptions needing customer confirmation
   - minimum data required before production use

---

## 12) Acceptance Checklist (Use Before Build)

- [ ] All critical KPIs have formulas, units, and sources
- [ ] Baseline values include ranges and confidence scores
- [ ] 3 scenarios are complete and financially consistent
- [ ] Sensitivity ranking identifies top 5 value drivers
- [ ] Payback and ROI are traceable to assumptions
- [ ] Low-confidence assumptions are clearly flagged
- [ ] Output tables are calculator-ingestion ready

---

## 13) Optional: Minimal Company Intake Template

Use this template with each new target company:

```text
Company Name:
Industry/Sub-industry:
Business Model:
Primary Buyer Types:
Core Journey Stages:
Known Operational Pain Points:
Known KPI Baselines:
Current Tech Stack:
Planned Initiative Scope:
Rollout Scope and Timeline:
Financial Constraints / Hurdles:
Available Internal Data Sources:
```

---

## 14) Practical Guidance for Best Results

- Start broad, then narrow to 8–12 core drivers.
- Prioritize variables with both high impact and controllability.
- Keep one “credible” model first; expand complexity second.
- If data quality is weak, publish a staged model:
  - **Phase 1:** benchmark-informed directional model
  - **Phase 2:** customer-validated calibrated model

This ensures you can move quickly while preserving analytical credibility.