// src/components/notifications/Toast.tsx
import React, { useEffect, useState } from 'react';
import { Notification } from '../../types/notification';
import { getNotificationIcon } from '../../utils/notificationHelpers';

interface ToastProps {
    notification: Notification;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Animar entrada
        const timer = setTimeout(() => setIsVisible(true), 100);

        // Auto-close timer
        const closeTimer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearTimeout(closeTimer);
        };
    }, [duration]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const getToastColor = () => {
        switch (notification.type) {
            case 'document_approved':
                return 'border-green-200 bg-green-50';
            case 'document_rejected':
                return 'border-red-200 bg-red-50';
            case 'document_uploaded':
                return 'border-blue-200 bg-blue-50';
            case 'bond_created':
                return 'border-indigo-200 bg-indigo-50';
            case 'bond_expiring':
                return 'border-amber-200 bg-amber-50';
            default:
                return 'border-gray-200 bg-white';
        }
    };

    const getIconColor = () => {
        switch (notification.type) {
            case 'document_approved':
                return 'text-green-600 bg-green-100';
            case 'document_rejected':
                return 'text-red-600 bg-red-100';
            case 'document_uploaded':
                return 'text-blue-600 bg-blue-100';
            case 'bond_created':
                return 'text-indigo-600 bg-indigo-100';
            case 'bond_expiring':
                return 'text-amber-600 bg-amber-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div
            className={`
        fixed top-4 right-4 z-50 max-w-sm w-full rounded-lg shadow-lg border transition-all duration-300 ease-in-out
        ${getToastColor()}
        ${isVisible && !isLeaving
                    ? 'transform translate-x-0 opacity-100'
                    : 'transform translate-x-full opacity-0'
                }
      `}
        >
            <div className="p-4">
                <div className="flex items-start">
                    {/* Icono */}
                    <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${getIconColor()}`}>
                            {getNotificationIcon(notification.type)}
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                            {notification.message}
                        </p>

                        {/* Mostrar información adicional si existe */}
                        {notification.metadata?.comments && (
                            <div className="mt-2 p-2 bg-white bg-opacity-60 rounded text-xs text-gray-600">
                                <strong>Comentarios:</strong> {notification.metadata.comments}
                            </div>
                        )}
                    </div>

                    {/* Botón de cerrar */}
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleClose}
                            className="bg-white bg-opacity-20 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">Cerrar</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-2 w-full bg-gray-200 bg-opacity-50 rounded-full h-1">
                    <div
                        className="bg-current h-1 rounded-full transition-all ease-linear"
                        style={{
                            width: isVisible ? '0%' : '100%',
                            transitionDuration: `${duration}ms`
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Toast;