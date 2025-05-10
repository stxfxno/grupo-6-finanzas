import { Bond } from "./Bond";
import { DocumentModel } from "./DocumentModel";
import { FlujoCaja } from "./FlujoCaja";

// src/models/DataState.ts
export interface DataState {
  bonds: Bond[];
  documents: DocumentModel[];
  currentBond: Bond | null;
  currentFlujoCaja: FlujoCaja | null;
  loading: boolean;
  error: string | null;
}