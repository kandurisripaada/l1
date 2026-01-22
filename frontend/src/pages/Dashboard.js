import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMic, FiAward, FiCalendar, FiClock, FiTrendingUp, FiBookOpen, FiHeadphones } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';
import { API_BASE_URL } from '../config';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    sessionsThisWeek: 0,
    recentActivity: []
  });

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // Or handle guest state

      try {
        const response = await fetch(`${API_BASE_URL}/api/practice/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const history = await response.json();
        
        if (Array.isArray(history)) {
             const totalSessions = history.length;
             const averageScore = totalSessions > 0 
               ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / totalSessions) 
               : 0;
             
             // Calculate sessions this week
             const now = new Date();
             const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
             const sessionsThisWeek = history.filter(s => new Date(s.createdAt) > oneWeekAgo).length;

             setStats({
               totalSessions,
               averageScore,
               sessionsThisWeek,
               recentActivity: history.slice(0, 5) // Top 5
             });
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="gradient-text">Your Learning Dashboard</h1>
          <p>Track your progress and keep improving.</p>
        </div>

        <motion.div 
          className="stats-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="stat-card" variants={itemVariants}>
            <div className="stat-icon icon-blue"><FiMic /></div>
            <div className="stat-info">
              <h3>{stats.totalSessions}</h3>
              <p>Total Sessions</p>
            </div>
          </motion.div>

          <motion.div className="stat-card" variants={itemVariants}>
            <div className="stat-icon icon-purple"><FiAward /></div>
            <div className="stat-info">
              <h3>{stats.averageScore}%</h3>
              <p>Average Score</p>
            </div>
          </motion.div>

          <motion.div className="stat-card" variants={itemVariants}>
            <div className="stat-icon icon-green"><FiCalendar /></div>
            <div className="stat-info">
              <h3>{stats.sessionsThisWeek}</h3>
              <p>This Week</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="dashboard-content">
          <section className="dashboard-section">
            <h2>Start Practicing</h2>
            <div className="practice-modes-grid">
              <Link to="/topic-practice" className="practice-mode-card">
                <div className="mode-icon"><FiMic /></div>
                <h3>Topic Practice</h3>
                <p>Speak on trending topics</p>
              </Link>
              <Link to="/grammar-practice" className="practice-mode-card">
                <div className="mode-icon"><FiAward /></div>
                <h3>Grammar Practice</h3>
                <p>Master sentence structures</p>
              </Link>
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((session) => (
                  <motion.div 
                    key={session.id} 
                    className="activity-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="activity-icon">
                      {session.type.includes('Topic') && <FiMic />}
                      {session.type.includes('Grammar') && <FiAward />}
                      {session.type.includes('Interview') && <FiBriefcase />}
                      {(session.type.includes('Listening') || session.type.includes('Listen')) && <FiHeadphones />}
                      {session.type.includes('Reading') && <FiBookOpen />}
                    </div>
                    <div className="activity-details">
                      <h4>{session.topic}</h4>
                      <p>{session.type} • {new Date(session.date).toLocaleDateString()}</p>
                    </div>
                    <div className="activity-score">
                      <span className={`score-badge ${session.score >= 80 ? 'high' : session.score >= 60 ? 'medium' : 'low'}`}>
                        {session.score}%
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No practice sessions yet. Start one today!</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Helper component for icon since it wasn't imported in the main file
const FiBriefcase = () => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);

export default Dashboard;
