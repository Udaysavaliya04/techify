import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Room from './Room';
import Join from './Join';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import AuthWrapper from './components/AuthWrapper';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthWrapper>
      <Routes>
        <Route path="/" element={<Join />} />
        <Route path="/join" element={<Join />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/editor" element={<App />} />
      </Routes>
    </AuthWrapper>
  </BrowserRouter>
); 