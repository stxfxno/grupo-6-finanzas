export interface DocumentModel {
  versions: boolean;
  id: string;
  bondId: string;
  userRuc: string;
  tipo: 'prospecto' | 'riesgos' | 'financieros' | 'planNegocio';
  nombre: string;
  ruta: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  comentarios?: string;
  fechaSubida: string;
  fechaVerificacion?: string;
}