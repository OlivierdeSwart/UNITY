// src/components/Footer.js
import React from 'react';

const Footer = ({ opacity }) => {
    return (
        <footer className="w-full py-4 bg-gray-800 text-white text-left fixed bottom-0 left-0" style={{ opacity }}>
            <div className="container mx-auto px-4">
                <p className="text-sm">@Unity 2024</p>
            </div>
        </footer>
    );
};

export default Footer;