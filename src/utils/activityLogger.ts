import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type NotificationType = 'Auth' | 'Users' | 'Jobs' | 'Security' | 'Reports' | 'System';
export type NotificationPriority = 'info' | 'success' | 'warning' | 'danger';

export interface FrontendNotificationPayload {
  title: string;
  description: string;
  type: NotificationType;
  priority: NotificationPriority;
  metadata?: any;
}

/**
 * Logs a notification to the central Firestore notifications collection directly from the frontend.
 * Requires the user to be authenticated (as per firestore.rules).
 */
export const logActivity = async (payload: FrontendNotificationPayload) => {
  try {
    const user = auth.currentUser;
    if (!user) return; // Must be authenticated to log

    const docRef = await addDoc(collection(db, "notifications"), {
      ...payload,
      userId: user.uid,
      // Default to trying to pull the role from the token claims if possible, 
      // otherwise it might be omitted or passed in metadata.
      createdAt: serverTimestamp(),
      read: false
    });
    
    // Also include the generated id
    // We don't really need to do another update, but for consistency if we wanted `id` in the doc:
    // await updateDoc(docRef, { id: docRef.id });
    
    console.log(`[Frontend Log] ${payload.title} recorded.`);
  } catch (err) {
    console.warn("Failed to log activity to notifications:", err);
  }
};
