import React, { useState } from 'react';
import { DailyReport, MonthlyReport } from '../../../shared/src/types/petrolStation';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

  // Mock data for demonstration
  const mockDailyReport: DailyReport = {
    id: '1',
    date: new Date(),
    totalFuelSales: 2500.50,
    totalExpenses: 800.25,
    netIncome: 1700.25,
    fuelSalesByType: {
      petrol: 1500.75,
      diesel: 800.50,
      lpg: 199.25
    },
    expensesByCategory: {
      fuel: 400.00,
      maintenance: 150.00,
      utilities: 200.00,
      supplies: 50.25
    },
    shifts: ['1', '2'],
    generatedBy: '1',
    generatedAt: new Date()
  };

  const mockMonthlyReport: MonthlyReport = {
    id: '1',
    year: 2024,
    month: 3,
    totalSales: 75000.50,
    totalExpenses: 24000.75,
    netIncome: 51000.75,
    fuelSales: {
      petrol: {
        liters: 15000,
        amount: 45000.00
      },
      diesel: {
        liters: 8000,
        amount: 24000.00
      },
      cng: {
        liters: 2000,
        amount: 6000.00
      }
    },
    expenses: {
      fuel: 12000.00,
      maintenance: 4500.00,
      utilities: 6000.00,
      supplies: 1500.00,
      other: 0.00
    },
    paymentMethods: {
      cash: 30000.00,
      card: 35000.00,
      mobile: 5000.00,
      bank: 5000.00
    },
    dailyReports: ['1', '2', '3'],
    recordedBy: '1'
  };

  const handleGenerateReport = () => {
    // TODO: Implement report generation
    console.log('Generating report...');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-md ${
              reportType === 'daily'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-md ${
              reportType === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly Report
          </button>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          {reportType === 'daily' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleGenerateReport}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Generate Report
        </button>
      </div>

      {/* Report Display */}
      <div className="bg-white rounded-lg shadow p-6">
        {reportType === 'daily' ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Daily Report - {new Date(selectedDate).toLocaleDateString()}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Fuel Sales</h3>
                <p className="text-2xl font-semibold text-gray-900">${mockDailyReport.totalFuelSales.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                <p className="text-2xl font-semibold text-gray-900">${mockDailyReport.totalExpenses.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
                <p className="text-2xl font-semibold text-gray-900">${mockDailyReport.netIncome.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Fuel Sales by Type</h3>
                <div className="space-y-2">
                  {Object.entries(mockDailyReport.fuelSalesByType).map(([type, amount]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{type}</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Expenses by Category</h3>
                <div className="space-y-2">
                  {Object.entries(mockDailyReport.expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{category}</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Monthly Report - {new Date(selectedMonth + '-01').toLocaleDateString('default', { year: 'numeric', month: 'long' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                <p className="text-2xl font-semibold text-gray-900">${mockMonthlyReport.totalSales.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                <p className="text-2xl font-semibold text-gray-900">${mockMonthlyReport.totalExpenses.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
                <p className="text-2xl font-semibold text-gray-900">${mockMonthlyReport.netIncome.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Fuel Sales</h3>
                <div className="space-y-4">
                  {Object.entries(mockMonthlyReport.fuelSales).map(([type, data]) => (
                    <div key={type} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 capitalize mb-2">{type}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Liters</span>
                          <span className="font-medium">{data.liters.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Amount</span>
                          <span className="font-medium">${data.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
                <div className="space-y-2">
                  {Object.entries(mockMonthlyReport.paymentMethods).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{method}</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 