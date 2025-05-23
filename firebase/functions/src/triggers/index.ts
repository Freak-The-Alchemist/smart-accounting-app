import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

// Trigger when a new user is created
export const onUserCreated = functions.auth.user().onCreate(async (user: UserRecord) => {
  try {
    // Create a new user document in Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Created new user document for ${user.uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
});

// Trigger when a user is deleted
export const onUserDeleted = functions.auth.user().onDelete(async (user: UserRecord) => {
  try {
    // Delete the user's document from Firestore
    await admin.firestore().collection('users').doc(user.uid).delete();
    
    console.log(`Deleted user document for ${user.uid}`);
  } catch (error) {
    console.error('Error deleting user document:', error);
    throw error;
  }
}); 