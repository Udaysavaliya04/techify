import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from './config';
import './App.css';

export default function Questions({ onSelect, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [difficulty, setDifficulty] = useState('');
  const [text, setText] = useState('');
  const [addDiff, setAddDiff] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDiff, setEditDiff] = useState('easy');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const fetchQuestions = async (diff = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/questions`, diff ? { params: { difficulty: diff } } : {});
      setQuestions(res.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setQuestions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions(difficulty);
  }, [difficulty]);

  const addQuestion = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${config.API_BASE_URL}/api/questions/add`, {
        text: text.trim(),
        difficulty: addDiff
      });
      setText('');
      setAddDiff('easy');
      fetchQuestions(difficulty);
    } catch (error) {
      console.error('Failed to add question:', error);
      alert('Failed to add question. Please try again.');
    }
    setLoading(false);
  };

  const handleQuestionSelect = (question) => {
    // Just paste the raw question text as-is, no formatting at all
    onSelect(question.text);
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    setLoading(true);
    try {
      await axios.delete(`${config.API_BASE_URL}/api/questions/${questionId}`);
      fetchQuestions(difficulty);
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question. Please try again.');
    }
    setLoading(false);
  };

  const startEdit = (question) => {
    setEditingQuestion(question._id);
    setEditText(question.text);
    setEditDiff(question.difficulty);
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditText('');
    setEditDiff('easy');
  };

  const saveEdit = async (questionId) => {
    if (!editText.trim()) return;

    setLoading(true);
    try {
      await axios.put(`${config.API_BASE_URL}/api/questions/${questionId}`, {
        text: editText.trim(),
        difficulty: editDiff
      });
      setEditingQuestion(null);
      setEditText('');
      setEditDiff('easy');
      fetchQuestions(difficulty);
    } catch (error) {
      console.error('Failed to update question:', error);
      alert('Failed to update question. Please try again.');
    }
    setLoading(false);
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Filter questions based on search term
  const filteredQuestions = questions.filter(question => {
    const searchLower = searchTerm.toLowerCase();
    const textMatch = question.text.toLowerCase().includes(searchLower);
    const tagsMatch = question.tags && question.tags.some(tag =>
      tag.toLowerCase().includes(searchLower)
    );
    return textMatch || tagsMatch;
  });

  return (
    <div style={{
      width: '100%',
      maxWidth: '800px',
      position: 'relative',
    }}>
      <button
        onClick={onClose}
        className="modal-close"
        aria-label="Close modal"
      >
        ×
      </button>

      <h3 style={{
        margin: '0 0 2rem 0',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center'
      }}>
        Question Bank
      </h3>

      <div style={{
        background: 'rgba(0, 112, 243, 0.1)',
        border: '1px solid rgba(0, 112, 243, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#0070f3'
      }}>
        <strong>Tip:</strong> Click on any question to paste it directly into the code editor!
      </div>

      <form onSubmit={addQuestion} className="questions-form">
        <input
          className="input"
          style={{
            width: '100%'
          }}
          placeholder="Enter a new question..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />

        <div className="dropdown-menu" style={{ width: '100%', minWidth: '100px' }}>
          <button className="dropdown-trigger" aria-expanded="false" disabled={loading}>
            <span>{addDiff.charAt(0).toUpperCase() + addDiff.slice(1)}</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
              <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="dropdown-content">
            <div className="dropdown-label">Select Difficulty</div>
            <button
              className={`dropdown-item ${addDiff === 'easy' ? 'dropdown-item-active' : ''}`}
              onClick={() => setAddDiff('easy')}
            >
              <span>Easy</span>
              {addDiff === 'easy' && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              className={`dropdown-item ${addDiff === 'medium' ? 'dropdown-item-active' : ''}`}
              onClick={() => setAddDiff('medium')}
            >
              <span>Medium</span>
              {addDiff === 'medium' && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              className={`dropdown-item ${addDiff === 'hard' ? 'dropdown-item-active' : ''}`}
              onClick={() => setAddDiff('hard')}
            >
              <span>Hard</span>
              {addDiff === 'hard' && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          className={`action-btn run-btn ${loading ? 'loading' : ''}`}
          type="submit"
          disabled={loading || !text.trim()}
          style={{ width: '100%' }}
        >
          {loading ? 'Adding' : 'Add Question'}
        </button>
      </form>

      <div style={{ marginBottom: '1rem' }}>
        <div className="dropdown-menu" style={{ width: '100%' }}>
          <button className="dropdown-trigger" aria-expanded="false" disabled={loading} style={{ width: '100%' }}>
            <span>{difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : 'All Difficulties'}</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
              <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="dropdown-content">
            <div className="dropdown-label">Filter by Difficulty</div>
            <button
              className={`dropdown-item ${difficulty === '' ? 'dropdown-item-active' : ''}`}
              onClick={() => setDifficulty('')}
            >
              <span>All Difficulties</span>
              {difficulty === '' && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              className={`dropdown-item ${difficulty === 'easy' ? 'dropdown-item-active' : ''}`}
              onClick={() => setDifficulty('easy')}
            >
              <span>Easy</span>
              {difficulty === 'easy' && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              className={`dropdown-item ${difficulty === 'medium' ? 'dropdown-item-active' : ''}`}
              onClick={() => setDifficulty('medium')}
            >
              <span>Medium</span>
              {difficulty === 'medium' && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              className={`dropdown-item ${difficulty === 'hard' ? 'dropdown-item-active' : ''}`}
              onClick={() => setDifficulty('hard')}
            >
              <span>Hard</span>
              {difficulty === 'hard' && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search and View Controls */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          className="input"
          type="text"
          placeholder="Search questions or tags..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px'
          }}
        />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`action-btn ${viewMode === 'list' ? 'run-btn' : 'save-btn'}`}
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              minHeight: 'auto',
              height: '2.25rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          <button
            className={`action-btn ${viewMode === 'grid' ? 'run-btn' : 'save-btn'}`}
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              minHeight: 'auto',
              height: '2.25rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
        </div>
      </div>

      <div className="questions-list">
        {loading && questions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem'
          }}>
            Loading questions...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem'
          }}>
            {searchTerm ? `No questions found matching "${searchTerm}"` : 'No questions found. Add one above!'}
          </div>
        ) : (
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'block',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(240px, 1fr))' : 'none',
            gap: viewMode === 'grid' ? '1rem' : '0',
            maxHeight: '310px',
            overflowY: 'auto',
            border: viewMode === 'list' ? '1px solid hsl(var(--border))' : 'none',
            borderRadius: viewMode === 'list' ? 'calc(var(--radius) - 2px)' : '0'
          }}>
            {filteredQuestions.map(q => (
              <div
                key={q._id}
                className="question-item"
                style={{
                  cursor: editingQuestion === q._id ? 'default' : 'pointer',
                  border: viewMode === 'grid' ? '1px solid hsl(var(--border))' : 'none',
                  borderRadius: viewMode === 'grid' ? 'calc(var(--radius) - 2px)' : '0',
                  borderBottom: viewMode === 'list' ? '1px solid hsl(var(--border))' : 'none',
                  marginBottom: viewMode === 'grid' ? '0' : '0'
                }}
              >
                {editingQuestion === q._id ? (
                  <div style={{ padding: '1rem' }}>
                    <input
                      className="input"
                      style={{
                        marginBottom: '1rem'
                      }}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      placeholder="Edit question text..."
                    />
                    <div className="dropdown-menu" style={{ width: '100%', marginBottom: '1rem' }}>
                      <button className="dropdown-trigger" aria-expanded="false" style={{ width: '100%' }}>
                        <span>{editDiff.charAt(0).toUpperCase() + editDiff.slice(1)}</span>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                          <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div className="dropdown-content">
                        <div className="dropdown-label">Select Difficulty</div>
                        <button
                          className={`dropdown-item ${editDiff === 'easy' ? 'dropdown-item-active' : ''}`}
                          onClick={() => setEditDiff('easy')}
                        >
                          <span>Easy</span>
                          {editDiff === 'easy' && (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <button
                          className={`dropdown-item ${editDiff === 'medium' ? 'dropdown-item-active' : ''}`}
                          onClick={() => setEditDiff('medium')}
                        >
                          <span>Medium</span>
                          {editDiff === 'medium' && (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <button
                          className={`dropdown-item ${editDiff === 'hard' ? 'dropdown-item-active' : ''}`}
                          onClick={() => setEditDiff('hard')}
                        >
                          <span>Hard</span>
                          {editDiff === 'hard' && (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        className="action-btn run-btn"
                        onClick={() => saveEdit(q._id)}
                        disabled={loading || !editText.trim()}
                        style={{
                          flex: 1
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        className="action-btn save-btn"
                        onClick={cancelEdit}
                        disabled={loading}
                        style={{
                          flex: 1
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => handleQuestionSelect(q)}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div className="question-difficulty" style={{
                          color: getDifficultyColor(q.difficulty),
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                        </div>
                        {q.tags && q.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {q.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                style={{
                                  background: 'hsl(var(--secondary))',
                                  color: 'hsl(var(--secondary-foreground))',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: 'calc(var(--radius) - 4px)',
                                  fontSize: '0.625rem',
                                  fontWeight: '500'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {q.tags.length > 3 && (
                              <span style={{
                                color: 'hsl(var(--muted-foreground))',
                                fontSize: '0.625rem'
                              }}>
                                +{q.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(q);
                          }}
                          className="action-btn save-btn"
                          style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            minHeight: 'auto',
                            height: 'auto'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(q._id);
                          }}
                          className="action-btn"
                          style={{
                            background: 'hsl(var(--destructive))',
                            color: 'hsl(var(--destructive-foreground))',
                            border: '1px solid hsl(var(--destructive))',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            minHeight: 'auto',
                            height: 'auto'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{
                      color: '#fff',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      marginBottom: '0.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: viewMode === 'grid' ? 4 : 'none',
                      WebkitBoxOrient: 'vertical',
                      overflow: viewMode === 'grid' ? 'hidden' : 'visible'
                    }}>
                      {q.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 