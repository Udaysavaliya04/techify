import express from 'express';
import PDFDocument from 'pdfkit';
import RoomModel from '../models/Room.js';

const router = express.Router();

// Update interview notes
router.put('/:roomId/notes', async (req, res) => {
  const { roomId } = req.params;
  const { notes } = req.body;

  try {
    await RoomModel.updateOne(
      { roomId },
      { interviewNotes: notes }
    );
    res.json({ message: 'Notes updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// Get interview notes
router.get('/:roomId/notes', async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ notes: room.interviewNotes || '' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// End interview
router.put('/:roomId/end', async (req, res) => {
  const { roomId } = req.params;

  try {
    await RoomModel.updateOne(
      { roomId },
      {
        endTime: new Date(),
        isActive: false
      }
    );
    res.json({ message: 'Interview ended successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end interview' });
  }
});

// Get room timer info
router.get('/:roomId/timer', async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const startTime = room.startTime;
    const endTime = room.endTime;
    const isActive = room.isActive;

    res.json({
      startTime,
      endTime,
      isActive,
      duration: endTime ? endTime.getTime() - startTime.getTime() : Date.now() - startTime.getTime()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timer info' });
  }
});

// Save rubric scores
router.put('/:roomId/rubric', async (req, res) => {
  const { roomId } = req.params;
  const { scores, weightedScore, recommendation, overallNotes } = req.body;

  try {
    await RoomModel.updateOne(
      { roomId },
      {
        rubricScores: {
          scores,
          weightedScore,
          recommendation,
          overallNotes,
          evaluatedAt: new Date()
        }
      }
    );
    res.json({ message: 'Rubric scores saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save rubric scores' });
  }
});

// Get rubric scores
router.get('/:roomId/rubric', async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ rubricScores: room.rubricScores || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rubric scores' });
  }
});

// Generate interview report
router.get('/:roomId/report', async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Find candidate information from user interview history
    let candidateName = 'N/A';
    try {
      // Import User model to query user data
      const User = (await import('../models/User.js')).default;

      // Look for users who have this room in their interview history
      const usersWithThisRoom = await User.find({
        'interviewHistory.roomId': roomId,
        'interviewHistory.role': 'candidate'
      }).select('username');

      if (usersWithThisRoom.length > 0) {
        candidateName = usersWithThisRoom[0].username;
      }
    } catch (userErr) {
      console.log('Could not fetch candidate name:', userErr);
    }

    // Compile report data
    const reportData = {
      roomId: room.roomId,
      startTime: room.startTime,
      endTime: room.endTime,
      duration: room.endTime ? room.endTime.getTime() - room.startTime.getTime() : null,
      candidateName: candidateName,
      language: room.language || 'JavaScript',
      interviewNotes: room.interviewNotes,
      rubricScores: room.rubricScores,
      executionHistory: room.executionHistory || [],
      finalCode: room.code,
      generatedAt: new Date()
    };

    res.json(reportData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Export report (PDF/Word)
router.get('/:roomId/report/export', async (req, res) => {
  const { roomId } = req.params;
  const { format = 'pdf' } = req.query;

  try {
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (format === 'pdf') {
      // Create PDF document
      const doc = new PDFDocument();

      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="interview-report-${roomId}.pdf"`);

      // Pipe the PDF to the response
      doc.pipe(res);

      // Add content to PDF
      doc.fontSize(20).text('Interview Report', { align: 'center' });
      doc.moveDown();

      // Basic info
      doc.fontSize(14).text(`Room ID: ${room.roomId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Duration: ${room.endTime ? Math.round((room.endTime.getTime() - room.startTime.getTime()) / 60000) + ' minutes' : 'In progress'}`);
      doc.text(`Language: ${room.language || 'JavaScript'}`);
      doc.moveDown();

      // Evaluation Summary
      if (room.rubricScores) {
        doc.fontSize(16).text('Evaluation Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Overall Score: ${room.rubricScores.weightedScore}/10`);
        doc.text(`Recommendation: ${room.rubricScores.recommendation}`);
        doc.moveDown();

        if (room.rubricScores.scores) {
          doc.text('Detailed Scores:', { underline: true });
          Object.entries(room.rubricScores.scores).forEach(([criteria, data]) => {
            if (data && typeof data.score !== 'undefined') {
              const criteriaName = criteria.replace(/_/g, ' ').toUpperCase();
              doc.text(`${criteriaName}: ${data.score}/10`);
              if (data.notes) {
                doc.text(`  Notes: ${data.notes}`);
              }
            }
          });
          doc.moveDown();
        }

        if (room.rubricScores.overallNotes) {
          doc.text('Overall Notes:', { underline: true });
          doc.text(room.rubricScores.overallNotes);
          doc.moveDown();
        }
      }

      // Interview Notes
      if (room.interviewNotes) {
        doc.fontSize(16).text('Interview Notes', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(room.interviewNotes);
        doc.moveDown();
      }

      // Code Execution Summary
      doc.fontSize(16).text('Code Execution Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      const executions = room.executionHistory || [];
      doc.text(`Total Executions: ${executions.length}`);
      doc.text(`Successful: ${executions.filter(e => e.success).length}`);
      doc.text(`Failed: ${executions.filter(e => !e.success).length}`);
      doc.moveDown();

      // Final Code
      if (room.code) {
        doc.fontSize(16).text('Final Code', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        const codeLines = room.code.split('\n');
        codeLines.forEach(line => {
          doc.text(line);
        });
      }

      // Finalize the PDF
      doc.end();
    } else {
      // Fallback to text export
      const reportText = `
INTERVIEW REPORT
================

Room ID: ${room.roomId}
Date: ${new Date().toLocaleDateString()}
Duration: ${room.endTime ? Math.round((room.endTime.getTime() - room.startTime.getTime()) / 60000) + ' minutes' : 'In progress'}
Language: ${room.language || 'JavaScript'}

EVALUATION SUMMARY
==================
${room.rubricScores ? `
Overall Score: ${room.rubricScores.weightedScore}/10
Recommendation: ${room.rubricScores.recommendation}

DETAILED SCORES:
${Object.entries(room.rubricScores.scores || {}).map(([criteria, data]) =>
        `${criteria.replace(/_/g, ' ').toUpperCase()}: ${data.score}/10${data.notes ? '\n  Notes: ' + data.notes : ''}`
      ).join('\n')}

${room.rubricScores.overallNotes ? 'OVERALL NOTES:\n' + room.rubricScores.overallNotes : ''}
` : 'No evaluation scores available.'}

INTERVIEW NOTES
===============
${room.interviewNotes || 'No notes recorded.'}

CODE EXECUTION SUMMARY
======================
Total Executions: ${room.executionHistory?.length || 0}
Successful: ${room.executionHistory?.filter(e => e.success).length || 0}
Failed: ${room.executionHistory?.filter(e => !e.success).length || 0}

FINAL CODE
==========
${room.code || 'No code available.'}
      `;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="interview-report-${roomId}.txt"`);
      res.send(reportText);
    }
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export report' });
  }
});

export default router;
