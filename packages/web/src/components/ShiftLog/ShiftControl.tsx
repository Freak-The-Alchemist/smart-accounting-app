import React from 'react';

const ShiftControl = () => {
  const handleStartShift = () => {
    console.log('Starting shift...');
    // TODO: Implement logic to start a new shift (call shared service)
  };

  const handleEndShift = () => {
    console.log('Ending shift...');
    // TODO: Implement logic to end the current shift (call shared service)
  };

  return (
    <div className="flex space-x-4">
      <button
        onClick={handleStartShift}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Start Shift
      </button>
      <button
        onClick={handleEndShift}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        End Shift
      </button>
    </div>
  );
};

export default ShiftControl; 