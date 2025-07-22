import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import axios from 'axios';
import './App.css';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await axios.post('http://localhost:5000/api/auth/logout');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    }
    
    logout();
    navigate('/login');
  };

  const handleStartInterview = async () => {
    try {
      // Just generate random room ID, don't create database record yet
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGeneratedRoomId(roomId);
      
      // Show modal without creating interview record
      setShowInterviewModal(true);
    } catch (error) {
      console.error('Start interview error:', error);
      setError('Failed to generate room code. Please try again.');
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedRoomId);
      setCopyFeedback('Room code copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const enterRoom = async () => {
    try {
      // Create interview record in database only when entering room
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/interview', {
        roomId: generatedRoomId,
        role: 'interviewer'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Navigate to interview room
      navigate(`/room/${generatedRoomId}`, { state: { role: 'interviewer' } });
    } catch (error) {
      console.error('Enter room error:', error);
      setError('Failed to start interview. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'hsl(142 76% 36%)';
      case 'medium': return 'hsl(32 95% 44%)';
      case 'hard': return 'hsl(0 84% 60%)';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  if (loading) {
    return (
      <div className="app-root">
        <div className="join-container">
          <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
          <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-root">
        <div className="join-container">
          <div style={{
            padding: '1rem',
            background: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive) / 0.2)',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--destructive))',
            textAlign: 'center'
          }}>
            {error}
          </div>
          <button 
            onClick={fetchDashboardData}
            className="action-btn run-btn"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, recentInterviews } = dashboardData;

  return (
    <div className="app-root">     
        <div className="editor-header" style={{ maxWidth: '80rem', letterSpacing: '-0.05em' ,
        }}>
          <div>
            <h2 style={{
              background: 'linear-gradient(135deg, #ffffff, #cacacaff, #ffffffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Dashboard</h2>
            <p style={{
              color: 'hsl(var(--muted-foreground))',
              fontSize: '1rem',
              margin: '0.5rem 0 0 0',
            }}>
          Welcome back, {dashboardData.user.username}!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {dashboardData.user.role === 'interviewer' ? (
          <button 
            onClick={handleStartInterview}
            className="action-btn run-btn"
          >
            Start Interview
          </button>
            ) : (
          <Link 
            to="/join" 
            className="action-btn run-btn"
            style={{ textDecoration: 'none' }}
          >
            Join Interview
          </Link>
            )}
            <button 
          onClick={handleLogout}
          className="action-btn save-btn"
            >
          Logout
            </button>
          </div>
        </div>
        <div style={{
          width: '100%',
          maxWidth: '80rem',
          display: 'grid',
          gridTemplateColumns: dashboardData.user.role === 'candidate' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: 0,
          marginBottom: '2rem'
        }}>
          {/* Total Interviews */}
        <div className="join-container" style={{ margin: 0, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'hsl(var(--primary) / 0.1)',
              borderRadius: 'calc(var(--radius) - 2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0, marginBottom: '0.25rem' }}>
                {dashboardData.user.role === 'interviewer' ? 'Interviews Conducted' : 'Interviews Taken'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                +{stats.thisMonthInterviews} this month
              </p>
            </div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: 'hsl(var(--foreground))', textAlign: 'center' }}>
            {stats.totalInterviews}
          </p>
        </div>


        {/* Average Score - Only for Candidates */}
        {dashboardData.user.role === 'candidate' && (
          <div className="join-container" style={{ margin: 0, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'hsl(32 95% 44% / 0.1)',
                borderRadius: 'calc(var(--radius) - 2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(32 95% 44%)" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0, marginBottom: '0.25rem' }}>
                  Average Score Received
                </p>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                  From interviewers
                </p>
              </div>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: 'hsl(var(--foreground))', textAlign: 'center' }}>
              {stats.averageScore || 0}
            </p>
          </div>
        )}
      </div>

      {/* Recent Interviews */}
      <div className="join-container" style={{ 
        maxWidth: '80rem', 
        width: '100%', 
        margin: 0, 
        padding: '1.5rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: 'hsl(var(--foreground))',
            letterSpacing: '-0.05em',
          }}>
            Recent Interviews
          </h3>
          {recentInterviews.length > 0 && (
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'hsl(var(--muted-foreground))'
            }}>
              Last {Math.min(10, recentInterviews.length)} interviews
            </span>
          )}
        </div>

        {recentInterviews.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem',
            color: 'hsl(var(--muted-foreground))'
          }}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              style={{ margin: '0 auto 1rem', opacity: 0.5 }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              No interviews yet
            </p>
            {dashboardData.user.role === 'interviewer' ? (
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Start your first interview to see your history here
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Join an interview to see your history here
              </p>
            )}
            {dashboardData.user.role === 'interviewer' ? (
              <button 
                onClick={handleStartInterview}
                className="action-btn run-btn"
              >
                Start Interview
              </button>
            ) : (
              <Link 
                to="/join" 
                className="action-btn run-btn"
                style={{ textDecoration: 'none' }}
              >
                Join Interview
              </Link>
            )}
          </div>
        ) : (
          <div className="questions-list" style={{ maxHeight: 'none', border: 'none' }}>
            {recentInterviews.map((interview, index) => (
              <div key={interview._id || index} className="question-item" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span className={`role-badge ${interview.role}`}>
                        {interview.role}
                      </span>
                      {interview.difficulty && (
                        <span 
                          className={`question-difficulty ${interview.difficulty}`}
                          style={{ 
                            background: `${getDifficultyColor(interview.difficulty)} / 0.1`,
                            color: getDifficultyColor(interview.difficulty),
                            border: `1px solid ${getDifficultyColor(interview.difficulty)} / 0.2`
                          }}
                        >
                          {interview.difficulty}
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.75rem',
                        color: interview.status === 'completed' ? 'hsl(142 76% 36%)' : 
                              interview.status === 'ongoing' ? 'hsl(32 95% 44%)' : 
                              'hsl(var(--muted-foreground))',
                        background: interview.status === 'completed' ? 'hsl(142 76% 36% / 0.1)' : 
                                   interview.status === 'ongoing' ? 'hsl(32 95% 44% / 0.1)' : 
                                   'hsl(var(--muted))',
                        padding: '0.125rem 0.375rem',
                        borderRadius: 'calc(var(--radius) - 4px)',
                        textTransform: 'capitalize',
                        border: `1px solid ${interview.status === 'completed' ? 'hsl(142 76% 36% / 0.2)' : 
                                             interview.status === 'ongoing' ? 'hsl(32 95% 44% / 0.2)' : 
                                             'hsl(var(--border))'}`
                      }}>
                        {interview.status === 'completed' ? 'Completed' : 
                         interview.status === 'ongoing' ? 'Ongoing' : 
                         interview.status}
                      </span>
                    </div>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '1rem', 
                      fontWeight: '500',
                      color: 'hsl(var(--foreground))',
                      marginBottom: '0.5rem'
                    }}>
                      {interview.questionTitle || `Interview #${interview.roomId}`}
                    </h4>
                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      fontSize: '0.75rem',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                      <span>Room: {interview.roomId}</span>
                      {interview.language && <span>Language: {interview.language}</span>}
                      {interview.score !== null && interview.score !== undefined && (
                        <span>Score: {interview.score}/100</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    <div>{formatDate(interview.createdAt)}</div>
                    {interview.completedAt && interview.completedAt !== interview.createdAt && (
                      <div style={{ marginTop: '0.25rem', opacity: 0.7 }}>
                        Completed: {formatDate(interview.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
                {interview.feedback && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'hsl(var(--muted))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    fontSize: '0.875rem',
                    color: 'hsl(var(--foreground))',
                    borderLeft: '3px solid hsl(var(--primary))'
                  }}>
                    <strong>Feedback:</strong> {interview.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copy Feedback Toast */}
      {copyFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius)',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          fontSize: '0.875rem',
          fontWeight: '500',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {copyFeedback}
        </div>
      )}

      {/* Start Interview Modal */}
      {showInterviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: 'hsl(var(--foreground))',
                letterSpacing: '-0.025em'
              }}>
                Interview Room Created
              </h3>
              <p style={{ 
                fontSize: '0.875rem',
                color: 'hsl(var(--muted-foreground))',
                margin: '0'
              }}>
                Share this room code with the candidate
              </p>
            </div>

            <div style={{
              background: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) - 2px)',
              padding: '1rem',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--muted-foreground))',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.05em'
              }}>
                Room Code
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'hsl(var(--foreground))',
                fontFamily: 'monospace',
                letterSpacing: '0.1em'
              }}>
                {generatedRoomId}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={copyRoomCode}
                style={{
                  background: 'hsl(var(--secondary))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--secondary-foreground))',
                  padding: '0.75rem 1rem',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => e.target.style.background = 'hsl(var(--secondary) / 0.8)'}
                onMouseLeave={(e) => e.target.style.background = 'hsl(var(--secondary))'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="m4 16-2-2v-10c0-1.1.9-2 2-2h10l2 2"/>
                </svg>
                Copy Code
              </button>
              
              <button
                onClick={enterRoom}
                className="action-btn run-btn"
                style={{ flex: 1 }}
              >
                Enter Room
              </button>
            </div>

            <button
              onClick={() => setShowInterviewModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--muted-foreground))',
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginTop: '1rem',
                padding: '0.5rem',
                transition: 'color 0.15s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => e.target.style.color = 'hsl(var(--foreground))'}
              onMouseLeave={(e) => e.target.style.color = 'hsl(var(--muted-foreground))'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
