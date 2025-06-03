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
  GET_USERS_BY_COMPANY,
  GET_DELETED_USERS,
  UPDATE_USER_MUTATION
} from '@/app/graphql/user';

export default function UsersPage() {
  const { user, token, isManager } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    role: 'USER'
  });
  const [editUserData, setEditUserData] = useState({
    username: '',
    password: '',
    role: 'USER'
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Debug logs
  console.log('🔍 Debug Info:');
  console.log('User:', user);
  console.log('Token:', token ? 'Token exists' : 'No token');
  console.log('Company ID:', companyId);
  console.log('Show Deleted:', showDeleted);

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

  // Query for active users by company
  const { data: activeUsersData, loading: activeLoading, error: activeError, refetch: refetchActive } = useQuery(GET_USERS_BY_COMPANY, {
    skip: !token || !companyId || showDeleted,
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
      console.log('✅ Active users query completed:', data);
    },
    onError: (error) => {
      console.log('❌ Active users query error:', error);
    }
  });

  // Query for deleted users
  const { data: deletedUsersData, loading: deletedLoading, error: deletedError, refetch: refetchDeleted } = useQuery(GET_DELETED_USERS, {
    skip: !token || !showDeleted,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    errorPolicy: 'all',
    onCompleted: (data) => {
      console.log('✅ Deleted users query completed:', data);
    },
    onError: (error) => {
      console.log('❌ Deleted users query error:', error);
    }
  });

  // Determine which data to use
  const currentData = showDeleted ? deletedUsersData : activeUsersData;
  const currentLoading = showDeleted ? deletedLoading : activeLoading;
  const currentError = showDeleted ? deletedError : activeError;

  console.log('📊 Current Query Status:');
  console.log('Loading:', currentLoading);
  console.log('Error:', currentError);
  console.log('Data:', currentData);

  // Mutations with proper cache updates
  const [deleteUser] = useMutation(DELETE_USER_MUTATION, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    update: (cache, { data: mutationData }) => {
      if (mutationData?.deleteUser) {
        // Force refetch both queries
        refetchActive();
        refetchDeleted();
      }
    },
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
    update: (cache, { data: mutationData }) => {
      if (mutationData?.recoverUser) {
        // Force refetch both queries
        refetchActive();
        refetchDeleted();
      }
    },
    onCompleted: () => {
      alert('User recovered successfully');
    },
    onError: (error) => {
      alert('Failed to recover user: ' + error.message);
    }
  });

  const [updateUser] = useMutation(UPDATE_USER_MUTATION, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    update: (cache, { data: mutationData }) => {
      if (mutationData?.updateUser) {
        // Force refetch active users query
        refetchActive();
      }
    },
    onCompleted: () => {
      alert('User updated successfully');
      setShowEditUserModal(false);
      setEditingUser(null);
    },
    onError: (error) => {
      alert('Failed to update user: ' + error.message);
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

  const handleEditUser = (userItem) => {
    setEditingUser(userItem);
    setEditUserData({
      username: userItem.name,
      password: '', // Don't pre-fill password for security
      role: userItem.role
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsUpdatingUser(true);

    try {
      const updateInput = {
        username: editUserData.username,
        role: editUserData.role
      };

      // Only include password if it's provided
      if (editUserData.password.trim()) {
        updateInput.password = editUserData.password;
      }

      await updateUser({
        variables: {
          id: editingUser.id.toString(),
          input: updateInput
        }
      });

    } catch (error) {
      console.error('❌ Error updating user:', error);
      const errorMessage = error.message || 'Failed to update user';
      alert('Error updating user: ' + errorMessage);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    if (showDeleted) {
      refetchDeleted();
    } else if (companyId) {
      refetchActive({
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
          companyId: companyId
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
      refetchActive();
      
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

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Transform users based on current view
  const transformedUsers = (() => {
    if (showDeleted && deletedUsersData?.deletedUsers) {
      return deletedUsersData.deletedUsers.map(user => ({
        id: user.id,
        name: user.username,
        email: `${user.username}@company.com`,
        role: user.role.toUpperCase(), // Ensure consistent case
        status: 'Inactive',
        company: user.company?.name || 'No Company',
        deletedAt: user.deletedAt
      }));
    } else if (!showDeleted && activeUsersData?.usersByCompany) {
      return activeUsersData.usersByCompany
        .filter(user => !user.deletedAt) // Extra safety filter
        .map(user => ({
          id: user.id,
          name: user.username,
          email: `${user.username}@company.com`,
          role: user.role.toUpperCase(), // Ensure consistent case
          status: 'Active',
          company: user.company?.name || 'No Company',
          deletedAt: user.deletedAt
        }));
    }
    return [];
  })();

  console.log('🔄 Transformed users:', transformedUsers);

  const filteredUsers = transformedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roles = [...new Set(transformedUsers.map(user => user.role))];

  // Show loading spinner
  if (currentLoading) {
    return (
      <div className={styles.usersContainer}>
        <div className={styles.loading}>
          Loading {showDeleted ? 'deleted' : 'active'} users...
        </div>
      </div>
    );
  }

  // Show error message
  if (currentError && !currentData) {
    console.log('💥 Rendering error state:', currentError.message);
    return (
      <div className={styles.usersContainer}>
        <div className={styles.error}>
          Error: {currentError.message}
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
          {isManager && !showDeleted && (
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

        <div className={styles.toggleContainer}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
            Show Deleted Users
          </label>
        </div>
      </div>

      {/* Show current user info */}
      {user && (
        <div className={styles.userInfo}>
          Welcome, {user.username} ({user.role}) - Viewing: {showDeleted ? 'Deleted Users' : 'Active Users'}
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

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit User</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-username">Username</label>
                <input
                  type="text"
                  id="edit-username"
                  name="username"
                  value={editUserData.username}
                  onChange={handleEditInputChange}
                  required
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="edit-password">Password (leave blank to keep current)</label>
                <input
                  type="password"
                  id="edit-password"
                  name="password"
                  value={editUserData.password}
                  onChange={handleEditInputChange}
                  placeholder="Enter new password or leave blank"
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  name="role"
                  value={editUserData.role}
                  onChange={handleEditInputChange}
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
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.updateButton}
                  disabled={isUpdatingUser}
                >
                  {isUpdatingUser ? 'Updating...' : 'Update User'}
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
                  {showDeleted && userItem.deletedAt && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>DELETED AT</span>
                      <span className={styles.infoValue}>
                        {new Date(userItem.deletedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                {isManager && (
                  <>
                    {userItem.status === 'Active' ? (
                      <>
                        <button 
                          className={styles.editButton}
                          onClick={() => handleEditUser(userItem)}
                          disabled={userItem.id === user?.id}
                        >
                          EDIT
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDeleteUser(userItem.id)}
                          disabled={userItem.id === user?.id}
                        >
                          DELETE
                        </button>
                      </>
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
          <small>
            Debug: Showing {showDeleted ? 'deleted' : 'active'} users | 
            Query: {showDeleted ? 'GET_DELETED_USERS' : 'GET_USERS_BY_COMPANY'}
          </small>
        </div>
      )}
    </div>
  );
}