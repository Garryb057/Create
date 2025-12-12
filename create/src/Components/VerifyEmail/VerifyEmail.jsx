import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../App";
import "./VerifyEmail.css";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
      console.log("Email retrieved from location state:", location.state.email);
    } 
    else {
      const storedEmail = localStorage.getItem('unverifiedEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        console.log("Email retrieved from localStorage:", storedEmail);
      } else {
        setError("No email found. Please register again.");
        setTimeout(() => {
          navigate("/register");
        }, 3000);
        return;
      }
    }

    const codeFromURL = searchParams.get('code');
    if (codeFromURL) {
      const cleanedCode = codeFromURL.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      setCode(cleanedCode);
      
      const emailToVerify = location.state?.email || localStorage.getItem('unverifiedEmail');
      if (emailToVerify) {
        handleAutoVerification(cleanedCode, emailToVerify);
      }
    }
  }, [searchParams, navigate, location]);

  const handleAutoVerification = async (verificationCode, userEmail) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/verify-email', {
        token: verificationCode,
        email: userEmail
      });

      if (response.data.success) {
        setSuccess("✅ Email verified successfully! Logging you in...");
        
        localStorage.removeItem('unverifiedEmail');
        
        await performAutoLogin(userEmail);
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (error) {
      console.error("Auto-verification error:", error);
      setError(error.response?.data?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const performAutoLogin = async (userEmail) => {
    try {
      const response = await axios.get('http://localhost:5000/api/check-auth', {
        withCredentials: true
      });

      if (response.data.authenticated && response.data.user) {
        login(response.data.user);
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Auto-login error:", error);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

   const handleChange = (value) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCode(cleaned);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError("Please enter the complete 6-character verification code.");
      return;
    }

    if (!email) {
      setError("Email not found. Please register again.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const response = await axios.post('http://localhost:5000/api/verify-email', {
        token: code,
        email: email
      });

      if (response.data.success) {
        setSuccess("✅ Email verified successfully! Logging you in...");
        
        localStorage.removeItem('unverifiedEmail');
        
        await performAutoLogin(email);
      } else {
        setError(response.data.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    // Validate email is available
    if (!email) {
      setError("No email found. Please register again.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Request new verification code from backend
      const response = await axios.post('http://localhost:5000/api/send-verification', {
        email: email
      });

      if (response.data.success) {
        setSuccess("✅ New verification code sent! Please check your email.");
        setCode(""); // Clear the code input field
      } else {
        setError(response.data.message || "Failed to resend code");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      setError(error.response?.data?.message || "Failed to resend verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('unverifiedEmail');
    navigate("/");
  };

  return (
    <div className="two-step-root">
      <div className="two-step-card">
        {/* Header */}
        <h1 className="two-step-title">Verify Your Account</h1>
        
        {/* Display email being verified - Bootstrap alert */}
        {email && (
          <div className="alert alert-info mb-3" role="alert">
            <strong>Verifying:</strong> {email}
          </div>
        )}
        
        {/* Instructions */}
        <p className="two-step-text">
          Please enter the <strong>6-character verification code</strong> that was sent to your email address.
          You can also click the verification link in your email to automatically verify.
        </p>

        {/* Success message - Bootstrap alert */}
        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        {/* Error message - Bootstrap alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Verification form */}
        <form className="two-step-form" onSubmit={handleSubmit}>
          {/* Verification code input field */}
          <EditableLineWithChip
            label="Verification Code"
            value={code}
            onChange={handleChange}
            placeholder="Enter 6-character code"
          />

          {/* Action buttons - Bootstrap buttons */}
          <div className="two-step-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBackToLogin}
              disabled={isLoading}
            >
              Back to Login
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>
        </form>

        {/* Resend code button - Bootstrap button */}
        <div className="text-center mt-3">
          <button
            type="button"
            className="btn btn-link"
            onClick={handleResendCode}
            disabled={isLoading}
          >
            Didn't receive a code? <strong>Resend</strong>
          </button>
        </div>

        {/* Help text - Bootstrap alert */}
        <div className="alert alert-light mt-3" role="alert">
          <small>
            <strong>💡 Tip:</strong> Check your spam folder if you don't see the email. 
            The verification code expires in 24 hours.
          </small>
        </div>
      </div>
    </div>
  );
}

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
    <div className="field mb-4">
      <label className="form-label"><strong>{label}</strong></label>
      <div className="lc-wrap">
        {/* Editable div acting as input field */}
        <div
          className="editable-line editable-line--big form-control"
          contentEditable
          role="textbox"
          aria-label={label}
          data-placeholder={placeholder || ""}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
          style={{
            fontSize: '28px',
            letterSpacing: '6px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textTransform: 'uppercase'
          }}
        >
          {value}
        </div>
        {/* Lock/check icon indicator */}
        <span className={`lc ${confirmed ? "confirmed" : ""}`} aria-hidden="true">
          <LockCheckIcon checked={confirmed} />
        </span>
      </div>
      {/* Character counter */}
      <small className="text-muted">
        {value.length}/6 characters entered
      </small>
    </div>
  );
}

function LockCheckIcon({ checked }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '24px', height: '24px' }}
    >
      {/* Lock shape */}
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
      {/* Check mark appears when code is complete */}
      {checked ? <path d="M8 15l3 3 5-5" /> : null}
    </svg>
  );
}