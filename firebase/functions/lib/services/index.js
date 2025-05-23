"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserData = exports.updateUserData = exports.getUserData = void 0;
const admin = __importStar(require("firebase-admin"));
// Utility function to get user data
const getUserData = async (userId) => {
    try {
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        return userDoc.data();
    }
    catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
};
exports.getUserData = getUserData;
// Utility function to update user data
const updateUserData = async (userId, data) => {
    try {
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .update(Object.assign(Object.assign({}, data), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
};
exports.updateUserData = updateUserData;
// Utility function to delete user data
const deleteUserData = async (userId) => {
    try {
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .delete();
    }
    catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
};
exports.deleteUserData = deleteUserData;
//# sourceMappingURL=index.js.map