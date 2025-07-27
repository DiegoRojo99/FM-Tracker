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
  maxHeight = 'max-h-[80vh]',
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
            bg-[var(--color-dark)] 
            border-2 border-[var(--color-primary)]
            p-6 rounded-xl shadow-2xl relative
            text-white
            ${panelClassName}
          `}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 z-10"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Title */}
          <Dialog.Title className="text-2xl font-bold mb-6 text-white pr-8">
            {title}
          </Dialog.Title>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-8rem)]">
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default BaseModal;
