// src/pages/BondForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Bond } from '../models/Bond';

const BondForm: React.FC = () => {
  const { bondId } = useParams<{ bondId: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { state: dataState, createBond, updateBond } = useData();
  const [loading, setLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Omit<Bond, 'id' | 'createdAt' | 'updatedAt'>>({
    userRuc: '',
    valorNominal: 1000,
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tasaInteres: 5,
    tipoTasa: 'efectiva',
    frecuenciaPago: 'trimestral',
    comisiones: 0,
    gastos: 0,
    periodoGracia: 'ninguno',
    duracionPeriodoGracia: 0
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isEdit, setIsEdit] = useState(false);

  // Si hay un ID de bono, cargar sus datos
  useEffect(() => {
    if (bondId && dataState.bonds.length > 0) {
      const bondToEdit = dataState.bonds.find(bond => bond.id === bondId);
      if (bondToEdit) {
        setFormData({
          userRuc: bondToEdit.userRuc,
          valorNominal: bondToEdit.valorNominal,
          fechaEmision: bondToEdit.fechaEmision,
          fechaVencimiento: bondToEdit.fechaVencimiento,
          tasaInteres: bondToEdit.tasaInteres,
          tipoTasa: bondToEdit.tipoTasa,
          frecuenciaPago: bondToEdit.frecuenciaPago,
          comisiones: bondToEdit.comisiones,
          gastos: bondToEdit.gastos,
          periodoGracia: bondToEdit.periodoGracia,
          duracionPeriodoGracia: bondToEdit.duracionPeriodoGracia
        });
        setIsEdit(true);
      } else {
        navigate('/dashboard');
      }
    } else if (authState.user) {
      // Si es un nuevo bono, establecer el RUC del usuario
      setFormData(prev => ({
        ...prev,
        userRuc: authState.user?.ruc || ''
      }));
    }
  }, [bondId, dataState.bonds, authState.user, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Convertir a número si el campo es numérico
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    // Limpiar error específico
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    const {
      valorNominal,
      fechaEmision,
      fechaVencimiento,
      tasaInteres,
      periodoGracia,
      duracionPeriodoGracia
    } = formData;
    
    // Validar valor nominal (mayor a cero)
    if (valorNominal <= 0) {
      errors.valorNominal = 'El valor nominal debe ser mayor a cero';
    }
    
    // Validar fechas
    const emisionDate = new Date(fechaEmision);
    const vencimientoDate = new Date(fechaVencimiento);
    
    if (emisionDate >= vencimientoDate) {
      errors.fechaVencimiento = 'La fecha de vencimiento debe ser posterior a la fecha de emisión';
    }
    
    // Validar tasa de interés (mayor a cero)
    if (tasaInteres <= 0) {
      errors.tasaInteres = 'La tasa de interés debe ser mayor a cero';
    }
    
    // Validar periodo de gracia
    if (periodoGracia !== 'ninguno' && duracionPeriodoGracia <= 0) {
      errors.duracionPeriodoGracia = 'La duración del periodo de gracia debe ser mayor a cero';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEdit && bondId) {
        // Actualizar bono existente
        await updateBond({
          ...formData,
          id: bondId,
          createdAt: dataState.bonds.find(b => b.id === bondId)?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Crear nuevo bono
        await createBond(formData);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al guardar bono:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Editar Bono Corporativo' : 'Crear Nuevo Bono Corporativo'}
      </h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Valor Nominal */}
            <div className="sm:col-span-3">
              <label htmlFor="valorNominal" className="block text-sm font-medium text-gray-700">
                Valor Nominal *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">S/</span>
                </div>
                <input
                  type="number"
                  name="valorNominal"
                  id="valorNominal"
                  required
                  min="1"
                  step="0.01"
                  value={formData.valorNominal}
                  onChange={handleChange}
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md ${
                    formErrors.valorNominal ? 'border-red-300' : ''
                  }`}
                />
              </div>
              {formErrors.valorNominal && (
                <p className="mt-1 text-sm text-red-600">{formErrors.valorNominal}</p>
              )}
            </div>

            {/* Tasa de Interés */}
            <div className="sm:col-span-3">
              <label htmlFor="tasaInteres" className="block text-sm font-medium text-gray-700">
                Tasa de Interés *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="tasaInteres"
                  id="tasaInteres"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.tasaInteres}
                  onChange={handleChange}
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md ${
                    formErrors.tasaInteres ? 'border-red-300' : ''
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              {formErrors.tasaInteres && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tasaInteres}</p>
              )}
            </div>

            {/* Tipo de Tasa */}
            <div className="sm:col-span-3">
              <label htmlFor="tipoTasa" className="block text-sm font-medium text-gray-700">
                Tipo de Tasa *
              </label>
              <select
                id="tipoTasa"
                name="tipoTasa"
                required
                value={formData.tipoTasa}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="efectiva">Efectiva</option>
                <option value="nominal">Nominal</option>
              </select>
            </div>

            {/* Frecuencia de Pago */}
            <div className="sm:col-span-3">
              <label htmlFor="frecuenciaPago" className="block text-sm font-medium text-gray-700">
                Frecuencia de Pago *
              </label>
              <select
                id="frecuenciaPago"
                name="frecuenciaPago"
                required
                value={formData.frecuenciaPago}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="mensual">Mensual</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            {/* Fecha de Emisión */}
            <div className="sm:col-span-3">
              <label htmlFor="fechaEmision" className="block text-sm font-medium text-gray-700">
                Fecha de Emisión *
              </label>
              <input
                type="date"
                name="fechaEmision"
                id="fechaEmision"
                required
                value={formData.fechaEmision}
                onChange={handleChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            {/* Fecha de Vencimiento */}
            <div className="sm:col-span-3">
              <label htmlFor="fechaVencimiento" className="block text-sm font-medium text-gray-700">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                name="fechaVencimiento"
                id="fechaVencimiento"
                required
                value={formData.fechaVencimiento}
                onChange={handleChange}
                className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                  formErrors.fechaVencimiento ? 'border-red-300' : ''
                }`}
              />
              {formErrors.fechaVencimiento && (
                <p className="mt-1 text-sm text-red-600">{formErrors.fechaVencimiento}</p>
              )}
            </div>

            {/* Comisiones */}
            <div className="sm:col-span-3">
              <label htmlFor="comisiones" className="block text-sm font-medium text-gray-700">
                Comisiones
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">S/</span>
                </div>
                <input
                  type="number"
                  name="comisiones"
                  id="comisiones"
                  min="0"
                  step="0.01"
                  value={formData.comisiones}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Gastos */}
            <div className="sm:col-span-3">
              <label htmlFor="gastos" className="block text-sm font-medium text-gray-700">
                Gastos Adicionales
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">S/</span>
                </div>
                <input
                  type="number"
                  name="gastos"
                  id="gastos"
                  min="0"
                  step="0.01"
                  value={formData.gastos}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Periodo de Gracia */}
            <div className="sm:col-span-3">
              <label htmlFor="periodoGracia" className="block text-sm font-medium text-gray-700">
                Periodo de Gracia
              </label>
              <select
                id="periodoGracia"
                name="periodoGracia"
                value={formData.periodoGracia}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="ninguno">Ninguno</option>
                <option value="parcial">Parcial (Solo intereses)</option>
                <option value="total">Total (Capitalización)</option>
              </select>
            </div>

            {/* Duración del Periodo de Gracia */}
            <div className="sm:col-span-3">
              <label htmlFor="duracionPeriodoGracia" className="block text-sm font-medium text-gray-700">
                Duración del Periodo de Gracia
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="duracionPeriodoGracia"
                  id="duracionPeriodoGracia"
                  min="0"
                  step="1"
                  disabled={formData.periodoGracia === 'ninguno'}
                  value={formData.duracionPeriodoGracia}
                  onChange={handleChange}
                  className={`focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    formData.periodoGracia === 'ninguno' ? 'bg-gray-100' : ''
                  } ${formErrors.duracionPeriodoGracia ? 'border-red-300' : ''}`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Número de cuotas según la frecuencia seleccionada
                </p>
                {formErrors.duracionPeriodoGracia && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.duracionPeriodoGracia}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Guardando...' : isEdit ? 'Actualizar Bono' : 'Crear Bono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BondForm;