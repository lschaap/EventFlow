# UAT Test Cases

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
| UAT-078 | Confirm event | No automated email is sent; planned WhatsApp preview is governed by CR-001 |
| UAT-079 | Notification persistence | Confirmation does not create email, WhatsApp delivery, or share-attempt state |

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
| UAT-094 | Arrive at event | Arrival time records and outbound message becomes available only then |
| UAT-095 | Start return | Independent review runs, time records, and return message becomes available |
| UAT-096 | Last vehicle returns | Trip becomes returned and event becomes completed atomically |
| UAT-097 | Vehicle-free event | Manual Start Event and Complete Event remain available |
| UAT-098 | Capacity definition | Stored capacity is total seats including driver; driver consumes exactly one seat even as participant |
| UAT-099 | Driver-only vehicle | Vehicle can depart with count one |
| UAT-100 | Remove participant-driver | Warning appears; confirmation clears participation, vehicle fields, and driver references atomically |
| UAT-101 | Per-leg overlap | Conflicts are independently detected for people, drivers, and vehicles |
| UAT-102 | Admin correction | Stage/timestamps/latest audit and recalculated event status/timestamps update atomically |
| UAT-103 | Deactivate vehicle | Eligible future references clear; historical/started records remain |
| UAT-104 | Confirmation message privacy | Approved summary appears without participant names, restriction details, or contacts |
| UAT-105 | Vehicle messages | Outbound/return previews appear only at authoritative stages with correct leg data |
| UAT-106 | WhatsApp best-effort Open | Preview remains visible with Copy guidance and no opened/sent/delivery/attempt state is written |
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
| UAT-122 | WhatsApp edit | Editing preview changes no EventFlow record and is not correction history |
| UAT-123 | WhatsApp Copy | Copy works independently of Open WhatsApp |
| UAT-124 | No message state | No opened, sent, delivered, received, or share-attempt state is stored |
| UAT-125 | Vehicle-free Start | Staff/Admin changes confirmed to in_progress and records server startedAt |
| UAT-126 | Vehicle-free Complete | Staff/Admin changes confirmed/in_progress to completed and records completedAt |
| UAT-127 | No scheduled completion | Passing returnDateTime alone does not change status; no browser/read-time substitute occurs |
| UAT-128 | Transportation setting permissions | Admin updates default destination in Vehicles tab; Staff direct write is rejected |
| UAT-129 | Staff reads destination | Staff can use configured destination in operational display and return preview |
| UAT-130 | Capacity migration review | Existing test values are verified/corrected as total seats including driver before migration acceptance |
