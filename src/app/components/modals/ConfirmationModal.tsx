import React from 'react';
import BaseModal from './BaseModal';

interface ConfirmationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Function to call when user confirms */
  onConfirm: () => void;
  /** Modal title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Text for the confirm button (default: "Confirm") */
  confirmText?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelText?: string;
  /** Whether the action is destructive (shows red confirm button) */
  destructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseModal 
      open={open} 
      onClose={onClose} 
      title={title}
      maxWidth="max-w-md"
      showCloseButton={false}
    >
      <div className="space-y-6">
        <p className="text-gray-200 text-center leading-relaxed">
          {message}
        </p>
        
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-[var(--color-darker)] text-gray-300 font-medium py-3 px-6 rounded-lg border-2 border-[var(--color-primary)] hover:border-[var(--color-accent)] hover:text-white transition-all duration-200"
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            className={`flex-1 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg ${
              destructive
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] hover:from-[var(--color-highlight)] hover:to-[var(--color-accent)] text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmationModal;
