import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import ForgotPassword from "./Components/ForgotPassword/ForgotPassword";

import Header from "./Components/Header/Header";
import Create from "./Components/Create/Create";
import Dashboard from "./Components/Dashboard/Dashboard";
import IncomeManagement from "./Components/IncomeManagement/IncomeManagement";
import Register from "./Components/Register/Register";
import AccountSettings from "./Components/Accounts/AccountSettings"; 
import TwoStepVerification from "./Components/TwoStep/TwoStep";
import VerifyEmail from "./Components/VerifyEmail/VerifyEmail";
import Transactions from './Components/Transactions/Transactions';
import Chatbot from "./Components/Chatbot/chatbot";

export const AuthContext = React.createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-auth', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const location = useLocation();

  const hideHeaderOn = ["/", "/create", "/register", "/verify"];
  const showHeader = !hideHeaderOn.includes(location.pathname);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, checkAuthStatus }}>
      {/* Conditionally render header based on current route */}
      {showHeader && <Header />}

      {/* Application Routes */}
      <Routes>
        {/* Public Routes - Login/Create Account */}
        {/* Redirect to dashboard if already authenticated */}
        <Route path="/" element={!isAuthenticated ? <Create /> : <Navigate to="/dashboard" />} />
        <Route path="/create" element={!isAuthenticated ? <Create /> : <Navigate to="/dashboard" />} />
       
        {/* Forgot Password Route - Accessible to all */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ForgotPassword />} />
        
        {/* Email Verification Route - Accessible without authentication */}
        {/* This is the NEW route for email verification after registration */}
        <Route path="/verify" element={<VerifyEmail />} />

        {/* Protected Routes - Require Authentication */}
        {/* Dashboard - Main app view after login */}
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />

        {/* Income Management - Manage income sources */}
        <Route path="/income-management" element={isAuthenticated ? <IncomeManagement /> : <Navigate to="/" />} />

        {/* Account Settings - User profile and preferences */}
        <Route path="/account" element={isAuthenticated ? <AccountSettings /> : <Navigate to="/" />} />

        {/* Transactions - View and manage transactions */}
        <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/" />} />

        {/* Registration Route - Accessible to non-authenticated users */}
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      </Routes>

      {/* Chatbot - Available on all pages for user assistance */}
      <Chatbot/>
    </AuthContext.Provider>
  );
}

export default App;