import React from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>Logo</h2>
      </div>
      <nav className={styles.nav}>
        <ul>
          <li className={styles.navItem}>
            <Link href="/" className={styles.navLink}>
              <span className={styles.text}>1</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/about" className={styles.navLink}>
              <span className={styles.text}>2</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/services" className={styles.navLink}>
              
              <span className={styles.text}>3</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/contact" className={styles.navLink}>
              <span className={styles.text}>4</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;