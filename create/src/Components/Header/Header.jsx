import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../App";
import axiosInstance from "../../axiosConfig";
import "./Header.css";
import budgetLogo from "../Assets/budget_app_figma_logo.png";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const toggleMenu = () => setOpen((prev) => !prev);

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = async() => {
    try {
      const response = await axiosInstance.post('/logout');

      if (response.data.success) {
        logout();
        navigate("/");
      } else {
        console.error('Logout failed:', response.data.message);
        logout();
        navigate("/");
      }
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      navigate("/");
    } finally {
      setOpen(false);
    }
  };

  return (
    <header className="app-header">
      {/* LEFT: logo + text (kept) */}
      <div className="header-left" onClick={() => goTo("/dashboard")}>
        <img
          src={budgetLogo}
          alt="Budget App Logo"
          className="header-logo"
        />
        <span className="header-title">
          Task Failed Successfully Budget App
        </span>
      </div>

      {/* RIGHT: clickable dropdown menu */}
      <div className="header-right">
        <button
          type="button"
          className="menu-toggle"
          onClick={toggleMenu}
        >
          Menu ▾
        </button>

        {open && (
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onClick={() => goTo("/dashboard")}
            >
              Dashboard
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => goTo("/income-management")}
            >
              Income
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => goTo("/transactions")}
            >
              Transactions
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => goTo("/account")}
            >
              Account
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => goTo("/profile")}
            >
              Profile
            </button>

            {/* ✅ LOG OUT HERE – NO REGISTER */}
            <button
              type="button"
              className="dropdown-item logout-item"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

