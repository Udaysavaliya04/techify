import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion, transform, useScroll, useTransform } from 'framer-motion';
import { useAuth } from './components/AuthWrapper';
import config from './config';
import './App.css';

export default function Join() {
  const [room, setRoom] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [inviteToken, setInviteToken] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const featureSectionRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);
  const { isAuthenticated, user } = useAuth();

  const { scrollYProgress: featureScrollProgress } = useScroll({
    target: featureSectionRef,
    offset: ['start end', 'end start'],
  });
  const featureGlowY = useTransform(featureScrollProgress, [0, 1], [70, -70]);
  const featureGlowOpacity = useTransform(
    featureScrollProgress,
    [0, 0.5, 1],
    [0.2, 0.75, 0.2]
  );

  useEffect(() => {
    if (isAuthenticated() && user?.role === 'candidate' && !user?.profileCompleted) {
      navigate('/profile-setup');
    }
  }, [isAuthenticated, user?.role, user?.profileCompleted, navigate]);

  useEffect(() => {
    setRoom(otpValues.join(''));
  }, [otpValues]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invite = params.get('invite') || '';
    const roomFromUrl = (params.get('roomId') || '').toUpperCase().slice(0, 6);

    if (invite) {
      setInviteToken(invite);
    }
    if (roomFromUrl) {
      const newValues = roomFromUrl.padEnd(6, '').split('').slice(0, 6);
      while (newValues.length < 6) newValues.push('');
      setOtpValues(newValues);
    }
  }, [location.search]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newValues = [...otpValues];
    newValues[index] = value.toUpperCase();
    setOtpValues(newValues);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 6);
    const newValues = [...otpValues];

    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || '';
    }
    setOtpValues(newValues);

    // Focus the last filled input or the first empty one
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleInviteInput = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInviteToken('');
      return;
    }

    // Accept either raw token or full invite URL.
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const tokenFromUrl = url.searchParams.get('invite') || '';
        const roomFromUrl = (url.searchParams.get('roomId') || '').toUpperCase().slice(0, 6);
        if (tokenFromUrl) setInviteToken(tokenFromUrl);
        if (roomFromUrl) {
          const newValues = roomFromUrl.split('');
          while (newValues.length < 6) newValues.push('');
          setOtpValues(newValues);
        }
        return;
      } catch {
        // Fall back to treating input as token below.
      }
    }

    setInviteToken(trimmed);
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    const normalizedRoom = room.trim().toUpperCase();
    if (!normalizedRoom) return;

    setJoinError('');
    setJoining(true);
    try {
      // Candidate flow requires signed invite token.
      if (user?.role === 'candidate') {
        if (!inviteToken) {
          setJoinError('Signed invite token is required. Use interviewer invite link.');
          setJoining(false);
          return;
        }
        await axios.post(`${config.API_BASE_URL}/api/auth/invite/consume`, {
          inviteToken
        });
      }

      navigate(`/room/${normalizedRoom}`, { state: { inviteToken } });
    } catch (error) {
      setJoinError(error.response?.data?.error || 'Failed to validate invite. Please request a new invite link.');
    } finally {
      setJoining(false);
    }
  };

  const featureBentoItems = [
    {
      id: 'collaboration',
      badge: 'Realtime Pairing',
      title: 'Collaborative Coding That Feels Instant',
      description:
        'Monaco editor + Socket sync keeps interviewer and candidate in lockstep through every code change and run.',
      meta: 'Socket Sync',
      points: ['Monaco editor sync', 'Shared output streaming', 'Participant presence'],
      glow: 'rgba(66, 153, 225, 0.55)',
      gradient: 'transparent',
    },
    {
      id: 'questions',
      badge: 'Question Bank',
      title: 'Curated Problems In Seconds',
      description:
        'Interviewer workflows include add/edit/delete, difficulty filters, and direct paste into the active room.',
      meta: 'Difficulty Controls',
      points: ['Filter by difficulty', 'Search by tags', 'Paste to editor in one click'],
      glow: 'rgba(98, 161, 255, 0.33)',
      gradient: 'transparent',
    },
    {
      id: 'ai',
      badge: 'AI Assistant',
      title: 'Code Analysis And Interview Q&A',
      description:
        'Analyze candidate code and ask context-aware questions mid-session without leaving the interview room.',
      meta: 'Ask AI for interviewers',
      points: ['Inline code analysis', 'Interview-aware prompts', 'Actionable feedback'],
      glow: 'rgba(129, 153, 248, 0.5)',
      gradient: 'transparent',
    },
    {
      id: 'video',
      badge: 'WebRTC Calls',
      title: 'Native Video Built Into The Room',
      description:
        'Secure camera and mic controls, status indicators, and one-click maximize for interviewer-candidate flow.',
      meta: 'Integrated Video Calling',
      points: ['Audio/video toggles', 'Connection states', 'Maximize during interviews'],
      glow: 'rgba(52, 94, 211, 0.52)',
      gradient: 'transparent',
    },
    {
      id: 'rubric',
      badge: 'Structured Evaluation',
      title: 'Weighted Rubrics For Better Signals',
      description:
        'Score five criteria, add notes, and generate recommendation bands from Strong Hire to No Hire.',
      meta: '5 Core Criteria',
      points: ['Weighted score model', 'Criteria-level notes', 'Recommendation signal'],
      glow: 'rgba(36, 122, 251, 0.39)',
      gradient: 'transparent',
    },
    {
      id: 'reports',
      badge: 'Decision Reports',
      title: 'Replay Timeline, Export, And Share',
      description:
        'Post-interview reports combine notes, rubric data, execution history, and timeline replay with export options.',
      meta: 'Audit-ready Output',
      points: ['Session timeline replay', 'Execution breakdown', 'Export and print support'],
      glow: 'rgba(114, 142, 244, 0.5)',
      gradient: 'transparent',
    },
  ];

  const faqItems = [
    {
      question: 'Can I run a full interview without switching tools?',
      answer:
        'Yes. Techify keeps coding editor, video, question flow, AI assistance, rubric scoring, and report generation inside one interview room.',
    },
    {
      question: 'How does candidate joining work securely?',
      answer:
        'Interviewers generate signed invite links with limited validity. Candidates join using that token and room code, so access remains controlled and traceable.',
    },
    {
      question: 'Can interviewers use their own question bank?',
      answer:
        'Absolutely. You can create, edit, and organize custom questions, then push them directly into the active interview room in one click.',
    },
    {
      question: 'How are evaluations standardized across interviewers?',
      answer:
        'Techify uses weighted rubric criteria, structured notes, and recommendation bands so decisions stay consistent across different interviewers and teams.',
    },
    {
      question: 'Does Techify provide post-interview analytics?',
      answer:
        'Yes. Session timeline, code runs, rubric metrics, and decision snapshots are compiled into interview reports that can be exported and shared.',
    },
    {
      question: 'Is this suitable for remote-first hiring teams?',
      answer:
        'That is the core use case. Techify is designed for remote technical interviews with low-friction setup, collaboration, and decision-ready outcomes.',
    },
  ];

  const howItWorksSteps = [
    {
      id: 'create-room',
      step: '01',
      title: 'Create Interview Room',
      description:
        'Start from your dashboard, generate a room, and pick the interview track in seconds.',
      points: ['Generate secure room ID', 'Choose DSA/System/Role track', 'Load starter question set'],
      accent: 'rgba(122, 211, 255, 0.9)',
    },
    {
      id: 'share-invite',
      step: '02',
      title: 'Share Signed Invite',
      description:
        'Invite candidate with signed token links so only intended participants can join.',
      points: ['Token-based access', 'Time-limited invite links', 'One-click copy and share'],
      accent: 'rgba(142, 172, 255, 0.9)',
    },
    {
      id: 'conduct-interview',
      step: '03',
      title: 'Run Live Interview',
      description:
        'Collaborate in real-time with editor sync, video, AI support, and guided evaluation.',
      points: ['Realtime coding + output sync', 'Integrated video controls', 'AI-assisted probing questions'],
      accent: 'rgba(119, 212, 191, 0.9)',
    },
    {
      id: 'decide-share',
      step: '04',
      title: 'Score, Decide, Export',
      description:
        'Finalize rubric scores and generate decision-ready reports for your hiring panel.',
      points: ['Weighted rubric scoring', 'Timeline + notes replay', 'Exportable final report'],
      accent: 'rgba(255, 189, 124, 0.9)',
    },
  ];

  const getBentoDesktopSpan = (index) =>
    index % 4 === 0 || index % 4 === 3 ? 'span 4' : 'span 2';

  const renderFeatureIcon = (featureId) => {
    switch (featureId) {
      case 'collaboration':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7h8" />
            <path d="M8 12h8" />
            <path d="M8 17h5" />
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
          </svg>
        );
      case 'questions':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 18h.01" />
            <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      case 'ai':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        );
      case 'video':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="m22 8-5 4 5 4V8z" />
          </svg>
        );
      case 'rubric':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        );
      case 'reports':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 14l4-4 3 3 5-6" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderFeaturePreview = (feature, isWideCard) => {
    const panelStyle = {
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      background: 'rgba(5, 11, 20, 0.62)',
      overflow: 'hidden',
      marginTop: '0.15rem',
    };

    switch (feature.id) {
      case 'collaboration':
        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.8rem' }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isWideCard ? '1.5fr 1fr' : '1fr',
                gap: '0.7rem',
              }}
            >
              <div
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  background: 'rgba(8, 14, 26, 0.86)',
                  padding: '1.2rem',
                }}
              >
                <div style={{ fontSize: '0.66rem', color: 'rgba(200, 214, 242, 0.9)', marginBottom: '0.55rem' }}>
                  Room P2N1ZA · JavaScript · Live
                </div>
                {[96, 62, 88, 72, 80, 44].map((line, lineIndex) => (
                  <motion.div
                    key={`${feature.id}-line-${lineIndex}`}
                    initial={{ opacity: 0, scaleX: 0.92 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 + lineIndex * 0.06 }}
                    style={{
                      width: `${line}%`,
                      height: '7px',
                      borderRadius: '999px',
                      marginBottom: '0.68rem',
                      transformOrigin: 'left center',
                      background:
                        lineIndex % 2 === 0
                          ? 'linear-gradient(90deg, rgba(147, 214, 255, 0.95), rgba(85, 164, 255, 0.85))'
                          : 'rgba(184, 200, 231, 0.45)',
                    }}
                  />
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 10, boxShadow: '0 0 0 rgba(132, 216, 140, 0)' }}
                  whileInView={{ opacity: 1, y: 0, boxShadow: '0 0 16px rgba(132, 216, 140, 0.22)' }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: 0.45 }}
                  style={{
                    marginTop: '0.85rem',
                    border: '1px solid rgba(91, 159, 255, 0.35)',
                    color: 'rgba(179, 241, 185, 0.95)',
                    borderRadius: '8px',
                    padding: '0.34rem 0.45rem',
                    fontSize: '0.66rem',
                  }}
                >
                  Output: 5/5 test cases passed
                </motion.div>
                </div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.18 }}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  background: 'rgba(10, 16, 28, 0.72)',
                  padding: '0.9rem',
                  display: 'grid',
                  gap: '0.5rem',
                }}
              >
                {[
                  ['Interviewer', 'Online'],
                  ['Candidate', 'Typing'],
                ].map(([name, state]) => (
                  <motion.div
                    key={`${feature.id}-${name}`}
                    initial={{ opacity: 0, x: 6 }}
                    whileInView={{ opacity: state === 'Typing' ? 0.92 : 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.38, ease: 'easeOut', delay: state === 'Typing' ? 0.28 : 0.2 }}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem' }}
                  >
                    <span style={{ color: 'rgba(230, 238, 255, 0.95)' }}>{name}</span>
                    <span style={{ color: 'rgba(117, 229, 164, 0.95)' }}>{state}</span>
                  </motion.div>
                ))}
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.42, ease: 'easeOut', delay: 0.34 }}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid rgba(113, 168, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: 'rgba(234, 241, 255, 0.95)',
                    fontSize: '0.74rem',
                    padding: '0.35rem 0.65rem',
                    textAlign: 'Center',
                    fontFamily: 'Family Mono, monospace',
                  }}
                >
                  Run code and sync output
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        );

      case 'questions':
        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.8rem' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.58rem', flexWrap: 'wrap' }}>
              {['All', 'Easy', 'Medium', 'Hard'].map((level, levelIndex) => (
                <motion.span
                  key={`${feature.id}-${level}`}
                  initial={{ opacity: 0, y: 6, boxShadow: '0 0 0 rgba(76, 173, 255, 0)' }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    boxShadow: level === 'Medium' ? '0 0 14px rgba(76, 173, 255, 0.24)' : '0 0 0 rgba(76, 173, 255, 0)',
                  }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.34, ease: 'easeOut', delay: levelIndex * 0.06 }}
                  style={{
                    padding: '0.2rem 0.45rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: level === 'Medium' ? 'rgba(76, 173, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(226, 236, 255, 0.95)',
                    fontSize: '0.63rem',
                  }}
                >
                  {level}
                </motion.span>
              ))}
            </div>
            <div style={{ display: 'grid', gap: '0.42rem' }}>
              {[
                ['Two Sum with hash map', 'Easy'],
                ['LRU cache design', 'Medium'],
                ['Merge k sorted lists', 'Hard'],
              ].map(([question, difficulty], itemIndex) => (
                <motion.div
                  key={`${feature.id}-${question}`}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.42, ease: 'easeOut', delay: 0.14 + itemIndex * 0.08 }}
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '0.45rem 0.5rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', color: 'rgba(233, 240, 255, 0.93)' }}>{question}</span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.94 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.22 + itemIndex * 0.08 }}
                    style={{
                      fontSize: '0.61rem',
                      padding: '0.16rem 0.35rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'rgba(210, 224, 252, 0.94)',
                    }}
                  >
                    {difficulty}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'ai':
        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.8rem', display: 'grid', gap: '0.55rem' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: 0.34, ease: 'easeOut', delay: 0.1 }}
              style={{ fontSize: '0.66rem', color: 'rgba(202, 216, 246, 0.95)' }}
            >
              AI Assistant - Analyze tab
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10, borderColor: 'rgba(255, 255, 255, 0.12)' }}
              whileInView={{ opacity: 1, y: 0, borderColor: 'rgba(136, 167, 252, 0.35)' }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.16 }}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.5rem',
                fontSize: '0.67rem',
                color: 'rgba(235, 242, 255, 0.93)',
              }}
            >
              Complexity can be reduced from O(n^2) to O(n log n) by sorting once before scanning.
            </motion.div>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {[
                ['Bug risk', 'Medium'],
                ['Code clarity', 'Strong'],
                ['Edge-case handling', 'Needs work'],
              ].map(([label, value], itemIndex) => (
                <motion.div
                  key={`${feature.id}-${label}`}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.38, ease: 'easeOut', delay: 0.22 + itemIndex * 0.08 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '9px',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.64rem',
                    color: 'rgba(220, 232, 255, 0.9)',
                  }}
                >
                  <span>{label}</span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: value === 'Needs work' ? 0.82 : 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.3 + itemIndex * 0.08 }}
                  >
                    {value}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'video':
        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.7rem' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.13)',
                background: 'linear-gradient(160deg, rgba(55, 130, 195, 0.26), rgba(12, 20, 33, 0.8))',
                minHeight: '235px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <motion.div
                aria-hidden="true"
                initial={{ x: '-40%', opacity: 0 }}
                whileInView={{ x: '120%', opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                style={{
                  position: 'absolute',
                  top: '-20%',
                  width: '35%',
                  height: '160%',
                  transform: 'rotate(12deg)',
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(172, 224, 255, 0.17), rgba(255, 255, 255, 0))',
                }}
              />
              <div style={{ position: 'absolute', top: '0.5rem', left: '0.55rem', fontSize: '0.63rem', color: 'rgba(236, 243, 255, 0.95)' }}>
                Video Chat - P2N1ZA - Connected
              </div>  
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.24 }}
                style={{
                  position: 'absolute',
                  top: '0.52rem',
                  right: '0.52rem',
                  width: '64px',
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(3, 6, 12, 0.56)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '0.65rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.42rem',
                }}
              >
                {['Microphone', 'Camera', 'End Call'].map((control) => (
                  <motion.span
                    key={`${feature.id}-${control}`}
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.65 }}
                    transition={{ duration: 0.32, ease: 'easeOut', delay: control === 'End' ? 0.38 : 0.32 }}
                    style={{
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: control === 'End Call' ? 'rgba(255, 88, 88, 0.36)' : 'rgba(255, 255, 255, 0.11)',
                      color: 'rgba(240, 246, 255, 0.95)',
                      fontSize: '0.6rem',
                      padding: '0.18rem 0.42rem',
                    }}
                  >
                    {control}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'rubric':
        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.78rem' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: 0.34, ease: 'easeOut', delay: 0.1 }}
              style={{ fontSize: '0.66rem', color: 'rgba(214, 226, 248, 0.93)', marginBottom: '0.65rem' }}
            >
              Evaluation Rubric - Weighted Score 8.4/10
            </motion.div>
            {[
              ['Problem Solving', '8.5'],
              ['Code Quality', '8.0'],
              ['Communication', '9.0'],
              ['System Design', '7.5'],
              ['Technical Knowledge', '8.0'],
            ].map(([criteria, score], itemIndex) => (
              <div key={`${feature.id}-${criteria}`} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.63rem', color: 'rgba(229, 237, 255, 0.93)', marginBottom: '0.15rem' }}>
                  <span>{criteria}</span>
                  <span>{score}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.12)' }}>
                  <motion.div
                    initial={{ width: '12%' }}
                    whileInView={{ width: `${Math.min(100, Number(score) * 10)}%` }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.16 + itemIndex * 0.1 }}
                    style={{
                      width: `${Math.min(100, Number(score) * 10)}%`,
                      height: '100%',
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, rgb(255, 47, 47), rgba(41, 240, 117, 0.99))',
                    }}
                  />
                </div>
              </div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 10, boxShadow: '0 0 0 rgba(124, 238, 163, 0)' }}
              whileInView={{ opacity: 1, y: 0, boxShadow: '0 0 16px rgba(191, 191, 191, 0.25)' }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.42, ease: 'easeOut', delay: 0.34 }}
              style={{
                marginTop: '1.2rem',
                borderRadius: '8px',
                border: '1px solid rgba(137, 137, 137, 0.4)',
                background: 'rgba(68, 68, 68, 0.15)',
                color: 'rgba(191, 252, 212, 0.95)',
                fontSize: '0.64rem',
                padding: '0.34rem 0.45rem',
                textAlign: 'center',
              }}
            >
              Recommendation: Hire
            </motion.div>
          </motion.div>
        );

      case 'reports':
      default:
        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.8rem' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isWideCard ? '1.2fr 1fr' : '1fr',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.52rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ fontSize: '0.66rem', color: 'rgba(226, 236, 255, 0.93)', marginBottom: '0.35rem' }}>Timeline Replay</div>
                {['Question shared', 'Code run (success)', 'Rubric submitted'].map((event, eventIndex) => (
                  <motion.div
                    key={`${feature.id}-${event}`}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.55 }}
                    transition={{ duration: 0.38, ease: 'easeOut', delay: 0.14 + eventIndex * 0.08 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.28rem' }}
                  >
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.65 }}
                      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 + eventIndex * 0.08 }}
                      style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(151, 223, 255, 0.92)' }}
                    />
                    <span style={{ fontSize: '0.64rem', color: 'rgba(216, 228, 250, 0.95)' }}>{event}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.52rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'grid',
                  gap: '0.33rem',
                }}
              >
                {[
                  ['Score', '84/100'],
                  ['Runs', '12'],
                  ['Export', 'PDF'],
                ].map(([label, value], valueIndex) => (
                  <motion.div
                    key={`${feature.id}-${label}`}
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.55 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.26 + valueIndex * 0.08 }}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.63rem', color: 'rgba(230, 239, 255, 0.94)' }}
                  >
                    <span>{label}</span>
                    <span>{value}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        );
    }
  };

  const renderHowItWorksMiniView = (stepId) => {
    const previewStyle = {
      borderRadius: "14px",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      background: "rgba(7, 13, 24, 0.62)",
      padding: "0.72rem",
      overflow: "hidden",
      minHeight: "138px",
      display: "grid",
      gap: "0.5rem",
    };

    switch (stepId) {
      case "create-room":
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={previewStyle}
          >
            <div style={{ fontSize: "0.64rem", color: "rgba(218, 231, 252, 0.92)" }}>Create New Room</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.45rem" }}>
              <span style={{ color: "rgba(242, 248, 255, 0.98)", fontSize: "0.86rem", fontWeight: 650, letterSpacing: "0.08em" }}>AB12CD</span>
              <span style={{ fontSize: "0.6rem", color: "rgba(132, 223, 178, 0.95)" }}>Ready</span>
            </div>
            <div style={{ display: "grid", gap: "0.3rem" }}>
              {["DSA Round", "System Design", "Frontend Deep Dive"].map((track, idx) => (
                <motion.div
                  key={track}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.3, delay: 0.06 + idx * 0.06 }}
                  style={{
                    fontSize: "0.62rem",
                    color: "rgba(216, 228, 248, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    padding: "0.24rem 0.36rem",
                    background: "rgba(255, 255, 255, 0.04)",
                  }}
                >
                  {track}
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "share-invite":
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={previewStyle}
          >
            <div style={{ fontSize: "0.64rem", color: "rgba(218, 231, 252, 0.92)" }}>Invite Link</div>
            <div style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.14)", padding: "0.34rem 0.4rem", fontSize: "0.58rem", color: "rgba(170, 194, 235, 0.88)", background: "rgba(255,255,255,0.04)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              techify.ai/join?room=AB12CD&invite=...
            </div>
            <div style={{ display: "grid", gap: "0.26rem" }}>
              {["Copied to clipboard", "Signed token active", "TTL: 30 min"].map((label, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.3, delay: 0.08 + idx * 0.06 }}
                  style={{ fontSize: "0.61rem", color: "rgba(214, 227, 248, 0.9)" }}
                >
                  • {label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "conduct-interview":
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={previewStyle}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.4rem" }}>
              <div style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.14)", padding: "0.36rem", background: "rgba(255,255,255,0.04)" }}>
                {[88, 72, 96, 66].map((w, idx) => (
                  <motion.div
                    key={`code-${w}-${idx}`}
                    initial={{ opacity: 0, scaleX: 0.9 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true, amount: 0.65 }}
                    transition={{ duration: 0.24, delay: 0.05 + idx * 0.06 }}
                    style={{ width: `${w}%`, height: "5px", borderRadius: "999px", marginBottom: "0.24rem", background: idx % 2 ? "rgba(188, 205, 233, 0.45)" : "rgba(136, 204, 255, 0.88)" }}
                  />
                ))}
              </div>
              <div style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.14)", padding: "0.36rem", background: "rgba(255,255,255,0.04)", fontSize: "0.6rem", color: "rgba(222, 235, 255, 0.92)" }}>
                AI: Ask for edge-case handling.
              </div>
            </div>
            <div style={{ fontSize: "0.62rem", color: "rgba(214, 227, 248, 0.9)" }}>Realtime sync • Video on • Notes active</div>
          </motion.div>
        );

      case "decide-share":
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={previewStyle}
          >
            <div style={{ fontSize: "0.64rem", color: "rgba(218, 231, 252, 0.92)" }}>Final Decision</div>
            <div style={{ display: "grid", gap: "0.3rem" }}>
              {[["Problem Solving", 84], ["Code Quality", 79], ["Communication", 91]].map(([label, score], idx) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.58rem", color: "rgba(209, 225, 250, 0.9)", marginBottom: "0.14rem" }}>
                    <span>{label}</span>
                    <span>{score}%</span>
                  </div>
                  <motion.div
                    initial={{ width: "18%" }}
                    whileInView={{ width: `${score}%` }}
                    viewport={{ once: true, amount: 0.65 }}
                    transition={{ duration: 0.42, delay: 0.08 + idx * 0.08 }}
                    style={{ height: "5px", borderRadius: "999px", background: "linear-gradient(90deg, rgba(255, 205, 116, 0.95), rgba(255, 153, 82, 0.9))" }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  const isMobileView = window.innerWidth <= 768;
  const isSmallMobileView = window.innerWidth <= 480;
  const headerShellWidth = "calc(100% - 2rem)";
  const headerShellRadius = "22px";
  const mainTopPadding = isMobileView ? "8rem" : "4rem";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)),
        url('/backgroundhd.webp')
      `,
        backgroundSize: "150%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      <header
        className="top-nav-button"
        style={{
          position: "fixed",
          top: isMobileView ? "0.55rem" : "0.85rem",
          left: "49.8%",
          right: "auto",
          width: headerShellWidth,
          maxWidth: "1280px",
          transform: "translateX(-50%)",
          zIndex: 9999,
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderRadius: headerShellRadius,
          border: "1px solid rgba(255, 255, 255, 0.11)",
          background: "transparent",
          padding: isMobileView
            ? isSmallMobileView
              ? "0.55rem 0.7rem"
              : "0.75rem 1rem"
            : "1rem 2rem",
          display: "flex",
          justifyContent: isMobileView ? "center" : "space-between",
          alignItems: "center",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          flexWrap: isSmallMobileView ? "wrap" : "nowrap",
          rowGap: isSmallMobileView ? "0.45rem" : "0",
          columnGap: isSmallMobileView ? "0.4rem" : "0.75rem",
          animation: "slideDownFromTopCentered 0.8s ease-out",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <img
            src="/logo.webp"
            alt="Techify Logo"
            style={{
              height: isMobileView ? "32px" : "40px",
              width: "auto",
              animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              opacity: 0,
            }}
          />
        </div>

        {/* Navigation Links */}
        {!isMobileView && (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "1rem",
              flexWrap: "nowrap",
              minWidth: 0,
            }}
          >
            {isAuthenticated() ? (
              <>
                <span
                  style={{
                    color: "hsl(var(--muted-foreground))",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flexShrink: 1,
                    animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards',
                    opacity: 0,
                  }}
                >
                  {user?.username}
                </span>
                <Link
                  to="/dashboard"
                  className="action-btn run-btn"
                  style={{
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s forwards',
                    opacity: 0,
                  }}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="action-btn save-btn"
                  style={{
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "color 0.2s ease",
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    padding: "0.5rem 1rem",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards',
                    opacity: 0,
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="action-btn run-btn premium-arrow-btn"
                  style={{
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s forwards',
                    opacity: 0,
                  }}
                >
                  <span className="premium-arrow-btn__label">Sign Up</span>
                  <span className="premium-arrow-btn__icon-wrap" aria-hidden="true">
                    <svg className="premium-arrow-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </Link>
              </>
            )}
            <a
              href="https://github.com/Udaysavaliya04/techify"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "transparent",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                flexShrink: 0,
                animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s forwards',
                opacity: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: "hsl(var(--foreground))" }}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </nav>
        )}
      </header>

      {/* Mobile Notice Banner */}
      <div
        style={{
          position: "fixed",
          top: "4rem",
          left: "1rem",
          right: "1rem",
          zIndex: 60,
          background: "rgba(22, 22, 22, 0.55)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "22px",
          padding: "1.25rem 1.5rem",
          boxShadow:
            "0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          display: window.innerWidth <= 768 ? "block" : "none",
          animation: "slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="mobile-notice"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#ffffff",
            fontSize: window.innerWidth <= 480 ? "0.75rem" : "0.875rem",
            fontWeight: "500",
            lineHeight: "1.4",
          }}
        >
          <div style={{ fontSize: "1.5rem" }}>  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--foreground))" }}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg></div>
          <div>
            <div
              style={{
                fontWeight: "600",
                marginBottom: "0.25rem",
                color: "#ffffff",
              }}
            >
              Desktop Experience Recommended
            </div>
            <div style={{ opacity: 0.85, color: "#e5e5e5" }}>
              This platform shines brightest on desktop! It's not optimized for
              mobile devices yet. <br></br>It is recommended to use a laptop strictly for the ultimate
              Interview experience.
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        style={{
          paddingTop: mainTopPadding,
          paddingBottom: "4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 12rem)",
          padding: window.innerWidth <= 768 ? `${mainTopPadding} 1rem 4rem 1rem` : `${mainTopPadding} 2rem 4rem`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Show different content based on authentication and role */}
        {isAuthenticated() && user?.role === "candidate" ? (
          // Candidate Join Interface
          <div
            className="auth-card"
            style={{
              textAlign: "center",
              maxWidth: "500px",
              width: "100%",
              backdropFilter: "blur(30px)",
              border: "1px solid hsl(var(--border) / 0.5)",
              borderRadius: "calc(var(--radius) * 1.5)",
              padding: window.innerWidth <= 768 ? "2rem 1.5rem" : "3rem",
              marginTop: window.innerWidth <= 768 ? "2rem" : "5rem",
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
              animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              opacity: 0,
            }}
          >
            <h1
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "clamp(1.5rem, 6vw, 2.5rem)"
                    : window.innerWidth <= 768
                      ? "clamp(1.8rem, 5vw, 2.8rem)"
                      : "clamp(2rem, 4vw, 3rem)",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "hsl(var(--foreground))",
                letterSpacing: "-0.07em",
                background:
                  "linear-gradient(135deg, #ffffff, #c7c7c7ff, #ffffffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Join Interview
            </h1>

            <p
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "0.875rem"
                    : window.innerWidth <= 768
                      ? "1rem"
                      : "1.125rem",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "3rem",
                lineHeight: "1.6",
                letterSpacing: "-0.05em",
              }}
            >
              Paste the invite link below, code will be auto-filled. 
            </p>

            <form
              onSubmit={joinRoom}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <div className="otp-container">
                <div className="otp-inputs" onPaste={handlePaste}>
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      className="otp-input"
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength={1}
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input
                  type="text"
                  className="input"
                  value={inviteToken}
                  onChange={(e) => handleInviteInput(e.target.value)}
                  placeholder="Paste Invite link"
                  autoComplete="off"
                />
                
              </div>

              <button
                type="submit"
                disabled={room.length !== 6 || joining || !inviteToken}
                className={`action-btn run-btn ${room.length !== 6 || joining || !inviteToken ? "disabled" : ""
                  }`}
                style={{ width: "100%" }}
              >
                {joining ? "Validating Invite..." : "Join Interview Room"}
              </button>
              {joinError && (
                <div style={{ color: "#f87171", fontSize: "0.875rem" }}>
                  {joinError}
                </div>
              )}
            </form>
          </div>
        ) : isAuthenticated() && user?.role === "interviewer" ? (
          // Interviewer Dashboard CTA
          <div
            className="auth-card"
            style={{
              marginTop: '125px',
              paddingTop: '20px',
              textAlign: "center",
              maxWidth: "500px",
              width: "100%",
              backdropFilter: "blur(30px)",
              border: "1px solid hsl(var(--border) / 0.5)",
              borderRadius: "calc(var(--radius) * 1.5)",
              padding: window.innerWidth <= 768 ? "2rem 1.5rem" : "3rem",
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
              animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                opacity: 0,
            }}
          >
            <h1
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "clamp(1.5rem, 6vw, 2.5rem)"
                    : window.innerWidth <= 768
                      ? "clamp(1.8rem, 5vw, 2.8rem)"
                      : "clamp(2rem, 4vw, 3rem)",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "hsl(var(--foreground))",
                letterSpacing: "-0.05em",
              }}
            >
              Welcome Back
            </h1>

            <p
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "0.875rem"
                    : window.innerWidth <= 768
                      ? "1rem"
                      : "1.125rem",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "3rem",
                lineHeight: "1.6",
                letterSpacing: "-0.05em",
                fontWeight: "400",
              }}
            >
              Ready to conduct technical interviews? 
              <br></br>Head to your dashboard to
              create rooms and manage sessions.
            </p>

            <Link
              to="/dashboard"
              className="action-btn run-btn"
              style={{
                display: "inline-block",
                textDecoration: "none",
                minWidth: "100%",
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          // Homepage Hero Section for Unauthenticated Users
          <div
            className="hero-section"
            style={{
              textAlign: "center",
              maxWidth: "1200px",
              width: "100%",
            }}
          >
            <h1
              className="hero-title"
              style={{
                paddingTop: window.innerWidth <= 768 ? "2rem" : "6rem",
                fontSize:
                  window.innerWidth <= 480
                    ? "clamp(1.8rem, 8vw, 4rem)"
                    : "clamp(2.5rem, 6vw, 7rem)",
                marginBottom: "1.5rem",
                lineHeight: "1",
                fontWeight: "800",
                letterSpacing: "-0.08em",
                animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                opacity: 0,
              }}
            >
              <span
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #ffffffff 25%, #ffffffff 50%, #7bd1ffff 75%, #00b3ffff 100%)",
                  backgroundSize: "200% 200%",
                  fontSize:
                    window.innerWidth <= 360
                      ? "2.5rem"
                      : window.innerWidth <= 480
                        ? "3.5rem"
                        : window.innerWidth <= 768
                          ? "5.5rem"
                          : "8.9rem",
                  WebkitBackgroundClip: "text",
                  letterSpacing:
                    window.innerWidth <= 480 ? "-0.03em" : "-0.08em",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  fontWeight: "700",
                  fontFamily: "'Familjen Grotesk', sans-serif",
                  animation: "gradientShift 1s ease-in-out infinite",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                Technical Interviews
              </span>
              <span
                style={{
                   background: "linear-gradient(180deg, #ffffff 0%, #ffffffff 25%, #91bdffff 50%, #46beffff 75%, #00b3ffff 100%)",
                  backgroundSize: "150% 150%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  fontWeight: "900",
                  fontSize:
                    window.innerWidth <= 360
                      ? "3.5rem"
                      : window.innerWidth <= 480
                        ? "4.5rem"
                        : window.innerWidth <= 768
                          ? "6.5rem"
                          : "10.5rem", 
                  fontFamily: " 'Familjen Grotesk', sans-serif",
                  letterSpacing:
                    window.innerWidth <= 480 ? "-0.03em" : "-0.08em",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                Made Simple!
              </span>
            </h1>

            <p
              className="hero-subtitle"
              style={{
                fontSize:
                  window.innerWidth <= 360
                    ? "0.75rem"
                    : window.innerWidth <= 480
                      ? "0.875rem"
                      : window.innerWidth <= 768
                        ? "1rem"
                        : "1.25rem",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "3rem",
                lineHeight: "1.6",
                maxWidth: window.innerWidth <= 768 ? "90%" : "600px",
                margin: "0 auto 3rem auto",
                letterSpacing: "-0.05em",
                background:
                  "linear-gradient(135deg, #ffffff, #9b9b9bff, #ffffffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s forwards',
                opacity: 0,
              }}
            >
              Conduct seamless remote technical interviews with real-time
              collaboration, AI assistance, and comprehensive evaluation tools.
            </p>

            {/* CTA Buttons */}
            <div
              className="cta-buttons"
              style={{
                display: "flex",
                gap: window.innerWidth <= 480 ? "0.5rem" : "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "5rem",
                flexDirection: window.innerWidth <= 480 ? "column" : "row",
                alignItems: "center",
                animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s forwards',
                opacity: 0,
              }}
            >
              <Link
                to="/register"
                className="action-btn run-btn premium-arrow-btn"
                style={{
                  display: "inline-flex",
                  textDecoration: "none",
                  fontSize:
                    window.innerWidth <= 360
                      ? "0.75rem"
                      : window.innerWidth <= 480
                        ? "0.8rem"
                        : window.innerWidth <= 768
                          ? "0.875rem"
                          : "1rem",
                  padding:
                    window.innerWidth <= 480
                      ? "0.875rem 1.25rem"
                      : window.innerWidth <= 768
                        ? "0.75rem 1.5rem"
                        : "0.875rem 2rem",
                  width: window.innerWidth <= 480 ? "100%" : "auto",
                  textAlign: "center",
                }}
              >
                <span className="premium-arrow-btn__label">Get Started Free</span>
                <span className="premium-arrow-btn__icon-wrap" aria-hidden="true">
                  <svg className="premium-arrow-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>

              <Link
                to="/login"
                className="action-btn save-btn"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  fontSize:
                    window.innerWidth <= 360
                      ? "0.75rem"
                      : window.innerWidth <= 480
                        ? "0.8rem"
                        : window.innerWidth <= 768
                          ? "0.875rem"
                          : "1rem",
                  padding:
                    window.innerWidth <= 480
                      ? "0.875rem 1.25rem"
                      : window.innerWidth <= 768
                        ? "0.75rem 1.5rem"
                        : "0.875rem 2rem",
                  background: "transparent",
                  backdropFilter: "blur(20px)",
                  width: window.innerWidth <= 480 ? "100%" : "auto",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                }}
              >
                Sign In
              </Link>
            </div>

            <motion.section
              ref={featureSectionRef}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: "1280px",
                margin: "0 auto",
                padding:
                  window.innerWidth <= 480
                    ? "0.75rem 0 0"
                    : window.innerWidth <= 768
                      ? "1rem 0 0"
                      : "1.5rem 0 0",
                position: "relative",
              }}
            >
              <motion.div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: window.innerWidth <= 768 ? "3.5rem" : "4rem",
                  left: "50%",
                  width: window.innerWidth <= 768 ? "70%" : "54%",
                  height: window.innerWidth <= 768 ? "180px" : "240px",
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle, rgba(67, 180, 255, 0.35), rgba(67, 180, 255, 0))",
                  filter: "blur(44px)",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                  y: featureGlowY,
                  opacity: featureGlowOpacity,
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, delay: 0.08 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.4rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 255, 255, 0.22)",
                    background: "rgba(10, 16, 28, 0.45)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#7ad6ff" , animation: "badgeBlinkPulse 1.5s ease infinite" }} />
                  <span
                    style={{
                      fontSize: "0.72rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(241, 245, 255, 0.9)",
                      fontWeight: 600,
                    }}
                  >
                    Version 2.0 is Live now
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.75, delay: 0.12 }}
                  style={{
                    fontSize:
                      window.innerWidth <= 480
                        ? "clamp(1.6rem, 8vw, 2.25rem)"
                        : window.innerWidth <= 768
                          ? "clamp(2rem, 7vw, 2.9rem)"
                          : "clamp(2.4rem, 5vw, 3.9rem)",
                    fontWeight: 700,
                    lineHeight: 1.06,
                    letterSpacing: "-0.06em",
                    margin: "0 0 0.85rem 0",
                    color: "rgb(250, 252, 255)",
                    fontFamily: "'Familjen Grotesk', sans-serif",
                  }}
                >
                  The Ultimate Interview Platform!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, delay: 0.18 }}
                  style={{
                    maxWidth: "920px",
                    margin: "0 auto 1.75rem auto",
                    fontSize:
                      window.innerWidth <= 480
                        ? "0.86rem"
                        : window.innerWidth <= 768
                          ? "0.98rem"
                          : "1.05rem",
                    color: "hsl(var(--muted-foreground))",
                    lineHeight: 1.65,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Built for technical interviews from first prompt to hiring decision, with realtime coding, AI support, video,
                  structured scoring, and exportable reports.
                </motion.p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      window.innerWidth <= 768
                        ? "1fr"
                        : window.innerWidth <= 1024
                          ? "repeat(2, minmax(0, 1fr))"
                          : "repeat(6, minmax(0, 1fr))",
                    columnGap: window.innerWidth <= 768 ? "0.95rem" : "1.3rem",
                    rowGap:
                      window.innerWidth <= 480
                        ? "1.2rem"
                        : window.innerWidth <= 768
                          ? "1.35rem"
                          : "2rem",
                  }}
                >
                  {featureBentoItems.map((feature, index) => {
                    const desktopSpan = getBentoDesktopSpan(index);
                    const isWideCard = window.innerWidth > 1024 && desktopSpan === 'span 4';

                    return (
                      <motion.article
                        key={feature.id}
                        initial={{ opacity: 0, y: 38, filter: "blur(10px)" }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                          filter: "blur(0px)",
                          transition: {
                            duration: 0.92,
                            delay: 0.1 + index * 0.08,
                            ease: [0.22, 1, 0.36, 1],
                          },
                        }}
                        whileHover={{
                          y: -7,
                          boxShadow:
                            "0 42px 100px -72px rgba(0, 0, 0, 0.96), inset 0 1px 0 rgba(255, 255, 255, 0.24)",
                          transition: {
                            type: "spring",
                            stiffness: 78,
                            damping: 14,
                            mass: 1.15,
                          },
                        }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 70,
                          damping: 14,
                          mass: 1.2,
                        }}
                        style={{
                          gridColumn: window.innerWidth <= 1024 ? "span 1" : desktopSpan,
                          borderRadius: "24px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          background: `linear-gradient(155deg, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.03)), ${feature.gradient}`,
                          backdropFilter: "blur(25px) saturate(145%)",
                          WebkitBackdropFilter: "blur(25px) saturate(145%)",
                          boxShadow:
                            "0 34px 80px -55px rgba(0, 0, 0, 0.94), inset 0 1px 0 rgba(255, 255, 255, 0.24)",
                          padding:
                            window.innerWidth <= 480
                              ? "1.05rem"
                              : window.innerWidth <= 768
                                ? "1.2rem"
                                : "1.35rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.95rem",
                          overflow: "hidden",
                          position: "relative",
                          textAlign: "left",
                          minHeight: window.innerWidth <= 768 ? "auto" : isWideCard ? "420px" : "380px",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-52px",
                            right: "-40px",
                            width: "130px",
                            height: "130px",
                            borderRadius: "999px",
                            background: `radial-gradient(circle, ${feature.glow}, rgba(255,255,255,0))`,
                            filter: "blur(22px)",
                            pointerEvents: "none",
                          }}
                        />

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.42rem",
                              padding: "0.32rem 0.68rem",
                              borderRadius: "999px",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                              background: "rgba(8, 13, 23, 0.52)",
                              fontSize: "0.69rem",
                              color: "rgba(240, 246, 255, 0.95)",
                              letterSpacing: "0.04em",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {renderFeatureIcon(feature.id)}
                            {feature.badge}
                          </span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "rgba(236, 242, 255, 0.84)",
                              fontWeight: 500,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {feature.meta}
                          </span>
                        </div>

                        <h3
                          style={{
                            margin: 0,
                            fontSize:
                              window.innerWidth <= 480
                                ? "1.05rem"
                                : window.innerWidth <= 768
                                  ? "1.1rem"
                                  : "1.26rem",
                            lineHeight: 1.2,
                            fontWeight: 650,
                            letterSpacing: "-0.03em",
                            color: "rgba(250, 252, 255, 0.98)",
                          }}
                        >
                          {feature.title}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            fontSize: window.innerWidth <= 768 ? "0.84rem" : "0.9rem",
                            lineHeight: 1.58,
                            color: "rgba(215, 223, 241, 0.9)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {feature.description}
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gap: "0.26rem",
                            marginTop: "0.1rem",
                          }}
                        >
                          {feature.points.map((point) => (
                            <div key={`${feature.id}-${point}`} style={{ display: "flex", alignItems: "center", gap: "0.36rem" }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(162, 226, 255, 0.95)" }} />
                              <span style={{ fontSize: "0.73rem", color: "rgba(220, 231, 252, 0.9)" }}>{point}</span>
                            </div>
                          ))}
                        </div>

                        {renderFeaturePreview(feature, isWideCard)}
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 38, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: "1160px",
                margin: window.innerWidth <= 768 ? "2.8rem auto 0" : "4.2rem auto 0",
                textAlign: "left",
                paddingTop: window.innerWidth <= 480 ? "1.5rem" : "2.5rem",
              }}
            >
              <motion.h3
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  margin: "0 0 0.5rem 0",
                  textAlign: "center",
                  fontSize:
                    window.innerWidth <= 480
                      ? "clamp(1.45rem, 8vw, 2rem)"
                      : window.innerWidth <= 768
                        ? "clamp(1.9rem, 7vw, 2.7rem)"
                        : "clamp(2.2rem, 4.2vw, 3.2rem)",
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: "-0.05em",
                  color: "rgba(246, 250, 255, 0.99)",
                }}
              >
                How It Works?
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  margin: "0 auto 4rem auto",
                  maxWidth: "760px",
                  textAlign: "center",
                  fontSize: window.innerWidth <= 768 ? "0.88rem" : "0.96rem",
                  lineHeight: 1.62,
                  color: "rgba(214, 227, 248, 0.9)",
                  letterSpacing: "-0.01em",
                }}
              >
                A clean 4-step interview flow from room creation to final decision, with full visibility at every stage.
              </motion.p>

              <div style={{ display: "grid", gap: window.innerWidth <= 768 ? "0.95rem" : "1.15rem" }}>
                {howItWorksSteps.map((step, stepIndex) => {
                  const alignRight = stepIndex % 2 !== 0;
                  const reverseLayout = alignRight;
                  const connectorPath = "M60 10 L60 104";
                  const connectorHeadPath = "M51 94 L60 104 L69 94";
                  const glowStartX = 60;
                  const glowEndX = 60;
                  const glowStartY = 10;
                  const glowEndY = 104;
                  return (
                    <React.Fragment key={step.id}>
                      <motion.article
                        initial={{ opacity: 0, y: 24, filter: "blur(7px)" }}
                        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        whileHover={{ y: -4 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.62, delay: 0.08 + stepIndex * 0.07, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          width: "100%",
                          marginLeft: "auto",
                          marginRight: "auto",
                          borderRadius: "24px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          background: "linear-gradient(150deg, rgba(255,255,255,0.11), rgba(255,255,255,0.03))",
                          backdropFilter: "blur(25px) saturate(145%)",
                          WebkitBackdropFilter: "blur(25px) saturate(145%)",
                          boxShadow: "0 30px 80px -58px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
                          padding:
                            window.innerWidth <= 480
                              ? "0.95rem"
                              : window.innerWidth <= 768
                                ? "1.1rem"
                                : "1.2rem",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: window.innerWidth <= 900 ? "1fr" : reverseLayout ? "1fr 1.2fr" : "1.2fr 1fr",
                            gap: "0.95rem",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ order: window.innerWidth <= 900 ? 0 : reverseLayout ? 2 : 1 }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                padding: "0.3rem 0.66rem",
                                borderRadius: "999px",
                                border: "1px solid rgba(255, 255, 255, 0.24)",
                                background: "rgba(8, 14, 26, 0.5)",
                                fontSize: "0.66rem",
                                color: "rgba(238, 245, 255, 0.95)",
                                fontWeight: 650,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: step.accent }} />
                              Step {step.step}
                            </div>
                            <h4
                              style={{
                                margin: "0.7rem 0 0.4rem 0",
                                fontSize: window.innerWidth <= 768 ? "1.02rem" : "1.18rem",
                                color: "rgba(246, 250, 255, 0.98)",
                                fontWeight: 650,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.25,
                              }}
                            >
                              {step.title}
                            </h4>
                            <p
                              style={{
                                margin: "0 0 0.58rem 0",
                                fontSize: window.innerWidth <= 768 ? "0.82rem" : "0.9rem",
                                lineHeight: 1.58,
                                color: "rgba(214, 227, 248, 0.9)",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {step.description}
                            </p>
                            <div style={{ display: "grid", gap: "0.24rem" }}>
                              {step.points.map((point) => (
                                <div key={`${step.id}-${point}`} style={{ display: "flex", alignItems: "center", gap: "0.36rem" }}>
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: step.accent }} />
                                  <span style={{ fontSize: "0.74rem", color: "rgba(224, 236, 255, 0.9)" }}>{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ order: window.innerWidth <= 900 ? 0 : reverseLayout ? 1 : 2 }}>
                            {renderHowItWorksMiniView(step.id)}
                          </div>
                        </div>
                      </motion.article>

                      {stepIndex < howItWorksSteps.length - 1 && (
                        <motion.div
                          aria-hidden="true"
                          initial={{ opacity: 0, y: -4 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.55 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.14 }}
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            margin: window.innerWidth <= 900 ? "0.14rem 0 0.28rem" : "0.22rem 0 0.42rem",
                            pointerEvents: "none",
                          }}
                        >
                          <motion.svg
                            viewBox="0 0 120 114"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, amount: 0.7 }}
                            transition={{ duration: 0.35, delay: 0.12 }}
                            style={{
                              width: window.innerWidth <= 900 ? "72px" : "84px",
                              height: window.innerWidth <= 900 ? "64px" : "72px",
                              overflow: "visible",
                            }}
                          >
                            <motion.path
                              d={connectorPath}
                              fill="none"
                              stroke="rgba(137, 216, 255, 0.92)"
                              strokeWidth="3.4"
                              strokeLinecap="round"
                              initial={{ pathLength: 0, opacity: 0.5 }}
                              whileInView={{ pathLength: 1, opacity: 1 }}
                              viewport={{ once: true, amount: 0.7 }}
                              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                            />
                            <motion.path
                              d={connectorHeadPath}
                              fill="none"
                              stroke="rgba(141, 218, 255, 0.95)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ opacity: 0, scale: 0.86 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true, amount: 0.7 }}
                              transition={{ duration: 0.4, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                              style={{ transformOrigin: "60px 104px" }}
                            />
                            <motion.circle
                              r="3.9"
                              fill="rgba(196, 238, 255, 0.95)"
                              initial={{ opacity: 0, cx: glowStartX, cy: glowStartY }}
                              whileInView={{ opacity: [0, 1, 0], cx: [glowStartX, glowEndX], cy: [glowStartY, glowEndY] }}
                              viewport={{ once: true, amount: 0.7 }}
                              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                            />
                          </motion.svg>
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.section>
            <motion.section
              initial={{ opacity: 0, y: 34, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: "1040px",
                margin: window.innerWidth <= 768 ? "2.8rem auto 0" : "4.6rem auto 0",
                paddingTop: window.innerWidth <= 768 ? "0.65rem" : "1.1rem",
                textAlign: "center",
              }}
            >
              <motion.h3
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.62, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  margin: "0 0 2rem 0",
                  paddingBottom: window.innerWidth <= 768 ? "0.35rem" : "2.5rem",
                  fontSize:
                    window.innerWidth <= 480
                      ? "clamp(1.6rem, 8vw, 2.25rem)"
                      : window.innerWidth <= 768
                        ? "clamp(2rem, 7vw, 2.9rem)"
                        : "clamp(2.4rem, 5vw, 3.9rem)",
                  fontWeight: 700,
                  lineHeight: 1.06,
                  letterSpacing: "-0.06em",
                  color: "rgb(250, 252, 255)",
                  fontFamily: "'Familjen Grotesk', sans-serif",
                }}
              >
                Frequently Asked Questions
              </motion.h3>

              <div
                style={{
                  display: "grid",
                  gap: window.innerWidth <= 768 ? "0.72rem" : "0.85rem",
                }}
              >
                {faqItems.map((item, faqIndex) => {
                  const isOpen = openFaqIndex === faqIndex;
                  return (
                    <motion.div
                      key={`faq-${faqIndex}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{
                        duration: 0.55,
                        delay: 0.06 + faqIndex * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        borderRadius: "16px",
                        border: "1px solid rgba(255, 255, 255, 0.18)",
                        background: "linear-gradient(140deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
                        backdropFilter: "blur(22px) saturate(145%)",
                        WebkitBackdropFilter: "blur(22px) saturate(145%)",
                        boxShadow: "0 20px 55px -45px rgba(0, 0, 0, 0.88), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex((prev) => (prev === faqIndex ? null : faqIndex))}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          color: "inherit",
                          textAlign: "left",
                          cursor: "pointer",
                          padding:
                            window.innerWidth <= 480
                              ? "0.86rem 0.86rem 0.72rem"
                              : window.innerWidth <= 768
                                ? "0.95rem 1rem 0.78rem"
                                : "1rem 1.08rem 0.82rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.9rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: window.innerWidth <= 768 ? "0.88rem" : "0.98rem",
                            lineHeight: 1.36,
                            color: "rgba(245, 250, 255, 0.98)",
                            fontWeight: 580,
                            fontFamily: "Familjen Grotesk, sans-serif",
                          }}
                        >
                          {item.question}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 45 : 0, scale: isOpen ? 1.08 : 1 }}
                          transition={{ type: "spring", stiffness: 220, damping: 18 }}
                          style={{
                            width: "24px",
                            height: "24px",
                            color: "rgba(246, 251, 255, 0.95)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem",
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        >
                          +
                        </motion.span>
                      </button>

                      <motion.div
                        animate={{ width: isOpen ? "100%" : "0%" }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          height: "1px",
                          background: "linear-gradient(90deg, rgba(136, 210, 255, 0.05),rgba(94, 193, 255, 0.49), rgba(136, 210, 255, 0.05))",
                          marginLeft: "1.05rem",
                        }}
                      />

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key={`faq-answer-${faqIndex}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                            style={{ overflow: "hidden" }}
                          >
                            <motion.p
                              initial={{ y: -6, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -5, opacity: 0 }}
                              transition={{ duration: 0.28, delay: 0.04 }}
                              style={{
                                margin: 0,
                                padding:
                                  window.innerWidth <= 480
                                    ? "0.72rem 0.86rem 0.9rem"
                                    : window.innerWidth <= 768
                                      ? "0.76rem 1rem 0.98rem"
                                      : "0.82rem 1.08rem 1.02rem",
                                fontSize: window.innerWidth <= 768 ? "0.81rem" : "0.9rem",
                                lineHeight: 1.62,
                                alignContent:"left",
                                alignItems:"left",
                                textAlign:"left",
                                color: "rgba(214, 227, 248, 0.92)",
                              }}
                            >
                              {item.answer}
                            </motion.p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

          </div>
        )}
      </main>

      {isAuthenticated() ? (
        <footer
          className="footer-section"
          style={{
            position: "fixed",
            zIndex: 1,
            bottom: "1rem",
            left: "1rem",
            right: "1rem",
            backdropFilter: "blur(30px)",
            border: "1px solid hsl(var(--border))",
            padding: window.innerWidth <= 768 ? "0.75rem 1rem" : "1rem 2rem",
            textAlign: "center",
            borderRadius: "12px",
            animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s forwards',
            opacity: 0,
          }}
        >
          <p
            style={{
              fontSize:
                window.innerWidth <= 360
                  ? "0.625rem"
                  : window.innerWidth <= 480
                    ? "0.7rem"
                    : window.innerWidth <= 768
                      ? "0.75rem"
                      : "1rem",
              color: "hsl(var(--muted-foreground))",
              margin: 0,
              fontWeight: "500",
              letterSpacing: "-0.05em",
            }}
          >
            Made with <svg
              width="16"
              height="16"
              viewBox="0 0 24 18"
              fill="red"
              style={{
                display: "inline-block",
                filter: "drop-shadow(0 0 2px rgba(255, 0, 0, 0.6))",
                transform: "scale(1.1)",
                transition: "transform 0.3s ease-in-out infinite",
              }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg> by <a href="https://github.com/Udaysavaliya04" target="_blank" rel="noopener noreferrer" style={{ color: "rgb(235, 235, 235)", textDecoration: "none", transition: "opacity 0.2s ease", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}>Uday Savaliya</a>
          </p>
        </footer>
      ) : (
        <motion.footer
          initial={{ opacity: 0, y: 34, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "100%",
            position: "relative",
            zIndex: 2,
            marginTop: window.innerWidth <= 768 ? "2.2rem" : "3.5rem",
            padding: window.innerWidth <= 768 ? "0 0.9rem 1rem" : "0 1.2rem 1.2rem",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "24px",
              background: 'transparent',
              backdropFilter: "blur(26px) saturate(145%)",
              WebkitBackdropFilter: "blur(26px) saturate(145%)",
              boxShadow:
                "0 30px 90px -56px rgba(0, 0, 0, 0.92), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
              padding:
                window.innerWidth <= 480
                  ? "1.2rem 1rem 0.95rem"
                  : window.innerWidth <= 768
                    ? "1.4rem 1.2rem 1rem"
                    : "1.8rem 1.8rem 1.2rem",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <motion.div
              style={{
                display: "grid",
                gridTemplateColumns: window.innerWidth <= 900 ? "1fr" : "1.4fr auto",
                gap: "1rem",
                alignItems: "center",
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            >
              <div>
                <motion.p
                  style={{
                    margin: "0 0 0.4rem 0",
                    color: "rgba(170, 196, 227, 0.95)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                >
                 
                </motion.p>
                <motion.h3
                  style={{
                    margin: 0,
                    fontSize:
                      window.innerWidth <= 480
                        ? "clamp(1.2rem, 7vw, 1.55rem)"
                        : "clamp(1.55rem, 3vw, 2.1rem)",
                    lineHeight: 1.12,
                    letterSpacing: "-0.04em",
                    color: "rgba(243, 248, 255, 0.98)",
                    fontWeight: 650,
                  }}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                >
                  Build faster interviews.
                  <br />
                  Decide with confidence.
                </motion.h3>
                <motion.a
                  href="https://github.com/Udaysavaliya04"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -1.5 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
                  style={{
                    marginTop: "0.75rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.36rem 0.74rem",
                    borderRadius: "999px",
                    border: "1px solid rgb(70, 0, 0)",
                    background: "rgba(214, 214, 214, 0.1)",
                    color: "rgba(0, 0, 0, 1)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    textDecoration: "none",
                    boxShadow: "0 10px 28px -24px rgba(255, 98, 0, 0.72)",
                    width: "fit-content",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ff0000", animation: "badgeBlinkPulse 1s ease infinite" }} />
                  Cooked by Uday Savaliya
                </motion.a>
              </div>

              <motion.div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.55rem",
                  justifyContent: window.innerWidth <= 900 ? "flex-start" : "flex-end",
                }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.27 }}
                >
                  <Link
                  to="/register"
                  className="action-btn run-btn premium-arrow-btn"
                  style={{
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    padding: "0.55rem 0.95rem",
                    minHeight: "unset",
                  }}
                >
                  <span className="premium-arrow-btn__label">Sign Up</span>
                  <span className="premium-arrow-btn__icon-wrap" aria-hidden="true">
                    <svg className="premium-arrow-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.31 }}
                >
                  <Link
                  to="/login"
                  className="action-btn save-btn"
                  style={{
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    padding: "0.55rem 0.95rem",
                    minHeight: "unset",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                  }}
                >
                  Sign In
                </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              style={{
                marginTop: "1.3rem",
                paddingTop: "1.15rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.14)",
                display: "grid",
                gridTemplateColumns:
                  window.innerWidth <= 768
                    ? "1fr"
                    : window.innerWidth <= 1100
                      ? "repeat(2, minmax(0, 1fr))"
                      : "1.2fr 1fr 1fr",
                gap: "0.9rem",
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
            >
              <motion.div
                style={{ display: "grid", gap: "0.45rem" }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
              >
                <p style={{ margin: 0, color: "rgba(236, 243, 255, 0.95)", fontSize: "0.82rem", fontWeight: 600 }}>
                  Product
                </p>
                <Link to="/join" style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}>
                  Home
                </Link>
                <Link to="/register" style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}>
                  Create Account
                </Link>
                <Link to="/login" style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}>
                  Access Dashboard
                </Link>
              </motion.div>

              <motion.div
                style={{ display: "grid", gap: "0.45rem" }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              >
                <p style={{ margin: 0, color: "rgba(236, 243, 255, 0.95)", fontSize: "0.82rem", fontWeight: 600 }}>
                  Socials
                </p>
                <a
                  href="https://github.com/Udaysavaliya04/techify"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}
                >
                  GitHub Repository
                </a>
                <a
                  href="https://github.com/Udaysavaliya04"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}
                >
                  Creator GitHub
                </a>
                <a
                  href="https://github.com/Udaysavaliya04/techify/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}
                >
                  Feedback & Issues
                </a>
              </motion.div>

              <motion.div
                style={{ display: "grid", gap: "0.45rem" }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.36 }}
              >
                <p style={{ margin: 0, color: "rgba(236, 243, 255, 0.95)", fontSize: "0.82rem", fontWeight: 600 }}>
                  Quick Access
                </p>
                <Link to="/register" style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}>
                  Start as Interviewer
                </Link>
                <Link to="/register" style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}>
                  Join as Candidate
                </Link>
                
              </motion.div>
            </motion.div>

            <motion.div
              style={{
                marginTop: "1.4rem",
                paddingTop: "0.95rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                position: "relative",
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
            >
              <motion.p
                style={{
                  margin: 0,
                  fontSize: "0.73rem",
                  color: "rgba(179, 199, 230, 0.86)",
                  letterSpacing: "-0.01em",
                  position: "relative",
                  zIndex: 2,
                }}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.36 }}
              >
                © {new Date().getFullYear()} Techify. All rights reserved.
              </motion.p>

              <motion.div
                aria-hidden="true"
                style={{
                  marginTop: "0.35rem",
                  fontSize:
                    window.innerWidth <= 480
                      ? "clamp(2.4rem, 14vw, 4.6rem)"
                      : window.innerWidth <= 768
                        ? "clamp(3.4rem, 11vw, 6.6rem)"
                        : "clamp(5rem, 10vw, 8.6rem)",
                  lineHeight: 0.9,
                  letterSpacing:
                    window.innerWidth <= 480
                      ? "0.3em"
                      : window.innerWidth <= 768
                        ? "0.48em"
                        : "0.75em",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "rgba(200, 200, 200, 0.09)",
                  textAlign: "center",
                  width: "100%",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                  userSelect: "none",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  fontFamily: "Inter, sans-serif",
                }}
                initial={{ opacity: 0, y: 18, filter: "blur(7px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1], delay: 0.42 }}
              >
                Techify
              </motion.div>
            </motion.div>
          </div>
        </motion.footer>
      )}
    </div>
  );
} 
