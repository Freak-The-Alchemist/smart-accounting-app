import React, { useState } from 'react';
import { ExportService, ExportOptions } from '../../../shared/src/services/ExportService';
import { Transaction } from '../../../shared/src/models/Transaction';
import { Currency, CURRENCIES } from '../../../shared/src/models/Currency';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LoadingSpinner } from './LoadingSpinner';
import { Toast, ToastType } from './Toast';

interface ExportDialogProps {
  transactions: Transaction[];
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ transactions, onClose }) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('KES');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const exportService = ExportService.getInstance();
      
      const options: ExportOptions = {
        format: 'xlsx',
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        currency: selectedCurrency,
        includeCharts
      };

      const reportData = exportService.generateReport(transactions, options);
      const blob = await exportService.exportToExcel(reportData, options);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({ message: 'Export completed successfully!', type: 'success' });
      setTimeout(onClose, 1500); // Close dialog after showing success message
    } catch (error) {
      console.error('Export failed:', error);
      setToast({ 
        message: 'Failed to export data. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const validateForm = () => {
    if (startDate && endDate && startDate > endDate) {
      setToast({ 
        message: 'End date must be after start date', 
        type: 'warning' 
      });
      return false;
    }
    return true;
  };

  const handleExportClick = () => {
    if (validateForm()) {
      handleExport();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Export Financial Data</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              disabled={isExporting}
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="flex space-x-2 mt-1">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Start Date"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isExporting}
                />
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="End Date"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isExporting}
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Categories</label>
              <div className="mt-1 max-h-40 overflow-y-auto border rounded">
                {categories.map(category => (
                  <label 
                    key={category} 
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        }
                      }}
                      className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                      disabled={isExporting}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={selectedCurrency}
                onChange={e => setSelectedCurrency(e.target.value as Currency)}
                className="mt-1 block w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isExporting}
              >
                {Object.entries(CURRENCIES).map(([code, info]: [string, { name: string; symbol: string }]) => (
                  <option key={code} value={code}>
                    {info.name} ({info.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Include Charts */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={e => setIncludeCharts(e.target.checked)}
                  className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                  disabled={isExporting}
                />
                Include Charts and Visualizations
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExportClick}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner size="small" color="text-white" />
                    <span className="ml-2">Exporting...</span>
                  </>
                ) : (
                  'Export'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}; 