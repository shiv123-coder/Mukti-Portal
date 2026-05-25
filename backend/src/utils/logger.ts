import * as admin from 'firebase-admin';

export type NotificationType = 'Auth' | 'Users' | 'Jobs' | 'Security' | 'Reports' | 'System';
export type NotificationPriority = 'info' | 'success' | 'warning' | 'danger';

export interface NotificationPayload {
  title: string;
  description: string;
  type: NotificationType;
  priority: NotificationPriority;
  userId?: string;
  userRole?: string;
  metadata?: any;
}

/**
 * Logs a notification to the central Firestore notifications collection.
 * Uses the Admin SDK so it bypasses security rules.
 */
export const logAdminNotification = async (payload: NotificationPayload) => {
  try {
    if (!admin.apps.length) return; // Silent skip if no firebase admin
    
    const db = admin.firestore();
    const docRef = db.collection('notifications').doc();
    
    await docRef.set({
      id: docRef.id,
      ...payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
    console.log(`[Notification] ${payload.title} logged successfully.`);
  } catch (err) {
    console.error('Failed to log admin notification:', err);
  }
};
