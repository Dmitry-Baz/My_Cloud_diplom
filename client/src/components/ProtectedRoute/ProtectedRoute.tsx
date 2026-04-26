
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../store';

export const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    requireAdmin?: boolean;
}> = ({ children, requireAdmin }) => {
    const { token, isAdmin, loading } = useSelector((state: RootState) => state.auth);
    
    if (loading) {
        return <div>Загрузка...</div>;
    }
    
    if (!token) {
        return <Navigate to="/login" />;
    }
    
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" />;
    }
    
    return <>{children}</>;
};



