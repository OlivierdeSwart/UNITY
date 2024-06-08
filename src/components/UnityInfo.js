// src/components/UnityInfo.js
import React from 'react';

const UnityInfo = ({ totalTokensLended }) => {
  return (
    <section className="bg-gray-300 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800">Unity Lending Information</h2>
      <p className="mt-4 text-lg text-gray-600">Unity totalTokensLended: {totalTokensLended !== null ? totalTokensLended : 'Loading...'}</p>
    </section>
  );
};

export default UnityInfo;