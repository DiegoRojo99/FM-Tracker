import React, { useState } from 'react';
import BaseModal from './BaseModal';
import LoadingButton from '../LoadingButton';

interface ConfirmationModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Function to call when user confirms (can be async) */
  onConfirm: () => void | Promise<void>;
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
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsConfirming(false);
    }
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
            disabled={isConfirming}
          >
            {cancelText}
          </button>
          
          <LoadingButton
            onClick={handleConfirm}
            className="flex-1"
            size="lg"
            isLoading={isConfirming}
            loadingText={`${confirmText}ing...`}
          >
            {confirmText}
          </LoadingButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmationModal;
