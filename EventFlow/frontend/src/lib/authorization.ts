export function isAdminRole(role: string | null): role is 'admin' {
  return role === 'admin'
}

export function canManageMasterData(role: string | null): boolean {
  return isAdminRole(role)
}
