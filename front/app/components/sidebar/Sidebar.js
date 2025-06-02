'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import { Users, Home, Settings, ListTodo, ChevronLeft, ChevronRight, UsersRound, CalendarDays, MessageCircle, NotebookPen, History } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <h2>{!collapsed && 'Logo'}</h2>
      </div>
      
      <nav className={styles.nav}>
        <ul>
          {user?.role === 'manager' && (
          <li className={styles.navItem}>
            <Link href="/dashboard" className={styles.navLink}>
              <Home size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Dashboard</span>}
            </Link>
          </li>
          )}
          {/* Show Members only to admin */}
          
            
            <li className={styles.navItem}>
              <Link href="/dashboard/users" className={styles.navLink}>
                <Users size={20} className={styles.icon} />
                {!collapsed && <span className={styles.text}>Members</span>}
              </Link>
            </li>
          
          
          <li className={styles.navItem}>
            <Link href="/dashboard/teams" className={styles.navLink}>
              <UsersRound size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Teams</span>}
            </Link>
          </li>
          
          <li className={styles.navItem}>
            <Link href="/dashboard/calendar" className={styles.navLink}>
              <CalendarDays size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Calendar</span>}
            </Link>
          </li>
          
          
          
          <li className={styles.navItem}>
            <Link href="/" className={styles.navLink}>
              <MessageCircle size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Chat</span>}
            </Link>
          </li>
          
          <li className={styles.navItem}>
            <Link href="/" className={styles.navLink}>
              <NotebookPen size={20} className={styles.icon} />
              {!collapsed && <span className={styles.text}>Notes</span>}
            </Link>
          </li>
          
          {/* Show History only to admin */}
          {user?.role === 'manager' && (
            <li className={styles.navItem}>
              <Link href="/" className={styles.navLink}>
                <History size={20} className={styles.icon} />
                {!collapsed && <span className={styles.text}>History</span>}
              </Link>
            </li>
          )}
          
          {/* Show Taches only to non-managers */}
          {user?.role !== 'manager' && (
            <li className={styles.navItem}>
              <Link href="/" className={styles.navLink}>
                <ListTodo size={20} className={styles.icon} />
                {!collapsed && <span className={styles.text}>Taches</span>}
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      <div className={styles.collapseBtn} onClick={toggleSidebar}>
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </div>
    </div>
  );
};

export default Sidebar;