import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import config from '../config';

const WebRTCVideoCall = ({
  roomId,
  role,
  onClose,
  isOpen,
  onMediaStateChange,
  onAttemptClose
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(null);

  const modalRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // WebRTC configuration
  const turnUrl = process.env.REACT_APP_TURN_URL;
  const turnUsername = process.env.REACT_APP_TURN_USERNAME;
  const turnCredential = process.env.REACT_APP_TURN_CREDENTIAL;

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      ...(turnUrl && turnUsername && turnCredential ? [{
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential
      }] : [])
    ]
  };

  useEffect(() => {
    if (!isOpen) return;

    // Initialize socket connection
    const token = localStorage.getItem('token');
    socketRef.current = io(config.SOCKET_URL, {
      auth: { token }
    });

    // Socket event listeners
    socketRef.current.on('user-joined-video', ({ userId, userRole }) => {
      console.log(`${userRole} joined the video call`);
      setRemoteUserConnected(true);

      // Both interviewer and candidate can initiate, but interviewer takes priority
      if (role === 'interviewer') {
        setTimeout(() => initiateCall(), 1000); // Small delay to ensure both are ready
      }
    });

    socketRef.current.on('users-in-room', ({ users }) => {
      console.log('Users in video room:', users);
      const otherUsers = users.filter(u => u.id !== socketRef.current.id);

      if (otherUsers.length > 0) {
        setRemoteUserConnected(true);

        // If interviewer and there are other users, initiate call
        if (role === 'interviewer') {
          setTimeout(() => initiateCall(), 1000);
        }
      }
    });

    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleIceCandidate);
    socketRef.current.on('socketError', ({ message }) => {
      console.error('Video socket error:', message);
    });
    socketRef.current.on('user-left-video', () => {
      setRemoteUserConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    // Join video room after setting up listeners
    socketRef.current.emit('join-video-room', { roomId });

    // Initialize local media
    initializeMedia();

    // Fallback: If no call is started after 5 seconds and remote user is connected, candidate can also initiate
    const fallbackTimer = setTimeout(() => {
      if (remoteUserConnected && !isCallStarted && role === 'candidate') {
        console.log('Candidate initiating call as fallback');
        initiateCall();
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      cleanup();
    };
  }, [isOpen, roomId, role]);

  const emitMediaState = (state) => {
    if (typeof onMediaStateChange === 'function') {
      onMediaStateChange(state);
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsConnected(true);
      emitMediaState({
        cameraAvailable: true,
        microphoneAvailable: true,
        videoEnabled: true,
        audioEnabled: true
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setIsVideoEnabled(false);
      emitMediaState({
        cameraAvailable: false,
        microphoneAvailable: true,
        videoEnabled: false,
        audioEnabled: true,
        reason: 'camera_unavailable'
      });
      try {
        // Fall back to audio-only if camera is busy.
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        localStreamRef.current = audioStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = audioStream;
        }
        setIsConnected(true);
        emitMediaState({
          cameraAvailable: false,
          microphoneAvailable: true,
          videoEnabled: false,
          audioEnabled: true
        });
      } catch (audioError) {
        console.error('Audio fallback also failed:', audioError);
        setIsAudioEnabled(false);
        // Keep signaling active so user can still receive remote media.
        setIsConnected(true);
        emitMediaState({
          cameraAvailable: false,
          microphoneAvailable: false,
          videoEnabled: false,
          audioEnabled: false,
          reason: 'camera_and_microphone_unavailable'
        });
      }
    }
  };

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    } else {
      // Allow receiving remote tracks even when no local device can be opened.
      peerConnection.addTransceiver('video', { direction: 'recvonly' });
      peerConnection.addTransceiver('audio', { direction: 'recvonly' });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate
        });
      }
    };

    return peerConnection;
  };

  const initiateCall = async () => {
    try {
      peerConnectionRef.current = createPeerConnection();

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('offer', {
        roomId,
        offer
      });

      setIsCallStarted(true);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const handleOffer = async (data) => {
    try {
      peerConnectionRef.current = createPeerConnection();

      await peerConnectionRef.current.setRemoteDescription(data.offer);

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketRef.current.emit('answer', {
        roomId,
        answer
      });

      setIsCallStarted(true);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        emitMediaState({
          cameraAvailable: true,
          microphoneAvailable: true,
          videoEnabled: videoTrack.enabled,
          audioEnabled: isAudioEnabled,
          reason: videoTrack.enabled ? 'camera_enabled' : 'camera_disabled'
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        emitMediaState({
          cameraAvailable: true,
          microphoneAvailable: true,
          videoEnabled: isVideoEnabled,
          audioEnabled: audioTrack.enabled,
          reason: audioTrack.enabled ? 'microphone_enabled' : 'microphone_disabled'
        });
      }
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const clampPosition = (left, top) => {
    const modalRect = modalRef.current?.getBoundingClientRect();
    const width = modalRect?.width || 350;
    const height = modalRect?.height || 280;
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    return {
      left: Math.min(Math.max(margin, left), maxLeft),
      top: Math.min(Math.max(margin, top), maxTop)
    };
  };

  const handleHeaderPointerDown = (event) => {
    if (isMaximized) return;
    if (event.button !== 0) return;
    if (event.target?.closest('button')) return;
    if (!modalRef.current) return;

    const rect = modalRef.current.getBoundingClientRect();
    const nextPosition = position || { left: rect.left, top: rect.top };
    if (!position) {
      setPosition(nextPosition);
    }

    dragOffsetRef.current = {
      x: event.clientX - nextPosition.left,
      y: event.clientY - nextPosition.top
    };

    setIsDragging(true);
    event.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return undefined;

    const handlePointerMove = (event) => {
      const rawLeft = event.clientX - dragOffsetRef.current.x;
      const rawTop = event.clientY - dragOffsetRef.current.y;
      setPosition(clampPosition(rawLeft, rawTop));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  useEffect(() => {
    const handleResize = () => {
      if (!position || isMaximized) return;
      setPosition((prev) => (prev ? clampPosition(prev.left, prev.top) : prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, isMaximized]);

  const handleCandidateCloseAttempt = () => {
    cleanup();
    if (typeof onAttemptClose === 'function') {
      onAttemptClose();
      return;
    }
    onClose();
  };

  const handleModalClose = () => {
    if (role === 'candidate') {
      handleCandidateCloseAttempt();
      return;
    }
    cleanup();
    onClose();
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (socketRef.current) {
      socketRef.current.emit('leave-video-room', { roomId });
      socketRef.current.disconnect();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className={`video-call-modal ${isMaximized ? 'maximized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={!isMaximized && position ? { top: `${position.top}px`, left: `${position.left}px`, right: 'auto', bottom: 'auto' } : undefined}
    >
      <div className="video-call-container">
        <div className="video-call-header" onPointerDown={handleHeaderPointerDown}>
          <h3>Video Call - Room {roomId}</h3>
          <div className="header-controls">
            <button
              onClick={toggleMaximize}
              className="video-maximize-btn"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path fill="none" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m8 0v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path fill="none" d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" />
                </svg>
              )}
            </button>
            {role !== 'candidate' && (
              <button onClick={handleModalClose} className="video-close-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path fill="none" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="video-layout">
          {/* Remote video (larger) */}
          <div className="remote-video-container">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
            {!remoteUserConnected && (
              <div className="waiting-message">
                <p>Waiting for {role === 'interviewer' ? 'candidate' : 'interviewer'} to join...</p>
              </div>
            )}
          </div>

          {/* Local video (smaller, picture-in-picture) */}
          <div className="local-video-container">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
            <div className="video-label" style={{ fontFamily: 'Bricolage Grotesque' }}>You </div>
          </div>
        </div>

        {/* Call controls */}
        <div className="call-controls">
          <button
            onClick={toggleAudio}
            className={`control-btn ${isAudioEnabled ? 'active' : 'inactive'}`}
            title={isAudioEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {isAudioEnabled ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19v3m7-12v2a7 7 0 0 1-14 0v-2" />
                <rect width="6" height="13" x="9" y="2" rx="3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19v3m3-12.66V5a3 3 0 0 0-5.68-1.33m7.63 13.28A7 7 0 0 1 5 12v-2m13.89 3.23A7 7 0 0 0 19 12v-2M2 2l20 20" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`control-btn ${isVideoEnabled ? 'active' : 'inactive'}`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 13l5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                <rect width="14" height="12" x="2" y="6" rx="2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2M2 2l20 20" />
              </svg>
            )}
          </button>

          {role !== 'candidate' && (
            <button
              onClick={handleModalClose}
              className="control-btn end-call"
              title="End call"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path fill="none" d="M10.1 13.9a14 14 0 0 0 3.732 2.668a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2a18 18 0 0 1-12.728-5.272M22 2L2 22m2.76-8.418A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233a14 14 0 0 0 .244.473" />
              </svg>
            </button>
          )}
        </div>

        {/* Call status */}
        <div className="call-status">
          {!isConnected && (
            <p style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
                <path fill="none" d="M12 2v4m4.2 1.8l2.9-2.9M18 12h4m-5.8 4.2l2.9 2.9M12 18v4m-7.1-2.9l2.9-2.9M2 12h4M4.9 4.9l2.9 2.9" />
              </svg>
              Connecting to camera and microphone...
            </p>
          )}
          {isConnected && !isCallStarted && (
            <p style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
                <path fill="none" d="M12 2v4m4.2 1.8l2.9-2.9M18 12h4m-5.8 4.2l2.9 2.9M12 18v4m-7.1-2.9l2.9-2.9M2 12h4M4.9 4.9l2.9 2.9" />
              </svg>
              Setting up call...
            </p>
          )}
          {isCallStarted && remoteUserConnected && (
            <p style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Connected
            </p>
          )}
          {isCallStarted && !remoteUserConnected && (
            <p style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Waiting for other participant...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebRTCVideoCall;
