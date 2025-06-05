// src/utils/bondCalculations.ts - Versión actualizada con período 0
import {FlujoCaja, CuotaFlujo } from '../models/FlujoCaja';
import {Bond} from '../models/Bond';

// Función para calcular el flujo de caja con método francés
export const calcularFlujoFrances = (bond: Bond): FlujoCaja => {
  const {
    id,
    valorNominal,
    fechaEmision,
    fechaVencimiento,
    tasaInteres,
    tipoTasa,
    frecuenciaPago,
    comisiones,
    gastos,
    periodoGracia,
    duracionPeriodoGracia
  } = bond;

  // Convertir fechas a objetos Date
  const fechaInicio = new Date(fechaEmision);
  const fechaFin = new Date(fechaVencimiento);

  // Calcular número de periodos (meses)
  const mesesTotal = Math.round(
    (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Calcular número de cuotas según frecuencia de pago
  let periodosPorAnio: number;
  switch (frecuenciaPago) {
    case 'mensual':
      periodosPorAnio = 12;
      break;
    case 'bimestral':
      periodosPorAnio = 6;
      break;
    case 'trimestral':
      periodosPorAnio = 4;
      break;
    case 'semestral':
      periodosPorAnio = 2;
      break;
    case 'anual':
      periodosPorAnio = 1;
      break;
    default:
      periodosPorAnio = 12;
  }

  const numeroCuotas = Math.ceil(mesesTotal / (12 / periodosPorAnio));

  // Convertir tasa a efectiva por periodo si es nominal
  let tasaEfectivaPorPeriodo: number;
  if (tipoTasa === 'nominal') {
    // Tasa nominal anual a tasa efectiva por periodo
    const tasaNominalPorPeriodo = tasaInteres / periodosPorAnio;
    tasaEfectivaPorPeriodo = Math.pow(1 + tasaNominalPorPeriodo / 100, 1) - 1;
  } else {
    // Tasa efectiva anual a tasa efectiva por periodo
    tasaEfectivaPorPeriodo = Math.pow(1 + tasaInteres / 100, 1 / periodosPorAnio) - 1;
  }

  // Calcular cuota constante (método francés)
  const cuotaConstante = calcularCuotaConstante(
    valorNominal,
    tasaEfectivaPorPeriodo,
    numeroCuotas,
    periodoGracia,
    duracionPeriodoGracia
  );

  // Generar flujo de caja (incluyendo período 0)
  const cuotas: CuotaFlujo[] = generarFlujoCaja(
    valorNominal,
    tasaEfectivaPorPeriodo,
    numeroCuotas,
    cuotaConstante,
    fechaInicio,
    12 / periodosPorAnio,
    periodoGracia,
    duracionPeriodoGracia,
    comisiones,
    gastos
  );

  // Calcular indicadores financieros (excluyendo período 0 para los cálculos)
  const cuotasSinPeriodo0 = cuotas.filter(cuota => cuota.numeroCuota > 0);
  const tcea = calcularTCEA(valorNominal, cuotasSinPeriodo0, periodosPorAnio);
  const trea = calcularTREA(valorNominal, comisiones, gastos, cuotasSinPeriodo0, periodosPorAnio);
  const { duracion, duracionModificada } = calcularDuracion(cuotasSinPeriodo0, tasaEfectivaPorPeriodo);
  const convexidad = calcularConvexidad(cuotasSinPeriodo0, tasaEfectivaPorPeriodo);
  const precioMaximo = calcularPrecioMaximo(valorNominal, cuotasSinPeriodo0, tasaEfectivaPorPeriodo);

  return {
    bondId: id,
    cuotas,
    tcea,
    trea,
    duracion,
    duracionModificada,
    convexidad,
    precioMaximo
  };
};

// Función para calcular la cuota constante (método francés)
const calcularCuotaConstante = (
  valorNominal: number,
  tasaEfectivaPorPeriodo: number,
  numeroCuotas: number,
  periodoGracia: 'ninguno' | 'total' | 'parcial',
  duracionPeriodoGracia: number
): number => {
  // Si hay periodo de gracia total, se capitaliza el interés
  if (periodoGracia === 'total' && duracionPeriodoGracia > 0) {
    const montoCapitalizado = valorNominal * Math.pow(1 + tasaEfectivaPorPeriodo, duracionPeriodoGracia);
    const cuotasPendientes = numeroCuotas - duracionPeriodoGracia;
    return (montoCapitalizado * tasaEfectivaPorPeriodo) / (1 - Math.pow(1 + tasaEfectivaPorPeriodo, -cuotasPendientes));
  }
  
  // Si no hay periodo de gracia o es parcial
  return (valorNominal * tasaEfectivaPorPeriodo) / (1 - Math.pow(1 + tasaEfectivaPorPeriodo, -numeroCuotas));
};

// Función para generar el flujo de caja completo (con período 0)
const generarFlujoCaja = (
  valorNominal: number,
  tasaEfectivaPorPeriodo: number,
  numeroCuotas: number,
  cuotaConstante: number,
  fechaInicio: Date,
  mesesPorPeriodo: number,
  periodoGracia: 'ninguno' | 'total' | 'parcial',
  duracionPeriodoGracia: number,
  comisiones: number,
  gastos: number
): CuotaFlujo[] => {
  const cuotas: CuotaFlujo[] = [];
  let saldo = valorNominal;
  let fecha = new Date(fechaInicio);

  // PERÍODO 0: Recepción del capital (menos comisiones y gastos)
  const montoNeto = valorNominal - comisiones - gastos;
  cuotas.push({
    numeroCuota: 0,
    fecha: fechaInicio.toISOString().split('T')[0],
    cuota: montoNeto, // Monto neto recibido
    interes: 0,
    amortizacion: 0,
    saldo: valorNominal // El saldo de la deuda sigue siendo el valor nominal
  });

  // PERÍODOS 1 en adelante: Pagos de cuotas
  for (let i = 1; i <= numeroCuotas; i++) {
    // Calcular la fecha de la cuota
    fecha = new Date(fecha);
    fecha.setMonth(fecha.getMonth() + mesesPorPeriodo);
    
    // Calcular interés del período
    const interes = saldo * tasaEfectivaPorPeriodo;
    
    // Aplicar lógica de período de gracia
    let amortizacion = 0;
    let cuotaPeriodo = cuotaConstante;
    
    if (i <= duracionPeriodoGracia) {
      if (periodoGracia === 'total') {
        // En gracia total, no hay pago (se capitaliza)
        cuotaPeriodo = 0;
        amortizacion = 0;
        saldo += interes;
      } else if (periodoGracia === 'parcial') {
        // En gracia parcial, solo se pagan intereses
        cuotaPeriodo = interes;
        amortizacion = 0;
      }
    } else {
      // Período normal, se calcula la amortización
      amortizacion = cuotaConstante - interes;
      saldo -= amortizacion;
    }
    
    // Evitar saldos negativos por redondeo
    if (saldo < 0.01) saldo = 0;
    
    cuotas.push({
      numeroCuota: i,
      fecha: fecha.toISOString().split('T')[0],
      cuota: -cuotaPeriodo, // Negativo porque es un pago (salida de dinero)
      interes: -interes, // Negativo porque es un gasto
      amortizacion: -amortizacion, // Negativo porque es un pago de capital
      saldo: saldo
    });
  }

  return cuotas;
};

// Función para calcular la Tasa de Costo Efectivo Anual
const calcularTCEA = (
  valorNominal: number,
  cuotas: CuotaFlujo[],
  periodosPorAnio: number
): number => {
  // Implementación de TIR para calcular TCEA
  // Usando método iterativo para aproximar la TIR
  let tir = 0.1; // Valor inicial de prueba
  const precision = 0.0001;
  let iteraciones = 100;
  
  while (iteraciones > 0) {
    const flujoDescontado = cuotas.reduce((sum, cuota, index) => {
      const factor = Math.pow(1 + tir, (index + 1) / periodosPorAnio);
      return sum + Math.abs(cuota.cuota) / factor; // Usar valor absoluto para el cálculo
    }, 0);
    
    const van = -valorNominal + flujoDescontado;
    
    if (Math.abs(van) < precision) {
      break;
    }
    
    // Ajustar la TIR
    if (van > 0) {
      tir += precision;
    } else {
      tir -= precision;
    }
    
    iteraciones--;
  }
  
  // Convertir la TIR por período a TCEA
  return Math.pow(1 + tir, periodosPorAnio) - 1;
};

// Función para calcular la Tasa de Rendimiento Efectivo Anual
const calcularTREA = (
  valorNominal: number,
  comisiones: number,
  gastos: number,
  cuotas: CuotaFlujo[],
  periodosPorAnio: number
): number => {
  const montoNeto = valorNominal - comisiones - gastos;
  
  // Similar al TCEA pero considerando el monto neto recibido
  let tir = 0.1; // Valor inicial de prueba
  const precision = 0.0001;
  let iteraciones = 100;
  
  while (iteraciones > 0) {
    const flujoDescontado = cuotas.reduce((sum, cuota, index) => {
      const factor = Math.pow(1 + tir, (index + 1) / periodosPorAnio);
      return sum + Math.abs(cuota.cuota) / factor; // Usar valor absoluto para el cálculo
    }, 0);
    
    const van = -montoNeto + flujoDescontado;
    
    if (Math.abs(van) < precision) {
      break;
    }
    
    // Ajustar la TIR
    if (van > 0) {
      tir += precision;
    } else {
      tir -= precision;
    }
    
    iteraciones--;
  }
  
  // Convertir la TIR por período a TREA
  return Math.pow(1 + tir, periodosPorAnio) - 1;
};

// Función para calcular la duración y duración modificada
const calcularDuracion = (
  cuotas: CuotaFlujo[],
  tasaEfectivaPorPeriodo: number
): { duracion: number; duracionModificada: number } => {
  const flujoTotal = cuotas.reduce((sum, cuota) => sum + Math.abs(cuota.cuota), 0);
  
  const duracion = cuotas.reduce((sum, cuota, index) => {
    const periodo = index + 1;
    const pesoFlujo = Math.abs(cuota.cuota) / flujoTotal;
    const factorDescuento = Math.pow(1 + tasaEfectivaPorPeriodo, -periodo);
    return sum + (periodo * pesoFlujo * factorDescuento);
  }, 0);
  
  const duracionModificada = duracion / (1 + tasaEfectivaPorPeriodo);
  
  return { duracion, duracionModificada };
};

// Función para calcular la convexidad
const calcularConvexidad = (
  cuotas: CuotaFlujo[],
  tasaEfectivaPorPeriodo: number
): number => {
  const flujoTotal = cuotas.reduce((sum, cuota) => sum + Math.abs(cuota.cuota), 0);
  
  const convexidad = cuotas.reduce((sum, cuota, index) => {
    const periodo = index + 1;
    const pesoFlujo = Math.abs(cuota.cuota) / flujoTotal;
    const factorDescuento = Math.pow(1 + tasaEfectivaPorPeriodo, -periodo);
    return sum + (periodo * (periodo + 1) * pesoFlujo * factorDescuento);
  }, 0) / Math.pow(1 + tasaEfectivaPorPeriodo, 2);
  
  return convexidad;
};

// Función para calcular el precio máximo del bono
const calcularPrecioMaximo = (
  _valorNominal: number,
  cuotas: CuotaFlujo[],
  tasaEfectivaPorPeriodo: number
): number => {
  // Un enfoque simple: calcular el valor presente del flujo con una tasa menor
  const tasaMinima = tasaEfectivaPorPeriodo * 0.5; // 50% de la tasa original
  
  const precioMaximo = cuotas.reduce((sum, cuota, index) => {
    const periodo = index + 1;
    const factorDescuento = Math.pow(1 + tasaMinima, -periodo);
    return sum + (Math.abs(cuota.cuota) * factorDescuento);
  }, 0);
  
  return precioMaximo;
};