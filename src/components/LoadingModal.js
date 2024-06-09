// src/components/LoadingModal.js
import React from 'react';
import Modal from 'react-modal';
import { FaSpinner } from 'react-icons/fa';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    padding: '40px',
  },
};

Modal.setAppElement('#root');

const LoadingModal = ({ modalIsOpen, closeModal, status }) => {
  let content;
  if (status === 'loading') {
    content = (
      <div>
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <h2 className="mt-4 text-xl">Connecting to Wallet...</h2>
      </div>
    );
  } else if (status === 'connected') {
    content = <h2 className="mt-4 text-xl text-green-600">Connected!</h2>;
  } else if (status === 'alreadyProcessing') {
    content = <h2 className="mt-4 text-xl text-yellow-600">Already processing. Please wait...</h2>;
  } else if (status === 'error') {
    content = <h2 className="mt-4 text-xl text-red-600">Error connecting to wallet. Please try again.</h2>;
  }

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Loading Modal"
    >
      {content}
    </Modal>
  );
};

export default LoadingModal;