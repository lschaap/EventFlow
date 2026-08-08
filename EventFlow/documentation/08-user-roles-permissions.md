# User Roles and Permissions

## Roles

### Staff
Operational user who can manage events and assignments.

### Admin
Inherits all Staff capabilities and manages users and master data.

## Permission Matrix

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
