"use client"
import React, { useState } from 'react'
import axios from 'axios'
import "../auth.css"
import Link from "next/link"
import { useRouter } from 'next/navigation'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        username,
        password,
        companyCode
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
         withCredentials: true
      })

      // Success - handle token & redirect
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      router.push('/dashboard/users')

    } catch (err) {
      // Axios wraps errors, so we check for response data
      setError(err.response?.data?.message || 'Login failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="title">Login</h2>
        
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Company Code</label>
          <input
            type="text"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            required
            minLength={3}
          />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            minLength={6}
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
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
  )
}