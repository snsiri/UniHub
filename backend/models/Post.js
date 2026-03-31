const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 1000 },
  mentions:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:     { type: String, required: true, maxlength: 1000 },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt:{ type: Date, default: Date.now },
  }],
}, { timestamps: true });

const mediaSchema = new mongoose.Schema({
  url:          { type: String, required: true },
  publicId:     { type: String },
  resourceType: { type: String, enum: ['image','video','audio','raw'], default: 'raw' },
  mimeType:     { type: String },
  fileName:     { type: String },
  fileSize:     { type: Number },
});

const pollOptionSchema = new mongoose.Schema({
  text:  { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const postSchema = new mongoose.Schema({
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:      { type: String, default: '', maxlength: 5000 },
  media:        [mediaSchema],
  links:        [{ type: String }],
  poll: {
    question: { type: String },
    options:  [pollOptionSchema],
    endsAt:   { type: Date },
  },
  visibility:   { type: String, enum: ['public', 'private'], default: 'public' },
  postType:     { type: String, enum: ['post', 'study_material', 'repost'], default: 'post' },

  // Study material fields
  moduleCode:   { type: String, default: '' },
  materialType: { type: String, enum: ['Lecture Note','Tutorial','Past Paper','Lab Sheet','Reference Material',''], default: '' },
  semester:     { type: Number, min: 1, max: 8, default: null },
  tags:         [{ type: String }],

  // AI fields
  aiTags:       [{ type: String }],
  aiModuleCode: { type: String, default: '' },
  aiCategory:   { type: String, default: '' },
  aiSimilarity: [{
    post:       { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    score:      { type: Number },
  }],
  embedding:    [{ type: Number }],  // stored for similarity detection

  // Engagement
  mentions:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reposts:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:     [commentSchema],

  // Repost reference
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
  repostNote:   { type: String, default: '' },

  downloads:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
