import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { accountingService } from '../../../shared/src/services/accountingService';
import { Account, JournalEntry, Expense, JournalEntryLine } from '../../../shared/src/types/accounting';
import JournalEntryForm from '../components/JournalEntryForm';
import AccountForm from '../components/AccountForm';
import ExpenseForm from '../components/ExpenseForm';
import { FinancialStatements } from '../components/FinancialStatements';
import { Box, Typography } from '@mui/material';

// Define user role type
type UserRole = 'admin' | 'accountant' | 'manager' | 'attendant';

const Accounting: React.FC = () => {
  const { user } = useAuth();
  const [sector, setSector] = useState<'general' | 'fuel'>('general');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showJournalEntryModal, setShowJournalEntryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: 'journal' | 'account' | 'expense', id: string } | null>(null);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);

  // Check if user has accountant role
  const isAccountant = user?.role === 'accountant' as UserRole;

  useEffect(() => {
    loadData();
  }, [sector]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, entriesData, expensesData] = await Promise.all([
        accountingService.getAccounts(),
        accountingService.getJournalEntries(),
        accountingService.getExpenses(),
      ]);

      setAccounts(accountsData);
      setJournalEntries(entriesData);
      setExpenses(expensesData);
    } catch (err) {
      setError('Failed to load accounting data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      switch (deleteItem.type) {
        case 'journal':
          await accountingService.deleteJournalEntry(deleteItem.id);
          break;
        case 'account':
          await accountingService.deleteAccount(deleteItem.id);
          break;
        case 'expense':
          await accountingService.deleteExpense(deleteItem.id);
          break;
      }
      await loadData();
      setSuccess('Item deleted successfully');
      setShowDeleteConfirm(false);
      setDeleteItem(null);
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  const confirmDelete = (type: 'journal' | 'account' | 'expense', id: string) => {
    setDeleteItem({ type, id });
    setShowDeleteConfirm(true);
  };

  // Journal Entry CRUD handlers
  const handleSaveJournalEntry = async (entry: JournalEntry) => {
    try {
      if (entry.id) {
        await accountingService.updateJournalEntry(entry.id, entry);
        setSuccess('Journal entry updated successfully');
      } else {
        await accountingService.createJournalEntry(entry);
        setSuccess('Journal entry created successfully');
      }
      await loadData();
      setShowJournalEntryModal(false);
    } catch (err) {
      setError('Failed to save journal entry');
      console.error(err);
    }
  };

  const handleEditJournalEntry = (entry: JournalEntry) => {
    setSelectedJournalEntry(entry);
    setShowJournalEntryModal(true);
  };

  // Account CRUD handlers
  const handleSaveAccount = async (account: Account) => {
    try {
      if (account.id) {
        await accountingService.updateAccount(account.id, account);
        setSuccess('Account updated successfully');
      } else {
        await accountingService.createAccount(account);
        setSuccess('Account created successfully');
      }
      await loadData();
      setShowAccountModal(false);
    } catch (err) {
      setError('Failed to save account');
      console.error(err);
    }
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);
  };

  // Expense CRUD handlers
  const handleSaveExpense = async (expense: Expense) => {
    try {
      if (expense.id) {
        await accountingService.updateExpense(expense.id, expense);
        setSuccess('Expense updated successfully');
      } else {
        await accountingService.createExpense(expense);
        setSuccess('Expense created successfully');
      }
      await loadData();
      setShowExpenseModal(false);
    } catch (err) {
      setError('Failed to save expense');
      console.error(err);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowExpenseModal(true);
  };

  // Expense approval handlers
  const handleApproveExpense = async (expenseId: string) => {
    try {
      await accountingService.updateExpense(expenseId, { status: 'approved' });
      await loadData();
      setSuccess('Expense approved successfully');
    } catch (err) {
      setError('Failed to approve expense');
      console.error(err);
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    try {
      await accountingService.updateExpense(expenseId, { status: 'rejected' });
      await loadData();
      setSuccess('Expense rejected successfully');
    } catch (err) {
      setError('Failed to reject expense');
      console.error(err);
    }
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Accounting
      </Typography>

      <Box sx={{ mb: 4 }}>
        <FinancialStatements />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Journal Entries
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Journal Entries */}
          {isAccountant && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Recent Journal Entries</h2>
              <div className="space-y-4">
                {journalEntries.map((entry) => (
                  <div key={entry.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{entry.reference}</p>
                        <p className="text-sm text-gray-500">{entry.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        entry.status === 'posted' ? 'bg-green-100 text-green-800' :
                        entry.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="mt-2">
                      {entry.entries.map((line: JournalEntryLine) => (
                        <div key={line.id} className="flex justify-between text-sm">
                          <span>{accounts.find(a => a.id === line.accountId)?.name}</span>
                          <span className="font-medium">
                            {line.debit > 0 ? `Dr ${line.debit}` : `Cr ${line.credit}`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => handleEditJournalEntry(entry)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => confirmDelete('journal', entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Accounts
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accounts */}
          {isAccountant && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Accounts</h2>
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div key={account.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{account.name}</p>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-800"
                          onClick={() => handleEditAccount(account)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => confirmDelete('account', account.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Expenses
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expenses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Recent Expenses</h2>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-gray-500">{expense.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {expense.status}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span>{new Date(expense.date).toLocaleDateString()}</span>
                    <span className="font-medium">${expense.amount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => handleEditExpense(expense)}
                    >
                      Edit
                    </button>
                    {isAccountant && expense.status === 'pending' && (
                      <>
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => handleApproveExpense(expense.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleRejectExpense(expense.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => confirmDelete('expense', expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Box>

      {/* Modals */}
      {showJournalEntryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedJournalEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </h2>
            <JournalEntryForm
              entry={selectedJournalEntry}
              onSave={handleSaveJournalEntry}
              onCancel={() => setShowJournalEntryModal(false)}
            />
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedAccount ? 'Edit Account' : 'New Account'}
            </h2>
            <AccountForm
              account={selectedAccount}
              onSave={handleSaveAccount}
              onCancel={() => setShowAccountModal(false)}
            />
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedExpense ? 'Edit Expense' : 'New Expense'}
            </h2>
            <ExpenseForm
              expense={selectedExpense}
              onSave={handleSaveExpense}
              onCancel={() => setShowExpenseModal(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteItem(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default Accounting; 