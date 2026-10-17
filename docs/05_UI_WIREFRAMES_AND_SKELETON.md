# UI Wireframes, Layout Geometry & Component Tree

**Project Name:** AuditFlow  
**Design System Standard:** Nordic Institutional Banking  
**Stitch Source Project:** `projects/9814179004934823205` ("AuditFlow Financial Forensics Ledger")  
**Frontend Lead:** Ubaid Raza

---

## 1. Design System Tokens & Geometry Contract

All UI components must strictly adhere to the Nordic Institutional Banking design tokens:

| Token Category | Token Variable | Tailwind Utility / CSS | Hex / Value |
| :--- | :--- | :--- | :--- |
| **Canvas** | App Canvas Background | `bg-[#F4F6F8]` | `#F4F6F8` (Cool Architectural Porcelain) |
| **Surfaces** | Card & Table Surface | `bg-white` | `#FFFFFF` |
| | Sub-header & Nav Surface | `bg-[#F1F5F9]` / `bg-[#F8FAFC]` | `#F1F5F9` / `#F8FAFC` |
| **Borders** | Institutional Hairline | `border border-[#E2E8F0]` | `#E2E8F0` (1px solid) |
| | Sub-divider | `border-[#F1F5F9]` | `#F1F5F9` |
| **Primary Accent** | Deep Fjord Navy | `bg-[#0A2540]`, `text-[#0A2540]` | `#0A2540` |
| | Oxford Blue (Hover) | `hover:bg-[#1E3A5F]` | `#1E3A5F` |
| **Typography** | Primary Institutional Font | `font-sans` | `Inter, -apple-system, sans-serif` |
| | Currency Tabular Figures | `font-sans tabular-nums` | `font-variant-numeric: tabular-nums` |
| | Machine Codes & Hashes | `font-mono` | `JetBrains Mono, monospace` |
| **Status: Clean** | Verified / Active Tag | `bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]` | Dot: `#16A34A` (`w-1.5 h-1.5 rounded-full`) |
| **Status: Flagged**| Disputed / Overcharge Tag | `bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]` | Dot: `#DC2626` (`w-1.5 h-1.5 rounded-full`) |
| **Status: Warning**| Unapproved / Missing Tag | `bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]` | Dot: `#D97706` (`w-1.5 h-1.5 rounded-full`) |
| **Status: Locked** | Override / Settled Tag | `bg-[#F8FAFC] text-[#334155] border-[#E2E8F0]` | Dot: `#64748B` (`w-1.5 h-1.5 rounded-full`) |

---

## 2. High-Level Component Tree

```
frontend/src/
├── main.jsx
├── App.jsx
├── index.css (Inter, JetBrains Mono, tabular-nums, scrollbar styling)
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx (Fixed header, navigation, status badge, footer)
│   │   ├── HeaderNavbar.jsx
│   │   └── QuickAuditModal.jsx (⌘K Portal on document.body)
│   ├── common/
│   │   ├── StatusTag.jsx (Sharp rounded-[4px] with 6px dot)
│   │   ├── TabularCurrency.jsx (Inter tabular-nums formatting)
│   │   └── CodeIdentifier.jsx (JetBrains Mono pill)
│   ├── dashboard/
│   │   ├── KpiMetricsGrid.jsx (4 live institutional cards)
│   │   ├── BenchmarkScenariosBar.jsx (1-click judge evaluation triggers)
│   │   └── TriageLedgerTable.jsx (Dense institutional AP ledger)
│   ├── workbench/
│   │   ├── DocumentViewer.jsx (High-res invoice preview + zoom controls)
│   │   ├── OpticalBoundingOverlay.jsx (SVG interactive overlay)
│   │   ├── ContractBaselineCard.jsx (ERP PO metadata)
│   │   ├── ReconciliationGrid.jsx (Billed vs PO vs Variance)
│   │   ├── RuleDiagnosticsPanel.jsx (7-rule pass/fail cards)
│   │   ├── DecisionConsole.jsx (Approve / Override / Dispute CTAs)
│   │   ├── DisputeEmailModal.jsx (Portal z-[9999] credit memo memo)
│   │   └── OverrideReasonModal.jsx (Portal mandatory justification modal)
│   └── upload/
│       ├── DropzoneArea.jsx (Drag & drop file ingestion)
│       ├── SampleInvoiceGenerator.jsx (HTML5 Canvas PNG generator)
│       └── IngestionStepper.jsx (3-stage live telemetry animation)
└── pages/
    ├── DashboardPage.jsx
    ├── WorkbenchPage.jsx
    ├── UploadPage.jsx
    ├── PurchaseOrdersPage.jsx
    └── AuditLogsPage.jsx
```

