// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
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
      try {
        const parsedUser = JSON.parse(user);
        dispatch({ type: 'LOGIN_SUCCESS', payload: parsedUser });
      } catch (error) {
        // Si hay un error al parsear, eliminamos el item corrupto
        localStorage.removeItem('user');
      }
    }
  }, []); // Este efecto solo debe ejecutarse una vez al montar el componente

  // Función para iniciar sesión - Optimizada con useCallback
  const login = useCallback(async (ruc: string, password: string) => {
    dispatch({ type: 'LOADING' });
    
    try {
      // Obtener usuarios desde localStorage en lugar de API
      const usersString = localStorage.getItem('users');
      let users: User[] = [];
      
      if (usersString) {
        users = JSON.parse(usersString);
      }
      
      const user = users.find(u => u.ruc === ruc && u.password === password);
      
      if (user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Credenciales inválidas' });
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Error al iniciar sesión' });
    }
  }, []);

  // Función para registrar usuario - Optimizada con useCallback
  const register = useCallback(async (userData: Omit<User, 'isAdmin'>) => {
    dispatch({ type: 'LOADING' });
    
    try {
      // Obtener usuarios actuales de localStorage
      const usersString = localStorage.getItem('users');
      let users: User[] = [];
      
      if (usersString) {
        users = JSON.parse(usersString);
      }
      
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
      
      // Agregar el nuevo usuario y guardar en localStorage
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Despachar acción exitosa
      dispatch({ type: 'REGISTER_SUCCESS', payload: newUser });
    } catch (error) {
      dispatch({ type: 'REGISTER_FAILURE', payload: 'Error al registrar usuario' });
    }
  }, []);

  // Función para cerrar sesión - Optimizada con useCallback
  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Función para limpiar errores - Optimizada con useCallback
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Memoizar el valor del contexto para evitar recrearlo en cada renderizado
  const contextValue = useMemo(() => ({
    state,
    login,
    register,
    logout,
    clearError
  }), [state, login, register, logout, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
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