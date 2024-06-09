// src/components/UserInfo.js
import React from 'react';

const UserInfo = ({ account, loanAmountWei, startNewLoan }) => {
  return (
    <section className="bg-gray-300 p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-semibold text-gray-800">User Information</h2>
      <p className="mt-4 text-lg text-gray-600">Connected Account: {account}</p>
      <p className="mt-4 text-lg text-gray-600">Loan Amount: {loanAmountWei !== null ? `${loanAmountWei} ETH` : 'Loading...'}</p>
      <hr></hr>
      <h2 mt-2 className="text-2xl font-semibold text-gray-800">User Identification</h2>
      <h2 className="text-xl font-semibold text-gray-800">Step 1</h2>
      <p className="text-lg text-gray-600">Verify Account: {account}</p>
      <button 
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={startNewLoan}
      >
        Verify Account
      </button>

      <h2 className="text-xl font-semibold text-gray-800">Step 2</h2>

      <h2 className="text-xl font-semibold text-gray-800">Step 3</h2>
      
      <h2 className="text-xl font-semibold text-gray-800">Step 4</h2>
      
      <button 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={startNewLoan}
      >
        Start New Loan
      </button>
    </section>
  );
};

export default UserInfo;