from backend.database.models import UserRole

# Permission Constants
class Permissions:
    VIEW_COMPANY = "view_company"
    CREATE_VALUATION = "create_valuation"
    EDIT_VALUATION = "edit_valuation"
    DELETE_VALUATION = "delete_valuation"
    APPROVE_VALUATION = "approve_valuation"
    EXPORT_DATA = "export_data"
    MANAGE_USERS = "manage_users"
    CONFIGURE_SYSTEM = "configure_system"

# Role to Permission Mapping
ROLE_PERMISSIONS = {
    UserRole.viewer: {
        Permissions.VIEW_COMPANY,
    },
    UserRole.analyst: {
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.EXPORT_DATA,
    },
    UserRole.manager: {
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.DELETE_VALUATION,
        Permissions.APPROVE_VALUATION,
        Permissions.EXPORT_DATA,
    },
    UserRole.admin: {
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.DELETE_VALUATION,
        Permissions.APPROVE_VALUATION,
        Permissions.EXPORT_DATA,
        Permissions.MANAGE_USERS,
        Permissions.CONFIGURE_SYSTEM,
    },
    # Legacy support
    UserRole.user: {
        Permissions.VIEW_COMPANY,
        Permissions.CREATE_VALUATION,
        Permissions.EDIT_VALUATION,
        Permissions.EXPORT_DATA,
    }
}

def check_permission(role: UserRole, permission: str) -> bool:
    """
    Check if a role has a specific permission.
    """
    return permission in ROLE_PERMISSIONS.get(role, set())
