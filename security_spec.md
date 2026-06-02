# Firebase Security Specification & TDD Framework

## 1. Data Invariants & Access Control Policy
- **Global Safety Rule**: The database denies all public access by default.
- **Authentication requirement**: All operations require a valid, signed-in account.
- **IsOwner Integrity**: A user can register their own profile but cannot change other users' statuses or systemLevel permissions unless they are an Administrator.
- **Terminal State Lock**: A CargoLoad once reached 'CARGA LIBERADA' (RELEASED) or 'CARGA BLOQUEADA' (BLOCKED) cannot have its crucial fields modified without special administrative privilege.
- **Strict Payload Keys**: No shadow fields are permitted during creations. Write modifications are validated on precise field changes using `affectedKeys().hasOnly()`.
- **Temporal Enforcement**: Timestamps `createdAt`, `updatedAt`, `timestamp` must be matched strictly to `request.time`.

## 2. The "Dirty Dozen" Violation Payloads
Here are the 12 payloads designed to exploit update loops, circumvent authorization, or corrupt state:

1. **Anonymous Write Attack**: An unauthenticated user attempts to create a CargoLoad.
2. **Identity Spoofing**: User `auditor_A` attempts to record or update a load with `createdBy: "cleiton"`.
3. **Ghost Fields Injection**: Adding a load with an unrequested field `priorityOverride: true`.
4. **Privilege Escalation**: A standard user updates their `systemRole` to `'administrator'`.
5. **PII Blanket Leak**: An auditor queries the absolute entire users collection without restriction.
6. **State Shortcutting**: Updating a load status to `'CARGA LIBERADA'` without passing through checking.
7. **Temporal Fraud**: Setting `createdAt` of a new load to a static past timestamp instead of `request.time`.
8. **ID Poisoning / Resource Exhaustion**: Registering a user with a document ID containing special characters or >128 chars.
9. **Unverified User Write**: A user without `email_verified == true` attempts to perform critical cargo auditing.
10. **Admin Bypass Spoofing**: Sending an custom auth token claim that spoofs the `isAdmin` state.
11. **Self-Approval**: A standard pending operator updates their own status to `'active'`.
12. **Corruption of Immortal Fields**: Attempting to alter the immutable `createdAt` or `createdBy` field on a CargoLoad update.

## 3. The Test Runner Spec (`firestore.rules.test.ts`)
A conceptual test runner verifying that all "Dirty Dozen" payloads correctly return `PERMISSION_DENIED`:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Test implementation will verify that:
// 1. Anonymous writes fail on all collections.
// 2. Setting isVerified flags manually in user profiles fails.
// 3. Modifying `createdBy` parameter on any CargoLoad fails.
```
