import { User } from "./User";

// src/models/AuthState.ts
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}