
  
  
  
 
  
  // src/models/Document.ts
  export interface Document {
    versions: boolean;
    id: string;
    bondId: string;
    userRuc: string;
    tipo: 'prospecto' | 'riesgos' | 'financieros' | 'planNegocio';
    nombre: string;
    ruta: string; // En una app real sería una URL de almacenamiento, pero aquí simularemos con nombres de archivo
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    comentarios?: string;
    fechaSubida: string;
    fechaVerificacion?: string;
}