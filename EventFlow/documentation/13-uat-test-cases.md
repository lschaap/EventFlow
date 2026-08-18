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

## Email

| ID | Scenario | Expected Result |
|---|---|---|
| UAT-078 | Confirm event | Plain-text confirmation email sent |
| UAT-079 | Confirmation email | Core operational details and EventFlow link present |

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
