import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StockPage from './pages/StockPage';
import ExchangePage from './pages/ExchangePage';
import FinancialPage from './pages/FinancialPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/stocks"
              element={
                <ProtectedRoute>
                  <StockPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exchanges" 
              element={
                <ProtectedRoute>
                  <ExchangePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financials" 
              element={
                <ProtectedRoute>
                  <FinancialPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;