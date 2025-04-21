// src/models/Bond.ts
export interface Bond {
    id: string;
    userRuc: string;
    valorNominal: number;
    fechaEmision: string;
    fechaVencimiento: string;
    tasaInteres: number;
    tipoTasa: 'nominal' | 'efectiva';
    frecuenciaPago: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
    comisiones: number;
    gastos: number;
    periodoGracia: 'ninguno' | 'total' | 'parcial';
    duracionPeriodoGracia: number;
    createdAt: string;
    updatedAt: string;
  }