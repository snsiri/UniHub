const Post           = require('../models/Post');
const User           = require('../models/User');
const Notification   = require('../models/Notification');
const { uploadToCloudinary } = require('../config/cloudinary');

const parseMentions = async (text) => {
  if (!text) return [];
  const usernames = [...new Set([...text.matchAll(/@(\w+)/g)].map(m => m[1]))];
  if (!usernames.length) return [];
  const users = await User.find({ username: { $in: usernames } }).select('_id');
  return users.map(u => u._id);
};

const getResourceType = (mime) => {
  if (mime.startsWith('video/') || mime.startsWith('audio/')) return 'video';
  if (mime === 'application/pdf') return 'raw';
  if (mime.startsWith('image/')) return 'image';
  return 'raw';
};

const getFolder = (mime) => {
  if (mime.startsWith('image/'))   return 'knowva/images';
  if (mime.startsWith('video/'))   return 'knowva/videos';
  if (mime.startsWith('audio/'))   return 'knowva/audio';
  if (mime === 'application/pdf')  return 'knowva/pdfs';
  if (mime.includes('word') || mime.includes('document')) return 'knowva/docs';
  if (mime.includes('sheet') || mime.includes('excel'))   return 'knowva/sheets';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'knowva/ppts';
  return 'knowva/misc';
};

