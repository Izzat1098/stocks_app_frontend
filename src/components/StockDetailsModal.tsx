import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { StockData } from '../services/stockService';
import { Exchange } from '../services/exchangeService';
import { aiService } from '../services/api';

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
  const navigate = useNavigate();
  
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorAIDesc, setErrorAIDesc] = useState<string>('');
  // const [localStock, setLocalStock] = useState<StockData | null>(stock);

  useEffect(() => {
    if (stock) {
      setAiDescription(stock.ai_description || '');
      setIsGenerating(false);
      setErrorAIDesc('');
    }
  }, [stock]);

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

  const handleViewFinancials = () => {
    if (stock.id !== undefined) {
      navigate('/financials', { state: { stockId: stock.id } });
      onClose();
    }
  };

  const handleGenerateAI = async () => {
    try {
      setIsGenerating(true);
      const updatedStock: StockData = await aiService.generateDescription(stock);

      setAiDescription(updatedStock.ai_description);
      // setLocalStock(updatedStock);

    } catch (error: any) {
      console.error('Error generating AI description:', error);
      
      if (error.response.status === 404) {
        setErrorAIDesc(`There is no stock with name "${stock.company_name}" listed on this exchange. Please recheck the stock details.`);
      } else {
        setErrorAIDesc('Failed to generate AI description. Please try again later.');
      }

    } finally {
      setIsGenerating(false);
    }
  };

  const footer = (
    <div className="modal-stock-footer">
      <button onClick={handleViewFinancials} className="modal-btn">
        📊 View Financials
      </button>
      {onEdit && (
        <button onClick={handleEdit} className="modal-btn">
          Edit Stock
        </button>
      )}
      {onDelete && (
        <button onClick={handleDelete} className="modal-btn modal-btn-red">
          Delete Stock
        </button>
      )}
      <button onClick={onClose} className="modal-btn modal-btn-gray">
        Close
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stock Details - ${stock.ticker} | ${stock.abbreviation}`}
      footer={footer}
      size="large"
    >
      <div className="modal-stocks-details-items">
        <div className="modal-stock-detail">
          <label>Company Name:</label>
          <span>{stock.company_name}</span>
        </div>
        
        <div className="modal-stock-detail">
          <label>Stock Ticker:</label>
          <span>{stock.ticker}</span>
        </div>
        
        <div className="modal-stock-detail">
          <label>Abbreviation:</label>
          <span>{stock.abbreviation || 'N/A'}</span>
        </div>
        
        <div className="modal-stock-detail">
          <label>Exchange:</label>
          <span>{exchange ? `${exchange.name} (${exchange.abbreviation})` : 'N/A'}</span>
        </div>
        
        <div className="modal-stock-detail">
          <label>Sector:</label>
          <span>{stock.sector || 'N/A'}</span>
        </div>

        <div className="modal-stock-detail">
          <label>Country:</label>
          <span>{stock.country || 'N/A'}</span>
        </div>

        <div className="modal-stock-detail full-width">
          <label>Description:</label>
          <span>{stock.description || 'N/A'}</span>
        </div>
        
        <div className="modal-stock-detail full-width">
          <div className="modal-stock-detail-ai-header">
            <label>AI Description:</label>
            <button 
              onClick={handleGenerateAI}
              className="link-btn link-btn-modal-stock-ai"
              title="Generate AI description"
              disabled={isGenerating}
            >
              {isGenerating 
                ? '⏳ Generating...' 
                : '🤖 Generate'
              }
            </button>
          </div>

          {errorAIDesc && (
            <span className="error">{errorAIDesc}</span>
          )}
          {!errorAIDesc &&(
            <span>{isGenerating ? 'Generating...' : (aiDescription || 'N/A')}</span>
          )}
          
        </div>
      </div>
    </Modal>
  );
};

export default StockDetailsModal;