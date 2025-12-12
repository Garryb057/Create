import React, { useState, useContext } from "react";
import { useNavigate }  from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../App";
import "./Create.css";

import email_icon from '../Assets/email.jpg'
import password_icon from '../Assets/password.png'
import budget_icon from '../Assets/budget_app_figma_logo.png'

const Create = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await axios.post(
                'http://localhost:5000/api/login',
                {
                    email: formData.email,
                    password: formData.password
                },
                {
                    withCredentials: true
                }
            );

            if (response.data.success) {
                if (response.data.twoFactorRequired) {
                    navigate("/verify", { state: { email: formData.email }});
                } else {
                    login(response.data.user);
                    navigate("/dashboard");
                }
            } else {
                setError(response.data.message || "Login failed");
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response) {
                setError(error.response.data.message || "Login failed");
            } else if (error.request) {
                setError("Cannot connect to server. Please try again later.");
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = () => {
        navigate("/register"); 
    };

    return (
        <div className="auth"> 
            <aside className="auth-media">   
                <img src={budget_icon} alt="Welcome" />
            </aside>
            
            <div className="container">
                <div className="header">
                    <div className="text">
                        <mark>Login</mark>
                    </div>
                    <div className="highlight"></div>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input">
                        <img className="icon" src={email_icon} alt="Email" />
                        <input 
                            type="email" 
                            name="email"
                            placeholder="Email" 
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input">
                        <img className="icon" src={password_icon} alt="Password" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="forgot-password">
                        Forgot Password?{" "}
                        <button className="link" type="button" onClick={() => navigate("/forgot-password")}>CLICK HERE!</button>
                    </div>

                    <div className="submit-container">
                        <button 
                            className="submit" 
                            type="submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Submit'}
                        </button>

                        <div className="register group">
                            <span className="hint">Don't have an account?</span>
                            <button 
                                className="register-btn" 
                                type="button" 
                                onClick={handleRegister}
                                disabled={isLoading}
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </form>
            </div>
               
            <aside className="auth-right">
                <strong>Welcome! To Task Failed Successfully Budget App.</strong>
            </aside>
        </div>
    );
};

export default Create;