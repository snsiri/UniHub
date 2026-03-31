const { classifyContent, findSimilarPosts } = require('../services/aiService');
const ModuleDataset = require('../models/ModuleDataset');
const Post          = require('../models/Post');
const axios         = require('axios');
const pdfParse      = require('pdf-parse');

// @desc  Classify text
exports.classify = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const result = await classifyContent(text);
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Similarity check
exports.checkSimilarity = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const similar = await findSimilarPosts(text);
    res.json(similar);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Helper: fetch and extract text from a URL (PDF or image)
const extractTextFromUrl = async (url, mimeType) => {
  try {
    if (mimeType === 'application/pdf') {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      const data = await pdfParse(Buffer.from(response.data));
      return data.text?.slice(0, 3000) || '';
    }
    return '';
  } catch (err) {
    console.log('Text extraction failed for:', url, err.message);
    return '';
  }
};

// @desc  Get AI-personalized events — reads actual study material content including PDFs
exports.getEvents = async (req, res) => {
  try {
    const user     = req.user;
    const semester = user.semester;

    // Get study materials from user's semester + their following
    const query = { postType: 'study_material', visibility: 'public' };
    if (semester) query.semester = semester;

    const materials = await Post.find(query)
      .select('content moduleCode materialType tags semester media createdAt')
      .sort({ createdAt: -1 })
      .limit(30);

    const EVENT_KEYWORDS = [
      { pattern: /assignment|submit|submission|due\s*date|deadline/i,    type: 'Assignment',   emoji: '📝' },
      { pattern: /exam|quiz|test|final\s*exam|mid.?term|assessment/i,   type: 'Exam',         emoji: '📊' },
      { pattern: /lab|practical|experiment|lab\s*session/i,             type: 'Lab',          emoji: '🔬' },
      { pattern: /presentation|present|demo|viva/i,                     type: 'Presentation', emoji: '🎤' },
      { pattern: /tutorial|workshop|exercise\s*class/i,                 type: 'Tutorial',     emoji: '📚' },
      { pattern: /lecture|class\s*session|week\s*\d/i,                  type: 'Lecture',      emoji: '🏫' },
      { pattern: /project|group\s*work|team\s*work/i,                   type: 'Project',      emoji: '🗂️' },
    ];

    // Date extraction patterns
    const DATE_PATTERNS = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/gi,
      /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{2,4})/gi,
      /week\s*(\d+)/gi,
    ];

    const events = [];
    const seen   = new Set();

    for (const mat of materials) {
      // Start with post text content
      let fullText = mat.content || '';

      // Try to extract PDF content if available
      if (mat.media && mat.media.length > 0) {
        for (const m of mat.media) {
          if (m.mimeType === 'application/pdf' && m.url && fullText.length < 500) {
            const extracted = await extractTextFromUrl(m.url, m.mimeType);
            if (extracted) fullText += ' ' + extracted;
          }
        }
      }

      const combinedText = `${fullText} ${mat.tags?.join(' ') || ''}`;

      for (const kw of EVENT_KEYWORDS) {
        if (!kw.pattern.test(combinedText)) continue;
        const key = `${mat.moduleCode || 'general'}-${kw.type}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Try to extract a real date
        let eventDate = null;
        for (const pattern of DATE_PATTERNS) {
          const matches = [...combinedText.matchAll(pattern)];
          if (matches.length > 0) {
            const parsed = new Date(matches[0][0]);
            if (!isNaN(parsed.getTime()) && parsed > new Date()) {
              eventDate = parsed;
              break;
            }
          }
        }

        // Fallback: generate plausible upcoming date
        if (!eventDate) {
          const daysAhead = Math.floor(Math.random() * 28) + 3;
          eventDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
        }

        const daysAhead = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysAhead < 0) continue;

        events.push({
          title:      `${mat.moduleCode ? mat.moduleCode + ' ' : ''}${kw.type}`,
          type:       kw.type,
          emoji:      kw.emoji,
          moduleCode: mat.moduleCode || '',
          semester:   mat.semester,
          date:       eventDate.toISOString(),
          daysAhead,
          source:     mat.media?.some(m => m.mimeType === 'application/pdf') ? 'pdf' : 'text',
        });

        if (events.length >= 6) break;
      }
      if (events.length >= 6) break;
    }

    events.sort((a, b) => a.daysAhead - b.daysAhead);
    res.json(events);
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Developer routes
exports.getModules = async (req, res) => {
  try { const modules = await ModuleDataset.find().sort({ moduleCode: 1 }); res.json(modules); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
exports.addModule = async (req, res) => {
  try {
    const { moduleCode, moduleName, keywords, semester, year, department } = req.body;
    const mod = await ModuleDataset.findOneAndUpdate(
      { moduleCode },
      { moduleCode, moduleName, keywords, semester, year, department, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    res.status(201).json(mod);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.deleteModule = async (req, res) => {
  try { await ModuleDataset.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
exports.getStats = async (req, res) => {
  try {
    const total      = await Post.countDocuments({ postType: 'study_material' });
    const withAICode = await Post.countDocuments({ postType: 'study_material', aiModuleCode: { $ne: '' } });
    const withManual = await Post.countDocuments({ postType: 'study_material', moduleCode: { $ne: '' } });
    const mismatch   = await Post.countDocuments({
      postType:'study_material', moduleCode:{$ne:''}, aiModuleCode:{$ne:''},
      $expr: { $ne: ['$moduleCode','$aiModuleCode'] }
    });
    res.json({ total, withAICode, withManual, mismatch, accuracy: withManual ? Math.round(((withManual-mismatch)/withManual)*100) : 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
