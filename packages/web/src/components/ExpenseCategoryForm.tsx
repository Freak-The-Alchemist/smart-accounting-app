import React, { useState, useEffect } from 'react';
import { ExpenseCategory, Account } from '../../shared/src/types/accounting';
import { accountingService } from '../../shared/src/services/accountingService';

interface ExpenseCategoryFormProps {
  category?: ExpenseCategory;
  onSave: (category: ExpenseCategory) => void;
  onCancel: () => void;
}

const ExpenseCategoryForm: React.FC<ExpenseCategoryFormProps> = ({ category, onSave, onCancel }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<Partial<ExpenseCategory>>({
    name: '',
    description: '',
    accountId: '',
    isActive: true
  });

  useEffect(() => {
    loadAccounts();
    if (category) {
      setFormData(category);
    }
  }, [category]);

  const loadAccounts = async () => {
    try {
      const accountsData = await accountingService.getAccounts();
      // Filter for expense accounts only
      const expenseAccounts = accountsData.filter((account: Account) => account.type === 'expense');
      setAccounts(expenseAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: Partial<ExpenseCategory>) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCategory: ExpenseCategory = {
      id: category?.id || String(Date.now()),
      name: formData.name || '',
      description: formData.description || '',
      accountId: formData.accountId || '',
      isActive: formData.isActive ?? true
    };

    onSave(newCategory);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Expense Account</label>
        <select
          name="accountId"
          value={formData.accountId}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        >
          <option value="">Select Account</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.code})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleInputChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Active
        </label>
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
          {category ? 'Update' : 'Create'} Category
        </button>
      </div>
    </form>
  );
};

export default ExpenseCategoryForm; 