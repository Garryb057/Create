import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../App";
import axiosInstance from "../../axiosConfig";
import "./IncomeManagement.css";
import { Button, Table, Card, Container, Row, Col, Dropdown, Modal, Form, Alert, Badge } from "react-bootstrap";
import IncomePieChart from "./IncomeChart";

export default function IncomeManagement() {
  const { user } = useContext(AuthContext);

  const [incomeData, setIncomeData] = useState([]);
  const [totalMonthlyIncome, setTotalMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [refreshChart, setRefreshChart] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    payFrequency: "Monthly",
    datePaid: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await axiosInstance.get('/incomes');
      console.log('Incoming API response:', response.data);

      if (response.data.success) {
        const incomes = response.data.incomes;
        setIncomeData(incomes);
        setTotalMonthlyIncome(response.data.totalMonthlyIncome);
        setRefreshChart(prev => prev + 1);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to load income data'
        });
        setIncomeData([]);
        setTotalMonthlyIncome(0);
      }
    } catch (error) {
      console.error('Error fetching incomes:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load income data';
      setMessage({
        type: 'error',
        text: errorMessage
      });
      setIncomeData([]);
      setTotalMonthlyIncome(0);
      } finally {
        setLoading(false);
      }
  };

  // Helper function to check if income is currently valid
  const isIncomeValid = (income) => {
    // If manually deactivated, not valid
    if (!income.isActive) {
      return false;
    }
    
    // Check if it's a one-time payment
    const payFreq = income.payFrequency.toLowerCase();
    if (payFreq === 'one-time' || payFreq === 'one time') {
      // Calculate days since payment
      const datePaid = new Date(income.datePaid);
      const today = new Date();
      const daysSince = Math.floor((today - datePaid) / (1000 * 60 * 60 * 24));
      
      // One-time is only valid if within 30 days
      return daysSince <= 30;
    }
    
    // All other frequencies are valid if active
    return true;
  };

  // Get status badge for income
  const getStatusBadge = (income) => {
    if (!income.isActive) {
      return <Badge bg="secondary">Inactive</Badge>;
    }
    
    if (!isIncomeValid(income)) {
      return <Badge bg="warning">Expired</Badge>;
    }
    
    return <Badge bg="success">Active</Badge>;
  };

  // Get days until expiration for one-time payments
  const getDaysUntilExpiration = (income) => {
    const payFreq = income.payFrequency.toLowerCase();
    if (payFreq === 'one-time' || payFreq === 'one time') {
      const datePaid = new Date(income.datePaid);
      const today = new Date();
      const daysSince = Math.floor((today - datePaid) / (1000 * 60 * 60 * 24));
      const daysRemaining = 30 - daysSince;
      
      if (daysRemaining > 0 && daysRemaining <= 7) {
        return (
          <small className="text-warning">
            Expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </small>
        );
      }
    }
    return null;
  };

  // Convert sorting
  const amountToNumber = amount => parseFloat(amount);

  // Helper 
  const frequencyOrder = freq => {
    if (!freq) return 99;
    const freqLower = freq.toLowerCase();
    if (freqLower === "monthly") return 1;
    if (freqLower === "bi-weekly" || freqLower === "biweekly") return 2;
    if (freqLower === "weekly") return 3;
    if (freqLower === "annual") return 4;
    return 5;
  };

  // handler
  const handleSort = sortType => {
    let sorted = [...incomeData];
    if (sortType === "amount-desc") {
      sorted.sort((a, b) => amountToNumber(b.amount) - amountToNumber(a.amount));
    } else if (sortType === "frequency") {
      sorted.sort((a, b) => frequencyOrder(a.payFrequency) - frequencyOrder(b.payFrequency));
    } else if (sortType === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === "status") {
      sorted.sort((a, b) => {
        const aValid = isIncomeValid(a);
        const bValid = isIncomeValid(b);
        if (aValid === bValid) return 0;
        return aValid ? -1 : 1;
      });
    }
    setIncomeData(sorted);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      payFrequency: "Monthly",
      datePaid: new Date().toISOString().split('T')[0]
    });
    setEditingIncome(null);
  };

  const handleSubmitIncome = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        payFrequency: formData.payFrequency,
        datePaid: formData.datePaid
      };

      let response;
      if (editingIncome) {
        response = await axiosInstance.put(`/incomes/${editingIncome.incomeID}`, payload);
      } else {
        response = await axiosInstance.post('/incomes', payload);
      }

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: editingIncome ? 'Income updated successfully!' : 'Income added successfully!'
        });
        setShowAddModal(false);
        resetForm();
        fetchIncomes();
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to save income'
        });
      }
    } catch (error) {
      console.error('Error saving income:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save income';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = async (incomeID) => {
    if (!window.confirm('Are you sure you want to delete this income source?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/incomes/${incomeID}`);
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Income deleted successfully!'
        });
        fetchIncomes();
        
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to delete income'
        });
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete income';
      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
  };

  const handleEditIncome = (income) => {
    setEditingIncome(income);
    setFormData({
      name: income.name,
      amount: income.amount.toString(),
      payFrequency: income.payFrequency,
      datePaid: income.datePaid.split('T')[0]
    });
    setShowAddModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Container fluid className="income-mgmt-root py-4">
      <Row>
        <Col>
          <div className="income-mgmt-title">Income Management</div>
          <p className="text-muted">
            Income applies to all budgets. One-time payments are valid for 30 days.
          </p>
        </Col>
      </Row>

      {message.text && (
        <Row>
          <Col>
            <Alert variant={message.type === 'success' ? 'success' : 'danger'}>
              {message.text}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-2 align-items-stretch" style={{ marginLeft: '100px', marginRight: '100px' }}>
        <Col xs={12} md={6} className="mb-3 mb-md-0"> 
          <Card className="income-summary-card mb-0 h-100">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="summary-label">Total Monthly Income</Card.Title>
              <Card.Text className="summary-amount">
                ${totalMonthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Card.Text>
              <small className="text-muted">Calculated from all active income sources</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <IncomePieChart 
            onRefresh={refreshChart}
            height={280}
          />
        </Col>
      </Row>

      <Row className="mb-2">
        <Col xs={12} className="d-flex justify-content-start align-items-center income-btn-row">
          <Button
            className="income-action-btn"
            variant="success"
            size="lg"
            style={{marginLeft: "100px"}}
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Add Income'}
          </Button>
          <Dropdown>
            <Dropdown.Toggle
              variant="success"
              className="income-action-btn"
              id="dropdown-basic"
              size="lg"
              style={{marginLeft: "32px"}}
              disabled={loading || incomeData.length === 0}
            >
              Sort By
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleSort("amount-desc")}>
                Amount (High → Low)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort("frequency")}>
                Frequency (Monthly → Weekly)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort("name")}>
                Name (A-Z)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleSort("status")}>
                Status (Active First)
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Row>
        <Col>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : incomeData.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <Card.Title>No Income Sources Found</Card.Title>
                <Card.Text>
                  Get started by adding your first income source using the "Add Income" button.
                </Card.Text>
              </Card.Body>
            </Card>
          ) : (
            <Table striped bordered hover className="income-table" responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Next Payday</th>
                  <th>Last Payday</th>
                  <th>Frequency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomeData.map((income) => {
                  const valid = isIncomeValid(income);
                  return (
                    <tr 
                      key={income.incomeID}
                      className={!valid ? 'inactive-income' : ''}
                    >
                      <td>
                        {income.name}
                        {getDaysUntilExpiration(income)}
                      </td>
                      <td>{formatCurrency(income.amount)}</td>
                      <td>{income.nextPayday ? formatDate(income.nextPayday) : 'N/A'}</td>
                      <td>{formatDate(income.datePaid)}</td>
                      <td>{income.payFrequency}</td>
                      <td>{getStatusBadge(income)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditIncome(income)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteIncome(income.incomeID)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>

      {/* Add/Edit Income Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingIncome ? 'Edit Income Source' : 'Add New Income Source'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitIncome}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Income Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Job Salary, Freelance Work"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pay Frequency *</Form.Label>
                  <Form.Select
                    name="payFrequency"
                    value={formData.payFrequency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="One-Time">One-Time (Valid 30 days)</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </Form.Select>
                  {formData.payFrequency === 'One-Time' && (
                    <Form.Text className="text-warning">
                      One-time payments will stop counting towards your monthly income after 30 days.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Pay Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="datePaid"
                    value={formData.datePaid}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingIncome ? 'Update Income' : 'Add Income')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}