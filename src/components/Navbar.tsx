import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false); // Close menu after logout
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-content">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          ValuIntel
        </Link>
        
        {/* Hamburger button */}
        <button 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <ul className={`navbar-nav ${isMenuOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              <li>
                <Link to="/stocks" className="navbar-link" onClick={closeMenu}>
                  Stocks Overview
                </Link>
              </li>
              <li>
                <Link to="/exchanges" className="navbar-link" onClick={closeMenu}>
                  Exchanges
                </Link>
              </li>
              <li>
                <Link to="/financials" className="navbar-link" onClick={closeMenu}>
                  Financial Data
                </Link>
              </li>
              <li>
                <span className="navbar-link">
                  Welcome, {user?.username}
                </span>
              </li>
              <li>
                <Link to="#" className="navbar-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}>
                  Logout
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="navbar-link" onClick={closeMenu}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="navbar-link" onClick={closeMenu}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;