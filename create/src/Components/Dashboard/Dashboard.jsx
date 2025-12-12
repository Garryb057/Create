import React, { useState, useEffect, useContext } from 'react';
import RecentTransactions from './RecentTransactions';
import SpendingChart from './SpendingChart';
import BudgetList from './BudgetList';
import { AuthContext } from '../../App';
import axiosInstance from '../../axiosConfig';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState({
    income: 0,
    expenses: 0,
    recentTransactions: [],
    budgets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [budgetCategories, setBudgetCategories] = useState([]);

  // State to track if user has no budgets
  const [hasNoBudgets, setHasNoBudgets] = useState(false);

  // Add Budget Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [categories, setCategories] = useState([
    { name: '', amount: 0, percent: 0 }
  ]);

  // Modal for Add Transaction
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [file, setFile] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    payee: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    categoryID: ''
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      fetchDashboardData(selectedBudgetId);
      fetchCategoriesForBudget(selectedBudgetId);
    }
  }, [selectedBudgetId]);

  useEffect(() => {
    if (!selectedBudgetId && budgets.length > 0) {
      const firstBudgetID = budgets[0].budgetID;
      setSelectedBudgetId(firstBudgetID);
    }
  }, [budgets]);

  const fetchDashboardData = async (budgetId = null) => {
    try {
      setLoading(true);
      setError(null);

      const url = budgetId ? `/dashboard?budgetId=${budgetId}` : '/dashboard';

      const response = await axiosInstance.get(url);
      
      setDashboardData({
        ...response.data,
        recentTransactions: response.data.recentTransactions || []
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');

      setDashboardData({
        income: 0,
        expenses: 0,
        recentTransactions: [],
        budgets: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await axiosInstance.get('/budgets');
      setBudgets(response.data);
      
      // Check if user has no budgets
      if (response.data.length === 0) {
        setHasNoBudgets(true);
        setShowBudgetModal(true);
        setLoading(false);
      } else {
        setHasNoBudgets(false);
        setSelectedBudgetId(response.data[0].budgetID);
        fetchCategoriesForBudget(response.data[0].budgetID);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setBudgets([]);
      setHasNoBudgets(true);
      setShowBudgetModal(true);
      setLoading(false);
    }
  };

  const fetchCategoriesForBudget = async (budgetID) => {
    try {
      const response = await axiosInstance.get(`/categories?budgetId=${budgetID}`);

      const categories = response.data.categories || response.data || [];
      setBudgetCategories(categories);

      if (categories && categories.length > 0) {
        const firstCatID = categories[0].idbankCategory || categories[0].categoryID;
        if (firstCatID) {
          setNewTransaction(prev => ({
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
      if (!newTransaction.payee || !newTransaction.amount || !newTransaction.date || !newTransaction.categoryID) {
        setError('Please fill in all required fields (payee, amount, date, category)');
        return;
      }

      if (!selectedBudgetId) {
        setError('Please select a budget first');
        return;
      }

      const catID = parseInt(newTransaction.categoryID);
      if (isNaN(catID)) {
        setError('Please select a valid category');
        return;
      }

      const transactionData = {
        payee: newTransaction.payee,
        amount: parseFloat(newTransaction.amount),
        date: newTransaction.date,
        notes: newTransaction.notes,
        categoryID: parseInt(newTransaction.categoryID),
        budgetID: selectedBudgetId
      };

      if (transactionData.amount <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      const response = await axiosInstance.post('/transactions', transactionData);

      if (response.status === 200) {
        // Reset form
        setNewTransaction({
          payee: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          categoryID: budgetCategories[0]?.idbankCategory || ''
        });
        
        setShowTransactionModal(false);
        setError(null);
        
        // Refresh dashboard data
        fetchDashboardData(selectedBudgetId);
        fetchCategoriesForBudget(selectedBudgetId);
        
        console.log('Transaction added successfully:', response.data);
      } else {
        throw new Error(response.data.error || 'Failed to add transaction');
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add transaction. Please try again.';
      setError(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handlers for category editing in modal:
  const handleCategoryChange = (idx, field, value) => {
    setCategories(prev =>
      prev.map((cat, i) => i === idx ? { ...cat, [field]: value } : cat)
    );
  };
  const addCategory = () => setCategories([...categories, { name: "", amount: 0, percent: 0 }]);
  const removeCategory = idx => setCategories(categories.filter((_, i) => i !== idx));

  // Save Budget handler 
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetName.trim()) {
      setError('Budget name is required');
      return;
    }

    // Validate that at least one category has a name
    const validCategories = categories.filter(cat => cat.name.trim());
    if (validCategories.length === 0) {
      setError('Please add at least one category with a name');
      return;
    }

    try {
      const totalPlannedAmnt = categories.reduce((sum, cat) => sum + Number(cat.amount), 0);

      const budgetData = {
        name: budgetName,
        totalPlannedAmnt: totalPlannedAmnt,
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric'}),
        income: 0,
        categories: validCategories.map(cat => ({
          name: cat.name,
          type: 'Expense',
          categoryLimit: Number(cat.amount),
          plannedAmnt: Number(cat.amount),
          plannedPercentage: Number(cat.percent)
        }))
      };

      const response = await axiosInstance.post('/budgets', budgetData);

      if (response.status === 200) {
        setBudgetName('');
        setCategories([{ name: '', amount: 0, percent: 0 }]);
        setShowBudgetModal(false);
        setError(null);
        setHasNoBudgets(false);

        // Refresh budgets
        await fetchBudgets();
        console.log('Budget created successfully:', response.data);
      } else {
        throw new Error(response.data.error || 'Failed to create budget');
      }
    } catch (err) {
      console.error('Error creating budget:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create budget. Please try again.';
      setError(errorMessage);
    }
  };

  const selectedBudget = budgets.find(b => b.budgetID === selectedBudgetId);

  const { income, expenses, recentTransactions } = dashboardData;

  // Show loading only when we're actually fetching data
  if (loading && !hasNoBudgets) {
    return (
      <div className='dashboard-container'>
        <div className='d-flex justify-content-center align-items-center' style={{ height: '50vh' }}>
          <div className='spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
          <span className='ms-2'>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Show welcome message for users with no budgets
  if (hasNoBudgets && !showBudgetModal) {
    return (
      <div className='dashboard-container'>
        <div className='d-flex flex-column justify-content-center align-items-center' style={{ height: '50vh' }}>
          <div className='text-center'>
            <h2>Welcome to Your Budget Dashboard!</h2>
            <p className='text-muted mb-4'>To get started, you need to create your first budget.</p>
            <button
              className='btn btn-primary btn-lg'
              onClick={() => setShowBudgetModal(true)}
            >
              Create Your First Budget
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {error && (
        <div className='alert alert-warning alert-dismissible fade show' role='alert'>
          {error}
          <button type='button' className='btn-close' onClick={() => setError(null)}></button>
        </div>
      )}

      {!hasNoBudgets && (
        <>
          <div className="budget-add-container-top">
            <select
              className="select-budget"
              value={selectedBudgetId || ''}
              onChange={e => {
                const newBudgetId = Number(e.target.value);
                console.log('Budget changed to:', newBudgetId);
                setSelectedBudgetId(newBudgetId);
              }}
            >
              {budgets.map(budget => (
                <option value={budget.budgetID} key={budget.budgetID}>
                  {budget.name}
                </option>
              ))}
            </select>
            <button
              className="add-budget-btn"
              onClick={() => setShowBudgetModal(true)}
            >
              Add Budget
            </button>
          </div>

          <div className="cards-row">
            <div className="card large-card">
              <h5>Current Income (MTD)</h5>
              <p className="income">
                ${(income || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="card large-card">
              <h5>Current Spending Total</h5>
              <p className="spending">
                -${(expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              className="add-transaction"
              onClick={() => setShowTransactionModal(true)}
            >
              Add New Transaction
            </button>
          </div>

          <div className="bottom-section">
            <div className="transactions-container">
              <RecentTransactions items={recentTransactions} />
            </div>
            <div className="chart-container">
              <SpendingChart budgetId={selectedBudgetId} />
              <BudgetList
                budgets={dashboardData.budgets}
                selectedBudget={null}
                onSelectBudget={() => {}} 
              />
            </div>
          </div>
        </>
      )}

      {/* Modal for Add Transaction */}
      {showTransactionModal && (
        <div className="custom-modal">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>Add New Transaction</h5>
              <button className="custom-modal-close" onClick={() => setShowTransactionModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="mb-3">
                <label className="form-label">Payee *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Amazon" 
                  name="payee"
                  value={newTransaction.payee}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Amount *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 25.00" 
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Date *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  name="date"
                  value={newTransaction.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Category *</label>
                <select 
                  className="form-control"
                  name="categoryID"
                  value={newTransaction.categoryID}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {budgetCategories.map(category => (
                    <option key={category.idbankCategory} value={category.idbankCategory}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {!selectedBudgetId && (
                  <div className="form-text text-warning">Please select a budget first to see categories</div>
                )}
                {selectedBudgetId && budgetCategories.length === 0 && (
                  <div className="form-text text-warning">No categories found for this budget</div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  placeholder="Optional"
                  name="notes"
                  value={newTransaction.notes}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Upload File/Image (optional)</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={e => setFile(e.target.files[0])}
                />
                {file && <div className="mt-2">File selected: {file.name}</div>}
              </div>
              <button type="submit" className="btn btn-success w-100">Save Transaction</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Add Budget*/}
      {showBudgetModal && (
        <div className="custom-modal">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5>{hasNoBudgets ? 'Create Your First Budget' : 'Add Budget'}</h5>
              {!hasNoBudgets && (
                <button className="custom-modal-close" onClick={() => setShowBudgetModal(false)}>×</button>
              )}
            </div>
            {hasNoBudgets && (
              <div className="alert alert-info mb-3">
                <strong>Welcome!</strong> Let's create your first budget to start tracking your finances.
              </div>
            )}
            <form onSubmit={handleSaveBudget}>
              <div className="mb-3">
                <label className="form-label">Budget Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={budgetName} 
                  onChange={e => setBudgetName(e.target.value)} 
                  placeholder="e.g. November 2025 Budget"
                  required
                />
              </div>

              <div className="category-headers">
                <span>Category Name *</span>
                <span>Amount</span>
                <span>Percent</span>
                <span></span>
              </div>

              {categories.map((cat, idx) => (
                <div className="category-row" key={idx}>
                  <input 
                    type="text" 
                    placeholder="e.g. Rent" 
                    value={cat.name} 
                    onChange={e => handleCategoryChange(idx, 'name', e.target.value)} 
                  />
                  <input 
                    type="number" 
                    placeholder="e.g. 1200" 
                    value={cat.amount} 
                    onChange={e => handleCategoryChange(idx, 'amount', e.target.value)} 
                  />
                  <input 
                    type="number" 
                    placeholder="e.g. 50" 
                    value={cat.percent} 
                    onChange={e => handleCategoryChange(idx, 'percent', e.target.value)} 
                    min={0} 
                    max={100} 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeCategory(idx)}
                    disabled={categories.length === 1}
                  >
                    –
                  </button>
                </div>
              ))}
              <button type="button" onClick={addCategory} style={{ marginBottom: '10px' }}>+ Add Category</button>
              <button type="submit" className="btn btn-success w-100">
                {hasNoBudgets ? 'Create Budget & Get Started' : 'Save Budget'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}