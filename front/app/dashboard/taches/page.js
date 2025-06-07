
'use client'
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuth } from '@/app/hooks/useAuth';
import styles from './tasks.module.css';


const GET_TASKS_BY_USER = gql`
  query GetTasksByUser($userId: ID!) {
    tasksByUser(userId: $userId) {
      id
      title
      description
      dueDate
      completed
      assignedTo {
        id
        username
        
      }
      company {
        id
        name
      }
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      title
      description
      dueDate
      completed
      assignedTo {
        id
        username
      }
    }
  }
`;

const TasksPage = () => {
  const { user, token } = useAuth();
  const date = new Date();
  console.log("Current Date:", date);
  
  const { data, loading, error, refetch } = useQuery(GET_TASKS_BY_USER, {
    variables: { userId: user?.id?.toString() },
    skip: !user?.id, 
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
  });

  const [updateTask] = useMutation(UPDATE_TASK, {
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
      },
    },
  });

  const tasks = data?.tasksByUser || [];

const toggleTaskCompletion = async (taskId, currentCompleted) => {
  try {
    const task = tasks.find(t => t.id === taskId);
    
    await updateTask({
      variables: {
        id: taskId,
        input: {  
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          completed: !currentCompleted,
          assignedToId: task.assignedTo?.id
        }
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateTask: {
          __typename: 'Task',
          id: taskId,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          completed: !currentCompleted,
          assignedTo: task.assignedTo
        }
      },
      update: (cache, { data: { updateTask } }) => {
        const existingData = cache.readQuery({ 
          query: GET_TASKS_BY_USER,
          variables: { userId: user?.id?.toString() }
        });
        
        if (existingData) {
          cache.writeQuery({
            query: GET_TASKS_BY_USER,
            variables: { userId: user?.id?.toString() },
            data: {
              tasksByUser: existingData.tasksByUser.map(t => 
                t.id === taskId ? { ...t, completed: !currentCompleted } : t
              )
            }
          });
        }
      }
    });
  } catch (err) {
    console.error('Error updating task:', err);
    
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.centerContent}>
          <h1 className={styles.title}>Please log in</h1>
          <p className={styles.subtitle}>You need to be logged in to view your tasks.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.centerContent}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.centerContent}>
          <h1 className={styles.errorTitle}>Error</h1>
          <p className={styles.subtitle}>{error.message}</p>
          <button
            onClick={() => refetch()}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContainer}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.mainTitle}>My Tasks</h1>
            <p className={styles.welcomeText}>
              Welcome, {user.username}! Here are your assigned tasks.
            </p>
          </div>

          <div className={styles.cardContent}>
            {tasks.length === 0 ? (
              <div className={styles.emptyState}>
                <h2 className={styles.emptyTitle}>No tasks assigned</h2>
                <p className={styles.emptyText}>You don't have any tasks assigned to you yet.</p>
              </div>
            ) : (
              <div className={styles.tasksList}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : date > new Date(formatDate(task.dueDate))?  styles.taskPending : styles.taskMissed}`}
                  >
                    <div className={styles.taskContent}>
                      <div className={styles.taskLeft}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskCompletion(task.id, task.completed)}
                          className={styles.checkbox}
                        />
                        <div className={styles.taskDetails}>
                          <h3 className={`${styles.taskTitle} ${task.completed ? styles.taskTitleCompleted : ''}`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className={`${styles.taskDescription} ${task.completed ? styles.taskDescriptionCompleted : ''}`}>
                              {task.description}
                            </p>
                          )}
                          <div className={styles.taskMeta}>
                            <span>Due: {formatDate(task.dueDate)}</span>
                            {task.company && (
                              <span>Company: {task.company.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`${styles.statusBadge} ${task.completed ? styles.statusCompleted : date < new Date(formatDate(task.dueDate)) ? styles.statusMissed :styles.statusPending}`}>
                        {task.completed ? 'Completed' : date < new Date(formatDate(task.dueDate)) ?  "Missed" : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task Statistics */}
        <div className={styles.statsCard}>
          <h2 className={styles.statsTitle}>Task Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={`${styles.statItem} ${styles.statTotal}`}>
              <h3 className={styles.statLabel}>Total Tasks</h3>
              <p className={styles.statValue}>{tasks.length}</p>
            </div>
            <div className={`${styles.statItem} ${styles.statCompleted}`}>
              <h3 className={styles.statLabel}>Completed</h3>
              <p className={styles.statValue}>{completedTasks.length}</p>
            </div>
            <div className={`${styles.statItem} ${styles.statPending}`}>
              <h3 className={styles.statLabel}>Pending</h3>
              <p className={styles.statValue}>{pendingTasks.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;