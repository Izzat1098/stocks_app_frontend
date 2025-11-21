import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container">
      <section className="welcome">
        <div className="welcome">
          <h1>Welcome to ValuIntel!</h1>
          <p>
            Built by value investors for value investors, ValuIntel helps you track
            your stock investments, financial records and helps you make more intelligent investment decisions.
          </p>
          
          {!isAuthenticated ? (
            <div className='home-btn'>
              <Link to="/register" className="link-btn link-btn-start">
                Get Started
              </Link>
              <Link to="/login" className="link-btn link-btn-login">
                Login
              </Link>
            </div>
          ) : (
            <div className='home-btn'>
              <Link to="/stocks" className="link-btn link-btn-start">
                View My Portfolio
              </Link>
            </div>
          )}
        </div>
      </section>
      
      <section className="features">
        <div className="features">
          <h1>Features</h1>
          <div className="features-items">
            <div className="feature-item">
              <h3>💼 Stock Financial Data</h3>
              <p>Add and manage your stock financial data easily</p>
            </div>
            <div className="feature-item">
              <h3>🤖 Artificial Intelligence Insights</h3>
              <p>Get AI insights on your selected stocks based on its financial data</p>
            </div>
            <div className="feature-item">
              <h3>📈 Real-time Stock Prices</h3>
              <p>Get up-to-date stock prices and market data</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;