"use client"
import React, { useState } from 'react'
import "../auth.css"
import Link from "next/link"


function handleLogin() {
  console.log("Login button clicked");
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="login-container">
    <form className="login-form" onSubmit={handleLogin}>
      <h2 className= "title"> Login</h2>
<div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="login-button">
        Login
      </button>
      <div className="no-account">
        <p>
          Don't have an account? <Link href="/Signup">Sign up here</Link>
        </p>
      </div>
    </form>
    <div className="logo-container">
        <img src="/Login.jpg" alt="Logo" className="logo" />
      </div>
  </div>
  );
}
