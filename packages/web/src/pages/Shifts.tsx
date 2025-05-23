import React, { useState, useEffect } from 'react';
import { Shift } from '../../../shared/src/types/petrolStation';
import { getAllShifts, createShift, updateShift, deleteShift } from '../../../shared/src/services/shiftService';

const Shifts: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Shift>>({
    openingCash: 0,
    status: 'active',
  });

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = () => {
    try {
      const shiftList = getAllShifts();
      setShifts(shiftList);
    } catch (err) {
      setError('Failed to load shifts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<Shift>) => ({
      ...prev,
      [name]: name === 'openingCash' ? parseFloat(value) : value
    }));
  };

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newShift: Shift = {
        id: Date.now().toString(), // Temporary ID generation
        stationId: '1', // Temporary station ID
        userId: '1', // Temporary user ID
        ...formData as Omit<Shift, 'id' | 'stationId' | 'userId'>,
        startTime: new Date(),
        status: 'active',
      };
      createShift(newShift);
      loadShifts();
      setFormData({
        openingCash: 0,
        status: 'active',
      });
    } catch (err) {
      setError('Failed to start shift');
      console.error(err);
    }
  };

  const handleEndShift = (shiftId: string, closingCash: number) => {
    try {
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) throw new Error('Shift not found');

      updateShift(shiftId, {
        endTime: new Date(),
        status: 'completed',
        closingCash,
      });
      loadShifts();
    } catch (err) {
      setError('Failed to end shift');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Shifts</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Start New Shift Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Start New Shift</h2>
        <form onSubmit={handleStartShift} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Opening Cash</label>
            <input
              type="number"
              name="openingCash"
              value={formData.openingCash}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Start Shift
            </button>
          </div>
        </form>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Cash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Cash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(shift.startTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {shift.endTime ? new Date(shift.endTime).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    shift.status === 'active' ? 'bg-green-100 text-green-800' :
                    shift.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {shift.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${shift.openingCash.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {shift.closingCash ? `$${shift.closingCash.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {shift.status === 'active' && (
                    <button
                      onClick={() => {
                        const closingCash = prompt('Enter closing cash amount:');
                        if (closingCash) {
                          handleEndShift(shift.id, parseFloat(closingCash));
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      End Shift
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Shifts; 