import React, { useState } from 'react';
import BaseModal from './BaseModal';
import GradientButton from '../GradientButton';
import Image from 'next/image';

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
        <Image
          src="/circle-alert.svg"
          alt="Alert Icon"
          width={96}
          height={96}
          className="mx-auto white-image"
        />

        <p className="text-center leading-relaxed text-[var(--color-text-muted)]">
          {message}
        </p>
        
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-6 py-3 font-medium text-gray-200 transition hover:border-[var(--color-accent)] hover:text-white sm:flex-1"
            disabled={isConfirming}
          >
            {cancelText}
          </button>

          <GradientButton
            onClick={handleConfirm}
            className="w-full sm:flex-1"
            size="lg"
            disabled={isConfirming}
            destructive={destructive}
          >
            {isConfirming ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {confirmText.endsWith('e')
                  ? `${confirmText.slice(0, -1)}ing...`
                  : `${confirmText}ing...`}
              </>
            ) : (
              confirmText
            )}
          </GradientButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmationModal;
