// src/components/notifications/NotificationDropdown.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../../types/notification';
import { formatTimeAgo, getNotificationIcon, getNotificationColor } from '../../utils/notificationHelpers';

interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAsRead: (notificationId: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (notificationId: string) => void;
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClose
}) => {
    const navigate = useNavigate();
    const unreadNotifications = notifications.filter(n => !n.read);
    const hasUnread = unreadNotifications.length > 0;

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        
        // Navegar según el tipo de notificación
        if (notification.type === 'bond_created' && notification.metadata?.bondId) {
            onClose();
            navigate(`/bonds/${notification.metadata.bondId}`);
        } else if (notification.type === 'bond_expiring' && notification.metadata?.bondId) {
            onClose();
            navigate(`/bonds/${notification.metadata.bondId}`);
        }
    };

    const handleMarkAllAsRead = () => {
        onMarkAllAsRead();
    };

    const handleDelete = (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        onDelete(notificationId);
    };

    const handleViewAllNotifications = () => {
        onClose();
        navigate('/notifications');
    };

    return (
        <div className="absolute right-0 mt-2 w-96 max-w-sm bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                        Notificaciones
                    </h3>
                    <div className="flex items-center space-x-2">
                        {hasUnread && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                {hasUnread && (
                    <p className="text-sm text-gray-500 mt-1">
                        Tienes {unreadNotifications.length} notificación{unreadNotifications.length !== 1 ? 'es' : ''} nueva{unreadNotifications.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notificaciones</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Te notificaremos cuando haya algo nuevo.
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={handleViewAllNotifications}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Ir al centro de notificaciones
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${!notification.read
                                        ? 'bg-blue-50 hover:bg-blue-100'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    {/* Icono de tipo de notificación */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)
                                        }`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Contenido de la notificación */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                                                }`}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>

                                        {/* Metadatos adicionales */}
                                        {notification.metadata?.comments && (
                                            <div className="mt-2 p-2 bg-gray-100 rounded-md">
                                                <p className="text-xs text-gray-700">
                                                    <span className="font-medium">Comentarios:</span> {notification.metadata.comments}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs text-gray-500">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>

                                            {/* Botón de eliminar */}
                                            <button
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors duration-150"
                                                title="Eliminar notificación"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Indicadores adicionales para diferentes tipos */}
                                        {notification.metadata?.bondId && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Bono ID: {notification.metadata.bondId.slice(0, 8)}...
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer con acciones adicionales */}
            {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''} total{notifications.length !== 1 ? 'es' : ''}
                        </p>
                        {hasUnread && (
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-blue-600 font-medium">
                                    {unreadNotifications.length} nueva{unreadNotifications.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="mt-2">
                        <button
                            onClick={handleViewAllNotifications}
                            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-md hover:bg-blue-50 transition-colors duration-150"
                        >
                            Ver todas las notificaciones
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;