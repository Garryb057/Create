import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";
import budget_icon from '../Assets/budget_app_figma_logo.png';

const Register = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.fname || !formData.fname.trim()) errs.fname = "First name is required.";
    if (!formData.lname || !formData.lname.trim()) errs.lname = "Last name is required.";
    if (!formData.email || !formData.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/))
      errs.email = "Invalid email format.";
    if (!formData.phoneNumber || !formData.phoneNumber.match(/^\d{10}$/)) 
      errs.phoneNumber = "Phone must be 10 digits.";
    if (formData.password && formData.password.length < 4) 
      errs.password = "Password must be at least 4 characters.";
    if (formData.password !== formData.confirmPassword) 
      errs.confirmPassword = "Passwords don't match!";
    
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccess("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/register',
        {
          fname: formData.fname,
          lname: formData.lname,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        setSuccess("Registration successful! Redirecting to verification...");
        
        localStorage.setItem('unverifiedEmail', formData.email);
        
        setTimeout(() => {
          navigate("/verify", { 
            state: { 
              email: formData.email 
            }
          });
        }, 2000);
      } else {
        setErrors({ submit: response.data.message });
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        setErrors({ submit: error.response.data.message || "Registration failed" });
      } else if (error.request) {
        setErrors({ submit: "Cannot connect to server. Please try again later."});
      } else {
        setErrors({ submit: "An unexpected error occurred." });
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="register-root">
      {/* Page Header */}
      <div className="register-header">Register Account</div>
      
      <div className="register-content">
        {/* Registration Form */}
        <form className="register-form" onSubmit={handleSubmit}>
          {/* Success message - Bootstrap alert */}
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}
          
          {/* Submit error message - Bootstrap alert */}
          {errors.submit && (
            <div className="alert alert-danger" role="alert">
              {errors.submit}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="section-title">Personal Information:</div>
          
          {/* First Name and Last Name Row */}
          <div className="form-row">
            {/* First Name Input */}
            <div className="input-group">
              <label>First Name<span className="required-star">*</span>:</label>
              <input
                name="fname"
                type="text"
                value={formData.fname}
                onChange={handleChange}
                className={errors.fname ? "error-field" : ""}
                required
              />
              {errors.fname && <div className="error-message">{errors.fname}</div>}
            </div>
            
            {/* Last Name Input */}
            <div className="input-group">
              <label>Last Name<span className="required-star">*</span>:</label>
              <input
                name="lname"
                type="text"
                value={formData.lname}
                onChange={handleChange}
                className={errors.lname ? "error-field" : ""}
                required
              />
              {errors.lname && <div className="error-message">{errors.lname}</div>}
            </div>
          </div>

          {/* Email and Phone Number Row */}
          <div className="form-row">
            {/* Email Input */}
            <div className="input-group">
              <label>Email Address<span className="required-star">*</span>:</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "error-field" : ""}
                required
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            {/* Phone Number Input */}
            <div className="input-group">
              <label>Phone Number<span className="required-star">*</span>:</label>
              <input
                name="phoneNumber"
                type="text"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={errors.phoneNumber ? "error-field" : ""}
                placeholder="10 digits"
                maxLength={10}
                required
              />
              {errors.phoneNumber && <div className="error-message">{errors.phoneNumber}</div>}
            </div>
          </div>

          {/* Security Section */}
          <div className="section-title">Security:</div>
          
          {/* Password and Confirm Password Row */}
          <div className="form-row">
            {/* Password Input */}
            <div className="input-group">
              <label>Password<span className="required-star">*</span>:</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error-field" : ""}
                placeholder="Minimum 4 characters"
                required
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            {/* Confirm Password Input */}
            <div className="input-group">
              <label>Confirm Password<span className="required-star">*</span>:</label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "error-field" : ""}
                required
              />
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>
          </div>

          {/* Submit Button - Bootstrap button */}
          <button 
            type="submit" 
            className="register-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          
          {/* Link to Login Page - Bootstrap button */}
          <div className="text-center mt-3">
            <button 
              type="button" 
              className="btn btn-link"
              onClick={() => navigate("/")}
            >
              Already have an account? Login here
            </button>
          </div>
        </form>
        
        {/* Logo and Branding Section */}
        <div className="register-logo-container">
          <img src={budget_icon} alt="Budget App Logo" className="register-logo"/>
          <div className="register-logo-text">
            <strong>Budget App<br/>Task Failed Successfully</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;