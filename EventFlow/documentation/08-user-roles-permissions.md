# User Roles and Permissions

## Roles

### Staff
Operational user who can manage events and assignments.

### Admin
Inherits all Staff capabilities and manages users and master data.

## Implemented Permission Matrix

This matrix describes the current application. Its driver/vehicle assignment permissions are superseded for the planned CR-001 target by the matrix below.

| Capability | Admin | Staff |
|---|:---:|:---:|
| Sign in | ✓ | ✓ |
| View dashboard/events | ✓ | ✓ |
| Search/filter events | ✓ | ✓ |
| Create/edit/confirm/complete/cancel event | ✓ | ✓ |
| Add/remove student participant | ✓ | ✓ |
| Add/remove staff participant | ✓ | ✓ |
| Assign/remove driver | ✓ | ✓ |
| Assign/remove vehicle | ✓ | ✓ |
| View meals/dietary indicator | ✓ | ✓ |
| View participant names/grades | ✓ | ✓ |
| Create/update/activate student | ✓ | ✗ |
| Create/update/activate staff | ✓ | ✗ |
| Change `canDrive` | ✓ | ✗ |
| Create/update/activate vehicle | ✓ | ✗ |
| Create/update/activate activity | ✓ | ✗ |
| Create/update/activate event type | ✓ | ✗ |
| Create/manage EventFlow user | ✓ | ✗ |
| Assign Admin/Staff role | ✓ | ✗ |
| Activate/deactivate application user | ✓ | ✗ |

## Access Rule
Google authentication alone is insufficient. The authenticated user must have an approved EventFlow user record with `active = true`.

## Driver Rule
Drivers are active staff members with:

```text
canDrive = true
```

## Approved Planned Transportation Permissions (CR-001)

The latest approved milestone supersedes rows below that describe Staff transportation planning as read-only or return-only: active approved Admin and Staff users may add/soft-remove planned vehicles, manage either leg's driver and mirroring, move departure passengers, and perform bounded return-roster corrections for every EventFlow event. Both roles use identical planning validation. Master data, application users, transportation settings, and broader lifecycle corrections remain Admin-only.

| Transportation capability | Staff | Admin |
|---|---:|---:|
| View transportation plan and trip progress | Yes | Yes |
| Assign/change participant departure vehicle | Yes | Yes |
| Edit return passengers before Depart | No | No; return mirrors departure |
| Edit return passengers after relevant vehicle Depart and before Start Return | Yes | Yes |
| Edit return passengers after Start Return through ordinary controls | No | No |
| Assign/change departure or return driver | Yes | Yes |
| Add/remove an event vehicle | Yes | Yes |
| Perform the next valid Depart/Arrive/Start Return/Returned action | Yes | Yes |
| Skip or undo a stage through normal controls | No | No |
| Use explicit return-roster correction workflow after Start Return | Yes | Yes |
| Configure default return destination in Admin Configuration > Vehicles | No | Yes |
| Preview/copy/open an Event Details WhatsApp message | Post-MVP | Post-MVP |

All users must still be authenticated, approved, and active. A driver must additionally be active staff with `canDrive = true`. Staff return edits save immediately after the same participant/trip/overlap/capacity validation used for Admin edits and target only departed or arrived vehicles before return start. Rules, not UI visibility alone, enforce these boundaries.

Current implementation note: **Depart**, **Arrive at Event**, ordinary return editing, **Start Return**, and audited return-roster corrections are available to both active approved roles. Returned and automatic completion remain planned; configuration remains Admin-only.

The current milestone supersedes older Admin-only correction text for return-roster records: active approved Staff and Admin may append bounded return corrections after Start Return, after Returned fixture states, and after event completion. Neither role can update/delete correction history, overwrite original snapshots, reopen lifecycle stages, or alter departure assignments through this workflow.

For both Admin and Staff, moving a driver occupant away from the vehicle they drive requires a disclosed confirmation and atomically clears the applicable role. Cancelling writes nothing. WhatsApp permissions are not active MVP permissions.
