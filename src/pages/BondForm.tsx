// src/pages/BondForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Bond } from '../models/Bond';

const BondForm: React.FC = () => {
  const { bondId } = useParams<{ bondId: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { state: dataState, createBond, updateBond } = useData();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

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

  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (step === 1) {
      // Validar campos del paso 1
      if (formData.valorNominal <= 0) {
        errors.valorNominal = 'El valor nominal debe ser mayor a cero';
      }
      
      // Validar fechas
      const emisionDate = new Date(formData.fechaEmision);
      const vencimientoDate = new Date(formData.fechaVencimiento);
      
      if (emisionDate >= vencimientoDate) {
        errors.fechaVencimiento = 'La fecha de vencimiento debe ser posterior a la fecha de emisión';
      }
    } else if (step === 2) {
      // Validar campos del paso 2
      if (formData.tasaInteres <= 0) {
        errors.tasaInteres = 'La tasa de interés debe ser mayor a cero';
      }
      
      // Validar periodo de gracia
      if (formData.periodoGracia !== 'ninguno' && formData.duracionPeriodoGracia <= 0) {
        errors.duracionPeriodoGracia = 'La duración del periodo de gracia debe ser mayor a cero';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = (): boolean => {
    return validateStep(1) && validateStep(2);
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

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const toggleHelpText = (field: string) => {
    if (showHelp === field) {
      setShowHelp(null);
    } else {
      setShowHelp(field);
    }
  };

  // Formateo para previsualización
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  const calcularDuracionEstimada = () => {
    const emisionDate = new Date(formData.fechaEmision);
    const vencimientoDate = new Date(formData.fechaVencimiento);
    const diffTime = Math.abs(vencimientoDate.getTime() - emisionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      dias: diffDays,
      meses: Math.round(diffDays / 30),
      anios: Math.round(diffDays / 365 * 10) / 10
    };
  };

  const calcularNumeroCuotas = () => {
    const duracion = calcularDuracionEstimada();
    
    let periodosPorAnio: number;
    switch (formData.frecuenciaPago) {
      case 'mensual': periodosPorAnio = 12; break;
      case 'bimestral': periodosPorAnio = 6; break;
      case 'trimestral': periodosPorAnio = 4; break;
      case 'semestral': periodosPorAnio = 2; break;
      case 'anual': periodosPorAnio = 1; break;
      default: periodosPorAnio = 12;
    }
    
    return Math.ceil(duracion.meses / (12 / periodosPorAnio));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar Bono Corporativo' : 'Crear Nuevo Bono Corporativo'}
          </h1>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="w-full">
              <nav className="flex items-center">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  } mr-2`}>
                    1
                  </span>
                  <span className="font-medium">Información básica</span>
                </button>
                <div className={`h-0.5 w-12 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <button 
                  onClick={() => validateStep(1) && setCurrentStep(2)}
                  className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  } mr-2`}>
                    2
                  </span>
                  <span className="font-medium">Condiciones financieras</span>
                </button>
                <div className={`h-0.5 w-12 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <button 
                  onClick={() => validateStep(1) && validateStep(2) && setCurrentStep(3)}
                  className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  } mr-2`}>
                    3
                  </span>
                  <span className="font-medium">Revisión y confirmación</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Paso 1: Información Básica */}
            {currentStep === 1 && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  Información Básica del Bono
                </h2>
                
                <div className="space-y-6">
                  {/* Valor Nominal */}
                  <div>
                    <div className="flex items-center mb-1">
                      <label htmlFor="valorNominal" className="block text-sm font-medium text-gray-700">
                        Valor Nominal *
                      </label>
                      <button 
                        type="button"
                        onClick={() => toggleHelpText('valorNominal')}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                    {showHelp === 'valorNominal' && (
                      <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                        El valor nominal es el monto de la deuda que se reembolsará al vencimiento del bono. También se conoce como valor facial o valor par.
                      </div>
                    )}
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
                          formErrors.valorNominal ? 'border-red-300 ring-1 ring-red-300' : ''
                        } bg-white`}
                      />
                    </div>
                    {formErrors.valorNominal && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.valorNominal}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha de Emisión */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="fechaEmision" className="block text-sm font-medium text-gray-700">
                          Fecha de Emisión *
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('fechaEmision')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'fechaEmision' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          La fecha en que se emite el bono y comienza a generar intereses.
                        </div>
                      )}
                      <input
                        type="date"
                        name="fechaEmision"
                        id="fechaEmision"
                        required
                        value={formData.fechaEmision}
                        onChange={handleChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-400 rounded-md bg-white"
                      />
                    </div>

                    {/* Fecha de Vencimiento */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="fechaVencimiento" className="block text-sm font-medium text-gray-700">
                          Fecha de Vencimiento *
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('fechaVencimiento')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'fechaVencimiento' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          La fecha en que finaliza el bono y se devuelve el valor nominal al inversionista.
                        </div>
                      )}
                      <input
                        type="date"
                        name="fechaVencimiento"
                        id="fechaVencimiento"
                        required
                        value={formData.fechaVencimiento}
                        onChange={handleChange}
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-400 rounded-md ${
                          formErrors.fechaVencimiento ? 'border-red-300 ring-1 ring-red-300' : ''
                        } bg-white`}
                      />
                      {formErrors.fechaVencimiento && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.fechaVencimiento}</p>
                      )}
                    </div>
                  </div>

                  {/* Duración Estimada */}
                  {formData.fechaEmision && formData.fechaVencimiento && (
                    <div className="bg-blue-50 p-4 rounded-md mt-2">
                      <h3 className="text-sm font-medium text-blue-700 mb-2">Duración Estimada:</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xl font-bold text-blue-800">{calcularDuracionEstimada().dias}</p>
                          <p className="text-xs text-blue-600">días</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-blue-800">{calcularDuracionEstimada().meses}</p>
                          <p className="text-xs text-blue-600">meses</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-blue-800">{calcularDuracionEstimada().anios}</p>
                          <p className="text-xs text-blue-600">años</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Paso 2: Condiciones Financieras */}
            {currentStep === 2 && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  Condiciones Financieras del Bono
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tasa de Interés */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="tasaInteres" className="block text-sm font-medium text-gray-700">
                          Tasa de Interés *
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('tasaInteres')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'tasaInteres' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          Porcentaje de interés anual que pagará el bono. Puede ser nominal o efectiva según el tipo de tasa seleccionado.
                        </div>
                      )}
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
                          className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-400 rounded-md ${
                            formErrors.tasaInteres ? 'border-red-300 ring-1 ring-red-300' : ''
                          } bg-white`}
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
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="tipoTasa" className="block text-sm font-medium text-gray-700">
                          Tipo de Tasa *
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('tipoTasa')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'tipoTasa' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          Nominal: No considera el efecto de capitalización de intereses.<br/>
                          Efectiva: Considera la capitalización de intereses según la frecuencia de pago.
                        </div>
                      )}
                      <select
                        id="tipoTasa"
                        name="tipoTasa"
                        required
                        value={formData.tipoTasa}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      >
                        <option value="efectiva">Efectiva</option>
                        <option value="nominal">Nominal</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Frecuencia de Pago */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="frecuenciaPago" className="block text-sm font-medium text-gray-700">
                          Frecuencia de Pago *
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('frecuenciaPago')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'frecuenciaPago' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          Con qué frecuencia se pagarán los intereses y la amortización del capital durante la vida del bono.
                        </div>
                      )}
                      <select
                        id="frecuenciaPago"
                        name="frecuenciaPago"
                        required
                        value={formData.frecuenciaPago}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      >
                        <option value="mensual">Mensual</option>
                        <option value="bimestral">Bimestral</option>
                        <option value="trimestral">Trimestral</option>
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>

                    {/* Número de Cuotas Estimadas */}
                    <div className="bg-green-50 p-3 rounded-md flex items-center">
                      <div>
                        <h3 className="text-sm font-medium text-green-700">Cuotas Totales:</h3>
                        <p className="text-xl font-bold text-green-800">{calcularNumeroCuotas()}</p>
                      </div>
                      <p className="ml-3 text-sm text-green-600">
                        Cuotas {formData.frecuenciaPago}es según la duración y frecuencia seleccionadas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Comisiones */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="comisiones" className="block text-sm font-medium text-gray-700">
                          Comisiones
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('comisiones')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'comisiones' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          Comisiones cobradas por intermediarios financieros en el proceso de emisión del bono (estructuración, colocación, etc.).
                        </div>
                      )}
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
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-400 rounded-md bg-white"
                        />
                      </div>
                    </div>

                    {/* Gastos */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="gastos" className="block text-sm font-medium text-gray-700">
                          Gastos Adicionales
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('gastos')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'gastos' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          Gastos legales, administrativos, registro, clasificación de riesgo y otros gastos relacionados con la emisión.
                        </div>
                      )}
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
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-400 rounded-md bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Periodo de Gracia */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="periodoGracia" className="block text-sm font-medium text-gray-700">
                          Periodo de Gracia
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('periodoGracia')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'periodoGracia' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          <p><strong>Ninguno:</strong> Se paga capital e intereses desde la primera cuota.</p>
                          <p><strong>Parcial:</strong> Solo se pagan intereses durante el periodo indicado.</p>
                          <p><strong>Total:</strong> No se paga ni capital ni intereses durante el periodo indicado (se capitalizan).</p>
                        </div>
                      )}
                      <select
                        id="periodoGracia"
                        name="periodoGracia"
                        value={formData.periodoGracia}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      >
                        <option value="ninguno">Ninguno</option>
                        <option value="parcial">Parcial (Solo intereses)</option>
                        <option value="total">Total (Capitalización)</option>
                      </select>
                    </div>

                    {/* Duración del Periodo de Gracia */}
                    <div>
                      <div className="flex items-center mb-1">
                        <label htmlFor="duracionPeriodoGracia" className="block text-sm font-medium text-gray-700">
                          Duración del Periodo de Gracia
                        </label>
                        <button 
                          type="button"
                          onClick={() => toggleHelpText('duracionPeriodoGracia')}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      {showHelp === 'duracionPeriodoGracia' && (
                        <div className="mb-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-md">
                          Número de cuotas durante las cuales se aplicará el periodo de gracia seleccionado.
                        </div>
                      )}
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
                          className={`focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-400 rounded-md ${
                            formData.periodoGracia === 'ninguno' ? 'bg-gray-100' : 'bg-white'
                          } ${formErrors.duracionPeriodoGracia ? 'border-red-300 ring-1 ring-red-300' : ''}`}
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
                </div>
              </div>
            )}

            {/* Paso 3: Revisión y Confirmación */}
            {currentStep === 3 && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                  <span>Resumen del Bono</span>
                  <button 
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="ml-4 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {previewMode ? "Vista Detallada" : "Vista Previa"}
                  </button>
                </h2>

                {previewMode ? (
                  // Vista de tarjeta de bono
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-w-lg mx-auto">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {formatCurrency(formData.valorNominal)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Emisión: {formatDate(formData.fechaEmision)}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                        {formData.tasaInteres}% {formData.tipoTasa === 'efectiva' ? 'TEA' : 'TNA'}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Vencimiento</p>
                          <p className="font-semibold">{formatDate(formData.fechaVencimiento)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Cuotas</p>
                          <p className="font-semibold">{calcularNumeroCuotas()} {formData.frecuenciaPago}es</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Plazo</p>
                          <p className="font-semibold">{calcularDuracionEstimada().anios} años</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Periodo Gracia</p>
                          <p className="font-semibold">
                            {formData.periodoGracia === 'ninguno' 
                              ? 'Ninguno' 
                              : formData.periodoGracia === 'parcial' 
                                ? `${formData.duracionPeriodoGracia} cuotas (parcial)` 
                                : `${formData.duracionPeriodoGracia} cuotas (total)`}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-500">Comisiones:</span>
                          <span className="font-semibold">{formatCurrency(formData.comisiones)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="font-medium text-gray-500">Gastos:</span>
                          <span className="font-semibold">{formatCurrency(formData.gastos)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Vista detallada
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <dl className="divide-y divide-gray-200">
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Valor Nominal</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">{formatCurrency(formData.valorNominal)}</dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Fecha de Emisión</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">{formatDate(formData.fechaEmision)}</dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Fecha de Vencimiento</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">{formatDate(formData.fechaVencimiento)}</dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Duración</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">
                          {calcularDuracionEstimada().anios} años ({calcularDuracionEstimada().meses} meses)
                        </dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Tasa de Interés</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">
                          {formData.tasaInteres}% ({formData.tipoTasa === 'efectiva' ? 'Efectiva Anual' : 'Nominal Anual'})
                        </dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Frecuencia de Pago</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">
                          {formData.frecuenciaPago.charAt(0).toUpperCase() + formData.frecuenciaPago.slice(1)}
                        </dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Número de Cuotas</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">{calcularNumeroCuotas()}</dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Periodo de Gracia</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">
                          {formData.periodoGracia === 'ninguno' 
                            ? 'Ninguno' 
                            : formData.periodoGracia === 'parcial' 
                              ? `Parcial - ${formData.duracionPeriodoGracia} cuotas (solo intereses)` 
                              : `Total - ${formData.duracionPeriodoGracia} cuotas (capitalización)`}
                        </dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Comisiones</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">{formatCurrency(formData.comisiones)}</dd>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Gastos Adicionales</dt>
                        <dd className="text-sm font-semibold text-gray-900 col-span-2">{formatCurrency(formData.gastos)}</dd>
                      </div>
                    </dl>
                  </div>
                )}
                
                <div className="mt-6 bg-yellow-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Antes de continuar</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Revise cuidadosamente la información del bono. Una vez creado, podrá generar el cronograma de pagos y los indicadores financieros.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Anterior
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading ? 'Guardando...' : isEdit ? 'Actualizar Bono' : 'Crear Bono'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BondForm;