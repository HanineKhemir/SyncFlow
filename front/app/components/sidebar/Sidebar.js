'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Sidebar.module.css';
import {
  Users, Home, Settings, ListTodo, ChevronLeft, ChevronRight,
  CalendarDays, MessageCircle, NotebookPen, History, LogOut
} from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';


const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      

      <nav className={styles.nav}>
        <ul>
          <li className={styles.navItem}>
            <Link href="/dashboard" className={styles.navLink}>
              <Home size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Dashboard</span>}
            </Link>
          </li>

          {user?.role === 'manager' && (
            <li className={styles.navItem}>
              <Link href="/dashboard/users" className={styles.navLink}>
                <Users size={20} className={styles.icon} />
                {!collapsed && <span className={styles.text}>Members</span>}
              </Link>
            </li>
          )}

          <li className={styles.navItem}>
            <Link href="/dashboard/calendar" className={styles.navLink}>
              <CalendarDays size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Calendar</span>}
            </Link>
          </li>

          <li className={styles.navItem}>
            <Link href="/dashboard/chat" className={styles.navLink}>
              <MessageCircle size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Chat</span>}
            </Link>
          </li>

          <li className={styles.navItem}>
            <Link href="/dashboard/notes" className={styles.navLink}>
              <NotebookPen size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Notes</span>}
            </Link>
          </li>

          {user?.role === 'manager' && (
            <li className={styles.navItem}>
              <Link href="/dashboard/history" className={styles.navLink}>
                <History size={20} className={styles.icon} />
                {!collapsed && <span className={styles.text}>History</span>}
              </Link>
            </li>
          )}

          <li className={styles.navItem}>
            <Link href="/dashboard/taches" className={styles.navLink}>
              <ListTodo size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>tasks</span>}
            </Link>
          </li>

          {/* 🔒 Logout button */}
          <li className={styles.navItem} onClick={handleLogout}>
            <div className={styles.navLink} role="button">
              <LogOut size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Logout</span>}
            </div>
          </li>
        </ul>
      </nav>

      <div className={styles.collapseBtn} onClick={toggleSidebar}>
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </div>
    </div>
  );
};

export default Sidebar;
