# UAT Test Cases

## CR-001 Grouped Participant Planning

- UAT-138: Admin and Staff can add/remove planned vehicles and manage both drivers for any event; inactive/unapproved users are denied and Staff cannot edit master data or transportation settings.
- UAT-139: Assign, move, and clear a student and a staff participant; departure and ordinary pre-Depart return assignments update atomically, while missing legacy fields display as Unassigned.
- UAT-140: Select mixed students/staff across groups, review destination/projected capacity, and apply one bulk move; selection clears on success and a failed validation makes no partial changes.
- UAT-141: Assign different departure and return drivers; each becomes an occupant of the driven vehicle for that leg, counts once, and the independent return driver's assignment survives ordinary departure moves.
- UAT-142: Replace or clear either driver; the former driver remains an event participant and retains their passenger vehicle fields.
- UAT-143: Confirm vehicle cards and Unassigned show per-leg occupants, `used/capacity`, available seats or overcapacity, and a distinct Transportation Incomplete warning.
- UAT-144: Confirm overcapacity warns but does not block individual or bulk saves, while inactive participants, removed/wrong-event trips, and overlapping vehicle/participant/driver use are rejected.
- UAT-145: Confirm return occupants are hidden before departure and no Depart, snapshot, independent return-passenger, correction, or other lifecycle controls are present.
- UAT-146: As Admin and Staff, bulk-move mixed occupants to a vehicle and Unassigned; confirm all selected records move together and selection clears.
- UAT-147: Force a bulk transaction validation failure; confirm no participant moves and the UI displays exactly `Bulk assignment failed. Please try again or try individual assignment.`
- UAT-148: Add a student and staff member from the combined section; confirm each immediately appears in Unassigned without refreshing the page and overview counts/dietary details refresh.
- UAT-149: Remove a student and staff member from any departure group; confirm each immediately disappears from the grouped list and overview counts/dietary details refresh.
- UAT-150: Confirm only one participant/transportation section is visible, its Add Student/Add Staff/Add Vehicle controls appear at the top, and return occupant lists or edit buttons are not shown before Depart.
- UAT-151: Assign a staff occupant as the departure driver, return driver, or both; remove the staff occupant, accept the warning, and confirm the participant and every applicable event-trip driver reference are removed together. Cancel the warning and confirm nothing changes.
- UAT-152: As both Admin and Staff, assign the final Unassigned occupant individually to a planned vehicle and confirm the person moves, the Unassigned count reaches zero, and success is shown. Simulate a rejected write and confirm a visible error replaces silent failure.
- UAT-153: With return transportation matching departure, confirm no Return driver selector is displayed. Mark return occupants as different and confirm the selector appears; restore matching and confirm it hides again and mirrors the departure driver.
- UAT-154: Confirm the future design specifies a separate Edit return vehicle assignments button per departed vehicle card, but no lifecycle or return-edit control is currently active.
- UAT-155: Create active and removed target trips plus conflicting legacy `eventDrivers`; confirm Events list displays only active target vehicles/drivers and shows a different return driver only where applicable.
- UAT-156: Confirm Events list departure assigned/total count, total capacity, Unassigned warning, per-vehicle overcapacity warning, explicit no-plan state, and malformed stored-count warning; no participant roster appears.
- UAT-157: As Admin, cancel eligible vehicle deactivation and confirm no writes. Confirm it and verify the planned trip is soft-removed, both drivers and matching participant leg fields clear, counts/dietary/unrelated assignments remain, and the vehicle becomes inactive.
- UAT-158: Verify vehicle deactivation preserves past, started, completed, cancelled, removed, non-planned, and unrelated trips. As Staff, confirm master vehicle deactivation is unavailable/denied.
- UAT-159: Remove an assigned student and verify status/audit/count/dietary updates plus both vehicle fields clear without driver changes.
- UAT-160: Remove staff who drives departure only, return only, both legs on one vehicle, and different vehicles by leg; verify warning cancellation writes nothing and confirmation clears participation, both leg fields, and only applicable target driver references.
- UAT-161: Clear/replace each target driver and verify former passenger assignment remains, replacement becomes one participant/occupant, mirroring stays consistent, and no `eventDrivers` record is created or changed.
- UAT-162: Run the reset command without apply and verify exact project, preserved collections, counts/IDs, and zero writes. Do not run apply during UAT without separate Product Owner approval.
- UAT-163: Individually move a departure driver to another vehicle and then Unassigned; verify the warning names the driver, source vehicle, and departure role, Cancel writes nothing, and Confirm atomically moves the occupant and clears the role.
- UAT-164: Bulk-move mixed students/staff containing multiple drivers; verify one warning lists every affected role, Confirm commits all participant and trip changes, and a forced failure commits none.
- UAT-165: Move a mirrored departure driver and verify both departure/return roles are disclosed and cleared with mirroring still true. Move only a mirrored return driver through the leg-aware service and verify departure remains while return clears and mirroring becomes false.
- UAT-166: Attempt a direct participant write that moves a driver without clearing the trip role, and a direct trip write that assigns a driver whose applicable participant field names another vehicle; verify Rules deny both.

