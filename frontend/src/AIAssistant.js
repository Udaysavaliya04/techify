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
          <div key={index} className="ai-analysis-header">
            {line.replace(/\*\*(.*?)\*\*/, '$1')}
          </div>
        );
      }

      // Handle bullet points and regular content
      if (line.match(/^[-•]/)) {
        return (
          <div key={index} className="ai-analysis-bullet">
            {line}
          </div>
        );
      }

      // Regular paragraphs
      if (line.trim()) {
        return (
          <div key={index} className="ai-analysis-text">
            {line}
          </div>
        );
      }

      return <br key={index} />;
    });
  };

  return (
    <div className="modal-content" style={{ maxWidth: '1000px' }}>
      <button
        onClick={onClose}
        className="modal-close"
        aria-label="Close AI Assistant"
      >
        ×
      </button>

      <div className="modal-header">
        <h3 className="modal-title" style={{ fontSize: '1.5rem' }}>
          AI Assistant
        </h3>
      </div>

      {/* Tab Navigation */}
      <div className="ai-tab-container">
        <button
          onClick={() => setActiveTab('analyze')}
          className="action-btn ai-tab-btn"
          style={{
            background: activeTab === 'analyze' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
            color: activeTab === 'analyze' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
          }}
        >
          Code Analysis
        </button>
        <button
          onClick={() => setActiveTab('question')}
          className="action-btn ai-tab-btn"
          style={{
            background: activeTab === 'question' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
            color: activeTab === 'question' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
          }}
        >
          Ask Anything
        </button>
      </div>

      {/* Content Area */}
      <div className="ai-content-area">
        {activeTab === 'analyze' && (
          <div>
            <textarea
              value={code}
              readOnly
              placeholder="Current code from the editor will appear here..."
              className="ai-textarea"
              style={{ fontFamily: 'monospace' }}
            />

            <button
              onClick={analyzeCode}
              disabled={loading}
              className="action-btn run-btn"
              style={{ width: '100%', marginBottom: '1.25rem' }}
            >
              {loading ? 'Analyzing...' : 'Analyze Code'}
            </button>

            {analysis && (
              <div className="output-container" style={{ minHeight: '160px' }}>
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
              className="ai-textarea"
            />

            <button
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              className="action-btn run-btn"
              style={{ width: '100%', marginBottom: '1.25rem' }}
            >
              {loading ? 'Getting Response...' : 'Ask AI'}
            </button>

            {aiResponse && (
              <div className="output-container">
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
