import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../../shared/src/types/accounting';
import { accountingService } from '../../shared/src/services/accountingService';

interface ExpenseFormProps {
  expense?: Expense;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onSave, onCancel }) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    description: '',
    accountId: '',
    status: 'pending',
    receiptUrl: ''
  });

  useEffect(() => {
    loadCategories();
    if (expense) {
      setFormData(expense);
    }
  }, [expense]);

  const loadCategories = async () => {
    try {
      const categoriesData = await accountingService.getExpenseCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: Partial<Expense>) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // TODO: Implement file upload to storage service
      // For now, we'll just use a placeholder URL
      const receiptUrl = 'https://example.com/receipts/' + file.name;
      setFormData((prev: Partial<Expense>) => ({ ...prev, receiptUrl }));
    } catch (error) {
      console.error('Failed to upload receipt:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newExpense: Expense = {
      id: expense?.id || String(Date.now()),
      date: formData.date || new Date().toISOString(),
      category: formData.category || '',
      amount: formData.amount || 0,
      description: formData.description || '',
      accountId: formData.accountId || '',
      status: formData.status || 'pending',
      receiptUrl: formData.receiptUrl || '',
      createdBy: expense?.createdBy || 'current-user',
      createdAt: expense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newExpense);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date?.split('T')[0]}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Receipt</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
        {formData.receiptUrl && (
          <p className="mt-2 text-sm text-gray-500">
            Receipt uploaded: {formData.receiptUrl}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {expense ? 'Update' : 'Create'} Expense
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm; 