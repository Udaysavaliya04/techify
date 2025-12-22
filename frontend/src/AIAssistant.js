import React, { useState } from 'react';
import axios from 'axios';
import config from './config';

const AIAssistant = ({ roomId, code, language, onClose }) => {
  const [analysis, setAnalysis] = useState('');
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');

  const analyzeCode = async () => {
    if (!code.trim()) {
      setAnalysis('No code to analyze. Please ensure there is code in the editor.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${config.API_BASE_URL}/api/ai/analyze-code`, {
        code,
        language,
        roomId
      });
      setAnalysis(res.data.analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
      setAnalysis(`Error analyzing code: ${errorMessage}\n\nPlease check:\n- Backend server is running\n- Gemini API key is configured\n- Internet connection is stable`);
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      setAiResponse('Please enter a question.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${config.API_BASE_URL}/api/ai/ask-question`, {
        question,
        code,
        language,
        roomId,
        context: 'Code interview session'
      });
      setAiResponse(res.data.response);
    } catch (error) {
      console.error('AI request error:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
      setAiResponse(`Error getting AI response: ${errorMessage}\n\nPlease check:\n- Backend server is running\n- Gemini API key is configured\n- Internet connection is stable`);
    }
    setLoading(false);
  };

  const formatAnalysis = (text) => {
    return text.split('\n').map((line, index) => {
      // Handle headers (lines that start with **text**: or numbered points)
      if (line.match(/^\*\*(.*?)\*\*:/) || line.match(/^\d+\.\s*\*\*(.*?)\*\*:/)) {
        return (
          <div key={index} style={{
            color: '#0070f3',
            margin: '0.5rem 0 0.2rem 0',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {line.replace(/\*\*(.*?)\*\*/, '$1')}
          </div>
        );
      }

      // Handle bullet points and regular content
      if (line.match(/^[-•]/)) {
        return (
          <div key={index} style={{
            margin: '0.2rem 0',
            paddingLeft: '0.8rem',
            color: '#d1d5db',
            fontSize: '0.75rem'
          }}>
            {line}
          </div>
        );
      }

      // Regular paragraphs
      if (line.trim()) {
        return (
          <div key={index} style={{
            margin: '0.2rem 0',
            color: '#f3f4f6',
            lineHeight: '1.3',
            fontSize: '0.75rem'
          }}>
            {line}
          </div>
        );
      }

      return <br key={index} />;
    });
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1000px',
      position: 'relative',
      maxHeight: '85vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      border: '1px solid rgba(108, 108, 108, 0.3)',
      backdropFilter: 'blur(30px)',
    }}>
      <button
        onClick={onClose}
        className="modal-close"
        aria-label="Close AI Assistant"
      >
        ×
      </button>

      <div style={{
        padding: '24px 32px 20px 32px',
        borderBottom: '2px solid rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{
          margin: '0',
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#fff',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          letterSpacing: '-0.03em',
        }}>
          AI Assistant
        </h3>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.1)',
        gap: '8px',
        padding: '8px'
      }}>
        <button
          onClick={() => setActiveTab('analyze')}
          className="action-btn"
          style={{
            flex: 1,
            fontSize: '0.875rem',
            background: activeTab === 'analyze' ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'analyze' ? 'hsl(var(--primary-foreground))' : '#fff',
            border: activeTab === 'analyze' ? '1px solid hsl(var(--primary))' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: activeTab === 'analyze' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
          }}
        >
          Code Analysis
        </button>
        <button
          onClick={() => setActiveTab('question')}
          className="action-btn"
          style={{
            flex: 1,
            fontSize: '0.875rem',
            background: activeTab === 'question' ? 'hsl(var(--primary))' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'question' ? 'hsl(var(--primary-foreground))' : '#fff',
            border: activeTab === 'question' ? '1px solid hsl(var(--primary))' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: activeTab === 'question' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
          }}
        >
          Ask Anything
        </button>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '10px'
      }}>
        {activeTab === 'analyze' && (
          <div>
            <textarea
              value={code}
              readOnly
              placeholder="Current code from the editor will appear here..."
              style={{
                width: '100%',
                height: '270px',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '16px',
                lineHeight: '1.4',
                backdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}
            />

            <button
              onClick={analyzeCode}
              disabled={loading}
              className="action-btn run-btn"
              style={{
                width: '100%',
                marginBottom: '20px'
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze Code'}
            </button>

            {analysis && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(180, 180, 180, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '0.8rem',
                lineHeight: '1.5',
                color: 'white',
                minHeight: '160px',
                backdropFilter: 'blur(15px)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}>
                {formatAnalysis(analysis)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'question' && (
          <div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything... "
              style={{
                width: '100%',
                height: '270px',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '0.8rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '16px',
                lineHeight: '1.4',
                backdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}
            />

            <button
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              className="action-btn"
              style={{
                width: '100%',
                background: 'white',
                border: 'none',
                marginBottom: '20px'
              }}
            >
              {loading ? 'Getting Response...' : 'Ask AI'}
            </button>

            {aiResponse && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(176, 176, 176, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '0.8rem',
                lineHeight: '1.5',
                color: 'white',
                backdropFilter: 'blur(15px)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}>
                {formatAnalysis(aiResponse)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;