// src/pages/NotificationCenter.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationContext } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types/notification';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotificationContext();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Filtrar notificaciones por el usuario actual
  const userNotifications = notifications.filter(n => n.userRuc === state.user?.ruc);

  // Aplicar filtro
  const filteredNotifications = userNotifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bond_created':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
      case 'bond_expiring':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'document_uploaded':
        return <DocumentIcon className="h-5 w-5 text-blue-500" />;
      case 'document_approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'document_rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navegar según el tipo de notificación
    if (notification.type === 'bond_created' && notification.metadata?.bondId) {
      navigate(`/bonds/${notification.metadata.bondId}`);
    } else if (notification.type === 'bond_expiring' && notification.metadata?.bondId) {
      navigate(`/bonds/${notification.metadata.bondId}`);
    } else if (notification.type.includes('document') && notification.metadata?.documentId) {
      navigate('/documents');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Centro de Notificaciones</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Volver al Dashboard
            </button>
          </div>
          <p className="mt-2 text-gray-600">
            Gestiona todas tus notificaciones desde aquí
          </p>
        </div>

        {/* Filtros y acciones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Filtros */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todas ({userNotifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  No leídas ({userNotifications.filter(n => !n.read).length})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'read'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Leídas ({userNotifications.filter(n => n.read).length})
                </button>
              </div>

              {/* Acciones */}
              <div className="flex space-x-2">
                {userNotifications.some(n => !n.read) && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'No tienes notificaciones' 
                  : `No tienes notificaciones ${filter === 'unread' ? 'sin leer' : 'leídas'}`
                }
              </p>
            </div>
          ) : (
            filteredNotifications
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                    !notification.read
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Icono */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Nuevo
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.metadata?.companyName && (
                              <span>• {notification.metadata.companyName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center space-x-2 ml-4">
                        {(notification.type === 'bond_created' || notification.type === 'bond_expiring') && notification.metadata?.bondId && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Ver Bono
                          </button>
                        )}
                        
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Marcar leída
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
