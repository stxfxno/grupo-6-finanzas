import { Bond } from "./Bond";
import { FlujoCaja } from "./FlujoCaja";

 // src/models/DataState.ts
 export interface DataState {
    bonds: Bond[];
    documents: Document[];
    currentBond: Bond | null;
    currentFlujoCaja: FlujoCaja | null;
    loading: boolean;
    error: string | null;
  }