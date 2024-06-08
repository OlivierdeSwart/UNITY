// src/components/UserInfo.js
import React from 'react';

const UserInfo = ({ account, loanAmountWei }) => {
  return (
    <section className="bg-gray-300 p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-semibold text-gray-800">User Information</h2>
      <p className="mt-4 text-lg text-gray-600">Connected Account: {account}</p>
      <p className="mt-4 text-lg text-gray-600">Loan Amount: {loanAmountWei !== null ? `${loanAmountWei} ETH` : 'Loading...'}</p>
    </section>
  );
};

export default UserInfo;