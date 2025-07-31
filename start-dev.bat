@echo off
echo Setting up development environment...

rem Set API URL for frontend (adjust as needed)
set REACT_APP_API_URL=http://localhost:5000

echo Frontend will connect to: %REACT_APP_API_URL%
echo Starting frontend development server...

cd frontend && npm start
