import React from "react";
import "./BudgetList.css";

export default function BudgetList({ budgets, selectedBudget, onSelectBudget }) {
  const getProgressBarClass = (spent, total) => {
    const percentage = (spent / total) * 100;
    if (percentage >= 90) return "bg-danger";
    if (percentage >= 75) return "bg-warning";
    return "bg-success"
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="budget-list">
      <h5>Categories</h5>
      
      {budgets.length === 0 ? (
        <div className="text-center text-muted py-4">
          <p>No budget categories found</p>
        </div>
      ) : (
        <ul>
          {budgets.map((b) => (
            <li
              key={b.id}
              className={b.id === selectedBudget ? "budget-item selected" : "budget-item"}
              onClick={() => onSelectBudget(b.id)}
            >
              <div className="budget-header">
                <span className="budget-name">{b.name}</span>
                <span className="budget-total">{formatCurrency(b.total)}</span>
              </div>
              <div className="budget-progress">
                <div
                  className={`budget-bar ${getProgressBarClass(b.spent, b.total)}`}
                  style={{
                    width: `${Math.min((b.spent / b.total) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <small>{formatCurrency(b.spent)} of {formatCurrency(b.total)} spent</small>
              <small className={`status ${b.spent > b.total ? 'over-budget' : 'on-track'}`}>
                {b.spent > b.total ? 'Over Budget' : 'On Track'}
              </small>
            </li>
          ))}
        </ul>
      )}
      
      {/* Budget Summary */}
      {budgets.length > 0 && (
        <div className="budget-summary">
          <div className="summary-item">
            <small className="text-muted">Total Budget</small>
            <strong>{formatCurrency(budgets.reduce((sum, b) => sum + b.total, 0))}</strong>
          </div>
          <div className="summary-item">
            <small className="text-muted">Total Spent</small>
            <strong>{formatCurrency(budgets.reduce((sum, b) => sum + b.spent, 0))}</strong>
          </div>
        </div>
      )}
    </div>
  );
}