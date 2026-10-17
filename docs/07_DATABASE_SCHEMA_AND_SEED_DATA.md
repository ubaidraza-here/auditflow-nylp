# Database Schema & Benchmark Seed Data

**Project Name:** AuditFlow  
**Module Reference:** `backend/data/seed_data.py`  
**Storage Engine:** Thread-Safe In-Memory Singleton with Deepcopy Re-Seed

---

## 1. Purchase Order (ERP Baseline) Seed Records

### PO 1: PO-2026-101 (Cloud Services Infrastructure)
- **PO Number:** `PO-2026-101`
- **Vendor Name:** `CloudHost Enterprise PK`
- **Vendor NTN:** `NTN-4410928-1`
- **Vendor IBAN:** `PK91MEZN00010203040506`
- **Vendor Email:** `accounts@cloudhost.pk`
- **Authorized Grand Total:** `$950.00`
- **Issue Date:** `2026-10-01`
- **Line Items:**
  1. `POL-101-1`: `Dedicated GPU Server Instance (Monthly)` | Qty: `1.0` | Rate: `$800.00` | Subtotal: `$800.00`
  2. `POL-101-2`: `Managed Cloud Backup Storage (5TB)` | Qty: `1.0` | Rate: `$150.00` | Subtotal: `$150.00`

---

### PO 2: PO-2026-102 (Hardware Procurement)
- **PO Number:** `PO-2026-102`
- **Vendor Name:** `Apex Tech Solutions`
- **Vendor NTN:** `NTN-8839201-4`
- **Vendor IBAN:** `PK36SCBL00000011223344`
- **Vendor Email:** `billing@apextech.com`
- **Authorized Grand Total:** `$2,500.00`
- **Issue Date:** `2026-10-05`
- **Line Items:**
  1. `POL-102-1`: `27-inch IPS Monitor Panel` | Qty: `10.0` | Rate: `$210.00` | Subtotal: `$2,100.00`
  2. `POL-102-2`: `USB-C Docking Station` | Qty: `5.0` | Rate: `$80.00` | Subtotal: `$400.00`

---

### PO 3: PO-2026-103 (Ergonomic Workplace Furnishing)
- **PO Number:** `PO-2026-103`
- **Vendor Name:** `Prime Office Logistics`
- **Vendor NTN:** `NTN-1129384-9`
- **Vendor IBAN:** `PK12HABB00099887766554`
- **Vendor Email:** `billing@primeofficelogistics.com`
- **Authorized Grand Total:** `$1,200.00`
- **Issue Date:** `2026-10-02`
- **Line Items:**
  1. `POL-103-1`: `Ergonomic Mesh Task Chair` | Qty: `6.0` | Rate: `$200.00` | Subtotal: `$1,200.00`

---

## 2. Seed Invoice Ledger Records

### Invoice 1: `inv_1002` (Benchmark B — Unit Price Creep & Unapproved Surcharge)
- **ID:** `inv_1002`
- **Invoice Number:** `INV-9042`
- **Vendor Name:** `Apex Tech Solutions`
- **Vendor NTN:** `NTN-8839201-4`
- **Vendor IBAN:** `PK36SCBL00000011223344`
- **Vendor Email:** `billing@apextech.com`
- **PO Reference:** `PO-2026-102`
- **Invoice Date:** `2026-10-14`
- **Grand Total:** `$2,950.00`
- **PO Baseline Total:** `$2,500.00`
- **Variance Amount:** `+$450.00` (+18.00% overrun)
- **Status:** `EXCEPTION_FLAGGED`
- **SHA-256 Hash:** `a4f89d31c2b5e7104b2a9e3d810f4c9a7b6e5d4c3b2a1098f7e6d5c4b3a20198`
- **Line Items:**
  1. `27-inch IPS Monitor Panel` | Qty: `10.0` | Billed Unit: `$250.00` (PO: `$210.00`) | Total: `$2,500.00` | Matched PO: `POL-102-1` (Variance: `+$400.00`)
  2. `USB-C Docking Station` | Qty: `5.0` | Billed Unit: `$80.00` (PO: `$80.00`) | Total: `$400.00` | Matched PO: `POL-102-2` (Variance: `$0.00`)
  3. `Rush Delivery & Handling Fee` | Qty: `1.0` | Billed Unit: `$50.00` (PO: None) | Total: `$50.00` | Matched PO: `null` (Variance: `+$50.00`)
