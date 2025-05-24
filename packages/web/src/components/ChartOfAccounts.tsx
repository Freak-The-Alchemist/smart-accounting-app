import React, { useState, useEffect } from 'react';
import { Account, ChartOfAccounts } from '../../shared/src/types/accounting';
import { accountingService } from '../../shared/src/services/accountingService';

interface ChartOfAccountsProps {
  onSelectAccount: (account: Account) => void;
}

const ChartOfAccountsComponent: React.FC<ChartOfAccountsProps> = ({ onSelectAccount }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await accountingService.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const getChildAccounts = (parentId: string | null): Account[] => {
    return accounts.filter(account => account.parentId === parentId);
  };

  const renderAccountTree = (parentId: string | null, level: number = 0) => {
    const childAccounts = getChildAccounts(parentId);
    
    return childAccounts.map(account => {
      const hasChildren = accounts.some(a => a.parentId === account.id);
      const isExpanded = expandedAccounts.has(account.id);

      return (
        <div key={account.id} style={{ marginLeft: `${level * 20}px` }}>
          <div className="flex items-center py-2 hover:bg-gray-50">
            {hasChildren && (
              <button
                onClick={() => toggleAccount(account.id)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <div
              className="flex-1 cursor-pointer"
              onClick={() => onSelectAccount(account)}
            >
              <div className="flex items-center">
                <span className="font-medium">{account.name}</span>
                <span className="ml-2 text-sm text-gray-500">({account.code})</span>
              </div>
              <div className="text-sm text-gray-500">{account.description}</div>
            </div>
            <div className="ml-4">
              <span className={`px-2 py-1 rounded text-sm ${
                account.type === 'asset' ? 'bg-blue-100 text-blue-800' :
                account.type === 'liability' ? 'bg-red-100 text-red-800' :
                account.type === 'equity' ? 'bg-green-100 text-green-800' :
                account.type === 'revenue' ? 'bg-purple-100 text-purple-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {account.type}
              </span>
            </div>
          </div>
          {isExpanded && renderAccountTree(account.id, level + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Chart of Accounts</h2>
      </div>
      <div className="p-4">
        {renderAccountTree(null)}
      </div>
    </div>
  );
};

export default ChartOfAccountsComponent; 