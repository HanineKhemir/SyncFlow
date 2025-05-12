'use client';

import { useState } from 'react';
import styles from './users.module.css';

// Mock user data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 3, name: 'Robert Johnson', email: 'robert@example.com', role: 'Editor', status: 'Inactive' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'User', status: 'Active' },
  { id: 5, name: 'Michael Brown', email: 'michael@example.com', role: 'User', status: 'Pending' },
  { id: 6, name: 'Emma Davis', email: 'emma@example.com', role: 'Admin', status: 'Active' },
  { id: 7, name: 'David Wilson', email: 'david@example.com', role: 'Editor', status: 'Active' },
  { id: 8, name: 'Olivia Taylor', email: 'olivia@example.com', role: 'User', status: 'Inactive' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roles = [...new Set(users.map(user => user.role))];

  return (
    <div className={styles.usersContainer}>
      <header className={styles.header}>
        <h1>USERS MANAGEMENT</h1>
        <p>Manage your application users</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input 
            type="text"
            placeholder="Search users..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.filterContainer}>
          <select 
            className={styles.roleFilter}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <div className={styles.userCardsGrid}>
          {filteredUsers.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.userName}>{user.name}</h2>
                <span className={`${styles.statusBadge} ${styles[user.status.toLowerCase()]}`}>
                  {user.status}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.userInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>EMAIL</span>
                    <span className={styles.infoValue}>{user.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ROLE</span>
                    <span className={`${styles.badge} ${styles[user.role.toLowerCase()]}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.cardFooter}>
                <button className={styles.editButton}>EDIT</button>
                <button className={styles.deleteButton}>DELETE</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>No users found</div>
      )}
    </div>
  );
}