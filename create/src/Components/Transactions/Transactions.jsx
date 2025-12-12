import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../App';
import axiosInstance from '../../axiosConfig';
import './Transactions.css';

export default function Transactions() {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState('date-desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [budgetCategories, setBudgetCategories] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    payee: '',
    categoryID: '',
    amount: '',
    notes: '',
    file: null
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchBudgets();
  }, [sortBy, filterCategory]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        sort: sortBy,
        category: filterCategory,
        limit: 100
      });

      const response = await axiosInstance.get(`/transactions/all?${params}`);
      console.log('Transactions data:', response.data);
      setTransactions(response.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories/all');
      // Store category names for filtering dropdown
      const categoryNames = response.data.categories || [];
      setCategories(categoryNames);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await axiosInstance.get('/budgets');
      setBudgets(response.data);
      if (response.data.length > 0) {
        setSelectedBudgetId(response.data[0].budgetID);
        fetchCategoriesForBudget(response.data[0].budgetID);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setBudgets([]);
    }
  };

  const fetchCategoriesForBudget = async (budgetID) => {
    try {
      const response = await axiosInstance.get(`/categories?budgetId=${budgetID}`);
      const categories = response.data.categories || response.data || [];
      setBudgetCategories(categories);

      if (categories && categories.length > 0) {
        const firstCatID = categories[0].idbankCategory;
        if (firstCatID) {
          setFormData(prev => ({
            ...prev,
            categoryID: firstCatID.toString()
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching categories for budget:', err);
      setBudgetCategories([]);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      if (!formData.payee || !formData.amount || !formData.date || !formData.categoryID) {
        setError('Please fill in all required fields (payee, amount, date, category)');
        return;
      }

      if (!selectedBudgetId) {
        setError('Please select a budget first');
        return;
      }

      const transactionData = {
        payee: formData.payee,
        amount: parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes,
        categoryID: parseInt(formData.categoryID),
        budgetID: selectedBudgetId
      };

      if (transactionData.amount <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      const response = await axiosInstance.post('/transactions', transactionData);

      if (response.status === 200) {
        resetForm();
        setShowAddModal(false);
        setError(null);
        fetchTransactions();
      } else {
        throw new Error(response.data.error || 'Failed to add transaction');
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add transaction. Please try again.';
      setError(errorMessage);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date.split('T')[0],
      payee: transaction.payee,
      categoryID: transaction.categoryID.toString(),
      amount: transaction.amount.toString(),
      notes: transaction.notes || '',
      file: null
    });
    setShowAddModal(true);
  };

  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    try {
      if (!formData.payee || !formData.amount || !formData.date || !formData.categoryID) {
        setError('Please fill in all required fields');
        return;
      }

      const transactionData = {
        payee: formData.payee,
        amount: parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes,
        categoryID: parseInt(formData.categoryID)
      };

      console.log('Updating transaction with data:', transactionData);

      const response = await axiosInstance.put(`/transactions/${editingTransaction.id}`, transactionData);

      if (response.status === 200) {
        resetForm();
        setShowAddModal(false);
        setEditingTransaction(null);
        setError(null);
        fetchTransactions();
      } else {
        throw new Error(response.data.error || 'Failed to update transaction');
      }
    } catch (err) {
      console.error('Error updating transaction:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update transaction. Please try again.';
      setError(errorMessage);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await axiosInstance.delete(`/transactions/${id}`);
        if (response.status === 200) {
          fetchTransactions();
        } else {
          throw new Error('Failed to delete transaction');
        }
      } catch (err) {
        console.error('Error deleting transaction:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to delete transaction. Please try again.';
        setError(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: '',
      payee: '',
      categoryID: '',
      amount: '',
      notes: '',
      file: null
    });
  };

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'payee':
        return a.payee.localeCompare(b.payee);
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  // Filter by category
  const filteredTransactions = filterCategory === 'all' 
    ? sortedTransactions 
    : sortedTransactions.filter(t => t.category === filterCategory);

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h2>Transactions</h2>
        <button 
          className="btn-add-transaction"
          onClick={() => {
            setEditingTransaction(null);
            resetForm();
            setShowAddModal(true);
          }}
        >
          + Add Transaction
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            style={{ float: 'right' }}
          />
        </div>
      )}

      <div className="transactions-controls">
        <div className="control-group">
          <label>Sort by:</label>
          <select 
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
            <option value="payee">Payee (A-Z)</option>
            <option value="category">Category (A-Z)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Filter by Category:</label>
          <select 
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="transactions-summary">
          <strong>Total: ${totalAmount.toFixed(2)}</strong>
          <span>({filteredTransactions.length} transactions)</span>
        </div>
      </div>

      <div className="transactions-table-container">
        {loading ? (
          <div>Loading transactions...</div>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>{transaction.payee}</td>
                  <td>
                    <span className={`category-badge category-${transaction.category.toLowerCase().replace(/\s/g, '-')}`}>
                      {transaction.category}
                    </span>
                  </td>
                  <td className="amount-cell">${transaction.amount.toFixed(2)}</td>
                  <td className="notes-cell">{transaction.notes || '—'}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEditTransaction(transaction)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddModal && (
        <div className="custom-modal">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h5>
              <button 
                className="custom-modal-close" 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTransaction(null);
                  resetForm();
                  setError(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}>
              <div className="mb-3">
                <label className="form-label">Date *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Payee *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Amazon"
                  value={formData.payee}
                  onChange={(e) => setFormData({...formData, payee: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Category *</label>
                <select 
                  className="form-control"
                  value={formData.categoryID}
                  onChange={(e) => setFormData({...formData, categoryID: e.target.value})}
                  required
                >
                  <option value="">Select category...</option>
                  {budgetCategories.map(cat => (
                    <option key={cat.idbankCategory} value={cat.idbankCategory}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Amount *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 25.00"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Notes (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  placeholder="Add any notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Upload Receipt/File (Optional)</label>
                <input 
                  type="file" 
                  className="form-control"
                  onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                />
                {formData.file && <div className="mt-2">File selected: {formData.file.name}</div>}
              </div>
              <button type="submit" className="btn btn-success w-100">
                {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}