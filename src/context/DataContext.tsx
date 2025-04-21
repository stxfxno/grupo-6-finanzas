// src/context/DataContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Bond } from '../models/Bond';
import { FlujoCaja} from '../models/FlujoCaja';
import { DataState } from '../models/DataState';
import { Document } from '../models/Document';
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
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
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
        error: action.payload,
        loading: false
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
  calculateFlujoCaja: (bond: Bond) => Promise<void>;
  loadDocuments: () => Promise<void>;
  uploadDocument: (document: Omit<Document, 'id' | 'fechaSubida' | 'estado'>) => Promise<void>;
  updateDocumentStatus: (documentId: string, estado: 'aprobado' | 'rechazado', comentarios?: string) => Promise<void>;
  clearError: () => void;
}

// Crear el contexto
const DataContext = createContext<DataContextType | undefined>(undefined);

// Proveedor del contexto
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { state: authState } = useAuth();

  // Cargar datos iniciales cuando el usuario está autenticado
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadBonds();
      loadDocuments();
    }
  }, [authState.isAuthenticated]);

  // Función para cargar bonos
  const loadBonds = async () => {
    if (!authState.user) return;
    
    dispatch({ type: 'LOADING' });
    
    try {
      // Cargar bonos desde localStorage
      const bondsString = localStorage.getItem('bonds');
      let allBonds: Bond[] = [];
      
      if (bondsString) {
        allBonds = JSON.parse(bondsString);
      }
      
      // Filtrar bonos por usuario o mostrar todos si es admin
      const userBonds = authState.user.isAdmin 
        ? allBonds 
        : allBonds.filter(bond => bond.userRuc === authState.user?.ruc);
      
      dispatch({ type: 'SET_BONDS', payload: userBonds });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al cargar bonos' });
    }
  };

  // Función para crear bono
  const createBond = async (bondData: Omit<Bond, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!authState.user) return;
    
    dispatch({ type: 'LOADING' });
    
    try {
      const newBond: Bond = {
        ...bondData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      
      // Calcular flujo de caja automáticamente
      await calculateFlujoCaja(newBond);
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al crear bono' });
    }
  };

  // Función para actualizar bono
  const updateBond = async (bond: Bond) => {
    dispatch({ type: 'LOADING' });
    
    try {
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
      
      // Actualizar bono existente
      const updatedBonds = bonds.map(b => b.id === updatedBond.id ? updatedBond : b);
      localStorage.setItem('bonds', JSON.stringify(updatedBonds));
      
      dispatch({ type: 'UPDATE_BOND', payload: updatedBond });
      
      // Recalcular flujo de caja
      await calculateFlujoCaja(updatedBond);
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al actualizar bono' });
    }
  };

  // Función para eliminar bono
  const deleteBond = async (bondId: string) => {
    dispatch({ type: 'LOADING' });
    
    try {
      // Obtener bonos actuales
      const bondsString = localStorage.getItem('bonds');
      let bonds: Bond[] = [];
      
      if (bondsString) {
        bonds = JSON.parse(bondsString);
      }
      
      // Eliminar bono
      const filteredBonds = bonds.filter(bond => bond.id !== bondId);
      localStorage.setItem('bonds', JSON.stringify(filteredBonds));
      
      dispatch({ type: 'DELETE_BOND', payload: bondId });
      dispatch({ type: 'SET_CURRENT_FLUJO', payload: null });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al eliminar bono' });
    }
  };

  // Función para establecer bono actual
  const setCurrentBond = (bond: Bond | null) => {
    dispatch({ type: 'SET_CURRENT_BOND', payload: bond });
    
    if (bond) {
      calculateFlujoCaja(bond);
    } else {
      dispatch({ type: 'SET_CURRENT_FLUJO', payload: null });
    }
  };

  // Función para calcular flujo de caja
  const calculateFlujoCaja = async (bond: Bond) => {
    dispatch({ type: 'LOADING' });
    
    try {
      // Usamos la función de utils para calcular
      const flujoCaja = calcularFlujoFrances(bond);
      
      dispatch({ type: 'SET_CURRENT_FLUJO', payload: flujoCaja });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al calcular flujo de caja' });
    }
  };

  // Función para cargar documentos
  const loadDocuments = async () => {
    if (!authState.user) return;
    
    dispatch({ type: 'LOADING' });
    
    try {
      // Cargar documentos desde localStorage
      const documentsString = localStorage.getItem('documents');
      let allDocuments: Document[] = [];
      
      if (documentsString) {
        allDocuments = JSON.parse(documentsString);
      }
      
      // Filtrar documentos por usuario o mostrar todos si es admin
      const userDocuments = authState.user.isAdmin 
        ? allDocuments 
        : allDocuments.filter(doc => doc.userRuc === authState.user?.ruc);
      
      dispatch({ type: 'SET_DOCUMENTS', payload: userDocuments });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: 'Error al cargar documentos' });
    }
  };

  // Función para subir documento
  const uploadDocument = async (documentData: Omit<Document, 'id' | 'fechaSubida' | 'estado'>) => {
    if (!authState.user) return;
    
    dispatch({ type: 'LOADING' });
    
    try {
      const newDocument: Document = {
        ...documentData,
        id: uuidv4(),
        fechaSubida: new Date().toISOString(),
        estado: 'pendiente'
      };
      
      // Obtener documentos actuales
      const documentsString = localStorage.getItem('documents');
      let documents: Document[] = [];
      
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
  };

  // Función para actualizar estado de documento (solo admin)
  const updateDocumentStatus = async (documentId: string, estado: 'aprobado' | 'rechazado', comentarios?: string) => {
    if (!authState.user?.isAdmin) return;
    
    dispatch({ type: 'LOADING' });
    
    try {
      const docToUpdate = state.documents.find(doc => doc.id === documentId);
      
      if (!docToUpdate) {
        dispatch({ type: 'ERROR', payload: 'Documento no encontrado' });
        return;
      }
      
      const updatedDocument: Document = {
        ...docToUpdate,
        estado,
        comentarios: comentarios || docToUpdate.comentarios,
        fechaVerificacion: new Date().toISOString()
      };
      
      // Obtener documentos actuales
      const documentsString = localStorage.getItem('documents');
      let documents: Document[] = [];
      
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
  };

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <DataContext.Provider 
      value={{ 
        state, 
        loadBonds, 
        createBond, 
        updateBond, 
        deleteBond, 
        setCurrentBond, 
        calculateFlujoCaja, 
        loadDocuments, 
        uploadDocument, 
        updateDocumentStatus, 
        clearError 
      }}
    >
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