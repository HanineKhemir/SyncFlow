'use client'
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';

export default function Dashboard() {

  const [taskData, setTaskData] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });

  useEffect(() => {
   
    const fetchData = () => {
    
      const dummyData = [
        { date: '2025-05-01', tasksCompleted: 5, totalTasks: 8 },
        { date: '2025-05-02', tasksCompleted: 7, totalTasks: 10 },
        { date: '2025-05-03', tasksCompleted: 3, totalTasks: 6 },
        { date: '2025-05-04', tasksCompleted: 8, totalTasks: 8 },
        { date: '2025-05-05', tasksCompleted: 4, totalTasks: 9 },
        { date: '2025-05-06', tasksCompleted: 6, totalTasks: 7 },
        { date: '2025-05-07', tasksCompleted: 9, totalTasks: 12 },
      ];

      
      const total = dummyData.reduce((acc, day) => acc + day.totalTasks, 0);
      const completed = dummyData.reduce((acc, day) => acc + day.tasksCompleted, 0);
      const pending = total - completed;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setTaskData(dummyData);
      setStats({
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        completionRate: completionRate
      });
    };

    fetchData();
    
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>Workspace Management Dashboard</h1>
        <div className={styles.currentDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
        <h2>Tasks Completed by Day</h2>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={taskData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate} 
                stroke="#000000" 
              />
              <YAxis stroke="#000000" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #000000', borderRadius: '0' }}
                labelStyle={{ color: '#000000' }}
                itemStyle={{ color: '#000000' }}
              />
              <Legend wrapperStyle={{ color: '#000000' }} />
              <Line 
                type="monotone" 
                dataKey="tasksCompleted" 
                name="Tasks Completed" 
                stroke="#000000" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="totalTasks" 
                name="Total Tasks" 
                stroke="#666666" 
                strokeDasharray="5 5" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h2>Recent Activity</h2>
        <div className={styles.activityList}>
          <div className={styles.activityItem}>
            <span className={styles.activityTime}>9:45 AM</span>
            <span className={styles.activityText}>Design team completed homepage mockup</span>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityTime}>11:20 AM</span>
            <span className={styles.activityText}>Backend API integration milestone reached</span>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityTime}>2:15 PM</span>
            <span className={styles.activityText}>New task assigned: User authentication flow</span>
          </div>
        </div>
      </div>
    </div>
  );
}