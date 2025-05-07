// src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    ruc: '',
    razonSocial: '',
    direccion: '',
    sectorEmpresarial: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const { state, register, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, navigate]);

  // Limpiar error al desmontar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error específico cuando el usuario comienza a corregir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    // Validar RUC (11 dígitos en Perú)
    if (!/^\d{11}$/.test(formData.ruc)) {
      errors.ruc = 'El RUC debe tener 11 dígitos numéricos';
    }
    
    // Validar campos requeridos
    if (!formData.razonSocial.trim()) {
      errors.razonSocial = 'La razón social es requerida';
    }
    
    if (!formData.direccion.trim()) {
      errors.direccion = 'La dirección es requerida';
    }
    
    if (!formData.sectorEmpresarial) {
      errors.sectorEmpresarial = 'Debe seleccionar un sector empresarial';
    }
    
    // Validar contraseña (mínimo 6 caracteres)
    if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
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
      const { confirmPassword, ...userData } = formData;
      await register(userData);
    } catch (error) {
      console.error('Error al registrar:', error);
    } finally {
      setLoading(false);
    }
  };

  const sectores = [
    'Minería',
    'Energía',
    'Construcción',
    'Manufactura',
    'Comercio',
    'Servicios financieros',
    'Transporte',
    'Telecomunicaciones',
    'Agricultura',
    'Pesca',
    'Educación',
    'Salud',
    'Turismo',
    'Otros'
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Formulario de registro (izquierda) */}
      <div className="flex flex-col justify-center md:w-1/2 p-6 sm:p-12 bg-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Crear una cuenta
            </h2>
            <p className="text-blue-600 text-md">
              Complete sus datos para registrarse
            </p>
          </div>

          {state.error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{state.error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="ruc" className="block text-sm font-medium text-gray-700">
                RUC *
              </label>
              <div className="mt-1">
                <input
                  id="ruc"
                  name="ruc"
                  type="text"
                  autoComplete="ruc"
                  required
                  value={formData.ruc}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    formErrors.ruc ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white`}
                  placeholder="Ej. 20123456789"
                />
                {formErrors.ruc && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.ruc}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700">
                Razón Social *
              </label>
              <div className="mt-1">
                <input
                  id="razonSocial"
                  name="razonSocial"
                  type="text"
                  required
                  value={formData.razonSocial}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    formErrors.razonSocial ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white`}
                  placeholder="Nombre de su empresa"
                />
                {formErrors.razonSocial && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.razonSocial}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                Dirección *
              </label>
              <div className="mt-1">
                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  required
                  value={formData.direccion}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    formErrors.direccion ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white`}
                  placeholder="Dirección fiscal"
                />
                {formErrors.direccion && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.direccion}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="sectorEmpresarial" className="block text-sm font-medium text-gray-700">
                Sector Empresarial *
              </label>
              <div className="mt-1">
                <select
                  id="sectorEmpresarial"
                  name="sectorEmpresarial"
                  required
                  value={formData.sectorEmpresarial}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    formErrors.sectorEmpresarial ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white`}
                >
                  <option value="">Seleccione un sector</option>
                  {sectores.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
                {formErrors.sectorEmpresarial && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.sectorEmpresarial}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña *
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white pr-10`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña *
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-3 border ${
                    formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white pr-10`}
                  placeholder="Confirme su contraseña"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </div>
                ) : (
                  'Registrarse'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  ¿Ya tiene una cuenta?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Superintendencia del Mercado de Valores • Perú
            </p>
          </div>
        </div>
      </div>

      {/* Panel lateral azul (derecha) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-blue-600 to-blue-800 justify-center items-center p-12">
        <div className="max-w-md">
          <h1 className="text-white text-4xl font-bold leading-tight mb-6">
            Únase a nuestra plataforma de Bonos Corporativos
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Acceda a herramientas especializadas para el análisis, emisión y gestión de bonos corporativos en el mercado peruano.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white">Simulación de emisiones con diversos parámetros</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white">Cálculo de flujos de caja e indicadores financieros</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white">Gestión documental integrada para emisores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;