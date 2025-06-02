"use client"
import React, { useState } from 'react'
import "../auth.css"
import Link from "next/link"

export default function Signup() {
  const [companyName, setCompanyName] = useState('');
  const [managerUsername, setManagerUsername] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [companyCode, setCompanyCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/company/create-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          managerUsername,
          managerPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // If successful, show the company code in modal
      setCompanyCode(data.code);
      setShowModal(true);
      
      // Reset form
      setCompanyName('');
      setManagerUsername('');
      setManagerPassword('');

    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="title">Company Sign Up</h2>
        
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Manager Username</label>
          <input
            type="text"
            value={managerUsername}
            onChange={(e) => setManagerUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Manager Password</label>
          <input
            type="password"
            value={managerPassword}
            onChange={(e) => setManagerPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button">
          Register Company
        </button>
        <div className="no-account">
          <p>
            Already have an account? <Link href="/Login">Login</Link>
          </p>
        </div>
      </form>
      <div className="logo-container">
        <img src="/Login.jpg" alt="Logo" className="logo" />
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Registration Successful!</h2>
            <p>Your company has been registered successfully.</p>
            <p>Your company code is: <strong>{companyCode}</strong></p>
            <p>Please keep this code safe as you'll need it for future reference.</p>
            <button onClick={closeModal} className="login-button">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}