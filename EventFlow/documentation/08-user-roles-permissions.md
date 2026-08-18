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

| Transportation capability | Staff | Admin |
|---|---:|---:|
| View transportation plan and trip progress | Yes | Yes |
| Assign/change participant departure or return vehicle | No | Yes |
| Assign/change departure or return driver | No | Yes |
| Add/remove an event vehicle | No | Yes |
| Perform the next valid Depart/Arrive/Start Return/Returned action | Yes | Yes |
| Skip or undo a stage through normal controls | No | No |
| Use explicit correction workflow after a leg begins | No | Yes |
| Configure default return destination | No | Yes |
| Preview/copy/open an available Event Details WhatsApp message | Yes | Yes |

All users must still be authenticated, approved, and active. A driver must additionally be active staff with `canDrive = true`. Firestore Rules, not UI visibility alone, enforce these boundaries.
