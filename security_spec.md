# Security Specification: Cyber-Ecclesia Matrix

## 1. Data Invariants
- **Identity Integrity**: Users can only create profiles with their own `uid`. They cannot escalate their `role` to 'admin'.
- **Ownership Lockdown**: `notes` and `photos` belong to their creators. Only the owner can delete or modify their own content.
- **Admin Supremacy**: Global configurations (`app_config`), `events`, `devotionals`, and `media` are read-only for public/users and write-restricted to authenticated admins.
- **Relational Integrity**: A note must reference a valid `userId`.
- **Temporal Strictness**: `createdAt` is immutable. `updatedAt` must always match `request.time`.

## 2. The "Dirty Dozen" Payloads (Logical Breach Attempts)

| ID | Collection | Operation | Payload / Intent | Expected Result |
|----|------------|-----------|------------------|-----------------|
| D1 | `users` | `create` | `{ "uid": "victim_uid", "role": "admin" }` (Identity Spoof) | **DENIED** |
| D2 | `users` | `update` | `{ "role": "admin" }` (Privilege Escalation) | **DENIED** |
| D3 | `notes` | `create` | `{ "userId": "victim_uid", "content": "..." }` (Impersonation) | **DENIED** |
| D4 | `notes` | `update` | `{ "userId": "attacker_uid" }` on victim's note (Ownership Hijack) | **DENIED** |
| D5 | `app_config` | `write` | `{ "banners": [] }` by non-admin (Core Sabotage) | **DENIED** |
| D6 | `events` | `create` | `{ "title": "Evil Event" }` by user (Calendar Poisoning) | **DENIED** |
| D7 | `photos` | `delete` | Attacker deletes victim's photo (Content Sabotage) | **DENIED** |
| D8 | `photos` | `update` | `{ "likes": 999999 }` (Analytics Inflation) | **DENIED** |
| D9 | `notes` | `create` | `{ "content": "A" * 2000000 }` (Resource Exhaustion/DoS) | **DENIED** |
| D10 | `media` | `update` | `{ "url": "恶意网站" }` by user (Phishing Injection) | **DENIED** |
| D11 | `users` | `update` | `{ "createdAt": "2000-01-01" }` (Temporal Tampering) | **DENIED** |
| D12 | `photos` | `create` | `{ "imageUrl": "script:eval(...)" }` (XSS/Payload Injection) | **DENIED** |

## 3. Test Runner (Verification Architecture)

The `firestore.rules.test.ts` will implement these cases using the Firebase Rules Testing library.
