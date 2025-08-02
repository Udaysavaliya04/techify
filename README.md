# Techify - Real-Time Technical Interview Platform

**Try Now here - https://techify-platform.onrender.com/**

Techify is a comprehensive web-based platform designed for conducting technical interviews with real-time collaboration features. It provides a seamless experience for both interviewers and candidates with code editing, execution, and assessment tools.

## Features

### Core Functionality
- **Real-time Code Editor**: Monaco Editor with syntax highlighting and auto-completion
- **Multi-language Support**: Python, JavaScript, Java, C, C++, C#, PHP, Swift, Kotlin
- **Live Code Execution**: Execute code in real-time with output display
- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Video Calling**: Integrated WebRTC video communication
- **Interview Notes**: Side-by-side note-taking for interviewers
- **Question Bank**: Pre-built coding questions with difficulty levels
- **AI Assistant**: Integrated AI help for interview guidance

### User Management
- **Role-based Access**: Separate interfaces for interviewers and candidates
- **User Authentication**: Secure login/registration system
- **Dashboard**: Personalized dashboards with interview history and statistics
- **Session Management**: Automatic session handling and cleanup

### Assessment Tools
- **Rubric Scoring**: Structured scoring system for evaluations
- **Interview Reports**: Comprehensive interview summaries
- **Execution History**: Track all code runs and outputs
- **Performance Analytics**: Statistics and insights for users

### Security & UX
- **Browser Protection**: Prevents accidental navigation during interviews
- **Auto-save**: Automatic saving of notes and progress
- **Responsive Design**: Works across different screen sizes
- **Real-time Notifications**: Alerts for user joins/leaves and status updates

## Technology Stack

### Frontend
- **React.js**
- **Monaco Editor**
- **CSS3**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB**

## Project Structure

```
techify/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Question.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── room.js
│   │   ├── code.js
│   │   ├── questions.js
│   │   └── ai.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthWrapper.js
│   │   │   ├── Footer.js
│   │   │   ├── InterviewReport.js
│   │   │   ├── RubricScoring.js
│   │   │   └── WebRTCVideoCall.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── Dashboard.js
│   │   ├── Homepage.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Join.js
│   │   ├── Room.js
│   │   ├── Questions.js
│   │   ├── AIAssistant.js
│   │   └── index.js
│   ├── public/
│   │   ├── index.html
└── README.md
```

## Usage

### For Interviewers

1. **Register/Login**: Create an account or login with interviewer role
2. **Start Interview**: Click "Start Interview" from dashboard
3. **Share Room Code**: Copy the generated room code and share with candidate
4. **Enter Room**: Join the interview room to begin
5. **Conduct Interview**: 
   - Select questions from the question bank
   - Use AI assistant for guidance
   - Take notes in the sidebar
   - Start video call when needed
   - Run and review candidate's code
6. **Assess Performance**: Use rubric scoring and generate reports
7. **End Interview**: Complete the session and return to dashboard

### For Candidates

1. **Register/Login**: Create an account or login with candidate role
2. **Join Interview**: Click "Join Interview" from dashboard
3. **Enter Room Code**: Input the room code provided by interviewer
4. **Participate**: 
   - Write code in the editor
   - Run code to test solutions
   - Join video call when invited
   - View execution history
5. **Complete**: Interview ends when interviewer concludes the session

Built with care for the developer community. Happy interviewing!
