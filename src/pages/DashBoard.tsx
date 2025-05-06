// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Bond } from '../models/Bond';

const Dashboard: React.FC = () => {
  const { state: dataState, loadBonds, deleteBond, setCurrentBond } = useData();
  const { state: authState, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Cargar bonos al montar el componente
  useEffect(() => {
    loadBonds();
  }, [loadBonds]);

  // Función para ver detalle del bono
  const handleViewBond = (bond: Bond) => {
    setCurrentBond(bond);
    navigate(`/bonds/${bond.id}`);
  };

  // Función para editar bono
  const handleEditBond = (bond: Bond) => {
    navigate(`/bonds/edit/${bond.id}`);
  };

  // Función para eliminar bono
  const handleDeleteBond = (bond: Bond) => {
    setSelectedBond(bond);
    setShowDeleteModal(true);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (selectedBond) {
      await deleteBond(selectedBond.id);
      setShowDeleteModal(false);
      setSelectedBond(null);
    }
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedBond(null);
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE').format(date);
  };

  // Calcular tiempo restante en meses
  const calculateRemainingTime = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    
    // Calcular diferencia en meses
    const monthsDiff = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth());
    
    return monthsDiff > 0 ? `${monthsDiff} meses` : 'Vencido';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Bonos Corporativos</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              {authState.user?.razonSocial || authState.user?.ruc}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Mis Bonos Corporativos</h2>
          <Link
            to="/bonds/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Crear Nuevo Bono
          </Link>
        </div>

        {/* Filters and Stats (can be expanded later) */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="text-lg font-medium text-blue-800">Total de Bonos</h3>
              <p className="text-3xl font-bold text-blue-900">{dataState.bonds.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="text-lg font-medium text-green-800">Valor Total</h3>
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(
                  dataState.bonds.reduce((sum, bond) => sum + bond.valorNominal, 0)
                )}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-md">
              <h3 className="text-lg font-medium text-purple-800">Tasa Promedio</h3>
              <p className="text-3xl font-bold text-purple-900">
                {dataState.bonds.length > 0
                  ? (
                      dataState.bonds.reduce((sum, bond) => sum + bond.tasaInteres, 0) /
                      dataState.bonds.length
                    ).toFixed(2) + '%'
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Bonds Table */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Valor Nominal
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tasa de Interés
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Frecuencia
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Vencimiento
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tiempo Restante
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Creado
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dataState.bonds.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No hay bonos registrados. Cree uno nuevo para comenzar.
                        </td>
                      </tr>
                    ) : (
                      dataState.bonds.map((bond) => (
                        <tr key={bond.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(bond.valorNominal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bond.tasaInteres}% ({bond.tipoTasa})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bond.frecuenciaPago.charAt(0).toUpperCase() + bond.frecuenciaPago.slice(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(bond.fechaVencimiento)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {calculateRemainingTime(bond.fechaVencimiento)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(bond.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewBond(bond)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => handleEditBond(bond)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteBond(bond)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de documentos legales - Link a la gestión documental */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Documentos Legales</h2>
            <Link
              to="/documents"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Gestionar Documentos
            </Link>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">
              Para completar el proceso de emisión de bonos, es necesario cargar documentos como el prospecto de emisión, 
              información sobre riesgos asociados, estados financieros auditados y el plan de negocio.
            </p>
            <div className="mt-4">
              <Link
                to="/documents"
                className="text-blue-600 hover:text-blue-900 font-medium"
              >
                Ir a la administración de documentos →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Eliminar Bono
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Está seguro que desea eliminar este bono? Esta acción no se puede deshacer.
                        {selectedBond && (
                          <span className="block mt-2 font-semibold">
                            Valor: {formatCurrency(selectedBond.valorNominal)} - Vencimiento: {formatDate(selectedBond.fechaVencimiento)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;