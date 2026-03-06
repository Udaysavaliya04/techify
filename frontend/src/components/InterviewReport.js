import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const InterviewReport = ({ roomId, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);

  useEffect(() => {
    fetchReportData();
    fetchTimeline();
  }, [roomId]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/room/${roomId}/report`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setReportData(null);
    }
    setLoading(false);
  };

  const exportReport = async (format = 'pdf') => {
    setExportLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/room/${roomId}/report/export?format=${format}`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-report-${roomId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
    }
    setExportLoading(false);
  };

  const fetchTimeline = async () => {
    setTimelineLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/room/${roomId}/timeline`);
      const events = res.data.timeline || [];
      setTimeline(events);
      if (events.length > 0) {
        setReplayIndex(events.length - 1);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const replayEvent = timeline[replayIndex] || null;

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    if (score >= 4) return '#f97316';
    return '#ef4444';
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation?.toLowerCase()) {
      case 'strong hire': return '#10b981';
      case 'hire': return '#22c55e';
      case 'weak hire': return '#f59e0b';
      case 'weak no hire': return '#f97316';
      case 'no hire': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '900px',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--card))',
        borderRadius: 'var(--radius)',
        border: '1px solid hsl(var(--border))'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          color: 'hsl(var(--muted-foreground))'
        }}>
          <div style={{
            width: '1rem',
            height: '1rem',
            border: '2px solid hsl(var(--border))',
            borderTop: '2px solid hsl(var(--primary))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Generating interview report...
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '900px',
        padding: '2rem',
        textAlign: 'center',
        background: 'hsl(var(--card))',
        borderRadius: 'var(--radius)',
        border: '1px solid hsl(var(--border))'
      }}>
        <h3 style={{ color: 'hsl(var(--foreground))', marginBottom: '1rem' }}>Report Not Available</h3>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          Unable to generate report. Please ensure the interview has been completed and scored.
        </p>
        <button onClick={onClose} className="action-btn save-btn" style={{ marginTop: '1rem' }}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      minWidth: 'min(96vw, 980px)',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'hsl(var(--card))',
      borderRadius: 'var(--radius)',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    }}>
      <button
        onClick={onClose}
        className="modal-close"
        aria-label="Close Interview Report"
      >
        ×
      </button>

      <div style={{
        padding: '1.5rem 2rem 1rem 2rem',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{
            margin: '0 0 0.25rem 0',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            Interview Report
          </h2>
          <p style={{
            margin: '0',
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))'
          }}>
            Room: {roomId} • Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => exportReport('pdf')}
            disabled={exportLoading}
            className="action-btn save-btn"
            style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
          >
            Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="action-btn save-btn"
            style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
          >
            Print
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1.5rem',
        scrollbarGutter: 'stable both-edges'
      }}>
        {/* Interview Summary */}
        <div style={{
          background: 'hsl(var(--muted) / 0.3)',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            Interview Summary
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>
                Candidate
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                {reportData.candidateName || 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>
                Programming Language
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                {reportData.language || 'JavaScript'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>
                Code Executions
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                {reportData.executionHistory?.length || 0}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>
                Success Rate
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                {reportData.executionHistory?.length ?
                  Math.round((reportData.executionHistory.filter(e => e.success).length / reportData.executionHistory.length) * 100) + '%' :
                  'N/A'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        {reportData.rubricScores && (
          <div style={{
            background: 'hsl(var(--card))',
            border: '2px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'hsl(var(--foreground))'
            }}>
              Overall Evaluation
            </h3>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '700',
                  color: getScoreColor(reportData.rubricScores.weightedScore),
                  lineHeight: '1'
                }}>
                  {reportData.rubricScores.weightedScore}/10
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--muted-foreground))',
                  marginTop: '0.25rem'
                }}>
                  Weighted Score
                </div>
              </div>

              <div style={{
                padding: '0.75rem 1.5rem',
                background: getRecommendationColor(reportData.rubricScores.recommendation),
                color: '#fff',
                borderRadius: 'var(--radius)',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                {reportData.rubricScores.recommendation}
              </div>
            </div>
          </div>
        )}

        {/* Rubric Breakdown */}
        {reportData.rubricScores?.scores && (
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'hsl(var(--foreground))'
            }}>
              Detailed Scoring
            </h3>

            {Object.entries(reportData.rubricScores.scores).map(([criteriaId, scoreData]) => {
              const criteriaNames = {
                technical_knowledge: 'Technical Knowledge',
                problem_solving: 'Problem Solving',
                code_quality: 'Code Quality',
                communication: 'Communication',
                debugging: 'Debugging & Testing'
              };

              return (
                <div key={criteriaId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid hsl(var(--border))'
                }}>
                  <div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: 'hsl(var(--foreground))'
                    }}>
                      {criteriaNames[criteriaId] || criteriaId}
                    </div>
                    {scoreData.notes && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'hsl(var(--muted-foreground))',
                        marginTop: '0.25rem',
                        maxWidth: '500px'
                      }}>
                        {scoreData.notes}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: getScoreColor(scoreData.score),
                    minWidth: '3rem',
                    textAlign: 'right'
                  }}>
                    {scoreData.score}/10
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Interview Notes */}
        {(reportData.interviewNotes || reportData.rubricScores?.overallNotes) && (
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'hsl(var(--foreground))'
            }}>
              Interview Notes
            </h3>

            {reportData.rubricScores?.overallNotes && (
              <div style={{
                background: 'hsl(var(--muted) / 0.3)',
                padding: '1rem',
                borderRadius: 'calc(var(--radius) - 2px)',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))',
                  marginBottom: '0.5rem'
                }}>
                  Evaluation Summary
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--foreground))',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {reportData.rubricScores.overallNotes}
                </div>
              </div>
            )}

            {reportData.interviewNotes && (
              <div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'hsl(var(--foreground))',
                  marginBottom: '0.5rem'
                }}>
                  Interviewer Notes
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--foreground))',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {reportData.interviewNotes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Execution Summary */}
        {reportData.executionHistory && reportData.executionHistory.length > 0 && (
          <div style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            padding: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'hsl(var(--foreground))'
            }}>
              Code Execution Summary
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                  {reportData.executionHistory.filter(e => e.success).length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  Successful
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
                  {reportData.executionHistory.filter(e => !e.success).length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  Failed
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'hsl(var(--foreground))' }}>
                  {Math.round(reportData.executionHistory.reduce((acc, e) => acc + e.executionTime, 0) / reportData.executionHistory.length)}ms
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  Avg. Time
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Replay Timeline */}
        <div style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginTop: '1.5rem',
          minHeight: '420px',
          overflowX: 'hidden'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'hsl(var(--foreground))'
          }}>
            Session Replay Timeline
          </h3>

          {timelineLoading ? (
            <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
              Loading timeline...
            </div>
          ) : timeline.length === 0 ? (
            <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
              No timeline events captured for this interview.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(timeline.length - 1, 0)}
                  value={replayIndex}
                  onChange={(e) => setReplayIndex(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  <span>Start</span>
                  <span>Event {replayIndex + 1} / {timeline.length}</span>
                  <span>Latest</span>
                </div>
              </div>

              {replayEvent && (
                <div style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  padding: '1rem',
                  background: 'hsl(var(--muted) / 0.2)',
                  minHeight: '300px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                      {replayEvent.type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(replayEvent.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.8rem',
                    color: 'hsl(var(--muted-foreground))',
                    marginBottom: '0.75rem'
                  }}>
                    Actor: {replayEvent.actor?.username || 'Unknown'} ({replayEvent.actor?.role || 'unknown'})
                  </div>

                  {replayEvent.payload?.question && (
                    <div style={{
                      marginBottom: '0.75rem',
                      fontSize: '0.875rem',
                      color: 'hsl(var(--foreground))',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <strong>Question:</strong> {replayEvent.payload.question}
                    </div>
                  )}

                  {replayEvent.payload?.notes && (
                    <div style={{
                      marginBottom: '0.75rem',
                      fontSize: '0.875rem',
                      color: 'hsl(var(--foreground))',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <strong>Notes:</strong> {replayEvent.payload.notes}
                    </div>
                  )}

                  {replayEvent.payload?.code && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                        Code Snapshot
                      </div>
                      <pre style={{
                        margin: 0,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        maxHeight: '200px',
                        overflow: 'auto',
                        color: 'hsl(var(--foreground))',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        boxSizing: 'border-box'
                      }}>
                        {replayEvent.payload.code}
                      </pre>
                    </div>
                  )}

                  {replayEvent.payload?.output && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.35rem' }}>
                        Execution Output
                      </div>
                      <pre style={{
                        margin: 0,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        maxHeight: '140px',
                        overflow: 'auto',
                        color: 'hsl(var(--foreground))',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        boxSizing: 'border-box'
                      }}>
                        {replayEvent.payload.output}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewReport;
