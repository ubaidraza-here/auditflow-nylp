"""Cryptographic Audit Dossier and Forensic Ledger Exporter."""

import io
import csv
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple


def compute_digest(content: str) -> str:
    """Computes SHA-256 cryptographic hex digest of string content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def format_json_dossier(invoice: Dict[str, Any]) -> Dict[str, Any]:
    """Generates tamper-evident JSON audit dossier with cryptographic signature."""
    canonical_payload = {
        "auditflow_dossier_version": "1.0.0",
        "invoice_id": invoice.get("id"),
        "invoice_number": invoice.get("invoice_number"),
        "vendor_name": invoice.get("vendor_name"),
        "vendor_ntn": invoice.get("vendor_ntn", ""),
        "po_reference": invoice.get("po_reference", ""),
        "status": invoice.get("status"),
        "grand_total": invoice.get("grand_total"),
        "po_baseline_grand_total": invoice.get("po_baseline_grand_total"),
        "total_variance_amount": invoice.get("total_variance_amount"),
        "sha256_hash": invoice.get("sha256_hash"),
        "file_name": invoice.get("file_name"),
        "confidence_score": invoice.get("confidence_score"),
        "reviewer_name": invoice.get("reviewer_name"),
        "reviewed_at": invoice.get("reviewed_at"),
        "override_reason": invoice.get("override_reason"),
        "dispute_memo": invoice.get("dispute_memo"),
        "line_items": invoice.get("line_items", []),
        "rule_evaluations": invoice.get("rule_evaluations", []),
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }
    serialized = json.dumps(canonical_payload, sort_keys=True)
    canonical_payload["cryptographic_signature"] = compute_digest(serialized)
    return canonical_payload


def format_csv_dossier(invoice: Dict[str, Any]) -> Tuple[str, str]:
    """Generates structured CSV audit dossier and returns (csv_string, sha256_signature)."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["# AUDITFLOW FORENSIC DOSSIER EXPORT"])
    writer.writerow(["Invoice ID", invoice.get("id")])
    writer.writerow(["Invoice Number", invoice.get("invoice_number")])
    writer.writerow(["Vendor Name", invoice.get("vendor_name")])
    writer.writerow(["PO Reference", invoice.get("po_reference")])
    writer.writerow(["Status", invoice.get("status")])
    writer.writerow(["Billed Total", invoice.get("grand_total")])
    writer.writerow(["PO Baseline Total", invoice.get("po_baseline_grand_total")])
    writer.writerow(["Variance Amount", invoice.get("total_variance_amount")])
    writer.writerow(["Source SHA-256", invoice.get("sha256_hash")])
    writer.writerow([])

    writer.writerow(["# LINE ITEMS RECONCILIATION"])
    writer.writerow(["Line#", "Description", "Quantity", "Unit Price", "Line Total", "Matched PO Line ID"])
    for item in invoice.get("line_items", []):
        writer.writerow([
            item.get("line_number"),
            item.get("description"),
            item.get("quantity"),
            item.get("unit_price"),
            item.get("line_total"),
            item.get("matched_po_line_id") or "UNCONTRACTED",
        ])
    writer.writerow([])

    writer.writerow(["# AUDIT RULE FINDINGS"])
    writer.writerow(["Rule Code", "Rule Name", "Severity", "Triggered", "Variance", "Message"])
    for rule in invoice.get("rule_evaluations", []):
        writer.writerow([
            rule.get("rule_code"),
            rule.get("rule_name"),
            rule.get("severity"),
            rule.get("triggered"),
            rule.get("variance_amount"),
            rule.get("message"),
        ])

    csv_content = output.getvalue()
    sig = compute_digest(csv_content)
    return csv_content, sig


def format_csv_audit_logs(logs: List[Dict[str, Any]]) -> str:
    """Generates standard CSV stream content for the immutable audit logs ledger."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "timestamp", "invoice_id", "invoice_number", "event_type", "actor", "details"])
    for log in logs:
        writer.writerow([
            log.get("id"),
            log.get("timestamp"),
            log.get("invoice_id"),
            log.get("invoice_number"),
            log.get("event_type"),
            log.get("actor"),
            log.get("details"),
        ])
    return output.getvalue()
