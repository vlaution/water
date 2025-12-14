import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../config/permissions';
import type { Permission } from '../../config/permissions';

interface RequirePermissionProps {
    permission: Permission;
    children: React.ReactNode;
    redirectTo?: string;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
    permission,
    children,
    redirectTo = "/"
}) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user || !hasPermission(user.role, permission)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};
