import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import axios from 'axios';
import config from './config';
import InterviewReport from './components/InterviewReport';
import './App.css';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportRoomId, setSelectedReportRoomId] = useState('');
  const [showIntegrityRulesModal, setShowIntegrityRulesModal] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (user?.role === 'candidate' && !user?.profileCompleted) {
      navigate('/profile-setup');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, navigate, user?.role, user?.profileCompleted]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${config.API_BASE_URL}/api/auth/dashboard`, {
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
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    try {
      // Call logout endpoint
      await axios.post(`${config.API_BASE_URL}/api/auth/logout`);
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    }

    logout();
    navigate('/login');
  };

  const handleStartInterview = async () => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setGeneratedRoomId(roomId);
      const token = localStorage.getItem('token');
      const inviteResponse = await axios.post(`${config.API_BASE_URL}/api/auth/interview/${roomId}/invite`, {
        ttlSeconds: 1800
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inviteToken = inviteResponse.data.inviteToken;
      const inviteLink = `${window.location.origin}/join?roomId=${roomId}&invite=${encodeURIComponent(inviteToken)}`;
      setGeneratedInviteLink(inviteLink);

      setShowInterviewModal(true);
    } catch (error) {
      console.error('Start interview error:', error);
      setError('Failed to generate room code. Please try again.');
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedInviteLink || generatedRoomId);
      setCopyFeedback(generatedInviteLink ? 'Invite link copied!' : 'Room code copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const enterRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_BASE_URL}/api/auth/interview`, {
        roomId: generatedRoomId,
        role: 'interviewer'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate(`/room/${generatedRoomId}`);
    } catch (error) {
      console.error('Enter room error:', error);
      setError('Failed to start interview. Please try again.');
    }
  };

  const openInterviewReport = (roomId) => {
    setSelectedReportRoomId(roomId);
    setShowReportModal(true);
  };

  const closeInterviewReport = () => {
    setShowReportModal(false);
    setSelectedReportRoomId('');
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
  const interviewerExtraStats = [
    {
      label: 'Completed Interviews',
      value: stats.completedInterviews || 0,
      subLabel: `${stats.totalInterviews || 0} total`
    },
    {
      label: 'Avg Candidate Score',
      value: (stats.completedInterviews || 0) > 0 ? `${stats.averageScore || 0}/100` : 'N/A',
      subLabel: (stats.completedInterviews || 0) > 0 ? 'From completed sessions' : 'No completed sessions yet'
    }
  ];

  return (
    <div className="app-root">
      <div className="editor-header" style={{
        maxWidth: '80rem', letterSpacing: '-0.05em',
      }}>
        <div>
          <h2 style={{
            background: 'linear-gradient(135deg, #ffffff, #cacacaff, #ffffffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.05em',
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
          <Link
            to="/settings/profile"
            className="action-btn save-btn"
            title="Profile Settings"
            aria-label="Profile Settings"
            style={{
              textDecoration: 'none',
              width: '40px',
              height: '40px',
              padding: 0
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ opacity: 1 }}
            >
              <path d="m14.305 19.53l.923-.382m0-2.296l-.923-.383m2.547-1.241l-.383-.923m.383 6.467l-.383.924m2.679-6.468l.383-.923m-.001 7.391l-.382-.924M2 21a8 8 0 0 1 10.434-7.62m8.338 3.472l.924-.383m-.924 2.679l.924.383" />
              <circle cx="10" cy="8" r="5" />
              <circle cx="18" cy="18" r="3" />
            </svg>
          </Link>
          {dashboardData.user.role === 'candidate' && (
            <button
              onClick={() => setShowIntegrityRulesModal(true)}
              className="action-btn save-btn"
              style={{ height: '40px' }}
            >
              Important Instructions
            </button>
          )}
          {dashboardData.user.role === 'interviewer' ? (
            <button
              onClick={handleStartInterview}
              className="action-btn run-btn"
              style={{height:'40px'}}
            >
              Create Interview
            </button>
          ) : (
            <Link
              to="/join"
              className="action-btn run-btn"
              style={{ textDecoration: 'none', letterSpacing: '0.01em' }}
            >
              Join Interview
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="action-btn save-btn"
            style={{background: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.2)', color: 'hsl(var(--destructive-foreground))', height:'40px'}}
          >
            Logout
          </button>
        </div>
      </div>
      <div style={{
        width: '100%',
        maxWidth: '80rem',
        display: 'grid',
        gridTemplateColumns: dashboardData.user.role === 'interviewer' ? 'repeat(3, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
        gap: '0.75rem',
        marginBottom: '2rem'
      }}>

        <div
          className="join-container"
          style={{ margin: 0, padding: '1.5rem', paddingLeft: '2rem', width: '100%', maxWidth: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0, marginBottom: '0.25rem' }}>
                {dashboardData.user.role === 'interviewer' ? 'Interviews Conducted' : 'Interviews Attended'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                +{stats.thisMonthInterviews} this month
              </p>
            </div>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: 'hsl(var(--foreground))', textAlign: 'center', gap: '0.5rem', }}>
            {stats.totalInterviews}
          </p>
        </div>


        {dashboardData.user.role === 'interviewer' && interviewerExtraStats.map((item) => (
          <div
            key={item.label}
            className="join-container"
            style={{ margin: 0, padding: '1.5rem', paddingLeft: '2rem', width: '100%', maxWidth: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', margin: 0, marginBottom: '0.25rem' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                  {item.subLabel}
                </p>
              </div>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: 'hsl(var(--foreground))', textAlign: 'center', gap: '0.5rem' }}>
              {item.value}
            </p>
          </div>
        ))}
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: dashboardData.user.role === 'interviewer' ? '1fr auto' : '1fr',
                  gap: '1rem',
                  alignItems: 'start'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      marginBottom: '0.6rem'
                    }}>
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
                        fontSize: '0.72rem',
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

                    <div style={{
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      fontSize: '0.78rem',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                      <span>Room: {interview.roomId}</span>
                      {interview.language && <span>Language: {interview.language}</span>}
                      {dashboardData.user.role === 'interviewer' && interview.score !== null && interview.score !== undefined && (
                        <span>Score Given: {interview.score}/100</span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.5rem'
                  }}>
                    <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>
                      <div>{formatDate(interview.createdAt)}</div>
                      {interview.completedAt && interview.completedAt !== interview.createdAt && (
                        <div style={{ marginTop: '0.2rem', opacity: 0.75 }}>
                          Completed: {formatDate(interview.completedAt)}
                        </div>
                      )}
                    </div>
                    {dashboardData.user.role === 'interviewer' && (
                      <button
                        onClick={() => openInterviewReport(interview.roomId)}
                        className="action-btn save-btn"
                        style={{
                          fontSize: '0.74rem',
                          padding: '0.35rem 0.7rem',
                          minHeight: 'unset',
                          border: '1px solid rgb(80, 80, 80)',
                        }}
                      >
                        View Report
                      </button>
                    )}
                  </div>
                </div>
                {dashboardData.user.role === 'interviewer' && interview.feedback && (
                  <div style={{
                    marginTop: '0.7rem',
                    padding: '0.75rem',
                    background: 'hsl(var(--muted))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    fontSize: '0.82rem',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--muted))',
                    borderColor: 'rgb(80, 80, 80)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                  }}>
                    <strong>Overall Assessment</strong>
                    {'\n'}
                    {interview.feedback}
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
          zIndex: 2000,
          animation: 'fadeIn 0.3s ease-out',
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
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'transparent',
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
                Share this Invite Link with the candidate.
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
                Room ID
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
              {generatedInviteLink && (
                <div style={{
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--muted-foreground))',
                  wordBreak: 'break-all'
                }}>
                  {generatedInviteLink}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={copyRoomCode}
                className="action-btn"
                style={{
                  background: copyFeedback ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                  border: `1px solid ${copyFeedback ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  color: copyFeedback ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
                  padding: '0.75rem 1rem',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: copyFeedback ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  minWidth: '130px',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                disabled={!!copyFeedback}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: 'all 0.2s ease'
                }}>
                  {copyFeedback ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ animation: 'fadeIn 0.2s ease-out' }}>Invite Link Copied</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s ease' }}>
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      <span>Copy Invite Link</span>
                    </>
                  )}
                </div>
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

      {/* Interview Report Modal */}
      {showReportModal && selectedReportRoomId && (
        <div className="modal-overlay" onClick={closeInterviewReport}>
          <div onClick={(e) => e.stopPropagation()}>
            <InterviewReport
              roomId={selectedReportRoomId}
              onClose={closeInterviewReport}
            />
          </div>
        </div>
      )}

      {showIntegrityRulesModal && dashboardData.user.role === 'candidate' && (
        <div className="modal-overlay" onClick={() => setShowIntegrityRulesModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '42rem' }}
          >
            <button
              onClick={() => setShowIntegrityRulesModal(false)}
              className="modal-close"
              aria-label="Close integrity rules"
            >
              ×
            </button>
            <div className="modal-header" style={{ textAlign: 'Center', marginBottom: '1rem' }}>
              <h3 className="modal-title">Interview Instructions and Important Rules</h3>
              <p className="modal-description" style={{ marginTop: '0.3em' }}>
                Please follow the below instructions strictly for a smooth interview experience <br></br>and to ensure the integrity of the process.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '0.9rem' }}>
              {[
                {
                  title: 'Environment',
                  points: [
                    'It is recommended to use a stable internet connection throughout the interview.',
                    'Allowing camera and microphone access is required for the interview.',
                    'Using full-screen mode is compulsory for the entire duration of the interview.'
                  ] 
                },
                {
                  title: 'Behavior Rules',
                  points: [
                    'tabs/windows switching is strictly prohibited during the interview.',
                    'Copy, cut, and paste actions are disabled.',
                    'Keeping the video call active is compulsory during the interview.'
                  ]
                },
                {
                  title: 'Cheat Detection & Monitoring',
                  points: [
                    'Tab visibility and focus changes are being monitored.',
                    'Full-screen exits are logged and may raise integrity flags.',
                    'Clipboard attempts, media availability, and network changes are tracked.',
                    'Video and audio feeds are monitored for anomalies.'
                  ]
                },
                {
                  title: 'Consequences of Violations',
                  points: [
                    'You receive a few warnings while in the interview.',
                    'If cheating persists, you will be disqualified and interview will be marked as failed.',
                    'All integrity flags are saved in timeline/report evidence and may impact decisions.'
                  ]
                }
              ].map((section) => (
                <div
                  key={section.title}
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    padding: '0.85rem',
                    background: 'hsl(var(--muted) / 0.35)'
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.55rem' }}>{section.title}</div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem', fontSize: '0.84rem', color: 'hsl(var(--muted-foreground))' }}>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
