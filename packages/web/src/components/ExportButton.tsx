import React, { useState } from 'react';
import { ExportDialog } from './ExportDialog';
import { Transaction } from '../../../shared/src/models/Transaction';

interface ExportButtonProps {
  transactions: Transaction[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ transactions }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Export Data
      </button>

      {isDialogOpen && (
        <ExportDialog
          transactions={transactions}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
}; 