## Authentication and Access

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-001 | Unauthenticated user opens protected route | Redirected to login |
| UAT-002 | Approved active user signs in | Access granted |
| UAT-003 | Authenticated user without approved EventFlow user record | Access denied |
| UAT-004 | Inactive EventFlow user signs in | Access denied |
| UAT-005 | Staff user opens admin-only function | Access denied / control unavailable |
| UAT-006 | Admin user opens admin function | Access granted |
| UAT-007 | Refresh while authenticated | Session remains valid |

## Event CRUD

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-008 | Create valid draft event | Event appears in Firestore and Events view |
| UAT-009 | Create event missing required field | Save rejected |
| UAT-010 | Return time before departure | Save rejected |
| UAT-011 | Edit draft event | Same document updates |
| UAT-012 | Cancel draft event | Status Cancelled; record remains |
| UAT-013 | Mark event Completed | Status/completedAt update |
| UAT-014 | Edit completed event | Update succeeds |
| UAT-015 | Event-list operational summary | Required fields visible |
| UAT-015A | Active Staff or Admin confirms a valid Draft event | Same event becomes Confirmed and `updatedAt` changes |
| UAT-015B | User cancels the confirmation prompt | No Firestore fields change |
| UAT-015C | Confirmed, Completed, or Cancelled event confirmation | Action unavailable and service/rules reject invalid transition |
| UAT-015D | Confirm structurally incomplete persisted Draft event | Rejected with a useful readiness message |
| UAT-015E | Confirm event with capacity or other operational warnings | Confirmation succeeds because warnings are not blockers |
| UAT-015F | Confirm event application-only integration check | No Calendar event, fabricated Calendar ID, synced status, or email is produced |

## Students and Student Participants

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-016 | Admin creates student grade 6-12 | Student created |
| UAT-017 | Admin attempts invalid grade | Rejected |
| UAT-018 | Admin updates student | Record updates |
| UAT-019 | Admin deactivates student | Removed from future selectors |
| UAT-020 | Historical event references inactive student | Still readable |
| UAT-021 | Staff attempts student master-data update | Denied |
| UAT-022 | Add active student | Appears once |
| UAT-023 | Add same student twice | Duplicate prevented |
| UAT-024 | Add inactive student | Unavailable/rejected |
| UAT-025 | Remove student | Relationship becomes removed |
| UAT-026 | Counts after add/remove | Recalculate correctly |
| UAT-027 | Add student with dietary restriction | Event indicator becomes true |
| UAT-028 | Remove last restricted student | Indicator recalculates |

## Staff and Staff Participants

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-029 | Admin creates staff | Record created |
| UAT-030 | Admin updates staff | Record updates |
| UAT-031 | Admin deactivates staff | Removed from future selectors |
| UAT-032 | Admin sets canDrive false | No longer appears as driver |
| UAT-033 | Staff attempts staff master-data update | Denied |
| UAT-033A | Admin updates staff dietary restrictions | Staff record updates |
| UAT-034 | Add active staff participant | Appears once |
| UAT-035 | Add same staff participant twice | Duplicate prevented |
| UAT-036 | Add inactive staff participant | Unavailable/rejected |
| UAT-037 | Remove staff participant | Relationship becomes removed |
| UAT-038 | Totals after staff add/remove | Recalculate |
| UAT-038A | Add/remove staff with dietary restrictions | Event dietary indicator recalculates |
| UAT-038B | Event has an active restricted participant | Event card and overview show the dietary indicator; details list the participant and restriction |
| UAT-038C | Event has no active restricted participants | Dietary indicator and detailed restriction section are hidden |

