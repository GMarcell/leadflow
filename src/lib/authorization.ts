export type Role = "ADMIN" | "MANAGER" | "VIEWER" | "USER"

/**
 * Get the role from a session object.
 */
export function getUserRole(session: any): Role | undefined {
  return (session?.user as any)?.role as Role | undefined
}

/**
 * Check if the user can modify (create/update) resources.
 * Blocks VIEWER role.
 */
export function canModifyLead(sessionRole: Role | undefined): boolean {
  if (!sessionRole) return false
  if (sessionRole === "ADMIN") return true
  if (sessionRole === "MANAGER") return true
  if (sessionRole === "USER") return true
  return false // VIEWER is read-only
}

/**
 * Check if the user can delete resources.
 */
export function canDeleteLead(sessionRole: Role | undefined): boolean {
  if (!sessionRole) return false
  if (sessionRole === "ADMIN") return true
  if (sessionRole === "MANAGER") return true
  return false
}

/**
 * Returns 401 Response if not authenticated.
 */
export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}

/**
 * Returns 403 Response if authenticated but not authorized.
 */
export function forbidden(): Response {
  return Response.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
}
