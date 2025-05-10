// src/context/DataContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bond } from '../models/Bond';
import { FlujoCaja } from '../models/FlujoCaja';
import { DataState } from '../models/DataState';
import { DocumentModel } from '../models/DocumentModel';
import { useAuth } from './AuthContext';
import { calcularFlujoFrances } from '../utils/bondCalculations';

// Definición de acciones
type DataAction =
  | { type: 'SET_BONDS'; payload: Bond[] }
  | { type: 'ADD_BOND'; payload: Bond }
  | { type: 'UPDATE_BOND'; payload: Bond }
  | { type: 'DELETE_BOND'; payload: string }
  | { type: 'SET_CURRENT_BOND'; payload: Bond | null }
  | { type: 'SET_CURRENT_FLUJO'; payload: FlujoCaja | null }
  | { type: 'SET_DOCUMENTS'; payload: DocumentModel[] }
  | { type: 'ADD_DOCUMENT'; payload: DocumentModel }
  | { type: 'UPDATE_DOCUMENT'; payload: DocumentModel }
  | { type: 'LOADING' }
  | { type: 'ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialState: DataState = {
  bonds: [],
  documents: [],
  currentBond: null,
  currentFlujoCaja: null,
  loading: false,
  error: null
};

// Reducer para gestionar acciones
const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'LOADING':
      return {
        ...state,
        loading: true
      };
    case 'SET_BONDS':
      return {
        ...state,
        bonds: action.payload,
        loading: false
      };
    case 'ADD_BOND':
      return {
        ...state,
        bonds: [...state.bonds, action.payload],
        currentBond: action.payload,
        loading: false
      };
    case 'UPDATE_BOND':
      return {
        ...state,
        bonds: state.bonds.map(bond =>
          bond.id === action.payload.id ? action.payload : bond
        ),
        currentBond: action.payload,
        loading: false
      };
    case 'DELETE_BOND':
      return {
        ...state,
        bonds: state.bonds.filter(bond => bond.id !== action.payload),
        currentBond: null,
        loading: false
      };
    case 'SET_CURRENT_BOND':
      return {
        ...state,
        currentBond: action.payload,
        loading: false
      };
    case 'SET_CURRENT_FLUJO':
      return {
        ...state,
        currentFlujoCaja: action.payload,
        loading: false
      };
    case 'SET_DOCUMENTS':
      return {
        ...state,
        documents: action.payload,
        loading: false
      };
    case 'ADD_DOCUMENT':
      return {
        ...state,
        documents: [...state.documents, action.payload],
        loading: false
      };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === action.payload.id ? action.payload : doc
        ),
        loading: false
      };
    case 'ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
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
interface DataContextType {
  state: DataState;
  loadBonds: () => Promise<void>;
  createBond: (bondData: Omit<Bond, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBond: (bond: Bond) => Promise<void>;
  deleteBond: (bondId: string) => Promise<void>;
  setCurrentBond: (bond: Bond | null) => void;
  clearError: () => void;
  loadDocuments: () => Promise<void>;
  uploadDocument: (documentData: Omit<DocumentModel, 'id' | 'fechaSubida' | 'estado'>) => Promise<void>;
  updateDocumentStatus: (documentId: string, estado: 'aprobado' | 'rechazado', comentarios?: string) => Promise<void>;
}

// Crear el contexto
const DataContext = createContext<DataContextType | undefined>(undefined);

// Proveedor del contexto
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { state: authState } = useAuth();

  // Función para calcular flujo de caja - Optimizada con useCallback
  const calculateFlujoCaja = useCallback(async (bond: Bond) => {
    dispatch({ type: 'LOADING' });

    try {
      // Usamos la función de utils para calcular
      const flujoCaja = calcularFlujoFrances(bond);

      dispatch({ type: 'SET_CURRENT_FLUJO', payload: flujoCaja });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al calcular flujo de caja' });
    }
  }, []);

  // Función para cargar bonos - Optimizada con useCallback
  const loadBonds = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    dispatch({ type: 'LOADING' });