// @desc  Create post
exports.createPost = async (req, res) => {
  try {
    const { content, visibility, postType, moduleCode, materialType,
            semester, tags, links, poll, repostNote, originalPostId } = req.body;

    // Upload each file to Cloudinary
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const resourceType = getResourceType(file.mimetype);
        const folder       = getFolder(file.mimetype);
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resource_type:   resourceType,
          use_filename:    true,
          unique_filename: true,
        });
        media.push({
          url:          result.secure_url,
          publicId:     result.public_id,
          resourceType: file.mimetype.startsWith('image/') ? 'image'
                      : file.mimetype.startsWith('video/') ? 'video'
                      : file.mimetype.startsWith('audio/') ? 'audio' : 'raw',
          mimeType:     file.mimetype,
          fileName:     file.originalname,
          fileSize:     file.size,
        });
      }
    }

    const mentions = content ? await parseMentions(content) : [];

    const postData = {
      author:       req.user._id,
      content:      content || '',
      media,
      links:        links       ? JSON.parse(links)       : [],
      visibility:   visibility  || 'public',
      postType:     postType    || 'post',
      moduleCode:   moduleCode  || '',
      materialType: materialType || '',
      semester:     semester    ? Number(semester) : null,
      tags:         tags        ? JSON.parse(tags)        : [],
      mentions,
    };

    if (req.body.aiModuleCode) postData.aiModuleCode = req.body.aiModuleCode;
    if (req.body.aiCategory)   postData.aiCategory   = req.body.aiCategory;

    if (poll) {
      const p = typeof poll === 'string' ? JSON.parse(poll) : poll;
      postData.poll = { question: p.question, options: p.options.map(o => ({ text: o, votes: [] })), endsAt: p.endsAt };
    }

    if (postType === 'repost' && originalPostId) {
      postData.originalPost = originalPostId;
      postData.repostNote   = repostNote || '';
      await Post.findByIdAndUpdate(originalPostId, { $addToSet: { reposts: req.user._id } });
    }

    const post = await Post.create(postData);
    await post.populate('author', 'name username avatar semester');

    for (const mentionedId of mentions) {
      if (mentionedId.toString() !== req.user._id.toString()) {
        await Notification.create({ recipient: mentionedId, sender: req.user._id, type: 'mention', post: post._id });
        req.app.get('io').to(mentionedId.toString()).emit('notification', { type: 'mention', post, sender: req.user });
      }
    }

    res.status(201).json(post);
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get feed
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.user._id);
    const posts = await Post.find({
      postType: { $ne: 'repost' },
      $or: [
        { visibility: 'public' },
        { visibility: 'private', author: { $in: user.following } },
      ]
    })
      .populate('author',                'name username avatar semester year')
      .populate('mentions',              'name username')
      .populate('comments.user',         'name username avatar')
      .populate('comments.replies.user', 'name username avatar')
      .populate({ path: 'originalPost', populate: { path: 'author', select: 'name username avatar' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Get study materials
exports.getStudyMaterials = async (req, res) => {
  try {
    const { semester, moduleCode, materialType, page = 1, limit = 20 } = req.query;
    const user  = await User.findById(req.user._id);
    const query = {
      postType: 'study_material',
      $or: [
        { visibility: 'public' },
        { visibility: 'private', author: { $in: [...user.following, req.user._id] } },
      ],
    };
    if (semester)     query.semester     = Number(semester);
    if (moduleCode)   query.moduleCode   = new RegExp(moduleCode, 'i');
    if (materialType) query.materialType = materialType;

    const posts = await Post.find(query)
      .populate('author', 'name username avatar semester year')
      .populate('comments.user',         'name username avatar')
      .populate('comments.replies.user', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author',  'name username avatar semester year')
      .populate('mentions','name username avatar')
      .populate('comments.user',           'name username avatar')
      .populate('comments.mentions',       'name username')
      .populate('comments.replies.user',   'name username avatar')
      .populate({ path: 'originalPost', populate: { path: 'author', select: 'name username avatar' } });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.visibility === 'private') {
      const author     = await User.findById(post.author._id);
      const isFollower = author.followers.map(f => f.toString()).includes(req.user._id.toString());
      const isAuthor   = post.author._id.toString() === req.user._id.toString();
      if (!isFollower && !isAuthor) return res.status(403).json({ message: 'This post is private' });
    }

    if (!post.views.includes(req.user._id)) { post.views.push(req.user._id); await post.save(); }
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Get user posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const user        = await User.findById(req.user._id);
    const isFollowing = user.following.map(f => f.toString()).includes(userId);
    const isOwn       = userId === req.user._id.toString();
    const query       = { author: userId };
    if (!isOwn && !isFollowing) query.visibility = 'public';

    const posts = await Post.find(query)
      .populate('author', 'name username avatar year')
      .populate('comments.user',         'name username avatar')
      .populate('comments.replies.user', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Edit post
exports.editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    const { content, visibility, moduleCode, materialType, semester, tags } = req.body;
    if (content     !== undefined) { post.content = content; post.mentions = await parseMentions(content); }
    if (visibility  !== undefined) post.visibility   = visibility;
    if (moduleCode  !== undefined) post.moduleCode   = moduleCode;
    if (materialType!==undefined)  post.materialType = materialType;
    if (semester    !== undefined) post.semester     = semester ? Number(semester) : null;
    if (tags        !== undefined) post.tags         = typeof tags === 'string' ? JSON.parse(tags) : tags;
    await post.save();
    await post.populate('author', 'name username avatar');
    res.json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Toggle like
exports.toggleLike = async (req, res) => {
  try {
    const post  = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const liked = post.likes.includes(req.user._id);
    if (liked) post.likes.pull(req.user._id);
    else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({ recipient: post.author, sender: req.user._id, type: 'like', post: post._id });
        req.app.get('io').to(post.author.toString()).emit('notification', { type: 'like', post, sender: req.user });
      }
    }
    await post.save();
    res.json({ liked: !liked, likesCount: post.likes.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Toggle save
exports.toggleSave = async (req, res) => {
  try {
    const post  = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const user  = await User.findById(req.user._id);
    const saved = user.savedPosts.includes(req.params.id);
    if (saved) { user.savedPosts.pull(req.params.id); post.saves.pull(req.user._id); }
    else        { user.savedPosts.addToSet(req.params.id); post.saves.addToSet(req.user._id); }
    await Promise.all([user.save(), post.save()]);
    res.json({ saved: !saved });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Vote poll
exports.votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post || !post.poll) return res.status(404).json({ message: 'Poll not found' });
    post.poll.options.forEach(opt => opt.votes.pull(req.user._id));
    post.poll.options[optionIndex].votes.push(req.user._id);
    await post.save();
    res.json(post.poll);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Add comment
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const { text } = req.body;
    const mentions = await parseMentions(text);
    post.comments.push({ user: req.user._id, text, mentions });
    await post.save();
    const updated = await Post.findById(post._id)
      .populate('comments.user',     'name username avatar')
      .populate('comments.mentions', 'name username');
    const newComment = updated.comments[updated.comments.length - 1];
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({ recipient: post.author, sender: req.user._id, type: 'comment', post: post._id });
      req.app.get('io').to(post.author.toString()).emit('notification', { type: 'comment', sender: req.user });
    }
    res.status(201).json(newComment);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Reply to comment
exports.replyComment = async (req, res) => {
  try {
    const post    = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const { text } = req.body;
    const mentions = await parseMentions(text);
    comment.replies.push({ user: req.user._id, text, mentions });
    await post.save();
    await post.populate('comments.replies.user', 'name username avatar');
    const reply = comment.replies[comment.replies.length - 1];
    if (comment.user.toString() !== req.user._id.toString()) {
      await Notification.create({ recipient: comment.user, sender: req.user._id, type: 'reply', post: post._id });
      req.app.get('io').to(comment.user.toString()).emit('notification', { type: 'reply', sender: req.user });
    }
    res.status(201).json(reply);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Download count
exports.downloadPost = async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
    res.json({ message: 'OK' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// @desc  Trending posts
exports.getTrending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days
    const posts = await Post.find({ createdAt: { $gte: since }, visibility: 'public' })
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    // Score by likes + comments * 2
    const scored = posts.map(p => ({
      _id:      p._id,
      content:  p.content?.slice(0, 80),
      author:   p.author,
      score:    (p.likes?.length || 0) + (p.comments?.length || 0) * 2,
      likes:    p.likes?.length || 0,
      comments: p.comments?.length || 0,
      moduleCode: p.moduleCode,
      postType:   p.postType,
      createdAt:  p.createdAt,
    })).sort((a, b) => b.score - a.score).slice(0, 6);
    res.json(scored);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
