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
exports.onUserDeleted = exports.onUserCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Trigger when a new user is created
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    try {
        // Create a new user document in Firestore
        await admin.firestore().collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Created new user document for ${user.uid}`);
    }
    catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
});
// Trigger when a user is deleted
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
    try {
        // Delete the user's document from Firestore
        await admin.firestore().collection('users').doc(user.uid).delete();
        console.log(`Deleted user document for ${user.uid}`);
    }
    catch (error) {
        console.error('Error deleting user document:', error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map