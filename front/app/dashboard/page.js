'use client'
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import styles from './Dashboard.module.css';
import { useAuth } from '../hooks/useAuth';
import { GET_USERS_BY_COMPANY } from '../graphql/user';
import { useRouter } from "next/navigation"; 
const GET_TASK_STATS = gql`
  query GetTaskStats($companyId: ID!) {
    tasksByCompany(companyId: $companyId) {
      id
      title
      description
      createdAt
      dueDate
      completed
      assignedTo {
        id
        username
      }
    }
  }
`;

const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      description
      dueDate
      completed
    }
  }
`;
const GET_TODAYS_TASKS = gql`
  query Tasksbyday($date: String!) {
    tasksbyday(date: $date) {
      id
      title
      description
      dueDate
      completed
      assignedTo{
        id
        username
      }
    }
  }
`;

const GET_TODAYS_EVENTS = gql`
  query EventByDay($date: String!) {
    EventByDay(date: $date) {
      id
      title
      description
      date
      createdBy {
        id
        username
      }
    }
  }
`;

// Add Task Modal Component
const AddTaskModal = ({ isOpen, onClose, onSubmit, users, loading: usersLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedToId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Task title is required');
      return;
    }
    
    const taskData = {
      ...formData,
      assignedToId: formData.assignedToId || null
    };
    
    onSubmit(taskData);
    setFormData({ title: '', description: '', dueDate: '', assignedToId: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  // Ensure unique users for the dropdown
  const uniqueUsers = users ? users.filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  ) : [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        borderRadius: '0',
        padding: '2rem',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#000000' }}>Add New Task</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#000000'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000000', fontWeight: 'bold' }}>
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #000000',
                borderRadius: '0',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Enter task title"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000000', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #000000',
                borderRadius: '0',
                fontSize: '1rem',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              placeholder="Enter task description (optional)"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000000', fontWeight: 'bold' }}>
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #000000',
                borderRadius: '0',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000000', fontWeight: 'bold' }}>
              Assign To
            </label>
            <select
              name="assignedToId"
              value={formData.assignedToId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #000000',
                borderRadius: '0',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff'
              }}
            >
              <option disabled value="">Select a user</option>
              {usersLoading ? (
                <option disabled>Loading users...</option>
              ) : (
                uniqueUsers.map(user => (
                  <option key={`user-${user.id}`} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #000000',
                backgroundColor: '#ffffff',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #000000',
                backgroundColor: '#000000',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { token, isLoading: authLoading, user,isManager } = useAuth();
  console.log("theisuer", user)
  const router = useRouter();
  const [taskData, setTaskData] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });
  const [pageKey, setPageKey] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const STORAGE_KEY = 'dashboard_recent_activities';
  useEffect(() => {
    refetchTodayEvents(); 
    setPageKey(prev => prev + 1);
  }, [router.asPath]);
  const todayISOString = new Date().toISOString().split('T')[0] + "T00:00:00.000Z";


const { data: todayEventsData,  refetch: refetchTodayEvents } = useQuery(GET_TODAYS_EVENTS, {
  variables: { date: todayISOString },
  skip: !token,
  context: {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  },
});
const { data: todayTasksData,refetch: refetchTodayTasks } = useQuery(GET_TODAYS_TASKS, {
  variables: { date: todayISOString },
  skip: !token,
  context: {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  },
});
  const { loading: queryLoading, error, data, refetch } = useQuery(GET_TASK_STATS, {
    variables: { companyId: user?.company?.id?.toString() },
    skip: !token,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    pollInterval: 60000, 
    notifyOnNetworkStatusChange: true
  });

  // Query to fetch users by company for task assignment
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS_BY_COMPANY, {
    variables: { companyId: user?.company?.id?.toString() },
    skip: !token || !user?.company?.id,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    }
  });

  // Mutation to create a new task
  const [createTaskMutation, { loading: createTaskLoading }] = useMutation(CREATE_TASK_MUTATION, {
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    onCompleted: () => {
      setIsAddTaskModalOpen(false);
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      alert('Error creating task: ' + error.message);
    }
  });

  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);

  const handleCreateTask = async (taskData) => {
    try {
      await createTaskMutation({
        variables: {
          input: taskData
        },
          onCompleted: () => {
        
        refetch(); // Refetches GET_TASK_STATS
        refetchTodayTasks(); 
        refetchTodayEvents(); 
         setIsAddTaskModalOpen(false);
      }
      });

    } catch (error) {
      console.error('Error in handleCreateTask:', error);
    }
  };
  useEffect(() => {
    if (data?.tasksByCompany) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 

      const weeklyData = [...Array(7)].map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() + (i - 3)); 
        const dateStr = date.toISOString().split('T')[0];

        const dayTasks = data.tasksByCompany.filter(task => {
          if (!task.dueDate) return false;
          const taskDueDate = new Date(task.dueDate);
          taskDueDate.setHours(0, 0, 0, 0);
          return taskDueDate.toISOString().split('T')[0] === dateStr;
        });

        const completedTasks = dayTasks.filter(t => t.completed);

        return {
          date: dateStr,
          displayDate: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          tasksCompleted: completedTasks.length,
          totalTasks: dayTasks.length,
          isToday: dateStr === today.toISOString().split('T')[0]
        };
      });

      setTaskData(weeklyData);

      const total = data.tasksByCompany.length;
      const completed = data.tasksByCompany.filter(t => t.completed).length;
      const pending = total - completed;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        completionRate: rate
      });
    }
  }, [data, lastRefresh]);

  const formatTooltipLabel = (label) => {
    const dataPoint = taskData.find(d => d.date === label);
    if (dataPoint?.isToday) {
      return `Today (${dataPoint.displayDate})`;
    }
    return dataPoint?.displayDate || label;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = taskData.find(d => d.date === label);
      return (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #000000',
          borderRadius: '4px',
          padding: '8px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#000000' }}>
            {formatTooltipLabel(label)}
          </p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ margin: '4px 0', color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (authLoading) return <div className={styles.loading}>Checking authentication...</div>;
  if (!token) return <div className={styles.error}>Please login to access dashboard</div>;
  if (queryLoading && !data) return <div className={styles.loading}>Loading dashboard data...</div>;
  if (error) return <div className={styles.error}>Error loading tasks: {error.message}</div>;

  return (
    <div key={pageKey} className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Workspace Management Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            disabled={createTaskLoading}
            className={styles.addButton}
          >
            {createTaskLoading ? 'Creating...' : '+ Add Task'}
          </button>
          <div className={styles.currentDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
              Last updated: {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h3>Total Tasks</h3>
          <p className={styles.statNumber}>{stats.totalTasks}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Completed</h3>
          <p className={styles.statNumber}>{stats.completedTasks}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Pending</h3>
          <p className={styles.statNumber}>{stats.pendingTasks}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Completion Rate</h3>
          <p className={styles.statNumber}>{stats.completionRate}%</p>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2>Tasks Completed by Day (Last 7 Days)</h2>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={taskData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="displayDate"
                stroke="#000000"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="#000000" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#000000' }} />
              <Line
                type="monotone"
                dataKey="tasksCompleted"
                name="Tasks Completed"
                stroke="#4CAF50"
                activeDot={{ r: 6, fill: '#4CAF50' }}
                strokeWidth={3}
                dot={{ fill: '#4CAF50', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalTasks"
                name="Total Tasks Due"
                stroke="#2196F3"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ fill: '#2196F3', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.todaySection}>
  <h2>Today's Tasks</h2>
  {todayTasksData?.tasksbyday?.length > 0 ? (
    <ul>
      {todayTasksData.tasksbyday.map(task => {
        const isAssignedToMe = task.assignedTo && user && task.assignedTo.id == user.id;
        return (
          <li
            key={task.id}
            className={
              isAssignedToMe
                ? styles.assignedToMe
                : styles.notAssignedToMe
            }
          >
            <span className={styles.taskTitle}>{task.title} {(isAssignedToMe || task.completed) ? '': '(' + task.assignedTo.username + ')' }</span>
            <span
              className={`${styles.taskStatus} ${
                task.completed ? styles.completed : styles.pending
              }`}
            >
              {task.completed ? 'Completed' : 'Pending'}
            </span>
          </li>
        );
      })}
    </ul>
  ) : (
    <p>No tasks due today.</p>
  )}

  <h2 style={{ marginTop: '2rem' }}>Today's Events</h2>
  {console.log('Today Events Data:', todayEventsData)}
  {todayEventsData?.EventByDay?.length > 0 ? (
    <ul>
      {todayEventsData.EventByDay.map(event => {
        const isCreatedByMe = event.createdBy && user && event.createdBy.id == user.id;
        console.log('Event:', event, 'isCreatedByMe:', isCreatedByMe);
        return (
          <li
            key={event.id}
            className={
              isCreatedByMe
                ? styles.assignedToMe
                : styles.notAssignedToMe
            }
          >
            <span className={styles.taskTitle}>{event.title} {isCreatedByMe? '' : '(' + event.createdBy.username+ ')'}</span>
            <span className={styles.taskStatus}>
              {new Date(event.date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          </li>
        );
      })}
    </ul>
  ) : (
    <p>No events today.</p>
  )}
</div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        users={usersData?.usersByCompany?.filter(user => !user.deletedAt)}
        loading={usersLoading}
      />
    </div>
  );
}