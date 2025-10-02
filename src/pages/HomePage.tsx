import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h1>Welcome to Stock Investment Tracker</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          Track your stock investments and monitor your portfolio performance in real-time.
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
            <h3>📈 Real-time Stock Prices</h3>
            <p>Get up-to-date stock prices and market data</p>
          </div>
          <div>
            <h3>💼 Portfolio Tracking</h3>
            <p>Monitor your investments and track performance</p>
          </div>
          <div>
            <h3>📊 Gain/Loss Analysis</h3>
            <p>See your portfolio's gains and losses at a glance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;