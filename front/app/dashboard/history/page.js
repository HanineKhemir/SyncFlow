'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/app/hooks/useAuth';
import { GET_TASKS_BY_COMPANY } from '@/app/graphql/tache';

import styles from './page.module.css';

// GraphQL queries for history operations
import { gql } from '@apollo/client';

const GET_OPERATIONS = gql`
  query GetOperations($start: Int, $limit: Int) {
    operation(start: $start, limit: $limit) {
      id
      type
      date
      description
      targettype
      target
      performedBy {
        username
      }
    }
  }
`;

const GET_OPERATIONS_BY_TARGET_TYPE = gql`
  query GetOperationsByTargetType($targetType: Target!, $start: Int!, $limit: Int!) {
    operationBytargetType(targetType: $targetType, start: $start, limit: $limit) {
      id
      type
      date
      description
      targettype
      target
      performedBy {
        username
      }
    }
  }
`;

const GET_OPERATIONS_BY_USER = gql`
  query GetOperationsByUser($username: String!, $start: Int!, $limit: Int!) {
    operationByUser(username: $username, start: $start, limit: $limit) {
      id
      type
      date
      description
      targettype
      target
      performedBy {
        username
      }
    }
  }
`;

export default function History() {
    const { token, user, isManager } = useAuth();
    const [inputValue, setInputValue] = useState('');
    const [companyId, setCompanyId] = useState(null);
    const [activeTab, setActiveTab] = useState('operations');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [filterType, setFilterType] = useState('all');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedTargetType, setSelectedTargetType] = useState('');
    const [realTimeEvents, setRealTimeEvents] = useState([]);
    const eventSourceRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [allUsernames, setAllUsernames] = useState([]);
    const[tokenReady, setTokenReady] = useState(false);
    // Set company ID when user is available
    useEffect(() => {
        if (user?.company?.id) {
            console.log('✅ Setting company ID:', user.company.id);
            setCompanyId(user.company.id);
        }
    }, [user]);

    // Tasks query
    const { data: tasksData, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useQuery(GET_TASKS_BY_COMPANY, {
        variables: { userId: user?.id?.toString() },
        skip: !user?.id,
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : "",
            },
        },
    });

    // Main operations query - always fetch for 'all' filter
    const { data: operationsData, loading: operationsLoading, error: operationsError, refetch: refetchOperations } = useQuery(GET_OPERATIONS, {
        variables: {
            start: (currentPage - 1) * pageSize,
            limit: pageSize
        },
        skip: !isManager || !token || (filterType !== 'all'),
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : "",
            },
        },
    });
    useEffect(() => {
        if (!token) {
            const timeout = setTimeout(() => {
                setTokenReady(true);
            }, 100);
            return () => clearTimeout(timeout);
        } else {
            setTokenReady(true);
        }
    }, [token]);

    useEffect(() => {
        const fetchUsernames = async () => {
            if (!tokenReady) {
  return <div className={styles.loading}>Initializing...</div>;
}
            const res = await fetch('http://localhost:3000/users/user-names', {
                method: 'Get',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            console.log('🔍 Fetched usernames:', data);
            setAllUsernames(data);
        };

        fetchUsernames();
    }, [tokenReady]);

    useEffect(() => {
        console.log('🔍 Fetching usernames for suggestions:', allUsernames);
        const filtered = allUsernames.filter(name =>
            name.toLowerCase().includes(inputValue.toLowerCase())
        );
        setSuggestions(filtered);
    }, [inputValue, allUsernames]);

    const { data: targetTypeData, loading: targetTypeLoading, error: targetTypeError, refetch: refetchTargetType } = useQuery(GET_OPERATIONS_BY_TARGET_TYPE, {
        variables: {
            targetType: selectedTargetType,
            start: (currentPage - 1) * pageSize,
            limit: pageSize
        },
        skip: !isManager || !token || filterType !== 'targetType' || !selectedTargetType,
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : "",
            },
        },
    });

    // User filtered operations query
    const { data: userFilterData, loading: userFilterLoading, error: userFilterError, refetch: refetchUserFilter } = useQuery(GET_OPERATIONS_BY_USER, {
        variables: {
            username: selectedUser,
            start: (currentPage - 1) * pageSize,
            limit: pageSize
        },
        skip: !isManager || !token || filterType !== 'user' || !selectedUser,
        context: {
            headers: {
                authorization: token ? `Bearer ${token}` : "",
            },
        },
    });

    // Debug logging
    useEffect(() => {
        console.log('🔍 Debug Info:');
        console.log('- isManager:', isManager);
        console.log('- token:', !!token);
        console.log('- filterType:', filterType);
        console.log('- selectedTargetType:', selectedTargetType);
        console.log('- selectedUser:', selectedUser);
        console.log('- targetTypeData:', targetTypeData);
        console.log('- targetTypeError:', targetTypeError);
        console.log('- userFilterData:', userFilterData);
        console.log('- userFilterError:', userFilterError);
    }, [isManager, token, filterType, selectedTargetType, selectedUser, targetTypeData, targetTypeError, userFilterData, userFilterError]);

    // Setup Server-Sent Events for real-time updates
    useEffect(() => {
        if (!isManager || !token) return;

        const setupSSE = () => {
            const eventSource = new EventSource(`http://localhost:3000/history/events?authorization=${token}`, {
                withCredentials: true,
            });

            eventSource.onmessage = (event) => {
                try {
                    console.log('Received SSE data:', event.data);
                    const newOperation = JSON.parse(event.data);
                    setRealTimeEvents(prev => [newOperation, ...prev.slice(0, 9)]); // Keep last 10 events

                    // Refresh the appropriate query based on current filter
                    if (filterType === 'all') {
                        refetchOperations();
                    } else if (filterType === 'targetType') {
                        refetchTargetType();
                    } else if (filterType === 'user') {
                        refetchUserFilter();
                    }
                } catch (error) {
                    console.error('Error parsing SSE data:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);
                eventSource.close();

                // Retry connection after 5 seconds
                setTimeout(setupSSE, 5000);
            };

            eventSourceRef.current = eventSource;
        };

        setupSSE();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [isManager, token, filterType, refetchOperations, refetchTargetType, refetchUserFilter]);

    // Handle filter changes
    const handleFilterChange = (type) => {
        console.log('🔄 Filter changed to:', type);
        setFilterType(type);
        setCurrentPage(1);
        if (type !== 'user') setSelectedUser('');
        if (type !== 'targetType') setSelectedTargetType('');
    };


    const handleUserFilter = () => {
        console.log('👤 Applying user filter:', selectedUser);
        if (selectedUser) {
            setFilterType('user');
            setCurrentPage(1);
            refetchUserFilter({
                username: selectedUser,
                start: 0,
                limit: pageSize,
                skip: !isManager || !token || filterType !== 'user' || !selectedUser,
            });
        }
    };

    const handleTargetTypeFilter = () => {
        console.log('🎯 Applying target type filter:', selectedTargetType);
        if (selectedTargetType) {
            setFilterType('targetType');
            setCurrentPage(1);
        }
    };

    const getCurrentOperations = () => {
        switch (filterType) {
            case 'targetType':
                console.log('📊 Getting target type operations:', targetTypeData?.operationBytargetType);
                return targetTypeData?.operationBytargetType || [];
            case 'user':
                console.log('📊 Getting user operations:', userFilterData?.operationByUser);
                return userFilterData?.operationByUser || [];
            case 'all':
            default:
                console.log('📊 Getting all operations:', operationsData?.operation);
                return operationsData?.operation || [];
        }
    };

    const getCurrentLoading = () => {
        switch (filterType) {
            case 'targetType':
                return targetTypeLoading;
            case 'user':
                return userFilterLoading;
            case 'all':
            default:
                return operationsLoading;
        }
    };

    const getCurrentError = () => {
        switch (filterType) {
            case 'targetType':
                return targetTypeError;
            case 'user':
                return userFilterError;
            case 'all':
            default:
                return operationsError;
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    if (!isManager) {
        return (
            <div className={styles.container}>
                <div className={styles.accessDenied}>
                    <h2>Access Denied</h2>
                    <p>Only managers can view the history page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Company History & Tasks</h1>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'operations' ? styles.active : ''}`}
                        onClick={() => setActiveTab('operations')}
                    >
                        Operations History
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'tasks' ? styles.active : ''}`}
                        onClick={() => setActiveTab('tasks')}
                    >
                        Tasks
                    </button>
                </div>
            </div>

            {/* Real-time Events Indicator */}
            {realTimeEvents.length > 0 && (
                <div className={styles.realTimeEvents}>
                    <h3>Recent Activity</h3>
                    {realTimeEvents.slice(0, 3).map((event, index) => (
                        <div key={index} className={styles.realtimeEvent}>
                            <span className={styles.timestamp}>{formatTimestamp(event.date)}</span>
                            <span className={styles.action}>{event.type}</span>
                            <span className={styles.target}>{event.targettype}</span>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'operations' && (
                <div className={styles.operationsSection}>


                    {/* Filters */}
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label>Filter by:</label>
                            <select
                                value={filterType}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className={styles.select}
                            >
                                <option value="all">All Operations</option>
                                <option value="user">By User</option>
                                <option value="targetType">By Target Type</option>
                            </select>
                        </div>

                        {filterType === 'user' && (
  <div className={styles.filterGroup}>
    <label>User name:</label>
    <div className={styles.inputWrapper}>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setSelectedUser(inputValue);
            setFilterType('user');
            setCurrentPage(1);
            setSuggestions([]);
          }
        }}
        className={styles.input}
        placeholder="Enter user name"
      />
      {inputValue.trim() && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((name, index) => (
            <li
              key={index}
              onClick={() => {
                setInputValue(name);
                setSelectedUser(name);
                setFilterType('user');
                setCurrentPage(1);
                setSuggestions([]);
              }}
              className={styles.suggestionItem}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
    <button
      onClick={() => {
        setSelectedUser(inputValue);
        setFilterType('user');
        setCurrentPage(1);
        setSuggestions([]);
      }}
      disabled={!inputValue}
      className={styles.filterButton}
    >
      Apply Filter
    </button>
  </div>
)}

                        {filterType === 'targetType' && (
                            <div className={styles.filterGroup}>
                                <label>Target Type:</label>
                                <select
                                    value={selectedTargetType}
                                    onChange={(e) => {
                                        console.log('🎯 Target type selected:', e.target.value);
                                        setSelectedTargetType(e.target.value);
                                    }}
                                    className={styles.select}
                                >
                                    <option value="">Select target type</option>
                                    <option value="note">Note</option>
                                    <option value="task">Task</option>
                                    <option value="user">User</option>
                                    <option value="event">Event</option>
                                    <option value='noteline'>Note Line</option>
                                </select>
                                <button
                                    onClick={handleTargetTypeFilter}
                                    className={styles.filterButton}
                                    disabled={!selectedTargetType}
                                >
                                    Apply Filter
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Operations Table */}
                    {getCurrentLoading() ? (
                        <div className={styles.loading}>Loading operations...</div>
                    ) : getCurrentError() ? (
                        <div className={styles.error}>Error loading operations: {getCurrentError().message}</div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Action</th>
                                        <th>Target Type</th>
                                        <th>Target ID</th>
                                        <th>Username</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCurrentOperations().map((operation) => (
                                        <tr key={operation.id} className={styles.tableRow}>
                                            <td>{formatTimestamp(operation.date)}</td>
                                            <td>
                                                <span className={`${styles.actionBadge} ${styles[operation.type?.toLowerCase()]}`}>
                                                    {operation.type}
                                                </span>
                                            </td>
                                            <td>{operation.targettype}</td>
                                            <td>{operation.target}</td>
                                            <td>{operation.performedBy?.username}</td>
                                            <td>{operation.description || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {getCurrentOperations().length === 0 && (
                                <div className={styles.noData}>No operations found</div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className={styles.pagination}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={styles.paginationButton}
                        >
                            Previous
                        </button>
                        <span className={styles.pageInfo}>Page {currentPage}</span>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={getCurrentOperations().length < pageSize}
                            className={styles.paginationButton}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className={styles.tasksSection}>
                    {tasksLoading ? (
                        <div className={styles.loading}>Loading tasks...</div>
                    ) : tasksError ? (
                        <div className={styles.error}>Error loading tasks: {tasksError.message}</div>
                    ) : (
                        <div className={styles.tasksGrid}>
                            {tasksData?.tasksByCompany?.map((task) => (
                                <div key={task.id} className={styles.taskCard}>
                                    <h3>{task.title}</h3>
                                    <p>{task.description}</p>
                                    <div className={styles.taskMeta}>
                                        <span className={`${styles.status} ${task.completed ? styles.completed : styles.pending}`}>
                                            {task.completed ? 'Completed' : 'Pending'}
                                        </span>
                                        <span className={styles.assignee}>
                                            Assigned to: {task.assignedTo?.username || 'Unassigned'}
                                        </span>
                                    </div>
                                    <div className={styles.taskDates}>
                                        <small>Due: {formatTimestamp(task.dueDate)}</small>
                                    </div>
                                </div>
                            ))}

                            {(!tasksData?.tasksByCompany || tasksData.tasksByCompany.length === 0) && (
                                <div className={styles.noData}>No tasks found for this company</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}