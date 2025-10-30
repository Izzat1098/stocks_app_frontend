import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import StockDetailsModal from '../components/StockDetailsModal';
import stockService, { StockData, StockFormData } from '../services/stockService';
import exchangeService, { Exchange } from '../services/exchangeService';
import referenceService from '../services/referenceService';
import { Sectors, Countries, StockPrice } from '../types';
import stockPriceService from '../services/externalService';

// Use StockData from service instead of local interface
type Stock = StockData;

const StockPage: React.FC = () => {
	const [stocks, setStocks] = useState<Stock[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [errorForm, setErrorForm] = useState<string>('');
	const [submitting, setSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string>('');

	// Form data state
	const [formData, setFormData] = useState<StockFormData>({
		ticker: '',
		company_name: '',
		abbreviation: '',
		description: '',
		exchange_id: null,
		sector: '',
		country: '',
		ai_description: '',
	});

	// Edit state
	const [editingStock, setEditingStock] = useState<Stock | null>(null);
	const [isEditing, setIsEditing] = useState(false);

	// Delete confirmation state
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [stockToDelete, setStockToDelete] = useState<number | null>(null);

	// Stock details modal state
	const [showStockDetails, setShowStockDetails] = useState(false);
	const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

	// Exchanges for dropdown
	const [exchanges, setExchanges] = useState<Exchange[]>([]);
	const [exchangesLoading, setExchangesLoading] = useState(false);

	// Stock prices
	// const [stockPrices, setStockPrices] = useState<StockPrice | null>(null);
	const [pricesLoading, setPricesLoading] = useState(false);

	// References for dropdown
	const [sectors, setSectors] = useState<Sectors[]>([]);
	const [countries, setCountries] = useState<Countries[]>([]);

	const fetchStocks = async () => {
    try {
      setLoading(true);
      setError('');
      const stocks = await stockService.getAll();
      setStocks(stocks);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch stocks. Please try again.');

    } finally {
      setLoading(false);
    }
  };

	// Fetch sectors for dropdown
	const fetchSectors = async () => {
		try {
			setExchangesLoading(true);
			const sectors = await referenceService.getSectors();
			setSectors(sectors);

		} catch (err: any) {
			console.error('Failed to fetch sectors:', err);

		} finally {
			setExchangesLoading(false);
		}
	};

	// Fetch countries for dropdown
	const fetchCountries = async () => {
		try {
			setExchangesLoading(true);
			const countries = await referenceService.getCountries();
			setCountries(countries);

		} catch (err: any) {
			console.error('Failed to fetch countries:', err);

		} finally {
			setExchangesLoading(false);
		}
	};

	// Fetch exchanges for dropdown
	const fetchExchanges = async () => {
		try {
			setExchangesLoading(true);
			const exchanges = await exchangeService.getAll();
			setExchanges(exchanges);

		} catch (err: any) {
			console.error('Failed to fetch exchanges:', err);

		} finally {
			setExchangesLoading(false);
		}
	};

	// Fetch prices for all stocks
	const fetchAllStockPrices = async () => {
		try {
			setPricesLoading(true);
			const updatedStocks: StockData[] = [];

			for (let i = 0; i < stocks.length; i++) {
				const stock = stocks[i];
				try {
					// console.log(`Fetching price for ${stock.ticker} ...`);
					const updatedStock: StockData = await stockPriceService.fetchStockPrice(stock);
					updatedStocks.push(updatedStock);

				} catch (err) {
					console.error(`Failed to fetch price for ${stock.ticker}:`, err);
					updatedStocks.push(stock); // Keep original stock if price fetch failed
				}
			}
			// Update the stocks state - this will trigger UI re-render
			setStocks(updatedStocks);

		} catch (err) {
			console.error('Failed to fetch stock prices:', err);

		} finally {
			setPricesLoading(false);
		}
	};

	// Load stocks and exchanges on component mount
	useEffect(() => {
		fetchStocks();
		fetchExchanges();
		fetchSectors();
		fetchCountries();
	}, []);

	useEffect(() => {
			// Only run if stocks are loaded
			if (stocks.length > 0) {
					fetchAllStockPrices();
					
					// Set up interval to run every 5 minutes (300,000 ms)
					const interval = setInterval(() => {
							console.log('Auto-refreshing stock prices...');
							fetchAllStockPrices();
					}, 5 * 60 * 1000); // 5 minutes in milliseconds
					
					// Cleanup interval on component unmount or when stocks change
					return () => {
							clearInterval(interval);
					};
			}
	}, [stocks.length]); // Only depend on stocks.length change, not the entire stocks array

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev, 
			[name]: name === 'exchange_id' ? (value ? parseInt(value) : null) : value
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setErrorForm('');
		setSuccessMessage('');

		try {
			// DB requires these to be non-empty
			if (formData.ticker.trim() === '' || formData.company_name.trim() === '') {
				setErrorForm('Ticker and Company Name are required.');
				return;
			}

			if (isEditing && editingStock) {
				// Update existing stock
				const updatedStock = await stockService.update(editingStock.id!, formData);
				setStocks(prev => prev.map(stock =>
					stock.id === editingStock.id ? updatedStock : stock
				));

				setSuccessMessage('Stock updated successfully.');
				setIsEditing(false);
				setEditingStock(null);

			} else {
				// Create new stock
				const newStock = await stockService.create(formData);
				setStocks(prev => [...prev, newStock]);
				setSuccessMessage('Stock created successfully.');
			}

			setFormData({
				ticker: '',
				company_name: '',
				abbreviation: '',
				description: '',
				exchange_id: null,
				sector: '',
				country: '',
				ai_description: '',
			});

			setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err: any) {
			if (err.response.data.detail[0].msg) {
				const msg = err.response.data.detail[0].msg
				const field = err.response.data.detail[0].loc[1]
				setErrorForm(`Error with field "${field}": ${msg}`);
			}

    } finally {
      setSubmitting(false);
    }
	};

	// Handle edit 
	const handleEdit = (stock: Stock) => {
		setEditingStock(stock);
		setIsEditing(true);
		setFormData({
			ticker: stock.ticker,
			company_name: stock.company_name,
			abbreviation: stock.abbreviation,
			description: stock.description,
			exchange_id: stock.exchange_id,
			sector: stock.sector,
			country: stock.country,
			ai_description: stock.ai_description
		});
		setError('');
		setSuccessMessage('');
	};

	// Handle delete
	const handleDelete = (stockId: number) => {
		setStockToDelete(stockId);
		setShowDeleteDialog(true);
	};

	// Confirm delete
	const confirmDelete = async () => {
		if (!stockToDelete) return;

		try {
			await stockService.delete(stockToDelete);
			setStocks(prev => prev.filter(stock => stock.id !== stockToDelete));
			setSuccessMessage('Stock deleted successfully.');
			setTimeout(() => setSuccessMessage(''), 3000);

		} catch (err: any) {
			setError(err.response?.data?.detail || 'Failed to delete stock. Please try again.');
		
		} finally {
			setShowDeleteDialog(false);
			setStockToDelete(null);
		}
	};

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setStockToDelete(null);
  };

	// Handle stock row click to show details
	const handleStockClick = (stock: Stock) => {
		setSelectedStock(stock);
		setShowStockDetails(true);
	};

	// Close stock details modal
	const closeStockDetails = () => {
		setShowStockDetails(false);
		setSelectedStock(null);
	};

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingStock(null);
    setFormData({
      ticker: '',
      company_name: '',
      abbreviation: '',
			description: '',
      exchange_id: null,
      sector: '',
			country: '',
      ai_description: '',
    });
    setError('');
    setSuccessMessage('');
  };

	return (
		<div className="container">
			<h1>Stocks</h1>

      {/* Stocks List */}
      <div className="card">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
					<h2>Stocks List</h2>
					{stocks.length > 0 && (
						<button 
							onClick={fetchAllStockPrices}
							disabled={pricesLoading}
							className="btn btn-secondary"
							title="Refresh stock prices"
						>
							{pricesLoading ? 'Refreshing...' : '🔄 Refresh Prices'}
						</button>
					)}
				</div>

				{loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading stocks...
          </div>
        )}

        {error && !loading && (
          <div className="error" style={{ textAlign: 'center', padding: '2rem' }}>
            {error}
            <br />
            <button 
              onClick={fetchStocks} 
              className="btn btn-primary" 
              style={{ marginTop: '1rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && stocks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No stocks found. Add some stocks using the form below.
          </div>
        )}

        {!loading && !error && stocks.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Company Name</th>
								<th>Stock Ticker</th>
                <th>Abbreviation</th>
                <th>Sector</th>
								<th>Current Price</th>
								<th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.id || `${stock.ticker}-${stock.company_name}`} 
                    className="clickable-row"
                    onClick={() => handleStockClick(stock)}
                    title="Click to view details">
                  <td>{stock.company_name}</td>
                  <td><strong>{stock.ticker}</strong></td>
                  <td>{stock.abbreviation}</td>
                  <td>{stock.sector}</td>
                  <td>
                    {pricesLoading ? (
                      <span className="loading-price">Loading...</span>
                    ) : stock.stockPrice ? (
                      <span className="stock-price">
                        ${stock.stockPrice.currentPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="price-unavailable">N/A</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleEdit(stock);
                        }}
                        className="btn-icon btn-edit"
                        title="Edit Stock"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          handleDelete(stock.id!);
                        }}
                        className="btn-icon btn-delete"
                        title="Delete Stock"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* Add New Exchange Form */}
      <div className="card">
        <h2 className="card-header">
          {isEditing ? 'Edit Stock' : 'Add New Stock'}
        </h2>

				<form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="company_name">Company Name</label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
							maxLength={60}
              disabled={submitting}
              placeholder="e.g., Apple Inc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="ticker">Stock Ticker</label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleChange}
              required
              disabled={submitting}
              placeholder="e.g., AAPL"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="abbreviation">Abbreviation</label>
            <input
              type="text"
              id="abbreviation"
              name="abbreviation"
              value={formData.abbreviation}
              onChange={handleChange}
              disabled={submitting}
              placeholder="e.g., APPLE"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="exchange_id">Stock Exchange</label>
            <select
              id="exchange_id"
              name="exchange_id"
              value={formData.exchange_id || ''}
              onChange={handleChange}
              disabled={submitting || exchangesLoading}
            >
              <option value="">Select an exchange...</option>
              {exchanges.map((exchange) => (
                <option key={exchange.id} value={exchange.id}>
                  {exchange.name} ({exchange.abbreviation})
                </option>
              ))}
            </select>
            {exchangesLoading && (
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Loading exchanges...
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={submitting}
              placeholder="e.g., NYSE"
							rows={4}
							style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sector">Sector</label>
            <select
              id="sector"
              name="sector"
              value={formData.sector || ''}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="">Select a sector...</option>
              {sectors.map((sector) => (
                <option key={sector.name} value={sector.name}>
                  {sector.name}
                </option>
              ))}
						</select>
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              name="country"
              value={formData.country || ''}
              onChange={handleChange}
              disabled={submitting}
            >
              <option value="">Select a country...</option>
              {countries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
						</select>
          </div>

					{errorForm && <div className="error">{errorForm}</div>}
					{successMessage && <div className="success">{successMessage}</div>}

          <div className="form-buttons" style={{ marginTop: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting 
                ? (isEditing ? 'Updating...' : 'Adding...') 
                : (isEditing ? 'Update Stock' : 'Add Stock')
              }
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                disabled={submitting}
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Stock Details Modal */}
      <StockDetailsModal
        isOpen={showStockDetails}
        onClose={closeStockDetails}
        stock={selectedStock}
        exchange={exchanges.find((exchange) => exchange.id === selectedStock?.exchange_id) ?? null}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Stock"
        message="Are you sure you want to delete this stock? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />

		</div>
	);
};

export default StockPage;
