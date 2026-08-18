# Non-Functional Requirements

## Security
- NFR-001: Authentication shall use Firebase Authentication.
- NFR-002: Only approved active EventFlow users may access protected functionality.
- NFR-003: Firestore Security Rules shall enforce authenticated access and role restrictions where applicable.
- NFR-004: Sensitive Google credentials/tokens shall not be stored in frontend code.
- NFR-005: Server-side secrets shall use Firebase/Google Cloud secret management.
- NFR-006: Real student data shall not be committed to source control or public portfolio artifacts.

## Mobile and Usability
- NFR-007: The application shall be designed mobile-first.
- NFR-008: Core workflows shall be usable at approximately 320 CSS pixels and above.
- NFR-009: Forms shall use accessible, touch-friendly controls.
- NFR-010: Common operational information shall be visible from event-list views.

## Reliability and Data Integrity
- NFR-011: Firestore shall be the system of record.
- NFR-012: Calendar synchronization shall be idempotent.
- NFR-013: Failed Calendar synchronization shall not cause Firestore data loss.
- NFR-014: Duplicate active assignments shall be prevented as specified.
- NFR-015: Historical references shall remain readable when master data is deactivated.
- NFR-016: Consequential external integrations shall execute server-side.

## Maintainability
- NFR-017: Firestore data-access logic should be separated from React presentation components where practical.
- NFR-018: Application types shall be defined in TypeScript.
- NFR-019: Firestore timestamp conversion shall occur at a clear application boundary.
- NFR-020: MVP shall avoid unnecessary frameworks, state libraries, and abstractions.
- NFR-021: New enhancements go to Future Roadmap unless required to fix a defect/security issue/baseline gap.

## Auditability
- NFR-022: MVP shall retain creation/update and assignment timestamps required by the data model.
- NFR-023: A general-purpose audit log is not required for MVP.

## Availability
- NFR-024: Offline operation is not required for MVP.

## Transportation Expansion - Approved and Planned (CR-001)

- NFR-025: Lifecycle transitions, coupled event-status changes, driver participation, and participant assignment cleanup must be atomic.
- NFR-026: Operational and correction timestamps must be server-authored.
- NFR-027: Rules enforce Admin-only departure/driver/vehicle/settings/correction changes, valid forward actions for Staff/Admin, and bounded Staff return-passenger editing only after Depart and before Start Return.
- NFR-028: Capacity means total available seats including the driver's seat; calculations are deterministic per leg and deduplicate a participating driver.
- NFR-029: Only latest correction metadata is required; later corrections overwrite it. This is not full audit history, and WhatsApp edits/handoffs are not corrections.
- NFR-030: WhatsApp content is generated locally and manually handed off. Open is best-effort and must never imply detected launch or delivery; no delivery/sent/share-attempt state, groups, phone numbers, credentials, or templates are stored.
- NFR-031: Confirmation messages must not disclose participant names, dietary details, or contact information.
- NFR-032: Transportation controls and reviews must remain usable on supported mobile layouts and clearly distinguish warnings from hard validation failures.
