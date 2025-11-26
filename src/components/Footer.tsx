import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-item footer-texts">
          <p>&copy; {currentYear} ValuIntel. All rights reserved.</p>
        </div>
        <div className="footer-item footer-links">
          <Link to="/" className="footer-link">Privacy Policy</Link>
          <span className="footer-divider">|</span>
          <Link to="/" className="footer-link">Terms of Service</Link>
          <span className="footer-divider">|</span>
          <Link to="/" className="footer-link">Contact</Link>
        </div>
        <div className="footer-item footer-social">
          <Link to ="/" rel="noopener noreferrer">🐦 X/Twitter</Link>
          <span className="footer-divider">|</span>
          <Link to ="/" rel="noopener noreferrer">💼 LinkedIn</Link>
          <span className="footer-divider">|</span>
          <Link to ="/" rel="noopener noreferrer">🐙 Facebook</Link>
        </div>
      </div>

    </footer>
  );
};

export default Footer;