## Drivers and Vehicles

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-039 | Assign eligible driver | Succeeds |
| UAT-040 | Assign two eligible drivers | Both appear |
| UAT-041 | Assign same driver twice | Duplicate prevented |
| UAT-042 | Assign staff with canDrive false | Unavailable/rejected |
| UAT-043 | Assign inactive staff as driver | Unavailable/rejected |
| UAT-044 | Assign active vehicle | Displays with driver |
| UAT-045 | Assign a vehicle to the same event twice or to overlapping events | Assignment is prevented |
| UAT-046 | Assign inactive vehicle | Unavailable/rejected |
| UAT-047 | Remove driver | Marked removed |
| UAT-048 | Remove vehicle | Driver remains; vehicle cleared |
| UAT-048A | Change or clear a driver's vehicle | Same active assignment updates |
| UAT-048B | Remove and re-add driver | Same deterministic document is reused |
| UAT-048C | Event-list transportation summary | Driver and unique vehicle names display; warning appears only when upcoming-event capacity is below participant count |
| UAT-048D | Deactivate a vehicle used by future events | Confirmation lists event names; confirming clears only the future `vehicleId` values |
| UAT-048E | Remove a staff participant who is also a driver | Warning explains both assignments and associated vehicle/role are removed; cancel makes no changes and confirm removes both assignments atomically |
| UAT-048F | Assign a driver who is not yet participating | Driver and staff-participant records are created together; counts and dietary flag update |
| UAT-048G | Add a student, staff participant, or driver to an overlapping event | Operation is rejected and identifies the conflicting event |
| UAT-048H | Remove only a driver | Driver is removed while the staff participant remains |

## Activities and Event Types

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-049 | Admin creates activity | Available when active |
| UAT-050 | Admin deactivates activity | Removed from future selectors |
| UAT-051 | Historical event references inactive activity | Still resolvable |
| UAT-052 | Admin creates event type | Available when active |
| UAT-053 | Admin deactivates event type | Removed from future selectors |
| UAT-054 | Staff attempts configuration update | Denied |
| UAT-054A | Open Activities or Event Types configuration | Add form is initially hidden and records appear alphabetically in a separate section |
| UAT-054B | Add, edit, deactivate, or reactivate an Activity or Event Type | Controls and inline editing match the other Admin Configuration tabs; sort order is not displayed |

## Event Views and Search

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-055 | View upcoming events | Correct events shown |
| UAT-056 | View current events | Correct events shown |
| UAT-057 | View past events | Correct history shown |
| UAT-058 | Search by event name | Matching events shown |
| UAT-059 | Filter by date/date range | Matching events shown |
| UAT-060 | Filter by status/activity/type/location | Matching events shown |
| UAT-061 | Search by student | Related events shown |
| UAT-062 | Search by staff participant | Related events shown |
| UAT-063 | Search by driver | Related events shown |

## Dashboard

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-064 | Today's Events | Events overlapping today shown |
| UAT-065 | Needs Confirmation | Appropriate Draft events shown |
| UAT-066 | Event without driver | Appears in Driver Issues |
| UAT-067 | Recent participant/driver change | Eligible recent change displayed |

## Google Calendar

These cases remain pending the Calendar integration milestone.

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-068 | Confirm complete Draft event | Exactly one Calendar event created |
| UAT-069 | Confirm already-confirmed event | No duplicate |
| UAT-070 | Edit confirmed location | Existing Calendar event updates |
| UAT-071 | Edit confirmed times | Existing Calendar event updates |
| UAT-072 | Calendar payload | Required operational details present |
| UAT-073 | Dietary data | Only Yes/No indicator exposed |
| UAT-074 | Calendar create fails | Firestore preserved; failed recorded |
| UAT-075 | Calendar update fails | Firestore preserved; error recorded |
| UAT-076 | Cancel confirmed event | Calendar event deleted |
| UAT-077 | Calendar delete fails | Event remains cancelled; failure recorded |

## Notification Scope

Automated confirmation email is outside MVP and therefore has no MVP acceptance test.

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-078 | Confirm event | No automated email or WhatsApp action is required for MVP |
| UAT-079 | Notification persistence | Confirmation creates no notification or share-attempt state |

## Mobile and Regression

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-080 | Dashboard on mobile | No horizontal page overflow |
| UAT-081 | Create event on mobile | Form usable with touch |
| UAT-082 | Manage participants on mobile | Controls usable |
| UAT-083 | Events list on mobile | Summary readable |
| UAT-084 | Event details on mobile | Sections navigable |
| UAT-085 | Sign out | Protected routes inaccessible |
| UAT-086 | Production build | Build completes successfully |

## Approved Planned Transportation UAT (CR-001)

