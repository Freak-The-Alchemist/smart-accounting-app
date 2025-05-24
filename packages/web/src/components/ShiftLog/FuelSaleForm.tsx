import React, { useState } from 'react';
import { FUEL_TYPES } from '@smart-accounting/shared/constants/fuel';
import { FuelSale } from '@smart-accounting/shared/types/petrolStation';
// import { createFuelSale } from '@smart-accounting/shared/services/fuelSalesService'; // TODO: Uncomment and use this service

const FuelSaleForm = () => {
  const [fuelType, setFuelType] = useState<'Petrol' | 'Diesel'>(FUEL_TYPES[0]);
  const [litersSold, setLitersSold] = useState<number>(0);
  const [pricePerLiter, setPricePerLiter] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa' | 'Card'>('Cash');
  const [pumpId, setPumpId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFuelSale: FuelSale = {
      date: new Date().toISOString(), // Placeholder date
      pumpId,
      fuelType,
      litersSold,
      pricePerLiter,
      totalAmount: litersSold * pricePerLiter,
      paymentMethod,
      attendantId: 'current-attendant-id', // TODO: Get actual attendant ID from auth context
    };

    console.log('Logging fuel sale:', newFuelSale);
    // TODO: Call createFuelSale service here

    // Reset form
    setLitersSold(0);
    setPricePerLiter(0);
    setPumpId('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
      <h3 className="text-xl font-semibold mb-4">Log Fuel Sale</h3>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fuelType">
          Fuel Type
        </label>
        <select
          id="fuelType"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value as 'Petrol' | 'Diesel')}
        >
          {FUEL_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pumpId">
          Pump ID
        </label>
        <input
          type="text"
          id="pumpId"
          placeholder="e.g., Pump 1"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={pumpId}
          onChange={(e) => setPumpId(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="litersSold">
          Liters Sold
        </label>
        <input
          type="number"
          id="litersSold"
          placeholder="0"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={litersSold}
          onChange={(e) => setLitersSold(Number(e.target.value))}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pricePerLiter">
          Price Per Liter
        </label>
        <input
          type="number"
          id="pricePerLiter"
          placeholder="0"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={pricePerLiter}
          onChange={(e) => setPricePerLiter(Number(e.target.value))}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentMethod">
          Payment Method
        </label>
        <select
          id="paymentMethod"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'M-Pesa' | 'Card')}
        >
          <option value="Cash">Cash</option>
          <option value="M-Pesa">M-Pesa</option>
          <option value="Card">Card</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Log Sale
        </button>
      </div>
    </form>
  );
};

export default FuelSaleForm; 