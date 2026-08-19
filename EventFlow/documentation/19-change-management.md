# Change Management

## Purpose

This document defines how EventFlow changes move from an identified need to an approved, implementation-ready scope. It prevents planned behavior from being mistaken for functionality that is already available.

## Change states

| State | Meaning |
|---|---|
| Proposed | The change has been recorded but decisions or approval are incomplete. |
| Approved for implementation | Product decisions are complete enough for implementation planning. The behavior is not yet implemented unless separately stated. |
| In implementation | Code, rules, indexes, tests, and supporting documentation are being changed. |
| Ready for UAT | Implementation verification has passed and the change is available for user acceptance testing. |
| Accepted | UAT is complete and the approved acceptance criteria have passed. |
| Released | The accepted change has been deployed to its intended environment. |
| Rejected or withdrawn | The change will not proceed in its recorded form. |

## Required change record

Material changes must have a change request under `documentation/change-requests/` containing:

- identifier, title, owner, date, and current state;
- problem statement, scope, exclusions, and assumptions;
- decisions that supersede earlier documentation;
- affected requirements, workflows, roles, data, security, UI, integrations, and tests;
- migration and compatibility considerations;
- acceptance criteria and unresolved questions;
- an implementation checklist and release evidence.

## Governance workflow

1. Record the request and identify the implemented baseline.
2. Resolve product and security decisions before coding.
3. Approve the bounded target behavior and acceptance criteria.
4. Update authoritative documentation, marking the target as planned.
5. Implement application, Firestore Rules, indexes, migrations, and tests together where applicable.
6. Record build and automated-test evidence.
7. Complete UAT and record exceptions.
8. Deploy through the normal release process and update the change state.

Approval to define a change does not authorize code changes, data migration, deployment, or release. Those actions require their own implementation and release activity.

## Documentation conventions

- **Implemented** describes behavior present in the current application baseline.
- **Approved and planned** describes an accepted target that has not yet been implemented.
- **Future** describes an unapproved or intentionally deferred idea.
- When a planned decision supersedes an implemented behavior, both are retained long enough to make the implementation gap explicit.
- A correction must identify the superseded statement and the authoritative replacement.

## Change register

| ID | Change | State | Record |
|---|---|---|---|
| CR-001 | Transportation trip lifecycle and participant vehicle assignments | In implementation | [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md) |

## CR-001 approval record

The product decisions for CR-001, including its authoritative corrections, were confirmed on 2026-08-18. CR-001 remains In implementation. Planning, grouped participants, Events-list cutover, target deactivation, participant cleanup, and production legacy isolation are implemented in source; lifecycle execution, reset execution, frontend deployment, and final UAT remain separate authorized activities.
