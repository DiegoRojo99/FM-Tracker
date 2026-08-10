import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface BaseModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to call when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional custom width class (default: max-w-2xl) */
  maxWidth?: string;
  /** Optional custom max height class (default: max-h-[80vh]) */
  maxHeight?: string;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
  /** Custom className for the panel */
  panelClassName?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  maxHeight = 'max-h-[90vh]',
  showCloseButton = true,
  panelClassName = '',
}) => {
  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      className="fixed z-50 inset-0 overflow-y-auto"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel 
          className={`
            w-full ${maxWidth} ${maxHeight} h-fit my-auto 
            bg-[var(--color-dark)]/95 backdrop-blur-sm
            border border-[var(--color-surface-border)]
            rounded-2xl shadow-2xl relative
            text-white
            ${panelClassName}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-surface-border)]">
            <Dialog.Title className="text-lg font-black text-white">
              {title}
            </Dialog.Title>
            
            {showCloseButton && (
              <button
                className="rounded-lg p-1 text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-white"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal content */}
          <div className="overflow-y-auto max-h-[calc(80vh-6rem)] px-6 py-5">
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default BaseModal;
