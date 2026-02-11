import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import MonacoEditor from '@monaco-editor/react';
import io from 'socket.io-client';
import axios from 'axios';
import Questions from './Questions';
import AIAssistant from './AIAssistant';
import WebRTCVideoCall from './components/WebRTCVideoCall';
import RubricScoring from './components/RubricScoring';
import InterviewReport from './components/InterviewReport';
import config from './config';
import './App.css';

const SOCKET_URL = config.SOCKET_URL;

const languages = [
  { label: 'Python', value: 'python3' },
  { label: 'JavaScript', value: 'nodejs' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp17' },
  { label: 'C#', value: 'csharp' },
  { label: 'PHP', value: 'php' },
  { label: 'Swift', value: 'swift' },
  { label: 'Kotlin', value: 'kotlin' },
];

const themes = [
  { label: 'Dark', value: 'vs-dark' },
  { label: 'Light', value: 'light' },
  { label: 'High Contrast', value: 'hc-black' }
];

export default function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', {
        state: {
          from: `/room/${roomId}`,
          message: 'Please sign in to access the interview room'
        }
      });
    }
  }, [isAuthenticated, navigate, roomId]);

  if (!isAuthenticated()) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
        color: 'hsl(var(--foreground))'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '1.125rem',
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Authentication Required
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))'
          }}>
            Redirecting to sign in...
          </div>
        </div>
      </div>
    );
  }

  const role = location.state?.role || 'candidate';
  const [code, setCode] = useState();
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('nodejs');
  const [theme, setTheme] = useState('vs-dark');
  const socketRef = useRef();
  const [showQuestions, setShowQuestions] = useState(false);
  const [ended, setEnded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showNotes, setShowNotes] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showRubricScoring, setShowRubricScoring] = useState(false);
  const [showInterviewReport, setShowInterviewReport] = useState(false);
  const [activeInterviewerTab, setActiveInterviewerTab] = useState('notes');
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [userAlerts, setUserAlerts] = useState([]);
  const [alertIdCounter, setAlertIdCounter] = useState(0);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesLastSaved, setNotesLastSaved] = useState(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('joinRoom', {
        roomId,
        role,
        username: user?.username || 'Anonymous'
      });

      // Start interview tracking 
      startInterviewTracking();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('init', ({ code }) => {
      setCode(code || `/* 
- Hey! Friendly request from your dev buddy...
- JDoodle(API that I am using to execute code) credits are super limited (Just 22 per day for a free plan)
- Please stick to just 1 to 2 runs, so other curious souls can also test out the platform.
- If the code is not running, that means the daily limit is reached.
- Thanks for trying out Techify... XOXO
*/

// Start coding below this line
`);
    });

    socketRef.current.on('codeChange', setCode);

    socketRef.current.on('outputChange', (outputData) => {
      const displayOutput = outputData.error || outputData.output || 'Code executed successfully.';
      setOutput(`[${outputData.executedBy}] ${displayOutput}`);
    });

    socketRef.current.on('interviewEnded', () => {
      setEnded(true);

      if (isAuthenticated()) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    });

    // Listen for user join events
    socketRef.current.on('userJoined', ({ username, role: userRole, userId }) => {
      setJoinedUsers(prev => {
        if (!prev.find(u => u.userId === userId)) {
          const newUser = { username, role: userRole, userId, joinedAt: new Date() };

          if (userRole === 'candidate' && role === 'interviewer') {
            showUserJoinAlert(username, userRole);
          }

          return [...prev, newUser];
        }
        return prev;
      });
    });

    socketRef.current.on('userLeft', ({ userId, username, role: userRole }) => {
      setJoinedUsers(prev => prev.filter(u => u.userId !== userId));

      // Show alert when user leaves (for interviewers)
      if (role === 'interviewer' && userRole === 'candidate') {
        showUserLeaveAlert(username, userRole);
      }
    });

    fetchTimerInfo();

    if (role === 'interviewer') {
      fetchInterviewNotes();
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, role]);

  // Browser navigation protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!ended) {
        const message = 'Are you sure you want to leave the interview? Your progress may be lost.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handlePopState = (e) => {
      if (!ended) {
        const confirmLeave = window.confirm('Are you sure you want to leave the interview? Your progress may be lost.');
        if (!confirmLeave) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        } else {
          completeInterviewTracking({
            status: 'left_early',
            feedback: 'User navigated away from interview'
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Push initial state to detect back button
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [ended]);

  // Interview tracking functions
  const startInterviewTracking = async () => {
    if (isAuthenticated() && !interviewStarted) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${config.API_BASE_URL}/api/auth/interview`, {
          roomId,
          role,
          language
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterviewStarted(true);
      } catch (error) {
        console.error('Failed to start interview tracking:', error);
      }
    }
  };

  const completeInterviewTracking = async (additionalData = {}) => {
    if (isAuthenticated() && interviewStarted) {
      try {
        const token = localStorage.getItem('token');
        const duration = startTime ? Math.round((Date.now() - new Date(startTime).getTime()) / 60000) : 0;

        await axios.put(`${config.API_BASE_URL}/api/auth/interview/${roomId}/complete`, {
          duration,
          codeSubmitted: code,
          ...additionalData
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Failed to complete interview tracking:', error);
      }
    }
  };

  // User join alert functions
  const showUserJoinAlert = (username, userRole) => {
    const alertId = alertIdCounter;
    setAlertIdCounter(prev => prev + 1);

    const newAlert = {
      id: alertId,
      message: `${userRole === 'candidate' ? 'Candidate' : 'Interviewer'}: ${username} joined the room`,
      type: 'success',
      timestamp: new Date()
    };

    setUserAlerts(prev => [...prev, newAlert]);

    setTimeout(() => {
      setUserAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }, 5000);
  };

  const showUserLeaveAlert = (username, userRole) => {
    const alertId = alertIdCounter;
    setAlertIdCounter(prev => prev + 1);

    const newAlert = {
      id: alertId,
      message: `${userRole === 'candidate' ? 'Candidate' : 'Interviewer'}: ${username} left the interview`,
      type: 'warning',
      timestamp: new Date()
    };

    setUserAlerts(prev => [...prev, newAlert]);

    setTimeout(() => {
      setUserAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }, 5000);
  };

  const dismissAlert = (alertId) => {
    setUserAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    if (!ended && startTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [ended, startTime]);

  const fetchTimerInfo = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/room/${roomId}/timer`);
      setStartTime(new Date(res.data.startTime));
      setEnded(!res.data.isActive);
    } catch (err) {
      console.error('Failed to fetch timer info:', err);
    }
  };

  const fetchInterviewNotes = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/room/${roomId}/notes`);
      setInterviewNotes(res.data.notes || '');
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const saveInterviewNotes = async (notes) => {
    setNotesSaving(true);
    try {
      await axios.put(`${config.API_BASE_URL}/api/room/${roomId}/notes`, { notes });
      setNotesLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setNotesSaving(false);
    }
  };

  const handleCodeChange = (value) => {
    setCode(value || '');
    socketRef.current?.emit('codeChange', value);
  };

  const runCode = async () => {
    setLoading(true);
    setOutput(`[${role}] Running code...`);

    const startTime = performance.now();
    const timestamp = new Date();

    try {
      const res = await axios.post(`${config.API_BASE_URL}/api/code/execute`, {
        code,
        language,
        roomId,
        executedBy: role
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Add to execution history
      const historyEntry = {
        id: Date.now(),
        timestamp,
        code: code,
        language,
        output: res.data.output || res.data.error || 'Code executed successfully.',
        success: !res.data.error,
        executedBy: role,
        executionTime: Math.round(executionTime)
      };

      setExecutionHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20 runs

      if (!socketRef.current?.connected) {
        setOutput(`[${role}] ${res.data.output || res.data.error || 'Code executed successfully.'}`);
      }
    } catch (err) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Add failed execution to history
      const historyEntry = {
        id: Date.now(),
        timestamp,
        code: code,
        language,
        output: 'Error: Could not execute code. Please check your connection and try again.',
        success: false,
        executedBy: role,
        executionTime: Math.round(executionTime)
      };

      setExecutionHistory(prev => [historyEntry, ...prev.slice(0, 19)]);
      setOutput(`[${role}] Error: Could not execute code. Please check your connection and try again.`);
    }
    setLoading(false);
  };

  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      try {
        await axios.put(`${config.API_BASE_URL}/api/room/${roomId}/end`);

        // Complete interview tracking
        await completeInterviewTracking({
          feedback: interviewNotes
        });

        setEnded(true);
        socketRef.current?.emit('endInterview');

        if (isAuthenticated()) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to end interview:', err);
      }
    }
  };

  const handleLeaveInterview = async () => {
    if (window.confirm('Are you sure you want to leave the interview? This action cannot be undone and your progress may be lost.')) {
      try {
        await completeInterviewTracking({
          status: 'left_early',
          feedback: 'Candidate left the interview early'
        });

        const alertId = alertIdCounter;
        setAlertIdCounter(prev => prev + 1);

        const leaveAlert = {
          id: alertId,
          message: 'You have left the interview. Redirecting to dashboard...',
          type: 'warning',
          timestamp: new Date()
        };

        setUserAlerts(prev => [...prev, leaveAlert]);

        socketRef.current?.emit('userLeave', {
          roomId,
          username: user?.username || 'Anonymous',
          role
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (err) {
        console.error('Failed to leave interview:', err);
        navigate('/dashboard');
      }
    }
  };

  const handleNotesChange = (notes) => {
    setInterviewNotes(notes);
    saveInterviewNotes(notes);
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSelectQuestion = (formattedQuestion) => {
    setShowQuestions(false);
    setCode(formattedQuestion);
    socketRef.current?.emit('codeChange', formattedQuestion);
  };

  return (
    <div className="app-root">
      <div className="editor-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="room-question">
            {ended ? (
              <span style={{ color: '#ef4444' }}>Interview Ended</span>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {joinedUsers.length > 0 ? (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>

                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'hsl(var(--foreground))'
                      }}>
                        Participants:
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {/* Current user */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        background: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'calc(var(--radius) - 2px)',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'hsl(142 76% 36%)'
                        }}></div>
                        {user?.username || 'You'} ({role})
                      </div>

                      {/* Other joined users */}
                      {joinedUsers.map((joinedUser) => (
                        <div key={joinedUser.userId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          background: 'hsl(var(--secondary) / 0.8)',
                          color: 'hsl(var(--secondary-foreground))',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'calc(var(--radius) - 2px)',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: joinedUser.role === 'interviewer' ? 'hsl(32 95% 44%)' : 'hsla(243, 83%, 58%, 1.00)'
                          }}></div>
                          {joinedUser.username} ({joinedUser.role})
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      Waiting for participants...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '0.25rem'
          }}>
            Room: <strong>{roomId}</strong> • {isConnected ? 'Connected' : 'Disconnected'}
            {startTime && (
              <span> • <strong>{formatTime(currentTime - startTime.getTime())}</strong></span>
            )}
          </div>
        </div>

        <div className="room-controls">
          {role === 'interviewer' && !ended && (
            <>
              <button
                className="action-btn save-btn"
                onClick={() => setShowQuestions(true)}
                title="Browse Questions"
              >Questions
              </button>

              <button
                className="action-btn save-btn"
                onClick={() => setShowAI(true)}
                title="AI Assistant"
              > AI Assistant
              </button>

              <button
                className="action-btn save-btn"
                onClick={() => setShowVideoCall(true)}
                title="Start Video Call"
                >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                </svg>
                Video Call
              </button>

              <div className="dropdown-menu">
                <button className="dropdown-trigger" aria-expanded="false">
                  <span>Evaluation</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="dropdown-content">
                  <div className="dropdown-label">Assessment Tools</div>
                  <button
                    className="dropdown-item"
                    onClick={() => setShowRubricScoring(true)}
                  ><span>Rubric Scoring</span>
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => setShowInterviewReport(true)}
                  ><span>Generate Report</span>
                  </button>
                  <div className="dropdown-separator"></div>
                  <button
                    className="dropdown-item"
                    onClick={() => setShowHistory(true)}
                  ><span>History ({executionHistory.length})</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {role === 'candidate' && !ended && (
            <>
              <button
                className="action-btn save-btn"
                onClick={() => setShowVideoCall(true)}
                title="Join Video Call"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 8-6 4 6 4V8Z" />
                  <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                </svg>
                Join Call
              </button>
            </>
          )}

          <div className="dropdown-menu">
            <button className="dropdown-trigger" aria-expanded="false">
              <span>{languages.find(l => l.value === language)?.label || 'Language'}</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="dropdown-content">
              <div className="dropdown-label">Select Language</div>
              {languages.map(l => (
                <button
                  key={l.value}
                  className={`dropdown-item ${language === l.value ? 'dropdown-item-active' : ''}`}
                  onClick={() => setLanguage(l.value)}
                >
                  <span>{l.label}</span>
                  {language === l.value && (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="dropdown-menu">
            <button className="dropdown-trigger" aria-expanded="false">
              <span>{themes.find(t => t.value === theme)?.label || 'Theme'}</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="dropdown-content">
              <div className="dropdown-label">Select Theme</div>
              {themes.map(t => (
                <button
                  key={t.value}
                  className={`dropdown-item ${theme === t.value ? 'dropdown-item-active' : ''}`}
                  onClick={() => setTheme(t.value)}
                >
                  <span>{t.label}</span>
                  {theme === t.value && (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="role-badge">
            {role === 'interviewer' ? ' ' : ''} {role}
          </div>

          {role === 'interviewer' && !ended && (
            <button
              className="action-btn"
              style={{
                background: 'transparent',
                borderColor: '#ef4444',
                color: '#fff',
                fontSize: '0.875rem',
              }}
              onClick={handleEndInterview}
              title="End the interview"
            >
              End Interview
            </button>
          )}

          {role === 'candidate' && !ended && (
            <button
              className="action-btn"
              style={{
                background: 'transparent',
                borderColor: '#ef4444',
                color: 'white',
                fontSize: '0.875rem',
              }}
              onClick={handleLeaveInterview}
              title="Leave the interview"
            >
              Leave Interview
            </button>
          )}
        </div>
      </div>

      <div className={`room-action-buttons ${role === 'interviewer' ? 'interviewer' : ''}`}>
        {role === 'candidate' && (
          <>
            <button
              className="action-btn save-btn"
              onClick={() => setShowHistory(true)}
              title="View execution history"
            >
              History ({executionHistory.length})
            </button>
            <button
              className={`action-btn run-btn ${loading ? 'loading' : ''}`}
              onClick={runCode}
              disabled={loading}
              title="Run code"
            >
              {loading ? 'Running...' : 'Run Code'}
            </button>
          </>
        )}
      </div>

      {/* Main content with split layout */}
      <div className="main-content-container">
        {/* Editor section */}
        <div className="editor-section">
          <div className="editor-container">
            <MonacoEditor
              height="65vh"
              theme={theme}
              language={
                language === 'python3' ? 'python' :
                  language === 'nodejs' ? 'javascript' :
                    language === 'cpp17' ? 'cpp' :
                      language === 'c' ? 'c' :
                        language === 'java' ? 'java' :
                          language === 'csharp' ? 'csharp' :
                            language === 'php' ? 'php' :
                              language === 'swift' ? 'swift' :
                                language === 'kotlin' ? 'kotlin' :
                                  language
              }
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: true },
                wordWrap: 'on',
                contextmenu: true,
                lineNumbers: 'on',
                folding: true,
                renderLineHighlight: 'line',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnType: true,
                formatOnPaste: true,
                suggestOnTriggerCharacters: true,
                tabCompletion: 'on',
                quickSuggestions: true,
                codeLens: true,
                lightbulb: { enabled: true },
                links: true,
                mouseWheelZoom: true,
                renderWhitespace: 'selection',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                inlineSuggest: { enabled: true },
                find: {
                  seedSearchStringFromSelection: 'always',
                  autoFindInSelection: 'multiline'
                },
                gotoLine: { enabled: true },
                parameterHints: { enabled: true },
                hover: { enabled: true, delay: 300 },
                matchBrackets: 'always',
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line thin',
                cursorBlinking: 'expand',
                hideCursorInOverviewRuler: false,
                overviewRulerLanes: 2,
                renderControlCharacters: false,
                renderIndentGuides: true,
                renderValidationDecorations: 'on',
                rulers: [],
                dragAndDrop: true,
                multiCursorModifier: 'alt',
                accessibilitySupport: 'auto',
                fontSize: 14,
                fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
                padding: { top: 16, bottom: 16 },
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: true,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          </div>

          {role === 'interviewer' && !ended && (
            <div style={{
              display: 'flex',
              justifyContent: 'left',
              marginBottom: '2rem',
              paddingRight: '0.5rem'
            }}>
              <button
                className={`action-btn run-btn ${loading ? 'loading' : ''}`}
                onClick={runCode}
                disabled={loading}
                title="Run code"
                style={{
                  fontSize: '0.875rem',
                  padding: '0.5rem 1.25rem',
                  minHeight: '2.5rem'
                }}
              >
                {loading ? 'Running...' : 'Run Code'}
              </button>
            </div>
          )}

          <div className="output-container">
            <span className="output-label">Output</span>
            <pre className="output-area">{output || 'No output yet. Run your code to see results here.'}</pre>
          </div>
        </div>

        {/* Notes sidebar for interviewer */}
        {role === 'interviewer' && !ended && (
          <div className="notes-sidebar">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid hsl(var(--border))'
            }}>
              <h3 style={{ margin: 0 }}>Interview Notes</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="action-btn save-btn"
                  onClick={() => setShowHistory(true)}
                  title="View Execution History"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    minHeight: '1.75rem'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                  {executionHistory.length}
                </button>
              </div>
            </div>

            {/* Quick Assessment Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <button
                className="action-btn save-btn"
                onClick={() => setShowRubricScoring(true)}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  gap: '0.25rem',
                  flexDirection: 'column'
                }}
              >
                Scoring
              </button>
              <button
                className="action-btn save-btn"
                onClick={() => setShowInterviewReport(true)}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  gap: '0.25rem',
                  flexDirection: 'column'
                }}
              >
                Report
              </button>
            </div>
            <textarea
              className="notes-textarea"
              value={interviewNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Enter your interview notes here... Saved as you type..."
              style={{ minHeight: '290px' }}
            />
          </div>
        )}
      </div>

      {showQuestions && role === 'interviewer' && (
        <div className="modal-overlay" onClick={() => setShowQuestions(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <Questions onSelect={handleSelectQuestion} onClose={() => setShowQuestions(false)} />
          </div>
        </div>
      )}

      {showAI && role === 'interviewer' && (
        <div className="modal-overlay" onClick={() => setShowAI(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <AIAssistant
              roomId={roomId}
              code={code}
              language={language}
              onClose={() => setShowAI(false)}
            />
          </div>
        </div>
      )}

      {showVideoCall && (
        <WebRTCVideoCall
          roomId={roomId}
          role={role}
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
        />
      )}

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '12px',
              border: '1px solid rgba(171, 171, 171, 0.2)',
              backdropFilter: 'blur(30px)',
            }}>
              <button
                onClick={() => setShowHistory(false)}
                className="modal-close"
                aria-label="Close History"
              >
                ×
              </button>

              <div style={{
                padding: '24px 32px 20px 32px',
                borderBottom: '1px solid rgba(170, 170, 170, 0.2)'
              }}>
                <h3 style={{
                  margin: '0',
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#fff',
                  textAlign: 'center',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}>
                  Execution History
                </h3>
              </div>

              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '24px'
              }}>
                {executionHistory.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: '0.9rem',
                    padding: '40px',
                    letterSpacing: '-0.5px',
                  }}>
                    No execution history yet. 
                    <br></br>Run some code to see it here!
                  </div>
                ) : (
                  executionHistory.map((entry) => (
                    <div key={entry.id} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid rgba(${entry.success ? '16, 185, 129' : '239, 68, 68'}, 0.3)`,
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        color: entry.success ? '#ffffffff' : '#ffffffff',
                        fontWeight: '600'
                      }}>
                        <span>{entry.success ? '✅' : '❌'} {entry.language}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {entry.timestamp.toLocaleTimeString()} • {entry.executionTime}ms
                        </span>
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: '#d1d5db',
                        whiteSpace: 'pre-wrap',
                        overflow: 'auto',
                        maxHeight: '200px'

                      }}>
                        {entry.code}
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: entry.success ? '#d1d5db' : '#fca5a5',
                        maxHeight: '100px',
                        overflow: 'auto',
                      }}>
                        {entry.output}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rubric Scoring Modal */}
      {showRubricScoring && (
        <div className="modal-overlay" onClick={() => setShowRubricScoring(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <RubricScoring
              roomId={roomId}
              onClose={() => setShowRubricScoring(false)}
            />
          </div>
        </div>
      )}

      {/* Interview Report Modal */}
      {showInterviewReport && (
        <div className="modal-overlay" onClick={() => setShowInterviewReport(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <InterviewReport
              roomId={roomId}
              onClose={() => setShowInterviewReport(false)}
            />
          </div>
        </div>
      )}

      {/* User Join Alerts */}
      {userAlerts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {userAlerts.map(alert => (
            <div
              key={alert.id}
              className="user-join-alert"
              style={{
                background: alert.type === 'success' ? 'hsl(142 76% 36%)' :
                  alert.type === 'warning' ? 'hsl(32 95% 44%)' :
                    'hsl(var(--primary))',
                color: '#ffffff',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                fontSize: '0.875rem',
                fontWeight: '500',
                maxWidth: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '1rem' }}>
                  {alert.type === 'success' ? '✅' :
                    alert.type === 'warning' ? '⚠️' :
                      'ℹ️'}
                </div>
                <span>{alert.message}</span>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  fontSize: '1rem',
                  lineHeight: '1',
                  opacity: 0.8,
                  borderRadius: '2px'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.8'}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
} 