These cases define future acceptance; they are not evidence that CR-001 is implemented.

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-087 | Assign departure driver | Eligible driver becomes active staff participant and one departure occupant atomically |
| UAT-088 | Return before Depart | Return mirrors departure, independent list is hidden, and no role can edit it independently |
| UAT-089 | Depart snapshot | Depart atomically creates/reveals an independent return snapshot; later edits do not alter departure |
| UAT-090 | Depart with warnings | Review lists every unassigned active participant; confirmation proceeds and records server time/snapshot |
| UAT-091 | Depart without driver | Action is blocked with a clear driver requirement |
| UAT-092 | First vehicle departs | Trip/snapshot become departed and confirmed event becomes in_progress with startedAt atomically |
| UAT-093 | Skip or Staff undo | Action is unavailable and direct write is rejected |
| UAT-094 | Arrive at event | Arrival time records; messaging is not an MVP dependency |
| UAT-095 | Start return | Independent review runs and time records; messaging is not an MVP dependency |
| UAT-096 | Last vehicle returns | Trip becomes returned and event becomes completed atomically |
| UAT-097 | Vehicle-free event | Manual Start Event and Complete Event remain available |
| UAT-098 | Capacity definition | Stored capacity is total seats including driver; driver consumes exactly one seat even as participant |
| UAT-099 | Driver-only vehicle | Vehicle can depart with count one |
| UAT-100 | Remove participant-driver | Warning appears; confirmation clears participation, vehicle fields, and driver references atomically |
| UAT-101 | Per-leg overlap | Conflicts are independently detected for people, drivers, and vehicles |
| UAT-102 | Admin correction | Stage/timestamps/latest audit and recalculated event status/timestamps update atomically |
| UAT-103 | Deactivate vehicle | Eligible future references clear; historical/started records remain |
| UAT-105 | Vehicle messages | Outbound/return previews appear only at authoritative stages with correct leg data |
| UAT-107 | Completed/cancelled event | Normal transportation actions are unavailable; only authorized explicit correction remains |
| UAT-108 | Bulk departure assignment | Admin assigns multiple active participants; Staff is denied |
| UAT-109 | Staff return edit window | After Depart, Staff can move, assign, clear, and bulk-reassign return passengers among departed eligible vehicles |
| UAT-110 | Staff prohibited edits | Staff cannot edit departure, either driver, vehicles, corrections, or return passengers after Start Return |
| UAT-111 | Admin return driver | Admin can change eligible return driver; Staff cannot |
| UAT-112 | Return validation | Active participation/trip/stage, overlap, uniqueness, counts, driver dedupe, and capacity validation apply |
| UAT-113 | Cancel Depart review | No trip, participant, timestamp, snapshot, or event-status write occurs |
| UAT-114 | Cancel Start Return review | No trip, participant, timestamp, lock, or event-status write occurs |
| UAT-115 | Multiple vehicles different order | First departure starts event; intermediate returns do not complete; last applicable return completes |
| UAT-116 | Planned unused vehicle | A planned trip that never departed does not block completion and cannot cause premature completion |
| UAT-117 | Removed trip | Removed trip does not block or trigger completion |
| UAT-118 | Backward/forward correction | Returned trip corrected backward makes completed event in_progress and clears completedAt; forward correction completes with new completedAt |
| UAT-119 | Cancelled correction | Cancelled event remains cancelled through otherwise authorized correction |
| UAT-120 | Remove participant | Removal atomically clears departure/return assignments and applicable driver references |
| UAT-121 | Vehicle deactivation | Only not-started future assignments/drivers clear; started/history/cancelled/completed remain |
| UAT-125 | Vehicle-free Start | Staff/Admin changes confirmed to in_progress and records server startedAt |
| UAT-126 | Vehicle-free Complete | Staff/Admin changes confirmed/in_progress to completed and records completedAt |
| UAT-127 | No scheduled completion | Passing returnDateTime alone does not change status; no browser/read-time substitute occurs |
| UAT-128 | Transportation setting permissions | Admin updates default destination in Vehicles tab; Staff direct write is rejected |
| UAT-129 | Staff reads destination | Staff can use configured destination in operational display and return preview |
| UAT-130 | Capacity migration review | Existing test values are verified/corrected as total seats including driver before migration acceptance |
| UAT-131 | New trip mirror default | New planned trip has null drivers and returnDriverMirrorsDeparture true |
| UAT-132 | Mirrored departure changes | Assign/change/clear departure atomically updates return while mirroring |
| UAT-133 | Independent return | Explicit return select/clear sets mirroring false; later departure changes preserve return |
| UAT-134 | Restore driver mirror | Same as departure sets true and immediately copies departure, including null |
| UAT-135 | Driver synchronization | Different eligible drivers become active participants once; replacement/clear never removes participation |
| UAT-136 | Driver/trip authorization | Ineligible/overlapping/duplicate plans fail and Staff writes are denied |
| UAT-137 | Planned soft removal | Admin removal clears drivers, marks removed, and retains the document |

## Post-MVP WhatsApp Acceptance Considerations

The former UAT-104, UAT-106, UAT-122, UAT-123, and UAT-124 scenarios are deferred and are not MVP UAT or go-live blockers. A future user-initiated handoff must preserve confirmation-message privacy, editable preview without data writes, explicit Copy, best-effort Open behavior, existing staff-only group selection, no message state, and no launch/sent/delivery/attempt claims or persistence.
