'use client'
import { ApolloProvider } from "@apollo/client";
import Sidebar from "../components/sidebar/Sidebar";
import "./admin.css";
import client from "@/lib/apollo-client";
import { AuthProvider } from "../hooks/useAuth";

export default function AdminLayout({ children }) {
  return (
    <AuthProvider>
    <ApolloProvider client={client}>
    <div className="admin-layout">
      <aside className="sidebar">
        <Sidebar/>
      </aside>
      <div className="main-content">
        {children}
      </div>
    </div>
    </ApolloProvider>
    </AuthProvider>
  );
}