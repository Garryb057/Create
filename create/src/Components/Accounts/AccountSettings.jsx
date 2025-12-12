import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../App"
import axiosInstance from "../../axiosConfig"
import "./AccountSettings.css";
import budgetLogo from "../Assets/budget_app_figma_logo.png"; 

function AccountSettings() {
  const { user } = useContext(AuthContext);

  // toggles
  const [notificationSettings, setNotificationSettings] = useState({
    security_alerts: { push: true, email: true, sms: true },
    transaction_alerts: { push: true, email: true, sms: false },
    marketing: { push: false, email: true, sms: false },
    statements: { push: false, email: true, sms: false }
  });

  // changeable text values
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: ''});

  useEffect(() => {
    fetchAccountSettings();
  }, [])

  useEffect(() => {
    if (user) {
      const fullName = `${user.fname || ''} ${user.lname || ''}`.trim();
      setLegalName(fullName);
      setAccountEmail(user.email || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  const fetchAccountSettings = async () => {
    try {
      setLoading(true);
      const profileResponse = await axiosInstance.get('/account-settings');
      const notificationResponse = await axiosInstance.get('/notification-settings');

      if (profileResponse.data.success) {
        const userData = profileResponse.data.user;
        const fullName = `${userData.fname || ''} ${userData.lname || ''}`.trim();

        setLegalName(fullName);
        setAccountEmail(userData.email || '');
        setPhone(userData.phoneNumber || '');

        if (profileResponse.data.notificationSettings) {
          setTwoFactor(profileResponse.data.notificationSettings.twoFactor || false);
        }
      }
      if (notificationResponse.data.success) {
        setNotificationSettings(notificationResponse.data.settings);
      }
    } catch (error) {
      console.error('Error fetching account settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load account settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (category, channel, enabled) => {
    setNotificationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: enabled
      }
    }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const profilePayload = {
        legalName,
        phone,
        accountEmail,
        twoFactor,
      };

      const profileResponse = await axiosInstance.put('/account-settings', profilePayload);

      const notificationPayload = {
        category_updates: notificationSettings
      };

      const notificationResponse = await axiosInstance.put('/notification-settings', notificationPayload);

      if (profileResponse.data.success && notificationResponse.data.success) {
        setMessage({
          type: 'success',
          text: 'Account settings updated successfully!'
        });

        setTimeout(() => {
          setMessage({ type: '', text: ''});
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to update settings'
        });
      }
    } catch (error) {
      console.error('Error updating account settings:', error);
      const errorMessage = error.response?.data?.message || "Failed to update account settings";
      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplayName = (category) => {
    const names = {
      security_alerts: 'Security Alerts',
      transaction_alerts: 'Transactions Alerts',
      marketing: 'Marketing',
      statements: 'Statements'
    };
    return names[category] || category;
  };

  return (
    <div className="settings">
      <div className="settings-card">
        <header className="settings-header">
          <img src={budgetLogo} alt="Budget logo" className="settings-logo" />
          <h1><mark>Account Settings</mark></h1>
        </header>
        <div className="highlight" />

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-4`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="text-center mb-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        <form className="settings-grid" onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <section className="panel panel-green">
            <h2 className="panel-title">Personal Information</h2>

            <EditableLineWithChip
              label="Legal Name"
              value={legalName}
              onChange={setLegalName}
              placeholder="First Last"
            />
            <EditableLineWithChip
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              placeholder="(555) 555-5555"
            />
          </section>

          {/* Notification Section */}
          <section className="panel panel-green">
            <h2 className="panel-title">Notification Preferences</h2>
            
            {Object.entries(notificationSettings).map(([category, channels]) => (
              <div key={category} className="notification-category">
                <h4 className="category-title">{getCategoryDisplayName(category)}</h4>
                
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={channels.push}
                    onChange={(e) => handleNotificationChange(category, 'push', e.target.checked)}
                    disabled={category === 'security_alerts' && channels.push} // Security alerts push is immutable
                  />
                  <span className="switch" />
                  <span className="toggle-text">Push notifications</span>
                </label>

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => handleNotificationChange(category, 'email', e.target.checked)}
                  />
                  <span className="switch" />
                  <span className="toggle-text">Email notifications</span>
                </label>

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={(e) => handleNotificationChange(category, 'sms', e.target.checked)}
                  />
                  <span className="switch" />
                  <span className="toggle-text">SMS notifications</span>
                </label>
              </div>
            ))}
          </section>

          {/* Password & Security Section*/}
          <section className="panel panel-green">
            <h2 className="panel-title">Password &amp; Security</h2>

            <EditableLineWithChip
              label="Email Address"
              value={accountEmail}
              onChange={setAccountEmail}
              placeholder="you@example.com"
            />
          </section>

          {/* Privacy Settings Section */}
          <section className="panel panel-green">
            <h2 className="panel-title">Privacy Settings</h2>

            <label className="toggle">
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
              />
              <span className="switch" />
              <span className="toggle-text">Two-Factor Authentication</span>
            </label>
          </section>

          {/* Actions */}
          <div className="settings-actions">
            <button className="btn btn-ghost" type="button" onClick={() => window.history.back()}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** shows lock check based on content */
function EditableLineWithChip({ label, value, onChange, placeholder, multiline = false }) {
  const confirmed = !!(value && value.trim());

  const handleInput = (e) => onChange(e.currentTarget.textContent || "");
  const handleKeyDown = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="lc-wrap">
        <div
          className={`editable-line ${multiline ? "editable-line--multiline" : ""}`}
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
        <span className={`lc ${multiline ? "multiline" : ""} ${confirmed ? "confirmed" : ""}`} aria-hidden>
          <LockCheckIcon checked={confirmed} />
        </span>
      </div>
    </div>
  );
}

function LockCheckIcon({ checked }) {
  // shows a check when field has content
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
      {checked ? <path d="M8 15l3 3 5-5" /> : null}
    </svg>
  );
}

export default AccountSettings;