---

## 3. Screen Wireframes & Layout Geometries

### Screen 1: AppShell & Header Bar
```
+-----------------------------------------------------------------------------------------------------+
| [AF] AuditFlow v1.0   | [01. Triage Ledger] [02. Workbench] [03. Intake] [04. POs] [05. Audit Trail] |
|                       | [Search ⌘K]   (•) Gemini 2.5 Flash Ready   [+ Upload Invoice]                |
+-----------------------------------------------------------------------------------------------------+
| Main Viewport Outlet (<main class="pt-14 min-h-[calc(100vh-3.5rem)] bg-[#F4F6F8]">)                 |
+-----------------------------------------------------------------------------------------------------+
| Footer: NYLP AI Hackathon 2026 // Cryptographic Auditing Ledger // Ubaid Raza & Anushka Samad      |
+-----------------------------------------------------------------------------------------------------+
```

### Screen 2: Triage Command Center (`DashboardPage.jsx`)
```
+-----------------------------------------------------------------------------------------------------+
| TOTAL AUDITED VOLUME      PREVENTED CAPITAL LEAKAGE   PENDING EXCEPTIONS        CLEAN MATCH RATE    |
| $142,850.00               $4,320.50                   2                         75.0%               |
| +12.4% vs last period     +$450.00 flagged today      Requires auditor review   Target: > 70.0%     |
+-----------------------------------------------------------------------------------------------------+
| 1-CLICK BENCHMARK SCENARIOS:                                                                        |
| [▶ Benchmark A: Clean Match]   [▶ Benchmark B: Price Creep (+450)]   [▶ Benchmark C: Duplicate]     |
+-----------------------------------------------------------------------------------------------------+
| AP FORENSIC TRIAGE LEDGER                                         [Filter All | Exceptions] [Export] |
+-----------------------------------------------------------------------------------------------------+
| INVOICE   VENDOR             PO REF       DATE        GRAND TOTAL  PO BASELINE  VARIANCE  STATUS    |
| INV-9042  Apex Tech Sol.    PO-2026-102  2026-10-14  $2,950.00    $2,500.00    +$450.00  [FLAGGED] |
| INV-8801  CloudHost Ent PK  PO-2026-101  2026-10-15  $950.00      $950.00       $0.00    [VERIFIED]|
| INV-7710R Prime Office Log. PO-2026-103  2026-10-12  $1,200.00    $1,200.00    DUP COLL  [FLAGGED] |
+-----------------------------------------------------------------------------------------------------+
```

### Screen 3: Split-Screen Forensic Workbench (`WorkbenchPage.jsx`)
```
+---------------------------------------------------+-------------------------------------------------+
| LEFT PANE: HIGH-RES INVOICE DOCUMENT VIEWER (50%) | RIGHT PANE: 3-WAY RECONCILIATION & RULES (50%)  |
+---------------------------------------------------+-------------------------------------------------+
| [Toggle Optical Overlay (ON/OFF)] [Zoom - 100% +] | CONTRACT BASELINE: PO-2026-102                  |
|                                                   | Vendor: Apex Tech Solutions (NTN-8839201-4)     |
| +-----------------------------------------------+ | Authorized: $2,500.00 | IBAN: Verified Match    |
| | TAX INVOICE #INV-9042                         | +-----------------------------------------------+
| | Vendor: Apex Tech Solutions                   | 3-WAY LINE-ITEM RECONCILIATION                  |
| |                                               | LINE ITEM               BILLED    PO      DELTA |
| | [Line 1: 10x 27" Monitors @ $250.00] <--(Box) | 01. 27" IPS Monitor     $250.00   $210.00 +$400 |
| |                                               | 02. USB-C Docking St.   $80.00    $80.00    $0  |
| | [Line 3: Rush Delivery Fee @ $50.00] <--(Box) | 03. Rush Delivery Fee   $50.00    --     +$50   |
| |                                               | Grand Total Billed: $2,950.00  PO Total: $2,500 |
| | Total: $2,950.00                              | Total Price Variance: +$450.00 (18.0% Overrun)  |
| +-----------------------------------------------+ +-----------------------------------------------+
| SHA-256 Digest: a4f89d31...                       | 7-RULE DETERMINISTIC AUDIT DIAGNOSTICS:         |
| Match Confidence: 98.4% (Gemini 2.5 Flash)        | [!] CRITICAL: UNIT_PRICE_OVERCHARGE (Line 1)    |
|                                                   | [!] HIGH: UNAPPROVED_LINE_ITEM (Rush Surcharge) |
|                                                   | [✓] PASS: EXACT_FILE_DUPLICATE (Unique Hash)    |
|                                                   | [✓] PASS: INTERNAL_MATH_ERROR (Math Valid)      |
|                                                   | +-----------------------------------------------+
|                                                   | AUDITOR DECISION ACTIONS:                       |
|                                                   | [Approve Clean] [Approve w/ Override] [Dispute] |
+---------------------------------------------------+-------------------------------------------------+
```

