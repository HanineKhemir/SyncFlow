'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import axios from 'axios';
import styles from './users.module.css';
import { useAuth } from '../../hooks/useAuth';
import {
  GET_USERS,
  DELETE_USER_MUTATION,
  RECOVER_USER_MUTATION,
  GET_USERS_BY_COMPANY
} from '@/app/graphql/user';

export default function UsersPage() {
  const { user, token, isManager } = useAuth(); // Add isManager here
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    role: 'USER'
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Debug logs
  console.log('🔍 Debug Info:');
  console.log('User:', user);
  console.log('Token:', token ? 'Token exists' : 'No token');
  console.log('Company ID:', companyId);

  useEffect(() => {
    console.log('🔄 useEffect triggered, user:', user);
    if (user?.company?.id) {
      console.log('✅ Setting company ID:', user.company.id);
      setCompanyId(user.company.id);
    } else {
      console.log('❌ No company ID found in user object');
      console.log('User structure:', JSON.stringify(user, null, 2));
    }
  }, [user]);

  // Query to get users
  const { data, loading, error, refetch } = useQuery(GET_USERS_BY_COMPANY, {
    skip: !token || !companyId, // Skip query if not authenticated or no companyId
    variables: {
      companyId: companyId
    },
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    errorPolicy: 'all',
    onCompleted: (data) => {
      console.log('✅ Query completed successfully:', data);
    },
    onError: (error) => {
      console.log('❌ Query error:', error);
    }
  });

  console.log('📊 Query Status:');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Data:', data);
  console.log('Skip query?', !token || !companyId);

  // Mutations
  const [deleteUser] = useMutation(DELETE_USER_MUTATION, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    refetchQueries: [{
      query: GET_USERS_BY_COMPANY,
      variables: {
        companyId: companyId
      }
    }],
    onCompleted: () => {
      alert('User deleted successfully');
    },
    onError: (error) => {
      alert('Failed to delete user: ' + error.message);
    }
  });

  const [recoverUser] = useMutation(RECOVER_USER_MUTATION, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    refetchQueries: [{
      query: GET_USERS_BY_COMPANY,
      variables: {
        companyId: companyId
      }
    }],
    onCompleted: () => {
      alert('User recovered successfully');
    },
    onError: (error) => {
      alert('Failed to recover user: ' + error.message);
    }
  });

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser({
        variables: { id: userId.toString() }
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleRecoverUser = async (userId) => {
    try {
      await recoverUser({
        variables: { id: userId.toString() }
      });
    } catch (err) {
      console.error('Recover error:', err);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    if (companyId) {
      refetch({
        companyId: companyId
      });
    } else {
      console.log('❌ Cannot refresh: no company ID');
    }
  };

  // Handle Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);

    try {
      const response = await axios.post(
        'http://localhost:3000/auth/create-user',
        {
          username: newUserData.username,
          password: newUserData.password,
          role: newUserData.role,
          companyId: companyId // Include company ID if needed
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ User created successfully:', response.data);
      alert('User created successfully!');
      
      // Reset form and close modal
      setNewUserData({
        username: '',
        password: '',
        role: 'USER'
      });
      setShowAddUserModal(false);
      
      // Refresh the users list
      handleRefresh();
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create user';
      alert('Error creating user: ' + errorMessage);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Transform and filter users - FIX THE DATA PATH
  const transformedUsers = data?.usersByCompany ? data.usersByCompany.map(user => ({
    id: user.id,
    name: user.username,
    email: `${user.username}@company.com`, // Generate email or add to backend
    role: user.role,
    status: user.deletedAt ? 'Inactive' : 'Active',
    company: user.company?.name || 'No Company',
    deletedAt: user.deletedAt
  })) : [];

  console.log('🔄 Transformed users:', transformedUsers);

  const filteredUsers = transformedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    const matchesStatus = showDeleted ? user.status === 'Inactive' : user.status === 'Active';
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roles = [...new Set(transformedUsers.map(user => user.role))];

  // Show loading spinner
  if (loading) {
    return (
      <div className={styles.usersContainer}>
        <div className={styles.loading}>Loading users...</div>
      </div>
    );
  }

  // Show error message
  if (error && !data) {
    console.log('💥 Rendering error state:', error.message);
    return (
      <div className={styles.usersContainer}>
        <div className={styles.error}>
          Error: {error.message}
          <button onClick={handleRefresh} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show if not authenticated
  if (!token) {
    return (
      <div className={styles.usersContainer}>
        <div className={styles.error}>
          Please log in to view users.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.usersContainer}>
      <header className={styles.header}>
        <div>
          <h1>USERS MANAGEMENT</h1>
          <p>Manage your application users</p>
        </div>
        <div className={styles.headerActions}>
          {isManager && (
            <button 
              className={styles.addButton}
              onClick={() => setShowAddUserModal(true)}
            >
              + ADD USER
            </button>
          )}
        </div>
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

      {/* Show current user info */}
      {user && (
        <div className={styles.userInfo}>
          Welcome, {user.username} ({user.role})
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New User</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={newUserData.username}
                  onChange={handleInputChange}
                  required
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUserData.password}
                  onChange={handleInputChange}
                  required
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={newUserData.role}
                  onChange={handleInputChange}
                  className={styles.formInput}
                >
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.createButton}
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredUsers.length > 0 ? (
        <div className={styles.userCardsGrid}>
          {filteredUsers.map(userItem => (
            <div key={userItem.id} className={styles.userCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.userName}>{userItem.name}</h2>
                <span className={`${styles.statusBadge} ${styles[userItem.status.toLowerCase()]}`}>
                  {userItem.status}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.userInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>EMAIL</span>
                    <span className={styles.infoValue}>{userItem.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ROLE</span>
                    <span className={`${styles.badge} ${styles[userItem.role.toLowerCase()]}`}>
                      {userItem.role}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>COMPANY</span>
                    <span className={styles.infoValue}>{userItem.company}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                {isManager && (
                  <>
                    <button className={styles.editButton}>EDIT</button>
                    {userItem.status === 'Active' ? (
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteUser(userItem.id)}
                        disabled={userItem.id === user?.id}
                      >
                        DELETE
                      </button>
                    ) : (
                      <button
                        className={styles.recoverButton}
                        onClick={() => handleRecoverUser(userItem.id)}
                      >
                        RECOVER
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>
          No {showDeleted ? 'deleted' : 'active'} users found
          <br />
          <small>Debug: Query skipped = {!token || !companyId ? 'Yes' : 'No'}</small>
        </div>
      )}
    </div>
  );
}