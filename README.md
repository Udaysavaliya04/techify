# Techify - Real-Time Technical Interview Platform

Techify is a comprehensive web-based platform designed for conducting technical interviews with real-time collaboration features. It provides a seamless experience for both interviewers and candidates with live code editing, execution, and assessment tools.

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
- **React.js**: Modern JavaScript framework for UI
- **React Router**: Client-side routing
- **Monaco Editor**: VS Code-like code editor
- **Socket.io Client**: Real-time communication
- **Axios**: HTTP client for API requests
- **CSS3**: Custom styling with CSS variables

### Backend
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework
- **Socket.io**: Real-time bidirectional communication
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/techify
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

4. Start the backend server:
```bash
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Database Setup

1. Ensure MongoDB is running on your system
2. The application will automatically create the necessary collections
3. Default database name: `techify`

## Project Structure

```
techify/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Question.js
│   │   └── CodeSnippet.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── room.js
│   │   ├── code.js
│   │   ├── questions.js
│   │   └── ai.js
│   ├── package.json
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
│   │   └── logo.png
│   └── package.json
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

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/dashboard` - Get dashboard data
- `POST /api/auth/interview` - Start interview tracking
- `PUT /api/auth/interview/:roomId/complete` - Complete interview

### Room Management
- `GET /api/room/:roomId/timer` - Get room timer info
- `PUT /api/room/:roomId/end` - End interview
- `GET /api/room/:roomId/notes` - Get interview notes
- `PUT /api/room/:roomId/notes` - Save interview notes

### Code Execution
- `POST /api/code/execute` - Execute code
- `GET /api/code/snippets` - Get code snippets

### Questions
- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get specific question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### AI Assistant
- `POST /api/ai/help` - Get AI assistance

## Socket Events

### Client to Server
- `joinRoom` - Join interview room
- `codeChange` - Code editor changes
- `endInterview` - End interview signal
- `userLeave` - User leaving room

### Server to Client
- `init` - Initialize room state
- `codeChange` - Broadcast code changes
- `outputChange` - Code execution results
- `interviewEnded` - Interview ended notification
- `userJoined` - User joined notification
- `userLeft` - User left notification

## Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/techify
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Frontend
Update API endpoints in components if backend runs on different port:
```javascript
const API_BASE_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000';
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow React best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components modular and reusable

### Testing
- Test all user flows before committing
- Ensure real-time features work correctly
- Verify authentication and authorization
- Check responsive design on different screen sizes

## Troubleshooting

### Common Issues

**Connection Issues**
- Ensure MongoDB is running
- Check if ports 3000 and 5000 are available
- Verify environment variables are set correctly

**Socket Connection Failed**
- Check if backend server is running
- Verify CORS settings
- Ensure firewall isn't blocking connections

**Code Execution Not Working**
- Check if code execution service is properly configured
- Verify all required dependencies are installed
- Check server logs for error messages

**Authentication Problems**
- Clear browser localStorage
- Check JWT secret configuration
- Verify database connection

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check existing documentation
- Review troubleshooting section

## Roadmap

### Upcoming Features
- Screen sharing capabilities
- Advanced code analysis
- Multiple interview rooms
- Interview scheduling
- Mobile application
- Advanced analytics dashboard
- Integration with popular IDEs
- Custom question categories
- Automated code review
- Performance metrics tracking

---

Built with care for the developer community. Happy interviewing!
