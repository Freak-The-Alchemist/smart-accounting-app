import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CallableContext } from 'firebase-functions/v1/https';

// Example API endpoint for user data
export const getUserData = functions.https.onCall(async (data: unknown, context: CallableContext) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to access this data'
    );
  }

  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User data not found'
      );
    }

    return userDoc.data();
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Error fetching user data'
    );
  }
}); 