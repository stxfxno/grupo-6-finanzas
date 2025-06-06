// src/context/NotificationContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { NotificationContextType, Notification } from '../types/notification';
import { useNotifications } from '../hooks/useNotifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const notificationMethods = useNotifications();

    const contextValue: NotificationContextType = {
        notifications: notificationMethods.notifications,
        unreadCount: notificationMethods.unreadCount,
        createNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
            // Adapter para convertir la firma del contexto a la del hook
            notificationMethods.createNotification(
                notification.type,
                notification.userRuc,
                notification.metadata
            );
        },
        markAsRead: notificationMethods.markAsRead,
        markAllAsRead: notificationMethods.markAllAsRead,
        deleteNotification: notificationMethods.deleteNotification,
        showToast: notificationMethods.showToast,
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext debe ser usado dentro de un NotificationProvider');
    }
    return context;
};