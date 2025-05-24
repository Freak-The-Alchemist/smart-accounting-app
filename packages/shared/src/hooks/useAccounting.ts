import { useState, useCallback } from 'react';
import { AccountingService } from '../services/AccountingService';
import {
  Account,
  AccountBalance,
  JournalEntry,
  LedgerEntry,
  TrialBalance,
} from '../models/AccountingEntry';
import { useAuth } from './useAuth';

export const useAccounting = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const accountingService = AccountingService.getInstance();

  const createAccount = useCallback(async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await accountingService.createAccount(account);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccount = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await accountingService.getAccount(accountId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get account');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createJournalEntry = useCallback(async (
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    if (!user) {
      throw new Error('User must be authenticated to create journal entries');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await accountingService.createJournalEntry(entry, user.uid);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create journal entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const postJournalEntry = useCallback(async (journalEntryId: string) => {
    setLoading(true);
    setError(null);
    try {
      await accountingService.postJournalEntry(journalEntryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post journal entry');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccountBalance = useCallback(async (
    accountId: string,
    startDate: Date,
    endDate: Date
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await accountingService.getAccountBalance(accountId, startDate, endDate);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get account balance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateTrialBalance = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    setError(null);
    try {
      const result = await accountingService.generateTrialBalance(startDate, endDate);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate trial balance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createAccount,
    getAccount,
    createJournalEntry,
    postJournalEntry,
    getAccountBalance,
    generateTrialBalance,
  };
}; 