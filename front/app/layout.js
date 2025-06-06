// layout.js or _app.js (depending on your Next.js version)
"use client"

import { AuthProvider } from "./hooks/useAuth"; // Update this path
import "./globals.css"; // Your global styles

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}