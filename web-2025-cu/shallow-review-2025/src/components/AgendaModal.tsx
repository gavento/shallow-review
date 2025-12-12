import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { X } from 'lucide-react';
import type { DocumentItem } from '../types';
import { ContentRenderer } from './ContentRenderer';
import ReactMarkdown from 'react-markdown';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DocumentItem | null;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, onClose, item }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!item) return null;

  return (
    <div 
      className={classNames('modal-overlay', { open: isOpen })}
      onClick={handleBackdropClick}
    >
      <div className="modal-content" ref={modalRef}>
        <button className="close-button" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="modal-header">
          <h2>{item.name}</h2>
          {item.item_type === 'section' && (
             <div className="meta-summary">Section Overview</div>
          )}
        </div>

        <div className="modal-body">
          {item.content && (
            <div className="content-section">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>
          )}

          {item.agenda_attributes && (
            <ContentRenderer attributes={item.agenda_attributes} />
          )}
        </div>
      </div>
    </div>
  );
};

