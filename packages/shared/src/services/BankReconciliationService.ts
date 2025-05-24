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
import { BankReconciliation, BankStatementLine } from '../models/BankReconciliation';
import { Account } from '../models/Account';
import { JournalEntry } from '../models/JournalEntry';
import { validate } from '../utils/validation';
import { bankReconciliationValidationRules } from '../models/BankReconciliation';

class BankReconciliationService {
  private readonly collection = 'bankReconciliations';
  private readonly accountsCollection = 'accounts';
  private readonly journalEntriesCollection = 'journalEntries';

  async create(reconciliation: Omit<BankReconciliation, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankReconciliation> {
    // Validate the reconciliation
    validate(reconciliation, bankReconciliationValidationRules);

    // Create the reconciliation in a transaction
    return runTransaction(db, async (transaction) => {
      const reconciliationRef = doc(collection(db, this.collection));
      const now = Timestamp.now();
      
      const newReconciliation: BankReconciliation = {
        ...reconciliation,
        id: reconciliationRef.id,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        reconciliationSummary: this.calculateReconciliationSummary(reconciliation.statementLines)
      };

      await transaction.set(reconciliationRef, newReconciliation);
      return newReconciliation;
    });
  }

  async getById(id: string): Promise<BankReconciliation | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const reconciliation = docSnap.data() as BankReconciliation;
    
    // Populate account details
    const accountDoc = await getDoc(doc(db, this.accountsCollection, reconciliation.accountId));
    if (accountDoc.exists()) {
      reconciliation.account = accountDoc.data() as Account;
    }

    return reconciliation;
  }

  async update(id: string, updates: Partial<BankReconciliation>): Promise<void> {
    const reconciliationRef = doc(db, this.collection, id);
    const reconciliationDoc = await getDoc(reconciliationRef);
    
    if (!reconciliationDoc.exists()) {
      throw new Error('Bank reconciliation not found');
    }

    const currentReconciliation = reconciliationDoc.data() as BankReconciliation;

    // If the reconciliation is completed, we can't modify it
    if (currentReconciliation.status === 'completed') {
      throw new Error('Cannot modify a completed bank reconciliation');
    }

    // If statement lines are being updated, recalculate the summary
    if (updates.statementLines) {
      updates.reconciliationSummary = this.calculateReconciliationSummary(updates.statementLines);
    }

    // Update the reconciliation
    await updateDoc(reconciliationRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async complete(id: string): Promise<void> {
    return runTransaction(db, async (transaction) => {
      const reconciliationRef = doc(db, this.collection, id);
      const reconciliationDoc = await transaction.get(reconciliationRef);
      
      if (!reconciliationDoc.exists()) {
        throw new Error('Bank reconciliation not found');
      }

      const reconciliation = reconciliationDoc.data() as BankReconciliation;

      // Verify that all lines are matched
      const unmatchedLines = reconciliation.statementLines.filter(line => line.status === 'unmatched');
      if (unmatchedLines.length > 0) {
        throw new Error('Cannot complete reconciliation with unmatched lines');
      }

      // Mark the reconciliation as completed
      await transaction.update(reconciliationRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });
  }

  async matchStatementLine(
    reconciliationId: string,
    statementLineId: string,
    journalEntryId: string
  ): Promise<void> {
    return runTransaction(db, async (transaction) => {
      const reconciliationRef = doc(db, this.collection, reconciliationId);
      const reconciliationDoc = await transaction.get(reconciliationRef);
      
      if (!reconciliationDoc.exists()) {
        throw new Error('Bank reconciliation not found');
      }

      const reconciliation = reconciliationDoc.data() as BankReconciliation;
      const statementLine = reconciliation.statementLines.find(line => line.reference === statementLineId);
      
      if (!statementLine) {
        throw new Error('Statement line not found');
      }

      // Verify the journal entry exists
      const entryDoc = await transaction.get(doc(db, this.journalEntriesCollection, journalEntryId));
      if (!entryDoc.exists()) {
        throw new Error('Journal entry not found');
      }

      // Update the statement line
      statementLine.status = 'matched';
      statementLine.matchedEntryId = journalEntryId;

      // Update the reconciliation
      await transaction.update(reconciliationRef, {
        statementLines: reconciliation.statementLines,
        updatedAt: Timestamp.now()
      });
    });
  }

  private calculateReconciliationSummary(lines: BankStatementLine[]): BankReconciliation['reconciliationSummary'] {
    return {
      totalCredits: lines
        .filter(line => line.type === 'credit')
        .reduce((sum, line) => sum + line.amount, 0),
      totalDebits: lines
        .filter(line => line.type === 'debit')
        .reduce((sum, line) => sum + line.amount, 0),
      outstandingDeposits: lines
        .filter(line => line.type === 'credit' && line.status === 'unmatched')
        .reduce((sum, line) => sum + line.amount, 0),
      outstandingChecks: lines
        .filter(line => line.type === 'debit' && line.status === 'unmatched')
        .reduce((sum, line) => sum + line.amount, 0),
      bankCharges: lines
        .filter(line => line.type === 'debit' && line.description.toLowerCase().includes('charge'))
        .reduce((sum, line) => sum + line.amount, 0),
      interestEarned: lines
        .filter(line => line.type === 'credit' && line.description.toLowerCase().includes('interest'))
        .reduce((sum, line) => sum + line.amount, 0),
      adjustments: 0 // This would be calculated based on specific adjustment entries
    };
  }
}

export const bankReconciliationService = new BankReconciliationService(); 