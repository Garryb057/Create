import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosConfig';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const accentGreen = '#86C6A0'; 
const darkGray = '#333333';

export default function SpendingChart({ budgetId }) {
  const [spendingData, setSpendingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('income_vs_expenses');

  const fetchChartData = async () => {
    try {
      setLoading(true);
      // Pass budgetId to the endpoint
      const url = budgetId ? `/spending-chart?budgetId=${budgetId}` : '/spending-chart';
      const response = await axiosInstance.get(url);
      console.log('Chart data received:', response.data);
      setSpendingData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setSpendingData({
        income_vs_expenses: {
          labels: ['Income', 'Expenses', 'Remaining'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#4CAF50', '#F44336', '#2196F3']
          }]
        },
        category_breakdown: {
          labels: ['No Data'],
          datasets: [{
            data: [1],
            backgroundColor: ['#CCCCCC']
          }]
        },
        spending_trend: {
          labels: [],
          datasets: [{
            label: 'Expenses',
            data: [],
            borderColor: '#F44336'
          }]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (budgetId) {
      fetchChartData();
    }
  }, [budgetId]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
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
      }
    }
  };

  const pieOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const lineBarOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y || context.raw;
            return `${datasetLabel}: $${value.toFixed(2)}`;
          }
        }
      }
    }
  };

  const renderChart = () => {
    if (!spendingData || !spendingData[chartType]) {
      return (
        <div
          style={{
            backgroundColor: '#F0F0F0',
            border: `1px dashed ${accentGreen}`,
            width: '100%',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: darkGray,
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          No chart data available
        </div>
      );
    }

  const chartData = spendingData[chartType];

    switch (chartType) {
      case 'income_vs_expenses':
      case 'category_breakdown':
        return (
          <Pie 
            data={chartData} 
            options={pieOptions}
            height={300}
          />
        );
      
      case 'spending_trend':
        return (
          <Line 
            data={chartData} 
            options={lineBarOptions}
            height={300}
          />
        );
      
      default:
        return (
          <div
            style={{
              backgroundColor: '#F0F0F0',
              border: `1px dashed ${accentGreen}`,
              width: '100%',
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: darkGray,
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Chart type not supported
          </div>
        );
    }
  };


  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg h-full border border-gray-100 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Spending Analysis</h3>
        <div className="flex-grow flex items-center justify-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg h-full border border-gray-100 flex flex-col">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-0">Spending Analysis</h3>
        <div className="d-flex gap-2">
          <select 
            className="form-select form-select-sm"
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="income_vs_expenses">Income vs Expenses</option>
            <option value="category_breakdown">Category Breakdown</option>
            <option value="spending_trend">Spending Trend</option>
          </select>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchChartData}
            disabled={loading}
          >
            ↻
          </button>
        </div>
      </div>
      
      <div className="flex-grow w-full flex items-center justify-center">
        <div style={{ width: '100%', height: '300px' }}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}