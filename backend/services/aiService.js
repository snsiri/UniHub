const ModuleDataset = require('../models/ModuleDataset');
const Post          = require('../models/Post');

// ─── Pure JS tokenizer (no external NLP library needed) ───────────────────────
const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','it','this','that','was','are','be','as','at','an','have','has','had','not','but','so','if','we','he','she','they','you','i','my','your','our','its','can','will','do','did','does','been','being','would','could','should','may','might','also','just','very','more','some','any','all','each','which','who','what','when','where','how','than','then','into','about','up','out','no','or','get','got','use','used','via','per','new','old','one','two','three','first','last','next','best','good','here','there']);

const tokenize = (text) =>
  text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

const buildTF = (tokens) => {
  const vec = {};
  for (const t of tokens) vec[t] = (vec[t] || 0) + 1;
  const total = tokens.length || 1;
  for (const t in vec) vec[t] /= total;
  return vec;
};

const cosine = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, mA = 0, mB = 0;
  for (const k of keys) {
    const av = a[k] || 0, bv = b[k] || 0;
    dot += av * bv; mA += av * av; mB += bv * bv;
  }
  return (!mA || !mB) ? 0 : dot / (Math.sqrt(mA) * Math.sqrt(mB));
};

// ─── AI Classification ─────────────────────────────────────────────────────────
exports.classifyContent = async (text) => {
  try {
    if (!text || text.trim().length < 20) return { moduleCode: '', tags: [], category: '', confidence: 0 };

    const tokens  = tokenize(text);
    const textVec = buildTF(tokens);
    const modules = await ModuleDataset.find({ isActive: true });

    let best = null, bestScore = 0;
    for (const mod of modules) {
      const modVec = buildTF(tokenize([mod.moduleName, ...mod.keywords].join(' ')));
      const score  = cosine(textVec, modVec);
      if (score > bestScore) { bestScore = score; best = mod; }
    }

    // Top meaningful words as tags
    const tags = Object.entries(buildTF(tokens))
      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w).filter(w => w.length > 3);

    // Detect category
    const lower = text.toLowerCase();
    let category = 'Reference Material';
    if (lower.includes('lecture') || lower.includes('slide') || lower.includes('chapter')) category = 'Lecture Note';
    else if (lower.includes('tutorial') || lower.includes('exercise') || lower.includes('practice')) category = 'Tutorial';
    else if (lower.includes('past paper') || lower.includes('exam') || lower.includes('quiz') || lower.includes('test')) category = 'Past Paper';
    else if (lower.includes('lab') || lower.includes('practical') || lower.includes('experiment')) category = 'Lab Sheet';

    return {
      moduleCode: bestScore > 0.05 ? (best?.moduleCode || '') : '',
      tags,
      category,
      confidence: Math.min(Math.round(bestScore * 200), 99),
    };
  } catch (err) {
    console.error('AI classify error:', err);
    return { moduleCode: '', tags: [], category: '', confidence: 0 };
  }
};

// ─── Similarity Detection ──────────────────────────────────────────────────────
exports.findSimilarPosts = async (text, excludeId = null) => {
  try {
    if (!text || text.trim().length < 30) return [];
    const tokens  = tokenize(text);
    const textVec = buildTF(tokens);

    const recent = await Post.find({
      postType: 'study_material', visibility: 'public',
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    }).select('_id content author').populate('author','name username').limit(200).sort({ createdAt: -1 });

    const similar = [];
    for (const post of recent) {
      if (!post.content) continue;
      const score = cosine(textVec, buildTF(tokenize(post.content)));
      if (score > 0.4) similar.push({ post, score: Math.round(score * 100) });
    }
    return similar.sort((a, b) => b.score - a.score).slice(0, 3);
  } catch (err) {
    console.error('Similarity error:', err);
    return [];
  }
};
