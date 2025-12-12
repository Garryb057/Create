import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosConfig';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function IncomePieChart({ onRefresh, height = 300 }) {
  const [incomeData, setIncomeData] = useState([]);
  const [totalMonthlyIncome, setTotalMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colorPalette = [
    '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
    '#8AC926', '#1982C4', '#6A4C93', '#F15BB5', '#00BBF9'
  ];

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/incomes');
      
      if (response.data.success) {
        const incomes = response.data.incomes;
        setIncomeData(incomes);
        setTotalMonthlyIncome(response.data.totalMonthlyIncome);
      } else {
        setError(response.data.message || 'Failed to load income data');
      }
    } catch (error) {
      console.error('Error fetching income data:', error);
      setError(error.response?.data?.message || 'Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
  }, []);

  useEffect(() => {
    if (onRefresh) {
      fetchIncomeData();
    }
  }, [onRefresh]);

  const calculateMonthlyAmount = (income) => {
    const amount = parseFloat(income.amount);
    const payFrequency = income.payFrequency.toLowerCase();

    switch (payFrequency) {
      case 'weekly':
      case '1 week':
        return amount * 4;
      case 'bi-weekly':
      case 'biweekly':
      case '2 weeks':
        return amount * 2;
      case 'monthly':
      case '1 month':
        return amount;
      case 'annual':
      case 'yearly':
        return amount / 12;
      case 'one-time':
      case 'one time':
        return 0;
      default:
        return amount;
    }
  };

  const getChartData = () => {
    const activeIncomes = incomeData.filter(income => 
      income.isActive && 
      !income.payFrequency.toLowerCase().includes('one-time') &&
      !income.payFrequency.toLowerCase().includes('one time')
    );

    if (activeIncomes.length === 0) {
      return {
        labels: ['No Active Income'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#e9ecef'],
            borderColor: ['#dee2e6'],
            borderWidth: 2,
          }
        ]
      };
    }

    const labels = activeIncomes.map(income => income.name);
    const monthlyAmounts = activeIncomes.map(calculateMonthlyAmount);
    
    if (activeIncomes.length === 1) {
      return {
        labels: [activeIncomes[0].name],
        datasets: [
          {
            data: [100],
            backgroundColor: [colorPalette[0]],
            borderColor: ['#ffffff'],
            borderWidth: 3,
            hoverBackgroundColor: [colorPalette[1]],
            hoverBorderColor: ['#ffffff'],
            hoverBorderWidth: 4,
          }
        ]
      };
    }

    return {
      labels: labels,
      datasets: [
        {
          data: monthlyAmounts,
          backgroundColor: colorPalette.slice(0, activeIncomes.length),
          borderColor: activeIncomes.map(() => '#ffffff'),
          borderWidth: 3,
          hoverBackgroundColor: activeIncomes.map((_, index) => 
            colorPalette[(index + 1) % colorPalette.length]
          ),
          hoverBorderColor: activeIncomes.map(() => '#ffffff'),
          hoverBorderWidth: 4,
          hoverOffset: 15,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          color: '#333',
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: data.datasets[0].borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            
            if (incomeData.length === 1) {
              return `100% of total monthly income`;
            }
            
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          },
          afterLabel: function(context) {
            if (incomeData.length === 1) {
              return `Total: $${totalMonthlyIncome.toFixed(2)}/month`;
            }
            return null;
          }
        }
      },
      title: {
        display: true,
        text: 'Monthly Income Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#333',
        padding: 20
      }
    },
    cutout: incomeData.length === 1 ? '0%' : '0%', // Regular pie chart, not donut
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-center" style={{ height: `${height}px` }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={fetchIncomeData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="card h-100">
      <div className="card-header bg-white border-bottom-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Income Distribution</h5>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchIncomeData}
            title="Refresh income data"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
      <div className="card-body">
        {incomeData.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-muted mb-2">No income sources found</div>
            <small className="text-muted">Add income sources to see the distribution</small>
          </div>
        ) : (
          <>
            <div style={{ height: `${height}px` }}>
              <Pie data={chartData} options={chartOptions} />
            </div>
            
            {/* Summary information */}
            <div className="mt-3 pt-3 border-top">
              <div className="row text-center">
                <div className="col">
                  <small className="text-muted d-block">Total Monthly</small>
                  <strong className="text-success">${totalMonthlyIncome.toFixed(2)}</strong>
                </div>
                <div className="col">
                  <small className="text-muted d-block">Income Sources</small>
                  <strong>{incomeData.filter(income => income.isActive).length}</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}