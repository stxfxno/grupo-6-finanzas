// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    adminOnly?: boolean;
    userOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    adminOnly = false,
    userOnly = false
}) => {
    const { state } = useAuth();
    const location = useLocation();

    // Mostrar loading mientras se verifica la autenticación
    if (state.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 text-gray-600">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Redirigir a login si no está autenticado
    if (!state.isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const user = state.user;
    const isAdmin = user?.isAdmin || false;

    // Verificar restricciones de rol
    if (adminOnly && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto">
                    <svg className="mx-auto h-16 w-16 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Acceso Restringido</h2>
                    <p className="mt-2 text-gray-600">
                        Esta página está reservada solo para administradores de la SMV.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    if (userOnly && isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto">
                    <svg className="mx-auto h-16 w-16 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Funcionalidad No Disponible</h2>
                    <p className="mt-2 text-gray-600">
                        Esta funcionalidad está disponible solo para empresas emisoras, no para administradores de la SMV.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;