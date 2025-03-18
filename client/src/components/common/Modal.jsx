import React, { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children, type = 'info', confirmText = 'OK', onConfirm, cancelText, onCancel }) => {
  const modalRef = useRef(null);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Determine the header and icon based on the type
  const getHeaderStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgClass: 'bg-green-50',
          iconBgClass: 'bg-green-100',
          iconClass: 'text-green-600',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'error':
        return {
          bgClass: 'bg-red-50',
          iconBgClass: 'bg-red-100',
          iconClass: 'text-red-600',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'warning':
        return {
          bgClass: 'bg-yellow-50',
          iconBgClass: 'bg-yellow-100',
          iconClass: 'text-yellow-600',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'info':
      default:
        return {
          bgClass: 'bg-blue-50',
          iconBgClass: 'bg-blue-100',
          iconClass: 'text-primary-600',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };
  
  const { bgClass, iconBgClass, iconClass, icon } = getHeaderStyles();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden animate-slideIn"
      >
        {/* Header */}
        <div className={`${bgClass} p-4 border-b`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-md ${iconBgClass} mr-3`}>
              <div className={iconClass}>
                {icon}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-dark-600">{title}</h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="text-dark-600 whitespace-pre-line">
            {children}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              {cancelText || 'Cancel'}
            </button>
          )}
          <button
            type="button"
            className={`btn ${type === 'error' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm || onClose}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;