export const UserRole = {
    VIEWER: "viewer",
    ANALYST: "analyst",
    MANAGER: "manager",
    ADMIN: "admin",
    USER: "user" // Legacy
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const Permissions = {
    VIEW_COMPANY: "view_company",
    CREATE_VALUATION: "create_valuation",
    EDIT_VALUATION: "edit_valuation",
    DELETE_VALUATION: "delete_valuation",
    APPROVE_VALUATION: "approve_valuation",
    EXPORT_DATA: "export_data",
    MANAGE_USERS: "manage_users",
    CONFIGURE_SYSTEM: "configure_system",
    VIEW_AUDIT_LOGS: "view_audit_logs",
    VIEW_ANALYTICS: "view_analytics",
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

export const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
    [UserRole.VIEWER]: new Set([
        Permissions.VIEW_COMPANY,
    ]),
    [UserRole.ANALYST]: new Set([
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.EXPORT_DATA,
        Permissions.VIEW_ANALYTICS,
    ]),
    [UserRole.MANAGER]: new Set([
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.DELETE_VALUATION,
        Permissions.APPROVE_VALUATION,
        Permissions.EXPORT_DATA,
        Permissions.VIEW_ANALYTICS,
    ]),
    [UserRole.ADMIN]: new Set([
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.DELETE_VALUATION,
        Permissions.APPROVE_VALUATION,
        Permissions.EXPORT_DATA,
        Permissions.MANAGE_USERS,
        Permissions.CONFIGURE_SYSTEM,
        Permissions.VIEW_AUDIT_LOGS,
        Permissions.VIEW_ANALYTICS,
    ]),
    [UserRole.USER]: new Set([
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.EXPORT_DATA,
    ]),
};

export const hasPermission = (role: string | undefined, permission: Permission): boolean => {
    if (!role) return false;
    // Normalize role string to enum if needed, assuming backend sends lowercase
    const userRole = Object.values(UserRole).find(r => r === role) as UserRole;
    if (!userRole) return false;

    return ROLE_PERMISSIONS[userRole]?.has(permission) ?? false;
};
