// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '../models/User';
import { AuthState } from '../models/AuthState';
// Definición de acciones
type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOADING' };

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Reducer para gestionar acciones
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOADING':
      return {
        ...state,
        loading: true
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Tipo para el contexto
interface AuthContextType {
  state: AuthState;
  login: (ruc: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'isAdmin'>) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar si el usuario está almacenado en localStorage al cargar
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: JSON.parse(user) });
    }
  }, []);

  // Función para iniciar sesión
  const login = async (ruc: string, password: string) => {
    dispatch({ type: 'LOADING' });
    
    try {
      // En una aplicación real, esto sería una llamada a la API
      // Aquí simulamos leyendo un archivo JSON local
      const response = await fetch('/data/users.json');
      const users: User[] = await response.json();
      
      const user = users.find(u => u.ruc === ruc && u.password === password);
      
      if (user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Credenciales inválidas' });
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Error al iniciar sesión' });
    }
  };

  // Función para registrar usuario
  const register = async (userData: Omit<User, 'isAdmin'>) => {
    dispatch({ type: 'LOADING' });
    
    try {
      // En una aplicación real, esto sería una llamada a la API
      const response = await fetch('/data/users.json');
      const users: User[] = await response.json();
      
      // Verificar si el RUC ya existe
      if (users.some(u => u.ruc === userData.ruc)) {
        dispatch({ type: 'REGISTER_FAILURE', payload: 'El RUC ya está registrado' });
        return;
      }
      
      // Crear nuevo usuario (siempre como usuario regular, no admin)
      const newUser: User = {
        ...userData,
        isAdmin: false
      };
      
      // En una app real, aquí guardaríamos en la base de datos
      // Aquí solo simulamos el registro exitoso
      dispatch({ type: 'REGISTER_SUCCESS', payload: newUser });
      
      // En un escenario real, esto actualizaría el archivo users.json
    } catch (error) {
      dispatch({ type: 'REGISTER_FAILURE', payload: 'Error al registrar usuario' });
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};