import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h1>Welcome to ValuIntel!</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          Built by value investors for value investors, ValuIntel helps you track
          your stock investments, financial records and helps you make more intelligent investment decisions.
        </p>
        
        {!isAuthenticated ? (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        ) : (
          <div>
            <Link to="/stocks" className="btn btn-primary">
              View My Portfolio
            </Link>
          </div>
        )}
      </div>
      
      <div className="card">
        <h2>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
          <div>
            <h3>💼 Stock Financial Data</h3>
            <p>Add and manage your stock financial data easily</p>
          </div>
          <div>
            <h3>🤖 Artificial Intelligence Insights</h3>
            <p>Get AI insights on your selected stocks based on its financial data</p>
          </div>
          <div>
            <h3>📈 Real-time Stock Prices</h3>
            <p>Get up-to-date stock prices and market data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;