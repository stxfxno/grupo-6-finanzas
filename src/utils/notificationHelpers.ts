// src/utils/notificationHelpers.ts
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType } from '../types/notification';
import { User } from '../models/User';

// Obtener todos los administradores
export const getAdminUsers = (): User[] => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.filter((user: User) => user.isAdmin);
};

// Obtener usuario actual
export const getCurrentUser = (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Obtener nombre de empresa por RUC
export const getCompanyNameByRuc = (userRuc: string): string => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: User) => u.ruc === userRuc);
    return user?.razonSocial || 'Empresa no encontrada';
};

// Crear una notificación en localStorage
export const saveNotificationToStorage = (notification: Notification): void => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Disparar evento para actualizar UI
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: notification }));
};

// Obtener notificaciones de un usuario específico
export const getNotificationsForUser = (userRuc: string): Notification[] => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications
        .filter((n: Notification) => n.userRuc === userRuc)
        .sort((a: Notification, b: Notification) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
};

// Marcar notificación como leída
export const markNotificationAsRead = (notificationId: string): void => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = notifications.map((n: Notification) =>
        n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('notifications-updated'));
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = (userRuc: string): void => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = notifications.map((n: Notification) =>
        n.userRuc === userRuc ? { ...n, read: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('notifications-updated'));
};

// Eliminar notificación
export const deleteNotificationFromStorage = (notificationId: string): void => {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const filtered = notifications.filter((n: Notification) => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(filtered));
    window.dispatchEvent(new Event('notifications-updated'));
};

// Factory para crear diferentes tipos de notificaciones
export const createNotificationData = (
    type: NotificationType,
    targetUserRuc: string,
    metadata: Notification['metadata'] = {}
): Omit<Notification, 'id' | 'read' | 'createdAt'> => {
    const currentUser = getCurrentUser();
    const companyName = currentUser?.razonSocial || 'Usuario';

    switch (type) {
        case 'bond_created':
            return {
                userRuc: targetUserRuc,
                type: 'bond_created',
                title: 'Nuevo Bono Creado',
                message: `${companyName} ha creado un nuevo bono corporativo`,
                metadata: {
                    ...metadata,
                    companyName
                }
            };

        case 'document_uploaded':
            return {
                userRuc: targetUserRuc,
                type: 'document_uploaded',
                title: 'Documento Subido',
                message: `${companyName} ha subido un nuevo documento: ${metadata.documentName || 'Sin nombre'}`,
                metadata: {
                    ...metadata,
                    companyName
                }
            };

        case 'document_approved':
            return {
                userRuc: targetUserRuc,
                type: 'document_approved',
                title: 'Documento Aprobado',
                message: `Su documento "${metadata.documentName || 'documento'}" ha sido aprobado por la SMV`,
                metadata
            };

        case 'document_rejected':
            return {
                userRuc: targetUserRuc,
                type: 'document_rejected',
                title: 'Documento Rechazado',
                message: `Su documento "${metadata.documentName || 'documento'}" ha sido rechazado`,
                metadata
            };

        case 'bond_expiring':
            return {
                userRuc: targetUserRuc,
                type: 'bond_expiring',
                title: 'Bono Próximo a Vencer',
                message: `Su bono vence en los próximos días. Revise los detalles.`,
                metadata
            };

        default:
            return {
                userRuc: targetUserRuc,
                type: 'bond_created',
                title: 'Notificación',
                message: 'Nueva notificación del sistema',
                metadata
            };
    }
};

// Formatear tiempo relativo
export const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Hace unos segundos';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
};

// Obtener icono según tipo de notificación
export const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
        case 'bond_created':
            return '💰';
        case 'document_uploaded':
            return '📄';
        case 'document_approved':
            return '✅';
        case 'document_rejected':
            return '❌';
        case 'bond_expiring':
            return '⏰';
        default:
            return '📢';
    }
};

// Obtener color según tipo de notificación
export const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
        case 'bond_created':
            return 'bg-blue-100 text-blue-800';
        case 'document_uploaded':
            return 'bg-indigo-100 text-indigo-800';
        case 'document_approved':
            return 'bg-green-100 text-green-800';
        case 'document_rejected':
            return 'bg-red-100 text-red-800';
        case 'bond_expiring':
            return 'bg-amber-100 text-amber-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};