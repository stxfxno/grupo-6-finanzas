// src/utils/pdfGenerator.ts
import { Bond } from '../models/Bond';

export const generateBondPDF = (bond: Bond, companyName?: string): void => {
  // Crear el contenido HTML del documento
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Información del Bono</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
            }
            .section {
                margin-bottom: 25px;
            }
            .section h2 {
                color: #007bff;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #007bff;
            }
            .info-item label {
                font-weight: bold;
                color: #495057;
                display: block;
                margin-bottom: 5px;
            }
            .info-item value {
                color: #212529;
                font-size: 16px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
            }
            .currency {
                font-weight: bold;
                color: #28a745;
            }
            .date {
                font-weight: bold;
                color: #dc3545;
            }
            .rate {
                font-weight: bold;
                color: #ffc107;
            }
            .action-buttons {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
            }
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.3s;
            }
            .btn-primary {
                background-color: #007bff;
                color: white;
            }
            .btn-primary:hover {
                background-color: #0056b3;
            }
            .btn-success {
                background-color: #28a745;
                color: white;
            }
            .btn-success:hover {
                background-color: #1e7e34;
            }
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                background-color: #545b62;
            }
            @media print {
                body { margin: 0; }
                .header { page-break-inside: avoid; }
                .section { page-break-inside: avoid; }
                .action-buttons { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Información del Bono</h1>
            <p>Documento generado el ${new Date().toLocaleDateString('es-PE')}</p>
        </div>

        <div class="section">
            <h2>Información General</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Valor Nominal:</label>
                    <value class="currency">${formatCurrency(bond.valorNominal)}</value>
                </div>
                <div class="info-item">
                    <label>Empresa:</label>
                    <value>${companyName || 'No especificada'}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Emisión:</label>
                    <value class="date">${formatDate(bond.fechaEmision)}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Vencimiento:</label>
                    <value class="date">${formatDate(bond.fechaVencimiento)}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Términos Financieros</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Tasa de Interés:</label>
                    <value class="rate">${bond.tasaInteres}%</value>
                </div>
                <div class="info-item">
                    <label>Tipo de Tasa:</label>
                    <value>${bond.tipoTasa}</value>
                </div>
                <div class="info-item">
                    <label>Frecuencia de Pago:</label>
                    <value>${bond.frecuenciaPago.charAt(0).toUpperCase() + bond.frecuenciaPago.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>RUC del Usuario:</label>
                    <value>${bond.userRuc}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Características del Bono</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Comisiones:</label>
                    <value class="currency">${formatCurrency(bond.comisiones)}</value>
                </div>
                <div class="info-item">
                    <label>Gastos:</label>
                    <value class="currency">${formatCurrency(bond.gastos)}</value>
                </div>
                <div class="info-item">
                    <label>Período de Gracia:</label>
                    <value>${bond.periodoGracia.charAt(0).toUpperCase() + bond.periodoGracia.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>Duración Período de Gracia:</label>
                    <value>${bond.duracionPeriodoGracia} meses</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Información Adicional</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Fecha de Creación:</label>
                    <value>${formatDate(bond.createdAt)}</value>
                </div>
                <div class="info-item">
                    <label>Última Actualización:</label>
                    <value>${formatDate(bond.updatedAt)}</value>
                </div>
                <div class="info-item">
                    <label>ID del Bono:</label>
                    <value>${bond.id}</value>
                </div>
                <div class="info-item">
                    <label>Estado:</label>
                    <value>Activo</value>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Este documento contiene información confidencial del bono.</p>
            <p>Generado por el Sistema de Gestión de Bonos - ${new Date().toLocaleDateString('es-PE')}</p>
        </div>

        <div class="action-buttons">
            <button class="btn btn-success" onclick="window.print()">Imprimir</button>
            <button class="btn btn-primary" onclick="downloadPDF()">Descargar PDF</button>
            <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
        </div>

        <script>
            function downloadPDF() {
                // Mostrar mensaje de que se está generando el PDF
                const originalContent = document.body.innerHTML;
                document.body.innerHTML = '<div style="text-align: center; margin-top: 50px; color: #007bff;"><h2>Generando documento...</h2><p>Por favor espere un momento.</p></div>';
                
                setTimeout(() => {
                    // Crear el contenido HTML completo
                    const htmlContent = \`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Información del Bono - ${bond.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #007bff; margin: 0; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .info-item label { font-weight: bold; color: #495057; display: block; margin-bottom: 5px; }
        .info-item value { color: #212529; font-size: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        .currency { font-weight: bold; color: #28a745; }
        .date { font-weight: bold; color: #dc3545; }
        .rate { font-weight: bold; color: #ffc107; }
        @media print { body { margin: 0; } .header { page-break-inside: avoid; } .section { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Información del Bono</h1>
        <p>Documento generado el ${new Date().toLocaleDateString('es-PE')}</p>
    </div>
    <div class="section">
        <h2>Información General</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Valor Nominal:</label>
                <value class="currency">${formatCurrency(bond.valorNominal)}</value>
            </div>
            <div class="info-item">
                <label>Empresa:</label>
                <value>${companyName || 'No especificada'}</value>
            </div>
            <div class="info-item">
                <label>Fecha de Emisión:</label>
                <value class="date">${formatDate(bond.fechaEmision)}</value>
            </div>
            <div class="info-item">
                <label>Fecha de Vencimiento:</label>
                <value class="date">${formatDate(bond.fechaVencimiento)}</value>
            </div>
        </div>
    </div>
    <div class="section">
        <h2>Términos Financieros</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Tasa de Interés:</label>
                <value class="rate">${bond.tasaInteres}%</value>
            </div>
            <div class="info-item">
                <label>Tipo de Tasa:</label>
                <value>${bond.tipoTasa}</value>
            </div>
            <div class="info-item">
                <label>Frecuencia de Pago:</label>
                <value>${bond.frecuenciaPago.charAt(0).toUpperCase() + bond.frecuenciaPago.slice(1)}</value>
            </div>
            <div class="info-item">
                <label>RUC del Usuario:</label>
                <value>${bond.userRuc}</value>
            </div>
        </div>
    </div>
    <div class="section">
        <h2>Características del Bono</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Comisiones:</label>
                <value class="currency">${formatCurrency(bond.comisiones)}</value>
            </div>
            <div class="info-item">
                <label>Gastos:</label>
                <value class="currency">${formatCurrency(bond.gastos)}</value>
            </div>
            <div class="info-item">
                <label>Período de Gracia:</label>
                <value>${bond.periodoGracia.charAt(0).toUpperCase() + bond.periodoGracia.slice(1)}</value>
            </div>
            <div class="info-item">
                <label>Duración Período de Gracia:</label>
                <value>${bond.duracionPeriodoGracia} meses</value>
            </div>
        </div>
    </div>
    <div class="section">
        <h2>Información Adicional</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Fecha de Creación:</label>
                <value>${formatDate(bond.createdAt)}</value>
            </div>
            <div class="info-item">
                <label>Última Actualización:</label>
                <value>${formatDate(bond.updatedAt)}</value>
            </div>
            <div class="info-item">
                <label>ID del Bono:</label>
                <value>${bond.id}</value>
            </div>
            <div class="info-item">
                <label>Estado:</label>
                <value>Activo</value>
            </div>
        </div>
    </div>
    <div class="footer">
        <p>Este documento contiene información confidencial del bono.</p>
        <p>Generado por el Sistema de Gestión de Bonos - ${new Date().toLocaleDateString('es-PE')}</p>
    </div>
</body>
</html>\`;
                    
                    // Crear un blob del contenido HTML
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    // Crear un enlace para descargar
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'bono_${bond.id}_${new Date().toISOString().split('T')[0]}.html';
                    link.click();
                    
                    // Limpiar el URL
                    URL.revokeObjectURL(url);
                    
                    // Restaurar el contenido original
                    document.body.innerHTML = originalContent;
                }, 1000);
            }
        </script>
    </body>
    </html>
  `;

  // Crear una nueva ventana para mostrar la vista previa
  const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
  if (previewWindow) {
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
    previewWindow.document.title = `Vista Previa - Bono ${bond.id}`;
  }
};

// Función para descargar un archivo que ya existe
export const downloadUploadedDocument = (documentUrl: string, documentName: string): void => {
  const link = document.createElement('a');
  link.href = documentUrl;
  link.download = documentName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Función para descargar directamente el HTML como archivo
export const downloadBondHTML = (bond: Bond, companyName?: string, isAdmin: boolean = false): void => {
  const htmlContent = isAdmin ? generateAdminHTMLContent(bond, companyName) : generateUserHTMLContent(bond, companyName);
  
  // Crear un blob del contenido HTML
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Crear un enlace para descargar
  const link = document.createElement('a');
  link.href = url;
  link.download = `bono_${isAdmin ? 'admin_' : ''}${bond.id}_${new Date().toISOString().split('T')[0]}.html`;
  link.click();
  
  // Limpiar el URL
  URL.revokeObjectURL(url);
};

// Función para generar contenido HTML para usuarios
const generateUserHTMLContent = (bond: Bond, companyName?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Información del Bono - ${bond.id}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #007bff; margin: 0; }
            .section { margin-bottom: 25px; }
            .section h2 { color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
            .info-item label { font-weight: bold; color: #495057; display: block; margin-bottom: 5px; }
            .info-item value { color: #212529; font-size: 16px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            .currency { font-weight: bold; color: #28a745; }
            .date { font-weight: bold; color: #dc3545; }
            .rate { font-weight: bold; color: #ffc107; }
            @media print { body { margin: 0; } .header { page-break-inside: avoid; } .section { page-break-inside: avoid; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Información del Bono</h1>
            <p>Documento generado el ${new Date().toLocaleDateString('es-PE')}</p>
        </div>

        <div class="section">
            <h2>Información General</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Valor Nominal:</label>
                    <value class="currency">${formatCurrency(bond.valorNominal)}</value>
                </div>
                <div class="info-item">
                    <label>Empresa:</label>
                    <value>${companyName || 'No especificada'}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Emisión:</label>
                    <value class="date">${formatDate(bond.fechaEmision)}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Vencimiento:</label>
                    <value class="date">${formatDate(bond.fechaVencimiento)}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Términos Financieros</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Tasa de Interés:</label>
                    <value class="rate">${bond.tasaInteres}%</value>
                </div>
                <div class="info-item">
                    <label>Tipo de Tasa:</label>
                    <value>${bond.tipoTasa}</value>
                </div>
                <div class="info-item">
                    <label>Frecuencia de Pago:</label>
                    <value>${bond.frecuenciaPago.charAt(0).toUpperCase() + bond.frecuenciaPago.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>RUC del Usuario:</label>
                    <value>${bond.userRuc}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Características del Bono</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Comisiones:</label>
                    <value class="currency">${formatCurrency(bond.comisiones)}</value>
                </div>
                <div class="info-item">
                    <label>Gastos:</label>
                    <value class="currency">${formatCurrency(bond.gastos)}</value>
                </div>
                <div class="info-item">
                    <label>Período de Gracia:</label>
                    <value>${bond.periodoGracia.charAt(0).toUpperCase() + bond.periodoGracia.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>Duración Período de Gracia:</label>
                    <value>${bond.duracionPeriodoGracia} meses</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Información Adicional</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Fecha de Creación:</label>
                    <value>${formatDate(bond.createdAt)}</value>
                </div>
                <div class="info-item">
                    <label>Última Actualización:</label>
                    <value>${formatDate(bond.updatedAt)}</value>
                </div>
                <div class="info-item">
                    <label>ID del Bono:</label>
                    <value>${bond.id}</value>
                </div>
                <div class="info-item">
                    <label>Estado:</label>
                    <value>Activo</value>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Este documento contiene información confidencial del bono.</p>
            <p>Generado por el Sistema de Gestión de Bonos - ${new Date().toLocaleDateString('es-PE')}</p>
        </div>
    </body>
    </html>
  `;
};

// Función para generar contenido HTML para administradores
const generateAdminHTMLContent = (bond: Bond, companyName?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Bono - Administrador - ${bond.id}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #28a745; margin: 0; }
            .admin-badge { background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
            .section { margin-bottom: 25px; }
            .section h2 { color: #28a745; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
            .info-item label { font-weight: bold; color: #495057; display: block; margin-bottom: 5px; }
            .info-item value { color: #212529; font-size: 16px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            .currency { font-weight: bold; color: #28a745; }
            .date { font-weight: bold; color: #dc3545; }
            .rate { font-weight: bold; color: #ffc107; }
            @media print { body { margin: 0; } .header { page-break-inside: avoid; } .section { page-break-inside: avoid; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Reporte de Bono</h1>
            <div class="admin-badge">VISTA ADMINISTRADOR</div>
            <p>Documento generado el ${new Date().toLocaleDateString('es-PE')}</p>
        </div>

        <div class="section">
            <h2>Información General</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Valor Nominal:</label>
                    <value class="currency">${formatCurrency(bond.valorNominal)}</value>
                </div>
                <div class="info-item">
                    <label>Empresa:</label>
                    <value>${companyName || 'No especificada'}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Emisión:</label>
                    <value class="date">${formatDate(bond.fechaEmision)}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Vencimiento:</label>
                    <value class="date">${formatDate(bond.fechaVencimiento)}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Términos Financieros</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Tasa de Interés:</label>
                    <value class="rate">${bond.tasaInteres}%</value>
                </div>
                <div class="info-item">
                    <label>Tipo de Tasa:</label>
                    <value>${bond.tipoTasa}</value>
                </div>
                <div class="info-item">
                    <label>Frecuencia de Pago:</label>
                    <value>${bond.frecuenciaPago.charAt(0).toUpperCase() + bond.frecuenciaPago.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>RUC del Usuario:</label>
                    <value>${bond.userRuc}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Características del Bono</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Comisiones:</label>
                    <value class="currency">${formatCurrency(bond.comisiones)}</value>
                </div>
                <div class="info-item">
                    <label>Gastos:</label>
                    <value class="currency">${formatCurrency(bond.gastos)}</value>
                </div>
                <div class="info-item">
                    <label>Período de Gracia:</label>
                    <value>${bond.periodoGracia.charAt(0).toUpperCase() + bond.periodoGracia.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>Duración Período de Gracia:</label>
                    <value>${bond.duracionPeriodoGracia} meses</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Información Administrativa</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Fecha de Creación:</label>
                    <value>${formatDate(bond.createdAt)}</value>
                </div>
                <div class="info-item">
                    <label>Última Actualización:</label>
                    <value>${formatDate(bond.updatedAt)}</value>
                </div>
                <div class="info-item">
                    <label>ID del Bono:</label>
                    <value>${bond.id}</value>
                </div>
                <div class="info-item">
                    <label>Estado:</label>
                    <value>Activo</value>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>DOCUMENTO CONFIDENCIAL - SOLO PARA USO ADMINISTRATIVO</strong></p>
            <p>Este documento contiene información confidencial del bono y está destinado únicamente para el personal administrativo autorizado.</p>
            <p>Generado por el Sistema de Gestión de Bonos - ${new Date().toLocaleDateString('es-PE')}</p>
        </div>
    </body>
    </html>
  `;
};

// Función para generar PDF de información del bono para administradores
export const generateBondInfoPDF = (bond: Bond, companyName?: string): void => {
  // Crear el contenido HTML del documento para administradores
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Bono - Administrador</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #28a745;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #28a745;
                margin: 0;
            }
            .admin-badge {
                background: #28a745;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: inline-block;
                margin-bottom: 10px;
            }
            .section {
                margin-bottom: 25px;
            }
            .section h2 {
                color: #28a745;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #28a745;
            }
            .info-item label {
                font-weight: bold;
                color: #495057;
                display: block;
                margin-bottom: 5px;
            }
            .info-item value {
                color: #212529;
                font-size: 16px;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
            }
            .currency {
                font-weight: bold;
                color: #28a745;
            }
            .date {
                font-weight: bold;
                color: #dc3545;
            }
            .rate {
                font-weight: bold;
                color: #ffc107;
            }
            .action-buttons {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
            }
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.3s;
            }
            .btn-primary {
                background-color: #28a745;
                color: white;
            }
            .btn-primary:hover {
                background-color: #1e7e34;
            }
            .btn-success {
                background-color: #007bff;
                color: white;
            }
            .btn-success:hover {
                background-color: #0056b3;
            }
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                background-color: #545b62;
            }
            @media print {
                body { margin: 0; }
                .header { page-break-inside: avoid; }
                .section { page-break-inside: avoid; }
                .action-buttons { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Reporte de Bono</h1>
            <div class="admin-badge">VISTA ADMINISTRADOR</div>
            <p>Documento generado el ${new Date().toLocaleDateString('es-PE')}</p>
        </div>

        <div class="section">
            <h2>Información General</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Valor Nominal:</label>
                    <value class="currency">${formatCurrency(bond.valorNominal)}</value>
                </div>
                <div class="info-item">
                    <label>Empresa:</label>
                    <value>${companyName || 'No especificada'}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Emisión:</label>
                    <value class="date">${formatDate(bond.fechaEmision)}</value>
                </div>
                <div class="info-item">
                    <label>Fecha de Vencimiento:</label>
                    <value class="date">${formatDate(bond.fechaVencimiento)}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Términos Financieros</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Tasa de Interés:</label>
                    <value class="rate">${bond.tasaInteres}%</value>
                </div>
                <div class="info-item">
                    <label>Tipo de Tasa:</label>
                    <value>${bond.tipoTasa}</value>
                </div>
                <div class="info-item">
                    <label>Frecuencia de Pago:</label>
                    <value>${bond.frecuenciaPago.charAt(0).toUpperCase() + bond.frecuenciaPago.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>RUC del Usuario:</label>
                    <value>${bond.userRuc}</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Características del Bono</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Comisiones:</label>
                    <value class="currency">${formatCurrency(bond.comisiones)}</value>
                </div>
                <div class="info-item">
                    <label>Gastos:</label>
                    <value class="currency">${formatCurrency(bond.gastos)}</value>
                </div>
                <div class="info-item">
                    <label>Período de Gracia:</label>
                    <value>${bond.periodoGracia.charAt(0).toUpperCase() + bond.periodoGracia.slice(1)}</value>
                </div>
                <div class="info-item">
                    <label>Duración Período de Gracia:</label>
                    <value>${bond.duracionPeriodoGracia} meses</value>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Información Administrativa</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Fecha de Creación:</label>
                    <value>${formatDate(bond.createdAt)}</value>
                </div>
                <div class="info-item">
                    <label>Última Actualización:</label>
                    <value>${formatDate(bond.updatedAt)}</value>
                </div>
                <div class="info-item">
                    <label>ID del Bono:</label>
                    <value>${bond.id}</value>
                </div>
                <div class="info-item">
                    <label>Estado:</label>
                    <value>Activo</value>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>DOCUMENTO CONFIDENCIAL - SOLO PARA USO ADMINISTRATIVO</strong></p>
            <p>Este documento contiene información confidencial del bono y está destinado únicamente para el personal administrativo autorizado.</p>
            <p>Generado por el Sistema de Gestión de Bonos - ${new Date().toLocaleDateString('es-PE')}</p>
        </div>

        <div class="action-buttons">
            <button class="btn btn-success" onclick="window.print()">Imprimir</button>
            <button class="btn btn-primary" onclick="downloadPDF()">Descargar PDF</button>
            <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
        </div>

        <script>
            function downloadPDF() {
                // Mostrar mensaje de que se está generando el PDF
                const originalContent = document.body.innerHTML;
                document.body.innerHTML = '<div style="text-align: center; margin-top: 50px; color: #28a745;"><h2>Generando documento...</h2><p>Por favor espere un momento.</p></div>';
                
                setTimeout(() => {
                    // Crear el contenido HTML completo
                    const htmlContent = \`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Bono - Administrador - ${bond.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #28a745; margin: 0; }
        .admin-badge { background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #28a745; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
        .info-item label { font-weight: bold; color: #495057; display: block; margin-bottom: 5px; }
        .info-item value { color: #212529; font-size: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        .currency { font-weight: bold; color: #28a745; }
        .date { font-weight: bold; color: #dc3545; }
        .rate { font-weight: bold; color: #ffc107; }
        @media print { body { margin: 0; } .header { page-break-inside: avoid; } .section { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Bono</h1>
        <div class="admin-badge">VISTA ADMINISTRADOR</div>
        <p>Documento generado el ${new Date().toLocaleDateString('es-PE')}</p>
    </div>
    <div class="section">
        <h2>Información General</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Valor Nominal:</label>
                <value class="currency">${formatCurrency(bond.valorNominal)}</value>
            </div>
            <div class="info-item">
                <label>Empresa:</label>
                <value>${companyName || 'No especificada'}</value>
            </div>
            <div class="info-item">
                <label>Fecha de Emisión:</label>
                <value class="date">${formatDate(bond.fechaEmision)}</value>
            </div>
            <div class="info-item">
                <label>Fecha de Vencimiento:</label>
                <value class="date">${formatDate(bond.fechaVencimiento)}</value>
            </div>
        </div>
    </div>
    <div class="section">
        <h2>Términos Financieros</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Tasa de Interés:</label>
                <value class="rate">${bond.tasaInteres}%</value>
            </div>
            <div class="info-item">
                <label>Tipo de Tasa:</label>
                <value>${bond.tipoTasa}</value>
            </div>
            <div class="info-item">
                <label>Frecuencia de Pago:</label>
                <value>${bond.frecuenciaPago.charAt(0).toUpperCase() + bond.frecuenciaPago.slice(1)}</value>
            </div>
            <div class="info-item">
                <label>RUC del Usuario:</label>
                <value>${bond.userRuc}</value>
            </div>
        </div>
    </div>
    <div class="section">
        <h2>Características del Bono</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Comisiones:</label>
                <value class="currency">${formatCurrency(bond.comisiones)}</value>
            </div>
            <div class="info-item">
                <label>Gastos:</label>
                <value class="currency">${formatCurrency(bond.gastos)}</value>
            </div>
            <div class="info-item">
                <label>Período de Gracia:</label>
                <value>${bond.periodoGracia.charAt(0).toUpperCase() + bond.periodoGracia.slice(1)}</value>
            </div>
            <div class="info-item">
                <label>Duración Período de Gracia:</label>
                <value>${bond.duracionPeriodoGracia} meses</value>
            </div>
        </div>
    </div>
    <div class="section">
        <h2>Información Administrativa</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Fecha de Creación:</label>
                <value>${formatDate(bond.createdAt)}</value>
            </div>
            <div class="info-item">
                <label>Última Actualización:</label>
                <value>${formatDate(bond.updatedAt)}</value>
            </div>
            <div class="info-item">
                <label>ID del Bono:</label>
                <value>${bond.id}</value>
            </div>
            <div class="info-item">
                <label>Estado:</label>
                <value>Activo</value>
            </div>
        </div>
    </div>
    <div class="footer">
        <p><strong>DOCUMENTO CONFIDENCIAL - SOLO PARA USO ADMINISTRATIVO</strong></p>
        <p>Este documento contiene información confidencial del bono y está destinado únicamente para el personal administrativo autorizado.</p>
        <p>Generado por el Sistema de Gestión de Bonos - ${new Date().toLocaleDateString('es-PE')}</p>
    </div>
</body>
</html>\`;
                    
                    // Crear un blob del contenido HTML
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    // Crear un enlace para descargar
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'bono_admin_${bond.id}_${new Date().toISOString().split('T')[0]}.html';
                    link.click();
                    
                    // Limpiar el URL
                    URL.revokeObjectURL(url);
                    
                    // Restaurar el contenido original
                    document.body.innerHTML = originalContent;
                }, 1000);
            }
        </script>
    </body>
    </html>
  `;

  // Crear una nueva ventana para mostrar la vista previa
  const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
  if (previewWindow) {
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
    previewWindow.document.title = `Vista Previa Admin - Bono ${bond.id}`;
  }
};

// Funciones auxiliares para formatear
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PE').format(date);
};
