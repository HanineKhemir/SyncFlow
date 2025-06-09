'use client'
import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <Link href="/">
            <span className={styles.logoText}>SyncFlow</span>
          </Link>
        </div>
        <div className={styles.authSection}>
          <Link href="/Login">
            <button className={styles.signInButton}>Sign In</button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;