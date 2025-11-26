import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium'
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'modal-small';
      case 'large': return 'modal-large';
      default: return 'modal-medium';
    }
  };

  return (
    <div 
      className="modal-overlay-active" 
      onClick={handleOverlayClick}
    >
      <div 
        className={`modal-overlay-content ${getSizeClass()}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-overlay-header">
          <h2>{title}</h2>
          <button 
            className="modal-overlay-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-overlay-body">
          {children}
        </div>
        
        {footer && (
          <div className="modal-overlay-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;