# Data Dictionary & JSON API Contract

**Project Name:** AuditFlow  
**Governing Standard:** Immutable REST JSON Specification between Frontend (`/frontend`) and Backend (`/backend`)  
**Base URL:** `http://localhost:5000`

---

## 1. Type Primitives & Common Enums

### InvoiceStatus Enum
- `"VERIFIED_MATCH"` — Automated audit passed 100% with zero rule violations.
- `"EXCEPTION_FLAGGED"` — At least one audit rule triggered; pending auditor action.
- `"APPROVED_CLEAN"` — Human auditor cleared a verified match for payment.
- `"APPROVED_WITH_OVERRIDE"` — Human auditor manually approved an exception with documented business justification.
- `"REJECTED_DISPUTED"` — Human auditor rejected invoice; payment halted; dispute notice issued.

### RuleSeverity Enum
- `"CRITICAL"` — Blocks payment entirely (Unit price overcharges, duplicate invoices, bank mismatch, math failure).
- `"HIGH"` — Missing PO reference, quantity exceeded, unapproved line items.
- `"WARNING"` — Low vision extraction confidence (< 0.85), minor tax discrepancies (< $1.00).

---

## 2. Core Entity Schemas

### 2.1. LineItem Schema
```typescript
interface LineItem {
  line_number: number;               // e.g. 1
  description: string;               // e.g. "27-inch IPS Monitor Panel"
  quantity: number;                  // e.g. 10.0
  unit_price: number;                // e.g. 250.00
  line_total: number;                // e.g. 2500.00
  matched_po_line_id: string | null; // e.g. "POL-102-1" or null if unapproved
  bounding_box?: {                   // Optional normalized coordinates [ymin, xmin, ymax, xmax] 0-1000
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
}
```

### 2.2. DiscrepancyRuleResult Schema
```typescript
interface DiscrepancyRuleResult {
  rule_code: string;                 // e.g. "UNIT_PRICE_OVERCHARGE", "EXACT_FILE_DUPLICATE"
  rule_name: string;                 // e.g. "Unit Price Overcharge"
  severity: "CRITICAL" | "HIGH" | "WARNING";
  triggered: boolean;                // true if rule condition met
  message: string;                   // Human-readable diagnostic
  variance_amount: number;           // Dollar variance associated with violation (e.g. 400.00)
  affected_line_number?: number;     // Line index if applicable
}
```

### 2.3. Full Invoice Record Schema (`InvoiceDetail`)
```typescript
interface InvoiceRecord {
  id: string;                        // Internal primary key, e.g. "inv_1002"
  invoice_number: string;            // Vendor invoice number, e.g. "INV-9042"
  vendor_name: string;               // e.g. "Apex Tech Solutions"
  vendor_ntn: string;                // e.g. "NTN-8839201-4"
  vendor_email: string;              // e.g. "billing@apextech.com"
  bank_account_or_iban: string;      // e.g. "PK36SCBL00000011223344"
  invoice_date: string;              // ISO format: "2026-10-14"
  due_date: string;                  // ISO format: "2026-11-13"
  po_reference: string;              // e.g. "PO-2026-102"
  currency: string;                  // Default "USD" ($)
  
  // Financial Totals
  subtotal: number;                  // e.g. 2900.00
  tax_total: number;                 // e.g. 0.00
  discount_amount: number;           // e.g. 0.00
  grand_total: number;               // e.g. 2950.00
  
  // Auditing & Baseline Comparisons
  po_baseline_grand_total: number;   // e.g. 2500.00
  total_variance_amount: number;     // grand_total - po_baseline_grand_total (e.g. 450.00)
  status: InvoiceStatus;
  confidence_score: number;          // Range 0.0 to 1.0 (e.g. 0.98)
  sha256_hash: string;               // Hex digest e.g. "3f98a2..."
  file_name: string;                 // e.g. "INV-9042_ApexTech.png"
  
  // Line Items & Rules
  line_items: LineItem[];
  rule_evaluations: DiscrepancyRuleResult[];
  
  // Human Reviewer Audit State
  reviewer_name?: string | null;     // e.g. "Ubaid Raza"
  reviewed_at?: string | null;       // ISO timestamp
  override_reason?: string | null;   // Mandatory if approved with override
  dispute_memo?: string | null;      // Generated email text
}
```

---

## 3. REST API Endpoint Specifications

