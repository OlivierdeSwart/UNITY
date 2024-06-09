// src/components/ProgressBar.js
import React from 'react';

const ProgressBar = ({ loanAmountWithInterestWei, repaidAmountWei }) => {
  const loanAmount = parseFloat(loanAmountWithInterestWei) || 0;
  const repaidAmount = parseFloat(repaidAmountWei) || 0;
  const progress = loanAmount > 0 ? (repaidAmount / loanAmount) * 100 : 0;

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div
        className="bg-blue-600 h-full rounded-full transition-width duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;