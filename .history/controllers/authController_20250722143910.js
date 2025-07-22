const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode: usedReferralCode } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // If referral code is provided, validate it
    let referredBy = null;
    if (usedReferralCode) {
      const referrer = await User.findOne({ referralCode: usedReferralCode });
      if (!referrer) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      referredBy = usedReferralCode;

      // OPTIONAL: reward the referrer
      referrer.balance += 10; // for example
      await referrer.save();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      referredBy // saves referral if exists
    });

    await newUser.save();

    // OPTIONAL: reward new user
    if (usedReferralCode) {
      newUser.balance += 5;
      await newUser.save();
    }

    // JWT token
    const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({ 
      token, 
      user: { 
        id: newUser._id,
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        balance: newUser.balance,
        referralCode: newUser.referralCode
      } 
    });

  } catch (error) {
    console.error('Register Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for existing user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if blocked
    if (user.isBlocked) return res.status(403).json({ message: 'User is blocked' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Respond
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        wallet: user.wallet,
        referralCode: user.referralCode,
        referredBy: user.referredBy
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};