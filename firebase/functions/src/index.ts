import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import * as apiFunctions from './api';
import * as triggerFunctions from './triggers';
import * as serviceFunctions from './services';
import { PetrolStationService } from '@smart-accounting/shared/services/petrolStation';
import { NotificationService } from '@smart-accounting/shared/services/notification';

// Initialize Firebase Admin
admin.initializeApp();

// Export functions with explicit names
export const api = apiFunctions;
export const triggers = triggerFunctions;
export const services = serviceFunctions;

// Example HTTP function
export const helloWorld = functions.https.onRequest((request: Request, response: Response) => {
  response.json({ message: "Hello from Firebase!" });
});

const db = admin.firestore();

// Scheduled function to generate daily reports
export const generateDailyReport = functions.pubsub
  .schedule('0 0 * * *') // Run at midnight every day
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const petrolStationService = new PetrolStationService(db);
      const notificationService = new NotificationService(db);

      // Get all stations
      const stations = await petrolStationService.getAllStations();

      for (const station of stations) {
        // Generate daily report
        const report = await petrolStationService.generateDailyReport(station.id);

        // Store report in Firestore
        await db.collection('reports').add({
          stationId: station.id,
          type: 'daily',
          date: new Date(),
          data: report,
        });

        // Notify station managers
        const managers = await petrolStationService.getStationManagers(station.id);
        for (const manager of managers) {
          await notificationService.sendNotification(manager.id, {
            title: 'Daily Report Generated',
            body: `Daily report for ${station.name} is ready for review.`,
            data: {
              type: 'report',
              reportId: report.id,
            },
          });
        }
      }

      return null;
    } catch (error) {
      console.error('Error generating daily reports:', error);
      throw error;
    }
  });

// Function to check low inventory and send notifications
export const checkLowInventory = functions.pubsub
  .schedule('0 */4 * * *') // Run every 4 hours
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const petrolStationService = new PetrolStationService(db);
      const notificationService = new NotificationService(db);

      const stations = await petrolStationService.getAllStations();

      for (const station of stations) {
        const inventory = await petrolStationService.getInventory(station.id);
        const lowStockItems = inventory.filter(
          (item) => item.quantity <= item.reorderLevel
        );

        if (lowStockItems.length > 0) {
          const managers = await petrolStationService.getStationManagers(station.id);
          
          for (const manager of managers) {
            await notificationService.sendNotification(manager.id, {
              title: 'Low Inventory Alert',
              body: `${lowStockItems.length} items are running low in stock at ${station.name}.`,
              data: {
                type: 'inventory',
                stationId: station.id,
                items: lowStockItems.map((item) => item.id),
              },
            });
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking low inventory:', error);
      throw error;
    }
  });

// Function to process expense receipts using OCR
export const processExpenseReceipt = functions.https.onCall(
  async (data: { imageUrl: string; stationId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      const petrolStationService = new PetrolStationService(db);
      const { imageUrl, stationId } = data;

      // Download image from URL
      const response = await admin.storage().bucket().file(imageUrl).download();
      const imageBuffer = response[0];

      // Process image with OCR
      const ocrService = new OCRService();
      const receiptData = await ocrService.extractReceiptData(imageBuffer);

      // Create expense record
      const expense = await petrolStationService.createExpense(stationId, {
        amount: receiptData.total,
        date: new Date(receiptData.date),
        description: 'Receipt scan',
        items: receiptData.items,
        receiptImageUrl: imageUrl,
        status: 'pending',
        type: 'receipt',
        userId: context.auth.uid,
      });

      return { success: true, expense };
    } catch (error) {
      console.error('Error processing expense receipt:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to process expense receipt'
      );
    }
  }
); 