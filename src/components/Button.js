// src/components/Button.js
import React from 'react';

const Button = ({text , onClick, disabled}) => {
    return (
      <button class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 
      border-blue-700 hover:border-blue-500 rounded" onClick={onClick} disabled={disabled}>
        {text}
      </button>
    );
};

export default Button;