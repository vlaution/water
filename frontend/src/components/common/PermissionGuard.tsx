import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../config/permissions';
import type { Permission } from '../../config/permissions';

interface PermissionGuardProps {
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    children,
    fallback = null
}) => {
    const { user } = useAuth();

    if (!user || !hasPermission(user.role, permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
