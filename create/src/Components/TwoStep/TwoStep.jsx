import React, { useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TwoStep.css";
import { AuthContext } from "../../App";

export default function TwoStep() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  useEffect (() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    } else {
      const userEmail = prompt('Please enter your email:');
      if (userEmail) {
        setEmail(userEmail);
      } else {
        navigate("/create");
      }
    }
  }, [location, navigate]);

  const handleChange = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setCode(cleaned);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (code.length !== 6) {
      setError("Please enter the 6-character verification code.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/verify-2fa",
        {
          code: code,
          email: email
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        login(response.data.user);
        navigate('/dashboard');
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      if (error.response) {
        setError(error.response.data.message || "Verification failed");
      } else if (error.request) {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/create");
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/send-2fa-code",
        {
          email: email
        }
      );

      if (response.data.success) {
        alert("New verification code sent to your email!");
      } else {
        setError(response.data.message || "Failed to resend code");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      if (error.response) {
        setError(error.response.data.message || "Failed to resend code");
      } else {
        setError("Failed to resend code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="two-step-root">
      <div className="two-step-card">
        <h1 className="two-step-title">Two-Step Verification</h1>
        <p className="two-step-text">
          To <strong>finish logging in</strong>, please enter the 6-character
          verification code below.
        </p>

        <form className="two-step-form" onSubmit={handleSubmit}>
          <EditableLineWithChip
            label="Verification Code"
            value={code}
            onChange={handleChange}
            placeholder="Enter 6-character code"
          />

          {error && <div className="two-step-error">{error}</div>}

          <div className="two-step-buttons">
            <button
              type="button"
              className="two-step-btn secondary"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
            <button type="submit" className="two-step-btn primary">
              Verify &amp; Log In
            </button>
          </div>
        </form>

        <button
          type="button"
          className="two-step-resend"
          onClick={() => alert("Resend code (demo only).")}
        >
          Didn&apos;t get a code? Resend
        </button>
      </div>
    </div>
  );
}

/** Big text box with lock + check, like Account Settings personal info */
function EditableLineWithChip({ label, value, onChange, placeholder }) {
  const confirmed = !!(value && value.trim().length === 6);

  const handleInput = (e) => {
    const raw = e.currentTarget.textContent || "";
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    e.currentTarget.textContent = cleaned;
    onChange(cleaned);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="lc-wrap">
        <div
          className="editable-line editable-line--big"
          contentEditable
          role="textbox"
          aria-label={label}
          data-placeholder={placeholder || ""}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
        >
          {value}
        </div>
        <span className={`lc ${confirmed ? "confirmed" : ""}`} aria-hidden>
          <LockCheckIcon checked={confirmed} />
        </span>
      </div>
    </div>
  );
}

function LockCheckIcon({ checked }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
      {checked ? <path d="M8 15l3 3 5-5" /> : null}
    </svg>
  );
}
