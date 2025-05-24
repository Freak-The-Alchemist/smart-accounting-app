import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  FuelSale,
  Shift,
  Expense,
  StockItem,
  DailyReport,
  MonthlyReport,
  FuelType,
  PaymentMethod
} from '../types/petrolStation';

export class PetrolStationService {
  private static instance: PetrolStationService;

  private constructor() {}

  static getInstance(): PetrolStationService {
    if (!PetrolStationService.instance) {
      PetrolStationService.instance = new PetrolStationService();
    }
    return PetrolStationService.instance;
  }

  // Fuel Sales
  async recordFuelSale(sale: Omit<FuelSale, 'id'>): Promise<FuelSale> {
    const docRef = await addDoc(collection(db, 'fuelSales'), {
      ...sale,
      timestamp: Timestamp.fromDate(sale.timestamp)
    });
    return { ...sale, id: docRef.id };
  }

  async getFuelSalesByShift(shiftId: string): Promise<FuelSale[]> {
    const q = query(
      collection(db, 'fuelSales'),
      where('shiftId', '==', shiftId),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp.toDate()
    })) as FuelSale[];
  }

  // Shifts
  async startShift(attendantId: string): Promise<Shift> {
    const shift: Omit<Shift, 'id'> = {
      attendantId,
      startTime: new Date(),
      status: 'active',
      totalSales: 0,
      fuelSales: {
        petrol: 0,
        diesel: 0,
        cng: 0
      },
      paymentMethods: {
        cash: 0,
        card: 0,
        mobile: 0,
        bank: 0
      }
    };

    const docRef = await addDoc(collection(db, 'shifts'), {
      ...shift,
      startTime: Timestamp.fromDate(shift.startTime)
    });
    return { ...shift, id: docRef.id };
  }

  async endShift(shiftId: string): Promise<void> {
    const shiftRef = doc(db, 'shifts', shiftId);
    await updateDoc(shiftRef, {
      endTime: Timestamp.now(),
      status: 'completed'
    });
  }

  async getActiveShift(attendantId: string): Promise<Shift | null> {
    const q = query(
      collection(db, 'shifts'),
      where('attendantId', '==', attendantId),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id,
      startTime: doc.data().startTime.toDate(),
      endTime: doc.data().endTime?.toDate()
    } as Shift;
  }

  // Expenses
  async recordExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      date: Timestamp.fromDate(expense.date)
    });
    return { ...expense, id: docRef.id };
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const q = query(
      collection(db, 'expenses'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      date: doc.data().date.toDate()
    })) as Expense[];
  }

  // Stock Management
  async updateStockItem(item: Omit<StockItem, 'id'>): Promise<StockItem> {
    const docRef = await addDoc(collection(db, 'stockItems'), {
      ...item,
      lastUpdated: Timestamp.fromDate(item.lastUpdated)
    });
    return { ...item, id: docRef.id };
  }

  async getStockItems(): Promise<StockItem[]> {
    const snapshot = await getDocs(collection(db, 'stockItems'));
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      lastUpdated: doc.data().lastUpdated.toDate()
    })) as StockItem[];
  }

  // Reports
  async generateDailyReport(date: Date, recordedBy: string): Promise<DailyReport> {
    const start = startOfDay(date);
    const end = endOfDay(date);

    // Get all shifts for the day
    const shiftsQuery = query(
      collection(db, 'shifts'),
      where('startTime', '>=', Timestamp.fromDate(start)),
      where('startTime', '<=', Timestamp.fromDate(end))
    );
    const shiftsSnapshot = await getDocs(shiftsQuery);
    const shifts = shiftsSnapshot.docs.map(doc => doc.id);

    // Get all fuel sales for the day
    const salesQuery = query(
      collection(db, 'fuelSales'),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end))
    );
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => doc.data()) as FuelSale[];

    // Get all expenses for the day
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end))
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    const expenses = expensesSnapshot.docs.map(doc => doc.data()) as Expense[];

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate fuel sales by type
    const fuelSales = {
      petrol: { liters: 0, amount: 0 },
      diesel: { liters: 0, amount: 0 },
      cng: { liters: 0, amount: 0 }
    };

    sales.forEach(sale => {
      const type = sale.fuelType as FuelType;
      fuelSales[type].liters += sale.liters;
      fuelSales[type].amount += sale.total;
    });

    // Calculate expenses by category
    const expensesByCategory = {
      fuel: 0,
      maintenance: 0,
      utilities: 0,
      supplies: 0,
      other: 0
    };

    expenses.forEach(expense => {
      expensesByCategory[expense.category as keyof typeof expensesByCategory] += expense.amount;
    });

    // Calculate payment methods
    const paymentMethods = {
      cash: 0,
      card: 0,
      mobile: 0,
      bank: 0
    };

    sales.forEach(sale => {
      paymentMethods[sale.paymentMethod as PaymentMethod] += sale.total;
    });

    const report: Omit<DailyReport, 'id'> = {
      date,
      totalSales,
      totalExpenses,
      netIncome: totalSales - totalExpenses,
      fuelSales,
      expenses: expensesByCategory,
      paymentMethods,
      shifts,
      recordedBy
    };

    const docRef = await addDoc(collection(db, 'dailyReports'), {
      ...report,
      date: Timestamp.fromDate(date)
    });

    return { ...report, id: docRef.id };
  }

  async generateMonthlyReport(year: number, month: number, recordedBy: string): Promise<MonthlyReport> {
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    // Get all daily reports for the month
    const reportsQuery = query(
      collection(db, 'dailyReports'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end))
    );
    const reportsSnapshot = await getDocs(reportsQuery);
    const dailyReports = reportsSnapshot.docs.map(doc => doc.id);
    const reports = reportsSnapshot.docs.map(doc => doc.data()) as DailyReport[];

    // Calculate totals
    const totalSales = reports.reduce((sum, report) => sum + report.totalSales, 0);
    const totalExpenses = reports.reduce((sum, report) => sum + report.totalExpenses, 0);

    // Calculate fuel sales
    const fuelSales = {
      petrol: { liters: 0, amount: 0 },
      diesel: { liters: 0, amount: 0 },
      cng: { liters: 0, amount: 0 }
    };

    reports.forEach(report => {
      Object.keys(report.fuelSales).forEach(type => {
        const fuelType = type as keyof typeof fuelSales;
        fuelSales[fuelType].liters += report.fuelSales[fuelType].liters;
        fuelSales[fuelType].amount += report.fuelSales[fuelType].amount;
      });
    });

    // Calculate expenses
    const expenses = {
      fuel: 0,
      maintenance: 0,
      utilities: 0,
      supplies: 0,
      other: 0
    };

    reports.forEach(report => {
      Object.keys(report.expenses).forEach(category => {
        expenses[category as keyof typeof expenses] += report.expenses[category as keyof typeof expenses];
      });
    });

    // Calculate payment methods
    const paymentMethods = {
      cash: 0,
      card: 0,
      mobile: 0,
      bank: 0
    };

    reports.forEach(report => {
      Object.keys(report.paymentMethods).forEach(method => {
        paymentMethods[method as keyof typeof paymentMethods] +=
          report.paymentMethods[method as keyof typeof paymentMethods];
      });
    });

    const report: Omit<MonthlyReport, 'id'> = {
      year,
      month,
      totalSales,
      totalExpenses,
      netIncome: totalSales - totalExpenses,
      fuelSales,
      expenses,
      paymentMethods,
      dailyReports,
      recordedBy
    };

    const docRef = await addDoc(collection(db, 'monthlyReports'), report);
    return { ...report, id: docRef.id };
  }
} 