    try {
      // En una app real, aquí haríamos una llamada a API
      // En este caso, obtenemos los datos desde localStorage
      const bondsString = localStorage.getItem('bonds');
      const userRuc = authState.user?.ruc;

      if (bondsString) {
        const allBonds: Bond[] = JSON.parse(bondsString);

        // Filtrar solo los bonos del usuario actual
        const userBonds = allBonds.filter(bond => bond.userRuc === userRuc);

        dispatch({ type: 'SET_BONDS', payload: userBonds });
      } else {
        dispatch({ type: 'SET_BONDS', payload: [] });
      }
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al cargar bonos' });
    }
  }, [authState.isAuthenticated, authState.user?.ruc]);

  // Función para crear un nuevo bono - Optimizada con useCallback
  const createBond = useCallback(async (bondData: Omit<Bond, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!authState.user) return;

    dispatch({ type: 'LOADING' });

    try {
      const now = new Date().toISOString();

      // Crear objeto de bono con ID único
      const newBond: Bond = {
        ...bondData,
        id: uuidv4(),
        userRuc: authState.user.ruc,
        createdAt: now,
        updatedAt: now
      };

      // Obtener bonos actuales
      const bondsString = localStorage.getItem('bonds');
      let bonds: Bond[] = [];

      if (bondsString) {
        bonds = JSON.parse(bondsString);
      }

      // Agregar nuevo bono y guardar
      bonds.push(newBond);
      localStorage.setItem('bonds', JSON.stringify(bonds));

      dispatch({ type: 'ADD_BOND', payload: newBond });
      calculateFlujoCaja(newBond);
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al crear bono' });
    }
  }, [authState.user, calculateFlujoCaja]);

  // Función para actualizar un bono - Optimizada con useCallback
  const updateBond = useCallback(async (bond: Bond) => {
    if (!authState.user) return;

    dispatch({ type: 'LOADING' });

    try {
      // Actualizar timestamp
      const updatedBond: Bond = {
        ...bond,
        updatedAt: new Date().toISOString()
      };

      // Obtener bonos actuales
      const bondsString = localStorage.getItem('bonds');
      let bonds: Bond[] = [];

      if (bondsString) {
        bonds = JSON.parse(bondsString);
      }

      // Actualizar bono específico
      const updatedBonds = bonds.map(b =>
        b.id === updatedBond.id ? updatedBond : b
      );

      localStorage.setItem('bonds', JSON.stringify(updatedBonds));

      dispatch({ type: 'UPDATE_BOND', payload: updatedBond });
      calculateFlujoCaja(updatedBond);
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al actualizar bono' });
    }
  }, [authState.user, calculateFlujoCaja]);

  // Función para eliminar un bono - Optimizada con useCallback
  const deleteBond = useCallback(async (bondId: string) => {
    if (!authState.user) return;

    dispatch({ type: 'LOADING' });

    try {
      // Obtener bonos actuales
      const bondsString = localStorage.getItem('bonds');
      let bonds: Bond[] = [];

      if (bondsString) {
        bonds = JSON.parse(bondsString);
      }

      // Filtrar bono a eliminar
      const updatedBonds = bonds.filter(bond => bond.id !== bondId);

      localStorage.setItem('bonds', JSON.stringify(updatedBonds));

      dispatch({ type: 'DELETE_BOND', payload: bondId });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al eliminar bono' });
    }
  }, [authState.user]);

  // Función para establecer bono actual - Optimizada con useCallback
  const setCurrentBond = useCallback((bond: Bond | null) => {
    dispatch({ type: 'SET_CURRENT_BOND', payload: bond });

    if (bond) {
      // Solo calcular si el ID del bono ha cambiado o si el bono es nuevo
      if (!state.currentBond || bond.id !== state.currentBond.id) {
        calculateFlujoCaja(bond);
      }
    } else {
      dispatch({ type: 'SET_CURRENT_FLUJO', payload: null });
    }
  }, [calculateFlujoCaja, state.currentBond]);

  // Función para cargar documentos - Optimizada con useCallback
  const loadDocuments = useCallback(async () => {
    if (!authState.isAuthenticated) return;

    dispatch({ type: 'LOADING' });

    try {
      // En una app real, aquí haríamos una llamada a API
      // En este caso, obtenemos los datos desde localStorage
      const documentsString = localStorage.getItem('documents');
      const userRuc = authState.user?.ruc;
      const isAdmin = authState.user?.isAdmin;

      if (documentsString) {
        const allDocuments: DocumentModel[] = JSON.parse(documentsString);

        // Si es admin, puede ver todos los documentos
        // Si es usuario normal, solo sus documentos
        const filteredDocuments = isAdmin
          ? allDocuments
          : allDocuments.filter(doc => doc.userRuc === userRuc);

        dispatch({ type: 'SET_DOCUMENTS', payload: filteredDocuments });
      } else {
        dispatch({ type: 'SET_DOCUMENTS', payload: [] });
      }
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al cargar documentos' });
    }
  }, [authState.isAuthenticated, authState.user?.isAdmin, authState.user?.ruc]);

  // Función para subir documento - Optimizada con useCallback
  const uploadDocument = useCallback(async (documentData: Omit<DocumentModel, 'id' | 'fechaSubida' | 'estado'>) => {
    if (!authState.user) return;

    dispatch({ type: 'LOADING' });

    try {
      const now = new Date().toISOString();

      // Crear objeto de documento con ID único
      const newDocument: DocumentModel = {
        ...documentData,
        id: uuidv4(),
        fechaSubida: now,
        estado: 'pendiente',
        comentarios: ''
      };

      // Obtener documentos actuales
      const documentsString = localStorage.getItem('documents');
      let documents: DocumentModel[] = [];

      if (documentsString) {
        documents = JSON.parse(documentsString);
      }

      // Agregar nuevo documento y guardar
      documents.push(newDocument);
      localStorage.setItem('documents', JSON.stringify(documents));

      dispatch({ type: 'ADD_DOCUMENT', payload: newDocument });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al subir documento' });
    }
  }, [authState.user]);

  // Función para actualizar estado de documento (solo admin) - Optimizada con useCallback
  const updateDocumentStatus = useCallback(async (documentId: string, estado: 'aprobado' | 'rechazado', comentarios?: string) => {
    if (!authState.user?.isAdmin) return;

    dispatch({ type: 'LOADING' });

    try {
      const docToUpdate = state.documents.find(doc => doc.id === documentId);

      if (!docToUpdate) {
        dispatch({ type: 'ERROR', payload: 'Documento no encontrado' });
        return;
      }

      const updatedDocument: DocumentModel = {
        ...docToUpdate,
        estado,
        comentarios: comentarios || docToUpdate.comentarios,
        fechaVerificacion: new Date().toISOString()
      };

      // Obtener documentos actuales
      const documentsString = localStorage.getItem('documents');
      let documents: DocumentModel[] = [];

      if (documentsString) {
        documents = JSON.parse(documentsString);
      }

      // Actualizar documento
      const updatedDocuments = documents.map(doc =>
        doc.id === updatedDocument.id ? updatedDocument : doc
      );

      localStorage.setItem('documents', JSON.stringify(updatedDocuments));

      dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedDocument });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al actualizar estado del documento' });
    }
  }, [authState.user?.isAdmin, state.documents]);

  // Función para limpiar errores - Optimizada con useCallback
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Cargar datos iniciales cuando el usuario está autenticado
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadBonds();
      loadDocuments();
    }
  }, [authState.isAuthenticated, loadBonds, loadDocuments]);

  // Valor del contexto memoizado
  const contextValue = useMemo(() => ({
    state,
    loadBonds,
    createBond,
    updateBond,
    deleteBond,
    setCurrentBond,
    clearError,
    loadDocuments,
    uploadDocument,
    updateDocumentStatus
  }), [
    state,
    loadBonds,
    createBond,
    updateBond,
    deleteBond,
    setCurrentBond,
    clearError,
    loadDocuments,
    uploadDocument,
    updateDocumentStatus
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};