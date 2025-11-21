import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserLogin } from '../types';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<UserLogin>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);

      try {
        login(response.access_token, response.username, response.email);
        navigate('/stocks');
      } catch (err: any) {
        // console.error('Login function error:', err);
        setError('An error occurred during login. Please try again.');
      }

    } catch (err: any) {

      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <h2>
          Login
        </h2>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-items">
            <div className="login-form-item">
              <label htmlFor="email">Email</label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          
            <div className="login-form-item">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button
            type="submit"
            className="link-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-register">
          <p>
            {"Don't have an account? "}
            <Link to="/register">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;