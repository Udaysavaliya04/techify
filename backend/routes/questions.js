import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

// Add a question
router.post('/add', async (req, res) => {
  const { text, difficulty, tags } = req.body;
  try {
    const q = new Question({ text, difficulty, tags });
    await q.save();
    res.json(q);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// List questions (optionally filter by difficulty)
router.get('/', async (req, res) => {
  const { difficulty } = req.query;
  try {
    const filter = difficulty ? { difficulty } : {};
    const questions = await Question.find(filter).sort({ _id: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Update a question
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { text, difficulty, tags } = req.body;
  try {
    const question = await Question.findByIdAndUpdate(
      id,
      { text, difficulty, tags },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete a question
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router; 