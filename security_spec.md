# Security Specification: Smart Shop Management System

## 1. Data Invariants
- Each product, sale, customer, supplier, purchase, and payment belongs to an authenticated store owner (`ownerId == request.auth.uid`).
- A sale transaction cannot alter historical line items or purchase cost snapshots; refund or cancellation requires an explicit audit status.
- Stock movements are strictly append-only audit records to preserve traceability.
- Shop settings are isolated per user/store owner.
- Financial metrics (gross profit, outstanding balance, cost of goods sold) must be derived from verified store records.

## 2. Security Rules Verification
- Unauthenticated access is blocked at the root with a default-deny rule.
- Single-document queries require authenticated user context.
- List queries are scoped with `ownerId == request.auth.uid` or admin override.
- Profiles are isolated to the respective authenticated user.
