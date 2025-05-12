'use client'
import { useState } from 'react';
import Head from 'next/head';
import styles from './settings.module.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Settings | My App</title>
        <meta name="description" content="User settings page" />
      </Head>

      <h1 className={styles.heading}>Settings</h1>

      <div className={styles.settingsLayout}>
        {/* Navigation sidebar */}
        <nav className={styles.settingsNav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <button
                className={`${styles.navLink} ${activeTab === 'profile' ? styles.activeNavLink : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
            </li>
            <li className={styles.navItem}>
              <button
                className={`${styles.navLink} ${activeTab === 'account' ? styles.activeNavLink : ''}`}
                onClick={() => setActiveTab('account')}
              >
                Account
              </button>
            </li>
            <li className={styles.navItem}>
              <button
                className={`${styles.navLink} ${activeTab === 'notifications' ? styles.activeNavLink : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
            </li>
          </ul>
        </nav>

        {/* Content area */}
        <div className={styles.settingsContent}>
          {activeTab === 'profile' && (
            <div>
              <h2 className={styles.sectionTitle}>Profile Settings</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.photoSection}>
                  <div className={styles.avatar}>
                    JD
                  </div>
                  <div className={styles.uploadButtons}>
                    <button type="button" className={styles.button}>Upload Photo</button>
                    <button type="button" className={`${styles.button} ${styles.dangerButton}`}>Remove</button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="name">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={styles.input}
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    className={styles.textarea}
                    value={formData.bio}
                    onChange={handleInputChange}
                  />
                </div>

                <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className={styles.sectionTitle}>Account Settings</h2>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Password</h3>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={styles.input}
                  />
                </div>
                <button className={`${styles.button} ${styles.primaryButton}`}>
                  Update Password
                </button>
              </div>

              <div className={styles.deleteSection}>
                <h3 className={styles.deleteTitle}>Delete Account</h3>
                <p className={styles.deleteWarning}>
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
                <button className={`${styles.button} ${styles.dangerButton}`}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className={styles.sectionTitle}>Notification Settings</h2>
              <div className={styles.notificationsList}>
                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h3 className={styles.notificationTitle}>Email Notifications</h3>
                    <p className={styles.notificationDescription}>
                      Receive email updates about account activity
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" className={styles.toggleInput} defaultChecked />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.notificationItem}>
                  <div className={styles.notificationInfo}>
                    <h3 className={styles.notificationTitle}>Push Notifications</h3>
                    <p className={styles.notificationDescription}>
                      Receive push notifications on your devices
                    </p>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" className={styles.toggleInput} />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <button className={`${styles.button} ${styles.primaryButton}`}>
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}