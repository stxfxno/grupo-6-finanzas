// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Importar páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/DashBoard';
import BondForm from './pages/BondForm';
import BondDetail from './pages/BondDetail';
import DocumentManager from './pages/DocumentManager';

// Componente de ruta protegida que verifica autenticación
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Componente de ruta para admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!state.isAuthenticated || !state.user?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

// Configuración de datos iniciales en localStorage para simular
const initializeData = () => {
  // Verificar si ya existe data
  if (!localStorage.getItem('users')) {
    // Crear usuario admin y usuario regular
    const users = [
      {
        ruc: '20100123456',
        razonSocial: 'Administrador SMV',
        direccion: 'Av. Santa Cruz 315, Miraflores',
        sectorEmpresarial: 'Servicios financieros',
        password: 'admin123',
        isAdmin: true
      },
      {
        ruc: '20123456789',
        razonSocial: 'Empresa Demo S.A.C.',
        direccion: 'Av. El Derby 254, Santiago de Surco',
        sectorEmpresarial: 'Energía',
        password: 'demo123',
        isAdmin: false
      }
    ];
    
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  if (!localStorage.getItem('bonds')) {
    localStorage.setItem('bonds', JSON.stringify([]));
  }
  
  if (!localStorage.getItem('documents')) {
    localStorage.setItem('documents', JSON.stringify([]));
  }
};

const App: React.FC = () => {
  // Inicializar datos de ejemplo al cargar la aplicación
  React.useEffect(() => {
    initializeData();
  }, []);
  
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bonds/new" 
              element={
                <ProtectedRoute>
                  <BondForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bonds/edit/:bondId" 
              element={
                <ProtectedRoute>
                  <BondForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bonds/:bondId" 
              element={
                <ProtectedRoute>
                  <BondDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documents" 
              element={
                <ProtectedRoute>
                  <DocumentManager />
                </ProtectedRoute>
              } 
            />
            
            {/* Redireccionar a login por defecto */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;