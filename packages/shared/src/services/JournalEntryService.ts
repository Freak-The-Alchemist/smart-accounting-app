import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { JournalEntry, JournalEntryLine } from '../models/JournalEntry';
import { Account } from '../models/Account';
import { validate } from '../utils/validation';

class JournalEntryService {
  private readonly collection = 'journalEntries';
  private readonly accountsCollection = 'accounts';

  async create(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> {
    // Validate the entry
    validate(entry, journalEntryValidationRules);

    // Ensure debits equal credits
    const totalDebits = entry.lines
      .filter(line => line.type === 'debit')
      .reduce((sum, line) => sum + line.amount, 0);
    
    const totalCredits = entry.lines
      .filter(line => line.type === 'credit')
      .reduce((sum, line) => sum + line.amount, 0);
    
    if (totalDebits !== totalCredits) {
      throw new Error('Total debits must equal total credits');
    }

    // Create the entry in a transaction
    return runTransaction(db, async (transaction) => {
      // Add the journal entry
      const entryRef = doc(collection(db, this.collection));
      const now = Timestamp.now();
      
      const newEntry: JournalEntry = {
        ...entry,
        id: entryRef.id,
        createdAt: now,
        updatedAt: now,
        totalAmount: totalDebits // or totalCredits, they're equal
      };

      await transaction.set(entryRef, newEntry);

      // If the entry is posted, update account balances
      if (entry.status === 'posted') {
        for (const line of entry.lines) {
          const accountRef = doc(db, this.accountsCollection, line.accountId);
          const accountDoc = await transaction.get(accountRef);
          
          if (!accountDoc.exists()) {
            throw new Error(`Account ${line.accountId} not found`);
          }

          const account = accountDoc.data() as Account;
          const balanceChange = line.type === 'debit' ? line.amount : -line.amount;
          
          await transaction.update(accountRef, {
            balance: account.balance + balanceChange,
            updatedAt: now
          });
        }
      }

      return newEntry;
    });
  }

  async getById(id: string): Promise<JournalEntry | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const entry = docSnap.data() as JournalEntry;
    
    // Populate account details for each line
    const populatedLines = await Promise.all(
      entry.lines.map(async (line) => {
        const accountDoc = await getDoc(doc(db, this.accountsCollection, line.accountId));
        return {
          ...line,
          account: accountDoc.exists() ? accountDoc.data() as Account : undefined
        };
      })
    );

    return {
      ...entry,
      lines: populatedLines
    };
  }

  async update(id: string, updates: Partial<JournalEntry>): Promise<void> {
    const entryRef = doc(db, this.collection, id);
    const entryDoc = await getDoc(entryRef);
    
    if (!entryDoc.exists()) {
      throw new Error('Journal entry not found');
    }

    const currentEntry = entryDoc.data() as JournalEntry;

    // If the entry is already posted, we can't modify it
    if (currentEntry.status === 'posted') {
      throw new Error('Cannot modify a posted journal entry');
    }

    // Update the entry
    await updateDoc(entryRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async void(id: string): Promise<void> {
    return runTransaction(db, async (transaction) => {
      const entryRef = doc(db, this.collection, id);
      const entryDoc = await transaction.get(entryRef);
      
      if (!entryDoc.exists()) {
        throw new Error('Journal entry not found');
      }

      const entry = entryDoc.data() as JournalEntry;

      // If the entry is already void, do nothing
      if (entry.status === 'void') {
        return;
      }

      // If the entry was posted, reverse the account balances
      if (entry.status === 'posted') {
        for (const line of entry.lines) {
          const accountRef = doc(db, this.accountsCollection, line.accountId);
          const accountDoc = await transaction.get(accountRef);
          
          if (!accountDoc.exists()) {
            throw new Error(`Account ${line.accountId} not found`);
          }

          const account = accountDoc.data() as Account;
          const balanceChange = line.type === 'debit' ? -line.amount : line.amount;
          
          await transaction.update(accountRef, {
            balance: account.balance + balanceChange,
            updatedAt: Timestamp.now()
          });
        }
      }

      // Mark the entry as void
      await transaction.update(entryRef, {
        status: 'void',
        updatedAt: Timestamp.now()
      });
    });
  }

  async list(filters: {
    startDate?: Date;
    endDate?: Date;
    status?: JournalEntry['status'];
    type?: JournalEntry['type'];
  } = {}): Promise<JournalEntry[]> {
    let q = collection(db, this.collection);

    // Apply filters
    if (filters.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as JournalEntry);
  }
}

export const journalEntryService = new JournalEntryService(); 