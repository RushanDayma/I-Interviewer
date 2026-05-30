import mongoose from 'mongoose';

// Define a schema for the questions that will be part of the interview session. This schema includes fields for the question text, type, ideal answer, user's answer, submission status, evaluation status, scores, and AI feedback. By embedding this schema directly into the session document, we can store all relevant information about the interview session in a single document. This simplifies data retrieval and management, as we can access all session details without needing to perform additional queries to separate collections.

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['oral', 'coding'], // Restrict the questionType to specific values to ensure data consistency and prevent invalid entries.
    required: true
  },
  idealAnswer: {
    type: String,
    default: "pending"
  },
  userAnswerText: {
    type: String,
    default: ""
  },
  userSubmittedCode: {
    type: String,
    default: ""
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  isEvaluated: {
    type: Boolean,
    default: false
  },
  technicalScore: {
    type: Number,
    default: 0
  },
  confidenceScore: {
    type: Number,
    default: 0
  },
  aiFeedback: {
    type: String,
    default: "Not evaluated yet"
  }
});

// Define the main schema for the interview session, which includes a reference to the user, role, level, interview type, status, overall score, average confidence score, an array of questions (using the questionSchema), and timestamps for the start and end of the session. The userId field is indexed to optimize queries that filter sessions by user.

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Add an index to optimize queries by userId, makes lookups faster when we want to find sessions for a specific user
    },
    role: {
      type: String,
      required: true
    },
    level: {
      type: String,
      required: true
    },
    interviewType: {
      type: String,
      enum: ['oral-only', 'coding+oral'], // Restrict the interviewType to specific values to ensure data consistency and prevent invalid entries.      
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'failed'], // Restrict the status to specific values to maintain data integrity and ensure that only valid statuses are used.
      default: 'pending'
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    matrix: {
      avgTechnicalScore: {type: Number, default: 0},
      avgConfidenceScore: {type: Number, default: 0},
    },
    question:[questionSchema], // Embed the question schema directly into the session document, allowing us to store all relevant information about the interview session in a single document. This simplifies data retrieval and management, as we can access all session details without needing to perform additional queries to separate collections.
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
