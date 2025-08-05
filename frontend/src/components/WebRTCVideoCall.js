import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import config from '../config';

const WebRTCVideoCall = ({ roomId, role, onClose, isOpen }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  // WebRTC configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (!isOpen) return;

    // Initialize socket connection
    socketRef.current = io(config.SOCKET_URL);
    
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
    socketRef.current.on('user-left-video', () => {
      setRemoteUserConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    // Join video room after setting up listeners
    socketRef.current.emit('join-video-room', { roomId, role });

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
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
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
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const endCall = () => {
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
    <div className={`video-call-modal ${isMaximized ? 'maximized' : ''}`}>
      <div className="video-call-container">
        <div className="video-call-header">
          <h3>Video Call - Room {roomId}</h3>
          <div className="header-controls">
            <button 
              onClick={toggleMaximize} 
              className="video-maximize-btn"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
            <button onClick={endCall} className="video-close-btn">
              ×
            </button>
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
            <div className="video-label">You </div>
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
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="2" y1="2" x2="22" y2="22"/>
                <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/>
                <path d="M5 10v2a7 7 0 0 0 12 5"/>
                <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
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
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 2 20 20"/>
                <path d="M10.68 5.68A2 2 0 0 1 12 5h2a2 2 0 0 1 2 2v2"/>
                <path d="m7 7-4 4v6a2 2 0 0 0 2 2h11"/>
                <path d="M16 16a2 2 0 0 1-2 2H9"/>
                <path d="m23 7-6 5 6 5z"/>
              </svg>
            )}
          </button>
          
          <button 
            onClick={endCall} 
            className="control-btn end-call"
            title="End call"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              <line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Call status */}
        <div className="call-status">
          {!isConnected && (
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Connecting to camera and microphone...
            </p>
          )}
          {isConnected && !isCallStarted && (
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Setting up call...
            </p>
          )}
          {isCallStarted && remoteUserConnected && (
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              Connected
            </p>
          )}
          {isCallStarted && !remoteUserConnected && (
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
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
