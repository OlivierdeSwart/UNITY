// src/components/Navigation.js
import React from "react";
import logo from "../logo.png"; // Ensure you have a logo image in the specified path
import Button from "./Button";
const Navigation = ({connectWallet, isButtonDisabled}) => {
  return (
    <nav className="fixed top-0 left-0 right-0 p-4 flex items-center justify-between bg-gray-800 border-b border-gray-700 z-50">
      <div className="flex items-center">
        <img
          alt="logo"
          src={logo}
          width="40"
          height="40"
          className="inline-block mx-3"
        />
        <a href="#" className="text-2xl font-bold text-white">
          BinaryBit Staking
        </a>
      </div>
      <div className="flex space-x-4">
        <Button
          color="bg-blue-500 text-white"
          hoverColor="hover:bg-blue-700"
          text="Wallet"
          onClick={connectWallet}
          disabled={isButtonDisabled}
        />
      </div>
    </nav>
  );
};

export default Navigation;
