import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Report {
  id: string;
  title: string;
  description: string;
  type: string;
  generatedAt: string;
  data: any;
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (
    startDate: Date,
    endDate: Date,
    reportType: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const reportsRef = collection(db, 'reports');
      let q = query(
        reportsRef,
        where('generatedAt', '>=', startDate.toISOString()),
        where('generatedAt', '<=', endDate.toISOString()),
        orderBy('generatedAt', 'desc')
      );

      if (reportType !== 'all') {
        q = query(q, where('type', '==', reportType));
      }

      const querySnapshot = await getDocs(q);
      const reportsData = querySnapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];

      setReports(reportsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reports,
    loading,
    error,
    fetchReports
  };
}; 