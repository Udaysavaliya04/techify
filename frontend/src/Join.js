import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion, transform, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from './components/AuthWrapper';
import config from './config';
import './App.css';

export default function Join() {
  const [room, setRoom] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [inviteToken, setInviteToken] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [showCandidateInstructionsModal, setShowCandidateInstructionsModal] = useState(false);
  const [showFeedbackIssuesModal, setShowFeedbackIssuesModal] = useState(false);
  const [instructionsAcknowledged, setInstructionsAcknowledged] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isHeroVideoUnavailable, setIsHeroVideoUnavailable] = useState(false);
  const heroVideoSectionRef = useRef(null);
  const featureSectionRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);
  const { isAuthenticated, user } = useAuth();
  const isMobileView = window.innerWidth <= 768;
  const isSmallMobileView = window.innerWidth <= 480;
  const prefersReducedMotion = useReducedMotion();
  const landingHeroVideoSrc = '/video.mp4';

  const { scrollYProgress: heroVideoScrollProgress } = useScroll({
    target: heroVideoSectionRef,
    offset: ['start end', 'end center'],
  });
  const heroVideoOpacity = useTransform(
    heroVideoScrollProgress,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [0.75, 1]
  );

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
    if (isAuthenticated() && user?.role === 'candidate') {
      setShowCandidateInstructionsModal(true);
      setInstructionsAcknowledged(false);
    }
  }, [isAuthenticated, user?.role]);

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

    if (user?.role === 'candidate' && !instructionsAcknowledged) {
      setJoinError('Please read and accept the important interview instructions before joining.');
      setShowCandidateInstructionsModal(true);
      return;
    }

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
      glow: 'rgba(114, 159, 244, 0.5)',
      gradient: 'transparent',
    },
    {
      id: 'integrity',
      badge: 'Proctoring Intelligence',
      title: 'Built-In Integrity. Zero Tolerance for Cheating.',
      description:
        'From copy-paste alerts and plagiarism scans to camera checks and suspicious activity flags.',
      points: ['Catch call plagiarism instantly', 'track every copy-paste action', 'Replay Every Line, Click by Click'],
      glow: 'rgba(94, 196, 255, 0.52)',
      gradient: 'transparent',
      meta: 'Cheat Detection',
    },
    {
      id: 'history',
      badge: 'Code History',
      title: 'Code Replay Timeline For Every Session',
      description:
        'Track editor snapshots, execution checkpoints, and progression history so decisions are grounded in actual coding flow.',
      points: ['Snapshot timeline', 'Execution-linked history', 'Replay for review'],
      glow: 'rgba(156, 170, 255, 0.48)',
      gradient: 'transparent',
      meta: 'Audit Trail',
    },
  ];

  const faqItems = [
    {
      question: 'What is Techify?',
      answer:
        'Techify is a remote technical interview platform designed for tech teams. We help you assess and interview developers faster, with advanced tools in one tab, AI proctoring, and detailed performance insights.',
    },
    {
      question: 'Do i need to install anything?',
      answer:
        'No installation required. Techify is fully browser based for both interviewers and candidates, ensuring seemless experience without any setup.',
    },
    {
      question: 'Do i have to switch between multiple tabs & tools?',
      answer: 'No need to switch between tabs, Techify is an all in one interview platform consisting all advanced tools in one single tab.',
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

  const landingCtaHighlights = [
    'Setup interview rooms in minutes',
    'Track integrity and coding flow live',
    'Export decision-ready reports',
  ];

  const landingCtaStats = [
    { label: 'Realtime Sync', value: '< 120ms', note: 'Live editor collaboration' },
    { label: 'Invite Security', value: 'Signed + TTL', note: 'Controlled interview access' },
    { label: 'Decision Reports', value: 'One-click export', note: 'Exportable final report' },
  ];

  const featuredCompanyLogos = [
    { id: 'google', name: 'Google' },
    { id: 'OpenAI', name: 'OpenAI' },
    { id: 'amazon', name: 'Amazon' },
    { id: 'meta', name: 'Meta' },
    { id: 'netflix', name: 'Netflix' },
    { id: 'IBM', name: 'IBM' },
    { id: 'Infosys', name: 'Infosys' },
    { id: 'LinkedIn', name: 'LinkedIn' },
    {id: 'Zoho', name: 'Zoho'},
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
      title: 'Share Invite Link',
      description:
        'Invite candidate with signed token links so only intended participants can join.',
      points: ['Token-based access', 'Time-limited invite links', 'One-click copy and share'],
      accent: 'rgba(142, 172, 255, 0.9)',
    },
    {
      id: 'conduct-interview',
      step: '03',
      title: 'Live Assessment Experience',
      description:
        'Collaborate in real-time with editor,screen sharing, video call, AI support, with advanced cheat detection.',
      points: ['Realtime code execution + output sync', 'Integrated video controls', 'Live Monitoring + AI assistance'],
      accent: 'rgba(119, 212, 191, 0.9)',
    },
    {
      id: 'decide-share',
      step: '04',
      title: 'Smart Assessment And Proctoring',
      description:
        'Finalize rubric scores and generate decision-ready reports for your hiring panel.',
      points: ['Weighted rubric scoring', 'Timeline + notes replay', 'Exportable final report'],
      accent: 'rgba(255, 189, 124, 0.9)',
    },
  ];

  const getBentoDesktopSpan = (index) =>
    index % 4 === 0 || index % 4 === 3 ? 'span 4' : 'span 2';

  const renderCompanyWordmark = (companyId) => {
    switch (companyId) {
      case 'google':
        return (
          <svg width="200" height="80" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M138.707 59.7693C138.707 68.0976 132.192 74.2345 124.196 74.2345C116.201 74.2345 109.685 68.0976 109.685 59.7693C109.685 51.3824 116.201 45.3041 124.196 45.3041C132.192 45.3041 138.707 51.3824 138.707 59.7693ZM132.355 59.7693C132.355 54.565 128.579 51.0041 124.196 51.0041C119.813 51.0041 116.037 54.565 116.037 59.7693C116.037 64.9215 119.813 68.5345 124.196 68.5345C128.579 68.5345 132.355 64.915 132.355 59.7693Z" fill="#EA4335"/>
<path d="M170.014 59.7693C170.014 68.0976 163.499 74.2345 155.503 74.2345C147.508 74.2345 140.993 68.0976 140.993 59.7693C140.993 51.3889 147.508 45.3041 155.503 45.3041C163.499 45.3041 170.014 51.3824 170.014 59.7693ZM163.662 59.7693C163.662 54.565 159.886 51.0041 155.503 51.0041C151.121 51.0041 147.345 54.565 147.345 59.7693C147.345 64.9215 151.121 68.5345 155.503 68.5345C159.886 68.5345 163.662 64.915 163.662 59.7693Z" fill="#FBBC05"/>
<path d="M200.012 46.178V72.1476C200.012 82.8302 193.712 87.1932 186.264 87.1932C179.253 87.1932 175.034 82.5041 173.442 78.6693L178.973 76.3671C179.957 78.7215 182.37 81.4998 186.257 81.4998C191.025 81.4998 193.979 78.5585 193.979 73.0215V70.9411H193.757C192.336 72.6954 189.596 74.228 186.14 74.228C178.907 74.228 172.281 67.928 172.281 59.8215C172.281 51.6563 178.907 45.3041 186.14 45.3041C189.59 45.3041 192.329 46.8367 193.757 48.5389H193.979V46.1845H200.012V46.178ZM194.429 59.8215C194.429 54.728 191.031 51.0041 186.707 51.0041C182.325 51.0041 178.653 54.728 178.653 59.8215C178.653 64.8628 182.325 68.5345 186.707 68.5345C191.031 68.5345 194.429 64.8628 194.429 59.8215Z" fill="#4285F4"/>
<path d="M209.958 30.9568V73.3481H203.762V30.9568H209.958Z" fill="#34A853"/>
<path d="M234.102 64.5297L239.032 67.8166C237.441 70.171 233.606 74.2275 226.98 74.2275C218.763 74.2275 212.626 67.8753 212.626 59.7623C212.626 51.1601 218.815 45.2971 226.27 45.2971C233.776 45.2971 237.448 51.271 238.648 54.4992L239.306 56.1427L219.97 64.1514C221.45 67.0536 223.752 68.534 226.98 68.534C230.215 68.534 232.459 66.9427 234.102 64.5297ZM218.926 59.3253L231.852 53.9579C231.141 52.1514 229.002 50.8927 226.485 50.8927C223.257 50.8927 218.763 53.7427 218.926 59.3253Z" fill="#EA4335"/>
<path d="M86.2333 56.0057V49.8687H106.913C107.116 50.9383 107.22 52.2035 107.22 53.5731C107.22 58.1774 105.961 63.8709 101.905 67.9274C97.9592 72.0361 92.918 74.2274 86.2398 74.2274C73.8617 74.2274 63.4531 64.1448 63.4531 51.7665C63.4531 39.3883 73.8617 29.3057 86.2398 29.3057C93.0875 29.3057 97.9657 31.9926 101.631 35.4948L97.3005 39.8252C94.6723 37.36 91.1115 35.4426 86.2333 35.4426C77.1943 35.4426 70.1248 42.7274 70.1248 51.7665C70.1248 60.8057 77.1943 68.0904 86.2333 68.0904C92.0962 68.0904 95.4353 65.7361 97.5744 63.597C99.3092 61.8622 100.45 59.3839 100.9 55.9991L86.2333 56.0057Z" fill="#4285F4"/>
</svg>
        );
      case 'OpenAI':
        return (
          <svg width="120" height="80" viewBox="0 0 369 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_1352_625)">
<path d="M114.824 48.0749C114.824 64.4249 125.324 75.825 139.874 75.825C154.424 75.825 164.924 64.4249 164.924 48.0749C164.924 31.7249 154.424 20.325 139.874 20.325C125.324 20.325 114.824 31.7249 114.824 48.0749ZM155.324 48.0749C155.324 59.7749 148.949 67.35 139.874 67.35C130.799 67.35 124.424 59.7749 124.424 48.0749C124.424 36.375 130.799 28.8 139.874 28.8C148.949 28.8 155.324 36.375 155.324 48.0749Z" fill="black"/>
<path d="M191.958 75.825C202.983 75.825 209.283 66.525 209.283 55.35C209.283 44.175 202.983 34.875 191.958 34.875C186.858 34.875 183.108 36.9 180.633 39.825V35.625H171.633V88.5H180.633V70.875C183.108 73.8 186.858 75.825 191.958 75.825ZM180.408 54.225C180.408 46.8 184.608 42.75 190.158 42.75C196.683 42.75 200.208 47.85 200.208 55.35C200.208 62.85 196.683 67.95 190.158 67.95C184.608 67.95 180.408 63.825 180.408 56.55V54.225Z" fill="black"/>
<path d="M233.641 75.825C241.516 75.825 247.741 71.7 250.516 64.8L242.791 61.875C241.591 65.925 238.066 68.175 233.641 68.175C227.866 68.175 223.816 64.05 223.141 57.3H250.741V54.3C250.741 43.5 244.666 34.875 233.266 34.875C221.866 34.875 214.516 43.8 214.516 55.35C214.516 67.5 222.391 75.825 233.641 75.825ZM233.191 42.45C238.891 42.45 241.591 46.2 241.666 50.55H223.591C224.941 45.225 228.541 42.45 233.191 42.45Z" fill="black"/>
<path d="M257.492 75H266.492V51.9C266.492 46.275 270.617 43.275 274.667 43.275C279.617 43.275 281.567 46.8 281.567 51.675V75H290.567V49.05C290.567 40.575 285.617 34.875 277.367 34.875C272.267 34.875 268.742 37.2 266.492 39.825V35.625H257.492V75Z" fill="black"/>
<path d="M316.927 21.1499L296.527 74.9999H306.052L310.627 62.6999H333.877L338.527 74.9999H348.202L327.802 21.1499H316.927ZM322.177 31.7999L330.727 54.2999H313.777L322.177 31.7999Z" fill="black"/>
<path d="M363.655 21.3062H354.055V75.1562H363.655V21.3062Z" fill="black"/>
<path d="M92.8298 40.9281C95.0985 34.1187 94.3172 26.6594 90.6891 20.4656C85.2329 10.9656 74.2641 6.0781 63.5516 8.3781C58.786 3.00935 51.9391 -0.0437745 44.761 -2.44586e-05C33.811 -0.0250245 24.0954 7.02498 20.7266 17.4437C13.6923 18.8844 7.62038 23.2875 4.06725 29.5281C-1.42962 39.0031 -0.176499 50.9468 7.16725 59.0718C4.8985 65.8812 5.67975 73.3406 9.30788 79.5343C14.7641 89.0343 25.7329 93.9219 36.4454 91.6219C41.2079 96.9906 48.0579 100.044 55.236 99.9969C66.1923 100.025 75.911 92.9687 79.2798 82.5406C86.3141 81.1 92.386 76.6969 95.9391 70.4562C101.43 60.9812 100.174 49.0468 92.8329 40.9218L92.8298 40.9281ZM55.2423 93.4625C50.8579 93.4687 46.611 91.9344 43.2454 89.125C43.3985 89.0437 43.6641 88.8969 43.836 88.7906L63.7485 77.2906C64.7673 76.7125 65.3923 75.6281 65.386 74.4562V46.3843L73.8016 51.2437C73.8923 51.2875 73.9516 51.375 73.9641 51.475V74.7218C73.9516 85.0594 65.5798 93.4406 55.2423 93.4625ZM14.9797 76.2656C12.7829 72.4719 11.9923 68.025 12.7454 63.7093C12.8923 63.7968 13.1516 63.9562 13.336 64.0625L33.2485 75.5625C34.2579 76.1531 35.5079 76.1531 36.5204 75.5625L60.8298 61.525V71.2437C60.836 71.3437 60.7891 71.4406 60.711 71.5031L40.5829 83.125C31.6172 88.2875 20.1673 85.2187 14.9829 76.2656H14.9797ZM9.73913 32.8C11.9266 29 15.3798 26.0937 19.4923 24.5844C19.4923 24.7562 19.4829 25.0594 19.4829 25.2719V48.275C19.4766 49.4437 20.1016 50.5281 21.1173 51.1062L45.4266 65.1406L37.011 70C36.9266 70.0562 36.8204 70.0656 36.7266 70.025L16.5954 58.3937C7.6485 53.2125 4.57975 41.7656 9.736 32.8031L9.73913 32.8ZM78.8829 48.8906L54.5735 34.8531L62.9891 29.9969C63.0735 29.9406 63.1798 29.9312 63.2735 29.9719L83.4048 41.5937C92.3673 46.7719 95.4391 58.2375 90.261 67.2C88.0704 70.9937 84.6204 73.9 80.511 75.4125V51.7218C80.5204 50.5531 79.8985 49.4718 78.886 48.8906H78.8829ZM87.2579 36.2844C87.111 36.1937 86.8516 36.0375 86.6673 35.9312L66.7548 24.4312C65.7454 23.8406 64.4954 23.8406 63.4829 24.4312L39.1735 38.4687V28.75C39.1673 28.65 39.2141 28.5531 39.2922 28.4906L59.4204 16.8781C68.386 11.7062 79.8485 14.7844 85.0173 23.7531C87.2016 27.5406 87.9923 31.975 87.2516 36.2844H87.2579ZM34.5985 53.6062L26.1797 48.7469C26.0891 48.7031 26.0298 48.6156 26.0173 48.5156V25.2687C26.0235 14.9187 34.4204 6.53123 44.7704 6.53748C49.1485 6.53748 53.386 8.07498 56.7516 10.875C56.5985 10.9562 56.336 11.1031 56.161 11.2094L36.2485 22.7094C35.2298 23.2875 34.6048 24.3687 34.611 25.5406L34.5985 53.6V53.6062ZM39.1704 43.75L49.9985 37.4969L60.8266 43.7469V56.25L49.9985 62.5L39.1704 56.25V43.75Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_1352_625">
<rect width="368.75" height="100" fill="white"/>
</clipPath>
</defs>
</svg>
        );
      case 'amazon':
        return (
          <svg width="200" height="80" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M176.019 75.9219C164.449 84.45 147.679 89 133.24 89C112.995 89 94.7684 81.5119 80.9797 69.0578C79.8963 68.0785 80.867 66.7438 82.167 67.5065C97.0478 76.1646 115.447 81.3733 134.453 81.3733C147.271 81.3733 161.372 78.7212 174.338 73.2179C176.296 72.3858 177.934 74.5005 176.019 75.9219Z" fill="#FF9900"/>
<path d="M180.829 70.4182C179.356 68.5289 171.053 69.5256 167.326 69.9676C166.191 70.1062 166.018 69.1182 167.04 68.4075C173.653 63.7535 184.504 65.0969 185.769 66.6569C187.034 68.2255 185.44 79.1023 179.226 84.2937C178.272 85.091 177.362 84.6664 177.787 83.609C179.182 80.125 182.311 72.3162 180.829 70.4182Z" fill="#FF9900"/>
<path d="M167.586 35.552V31.0279C167.586 30.3433 168.106 29.8839 168.73 29.8839H188.984C189.634 29.8839 190.154 30.3519 190.154 31.0279V34.902C190.146 35.552 189.6 36.4013 188.629 37.7446L178.133 52.7295C182.033 52.6341 186.15 53.2148 189.686 55.2081C190.484 55.6588 190.7 56.3175 190.761 56.9675V61.7949C190.761 62.4535 190.033 63.2249 189.27 62.8262C183.039 59.5589 174.762 59.2035 167.872 62.8609C167.17 63.2422 166.433 62.4795 166.433 61.8209V57.2362C166.433 56.4995 166.442 55.2428 167.179 54.1248L179.338 36.6873H168.756C168.106 36.6873 167.586 36.228 167.586 35.552Z" fill="#221F1F"/>
<path d="M93.7013 63.7798H87.5392C86.9499 63.7365 86.4819 63.2944 86.4385 62.7311V31.1062C86.4385 30.4735 86.9672 29.9708 87.6259 29.9708H93.3719C93.9699 29.9968 94.4466 30.4561 94.4899 31.0281V35.1622H94.6026C96.1019 31.1668 98.9186 29.3035 102.715 29.3035C106.571 29.3035 108.981 31.1668 110.714 35.1622C112.205 31.1668 115.593 29.3035 119.225 29.3035C121.807 29.3035 124.633 30.3695 126.357 32.7615C128.307 35.4222 127.909 39.2876 127.909 42.6763L127.9 62.6358C127.9 63.2684 127.371 63.7798 126.713 63.7798H120.559C119.944 63.7365 119.45 63.2424 119.45 62.6358V45.8743C119.45 44.5396 119.571 41.2116 119.277 39.9462C118.817 37.8229 117.439 37.2249 115.654 37.2249C114.163 37.2249 112.603 38.2215 111.971 39.8162C111.338 41.4109 111.399 44.0803 111.399 45.8743V62.6358C111.399 63.2684 110.87 63.7798 110.211 63.7798H104.058C103.434 63.7365 102.949 63.2424 102.949 62.6358L102.94 45.8743C102.94 42.3469 103.521 37.1555 99.144 37.1555C94.7153 37.1555 94.8886 42.2169 94.8886 45.8743V62.6358C94.8886 63.2684 94.3599 63.7798 93.7013 63.7798Z" fill="#221F1F"/>
<path d="M207.591 29.3035C216.734 29.3035 221.683 37.1555 221.683 47.1396C221.683 56.7857 216.214 64.4384 207.591 64.4384C198.612 64.4384 193.724 56.5864 193.724 46.8016C193.724 36.9562 198.673 29.3035 207.591 29.3035ZM207.643 35.7602C203.102 35.7602 202.816 41.9482 202.816 45.805C202.816 49.6703 202.755 57.9211 207.591 57.9211C212.366 57.9211 212.592 51.265 212.592 47.209C212.592 44.5396 212.479 41.3502 211.673 38.8195C210.98 36.6182 209.602 35.7602 207.643 35.7602Z" fill="#221F1F"/>
<path d="M233.539 63.7798H227.403C226.788 63.7365 226.294 63.2424 226.294 62.6358L226.285 31.0021C226.337 30.4215 226.848 29.9708 227.472 29.9708H233.184C233.721 29.9968 234.163 30.3608 234.284 30.8548V35.6909H234.397C236.122 31.3661 238.54 29.3035 242.795 29.3035C245.56 29.3035 248.255 30.3001 249.988 33.0302C251.6 35.5609 251.6 39.8162 251.6 42.8756V62.7831C251.531 63.3378 251.02 63.7798 250.413 63.7798H244.234C243.67 63.7365 243.202 63.3204 243.142 62.7831V45.6056C243.142 42.1476 243.54 37.0862 239.285 37.0862C237.786 37.0862 236.408 38.0915 235.723 39.6169C234.856 41.5496 234.744 43.4736 234.744 45.6056V62.6358C234.735 63.2684 234.198 63.7798 233.539 63.7798Z" fill="#221F1F"/>
<path d="M151.439 48.6735V47.3388C146.985 47.3388 142.279 48.2922 142.279 53.5442C142.279 56.2049 143.657 58.0076 146.023 58.0076C147.756 58.0076 149.307 56.9416 150.287 55.2082C151.5 53.0762 151.439 51.0742 151.439 48.6735ZM157.653 63.693C157.246 64.057 156.657 64.083 156.197 63.8403C154.152 62.1416 153.788 61.353 152.661 59.7323C149.281 63.1817 146.889 64.213 142.504 64.213C137.321 64.213 133.283 61.015 133.283 54.6102C133.283 49.6095 135.995 46.2035 139.852 44.5395C143.197 43.0661 147.869 42.8061 151.439 42.3988V41.6015C151.439 40.1368 151.552 38.4034 150.694 37.1381C149.94 36.0027 148.501 35.5347 147.236 35.5347C144.887 35.5347 142.79 36.7394 142.279 39.2354C142.175 39.7901 141.767 40.3361 141.213 40.3621L135.233 39.7208C134.73 39.6081 134.175 39.2008 134.314 38.4294C135.692 31.184 142.235 29 148.094 29C151.093 29 155.01 29.7973 157.376 32.068C160.375 34.8674 160.089 38.6028 160.089 42.6675V52.2702C160.089 55.1562 161.285 56.4216 162.411 57.9816C162.81 58.5363 162.897 59.2036 162.394 59.6196C161.137 60.6683 158.901 62.6183 157.671 63.7103L157.653 63.693Z" fill="#221F1F"/>
<path d="M70.6568 48.6735V47.3388C66.2021 47.3388 61.4961 48.2922 61.4961 53.5442C61.4961 56.2049 62.8741 58.0076 65.2401 58.0076C66.9734 58.0076 68.5248 56.9416 69.5041 55.2082C70.7175 53.0762 70.6568 51.0742 70.6568 48.6735ZM76.8708 63.693C76.4635 64.057 75.8742 64.083 75.4148 63.8403C73.3695 62.1416 73.0055 61.353 71.8788 59.7323C68.4988 63.1817 66.1068 64.213 61.7214 64.213C56.5387 64.213 52.5 61.015 52.5 54.6102C52.5 49.6095 55.2127 46.2035 59.0694 44.5395C62.4147 43.0661 67.0861 42.8061 70.6568 42.3988V41.6015C70.6568 40.1368 70.7695 38.4034 69.9115 37.1381C69.1574 36.0027 67.7188 35.5347 66.4534 35.5347C64.1047 35.5347 62.0074 36.7394 61.4961 39.2354C61.3921 39.7901 60.9847 40.3361 60.4301 40.3621L54.45 39.7208C53.9473 39.6081 53.3927 39.2008 53.5313 38.4294C54.9093 31.184 61.4527 29 67.3114 29C70.3101 29 74.2275 29.7973 76.5935 32.068C79.5922 34.8674 79.3062 38.6028 79.3062 42.6675V52.2702C79.3062 55.1562 80.5022 56.4216 81.6289 57.9816C82.0275 58.5363 82.1142 59.2036 81.6115 59.6196C80.3549 60.6683 78.1188 62.6183 76.8882 63.7103L76.8708 63.693Z" fill="#221F1F"/>
</svg>
        );
      case 'meta':
        return (
          <svg width="120" height="80" viewBox="0 0 493 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_1502_2791)">
<path d="M16.1298 65.4125C16.1298 71.1146 17.3814 75.4924 19.0172 78.1409C21.162 81.6099 24.3609 83.0795 27.6222 83.0795C31.8286 83.0795 35.6767 82.0357 43.0925 71.7793C49.0334 63.5586 56.0338 52.0195 60.7439 44.7855L68.7205 32.5297C74.2616 24.0182 80.6751 14.5563 88.0286 8.14281C94.0318 2.90815 100.508 0 107.025 0C117.967 0 128.389 6.3408 136.366 18.233C145.096 31.2574 149.333 47.6624 149.333 64.592C149.333 74.6563 147.35 82.0513 143.974 87.8935C140.713 93.5437 134.356 99.1886 123.664 99.1886V83.0795C132.819 83.0795 135.104 74.6667 135.104 65.0386C135.104 51.3184 131.905 36.0922 124.858 25.2126C119.857 17.4956 113.376 12.7803 106.246 12.7803C98.5342 12.7803 92.3285 18.5966 85.3541 28.9672C81.6462 34.4771 77.8397 41.1918 73.5657 48.7686L68.8608 57.1035C59.4093 73.8617 57.0152 77.6787 52.2895 83.9779C44.0065 95.0081 36.9335 99.1886 27.6222 99.1886C16.5764 99.1886 9.59169 94.4057 5.26582 87.1977C1.7345 81.3242 0 73.6177 0 64.8361L16.1298 65.4125Z" fill="#0081FB"/>
<path d="M12.7227 19.3703C20.1177 7.97144 30.7895 0 43.0297 0C50.1183 0 57.1654 2.09802 64.524 8.10646C72.5734 14.6758 81.1524 25.493 91.8554 43.321L95.6931 49.7189C104.958 65.1529 110.229 73.0932 113.313 76.8374C117.281 81.6462 120.059 83.0795 123.668 83.0795C132.824 83.0795 135.109 74.6667 135.109 65.0386L149.338 64.592C149.338 74.6563 147.354 82.0513 143.979 87.8935C140.717 93.5437 134.361 99.1886 123.668 99.1886C117.021 99.1886 111.132 97.7449 104.62 91.6014C99.6139 86.8861 93.7613 78.5096 89.2588 70.9795L75.8658 48.6076C69.1459 37.3801 62.9817 29.0088 59.414 25.2178C55.5763 21.1412 50.6428 16.2181 42.77 16.2181C36.3981 16.2181 30.9869 20.6894 26.4585 27.5287L12.7227 19.3703Z" fill="url(#paint0_linear_1502_2791)"/>
<path d="M42.7653 16.2181C36.3934 16.2181 30.9822 20.6894 26.4538 27.5287C20.0506 37.1931 16.1298 51.5884 16.1298 65.4125C16.1298 71.1146 17.3814 75.4924 19.0172 78.1409L5.26582 87.1977C1.7345 81.3242 0 73.6177 0 64.8361C0 48.8672 4.38299 32.2233 12.7179 19.3703C20.113 7.97144 30.7848 0 43.025 0L42.7653 16.2181Z" fill="url(#paint1_linear_1502_2791)"/>
<path d="M180.695 3.13672H199.354L231.079 60.5311L262.809 3.13672H281.063V97.4438H265.842V25.1659L238.017 75.2172H223.736L195.916 25.1659V97.4438H180.695V3.13672ZM328.756 38.2993C317.84 38.2993 311.266 46.5148 309.692 56.6882H346.74C345.977 46.2085 339.932 38.2993 328.756 38.2993ZM294.601 62.4837C294.601 41.0777 308.436 25.4983 329.021 25.4983C349.269 25.4983 361.359 40.8803 361.359 63.6262V67.8066H309.692C311.526 78.8732 318.869 86.3305 330.709 86.3305C340.155 86.3305 346.06 83.4483 351.658 78.1773L359.744 88.0806C352.125 95.0861 342.435 99.1263 330.169 99.1263C307.885 99.1263 294.601 82.8771 294.601 62.4837ZM379.815 39.6495H365.804V27.1861H379.815V6.57456H394.501V27.1861H415.788V39.6495H394.501V71.2393C394.501 82.0254 397.949 85.8579 406.425 85.8579C410.293 85.8579 412.511 85.5256 415.788 84.9803V97.3087C411.706 98.4616 407.811 98.9913 403.594 98.9913C387.74 98.9913 379.815 90.3292 379.815 72.9894V39.6495ZM477.627 51.7703C474.678 44.3233 468.098 38.8394 458.428 38.8394C445.861 38.8394 437.817 47.756 437.817 62.2812C437.817 76.4428 445.222 85.7904 457.826 85.7904C467.735 85.7904 474.808 80.026 477.627 72.8543V51.7703ZM492.314 97.4438H477.897V87.608C473.868 93.3983 466.535 99.1263 454.658 99.1263C435.558 99.1263 422.793 83.1367 422.793 62.2812C422.793 41.2283 435.864 25.4983 455.468 25.4983C465.159 25.4983 472.762 29.3724 477.897 36.2117V27.1861H492.314V97.4438Z" fill="#192830"/>
</g>
<defs>
<linearGradient id="paint0_linear_1502_2791" x1="1908.73" y1="5547.99" x2="12178.7" y2="6066.68" gradientUnits="userSpaceOnUse">
<stop stopColor="#0064E1"/>
<stop offset="0.4" stopColor="#0064E1"/>
<stop offset="0.83" stopColor="#0073EE"/>
<stop offset="1" stopColor="#0082FB"/>
</linearGradient>
<linearGradient id="paint1_linear_1502_2791" x1="2336.9" y1="7218.44" x2="2336.9" y2="3427.46" gradientUnits="userSpaceOnUse">
<stop stopColor="#0082FB"/>
<stop offset="1" stopColor="#0064E0"/>
</linearGradient>
<clipPath id="clip0_1502_2791">
<rect width="492.308" height="100" fill="white"/>
</clipPath>
</defs>
</svg>
        );
      case 'netflix':
        return (
          <svg width="200" height="80" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M180.822 27.9902H172.985V71.8183C180.107 72.0633 187.199 72.4226 194.262 72.8935V65.1719C189.794 64.8739 185.314 64.6213 180.822 64.4121V27.9902ZM243.101 27.9947H234.492L228.818 41.147L223.72 27.9947H215.24L224.352 51.4961L214.406 74.5517C217.157 74.8201 219.901 75.1065 222.643 75.4091L228.428 62.0038L234.157 76.7812C237.141 77.1648 240.117 77.5652 243.088 77.9892L243.101 77.9841L232.892 51.6548L243.101 27.9947ZM146.084 71.4353L153.921 71.4336V53.6055H164.545V45.8839H153.921V35.7862H167.962V27.9951H146.084V71.4353ZM116.82 35.7857H125.022V71.8944C127.629 71.7959 130.243 71.7147 132.858 71.6463V35.7857H141.06V27.9947H116.82V35.7857ZM90.0274 74.1386C97.2503 73.4822 104.507 72.9413 111.796 72.5215V64.7989C107.139 65.0681 102.495 65.3868 97.8641 65.7509V54.0605C100.902 54.0303 104.903 53.9376 108.447 53.9816V46.2593C105.616 46.2524 101.065 46.2988 97.8641 46.3398V35.7862H111.796V27.9951H90.0274V74.1386ZM74.6547 56.2872L64.4479 27.9947H57V77.9902C59.6072 77.6191 62.2194 77.2637 64.8367 76.9228V49.7354L73.9123 75.8065C76.7668 75.4755 79.6264 75.162 82.4916 74.8672V27.9947H74.6547V56.2872ZM200.723 73.3585C203.339 73.5587 205.951 73.7734 208.561 74.0056V27.9947H200.723V73.3585Z" fill="#ED1C24"/>
</svg>

        );
      case 'IBM':
        return (
          <svg width="100" height="80" viewBox="0 0 250 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_1502_2802)">
<path d="M48.5637 92.7125V99.6502H0V92.7125H48.5637ZM124.458 92.7122C119.586 97.1908 113.205 99.668 106.588 99.6498L55.5014 99.5812V92.7122H124.458ZM196.667 92.7121L194.244 99.6498L191.843 92.7121H196.667ZM173.442 92.7125V99.6502H138.753V92.7125H173.442ZM249.756 92.7125V99.6502H215.068V92.7125H249.756ZM132.315 79.4678C131.72 81.9014 130.78 84.2375 129.524 86.4054H55.5014V79.4678H132.315ZM201.316 79.468L198.881 86.4057H189.629L187.194 79.468H201.316ZM173.442 79.4678V86.4054H138.753V79.4678H173.442ZM249.756 79.4678V86.4054H215.068V79.4678H249.756ZM48.5637 79.4678V86.4054H0V79.4678H48.5637ZM34.6883 66.2231V73.1609H13.8753V66.2231H34.6883ZM90.1897 66.2231V73.1609H69.3767V66.2231H90.1897ZM132.149 66.2231C132.764 68.4845 133.076 70.8174 133.077 73.1609H109.741V66.2231H132.149ZM205.966 66.2231L203.53 73.1609H184.98L182.544 66.2231H205.966ZM173.442 66.2231V73.1609H152.629V66.2231H173.442ZM235.881 66.2231V73.1609H215.068V66.2231H235.881ZM34.6883 52.9785V59.9162H13.8753V52.9785H34.6883ZM173.442 52.9785V59.9162H152.629V52.9785H173.442ZM235.881 52.9785V59.9162H215.068V52.9785H235.881ZM123.73 52.9782C126.04 54.9438 127.997 57.2902 129.517 59.9158H69.3765V52.9782H123.73ZM210.615 52.9782L208.18 59.916H180.329L177.894 52.9782H210.615ZM192.304 39.7341L194.255 45.3419L196.204 39.7341H235.881V46.6719H215.068V40.2969L212.83 46.6719H175.68L173.442 40.2961V46.6719H152.629V39.7341H192.304ZM69.3767 39.7338L129.517 39.7342C127.998 42.3599 126.041 44.7063 123.73 46.6719H69.3767V39.7338ZM34.6883 39.7338V46.6715H13.8753V39.7338H34.6883ZM34.6883 26.4893V33.4269H13.8753V26.4893H34.6883ZM90.1897 26.4893V33.4269H69.3767V26.4893H90.1897ZM133.077 26.4893C133.076 28.8328 132.764 31.1657 132.149 33.427H109.741V26.4893H133.077ZM187.699 26.4893L190.111 33.427H152.629V26.4893H187.699ZM235.881 26.4893V33.427H198.398L200.811 26.4893H235.881ZM48.5637 13.2446V20.1823H0V13.2446H48.5637ZM129.524 13.2446C130.78 15.4125 131.72 17.7486 132.315 20.1821H55.5014V13.2446H129.524ZM249.756 13.2444V20.1821H203.004L205.417 13.2444H249.756ZM183.093 13.2444L185.506 20.1821H138.754V13.2444H183.093ZM48.5637 4.80837e-05V6.93773H0V4.80837e-05H48.5637ZM106.588 2.3977e-05C113.203 -0.00888849 119.581 2.46712 124.458 6.93765H55.5014V2.3977e-05H106.588ZM249.756 0.00028223V6.93804H207.61L210.022 0.00028223H249.756ZM178.487 0.00028223L180.9 6.93804H138.754V0.00028223H178.487Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_1502_2802">
<rect width="249.756" height="100" fill="white"/>
</clipPath>
</defs>
</svg>
        );
        case 'Infosys':
          return (
          <svg width="120" height="80" viewBox="0 0 269 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M259.134 16.7417C263.464 16.7417 267.259 13.1703 267.259 8.61671C267.259 4.28635 263.688 0.491699 259.134 0.491699C254.804 0.491699 251.009 4.06313 251.009 8.61671C251.232 13.1703 254.804 16.7417 259.134 16.7417ZM252.438 8.66134C252.438 4.91134 255.607 1.74169 259.357 1.74169C263.107 1.74169 266.277 4.91134 266.277 8.66134C266.277 12.4113 263.107 15.581 259.357 15.581C255.384 15.581 252.438 12.4113 252.438 8.66134ZM256.188 12.8131H257.75V9.2417H259.536L260.92 12.5899H262.705L261.143 8.83992C261.723 8.66135 262.527 8.25955 262.527 6.65241C262.527 4.28634 260.741 3.88456 259.179 3.88456H256.411V12.7685H256.188V12.8131ZM257.75 5.67027H259.536C260.518 5.67027 260.92 6.07205 260.92 6.87562C260.92 7.67919 260.339 8.08099 259.536 8.08099H257.75V5.67027ZM1.5 12.1881V2.72384H11.0089V12.2328V72.1435V72.3221V81.6078H1.5V72.0988V71.9203V12.1881ZM98.1964 52.9471C98.375 67.3667 107.304 78.8399 118.152 78.6613C129.045 78.4828 137.527 66.6078 137.348 52.3667C137.17 37.9471 128.241 26.4738 117.393 26.6524C106.5 26.831 97.9732 38.4828 98.1964 52.9471ZM176.902 35.5363C177.08 36.1167 176.5 34.7328 176.5 34.7328L176.902 35.5363ZM183.42 95.0453C183.821 94.2417 184.402 93.2596 185.205 91.6971L183.42 95.0453ZM184 30.581C184.179 30.9828 184.179 31.1613 184.402 31.5631L187.571 39.4649L184 30.581ZM144.045 70.1346C149.982 75.4917 155.116 78.2596 162.036 78.2596C168.955 78.2596 175.071 74.9113 175.071 68.3935C175.071 62.8578 170.339 59.6881 161.634 56.1167C154.313 52.9471 149 50.7596 146.009 46.2506C146.411 48.2149 146.589 50.2239 146.589 52.3667C146.589 69.956 133.732 84.1971 117.929 84.1971C102.125 84.1971 89.2679 69.956 89.2679 52.3667C89.2679 41.6971 94 32.4113 101.143 26.4738H81.7679V72.1435V72.3221V81.831H73.2857V72.7238C73.2857 72.5453 73.2857 72.3221 73.2857 72.3221V26.4292H65.7857V20.7149H73.5089C74.4911 9.06312 81.6339 2.54527 91.6786 2.54527C98.1964 2.54527 101.768 3.12563 103.732 4.10777V12.0096C103.732 12.5899 103.732 12.9917 103.732 12.9917H103.33C100.161 10.0453 97.2143 8.03634 90.0714 8.03634C84.3572 8.03634 80.5625 12.5899 81.9464 20.6703H114.179C115.563 20.4917 116.946 20.2685 118.33 20.2685C129.804 20.2685 139.67 27.7685 144.223 38.6613C144.223 38.081 144.223 37.456 144.223 36.6971C144.223 25.4471 155.295 20.4917 166.545 20.4917C166.946 20.4917 167.348 20.4917 167.75 20.4917C171.723 20.4917 177.438 21.6971 181.009 22.6792L184.179 30.4024L187.75 39.2863L197.259 62.9917L198.464 66.7417L199.67 62.9917L211.946 32.7238C214.134 24.4203 223.196 20.8488 232.884 20.8488C237.839 20.8488 241.366 21.4292 245.741 23.0363V32.1881C240.384 28.2149 236.634 26.0721 230.518 26.0721C225.161 26.0721 218.866 28.4381 218.866 36.3399C218.688 42.2774 222.214 43.2596 232.705 48.3935C241.188 52.1435 249.134 56.1167 249.134 65.581C249.134 81.3846 233.509 84.1524 226.009 84.1524C219.268 84.1524 212.973 82.5899 209.58 79.5989V69.1078L210.161 69.5096C216.277 75.2238 221.813 78.2149 228.732 78.2149C235.652 78.2149 241.768 74.8667 241.768 68.3488C241.768 62.8131 237.036 59.6435 228.33 56.0721C220.027 52.5006 214.67 50.1346 212.527 44.1971C209.179 52.3221 193.554 90.4471 189.804 98.5721H181.5L183.464 94.8221L185.25 91.4738V91.2953C187.438 87.1435 190.384 80.6256 193.152 74.2863L176.946 35.1346C176.768 34.956 176.545 34.331 175.964 33.1703C174.759 30.4024 173.598 27.6346 170.027 26.4292C168.241 25.8488 166.054 25.4471 163.911 25.4471C158.554 25.4471 151.857 27.8131 151.857 35.7149C151.679 41.6524 155.607 42.6346 166.098 47.7685C174.58 51.5185 182.527 55.4917 182.527 64.956C182.527 80.7596 166.902 83.5274 159.402 83.5274C153.464 83.5274 147.75 82.1435 144.179 79.956L144.045 70.1346ZM28.7768 21.2953L28.9554 28.2149V28.6167C29.1339 28.4381 29.1339 28.0363 29.3571 27.8131C32.9286 24.0631 37.2589 20.3131 47.75 20.3131C57.8393 20.3131 64.1786 28.7953 64.5357 34.1524V71.9203V72.0988V81.6078H56.0536V70.3578V38.1256C56.0536 31.3846 50.1161 26.6524 43.0179 26.6524C37.0804 26.6524 29.3571 32.0096 29.1786 37.5453V72.1435V72.3221V81.6078H20.4732V72.0988V29.1971V21.2953H22.0357H26.7679H28.7768Z" fill="#3781C2"/>
</svg>
          );
          case 'LinkedIn':
          return (
          <svg width="250" height="100" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M229.143 62.5415C228.428 62.5484 227.744 62.8382 227.242 63.3475C226.74 63.8569 226.46 64.5444 226.464 65.2596C226.467 65.9748 226.754 66.6595 227.261 67.164C227.768 67.6685 228.454 67.9518 229.169 67.9518C229.884 67.9518 230.57 67.6685 231.077 67.164C231.584 66.6595 231.871 65.9748 231.874 65.2596C231.878 64.5444 231.598 63.8569 231.096 63.3475C230.593 62.8382 229.91 62.5484 229.195 62.5415H229.143ZM229.143 67.6421C228.674 67.6499 228.213 67.5184 227.819 67.2643C227.424 67.0101 227.114 66.6448 226.927 66.2144C226.741 65.784 226.686 65.3079 226.77 64.8463C226.853 64.3847 227.072 63.9583 227.398 63.6211C227.725 63.2839 228.143 63.051 228.602 62.9518C229.061 62.8526 229.538 62.8916 229.975 63.0639C230.411 63.2362 230.786 63.534 231.054 63.9197C231.321 64.3054 231.467 64.7617 231.475 65.2308V65.2706C231.488 65.8859 231.257 66.4813 230.831 66.9258C230.405 67.3703 229.82 67.6275 229.205 67.6408H229.144M218.759 61.8024H212.88V52.5969C212.88 50.4017 212.841 47.5759 209.823 47.5759C206.762 47.5759 206.293 49.9676 206.293 52.4371V61.8018H200.415V42.8715H206.058V45.4585H206.137C206.702 44.4929 207.518 43.6986 208.498 43.1601C209.479 42.6216 210.587 42.3592 211.705 42.4006C217.663 42.4006 218.761 46.3195 218.761 51.4176L218.759 61.8024ZM193.782 40.2839C193.108 40.284 192.448 40.0841 191.887 39.7093C191.326 39.3346 190.889 38.8019 190.631 38.1787C190.372 37.5554 190.305 36.8695 190.436 36.2078C190.568 35.5461 190.892 34.9382 191.369 34.461C191.846 33.9839 192.454 33.6589 193.116 33.5271C193.777 33.3954 194.463 33.4628 195.087 33.7209C195.71 33.979 196.243 34.4161 196.618 34.977C196.993 35.5379 197.193 36.1974 197.193 36.8721C197.193 37.32 197.105 37.7636 196.934 38.1775C196.762 38.5914 196.511 38.9675 196.194 39.2843C195.878 39.6011 195.502 39.8525 195.088 40.024C194.674 40.1955 194.23 40.2838 193.782 40.2839ZM196.722 61.8024H190.837V42.8715H196.722V61.8024ZM221.689 28.0027H187.883C187.116 27.994 186.377 28.2904 185.828 28.8265C185.279 29.3627 184.965 30.0949 184.956 30.8622V64.8083C184.965 65.5759 185.278 66.3086 185.827 66.8454C186.376 67.3821 187.116 67.679 187.883 67.6708H221.689C222.458 67.6805 223.2 67.3844 223.751 66.8477C224.302 66.311 224.618 65.5775 224.628 64.8083V30.8598C224.617 30.0909 224.302 29.3579 223.751 28.8218C223.199 28.2856 222.458 27.9901 221.689 28.0003M168.957 47.4406C166.018 47.4406 164.254 49.4031 164.254 52.2626C164.254 55.1221 166.017 57.0864 168.957 57.0864C171.896 57.0864 173.664 55.127 173.664 52.2626C173.664 49.3982 171.9 47.4406 168.957 47.4406ZM179.075 61.7914H173.664V59.2809H173.583C172.904 60.1941 172.024 60.9381 171.01 61.4552C169.997 61.9722 168.877 62.2482 167.739 62.2617C162.092 62.2617 158.371 58.1855 158.371 52.4212C158.371 47.1271 161.664 42.2659 167.076 42.2659C169.508 42.2659 171.781 42.9315 173.114 44.7764H173.191V33.8644H179.075L179.075 61.7914ZM150.824 50.128C150.835 49.6511 150.749 49.1769 150.572 48.7341C150.394 48.2913 150.129 47.8891 149.792 47.5519C149.454 47.2147 149.052 46.9495 148.609 46.7724C148.166 46.5953 147.692 46.5099 147.215 46.5215C146.188 46.4576 145.177 46.7999 144.4 47.4745C143.623 48.1492 143.142 49.1022 143.061 50.128H150.824ZM155.803 58.5167C154.826 59.7013 153.598 60.6537 152.208 61.3051C150.818 61.9565 149.3 62.2906 147.765 62.2831C141.886 62.2831 137.18 58.3594 137.18 52.2834C137.18 46.2074 141.886 42.2855 147.765 42.2855C153.259 42.2855 156.704 46.2043 156.704 52.2834V54.1265H143.061C143.231 55.1717 143.773 56.1204 144.587 56.7976C145.401 57.4749 146.432 57.8351 147.491 57.812C148.328 57.8068 149.15 57.5924 149.882 57.1884C150.615 56.7843 151.235 56.2035 151.686 55.4986L155.803 58.5167ZM97.3675 42.8666H103.012V45.4536H103.093C103.656 44.4876 104.472 43.6929 105.452 43.1544C106.433 42.6158 107.541 42.3536 108.659 42.3957C114.619 42.3957 115.717 46.3176 115.717 51.4127V61.7938H109.839V52.5902C109.839 50.3932 109.798 47.5692 106.777 47.5692C103.722 47.5692 103.25 49.9615 103.25 52.4303V61.7914H97.3718L97.3675 42.8666ZM118.697 33.8662H124.576V50.561L131.238 42.8562H138.445L130.729 51.6203L138.282 61.803H130.894L124.654 52.4457H124.577V61.8018H118.699L118.697 33.8662ZM88.23 42.8648H94.1082V61.7951H88.23V42.8648ZM91.1691 33.4535C91.8435 33.4536 92.5027 33.6537 93.0634 34.0285C93.6241 34.4033 94.0611 34.9359 94.319 35.559C94.577 36.1821 94.6445 36.8677 94.5128 37.5291C94.3812 38.1906 94.0564 38.7981 93.5795 39.2749C93.1026 39.7518 92.4949 40.0765 91.8335 40.208C91.172 40.3395 90.4864 40.272 89.8634 40.0138C89.2403 39.7557 88.7078 39.3187 88.3331 38.7579C87.9585 38.1972 87.7585 37.5379 87.7585 36.8635C87.7585 36.4156 87.8467 35.9722 88.0181 35.5584C88.1895 35.1447 88.4408 34.7687 88.7575 34.4521C89.0742 34.1354 89.4502 33.8842 89.864 33.7129C90.2777 33.5416 90.7212 33.4534 91.1691 33.4535ZM68.0781 33.8705H74.197V56.1587H85.5248V61.8055H68.0781V33.8705ZM229.572 65.4181C229.673 65.4191 229.773 65.3994 229.865 65.3603C229.958 65.3211 230.042 65.2633 230.111 65.1904C230.181 65.1176 230.234 65.0312 230.269 64.9367C230.304 64.8422 230.319 64.7416 230.313 64.6411C230.313 64.09 229.981 63.8267 229.298 63.8267H228.196V66.7119H228.611V65.4543H229.12L229.132 65.4696L229.922 66.7119H230.366L229.515 65.4261L229.572 65.4181ZM229.093 65.1291H228.612V64.1537H229.221C229.536 64.1537 229.895 64.2051 229.895 64.6172C229.895 65.0912 229.532 65.1291 229.09 65.1291" fill="#2867B2"/>
</svg>
          );
          case 'Zoho':
          return (
          <svg width="120" height="80" viewBox="0 0 228 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clipPath="url(#clip0_1502_2820)">
<path d="M101.798 78.4441C100.086 78.4441 98.3531 78.0886 96.6864 77.3552L61.1308 61.5108C54.7753 58.6886 51.9086 51.1997 54.7308 44.8441L70.5753 9.28856C73.3975 2.93301 80.8864 0.0663414 87.242 2.88856L122.798 18.733C129.153 21.5552 132.02 29.0441 129.198 35.3997L113.353 70.9552C111.242 75.6663 106.62 78.4441 101.798 78.4441ZM99.642 70.6886C102.331 71.8886 105.486 70.6663 106.686 67.9997L122.531 32.4441C123.731 29.7552 122.509 26.5997 119.842 25.3997L84.2642 9.55523C81.5753 8.35523 78.4197 9.57745 77.2197 12.2441L61.3753 47.7997C60.1753 50.4886 61.3975 53.6441 64.0642 54.8441L99.642 70.6886Z" fill="#089949"/>
<path d="M213.333 78.4664H174.4C167.444 78.4664 161.777 72.7997 161.777 65.8441V26.9108C161.777 19.9552 167.444 14.2886 174.4 14.2886H213.333C220.288 14.2886 225.955 19.9552 225.955 26.9108V65.8441C225.955 72.7997 220.288 78.4664 213.333 78.4664ZM174.4 21.5775C171.466 21.5775 169.066 23.9775 169.066 26.9108V65.8441C169.066 68.7775 171.466 71.1775 174.4 71.1775H213.333C216.266 71.1775 218.666 68.7775 218.666 65.8441V26.9108C218.666 23.9775 216.266 21.5775 213.333 21.5775H174.4Z" fill="#F9B21D"/>
<path d="M67.5325 34.0444L62.2881 45.7777C62.2214 45.9111 62.1547 46.0222 62.0881 46.1333L64.1325 58.7555C64.5992 61.6666 62.6214 64.4 59.7325 64.8666L21.2881 71.0888C19.8881 71.3111 18.4658 70.9777 17.3103 70.1555C16.1547 69.3333 15.3992 68.0889 15.1769 66.6888L8.95472 28.2444C8.7325 26.8444 9.06583 25.4222 9.88805 24.2666C10.7103 23.1111 11.9547 22.3555 13.3547 22.1333L51.7992 15.9111C52.0881 15.8666 52.3769 15.8444 52.6436 15.8444C55.1992 15.8444 57.4881 17.7111 57.9103 20.3333L59.9769 33.0444L65.3992 20.8888L65.1103 19.1777C63.9992 12.3111 57.5103 7.62218 50.6436 8.73329L12.1992 14.9555C8.88805 15.4666 5.95472 17.2666 3.99916 20C2.02138 22.7333 1.24361 26.0666 1.77694 29.4L7.99916 67.8444C8.5325 71.1777 10.3325 74.0888 13.0658 76.0666C15.2214 77.6444 17.7769 78.4444 20.4214 78.4444C21.0881 78.4444 21.7769 78.4 22.4658 78.2888L60.9103 72.0666C67.7769 70.9555 72.4658 64.4666 71.3547 57.6L67.5325 34.0444Z" fill="#E42527"/>
<path d="M113.646 52.3998L119.29 39.7553L117.69 27.9998C117.49 26.5998 117.868 25.1998 118.735 24.0664C119.601 22.9331 120.846 22.1998 122.268 22.022L160.846 16.7775C161.09 16.7553 161.335 16.7331 161.579 16.7331C162.735 16.7331 163.846 17.1109 164.801 17.822C164.979 17.9553 165.135 18.1109 165.29 18.2442C167.001 16.4442 169.246 15.1553 171.757 14.5998C171.046 13.622 170.201 12.7553 169.201 11.9998C166.512 9.95531 163.201 9.08864 159.868 9.53309L121.246 14.7775C117.912 15.222 114.935 16.9553 112.912 19.6442C110.868 22.3331 110.001 25.6442 110.446 28.9775L113.646 52.3998Z" fill="#226DB4"/>
<path d="M179.287 58.911L174.22 21.5776C171.376 21.6665 169.087 24.0221 169.087 26.8887V37.8443L172.087 59.8887C172.287 61.2887 171.909 62.6887 171.042 63.8221C170.176 64.9554 168.931 65.6887 167.509 65.8665L128.931 71.111C127.531 71.311 126.131 70.9332 124.998 70.0665C123.865 69.1999 123.131 67.9554 122.953 66.5332L121.176 53.4443L115.531 66.0887L115.731 67.511C116.176 70.8443 117.909 73.8221 120.598 75.8443C122.82 77.5332 125.465 78.4221 128.22 78.4221C128.798 78.4221 129.376 78.3776 129.953 78.311L168.487 73.111C171.82 72.6665 174.798 70.9332 176.82 68.2443C178.865 65.5554 179.731 62.2443 179.287 58.911Z" fill="#226DB4"/>
<path d="M70.4437 96.9334L75.9548 88.8H71.4214C71.177 88.8 70.977 88.6 70.977 88.3556V87.2667C70.977 87.0223 71.177 86.8223 71.4214 86.8223H78.8659C79.1103 86.8223 79.3103 87.0223 79.3103 87.2667V87.6889C79.3103 87.7778 79.2881 87.8667 79.2437 87.9334L73.8437 96.0667H78.6881C78.9326 96.0667 79.1326 96.2667 79.1326 96.5111V97.6C79.1326 97.8445 78.9326 98.0445 78.6881 98.0445H70.8214C70.577 98.0445 70.377 97.8445 70.377 97.6V97.2C70.3548 97.0889 70.3992 97 70.4437 96.9334Z" fill="black"/>
<path d="M93.6445 92.3554C93.6445 89.0221 96.089 86.6221 99.4223 86.6221C102.867 86.6221 105.2 88.9776 105.2 92.3776C105.2 95.8221 102.822 98.1998 99.3779 98.1998C95.9112 98.1998 93.6445 95.8221 93.6445 92.3554ZM102.556 92.3998C102.556 90.3776 101.578 88.6443 99.3779 88.6443C97.1556 88.6443 96.3112 90.4443 96.3112 92.4887C96.3112 94.4221 97.3556 96.1998 99.489 96.1998C101.689 96.1776 102.556 94.2887 102.556 92.3998Z" fill="black"/>
<path d="M120.998 86.7998H122.643C122.887 86.7998 123.087 86.9998 123.087 87.2442V91.3776H127.754V87.2442C127.754 86.9998 127.954 86.7998 128.198 86.7998H129.843C130.087 86.7998 130.287 86.9998 130.287 87.2442V97.5776C130.287 97.822 130.087 98.022 129.843 98.022H128.22C127.976 98.022 127.776 97.822 127.776 97.5776V93.3998H123.109V97.5776C123.109 97.822 122.909 98.022 122.665 98.022H121.02C120.776 98.022 120.576 97.822 120.576 97.5776V87.2442C120.554 86.9998 120.754 86.7998 120.998 86.7998Z" fill="black"/>
<path d="M145.645 92.3554C145.645 89.0221 148.089 86.6221 151.422 86.6221C154.867 86.6221 157.2 88.9776 157.2 92.3776C157.2 95.8221 154.822 98.1998 151.378 98.1998C147.911 98.1998 145.645 95.8221 145.645 92.3554ZM154.533 92.3998C154.533 90.3776 153.556 88.6443 151.356 88.6443C149.133 88.6443 148.289 90.4443 148.289 92.4887C148.289 94.4221 149.333 96.1998 151.467 96.1998C153.667 96.1776 154.533 94.2887 154.533 92.3998Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_1502_2820">
<rect width="228" height="100" fill="white"/>
</clipPath>
</defs>
</svg>
          );
    }
  };

  const handleInstructionsAcknowledge = () => {
    setInstructionsAcknowledged(true);
    setJoinError('');
    setShowCandidateInstructionsModal(false);
  };

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
      case 'integrity':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      case 'history':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
            <path d="M12 7v5l3 2" />
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
      boxShadow: '0 12px 12px rgba(0, 0, 0, 0.24)',
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
              Evaluation Rubric - Weighted Score 8.2/10
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

      case 'integrity': {
        const integrityEvents = [
          ['Tab focus changed', 'Medium'],
          ['Network unstable detected', 'Low'],
          ['Camera stream recovered', 'Info'],
          ['Window refocused', 'Low'],
          ['Audio device re-enabled', 'Info'],
        ];

        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.78rem', display: 'grid', gap: '0.55rem' }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.66rem', color: 'rgba(226, 236, 255, 0.93)' }}>Live Integrity Stream</span>
              <span style={{ fontSize: '0.62rem', color: 'rgba(170, 239, 192, 0.95)' }}>Candidate active</span>
            </div>
            <div
              style={{
                height: '92px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.4rem 0.45rem',
              }}
            >
              <motion.div
                animate={{ y: [0, -52, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'grid', gap: '0.34rem' }}
              >
                {integrityEvents.map(([eventLabel, level]) => (
                  <div key={`${feature.id}-${eventLabel}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.64rem', color: 'rgba(228, 236, 252, 0.9)' }}>{eventLabel}</span>
                    <span
                      style={{
                        fontSize: '0.61rem',
                        color: level === 'Medium' ? 'rgba(255, 191, 132, 0.95)' : 'rgba(162, 225, 255, 0.95)',
                      }}
                    >
                      {level}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.16 }}
              style={{
                borderRadius: '8px',
                border: '1px solid rgba(113, 168, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'rgba(234, 241, 255, 0.95)',
                fontSize: '0.66rem',
                padding: '0.35rem 0.5rem',
                textAlign: 'center',
              }}
            >
              Monitor score updates in realtime for interviewers
            </motion.div>
          </motion.div>
        );
      }

      case 'history': {
        const historyRows = [
          '01:41 PM  Added hashmap approach',
          '01:47 PM  Optimized loop condition',
          '01:55 PM  Edge case fix for empty list',
          '02:04 PM  Final complexity notes',
          '02:11 PM  Submitted evaluated version',
        ];

        return (
          <motion.div
            style={{ ...panelStyle, padding: '0.78rem', display: 'grid', gap: '0.52rem' }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div style={{ fontSize: '0.66rem', color: 'rgba(226, 236, 255, 0.93)' }}>Replay Timeline Preview</div>
            <div
              style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.42rem 0.48rem',
                overflow: 'hidden',
                height: '145px',
              }}
            >
              <motion.div
                
                style={{ display: 'grid', gap: '0.54rem' }}
              >
                {historyRows.map((historyLine) => (
                  <div key={`${feature.id}-${historyLine}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(162, 226, 255, 0.9)' }} />
                    <span style={{ fontSize: '0.63rem', color: 'rgba(220, 231, 252, 0.9)' }}>{historyLine}</span>
                  </div>
                ))}
              </motion.div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['Snapshots', 'Runs', 'Report'].map((tag) => (
                <span
                  key={`${feature.id}-${tag}`}
                  style={{
                    padding: '0.18rem 0.42rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(226, 236, 255, 0.92)',
                    fontSize: '0.62rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        );
      }

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
      backdropFilter: "blur(20px) saturate(140%)",
      WebkitBackdropFilter: "blur(20px) saturate(140%)",
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
              <span style={{ color: "rgba(242, 248, 255, 0.98)", fontSize: "0.86rem", fontWeight: 650, letterSpacing: "0.08em" }}>P2N1ZA</span>
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
              techify.com/join?room=P2N1ZA&invite=...
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

  const isUserAuthenticated = isAuthenticated();
  const headerShellWidth = "calc(100% - 2rem)";
  const headerShellRadius = "22px";
  const mainTopPadding = isMobileView ? "8rem" : "4rem";
  const landingSectionGap = isMobileView ? "3rem" : "5rem";
  const landingTitleToSubtitleGap = isMobileView ? "0.65rem" : "0.7rem";
  const landingSubtitleToContentGap = isMobileView ? "1.8rem" : "4rem";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
        linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.56)),
        url('/backgroundhd.webp')
      `,
        backgroundSize: "150%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      {isUserAuthenticated ? (
        <div
          style={{
            position: "fixed",
            top: isMobileView ? "0.9rem" : "1rem",
            right: isMobileView ? "1rem" : "1.25rem",
            display: "flex",
            zIndex: 3,
            alignItems: "center",
            justifyContent: "flex-end",
            gap: isMobileView ? "0.6rem" : "0.85rem",
            minWidth: 0,
            animation: "slideDown 0.4s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: isMobileView ? "0.6rem" : "0.85rem",
              minWidth: 0,
            }}
          >
            <span
              style={{
                color: "hsl(var(--muted-foreground))",
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: isMobileView ? "40vw" : "18rem",
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
          </div>
        </div>
      ) : (
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
          <>
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
          </>
        </header>
      )}

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
              marginTop: window.innerWidth <= 768 ? "2rem" : "2rem",
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
              animation: 'blurIn 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              opacity: 0,
              marginBottom: window.innerWidth <= 768 ? "0rem" : "-1.7rem",
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
                  placeholder="paste invite link here..."
                  autoComplete="off"
                />
                
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCandidateInstructionsModal(true)}
                  className="action-btn save-btn"
                  style={{ width: "100%" }}
                >
                  {instructionsAcknowledged ? "Review Instructions" : "Read Important Instructions"}
                </button>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: instructionsAcknowledged ? "hsl(142 76% 36%)" : "hsl(var(--muted-foreground))",
                    textAlign: "left",
                  }}
                >
                  {instructionsAcknowledged
                    ? "Instructions acknowledged. You can join the interview."
                    : "You must read and acknowledge instructions before joining."}
                </div>
              </div>

              <button
                type="submit"
                disabled={room.length !== 6 || joining || !inviteToken || !instructionsAcknowledged}
                className={`action-btn run-btn ${room.length !== 6 || joining || !inviteToken || !instructionsAcknowledged ? "disabled" : ""
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
              ref={heroVideoSectionRef}
              className="hero-video-showcase"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="hero-video-showcase__card"
                style={{
                  opacity: heroVideoOpacity,
                }}
              >
                <span className="hero-video-showcase__aura" aria-hidden="true" />
                <div className="hero-video-showcase__frame">
                  <span className="hero-video-showcase__liquid-border" aria-hidden="true" />
                  <div className="hero-video-showcase__screen">
                    {!isHeroVideoUnavailable ? (
                      <video
                        src={landingHeroVideoSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="hero-video-showcase__video"
                        onError={() => setIsHeroVideoUnavailable(true)}
                      />
                    ) : (
                      <div
                        className="hero-video-showcase__fallback"
                        role="img"
                        aria-label="Techify video preview unavailable"
                      >
                        <p className="hero-video-showcase__fallback-kicker">Techify Demo Preview</p>
                        <h3>Drop video.mp4 in frontend/public to enable this video.</h3>
                      </div>
                    )}
                    <span className="hero-video-showcase__overlay" aria-hidden="true" />
                  </div>
                </div>
              </motion.div>
            </motion.section>

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
                <div style={{ position: "relative", width: "14px", height: "14px", display: "inline-block" }}>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #00b7ff 0%, transparent 70%)",
                    animation: "ringExpand 1s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                  }}
              />
                <span
                  style={{
                   position: "absolute",
                   inset: "3px",
                   borderRadius: "50%",
                   background: "#0099ff",
                   boxShadow: "0 0 10px rgba(0, 26, 255, 0.6)",
                  }}
              />
                </div>                  
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
                    margin: `0 0 ${landingTitleToSubtitleGap} 0`,
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
                    margin: `0 auto ${landingSubtitleToContentGap} auto`,
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
                  Equipped with most advanced features, Techify is designed to make technical interviews more efficient, engaging, and insightful for both interviewers and candidates.
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
                margin: `${landingSectionGap} auto 0`,
                textAlign: "left",
                paddingTop: "0",
              }}
            >
              <motion.h3
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  margin: `0 0 ${landingTitleToSubtitleGap} 0`,
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
                How <span style={{  fontFamily: "Google Sans" , letterSpacing:"-0.05em"}}>Techify</span> Works?
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  margin: `0 auto ${landingSubtitleToContentGap} auto`,
                  maxWidth: "760px",
                  textAlign: "center",
                  fontSize: window.innerWidth <= 768 ? "0.88rem" : "0.96rem",
                  lineHeight: 1.62,
                  color: "rgba(214, 227, 248, 0.9)",
                  letterSpacing: "-0.01em",
                }}
              >
                A clean 4-step flow from room creation to final decision.
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
                margin: `${landingSectionGap} auto 0`,
                paddingTop: "0",
                textAlign: "center",
              }}
            >
              <motion.h3
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.62, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  margin: `0 0 ${landingSubtitleToContentGap} 0`,
                  paddingBottom: "0",
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
                        backdropFilter: "blur(25px) saturate(145%)",
                        WebkitBackdropFilter: "blur(25px) saturate(145%)",
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

            <motion.section
              initial={{ opacity: 0, y: 32, filter: "blur(7px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: "1120px",
                margin: `${landingSectionGap} auto 0`,
                textAlign: "center",
                alignItems: "center",
                alignContent: "center",

              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
                style={{
                  display: "grid",
                  justifyItems: "center",
                  textAlign: "center",
                  gap: "0.6rem",
                  marginBottom: landingSubtitleToContentGap,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize:
                        window.innerWidth <= 480
                          ? "clamp(1.35rem, 7vw, 1.75rem)"
                          : window.innerWidth <= 768
                            ? "clamp(1.55rem, 5vw, 2.05rem)"
                            : "clamp(1.9rem, 3.6vw, 3rem)",
                      lineHeight: 1.14,
                      letterSpacing: "-0.04em",
                      color: "rgba(246, 250, 255, 0.98)",
                      fontWeight: 700,
                      fontFamily: "'Familjen Grotesk', sans-serif",
                      textAlign: window.innerWidth <= 768 ? "center" : "center",
                      alignItems: window.innerWidth <= 768 ? "center" : "center",
                    }}
                  >
                    Trusted by hiring teams at leading tech companies
                  </h3>
                  <p
                    style={{
                      margin: "0.35rem auto 0",
                      fontSize: window.innerWidth <= 768 ? "0.84rem" : "0.92rem",
                      lineHeight: 1.6,
                      color: "rgba(214, 227, 248, 0.9)",
                      letterSpacing: "-0.01em",
                      maxWidth: "760px",
                    }}
                  >
                    Real interviewers. Real teams. Real outcomes.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.54, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "relative",
                  borderRadius: "22px",
                  borderTop: "2px solid rgba(255, 255, 255, 0.2)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 30px 84px -58px rgba(0, 0, 0, 0.9)",
                  padding: window.innerWidth <= 768 ? "1rem 0.4rem" : "1.2rem 0.65rem",
                  overflow: "hidden",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    width: "100%",
                    WebkitMaskImage:
                      window.innerWidth <= 768
                        ? "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
                        : "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                    maskImage:
                      window.innerWidth <= 768
                        ? "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)"
                        : "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
                  }}
                >
                  <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 24, ease: "linear", repeat: Infinity, repeatType: "loop" }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: window.innerWidth <= 768 ? "0.9rem" : "1.1rem",
                      width: "max-content",
                      willChange: "transform",
                    }}
                  >
                    {[...featuredCompanyLogos, ...featuredCompanyLogos].map((company, index) => (
                      <div
                        key={`${company.id}-${index}`}
                        style={{
                          minWidth: window.innerWidth <= 768 ? "184px" : "224px",
                          height: window.innerWidth <= 768 ? "84px" : "106px",
                          borderRadius: "16px",
                          border: "1px solid rgba(255, 255, 255, 0.18)",
                          background: "rgba(255, 255, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0.7rem 0.82rem",
                          boxShadow:
                            "inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 12px 22px -18px rgba(0, 0, 0, 0.55)",
                        }}
                      >
                        <div
                          style={{
                            transform: window.innerWidth <= 768 ? "scale(1.24)" : "scale(1.34)",
                            transformOrigin: "center",
                            filter: "grayscale(1) brightness(0)",
                            opacity: 1,
                          }}
                        >
                          {renderCompanyWordmark(company.id)}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>

            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 34, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                maxWidth: "1120px",
                margin: `${landingSectionGap} auto 0`,
              }}
            >
              <motion.article
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                style={{
                  borderRadius: "28px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background:
                    "linear-gradient(150deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03) 45%, rgba(9, 18, 31, 0.55) 100%)",
                  backdropFilter: "blur(26px) saturate(145%)",
                  WebkitBackdropFilter: "blur(26px) saturate(145%)",
                  boxShadow: "0 42px 94px -62px rgba(0, 0, 0, 0.96), inset 0 1px 0 rgba(255, 255, 255, 0.24)",
                  padding:
                    window.innerWidth <= 480
                      ? "1.2rem 1rem"
                      : window.innerWidth <= 768
                        ? "1.45rem 1.2rem"
                        : "1.9rem 1.8rem",
                  position: "relative",
                  overflow: "hidden",
                  textAlign: "left",
                }}
              >
                <motion.div
                  aria-hidden="true"
                  initial={{ x: "-50%", opacity: 0 }}
                  whileInView={{ x: "140%", opacity: [0, 0.45, 0] }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.25, delay: 0.28, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "42%",
                    height: "2px",
                    background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(152, 220, 255, 0.9), rgba(255,255,255,0))",
                    filter: "blur(0.2px)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "-70px",
                    right: "-56px",
                    width: "176px",
                    height: "176px",
                    borderRadius: "999px",
                    background: "radial-gradient(circle, rgba(89, 190, 255, 0.42), rgba(255,255,255,0))",
                    filter: "blur(28px)",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: window.innerWidth <= 960 ? "1fr" : "1.3fr 0.9fr",
                    gap: window.innerWidth <= 960 ? "1rem" : "1.3rem",
                    alignItems: "stretch",
                  }}
                >
                  <div>
                    <motion.h3
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.48, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        margin: "0.72rem 0 0.45rem 0",
                        fontSize:
                          window.innerWidth <= 480
                            ? "clamp(1.22rem, 7vw, 1.55rem)"
                            : window.innerWidth <= 768
                              ? "clamp(1.35rem, 5vw, 1.85rem)"
                              : "clamp(1.7rem, 3.4vw, 2.35rem)",
                        lineHeight: 1.12,
                        letterSpacing: "-0.04em",
                        color: "rgba(246, 250, 255, 0.99)",
                        fontWeight: 700,
                      }}
                    >
                      Empower your hiring process with structured technical interviews now.
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.44, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        margin: "0 0 0.8rem 0",
                        fontSize: window.innerWidth <= 768 ? "0.84rem" : "0.92rem",
                        lineHeight: 1.62,
                        color: "rgba(214, 227, 248, 0.92)",
                        letterSpacing: "-0.01em",
                        maxWidth: "740px",
                      }}
                    >
                      Move from messed up hiring systems to a structured interview workflow with techify.
                    </motion.p>

                    <div style={{ display: "grid", gap: "0.32rem" }}>
                      {landingCtaHighlights.map((highlight, idx) => (
                        <motion.div
                          key={highlight}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.55 }}
                          transition={{ duration: 0.32, delay: 0.24 + idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                          style={{ display: "flex", alignItems: "center", gap: "0.38rem" }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(162, 226, 255, 0.95)" }} />
                          <span style={{ fontSize: "0.75rem", color: "rgba(220, 231, 252, 0.92)" }}>{highlight}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ duration: 0.48, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "grid",
                      gap: "0.7rem",
                      justifyItems: "stretch",
                      alignContent: "center",
                      background: "rgba(5, 12, 21, 0.42)",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      borderRadius: "18px",
                      backdropFilter: "blur(22px) saturate(145%)",
                      WebkitBackdropFilter: "blur(22px) saturate(145%)",
                      padding: window.innerWidth <= 960 ? "0.9rem" : "1rem",
                    }}
                  >
                    <Link
                      to="/register"
                      className="action-btn run-btn"
                      style={{
                        textDecoration: "none",
                        fontSize: "0.82rem",
                        padding: "0.68rem 1.06rem",
                        minHeight: "unset",
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      Get Started for Free
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
                        textDecoration: "none",
                        fontSize: "0.82rem",
                        padding: "0.68rem 1.06rem",
                        minHeight: "unset",
                        width: "100%",
                        textAlign: "center",
                        color: "rgba(240, 246, 255, 0.95)",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                      }}
                    >
                      Log in to Dashboard
                    </Link>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "rgba(196, 214, 242, 0.86)",
                        textAlign: "center",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      No setup overhead. Start with your first room instantly.
                    </span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.45 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    marginTop: "1rem",
                    display: "grid",
                    gridTemplateColumns:
                      window.innerWidth <= 768
                        ? "1fr"
                        : "repeat(3, minmax(0, 1fr))",
                    gap: "0.58rem",
                  }}
                >
                  {landingCtaStats.map((stat, statIndex) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.65 }}
                      transition={{ duration: 0.36, delay: 0.36 + statIndex * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        background: "rgba(255, 255, 255, 0.04)",
                        backdropFilter: "blur(20px) saturate(140%)",
                        WebkitBackdropFilter: "blur(20px) saturate(140%)",
                        padding: "0.6rem 0.7rem",
                        display: "grid",
                        gap: "0.18rem",
                      }}
                    >
                      <span style={{ fontSize: "0.66rem", color: "rgba(186, 206, 238, 0.92)" }}>{stat.label}</span>
                      <span style={{ fontSize: "0.78rem", color: "rgba(240, 247, 255, 0.99)", fontWeight: 620 }}>
                        {stat.value}
                      </span>
                      <span style={{ fontSize: "0.64rem", color: "rgba(178, 200, 234, 0.86)" }}>{stat.note}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.article>
            </motion.section>

          </div>
        )}
      </main>

      {isAuthenticated() ? (
        <footer
          
          style={{
            textAlign: "center",
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
              color: "gray",
              margin: 0,
              fontWeight: "500",
              letterSpacing: "-0.05em",
            }}
          >
            Cooked by <a href="https://x.com/Uday_Code" target="_blank" rel="noopener noreferrer" style={{textDecoration:"none", color: "white"}}> Uday Savaliya</a>
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
            marginTop: landingSectionGap,
            padding: window.innerWidth <= 768 ? "0 0.9rem 1rem" : "0 1.2rem 1.2rem",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "24px",
              background:
                "linear-gradient(150deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03) 45%, rgba(8, 15, 28, 0.55) 100%)",
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
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "18px",
                  background: "rgba(255, 255, 255, 0.04)",
                  backdropFilter: "blur(18px) saturate(140%)",
                  WebkitBackdropFilter: "blur(18px) saturate(140%)",
                  padding: window.innerWidth <= 768 ? "0.8rem" : "0.95rem",
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
                  Accelerate your interview process.
                  <br />
                  Hire with confidence.
                </motion.h3>
                <motion.a
                  href="https://x.com/Uday_Code"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
                  className="chef-signature-link"
                  style={{ marginTop: "0.78rem" }}
                >
                  <span className="chef-signature-flame" aria-hidden="true">
                    <svg viewBox="0 0 2200 2200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="chefFlameGradient" gradientUnits="userSpaceOnUse" x1="1100" y1="382.6557" x2="1100" y2="1862.5167">
                          <stop offset="0" stopColor="#FF7B08" />
                          <stop offset="1" stopColor="#CF0606" />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#chefFlameGradient)"
                        d="M1609.63,1647.19c-32.78,66.09-132.68,186.33-297.78,259.49c224.61-184.25-101.99-395.33,39.42-503.87c-36.96-8.21-78.06,17.83-86.41,54.75c-5.33,23.58,1.34,48.01,2.44,72.15c1.55,34.06-8.92,69.33-32.23,94.2c-23.31,24.87-60.09,37.73-92.98,28.76c-32.88-8.98-58.93-41.52-56.69-75.53c1.89-28.72,21.35-52.67,35.64-77.65c32.7-57.18,39.59-128.49,18.45-190.87c-21.15-62.39-69.98-114.81-130.71-140.32c41.52,95.21,30.37,211.49-28.47,297.08c-42.66,62.06-107.94,108.36-139.38,176.79c-23.72,51.62-25.21,113.02-4.01,165.72c13.5,33.56,36.06,63.29,64.32,85.84c-99.9-34-199.11-101.49-257.79-186.93c-60.98-88.8-90.52-198.04-82.46-304.89c7.06-93.47,41.72-183.38,48.3-276.89c6.59-93.5-24.76-200.28-110.34-241.57c66.64-21.55,147.18,23.43,162.51,90.73c6.3,27.69,2.8,56.54,5.15,84.82c2.36,28.27,12.63,58.65,37.49,73.05c33.54,19.45,80.06-1.23,97.97-35.22c17.92-33.99,13.1-75.53,0.14-111.63c-12.96-36.1-33.38-69.24-46.68-105.21c-28.48-77.03-21.8-165.9,17.89-237.97c33.45-60.74,87.62-107.76,127.42-164.69c37.56-53.72,61.46-125.29,35.48-184.01c64.34,5.55,128.62,24.74,176.89,66.41c53.57,46.23,82.3,124.36,55.73,189.4c-17.93,43.91-56.84,75.58-85.67,113.44c-34.11,44.8-54.57,101.73-46.2,157.06c8.38,55.34,49.41,107.12,104.84,119.77c55.43,12.66,120.3-22.06,131.57-76.91c9.3-45.19-16.02-90.66-14.57-136.76c2.2-69.57,76.56-127.89,146.04-114.5c-35.01,2.52-59.8,39.27-58.89,73.77c0.91,34.5,21.22,65.7,44.85,91.22c23.62,25.53,51.28,47.53,72.24,75.21c44.81,59.16,53.84,141.18,28.34,210.54c-12.6,34.25-33.05,65.26-58.8,91.44c-28.56,29.03-12.05,78.25,28.72,83.18c0.63,0.08,1.26,0.14,1.89,0.2c26.13,2.26,50.57-13.61,68.27-32.65c17.71-19.03,31.08-41.73,49.65-59.96c31.02-30.45,76.2-46.38,119.83-42.25C1515.55,1174.85,1723.18,1418.16,1609.63,1647.19z"
                      />
                    </svg>
                  </span>
                  <span className="chef-signature-copy">
                    <span className="chef-signature-kicker">Cooked by</span>
                    <span className="chef-signature-name">Uday Savaliya</span>
                  </span>
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
                style={{
                  display: "grid",
                  gap: "0.45rem",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(16px) saturate(136%)",
                  WebkitBackdropFilter: "blur(16px) saturate(136%)",
                  padding: "0.72rem",
                }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
              >
                <p style={{ margin: 0, color: "rgba(236, 243, 255, 0.95)", fontSize: "0.82rem", fontWeight: 600 }}>
                  Product
                </p>
                <Link to="/register" style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}>
                  Create Account
                </Link>
                <Link to="/login" style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}>
                  Access Dashboard
                </Link>
              </motion.div>

              <motion.div
                style={{
                  display: "grid",
                  gap: "0.45rem",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(16px) saturate(136%)",
                  WebkitBackdropFilter: "blur(16px) saturate(136%)",
                  padding: "0.72rem",
                }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              >
                <p style={{ margin: 0, color: "rgba(236, 243, 255, 0.95)", fontSize: "0.82rem", fontWeight: 600 }}>
                  Socials
                </p>
                <a
                  href="https://x.com/Uday_Code"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(205, 220, 247, 0.92)"}
                >
                  Twitter
                </a>
                <a
                  href="https://github.com/Udaysavaliya04"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "rgba(205, 220, 247, 0.92)", textDecoration: "none", fontSize: "0.78rem" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(205, 220, 247, 0.92)"}
                >
                  GitHub
                </a>
                <button
                  type="button"
                  onClick={() => setShowFeedbackIssuesModal(true)}
                  style={{
                    color: "rgba(205, 220, 247, 0.92)",
                    textDecoration: "none",
                    fontSize: "0.78rem",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(205, 220, 247, 0.92)"}
                >
                  Feedback & Issues
                </button>
              </motion.div>

              <motion.div
                style={{
                  display: "grid",
                  gap: "0.45rem",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(16px) saturate(136%)",
                  WebkitBackdropFilter: "blur(16px) saturate(136%)",
                  padding: "0.72rem",
                }}
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
                © {new Date().getFullYear()} Techify | All rights reserved.
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

      {!isAuthenticated() && showFeedbackIssuesModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowFeedbackIssuesModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "36rem", marginTop: "4rem"}}
          >
            <button
              onClick={() => setShowFeedbackIssuesModal(false)}
              className="modal-close"
              aria-label="Close feedback and issues modal"
            >
              x
            </button>

            <div className="modal-header" style={{ textAlign: "center", marginBottom: "0.9rem" }}>
              <h3 className="modal-title">Feedback & Issues</h3>
              <p className="modal-description" style={{ marginTop: "0.35rem" }}>
                Share bugs, feature ideas, or product feedback with the Techify team.
              </p>
            </div>

            <div style={{ display: "grid", gap: "0.72rem" }}>
              {[
                {
                  title: "Report a Bug",
                  description: "Found something broken? Create a detailed issue so it can be fixed quickly.",
                  href: "https://github.com/Udaysavaliya04/techify/issues/new?template=bug_report.md",
                  cta: "Open Bug Report"
                },
                {
                  title: "Request a Feature",
                  description: "Suggest a workflow, UI, or interview feature you want in upcoming updates.",
                  href: "https://github.com/Udaysavaliya04/techify/issues/new?template=feature_request.md",
                  cta: "Open Feature Request"
                },
                {
                  title: "View All Feedback",
                  description: "Browse open issues, roadmap discussions, and status of submitted requests.",
                  href: "https://github.com/Udaysavaliya04/techify/issues",
                  cta: "Open Issues Board"
                }
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "calc(var(--radius) - 2px)",
                    background: "hsl(var(--muted) / 0.32)",
                    padding: "0.8rem",
                    display: "grid",
                    gap: "0.44rem",
                  }}
                >
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
                    {item.description}
                  </div>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn save-btn"
                    style={{
                      width: "fit-content",
                      minHeight: "36px",
                      fontSize: "0.76rem",
                      textDecoration: "none",
                    }}
                  >
                    {item.cta}
                  </a>
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ marginTop: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowFeedbackIssuesModal(false)}
                className="action-btn run-btn"
                style={{ minHeight: "40px" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated() && user?.role === 'candidate' && showCandidateInstructionsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCandidateInstructionsModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '42rem' }}
          >
            <button
              onClick={() => setShowCandidateInstructionsModal(false)}
              className="modal-close"
              aria-label="Close important instructions"
            >
              x
            </button>
            <div className="modal-header" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <h3 className="modal-title">Important Interview Instructions</h3>
              <p className="modal-description" style={{ marginTop: '0.3em' }}>
                Read and acknowledge these before joining the interview room.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '0.9rem' }}>
              {[
                {
                  title: 'Environment Setup',
                  points: [
                    'Use a stable internet connection for the full interview.',
                    'Keep camera and microphone permissions enabled.',
                    'Use desktop/laptop for the best interview experience.'
                  ]
                },
                {
                  title: 'Behavior Expectations',
                  points: [
                    'Stay in the interview tab and avoid switching windows.',
                    'Copy, cut, and paste are disabled during the interview.',
                    'Keep your video call active throughout the interview.'
                  ]
                },
                {
                  title: 'Integrity Checks',
                  points: [
                    'Tab visibility and focus changes are monitored.',
                    'Media and network interruptions can be flagged.',
                    'Repeated violations are visible to interviewer monitoring.'
                  ]
                },
                {
                  title: 'Consequences',
                  points: [
                    'Violations can trigger warnings and interviewer alerts.',
                    'Flagged behavior appears in interview monitoring records.',
                    'Repeated integrity violations can affect interview outcomes.'
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
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.55rem' }}>
                    {section.title}
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.1rem',
                      display: 'grid',
                      gap: '0.35rem',
                      fontSize: '0.84rem',
                      color: 'hsl(var(--muted-foreground))'
                    }}
                  >
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ marginTop: '1rem', justifyContent: 'space-between', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCandidateInstructionsModal(false)}
                className="action-btn save-btn"
                style={{ minHeight: '40px' }}
              >
                Review Later
              </button>
              <button
                onClick={handleInstructionsAcknowledge}
                className="action-btn run-btn"
                style={{ minHeight: '40px' }}
              >
                I Have Read And Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
