// src/components/HeroSection.js
import React from 'react';
import downArrow from '../down.png';

const HeroSection = () => {
    const handleScroll = () => {
        document.getElementById('content').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="h-screen flex flex-col items-center justify-center bg-gradient-to-r from-gray-700 via-gray-900 to-black text-white relative" onClick={handleScroll}>
            <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">Welcome to BinaryBit Staking</h1>
                <p className="text-2xl">Your gateway to seamless and secure staking.</p>
            </div>
            <div className="absolute bottom-4 cursor-pointer">
                <img
                    src={downArrow}
                    alt="Scroll Down"
                    className="w-12 h-12"
                />
            </div>
        </section>
    );
};

export default HeroSection;