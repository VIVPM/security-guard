// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // set in your .env file
  api_key: process.env.CLOUDINARY_API_KEY,         // set in your .env file
  api_secret: process.env.CLOUDINARY_API_SECRET    // set in your .env file
});

// Configure nodemailer transporter (using Gmail in this example)
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app-specific password
  },
});

const router = express.Router();

// POST /api/register
// Expects multipart/form-data with a file in "profilePicture" and JSON string fields for other data.
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  // Expect these fields as JSON strings in the FormData:
  const { personalInfo, workExperience, certifications, trainingAndSkills, emergencyContact } = req.body;

  let personalInfoObj;
  try {
    personalInfoObj = typeof personalInfo === 'string' ? JSON.parse(personalInfo) : personalInfo;
  } catch (err) {
    return res.status(400).json({ message: 'Invalid personalInfo format' });
  }


  try {
    // Check if user already exists by personalInfo.email
    let user = await User.findOne({ 'personalInfo.email': personalInfoObj.email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // If a file was uploaded, upload it to Cloudinary
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'profile_pictures' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        // Set the profilePicture field to the secure URL returned by Cloudinary
        personalInfoObj.profilePicture = result.secure_url;
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    // Hash the password from personalInfo
    const salt = await bcrypt.genSalt(10);
    personalInfoObj.password = await bcrypt.hash(personalInfoObj.password, salt);

    // Create the new user
    user = new User({
      personalInfo: personalInfoObj,
      workExperience: workExperience ? JSON.parse(workExperience) : [],
      certifications: certifications ? JSON.parse(certifications) : [],
      trainingAndSkills: trainingAndSkills
        ? typeof trainingAndSkills === 'string'
          ? JSON.parse(trainingAndSkills)
          : trainingAndSkills
        : { trainings: [], skills: [] },
      emergencyContact: emergencyContact ? JSON.parse(emergencyContact) : {},
      backgroundCheck: {}
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in registration:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login (remains similar)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ 'personalInfo.email': email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.personalInfo.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user._id,
        email: user.personalInfo.email,
        type: user.personalInfo.type
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ user,token });
    });

  } catch (error) {
    console.error('Error in login:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /apiAuth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ 'personalInfo.email': email });
    if (!user) {
      return res.status(404).json({ message: 'User with that email not found.' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set reset token and expiry (1 hour)
    user.personalInfo.resetPasswordToken = resetToken;
    user.personalInfo.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    // Construct reset URL (adjust FRONTEND_URL as needed)
    const resetUrl = `https://security-guard-jsj0.onrender.com/reset-password/${resetToken}`;
    // const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // Send email with reset link
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested to reset your password.\n\n
Please click on the following link, or paste it into your browser to complete the process:\n\n
${resetUrl}\n\n
If you did not request this, please ignore this email.\n`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Error sending email' });
      }
      res.json({ message: 'Password reset link sent to your email.' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /apiAuth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  try {
    // Find user by reset token and check if it hasn't expired
    const user = await User.findOne({
      'personalInfo.resetPasswordToken': token,
      'personalInfo.resetPasswordExpires': { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Check password strength (example: at least 8 chars, one uppercase, one lowercase, one digit, one special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password does not meet strength requirements.' });
    }

    // Hash new password and update user
    const salt = await bcrypt.genSalt(10);
    user.personalInfo.password = await bcrypt.hash(password, salt);
    user.personalInfo.resetPasswordToken = undefined;
    user.personalInfo.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
