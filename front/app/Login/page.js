"use client"
import React, { useState } from 'react'


function handleLogin() {
    // Handle login logic here
    console.log("Login button clicked");
}

export default function Login(){
    const[email, setEmail] = useState('')
    const[password, setPassword] = useState('')
    return(
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 m-4">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-2 p-2 border border-gray-300 rounded"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-2 p-2 border border-gray-300 rounded"
            />
            <button className="bg-blue-500 text-white p-2 rounded" onClick={handleLogin}>
                Login   
            </button>
        </div>
    )
}