- **Triggered Rules:**
  - `UNIT_PRICE_OVERCHARGE` (`CRITICAL`): Line 1 unit price ($250.00) exceeds PO contract ($210.00) by $40.00/unit.
  - `UNAPPROVED_LINE_ITEM` (`HIGH`): Line 3 ($50.00) not authorized in PO-2026-102.

---

### Invoice 2: `inv_1001` (Benchmark A — Clean 3-Way Match)
- **ID:** `inv_1001`
- **Invoice Number:** `INV-8801`
- **Vendor Name:** `CloudHost Enterprise PK`
- **PO Reference:** `PO-2026-101`
- **Grand Total:** `$950.00`
- **PO Baseline Total:** `$950.00`
- **Variance Amount:** `$0.00`
- **Status:** `VERIFIED_MATCH`
- **SHA-256 Hash:** `c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2`
- **Triggered Rules:** None (All 7 rules clean pass).

---

### Invoice 3: `inv_1003` (Benchmark C — Fuzzy Duplicate Suffix)
- **ID:** `inv_1003`
- **Invoice Number:** `INV-7710-REV`
- **Vendor Name:** `Prime Office Logistics`
- **PO Reference:** `PO-2026-103`
- **Grand Total:** `$1,200.00`
- **PO Baseline Total:** `$1,200.00`
- **Variance Amount:** `$0.00`
- **Status:** `EXCEPTION_FLAGGED`
- **SHA-256 Hash:** `e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6`
- **Triggered Rules:**
  - `CRITICAL_FUZZY_DUPLICATE` (`CRITICAL`): Identical vendor, amount, and core invoice number to previously settled `INV-7710` (`inv_1000`).

---

### Invoice 4: `inv_1000` (Settled Baseline Record)
- **ID:** `inv_1000`
- **Invoice Number:** `INV-7710`
- **Vendor Name:** `Prime Office Logistics`
- **PO Reference:** `PO-2026-103`
- **Grand Total:** `$1,200.00`
- **Status:** `APPROVED_CLEAN`
- **Reviewer:** `Ubaid Raza`
- **Disposition:** `CLEARED_FOR_DISBURSEMENT`

---

### Invoice 5: `inv_1004` (Historical Override Record)
- **ID:** `inv_1004`
- **Invoice Number:** `INV-6540`
- **Vendor Name:** `CyberNet Telecomm`
- **PO Reference:** `PO-2026-088`
- **Grand Total:** `$3,400.00`
- **PO Baseline Total:** `$3,000.00`
- **Variance Amount:** `+$400.00`
- **Status:** `APPROVED_WITH_OVERRIDE`
- **Reviewer:** `Ubaid Raza`
- **Override Reason:** `Authorized by IT Director for critical fiber restoration overtime surcharge.`

---

### Invoice 6: `inv_1005` (Historical Disputed Record)
- **ID:** `inv_1005`
- **Invoice Number:** `INV-5412`
- **Vendor Name:** `MegaServer Global`
- **PO Reference:** `PO-2026-075`
- **Grand Total:** `$7,800.00`
- **PO Baseline Total:** `$5,000.00`
- **Variance Amount:** `+$2,800.00`
- **Status:** `REJECTED_DISPUTED`
- **Reviewer:** `Ubaid Raza`
- **Dispute Memo:** `Issued formal credit memo request for uncontracted storage server rack charge.`

---

## 3. Seed Audit Log Ledger

```json
[
  {
    "id": "log_001",
    "timestamp": "2026-10-14T09:15:22Z",
    "invoice_id": "inv_1000",
    "invoice_number": "INV-7710",
    "event_type": "AUDIT_APPROVED_CLEAN",
    "actor": "Ubaid Raza",
    "details": "Invoice passed 3-way match. Cleared for disbursement."
  },
  {
    "id": "log_002",
    "timestamp": "2026-10-14T11:42:05Z",
    "invoice_id": "inv_1002",
    "invoice_number": "INV-9042",
    "event_type": "EXCEPTION_DETECTED",
    "actor": "AuditFlow Engine",
    "details": "Triggered UNIT_PRICE_OVERCHARGE (+$400) and UNAPPROVED_LINE_ITEM (+$50)."
  }
]
```
