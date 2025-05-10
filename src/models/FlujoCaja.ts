// src/models/FlujoCaja.ts
export interface CuotaFlujo {
    numeroCuota: number;
    fecha: string;
    cuota: number;
    interes: number;
    amortizacion: number;
    saldo: number;
}


export interface FlujoCaja {
    bondId: string;
    cuotas: CuotaFlujo[];
    tcea: number;
    trea: number;
    duracion: number;
    duracionModificada: number;
    convexidad: number;
    precioMaximo: number;
}
