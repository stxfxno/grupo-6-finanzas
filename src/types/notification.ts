// src/types/notification.ts
export interface Notification {
    id: string;
    userRuc: string; // A quién va dirigida
    type: 'document_uploaded' | 'document_approved' | 'document_rejected' | 'bond_created' | 'bond_expiring';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    relatedId?: string; // ID del bono o documento relacionado
    metadata?: {
        bondId?: string;
        documentId?: string;
        documentName?: string;
        companyName?: string;
        comments?: string;
        documentType?: string;
    };
}

export type NotificationType = Notification['type'];

export interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    createNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (notificationId: string) => void;
    showToast: (notification: Notification) => void;
}