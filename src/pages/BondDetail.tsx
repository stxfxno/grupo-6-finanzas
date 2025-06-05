// src/pages/BondDetail.tsx - Versión corregida sin edición para admin
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const BondDetail: React.FC = () => {
  const { bondId } = useParams<{ bondId: string }>();
  const navigate = useNavigate();
  const { state: dataState, loadBonds, setCurrentBond } = useData();
  const { state: authState } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'flujo' | 'indicators' | 'charts'>('summary');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [selectedChart, setSelectedChart] = useState<'amortizacion' | 'balance' | 'interes'>('amortizacion');

  const tableRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  const isAdmin = authState.user?.isAdmin || false;

  // Cargar datos del bono
  useEffect(() => {
    if (!bondId) {
      navigate('/dashboard');
      return;
    }

    const loadBondData = async () => {
      // Asegurarse de que los bonos estén cargados
      if (dataState.bonds.length === 0) {
        await loadBonds();
      }

      // Buscar el bono por ID
      const bond = dataState.bonds.find(b => b.id === bondId);
      if (bond) {
        // Verificar permisos: admin puede ver todos, usuario solo los suyos
        if (!isAdmin && bond.userRuc !== authState.user?.ruc) {
          navigate('/dashboard');
          return;
        }
        setCurrentBond(bond);
      } else {
        navigate('/dashboard');
      }
    };

    loadBondData();
  }, [bondId, loadBonds, navigate, setCurrentBond, dataState.bonds, isAdmin, authState.user?.ruc]);

  // Obtener nombre de la empresa emisora
  const getCompanyName = (userRuc: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.ruc === userRuc);
    return user?.razonSocial || 'Empresa no encontrada';
  };

  // Si no hay bono seleccionado, mostrar cargando
  if (!dataState.currentBond || !dataState.currentFlujoCaja) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Cargando información del bono...</p>
        </div>
      </div>
    );
  }

  // Formateo de valores
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-PE').format(new Date(dateString));
  };

  // Datos del bono
  const { currentBond, currentFlujoCaja } = dataState;

  // Preparar datos para gráficas
  const prepareAmortizationChartData = () => {
    return currentFlujoCaja.cuotas.map(cuota => ({
      numeroCuota: `Cuota ${cuota.numeroCuota}`,
      amortizacion: cuota.amortizacion,
      interes: cuota.interes,
      total: cuota.cuota
    }));
  };

  const prepareBalanceChartData = () => {
    return currentFlujoCaja.cuotas.map(cuota => ({
      numeroCuota: `Cuota ${cuota.numeroCuota}`,
      saldo: cuota.saldo
    }));
  };

  const prepareInterestChartData = () => {
    return currentFlujoCaja.cuotas.map(cuota => ({
      numeroCuota: `Cuota ${cuota.numeroCuota}`,
      interes: cuota.interes
    }));
  };

  // Preparar datos para el gráfico de composición de pagos
  const preparePaymentCompositionData = () => {
    const totalAmortizacion = currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.amortizacion, 0);
    const totalInteres = currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.interes, 0);

    return [
      { name: 'Capital', value: totalAmortizacion },
      { name: 'Intereses', value: totalInteres }
    ];
  };

  // Función para exportar a Excel
  const exportToExcel = () => {
    setExportLoading(true);

    try {
      // Preparar datos para Excel
      const data = currentFlujoCaja.cuotas.map(cuota => ({
        'Número de Cuota': cuota.numeroCuota.toString(),
        'Fecha': formatDate(cuota.fecha),
        'Cuota': cuota.cuota,
        'Interés': cuota.interes,
        'Amortización': cuota.amortizacion,
        'Saldo': cuota.saldo
      }));

      // Añadir totales
      const totales = {
        'Número de Cuota': 'TOTALES',
        'Fecha': '',
        'Cuota': currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.cuota, 0),
        'Interés': currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.interes, 0),
        'Amortización': currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.amortizacion, 0),
        'Saldo': 0
      };

      data.push(totales);

      // Añadir información del bono
      const bondInfo = [
        { 'Detalle del Bono': 'Empresa Emisora', 'Valor': getCompanyName(currentBond.userRuc) },
        { 'Detalle del Bono': 'Valor Nominal', 'Valor': currentBond.valorNominal },
        { 'Detalle del Bono': 'Tasa Interés', 'Valor': `${currentBond.tasaInteres}% (${currentBond.tipoTasa})` },
        { 'Detalle del Bono': 'Frecuencia de Pago', 'Valor': currentBond.frecuenciaPago },
        { 'Detalle del Bono': 'Fecha Emisión', 'Valor': formatDate(currentBond.fechaEmision) },
        { 'Detalle del Bono': 'Fecha Vencimiento', 'Valor': formatDate(currentBond.fechaVencimiento) },
        { 'Detalle del Bono': 'TCEA', 'Valor': formatPercent(currentFlujoCaja.tcea) },
        { 'Detalle del Bono': 'Duración', 'Valor': currentFlujoCaja.duracion.toFixed(2) }
      ];

      // Crear libro de trabajo y hojas
      const wb = XLSX.utils.book_new();
      const flujoWs = XLSX.utils.json_to_sheet(data);
      const infoWs = XLSX.utils.json_to_sheet(bondInfo);

      // Ajustar anchos de columna
      const flujoColWidths = [
        { wch: 15 }, // Número de Cuota
        { wch: 15 }, // Fecha
        { wch: 15 }, // Cuota
        { wch: 15 }, // Interés
        { wch: 15 }, // Amortización
        { wch: 15 }  // Saldo
      ];

      flujoWs['!cols'] = flujoColWidths;

      // Añadir hojas al libro
      XLSX.utils.book_append_sheet(wb, flujoWs, 'Flujo de Caja');
      XLSX.utils.book_append_sheet(wb, infoWs, 'Información del Bono');

      // Generar archivo y descargar
      const fileName = `Bono_${getCompanyName(currentBond.userRuc)}_${currentBond.id}_Flujo_Caja.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel. Intente nuevamente.');
    } finally {
      setExportLoading(false);
    }
  };

  // Función para exportar a PDF
  const exportToPDF = async () => {
    if (!tableRef.current) return;

    setExportLoading(true);

    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');

      // Título
      pdf.setFontSize(16);
      pdf.text('Cronograma de Pagos - Bono Corporativo', 15, 15);

      // Información del bono
      pdf.setFontSize(12);
      pdf.text(`Empresa: ${getCompanyName(currentBond.userRuc)}`, 15, 25);
      pdf.text(`Valor Nominal: ${formatCurrency(currentBond.valorNominal)}`, 15, 30);
      pdf.text(`Tasa: ${currentBond.tasaInteres}% (${currentBond.tipoTasa === 'efectiva' ? 'TEA' : 'TNA'})`, 15, 35);
      pdf.text(`Frecuencia: ${currentBond.frecuenciaPago}`, 15, 40);
      pdf.text(`Periodo: ${formatDate(currentBond.fechaEmision)} - ${formatDate(currentBond.fechaVencimiento)}`, 15, 45);

      // Capturar tabla como imagen
      const canvas = await html2canvas(tableRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      // Añadir imagen al PDF
      pdf.addImage(imgData, 'PNG', 10, 50, 280, 140);

      // Si hay gráficas seleccionadas, añadirlas en nueva página
      if (chartsRef.current && activeTab === 'charts') {
        pdf.addPage();
        pdf.text('Gráficas de Análisis', 15, 15);

        const chartsCanvas = await html2canvas(chartsRef.current, { scale: 2 });
        const chartsImgData = chartsCanvas.toDataURL('image/png');

        pdf.addImage(chartsImgData, 'PNG', 10, 25, 280, 160);
      }

      // Indicadores en la última página
      pdf.addPage();
      pdf.text('Indicadores Financieros', 15, 15);

      pdf.text(`TCEA: ${formatPercent(currentFlujoCaja.tcea)}`, 15, 25);
      pdf.text(`TREA: ${formatPercent(currentFlujoCaja.trea)}`, 15, 30);
      pdf.text(`Duración: ${currentFlujoCaja.duracion.toFixed(2)}`, 15, 35);
      pdf.text(`Duración Modificada: ${currentFlujoCaja.duracionModificada.toFixed(4)}`, 15, 40);
      pdf.text(`Convexidad: ${currentFlujoCaja.convexidad.toFixed(4)}`, 15, 45);
      pdf.text(`Precio Máximo: ${formatCurrency(currentFlujoCaja.precioMaximo)}`, 15, 50);

      // Información de pie de página
      pdf.setFontSize(10);
      pdf.text(`Generado el ${new Date().toLocaleDateString()} - SMV Perú`, 15, 190);

      // Guardar PDF
      pdf.save(`Bono_${getCompanyName(currentBond.userRuc)}_${currentBond.id}_Reporte.pdf`);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      alert('Error al exportar a PDF. Intente nuevamente.');
    } finally {
      setExportLoading(false);
    }
  };

  // Manejador de exportación
  const handleExport = () => {
    if (exportType === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  // Colores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navegación */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isAdmin ? 'Análisis de Bono - Supervisión SMV' : 'Detalle del Bono'}
              </h1>
              {isAdmin && (
                <p className="text-sm text-gray-600 mt-1">
                  Empresa: {getCompanyName(currentBond.userRuc)}
                </p>
              )}
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Encabezado del bono */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Bono: {formatCurrency(currentBond.valorNominal)}
              </h2>
              <p className="text-gray-600 mt-1">
                Creado el {formatDate(currentBond.createdAt)}
              </p>
              {isAdmin && (
                <p className="text-blue-600 font-medium mt-1">
                  Emisor: {getCompanyName(currentBond.userRuc)}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              {/* Solo mostrar botón de editar para usuarios no admin y propietarios del bono */}
              {!isAdmin && currentBond.userRuc === authState.user?.ruc && (
                <Link
                  to={`/bonds/edit/${currentBond.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Editar Bono
                </Link>
              )}
              <Link
                to={`/documents?bondId=${currentBond.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isAdmin ? 'Revisar Documentos' : 'Gestionar Documentos'}
              </Link>
            </div>
          </div>
        </div>

        {/* Alerta para administradores */}
        {isAdmin && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Modo Supervisión:</strong> Está visualizando este bono como administrador de la SMV.
                  Puede analizar toda la información pero no puede modificar los datos del bono.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs de navegación */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('flujo')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'flujo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Flujo de Caja
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'charts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Gráficas
            </button>
            <button
              onClick={() => setActiveTab('indicators')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'indicators'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Indicadores Financieros
            </button>
          </nav>
        </div>

        {/* Contenido según el tab activo */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* Tab de Resumen */}
          {activeTab === 'summary' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información General del Bono
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    {isAdmin && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Empresa Emisora</dt>
                        <dd className="mt-1 text-sm font-semibold text-blue-600">
                          {getCompanyName(currentBond.userRuc)}
                        </dd>
                      </div>
                    )}
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Valor Nominal</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(currentBond.valorNominal)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Tasa de Interés</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {currentBond.tasaInteres}% ({currentBond.tipoTasa === 'nominal' ? 'Nominal' : 'Efectiva'})
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Fecha de Emisión</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDate(currentBond.fechaEmision)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Fecha de Vencimiento</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDate(currentBond.fechaVencimiento)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Frecuencia de Pago</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {currentBond.frecuenciaPago.charAt(0).toUpperCase() + currentBond.frecuenciaPago.slice(1)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Total de Cuotas</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {currentFlujoCaja.cuotas.length}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Comisiones</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(currentBond.comisiones)}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Gastos Adicionales</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(currentBond.gastos)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Periodo de Gracia</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {currentBond.periodoGracia === 'ninguno'
                          ? 'Ninguno'
                          : currentBond.periodoGracia === 'parcial'
                            ? `Parcial - ${currentBond.duracionPeriodoGracia} cuotas (solo intereses)`
                            : `Total - ${currentBond.duracionPeriodoGracia} cuotas (capitalización)`}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Monto Total a Pagar</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(
                          currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.cuota, 0)
                        )}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Total Intereses</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatCurrency(
                          currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.interes, 0)
                        )}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">TCEA</dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900">
                        {formatPercent(currentFlujoCaja.tcea)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Gráfico resumen */}
              <div className="mt-8 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Composición de Pagos
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePaymentCompositionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePaymentCompositionData().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Tab de Flujo de Caja */}
          {activeTab === 'flujo' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cronograma de Pagos - Método Francés
              </h3>

              <div className="overflow-x-auto" ref={tableRef}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Cuota
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuota
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interés
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amortización
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentFlujoCaja.cuotas.map((cuota) => (
                      <tr key={cuota.numeroCuota} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cuota.numeroCuota}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(cuota.fecha)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(cuota.cuota)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(cuota.interes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(cuota.amortizacion)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(cuota.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <th scope="row" colSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Totales
                      </th>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {formatCurrency(
                          currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.cuota, 0)
                        )}
                      </td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {formatCurrency(
                          currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.interes, 0)
                        )}
                      </td>
                      <td className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {formatCurrency(
                          currentFlujoCaja.cuotas.reduce((sum, cuota) => sum + cuota.amortizacion, 0)
                        )}
                      </td>
                      <td className="px-6 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end">
                <div className="flex items-center mb-3 sm:mb-0 sm:mr-4">
                  <label htmlFor="exportType" className="mr-2 text-sm font-medium text-gray-700">
                    Formato:
                  </label>
                  <select
                    id="exportType"
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as 'excel' | 'pdf')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="pdf">PDF (.pdf)</option>
                  </select>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${exportLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {exportLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Exportar {exportType === 'excel' ? 'Excel' : 'PDF'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab de Gráficas */}
          {activeTab === 'charts' && (
            <div ref={chartsRef}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gráficas de Análisis
              </h3>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedChart('amortizacion')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedChart === 'amortizacion'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  Cuotas y Componentes
                </button>
                <button
                  onClick={() => setSelectedChart('balance')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedChart === 'balance'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  Evolución del Saldo
                </button>
                <button
                  onClick={() => setSelectedChart('interes')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedChart === 'interes'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  Intereses por Periodo
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                {selectedChart === 'amortizacion' && (
                  <>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      Composición de Cuotas (Amortización e Intereses)
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareAmortizationChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="numeroCuota"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={Math.ceil(currentFlujoCaja.cuotas.length / 15)}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Bar dataKey="amortizacion" name="Amortización" stackId="a" fill="#8884d8" />
                          <Bar dataKey="interes" name="Interés" stackId="a" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {selectedChart === 'balance' && (
                  <>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      Evolución del Saldo
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={prepareBalanceChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="numeroCuota"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={Math.ceil(currentFlujoCaja.cuotas.length / 15)}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="saldo"
                            name="Saldo Pendiente"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {selectedChart === 'interes' && (
                  <>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      Intereses por Periodo
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prepareInterestChartData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="numeroCuota"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={Math.ceil(currentFlujoCaja.cuotas.length / 15)}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="interes"
                            name="Interés"
                            stroke="#ff7300"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>

              {/* Exportar gráficas */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => exportToPDF()}
                  disabled={exportLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${exportLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {exportLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Exportar Gráficas (PDF)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab de Indicadores Financieros */}
          {activeTab === 'indicators' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Indicadores Financieros
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">TCEA</h4>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPercent(currentFlujoCaja.tcea)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Tasa de Costo Efectivo Anual
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">TREA</h4>
                  <p className="text-2xl font-bold text-green-900">
                    {formatPercent(currentFlujoCaja.trea)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Tasa de Rendimiento Efectivo Anual
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-indigo-800 mb-2">Precio Máximo</h4>
                  <p className="text-2xl font-bold text-indigo-900">
                    {formatCurrency(currentFlujoCaja.precioMaximo)}
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Precio máximo teórico del bono
                  </p>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Duración</h4>
                  <p className="text-2xl font-bold text-amber-900">
                    {currentFlujoCaja.duracion.toFixed(2)}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Tiempo promedio ponderado (periodos)
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Duración Modificada</h4>
                  <p className="text-2xl font-bold text-purple-900">
                    {currentFlujoCaja.duracionModificada.toFixed(4)}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Sensibilidad del precio ante cambios en la tasa
                  </p>
                </div>

                <div className="bg-rose-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-rose-800 mb-2">Convexidad</h4>
                  <p className="text-2xl font-bold text-rose-900">
                    {currentFlujoCaja.convexidad.toFixed(4)}
                  </p>
                  <p className="text-xs text-rose-700 mt-1">
                    Curvatura de la relación precio-tasa
                  </p>
                </div>
              </div>

              {/* Gráfica de sensibilidad */}
              <div className="mt-8 border border-gray-200 rounded-lg p-6 bg-white">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Análisis de Sensibilidad</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="tasa"
                        domain={[
                          Math.max(0, currentFlujoCaja.tcea * 0.5),
                          currentFlujoCaja.tcea * 1.5
                        ]}
                        tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
                        label={{ value: 'Tasa de Descuento', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis
                        label={{ value: 'Precio del Bono', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        formatter={(value, name) => [`${formatCurrency(value as number)}`, name]}
                        labelFormatter={(label) => `Tasa: ${(label as number * 100).toFixed(2)}%`}
                      />
                      <Legend />
                      <Line
                        data={[
                          { tasa: currentFlujoCaja.tcea * 0.5, precio: currentFlujoCaja.precioMaximo * 1.1 },
                          { tasa: currentFlujoCaja.tcea * 0.75, precio: currentFlujoCaja.precioMaximo * 1.05 },
                          { tasa: currentFlujoCaja.tcea, precio: currentBond.valorNominal },
                          { tasa: currentFlujoCaja.tcea * 1.25, precio: currentBond.valorNominal * 0.95 },
                          { tasa: currentFlujoCaja.tcea * 1.5, precio: currentBond.valorNominal * 0.9 }
                        ]}
                        type="monotone"
                        dataKey="precio"
                        name="Precio del Bono"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Este gráfico muestra cómo el precio teórico del bono varía cuando cambia la tasa de descuento.
                  A menor tasa, mayor precio y viceversa.
                </p>
              </div>

              <div className="mt-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Interpretación de Indicadores</h4>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-800">TCEA y TREA</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      La TCEA representa el costo efectivo anual para el emisor, mientras que la TREA indica el rendimiento
                      efectivo anual para el inversionista considerando comisiones y gastos.
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-800">Duración y Duración Modificada</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      La duración es una medida del tiempo promedio ponderado hasta el vencimiento.
                      La duración modificada indica cuánto cambiará el precio del bono por cada 1% de variación en la tasa de interés.
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-800">Convexidad</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      La convexidad mide la curvatura de la relación entre el precio del bono y las tasas de interés.
                      Una mayor convexidad indica que el bono es más sensible a cambios grandes en las tasas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recomendaciones para administradores */}
              {isAdmin && (
                <div className="mt-8 border border-blue-200 rounded-lg p-6 bg-blue-50">
                  <h4 className="text-md font-semibold text-blue-900 mb-3">
                    <svg className="inline h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Análisis Regulatorio
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-blue-800">Evaluación de Riesgo</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        TCEA de {formatPercent(currentFlujoCaja.tcea)} y duración modificada de {currentFlujoCaja.duracionModificada.toFixed(4)}
                        indican un nivel de riesgo {currentFlujoCaja.tcea > 0.15 ? 'alto' : currentFlujoCaja.tcea > 0.08 ? 'moderado' : 'bajo'} para inversionistas.
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-800">Recomendación</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        Se recomienda revisar la documentación de respaldo y verificar que los términos del bono estén alineados
                        con las regulaciones vigentes del mercado de valores.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BondDetail;