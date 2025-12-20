import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const RubricScoring = ({ roomId, onClose, candidateInfo }) => {
  const [scores, setScores] = useState({});
  const [overallNotes, setOverallNotes] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Rubric criteria with weights
  const rubricCriteria = [
    {
      id: 'technical_knowledge',
      title: 'Technical Knowledge',
      description: 'Understanding of programming concepts, algorithms, and data structures',
      weight: 25,
      maxScore: 10,
      subcriteria: [
        'Algorithm design and optimization',
        'Data structure selection and usage',
        'Code complexity analysis',
        'Programming language proficiency'
      ]
    },
    {
      id: 'problem_solving',
      title: 'Problem Solving',
      description: 'Ability to break down complex problems and develop solutions',
      weight: 30,
      maxScore: 10,
      subcriteria: [
        'Problem decomposition',
        'Logical thinking process',
        'Edge case consideration',
        'Solution creativity and efficiency'
      ]
    },
    {
      id: 'code_quality',
      title: 'Code Quality',
      description: 'Writing clean, readable, and maintainable code',
      weight: 20,
      maxScore: 10,
      subcriteria: [
        'Code organization and structure',
        'Naming conventions and readability',
        'Error handling and validation',
        'Code documentation and comments'
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Ability to explain thinking process and collaborate effectively',
      weight: 15,
      maxScore: 10,
      subcriteria: [
        'Clear explanation of approach',
        'Responsiveness to feedback',
        'Question asking and clarification',
        'Professional demeanor'
      ]
    },
    {
      id: 'code_optimization',
      title: 'Code Optimization',
      description: 'Ability to optimize code for performance and efficiency',
      weight: 10,
      maxScore: 10,
      subcriteria: [
        'Time complexity optimization',
        'Space complexity optimization',
        'Performance considerations',
        'Best practices implementation'
      ]
    }
  ];

  useEffect(() => {
    fetchExistingScores();
  }, [roomId]);

  const fetchExistingScores = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/room/${roomId}/rubric`);
      if (res.data) {
        setScores(res.data.scores || {});
        setOverallNotes(res.data.overallNotes || '');
        setRecommendation(res.data.recommendation || '');
      }
    } catch (err) {
      console.error('Failed to fetch rubric scores:', err);
    }
  };

  const handleScoreChange = (criteriaId, score, notes = '') => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: {
        score: Math.max(0, Math.min(10, score)),
        notes: notes || prev[criteriaId]?.notes || ''
      }
    }));
  };

  const handleNotesChange = (criteriaId, notes) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        score: prev[criteriaId]?.score || 0,
        notes
      }
    }));
  };

  const calculateWeightedScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    rubricCriteria.forEach(criteria => {
      const score = scores[criteria.id]?.score || 0;
      totalWeightedScore += score * criteria.weight;
      totalWeight += criteria.weight;
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(1) : 0;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981'; // Green
    if (score >= 6) return '#f59e0b'; // Yellow
    if (score >= 4) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getRecommendationFromScore = (weightedScore) => {
    if (weightedScore >= 8) return 'Strong Hire';
    if (weightedScore >= 6.5) return 'Hire';
    if (weightedScore >= 5) return 'Weak Hire';
    if (weightedScore >= 3.5) return 'Weak No Hire';
    return 'No Hire';
  };

  const saveRubricScores = async () => {
    setSaving(true);
    try {
      const weightedScore = parseFloat(calculateWeightedScore());
      const autoRecommendation = getRecommendationFromScore(weightedScore);

      await axios.put(`${config.API_BASE_URL}/api/room/${roomId}/rubric`, {
        scores,
        overallNotes,
        recommendation: recommendation || autoRecommendation,
        weightedScore,
        timestamp: new Date().toISOString()
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save rubric scores:', err);
    }
    setSaving(false);
  };

  const weightedScore = calculateWeightedScore();

  return (
    <div className="modal-content" style={{
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <button
        onClick={onClose}
        className="modal-close"
        aria-label="Close Rubric Scoring"
      >
        ×
      </button>

      <div className="modal-header" style={{ borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
        <h2 className="modal-title" style={{ fontSize: '1.5rem' }}>
          Interview Evaluation Rubric
        </h2>
        <p className="modal-description">
          Score each criterion from 1-10. Weighted total: <strong style={{ color: getScoreColor(weightedScore) }}>{weightedScore}/10</strong>
        </p>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1.5rem'
      }}>
        {rubricCriteria.map(criteria => {
          const currentScore = scores[criteria.id]?.score || 0;
          const currentNotes = scores[criteria.id]?.notes || '';

          return (
            <div key={criteria.id} style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'hsl(var(--foreground))'
                  }}>
                    {criteria.title}
                    <span style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '400',
                      color: 'hsl(var(--muted-foreground))',
                      background: 'hsl(var(--muted))',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem'
                    }}>
                      {criteria.weight}% weight
                    </span>
                  </h3>
                  <p style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: '0.875rem',
                    color: 'hsl(var(--muted-foreground))',
                    lineHeight: '1.4'
                  }}>
                    {criteria.description}
                  </p>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    <strong>Key areas:</strong> {criteria.subcriteria.join(' • ')}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginLeft: '1rem'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: getScoreColor(currentScore),
                    marginBottom: '0.5rem'
                  }}>
                    {currentScore}/10
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={currentScore}
                    onChange={(e) => handleScoreChange(criteria.id, parseFloat(e.target.value))}
                    style={{
                      width: '80px',
                      accentColor: getScoreColor(currentScore)
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    marginTop: '0.5rem'
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                      <button
                        key={score}
                        onClick={() => handleScoreChange(criteria.id, score)}
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '0.25rem',
                          border: '1px solid hsl(var(--border))',
                          background: currentScore === score ? getScoreColor(score) : 'transparent',
                          color: currentScore === score ? '#fff' : 'hsl(var(--foreground))',
                          fontSize: '0.625rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <textarea
                value={currentNotes}
                onChange={(e) => handleNotesChange(criteria.id, e.target.value)}
                placeholder={`Notes for ${criteria.title.toLowerCase()}...`}
                className="ai-textarea"
                style={{ minHeight: '60px', height: 'auto' }}
              />
            </div>
          );
        })}

        {/* Overall Assessment */}
        <div style={{
          background: 'hsl(var(--background) / 0.5)',
          border: '3px solid hsl(var(--border))',
          borderStyle: 'dashed',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            Overall Assessment
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'hsl(var(--foreground))',
              marginBottom: '0.5rem'
            }}>
              Final Recommendation
            </label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) - 2px)',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Auto-generate from score ({getRecommendationFromScore(weightedScore)})</option>
              <option value="Strong Hire">Strong Hire</option>
              <option value="Hire">Hire</option>
              <option value="Weak Hire">Weak Hire</option>
              <option value="Weak No Hire">Weak No Hire</option>
              <option value="No Hire">No Hire</option>
            </select>
          </div>

          <textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Overall interview notes, strengths, areas for improvement..."
            className="ai-textarea"
            style={{ minHeight: '100px', height: 'auto' }}
          />
        </div>
      </div>

      <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border))', padding: '1rem 1.5rem' }}>
        <div style={{
          fontSize: '0.875rem',
          color: 'hsl(var(--muted-foreground))'
        }}>
          Weighted Score: <strong style={{ fontSize: '1.125rem', color: getScoreColor(weightedScore) }}>
            {weightedScore}/10
          </strong>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            className="action-btn save-btn"
          >
            Cancel
          </button>
          <button
            onClick={saveRubricScores}
            disabled={saving}
            className="action-btn run-btn"
            style={{
              background: saved ? '#10b981' : undefined,
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RubricScoring;
