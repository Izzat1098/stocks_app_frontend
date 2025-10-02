import React from 'react';
import Modal from './Modal';
import { StockData } from '../services/stockService';

interface StockDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData | null;
  onEdit?: (stock: StockData) => void;
}

const StockDetailsModal: React.FC<StockDetailsModalProps> = ({
  isOpen,
  onClose,
  stock,
  onEdit
}) => {
  if (!stock) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(stock);
      onClose();
    }
  };

  const footer = (
    <>
      {onEdit && (
        <button onClick={handleEdit} className="btn btn-primary">
          Edit Stock
        </button>
      )}
      <button onClick={onClose} className="btn btn-secondary">
        Close
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Details"
      footer={footer}
      size="medium"
    >
      <div className="stock-details-grid">
        <div className="detail-item">
          <label>Company Name:</label>
          <span>{stock.company_name}</span>
        </div>
        
        <div className="detail-item">
          <label>Stock Ticker:</label>
          <span className="stock-ticker">{stock.ticker}</span>
        </div>
        
        <div className="detail-item">
          <label>Abbreviation:</label>
          <span>{stock.abbreviation || 'N/A'}</span>
        </div>
        
        <div className="detail-item">
          <label>Exchange:</label>
          <span>{stock.exchange_id || 'N/A'}</span>
        </div>
        
        <div className="detail-item">
          <label>Sector:</label>
          <span>{stock.sector || 'N/A'}</span>
        </div>

        <div className="detail-item">
          <label>Country:</label>
          <span>{stock.country || 'N/A'}</span>
        </div>

        <div className="detail-item full-width">
          <label>Description:</label>
          <span>{stock.description || 'N/A'}</span>
        </div>
        
        <div className="detail-item full-width">
          <label>AI Description:</label>
          <span>{stock.ai_description || 'N/A'}</span>
        </div>
      </div>
    </Modal>
  );
};

export default StockDetailsModal;