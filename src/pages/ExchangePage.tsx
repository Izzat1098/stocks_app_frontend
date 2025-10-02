import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import exchangeService, { Exchange, ExchangeFormData } from '../services/exchangeService';

const ExchangePage: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [errorForm, setErrorForm] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form data state
  const [formData, setFormData] = useState<ExchangeFormData>({
    name: '',
    abbreviation: '',
    country: '',
  });

  // Edit state
  const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exchangeToDelete, setExchangeToDelete] = useState<number | null>(null);

  // Fetch exchanges from API
  const fetchExchanges = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorForm('');
      const exchanges = await exchangeService.getAll();
      setExchanges(exchanges);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch exchanges. Please try again.');

    } finally {
      setLoading(false);
    }
  };

  // Load exchanges on component mount
  useEffect(() => {
    fetchExchanges();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setErrorForm('');
    setSuccessMessage('');

    try {
      // Validate form data
      if (!formData.name.trim() || !formData.abbreviation.trim() || !formData.country.trim()) {
        setErrorForm('All fields are required.');
        return;
      }

      if (isEditing && editingExchange) {
        // Update existing exchange
        const updatedExchange = await exchangeService.update(editingExchange.id!, formData);
        
        // Update exchange in the list
        setExchanges(prev => prev.map(exchange => 
          exchange.id === editingExchange.id ? updatedExchange : exchange
        ));
        
        setSuccessMessage('Exchange updated successfully!');
        setIsEditing(false);
        setEditingExchange(null);

      } else {
        // Create new exchange
        const newExchange = await exchangeService.create(formData);
        
        // Add new exchange to the list
        setExchanges(prev => [...prev, newExchange]);
        
        setSuccessMessage('Exchange added successfully!');
      }
      
      // Reset form
      setFormData({
        name: '',
        abbreviation: '',
        country: '',
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      if (err.response.data.detail[0].msg) {
        const msg = err.response.data.detail[0].msg
        const field = err.response.data.detail[0].loc[1]
        setErrorForm(`Error with field "${field}": ${msg}`);
      } else {
        setErrorForm(err.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'add'} exchange. Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit exchange
  const handleEdit = (exchange: Exchange) => {
    setEditingExchange(exchange);
    setIsEditing(true);
    setFormData({
      name: exchange.name,
      abbreviation: exchange.abbreviation,
      country: exchange.country,
    });
    setError('');
    setErrorForm('');
    setSuccessMessage('');
  };

  // Handle delete exchange
  const handleDelete = (exchangeId: number) => {
    setExchangeToDelete(exchangeId);
    setShowDeleteDialog(true);
  };

  // Confirm delete exchange
  const confirmDelete = async () => {
    if (!exchangeToDelete) return;

    try {
      await exchangeService.delete(exchangeToDelete);
      
      // Remove exchange from the list
      setExchanges(prev => prev.filter(exchange => exchange.id !== exchangeToDelete));
      setSuccessMessage('Exchange deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      setErrorForm(err.response?.data?.detail || 'Failed to delete exchange. Please try again.');
    } finally {
      setShowDeleteDialog(false);
      setExchangeToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setExchangeToDelete(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingExchange(null);
    setFormData({
      name: '',
      abbreviation: '',
      country: '',
    });
    setError('');
    setErrorForm('');
    setSuccessMessage('');
  };

  return (
    <div className="container">
      <h1>Stock Exchanges</h1>

      {/* Exchanges List */}
      <div className="card">
        <h2>Stock Exchanges List</h2>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading exchanges...
          </div>
        )}

        {error && !loading && (
          <div className="error" style={{ textAlign: 'center', padding: '2rem' }}>
            {error}
            <br />
            <button 
              onClick={fetchExchanges} 
              className="btn btn-primary" 
              style={{ marginTop: '1rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && exchanges.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            No exchanges found. Add some exchanges using the form below.
          </div>
        )}

        {!loading && !error && exchanges.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Exchange Name</th>
                <th>Abbreviation</th>
                <th>Country</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((exchange) => (
                <tr key={exchange.id || `${exchange.abbreviation}-${exchange.country}`}>
                  <td>{exchange.name}</td>
                  <td><strong>{exchange.abbreviation}</strong></td>
                  <td>{exchange.country}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(exchange)}
                        className="btn-icon btn-edit"
                        title="Edit Exchange"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(exchange.id!)}
                        className="btn-icon btn-delete"
                        title="Delete Exchange"
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
          {isEditing ? 'Edit Stock Exchange' : 'Add New Stock Exchange'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Exchange Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={submitting}
              placeholder="e.g., New York Stock Exchange"
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
              required
              disabled={submitting}
              placeholder="e.g., NYSE"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              disabled={submitting}
              placeholder="e.g., United States"
            />
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
                : (isEditing ? 'Update Exchange' : 'Add Exchange')
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Exchange"
        message="Are you sure you want to delete this exchange? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />

    </div>
  );
};

export default ExchangePage;