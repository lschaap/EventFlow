# Change Management

## 2026-08-20 CR-001 return-milestone Rules deployment

After production build, regression, policy, and Java 21 Firestore emulator verification passed, the scoped return-planning/Start Return/correction Rules were cloud-compiled without warnings and deployed to `eventflow-612ed` as ruleset `e8a29a89-d4bc-4413-a094-d9eae4365212`. Functions, indexes, Hosting, and operational data were unchanged. Manual UAT-182 through UAT-192 remains the acceptance gate; no implementation commit is created before Product Owner acceptance.

UAT then found that first Depart was denied for both Admin and Staff because the expanded broad update policy exceeded Firestore's 1,000-expression ceiling. Exact compact event/trip Depart authorization paths were verified for both roles in the executable emulator suite and deployed as ruleset `dd4b94bb-a586-49b3-bde7-68cf8c0e6865`. UAT-193 records the required production retest. No other Firebase resource changed.

The subsequent Arrive retest exposed the same expression ceiling in the combined lifecycle update path. A compact exact Arrive authorization path was verified in chained Admin/Staff Depart-and-Arrive emulator cases and deployed as ruleset `32d5839e-c550-496f-b8e8-9aa2eb39bfaa`. UAT-194 records the production retest; Functions, indexes, Hosting, and operational data remain unchanged.

Start Return UAT subsequently appeared to do nothing for both roles. Executable Rules coverage confirmed the complete Depart/Arrive/Start Return authorization chain succeeds. The client review and transaction had unbounded prerequisite/participant reads with no action-local progress or error display; these reads are now bounded at 15 seconds, Preparing state is immediate, and failures appear beside the affected arrived vehicle. UAT-195 records the retest. No additional Firebase resource was deployed.

Final milestone hardening removed redundant broad Depart/Arrive authorization branches after their compact exact replacements were proven. The full executable Rules suite passed and Firestore Rules only were deployed on 2026-09-03 as ruleset `16fb9b8e-0cfc-4719-b3b0-1157de1a59c6`. Post-Depart return-driver swapping remains a separate follow-up because the attempted multi-document client swap exceeded Firestore Rules' expression budget; no partial or weakened-security implementation is included.

## 2026-08-19 CR-001 operational test-data reset

Following Product Owner review of the dry-run scope, the project-locked reset deleted 47 operational test documents from `events`, `eventParticipants`, `eventStaffParticipants`, `eventDrivers`, and `eventVehicleTrips`. Post-reset verification reported zero remaining documents in those collections, no malformed/orphaned dependents, and unchanged reported preservation counts totaling 27 Firestore master/configuration documents. Firebase Authentication users were not targeted.

## 2026-08-19 CR-001 stabilization decision

Before lifecycle implementation, Product Owner approved leg-specific driver/occupant enforcement: moving a driver away warns, Cancel writes nothing, and Confirm atomically clears every disclosed applicable role with the occupant move, including consistent mirror consequences. Product Owner also moved every WhatsApp requirement to post-MVP; messaging is not part of CR-001 MVP acceptance, UAT, deployment, or go-live.

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
| CR-001 | Transportation trip lifecycle and participant vehicle assignments | Depart/Arrive accepted; return planning, Start Return, and audited roster corrections in implementation; Returned not implemented | [CR-001](change-requests/CR-001-transportation-trip-lifecycle.md) |

## CR-001 approval record

The product decisions for CR-001, including its authoritative corrections, were confirmed on 2026-08-18 and the stabilization decision above on 2026-08-19. CR-001 remains In implementation. Planning, grouped participants, Events-list cutover, target deactivation, participant cleanup, production legacy isolation, operational reset, and driver/occupant stabilization are implemented; lifecycle execution, frontend deployment, and final UAT remain separate authorized activities. WhatsApp is post-MVP.
## 2026-08-19 CR-001 Depart implementation decision

Product Owner authorized only the per-vehicle Depart milestone. The implementation uses a mandatory review and stale-state token followed by one client transaction. Unassigned participants and overcapacity remain warning-only for Admin and Staff. The transaction stores a durable departure snapshot, reconciles initial return occupancy, advances only `planned -> departed`, and starts the event only on the first departure. Rules mirror this boundary. Arrive at Event, Start Return, Returned, corrections, return editing, completion, WhatsApp/email, multi-run movements, routes/stops, saved locations, and frontend deployment remain excluded.
## 2026-08-20 CR-001 return milestone decision

After accepting corrected Depart/Arrive UAT, the Product Owner authorized return-only editing, exact per-vehicle Start Return, and append-only post-start return-roster corrections for active approved Admin and Staff. A correction changes effective roster records without replacing the immutable original Start Return snapshot or altering lifecycle/event timestamps. Returned, automatic completion, WhatsApp, generalized movements, Hosting, Functions deployment, and operational data remain excluded; manual return-milestone UAT is the next release gate.

## 2026-08-20 CR-001 Arrive at Event implementation decision

Product Owner authorized per-vehicle Arrive at Event before completing deferred Depart UAT 5–10, while explicitly blocking Start Return until combined manual Depart/Arrive UAT passes or identified defects are accepted. The implementation changes only `departed -> arrived_at_event`, records server arrival/audit UID, preserves event/participant/assignment/departure state, and includes no notifications, correction, return editing, completion, generalized movement, deployment of application code, or operational data creation. Automated verification may proceed; manual UAT remains pending.
