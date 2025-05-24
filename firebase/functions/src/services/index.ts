import * as admin from 'firebase-admin';

// Utility function to get user data
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    return userDoc.data();
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Utility function to update user data
export const updateUserData = async (userId: string, data: Partial<admin.firestore.DocumentData>) => {
  try {
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Utility function to delete user data
export const deleteUserData = async (userId: string) => {
  try {
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .delete();
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}; 