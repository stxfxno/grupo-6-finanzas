// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType } from '../types/notification';
import { useAuth } from '../context/AuthContext';
import {
    getNotificationsForUser,
    saveNotificationToStorage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationFromStorage,
    createNotificationData,
    getAdminUsers
} from '../utils/notificationHelpers';

export const useNotifications = () => {
    const { state: authState } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    // Cargar notificaciones del usuario actual
    const loadNotifications = useCallback(() => {
        if (!authState.user?.ruc) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        const userNotifications = getNotificationsForUser(authState.user.ruc);
        setNotifications(userNotifications);
        setLoading(false);
    }, [authState.user?.ruc]);

    // Efecto para cargar notificaciones al montar y escuchar cambios
    useEffect(() => {
        loadNotifications();

        // Escuchar eventos de actualización
        const handleNotificationsUpdate = (event: Event) => {
            loadNotifications();

            // Si es un evento custom con detalle, mostrar toast
            if (event instanceof CustomEvent && event.detail) {
                const newNotification = event.detail as Notification;
                if (newNotification.userRuc === authState.user?.ruc) {
                    showToast(newNotification);
                }
            }
        };

        window.addEventListener('notifications-updated', handleNotificationsUpdate);

        return () => {
            window.removeEventListener('notifications-updated', handleNotificationsUpdate);
        };
    }, [loadNotifications, authState.user?.ruc]);

    // Crear una nueva notificación
    const createNotification = useCallback((
        type: NotificationType,
        targetUserRuc: string,
        metadata?: Notification['metadata']
    ) => {
        const notificationData = createNotificationData(type, targetUserRuc, metadata);

        const newNotification: Notification = {
            ...notificationData,
            id: uuidv4(),
            read: false,
            createdAt: new Date().toISOString()
        };

        saveNotificationToStorage(newNotification);
    }, []);

    // Crear notificaciones para múltiples usuarios (ej: todos los admins)
    const createNotificationForAdmins = useCallback((
        type: NotificationType,
        metadata?: Notification['metadata']
    ) => {
        const adminUsers = getAdminUsers();
        adminUsers.forEach(admin => {
            createNotification(type, admin.ruc, metadata);
        });
    }, [createNotification]);

    // Marcar como leída
    const markAsRead = useCallback((notificationId: string) => {
        markNotificationAsRead(notificationId);
    }, []);

    // Marcar todas como leídas
    const markAllAsRead = useCallback(() => {
        if (authState.user?.ruc) {
            markAllNotificationsAsRead(authState.user.ruc);
        }
    }, [authState.user?.ruc]);

    // Eliminar notificación
    const deleteNotification = useCallback((notificationId: string) => {
        deleteNotificationFromStorage(notificationId);
    }, []);

    // Mostrar toast notification
    const showToast = useCallback((notification: Notification) => {
        // Crear elemento toast
        const toastId = `toast-${notification.id}`;

        // Verificar si ya existe un toast con este ID
        if (document.getElementById(toastId)) {
            return;
        }

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `
      fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200
      transform transition-all duration-300 ease-in-out translate-x-full opacity-0
    `;

        toast.innerHTML = `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg ${getNotificationBgColor(notification.type)}">
              ${getNotificationEmoji(notification.type)}
            </div>
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-gray-900">
              ${notification.title}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              ${notification.message}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button class="toast-close bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

        // Agregar al DOM
        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        }, 100);

        // Event listener para cerrar
        const closeButton = toast.querySelector('.toast-close');
        const closeToast = () => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        };

        closeButton?.addEventListener('click', closeToast);

        // Auto-cerrar después de 5 segundos
        setTimeout(closeToast, 5000);
    }, []);

    // Funciones auxiliares para el toast
    const getNotificationEmoji = (type: NotificationType): string => {
        switch (type) {
            case 'bond_created': return '💰';
            case 'document_uploaded': return '📄';
            case 'document_approved': return '✅';
            case 'document_rejected': return '❌';
            case 'bond_expiring': return '⏰';
            default: return '📢';
        }
    };

    const getNotificationBgColor = (type: NotificationType): string => {
        switch (type) {
            case 'bond_created': return 'bg-blue-100';
            case 'document_uploaded': return 'bg-indigo-100';
            case 'document_approved': return 'bg-green-100';
            case 'document_rejected': return 'bg-red-100';
            case 'bond_expiring': return 'bg-amber-100';
            default: return 'bg-gray-100';
        }
    };

    // Calcular notificaciones no leídas
    const unreadCount = notifications.filter(n => !n.read).length;

    return {
        notifications,
        unreadCount,
        loading,
        createNotification,
        createNotificationForAdmins,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        showToast
    };
};