### 3.1. `GET /api/health`
- **Purpose:** System readiness, Gemini SDK telemetry, and model cascade diagnostics.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "gemini_configured": true,
  "extraction_model": "gemini-2.5-flash",
  "fallback_model": "gemini-2.5-flash-lite",
  "server_time": "2026-10-17T14:30:00Z"
}
```

---

### 3.2. `GET /api/dashboard/summary`
- **Purpose:** Supplies high-level KPI cards and triage ledger table.
- **Response `200 OK`:**
```json
{
  "kpis": {
    "total_audited_volume": 142850.00,
    "prevented_leakage_amount": 4320.50,
    "pending_exceptions_count": 2,
    "clean_match_rate_percent": 75.0
  },
  "invoices": [
    {
      "id": "inv_1002",
      "invoice_number": "INV-9042",
      "vendor_name": "Apex Tech Solutions",
      "po_reference": "PO-2026-102",
      "invoice_date": "2026-10-14",
      "grand_total": 2950.00,
      "po_baseline_grand_total": 2500.00,
      "total_variance_amount": 450.00,
      "status": "EXCEPTION_FLAGGED",
      "triggered_rules_count": 2,
      "primary_flag": "UNIT_PRICE_OVERCHARGE",
      "confidence_score": 0.98,
      "sha256_hash": "a4f89d31..."
    }
  ]
}
```

---

### 3.3. `GET /api/invoices/{invoice_id}`
- **Dual Lookup Contract:** Accepts internal UUID/slug (e.g. `inv_1002`) OR formal invoice number (e.g. `INV-9042`). Case-insensitive.
- **Response `200 OK`:** Returns full `InvoiceRecord` entity.
- **Response `404 Not Found`:** `{"detail": "Invoice not found in ledger"}`.

---

### 3.4. `POST /api/invoices/analyze`
- **Dual Ingestion Mode:** Accepts EITHER:
  1. **JSON Body for 1-Click Benchmark Scenarios:**
     ```json
     { "demo_scenario_id": "SCENARIO_B_OVERCHARGE" }
     ```
     *(Valid IDs: `SCENARIO_A_CLEAN`, `SCENARIO_B_OVERCHARGE`, `SCENARIO_C_DUPLICATE`)*
  2. **Multipart Form-Data for File Upload:**
     - `file`: Binary file (`.pdf`, `.png`, `.jpg`, `.webp`)
     - `client_sha256`: Optional client-computed Web Crypto hash for telemetry.
- **Response `201 Created` or `200 OK`:**
```json
{
  "success": true,
  "stage_telemetry": {
    "stage1_sha256": "a4f89d31...",
    "stage1_duplicate_detected": false,
    "stage2_model_used": "gemini-2.5-flash",
    "stage2_extraction_latency_ms": 1420,
    "stage3_rules_evaluated": 7,
    "stage3_violations_found": 2
  },
  "invoice": { /* Full InvoiceRecord */ }
}
```

---

### 3.5. `POST /api/invoices/{invoice_id}/decision`
- **Purpose:** Records human-in-the-loop audit decision.
- **Request Body:**
```json
{
  "decision": "APPROVE_CLEAN" | "APPROVE_WITH_OVERRIDE" | "REJECT_DISPUTE",
  "reviewer_name": "Ubaid Raza",
  "override_reason": "Executive CTO pre-approval for expedited shipping on Project Titan.",
  "dispute_email_body": "Optional updated dispute text"
}
```
- **Validation Rules:** If `decision == "APPROVE_WITH_OVERRIDE"`, `override_reason` must not be null and must be >= 10 characters.
- **Response `200 OK`:** Returns updated `InvoiceRecord` and audit trail entry.

---

### 3.6. `POST /api/invoices/{invoice_id}/reset` & `POST /api/invoices/reset`
- **Purpose:** Restores specific invoice or entire ledger to clean seed state for live hackathon judge testing.
- **Response `200 OK`:** `{"status": "ledger_reseeded", "invoices_count": 6}`.

---

### 3.7. Secondary Endpoints
- `GET /api/purchase-orders`: Returns array of active ERP PO baselines.
- `GET /api/audit-logs`: Returns chronological immutable ledger event logs.
- `GET /api/audit-logs/export.csv`: Generates downloadable RFC 4180 CSV export.
- `GET /api/invoices/{invoice_id}/export`: Generates downloadable forensic summary JSON/Text package.
