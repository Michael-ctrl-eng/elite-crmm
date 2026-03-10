import { UserRole } from "@prisma/client";

// Permission definitions for each role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    // Full access
    "tenant:manage",
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "deals:create",
    "deals:read",
    "deals:update",
    "deals:delete",
    "contacts:create",
    "contacts:read",
    "contacts:update",
    "contacts:delete",
    "companies:create",
    "companies:read",
    "companies:update",
    "companies:delete",
    "meetings:create",
    "meetings:read",
    "meetings:update",
    "meetings:delete",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:delete",
    "prospects:create",
    "prospects:read",
    "prospects:update",
    "prospects:delete",
    "settings:read",
    "settings:update",
    "reports:read",
    "activity:read",
  ],
  MANAGER: [
    // Most access except user management
    "deals:create",
    "deals:read",
    "deals:update",
    "deals:delete",
    "contacts:create",
    "contacts:read",
    "contacts:update",
    "contacts:delete",
    "companies:create",
    "companies:read",
    "companies:update",
    "companies:delete",
    "meetings:create",
    "meetings:read",
    "meetings:update",
    "meetings:delete",
    "tasks:create",
    "tasks:read",
    "tasks:update",
    "tasks:delete",
    "prospects:create",
    "prospects:read",
    "prospects:update",
    "prospects:delete",
    "settings:read",
    "reports:read",
    "activity:read",
  ],
  VIEWER: [
    // Read-only access
    "deals:read",
    "contacts:read",
    "companies:read",
    "meetings:read",
    "tasks:read",
    "prospects:read",
    "reports:read",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if user can perform action on a resource
 */
export function canPerform(role: UserRole, action: "create" | "read" | "update" | "delete", resource: string): boolean {
  const permission = `${resource}:${action}`;
  return hasPermission(role, permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

/**
 * Check if user is manager or admin
 */
export function isManagerOrAbove(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: "Full access to all features including user management and tenant settings",
  MANAGER: "Can manage deals, contacts, companies, meetings, and tasks. Cannot manage users.",
  VIEWER: "Read-only access to view data without editing capabilities",
};
