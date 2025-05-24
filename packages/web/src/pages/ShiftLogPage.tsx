import React from 'react';
import ShiftControl from '../components/ShiftLog/ShiftControl';
import FuelSaleForm from '../components/ShiftLog/FuelSaleForm';

const ShiftLogPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Shift Log</h2>
      <div className="mb-8">
        <ShiftControl />
      </div>
      <div>
        <FuelSaleForm />
      </div>
      {/* Future content for displaying shift history goes here */}
    </div>
  );
};

export default ShiftLogPage; 