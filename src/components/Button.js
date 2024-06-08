// src/components/Button.js
import React from 'react';

const Button = ({ color, hoverColor, text }) => {
    return (
        <button className={`px-4 py-2 rounded ${color} ${hoverColor} transition duration-300`}>
            {text}
        </button>
    );
};

export default Button;