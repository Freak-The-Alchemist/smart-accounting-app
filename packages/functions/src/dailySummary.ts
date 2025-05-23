import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { format } from 'date-fns';

admin.initializeApp();

interface DailySummary {
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  salesByPaymentMethod: {
    [key: string]: number;
  };
  topExpenses: Array<{
    category: string;
    amount: number;
  }>;
}

export const sendDailySummary = functions.pubsub
  .schedule('0 20 * * *') // Run at 8 PM every day
  .timeZone('Africa/Nairobi')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get all users with email notifications enabled
      const usersSnapshot = await db
        .collection('users')
        .where('emailNotifications', '==', true)
        .get();

      if (usersSnapshot.empty) {
        console.log('No users with email notifications enabled');
        return null;
      }

      // Get today's sales
      const salesSnapshot = await db
        .collection('sales')
        .where('timestamp', '>=', today)
        .get();

      // Get today's expenses
      const expensesSnapshot = await db
        .collection('expenses')
        .where('timestamp', '>=', today)
        .get();

      // Calculate summary
      const summary: DailySummary = {
        totalSales: 0,
        totalExpenses: 0,
        netIncome: 0,
        salesByPaymentMethod: {},
        topExpenses: [],
      };

      // Process sales
      salesSnapshot.forEach((doc) => {
        const sale = doc.data();
        summary.totalSales += sale.amount;
        summary.salesByPaymentMethod[sale.paymentMethod] = 
          (summary.salesByPaymentMethod[sale.paymentMethod] || 0) + sale.amount;
      });

      // Process expenses
      const expensesByCategory: { [key: string]: number } = {};
      expensesSnapshot.forEach((doc) => {
        const expense = doc.data();
        summary.totalExpenses += expense.amount;
        expensesByCategory[expense.category] = 
          (expensesByCategory[expense.category] || 0) + expense.amount;
      });

      // Calculate net income
      summary.netIncome = summary.totalSales - summary.totalExpenses;

      // Get top 5 expenses
      summary.topExpenses = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Configure email transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: functions.config().email.user,
          pass: functions.config().email.pass,
        },
      });

      // Send emails to each user
      const emailPromises = usersSnapshot.docs.map(async (userDoc) => {
        const user = userDoc.data();
        const emailContent = generateEmailContent(summary, today);

        await transporter.sendMail({
          from: functions.config().email.user,
          to: user.email,
          subject: `Daily Summary - ${format(today, 'MMMM d, yyyy')}`,
          html: emailContent,
        });
      });

      await Promise.all(emailPromises);
      console.log('Daily summary emails sent successfully');
      return null;
    } catch (error) {
      console.error('Error sending daily summary:', error);
      throw error;
    }
  });

function generateEmailContent(summary: DailySummary, date: Date): string {
  return `
    <h1>Daily Summary - ${format(date, 'MMMM d, yyyy')}</h1>
    
    <h2>Financial Overview</h2>
    <p>Total Sales: KES ${summary.totalSales.toFixed(2)}</p>
    <p>Total Expenses: KES ${summary.totalExpenses.toFixed(2)}</p>
    <p>Net Income: KES ${summary.netIncome.toFixed(2)}</p>

    <h2>Sales by Payment Method</h2>
    <ul>
      ${Object.entries(summary.salesByPaymentMethod)
        .map(([method, amount]) => `<li>${method}: KES ${amount.toFixed(2)}</li>`)
        .join('')}
    </ul>

    <h2>Top 5 Expenses</h2>
    <ul>
      ${summary.topExpenses
        .map((expense) => `<li>${expense.category}: KES ${expense.amount.toFixed(2)}</li>`)
        .join('')}
    </ul>

    <p>This is an automated email. Please do not reply.</p>
  `;
} 