'use client'
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import styles from './Dashboard.module.css';
import { useAuth } from '../hooks/useAuth'; 

const GET_TASK_STATS = gql`
  query GetTaskStats {
    tasks {
      id
      title
      dueDate
      completed
     
      company {
        id
      }
    }
  }
`;



export default function Dashboard() {
  const { token, isLoading: authLoading } = useAuth();
  const [taskData, setTaskData] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const STORAGE_KEY = 'dashboard_recent_activities';
  
  const { loading: queryLoading, error, data, refetch } = useQuery(GET_TASK_STATS, {
    skip: !token,
    context: {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    pollInterval: 60000, 
    notifyOnNetworkStatusChange: true
  });
  const formatActivityMessage = (event) => {
    const actionMap = {
      'create': 'created',
      'update': 'updated',
      'delete': 'deleted',
      'complete': 'completed'
    };

    const action = actionMap[event.type] || event.type;
    const taskTitle = event.targetTitle || 'a task'; 

    return `${event.performedBy?.username || 'Someone'} ${action} ${taskTitle}`;
  };

  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);

 


 

  const fetchRecentActivities = async () => {
    if (!token) return;

    setActivitiesLoading(true);
    setActivitiesError(null);

    try {
      const response = await fetch('http://localhost:3000/history/events?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const historyData = await response.json();

      const taskEvents = historyData
        .filter(event => event.targettype === 'task')
        .slice(0, 5)
        .map(event => ({
          id: event.id,
          time: new Date(event.date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          text: formatActivityMessage(event), 
          type: event.type,
          taskId: event.target,
          userName: event.performedBy?.username,
          date: event.date
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setRecentActivities(taskEvents);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setActivitiesError(error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // SSE Setup with Authentication 
 useEffect(() => {
    if (!token) return;
    
    const setupSSE = () => {
        const eventSource = new EventSource(`http://localhost:3000/history/events?authorization=${token}`, {
            withCredentials: true,
        });

        eventSource.onmessage = (event) => {
            try {
                const eventData = JSON.parse(event.data);
                
                if (eventData.targettype === 'task') {
                    console.log('Received task event:', eventData);

                    const newActivity = {
                        id: eventData.id,
                        time: new Date(eventData.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }),
                        text: formatActivityMessage(eventData),
                        type: eventData.type,
                        taskId: eventData.target,
                        userName: eventData.performedBy?.username
                    };

                    setRecentActivities(prev => {
                        const updated = [newActivity, ...prev].slice(0, 5);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                        return updated;
                    });

                    refetch();
                    fetchRecentActivities();
                    setLastRefresh(Date.now());
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

        eventSource.current = eventSource;
    };

    setupSSE();

    
}, [token, refetch, fetchRecentActivities]);

  useEffect(() => {
  const storedActivities = localStorage.getItem(STORAGE_KEY);
  if (storedActivities) {
    setRecentActivities(JSON.parse(storedActivities));
  }
 
}, [token]);


 useEffect(() => {
  if (data?.tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    
    const weeklyData = [...Array(7)].map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + (i - 3)); 
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = data.tasks.filter(task => {
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

   
    const total = data.tasks.length;
    const completed = data.tasks.filter(t => t.completed).length;
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
            <p key={index} style={{ margin: '4px 0', color: entry.color }}>
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
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Workspace Management Dashboard</h1>
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

      <div className={styles.recentActivity}>
        <h2>Recent Activity</h2>
        {activitiesLoading && recentActivities.length === 0 ? (
          <div className={styles.loading}>Loading recent activities...</div>
        ) : activitiesError ? (
          <div className={styles.error}>Error loading activities: {activitiesError.message}</div>
        ) : (
          <div className={styles.activityList}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <span className={styles.activityTime}>{activity.time}</span>
                  <span className={styles.activityText}>
                    {activity.text}
                    {activity.taskTitle && (
                      <span className={styles.taskTitle}> - {activity.taskTitle}</span>
                    )}
                    {activity.userName && (
                      <span className={styles.userName}> by {activity.userName}</span>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.activityItem}>
                <span className={styles.activityText}>No recent activities</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}