// src/pages/BondDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

const BondDetail: React.FC = () => {
  const { bondId } = useParams<{ bondId: string }>();
  const navigate = useNavigate();
  const { state, loadBonds, setCurrentBond, calculateFlujoCaja } = useData();
  const [activeTab, setActiveTab] = useState<'summary' | 'flujo' | 'indicators'>('summary');

  // Cargar datos del bono
  useEffect(() => {
    if (!bondId) {
      navigate('/dashboard');
      return;
    }

    const loadBondData = async () => {
      // Asegurarse de que los bonos estén cargados
      if (state.bonds.length === 0) {
        await loadBonds();
      }

      // Buscar el bono por ID
      const bond = state.bonds.find(b => b.id === bondId);
      if (bond) {
        setCurrentBond(bond);
      } else {
        navigate('/dashboard');
      }
    };

    loadBondData();
  }, [bondId, loadBonds, navigate, setCurrentBond, state.bonds]);

  // Si no hay bono seleccionado, mostrar cargando
  if (!state.currentBond || !state.currentFlujoCaja) {
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
  const { currentBond, currentFlujoCaja } = state;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de navegación */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Detalle del Bono</h1>
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
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link
                to={`/bonds/edit/${currentBond.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Editar Bono
              </Link>
              <Link
                to={`/documents?bondId=${currentBond.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Gestionar Documentos
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('flujo')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'flujo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Flujo de Caja
            </button>
            <button
              onClick={() => setActiveTab('indicators')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'indicators'
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

              {/* Gráfico resumen (marcador de posición) */}
              <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-600">
                    Aquí se mostraría un gráfico resumen del bono
                  </p>
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
              
              <div className="overflow-x-auto">
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

              <div className="mt-4 flex justify-end">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    // En una app real, aquí habría código para exportar a Excel o PDF
                    alert('Función de exportación (simulada)');
                  }}
                >
                  Exportar Cronograma
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BondDetail;