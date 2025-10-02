import React, { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import { Stock, Holding } from '../types';

const StocksOverviewPage: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stocks' | 'holdings'>('stocks');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksData, holdingsData] = await Promise.all([
        stockService.getStocks(),
        stockService.getHoldings(),
      ]);
      setStocks(stocksData);
      setHoldings(holdingsData);
    } catch (err: any) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getTotalPortfolioValue = () => {
    return holdings.reduce((total, holding) => total + holding.total_value, 0);
  };

  const getTotalGainLoss = () => {
    return holdings.reduce((total, holding) => total + holding.gain_loss, 0);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="error" style={{ textAlign: 'center', padding: '2rem' }}>
            {error}
            <br />
            <button 
              onClick={fetchData} 
              className="btn btn-primary" 
              style={{ marginTop: '1rem' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Stock Investment Tracker</h1>
      
      {holdings.length > 0 && (
        <div className="card">
          <h2>Portfolio Summary</h2>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
            <div>
              <strong>Total Value: {formatCurrency(getTotalPortfolioValue())}</strong>
            </div>
            <div>
              <strong 
                style={{ 
                  color: getTotalGainLoss() >= 0 ? '#28a745' : '#dc3545' 
                }}
              >
                Total Gain/Loss: {formatCurrency(getTotalGainLoss())}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <button
            className={`btn ${activeTab === 'stocks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stocks')}
            style={{ marginRight: '10px' }}
          >
            All Stocks
          </button>
          <button
            className={`btn ${activeTab === 'holdings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('holdings')}
          >
            My Holdings
          </button>
        </div>

        {activeTab === 'stocks' && (
          <div>
            <h2>Available Stocks</h2>
            {stocks.length === 0 ? (
              <p>No stocks available.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Current Price</th>
                    <th>Change</th>
                    <th>Change %</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr key={stock.id}>
                      <td><strong>{stock.symbol}</strong></td>
                      <td>{stock.name}</td>
                      <td>{formatCurrency(stock.current_price)}</td>
                      <td 
                        style={{ 
                          color: stock.change >= 0 ? '#28a745' : '#dc3545' 
                        }}
                      >
                        {formatCurrency(stock.change)}
                      </td>
                      <td 
                        style={{ 
                          color: stock.change_percent >= 0 ? '#28a745' : '#dc3545' 
                        }}
                      >
                        {formatPercent(stock.change_percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'holdings' && (
          <div>
            <h2>My Holdings</h2>
            {holdings.length === 0 ? (
              <p>You don't have any holdings yet. Start investing to see your portfolio here!</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Shares</th>
                    <th>Purchase Price</th>
                    <th>Current Price</th>
                    <th>Total Value</th>
                    <th>Gain/Loss</th>
                    <th>Gain/Loss %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => (
                    <tr key={holding.id}>
                      <td><strong>{holding.symbol}</strong></td>
                      <td>{holding.name}</td>
                      <td>{holding.shares}</td>
                      <td>{formatCurrency(holding.purchase_price)}</td>
                      <td>{formatCurrency(holding.current_price)}</td>
                      <td>{formatCurrency(holding.total_value)}</td>
                      <td 
                        style={{ 
                          color: holding.gain_loss >= 0 ? '#28a745' : '#dc3545' 
                        }}
                      >
                        {formatCurrency(holding.gain_loss)}
                      </td>
                      <td 
                        style={{ 
                          color: holding.gain_loss_percent >= 0 ? '#28a745' : '#dc3545' 
                        }}
                      >
                        {formatPercent(holding.gain_loss_percent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StocksOverviewPage;