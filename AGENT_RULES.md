# AuditFlow — Autonomous Agent Engineering Laws & Governance

**Project Name:** AuditFlow — Enterprise B2B Accounts Payable 3-Way Reconciliation & Cryptographic Forensic Auditing Platform  
**Hackathon:** NYLP AI Hackathon 2026 (Official Build Window: October 17–19, 2026)  
**Google Stitch Project:** `projects/9814179004934823205` ("AuditFlow Financial Forensics Ledger")

---

## 1. Absolute Workspace Isolation

To prevent merge collisions, scope creep, and architectural drift, the codebase is partitioned between two lead engineers:

| Domain | Lead Engineer | Technology Stack | Local Host & Port |
| :--- | :--- | :--- | :--- |
| **Frontend Application** (`/frontend`) | **Ubaid Raza** | React 19 + Vite 6 (`vite@^6.2.0`) + Tailwind CSS + Lucide Icons | `http://localhost:5173` |
| **Backend API & Auditor** (`/backend`) | **Anushka Samad** | Python 3.11+ + FastAPI + Uvicorn + Google GenAI SDK | `http://localhost:5000` |

### Isolation Rules:
1. **Frontend Isolation:** No frontend code may import backend files or directly mutate backend state. All communication must occur over HTTP REST calls conforming to `docs/03_DATA_DICTIONARY_AND_JSON_CONTRACT.md`.
2. **Backend Isolation:** No backend code may generate UI HTML/JSX templates. Backend strictly exposes validated JSON schemas and deterministic auditing services.

---

## 2. The 160-Line Modular Ceiling

> **CRITICAL LAW:** Every React `.jsx` file and Python `.py` module must stay strictly **under 160 lines of code**.

### Architectural Enforcement:
- If a component exceeds 160 lines, surgically decompose it into focused sub-components inside subdirectories (e.g. `components/workbench/OpticalOverlay.jsx`, `components/workbench/ReconciliationTable.jsx`, `components/workbench/DecisionPanel.jsx`).
- If a backend service exceeds 160 lines, split into specialized service units (e.g., `services/crypto_hasher.py`, `services/gemini_extractor.py`, `services/discrepancy_auditor.py`, `services/dispute_generator.py`).
- Never compress code horizontally (e.g., minified lines, removing newlines) to cheat the limit. Clean modular abstraction is mandatory.

---

## 3. The Deterministic Math Law

> **ZERO LLM MATH LAW:** Never use a Large Language Model for arithmetic multiplication, tax addition, variance subtraction, or duplicate hash matching.

- **Reasoning:** Foundation models and multimodal vision LLMs suffer from floating-point hallucination and non-deterministic arithmetic jitter. Enterprise controllers and statutory auditors require 100% reproducible math.
- **Implementation:**
  - Gemini (`google-genai` SDK) is utilized **exclusively for multimodal optical extraction and semantic mapping** (mapping invoice lines to PO lines).
  - All financial math (`quantity * unit_price`, `subtotal + tax - discount == grand_total`, `billed - baseline == variance`) is executed in pure Python in `discrepancy_auditor.py`.
  - Binary duplicate detection is performed with standard cryptographic digests (`hashlib.sha256`).

---

## 4. Design System Law: "Nordic Institutional Banking"

All visual interfaces must conform to the design system established in Google Stitch project `projects/9814179004934823205`.

### 4.1. Core Institutional Palette
- **App Canvas:** Cool Architectural Porcelain (`#F4F6F8`).
- **Cards & Tables:** Pure White (`#FFFFFF`) with crisp `1px solid #E2E8F0` hairlines and subtle ambient elevation (`shadow-xs` / `box-shadow: 0 1px 2px 0 rgba(0,0,0,0.03)`).
- **Primary Authority Accent:** Deep Fjord Navy (`#0A2540`), Hover Oxford Blue (`#1E3A5F`).
- **Surface Elevation Muted:** Slate Neutral (`#F8FAFC`), Slate Sub-header (`#F1F5F9`).
- **Dividers & Hairlines:** Crisp Border Slate (`#E2E8F0`).

### 4.2. Semantic Status Tags & Badges
All status badges must be rendered as **sharp rectangular tags** with a 6px circular indicator dot.
- **Syntax:** `rounded-[4px] px-2 py-0.5 text-[11px] font-mono font-medium inline-flex items-center gap-1.5 border`
- **Indicator Dot:** `w-1.5 h-1.5 rounded-full flex-shrink-0`
- **Variants:**
  - **Verified / Clean / Active:** Emerald `#F0FDF4` bg, `#166534` text, `#BBF7D0` border, `#16A34A` dot.
  - **Flagged / Disputed / Critical:** Rose `#FEF2F2` bg, `#991B1B` text, `#FECACA` border, `#DC2626` dot.
  - **Warning / Unapproved / Missing:** Amber `#FFFBEB` bg, `#92400E` text, `#FDE68A` border, `#D97706` dot.
  - **Locked / Settled / Override:** Slate `#F8FAFC` bg, `#334155` text, `#E2E8F0` border, `#64748B` dot.
- **FORBIDDEN:** Never use `rounded-full` capsule/pill tags for status badges.

### 4.3. Two-Font Institutional Hierarchy
- **Primary Institutional Font (`Inter` / `font-sans`):**
  - Used for all interface headings, table column headers, form inputs, navigation labels, and legal notice drafting copy.
  - **Tabular Numerics Rule:** Every currency amount (`$142,850.00`, `$6,420.50`, `+$450.00`), percentage (`75.0%`), and quantity must use `font-sans` with `font-variant-numeric: tabular-nums` (`tabular-nums` class).
  - **NEVER** split dollars and cents across two different fonts or sizes.
- **Machine Code Font (`JetBrains Mono` / `font-mono`):**
  - Reserved strictly for machine identifiers: Invoice numbers (`INV-9042`), PO references (`PO-2026-102`), line item IDs (`LINE-01`), cryptographic SHA-256 hashes (`3f98a2...`), tax NTN / bank IBAN codes, timestamps, and Rule Codes (`UNIT_PRICE_OVERCHARGE`).

### 4.4. Modal Viewport Portal Rule
- Modals (`DisputeEmailModal.jsx`, `QuickAuditModal.jsx`) must mount directly onto `document.body` via React `createPortal`.
- Must specify `fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md` so the frosted blur covers 100% of the viewport, including the fixed top navigation bar.

---

## 5. Engineering Quality & Zero-Placeholder Policy
- Every interactive control (toggles, benchmark buttons, decision CTAs, export triggers) must be wired to real state or real API endpoints.
- No dummy links (`href="#"` without handlers) or placeholder text (`Lorem ipsum`).
- All seed data and benchmark scenarios must be 100% internally consistent across vendor names, line quantities, tax calculations, and banking credentials.
