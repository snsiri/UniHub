const User          = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc  Register user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, semester, year, department } = req.body;

    if (await User.findOne({ email }))    return res.status(400).json({ message: 'Email already in use' });
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username already taken' });

    const user = await User.create({ name, username, email, password, semester, year, department });
    res.status(201).json({ user, token: generateToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ user, token: generateToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name username avatar')
      .populate('following', 'name username avatar');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
