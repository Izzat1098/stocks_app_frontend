import React from 'react';
import Modal from './Modal';
import { StockData } from '../services/stockService';
import { Exchange } from '../services/exchangeService';

interface StockDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData | null;
  exchange: Exchange | null;
  onEdit?: (stock: StockData) => void;
  onDelete?: (stockId: number) => void;
}

const StockDetailsModal: React.FC<StockDetailsModalProps> = ({
  isOpen,
  onClose,
  stock,
  exchange,
  onEdit,
  onDelete
}) => {
  if (!stock) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(stock);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && stock.id !== undefined) {
      onDelete(stock.id);
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
      {onDelete && (
        <button onClick={handleDelete} className="btn btn-danger">
          Delete Stock
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
      title={`Stock Details - ${stock.ticker} | ${stock.abbreviation}`}
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
          <span>{exchange ? `${exchange.name} (${exchange.abbreviation})` : 'N/A'}</span>
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