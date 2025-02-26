// models/User.js
const mongoose = require('mongoose');

const PersonalInfoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['Guard', 'Admin'], default: 'Guard', required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female'] },
    location: { type: String },
    address: { type: String },
    phone: { type: String },
    profilePicture: { type: String },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

const WorkExperienceSchema = new mongoose.Schema({
    role: { type: String },
    company: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String },
    url: { type: String } // New field for work experience URL
});

const CertificationSchema = new mongoose.Schema({
    title: { type: String },
    issuingAuthority: { type: String },
    dateIssued: { type: Date },
    url: { type: String } // New field for certification URL
});

const TrainingAndSkillsSchema = new mongoose.Schema({
    trainings: [{ type: String }],
    skills: [{ type: String }],
});

const EmergencyContactSchema = new mongoose.Schema({
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
});

// New Background Check Schema
const BackgroundCheckSchema = new mongoose.Schema({
    clearanceLevel: { type: String },
    status: { type: String },
    lastUpdated: { type: Date }
});

const UserSchema = new mongoose.Schema({
    personalInfo: PersonalInfoSchema,
    workExperience: [WorkExperienceSchema],
    certifications: [CertificationSchema],
    trainingAndSkills: TrainingAndSkillsSchema,
    emergencyContact: EmergencyContactSchema,
    backgroundCheck: BackgroundCheckSchema, // Added background check information
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