### Screen 4: Vendor Dispute Notice Modal (`DisputeEmailModal.jsx`)
```
+-----------------------------------------------------------------------------------------------------+
| (Fixed Inset-0 Modal via createPortal with backdrop-blur-md bg-slate-950/60 z-[9999])               |
|   +-----------------------------------------------------------------------------------------------+ |
|   | [AF] Vendor Discrepancy & Credit Memo Notice                [Disputed: +$450.00]  [✕ Close]   |
|   +-----------------------------------------------------------------------------------------------+ |
|   | RECIPIENT VENDOR:            CONTRACT BASELINE:             AUDIT DISPOSITION:                |
|   | Apex Tech Solutions          PO-2026-102 ($2,500.00 Auth)   Hold Payment & Request Credit     |
|   | billing@apextech.com         Net 30 Suspended                                                 |
|   +-----------------------------------------------------------------------------------------------+ |
|   | FORMAL SUBJECT LINE:                                                                          |
|   | [ Invoice Discrepancy & Credit Memo Request — INV-9042 (Apex Tech Solutions)                ] |
|   |                                                                                               |
|   | DISPATCH MEMORANDUM (Editable):                                                               |
|   | [ Dear Accounts Payable & Billing Team,                                                     ] |
|   | [ Following automated 3-way forensic reconciliation between PO-2026-102 and Tax Invoice    ] |
|   | [ #INV-9042, disbursement has been placed on hold due to variances totaling +$450.00 USD:   ] |
|   | [ 1. Unit Price Overrun on Line 01 ($250 vs $210 contracted rate = +$400 variance).         ] |
|   | [ 2. Unapproved Surcharge on Line 03 (Rush Delivery Fee = +$50 unauthorized).               ] |
|   | [ Please issue a formal Credit Memorandum for $450.00 within 5 business days.               ] |
|   |                                                                                               |
|   | [x] Attach cryptographically signed PDF forensic proof sheet (SHA-256 verified)               |
|   +-----------------------------------------------------------------------------------------------+ |
|   | [Copy Notice Text]                             [Cancel]   [Confirm Rejection & Log to Audit]  |
|   +-----------------------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------------------------+
```

### Screen 5: Invoice Intake & Telemetry (`UploadPage.jsx`)
```
+-----------------------------------------------------------------------------------------------------+
| INVOICE INTAKE & MULTIMODAL INGESTION PIPELINE                                                      |
+-----------------------------------------------------------------------------------------------------+
| +-------------------------------------------------------------------------------------------------+ |
| |                                 DRAG & DROP INVOICE DOCUMENT                                    | |
| |                        Supports PDF, PNG, JPG, WEBP (Max 25MB)                                  | |
| |                                                                                                 | |
| |                             [Choose Local File from Disk]                                       | |
| |                                          OR                                                     | |
| |                    [⚡ Generate Realistic Sample PNG Invoice (INV-9042)]                         | |
| +-------------------------------------------------------------------------------------------------+ |
|                                                                                                     |
| 3-STAGE INGESTION TELEMETRY:                                                                        |
| [1. Cryptographic Ingestion]  ---->  [2. Multimodal Vision Cascade]  ---->  [3. Pure-Python Auditor] |
| SHA-256 Checksum Computed            gemini-2.5-flash Cascade               7-Rule Deterministic    |
| Hash: a4f89d31...                    Latency: 1,420ms                       Zero LLM Math           |
+-----------------------------------------------------------------------------------------------------+
```
