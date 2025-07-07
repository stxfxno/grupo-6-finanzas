// src/pages/DocumentManager.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DocumentModel } from '../models/DocumentModel';
import { Bond } from '../models/Bond';
import { generateBondPDF, generateBondInfoPDF } from '../utils/pdfGenerator';

const DocumentManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: dataState, loadBonds, loadDocuments, uploadDocument, updateDocumentStatus } = useData();
  const { state: authState } = useAuth();

  // Estados locales
  const [selectedBondId, setSelectedBondId] = useState<string>('');
  const [uploadFormVisible, setUploadFormVisible] = useState(false);
  const [documentType, setDocumentType] = useState<'prospecto' | 'riesgos' | 'financieros' | 'planNegocio'>('prospecto');
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extraer bondId de la query string si existe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bondIdParam = params.get('bondId');

    if (bondIdParam) {
      setSelectedBondId(bondIdParam);
    }
  }, [location]);

  // Cargar bonos y documentos
  useEffect(() => {
    loadBonds();
    loadDocuments();
  }, [loadBonds, loadDocuments]);

  // Obtener documentos filtrados según el bono seleccionado
  const getFilteredDocuments = () => {
    if (!selectedBondId) {
      return dataState.documents;
    }
    return dataState.documents.filter(doc => doc.bondId === selectedBondId);
  };

  // Obtener nombre de la empresa por RUC
  const getCompanyName = (userRuc: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: { ruc: string; razonSocial: string }) => u.ruc === userRuc);
    return user?.razonSocial || 'Empresa no encontrada';
  };

  // Función para descargar documento subido
  const handleDownloadDocument = (doc: DocumentModel) => {
    // Simular descarga del documento subido
    // En una aplicación real, esto descargaría el archivo real
    const fileName = `${doc.nombre}`;
    const blob = new Blob([`Contenido del documento: ${doc.nombre}\nTipo: ${doc.tipo}\nFecha: ${doc.fechaSubida}`], 
                         { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Función para descargar información del bono como PDF (para administradores)
  const handleDownloadBondInfo = (bondId: string) => {
    const bond = dataState.bonds.find(b => b.id === bondId);
    if (bond) {
      const companyName = getCompanyName(bond.userRuc);
      if (authState.user?.isAdmin) {
        generateBondInfoPDF(bond, companyName);
      } else {
        generateBondPDF(bond, companyName);
      }
    }
  };

  // Manejar cambio de bono
  const handleBondChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBondId(e.target.value);
    // Actualizar la URL sin recargar la página
    const params = new URLSearchParams(location.search);

    if (e.target.value) {
      params.set('bondId', e.target.value);
    } else {
      params.delete('bondId');
    }

    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // Usar el nombre del archivo como nombre por defecto
      setDocumentName(e.target.files[0].name);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBondId) {
      setErrorMessage('Debe seleccionar un bono');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Debe seleccionar un archivo');
      return;
    }

    setUploadLoading(true);
    setErrorMessage('');

    try {
      // En una app real, aquí se subiría el archivo a un servidor
      // En esta simulación, solo guardamos la referencia
      await uploadDocument({
        bondId: selectedBondId,
        userRuc: authState.user?.ruc || '',
        tipo: documentType,
        nombre: documentName,
        ruta: `${selectedBondId}/${documentType}/${selectedFile.name}`,
        versions: true
      });

      // Limpiar formulario
      setDocumentName('');
      setSelectedFile(null);
      setUploadFormVisible(false);

      // Recargar documentos
      loadDocuments();
    } catch (error) {
      setErrorMessage('Error al subir el documento');
      console.error('Error al subir documento:', error);
    } finally {
      setUploadLoading(false);
    }
  };

  // Manejar actualización de estado (solo admin)
  const handleUpdateStatus = async (documentId: string, newStatus: 'aprobado' | 'rechazado') => {
    const comentario = newStatus === 'rechazado'
      ? prompt('Por favor, indique el motivo del rechazo:')
      : undefined;

    await updateDocumentStatus(documentId, newStatus, comentario || undefined);

    // Recargar documentos
    loadDocuments();
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-PE').format(new Date(dateString));
  };

  // Obtener nombre completo del tipo de documento
  const getDocumentTypeName = (tipo: string) => {
    switch (tipo) {
      case 'prospecto':
        return 'Prospecto de emisión';
      case 'riesgos':
        return 'Riesgos asociados';
      case 'financieros':
        return 'Estados financieros';
      case 'planNegocio':
        return 'Plan de negocio';
      default:
        return tipo;
    }
  };

  // Obtener clase de color según estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Gestión de Documentos</h1>
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
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
        {/* Selector de bono y botón de subir */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="mb-4 md:mb-0 w-full md:w-1/3">
              <label htmlFor="bondSelector" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Bono
              </label>
              <select
                id="bondSelector"
                value={selectedBondId}
                onChange={handleBondChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
              >
                <option value="">Todos los bonos</option>
                {dataState.bonds.map((bond: Bond) => (
                  <option key={bond.id} value={bond.id}>
                    {new Intl.NumberFormat('es-PE', {
                      style: 'currency',
                      currency: 'PEN'
                    }).format(bond.valorNominal)} - {formatDate(bond.fechaEmision)}
                  </option>
                ))}
              </select>
            </div>

            {!authState.user?.isAdmin && (
              <button
                onClick={() => setUploadFormVisible(!uploadFormVisible)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {uploadFormVisible ? 'Cancelar' : 'Subir Nuevo Documento'}
              </button>
            )}
          </div>
        </div>

        {/* Formulario de carga de documento - Solo para usuarios no admin */}
        {uploadFormVisible && !authState.user?.isAdmin && (
          <div className="bg-white shadow rounded-lg p-6 mb-6" style={{ backgroundColor: 'white' }}>
            <h2 className="text-lg font-medium text-gray-900 mb-4 bg-white">Subir Nuevo Documento</h2>

            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white">
              <div className="bg-white">
                <label htmlFor="bondId" className="block text-sm font-medium text-gray-700">
                  Bono Asociado *
                </label>
                <select
                  id="bondId"
                  value={selectedBondId}
                  onChange={(e) => setSelectedBondId(e.target.value)}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                  style={{ backgroundColor: 'white' }}
                >
                  <option value="">Seleccione un bono</option>
                  {dataState.bonds.map((bond: Bond) => (
                    <option key={bond.id} value={bond.id}>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: 'PEN'
                      }).format(bond.valorNominal)} - {formatDate(bond.fechaEmision)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white">
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                  Tipo de Documento *
                </label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as 'prospecto' | 'riesgos' | 'financieros' | 'planNegocio')}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                  style={{ backgroundColor: 'white' }}
                >
                  <option value="prospecto">Prospecto de emisión</option>
                  <option value="riesgos">Riesgos asociados</option>
                  <option value="financieros">Estados financieros</option>
                  <option value="planNegocio">Plan de negocio</option>
                </select>
              </div>

              <div className="bg-white">
                <label htmlFor="documentName" className="block text-sm font-medium text-gray-700">
                  Nombre del Documento *
                </label>
                <input
                  type="text"
                  id="documentName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-white"
                  style={{ backgroundColor: 'white' }}
                  placeholder="Ingrese el nombre del documento"
                />
              </div>

              <div className="bg-white">
                <label htmlFor="documentFile" className="block text-sm font-medium text-gray-700">
                  Archivo *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="documentFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Subir un archivo</span>
                        <input
                          id="documentFile"
                          name="documentFile"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          required
                          accept=".pdf,.docx,.xlsx,.doc,.xls"
                        />
                      </label>
                      <p className="pl-1">o arrastre y suelte</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOCX, XLSX hasta 10MB
                    </p>
                    {selectedFile && (
                      <p className="text-sm text-blue-600 mt-2 bg-white px-2 py-1 rounded">
                        Archivo seleccionado: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end bg-white pt-4">
                <button
                  type="button"
                  onClick={() => setUploadFormVisible(false)}
                  className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${uploadLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {uploadLoading ? 'Subiendo...' : 'Subir Documento'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de documentos */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-white">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedBondId
                ? `Documentos del Bono Seleccionado`
                : authState.user?.isAdmin
                  ? 'Todos los Documentos del Sistema'
                  : 'Mis Documentos'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {authState.user?.isAdmin
                ? 'Documentos enviados por las empresas emisoras para revisión.'
                : 'Documentos requeridos por la SMV para la emisión de bonos corporativos.'}
            </p>
          </div>

          <div className="border-t border-gray-200 bg-white">
            <ul className="divide-y divide-gray-200 bg-white">
              {getFilteredDocuments().length === 0 ? (
                <li className="px-4 py-8 sm:px-6 text-center text-gray-500 bg-white">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No hay documentos</h3>
                    <p className="text-sm text-gray-500">
                      {authState.user?.isAdmin
                        ? 'No hay documentos pendientes de revisión.'
                        : selectedBondId
                          ? 'No hay documentos para este bono.'
                          : 'Aún no has subido ningún documento.'}
                    </p>
                    {!authState.user?.isAdmin && !uploadFormVisible && (
                      <button
                        onClick={() => setUploadFormVisible(true)}
                        className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Subir primer documento
                      </button>
                    )}
                  </div>
                </li>
              ) : (
                getFilteredDocuments().map((doc: DocumentModel) => (
                  <li key={doc.id} className="px-4 py-5 sm:px-6 hover:bg-gray-50 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getDocumentTypeName(doc.tipo)} - Subido el {formatDate(doc.fechaSubida)}
                          </div>
                          {authState.user?.isAdmin && (
                            <div className="text-xs text-blue-600 mt-1">
                              Empresa: {(() => {
                                const users = JSON.parse(localStorage.getItem('users') || '[]');
                                const user = users.find((u: { ruc: string; razonSocial: string }) => u.ruc === doc.userRuc);
                                return user?.razonSocial || doc.userRuc;
                              })()}
                            </div>
                          )}
                          {doc.estado === 'rechazado' && doc.comentarios && (
                            <div className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded">
                              <strong>Motivo del rechazo:</strong> {doc.comentarios}
                            </div>
                          )}
                          {doc.estado === 'aprobado' && doc.fechaVerificacion && (
                            <div className="text-xs text-green-600 mt-1">
                              Aprobado el {formatDate(doc.fechaVerificacion)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.estado)}`}>
                          {doc.estado === 'pendiente' ? 'Pendiente' : doc.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                        </span>

                        {/* Acciones según el rol */}
                        {authState.user?.isAdmin ? (
                          <div className="flex space-x-2">
                            {doc.estado === 'pendiente' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(doc.id, 'aprobado')}
                                  className="text-green-600 hover:text-green-900 text-sm font-medium px-2 py-1 rounded hover:bg-green-50"
                                >
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(doc.id, 'rechazado')}
                                  className="text-red-600 hover:text-red-900 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDownloadBondInfo(doc.bondId)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Descargar Info
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Descargar
                            </button>
                            {doc.estado === 'rechazado' && (
                              <button
                                onClick={() => {
                                  alert('Función para resubir documento (simulada)');
                                }}
                                className="text-amber-600 hover:text-amber-900 text-sm font-medium px-2 py-1 rounded hover:bg-amber-50"
                              >
                                Resubir
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Información adicional para usuarios */}
        {!authState.user?.isAdmin && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Documentos Requeridos</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-2">Para completar el proceso de emisión de bonos, debe subir los siguientes documentos:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Prospecto de emisión:</strong> Información detallada sobre el bono y la empresa</li>
                    <li><strong>Estados financieros:</strong> Información financiera auditada de los últimos 3 años</li>
                    <li><strong>Análisis de riesgos:</strong> Identificación y evaluación de riesgos asociados</li>
                    <li><strong>Plan de negocio:</strong> Estrategia y proyecciones de la empresa</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información para administradores */}
        {authState.user?.isAdmin && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Panel de Supervisión</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>Como administrador de la SMV, puede revisar y aprobar los documentos enviados por las empresas emisoras.
                    Asegúrese de verificar que toda la documentación cumple con los requisitos regulatorios antes de aprobarla.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentManager;