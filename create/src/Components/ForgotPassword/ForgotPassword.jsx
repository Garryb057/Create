import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css";
import budget_icon from "../Assets/budget_app_figma_logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("request"); // 'request', 'reset'
  const [searchParams] = useSearchParams();
  const [resetToken, setResetToken] = useState(searchParams.get("token") || "");
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setResetToken(token);
      verifyResetToken(token);
    }
  }, [searchParams]);

  const verifyResetToken = async (token) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/verify-reset-token",
        { token },
        { withCredentials: true }
      );

      if (response.data.success) {
        setStep("reset");
        setMessage("Token verified. Please enter your new password.");
      } else {
        setMessage(response.data.message || "Invalid reset token");
      }
    } catch (error) {
      console.error("Token verification error:", error);
      setMessage(
        error.response?.data?.message ||
          "Error verifying reset token. Please request a new reset link."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailPattern.test(email)) {
      setMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/forgot-password",
        { email },
        { withCredentials: true }
      );

      if (response.data.success) {
        setMessage(response.data.message);
      } else {
        setMessage(response.data.message || "Failed to process reset request.");
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      setMessage(
        error.response?.data?.message ||
          "An error occurred. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    // Validation
    if (!newPassword || !confirmPassword) {
      setMessage("Please fill out all fields.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password must match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/reset-password",
        {
          token: resetToken,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setMessage(response.data.message);
        setTimeout(() => {
          navigate("/create");
        }, 3000);
      } else {
        setMessage(response.data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage(
        error.response?.data?.message ||
          "An error occurred while resetting password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/create");
  };

  return (
    <div className="forgot-root">
      <div className="forgot-card">
        <img src={budget_icon} alt="Budget App Logo" className="forgot-logo" />

        {step === "request" ? (
          <>
            <h1 className="forgot-title">Reset Your Password</h1>
            <p className="forgot-text">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <form className="forgot-form" onSubmit={handleRequestReset}>
              <label className="forgot-label">
                Email Address
                <input
                  type="email"
                  className="forgot-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              {message && <div className="forgot-message">{message}</div>}

              <div className="forgot-buttons">
                <button
                  type="button"
                  className="forgot-btn secondary"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                >
                  Back to Login
                </button>

                <button
                  type="submit"
                  className="forgot-btn primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="forgot-title">Create New Password</h1>
            <p className="forgot-text">
              Please enter your new password below.
            </p>

            <form className="forgot-form" onSubmit={handleResetPassword}>
              <label className="forgot-label">
                New Password
                <input
                  type="password"
                  className="forgot-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                  minLength="6"
                />
              </label>

              <label className="forgot-label">
                Confirm New Password
                <input
                  type="password"
                  className="forgot-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                  minLength="6"
                />
              </label>

              {message && <div className="forgot-message">{message}</div>}

              <div className="forgot-buttons">
                <button
                  type="button"
                  className="forgot-btn secondary"
                  onClick={() => {
                    setStep("request");
                    setMessage("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={isLoading}
                >
                  Back
                </button>

                <button
                  type="submit"
                  className="forgot-btn primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}