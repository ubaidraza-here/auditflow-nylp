# Product Requirements Document (PRD)

**Project Name:** AuditFlow  
**Version:** 1.0.0-PROD  
**Target Event:** NYLP AI Hackathon 2026 (Official Build Window: October 17–19, 2026)  
**Authors:** Ubaid Raza (Lead Frontend Architect) & Anushka Samad (Lead Backend Architect)

---

## 1. Executive Problem Statement & Market Opportunity

In enterprise procurement and accounts payable (AP) environments, accounts departments process thousands of supplier invoices each month. Traditional AP workflows rely on human clerks manually comparing line items on an invoice against purchase order (PO) contracts and goods receipt notes — a procedure known as **3-way matching**.

This manual process suffers from fatal structural flaws:
1. **Invoice Creep & Micro-Overcharges:** Suppliers frequently bill unit prices $10 to $40 higher than contracted PO rates or attach uncontracted "fuel", "rush delivery", or "administrative" fees. Because the overall invoice dollar total is within budget tolerance, human reviewers approve them.
2. **Duplicate Submissions & Minor Edits:** Vendors accidentally or maliciously re-submit settled invoices with altered invoice numbers (e.g., adding `-REV` or `-COPY`) or modified billing dates.
3. **Internal Mathematical Inconsistencies:** Rounding errors, improper tax additions, or mismatched subtotal-to-total summations slip through unchecked.
4. **The "LLM Math Failure":** Emerging generative AI tools that attempt to read invoices fail in production because Large Language Models do not possess native arithmetic hardware; they hallucinate floating-point products and sums, introducing catastrophic liability for treasury departments.

**AuditFlow** resolves this crisis with a **Neuro-Symbolic Architecture**: Gemini multimodal models handle high-fidelity optical extraction and semantic line mapping, while an uncompromising, deterministic pure-Python engine performs 100% of the mathematical auditing, cryptographic hashing, and policy enforcement.

---

## 2. Target User Persona

### Primary Persona: Senior Accounts Payable Forensic Auditor
- **Name:** Ubaid Raza
- **Role:** Senior AP Forensic Auditor & Treasury Controller
- **Organization:** Fortune 500 Enterprise / Multi-Entity Corporate Shared Services
- **Key Pain Points:**
  - Auditing high-volume supplier runs is mentally exhausting and repetitive.
  - Fear of missing subtle price increases that aggregate to hundreds of thousands of dollars annually.
  - Tedious manual email drafting to vendors requesting credit memos and itemized explanations.
  - Lack of an immutable audit trail showing why an exception was approved or rejected.
- **Workflow Needs:**
  - A dense, institutional triage ledger with immediate visual flags.
  - A split-screen workbench where the physical invoice and PO baseline can be verified side-by-side with zero context switching.
  - Bounding box optical overlays directly over the disputed line items on the scanned invoice.
  - One-click generation of formal, legally defensible Vendor Discrepancy & Credit Memo notices.

---

## 3. Institutional Key Performance Indicators (KPIs)

The AuditFlow dashboard tracks four core live metrics calculated from the underlying ledger:

| Metric Identifier | Metric Name | Target Baseline Value | Formulation & Meaning |
| :--- | :--- | :--- | :--- |
| `total_audited_volume` | **Total Audited Volume** | **$142,850.00** | Sum of grand totals for all processed invoices across the corporate ledger. |
| `prevented_leakage_amount` | **Prevented Capital Leakage** | **$4,320.50** | Total dollar value of price variances and unauthorized surcharges caught before disbursement. |
| `pending_exceptions_count` | **Pending Exceptions** | **Dynamic Count** | Active count of invoices currently in `EXCEPTION_FLAGGED` status requiring human review. |
| `clean_match_rate_percent` | **Clean 3-Way Match Rate** | **75.0%** | Percentage of invoices cleared with zero variance against PO contracts (`VERIFIED_MATCH` / `APPROVED_CLEAN`). |

---

## 4. Core System Capabilities & Requirements

### 4.1. Cryptographic Ingestion & Binary Deduplication
- Compute SHA-256 hex digest (`hashlib.sha256`) immediately upon upload of any `.pdf`, `.png`, `.jpg`, or `.webp` file.
- Prevent processing of exact binary duplicates before expensive vision API calls occur.
- Frontend pre-hashes bytes using browser Web Crypto API (`crypto.subtle.digest`) for instant client-side telemetry.

### 4.2. Multimodal Extraction & Semantic Line Matching
- Leverage Google GenAI SDK (`gemini-2.5-flash`) at `temperature=0.0` with structured schema enforcement (`ExtractedInvoicePayload`).
- Multi-model automatic cascade to `gemini-2.5-flash-lite`, `gemini-3.5-lite`, and `gemini-2.0-flash-lite` if primary quotas are constrained.
- Context injection: Inject all active ERP POs into the vision prompt, directing the model to semantically associate each invoice line item to its corresponding `po_line_id`.
- Deterministic offline benchmark fallback simulation ensures zero failure during live hackathon demonstrations.

### 4.3. Deterministic 7-Rule Mathematical Auditor
- Pure Python execution with zero LLM arithmetic.
- Evaluates:
  1. `EXACT_FILE_DUPLICATE` (SHA-256 match)
  2. `CRITICAL_FUZZY_DUPLICATE` (Normalized invoice number + vendor match + grand total match)
  3. `INTERNAL_MATH_ERROR` (Quantity * Unit Price math & Subtotal + Tax math)
  4. `MISSING_OR_INVALID_PO` (PO exists in ERP registry)
  5. `UNIT_PRICE_OVERCHARGE`, `QUANTITY_EXCEEDED`, and `UNAPPROVED_LINE_ITEM` (3-way line item match)
  6. `BANK_ACCOUNT_MISMATCH` (Extracted IBAN vs. contracted ERP vendor record)
  7. `LOW_EXTRACTION_CONFIDENCE` (Extraction confidence < 85%)

### 4.4. Split-Screen Forensic Workbench & Optical Overlay
- 50/50 split-screen desktop layout:
  - **Left Pane:** High-resolution document viewer with interactive SVG/HTML bounding box overlays highlighting extracted and disputed lines in amber/rose.
  - **Right Pane:** 3-Way reconciliation comparison grid (Invoice vs. PO vs. Variance), cryptographic metadata inspector, and human-in-the-loop decision console.

### 4.5. Automated Vendor Dispute & Credit Memo Generation
- Automatically synthesize formal, professional dispute notices citing exact line item discrepancies, dollar overruns, PO contract clauses, and 5-day credit memo demands.
- One-click copy to clipboard and modal dispatch simulator.

### 4.6. Quick Audit Command Palette (`⌘K`)
- Accessible anywhere in the application via `⌘K` or `Ctrl+K`.
- Instant search across invoices, vendors, PO numbers, and rapid trigger for benchmark scenarios.

### 4.7. Browser-Side Sample PNG Generator
- On the Upload page, provide a 1-click button to dynamically draw and download realistic test invoices (`Apex Tech Solutions INV-9042`, etc.) via HTML5 Canvas for frictionless testing.
