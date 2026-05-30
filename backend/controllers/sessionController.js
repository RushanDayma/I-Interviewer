import asyncHandler from "express-async-handler";
import Session from "../models/sessionModel.js";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import mongoose from "mongoose";

const AI_SERVICE_URL = "http://localhost:8000";

const pushSocketUpdate = (io, userId, sessionId, status, message, sessionData = null) => {
  io.to(userId.toString()).emit("sessionUpdate", {
    sessionId,
    status,
    message,
    sessionData
  });
};

const createSession = asyncHandler(async (req, res) => {
  const { role, level, interviewType, count } = req.body;
  const userId = req.user._id;

  if (!role || !level || !interviewType || !count) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  const session = await Session.create({
    userId,
    role,
    level,
    interviewType,
    status: "pending"
  });

  const io = req.app.get("io");

  res.status(202).json({ // 202 is for pending response in the HTTP protocol
    message: "Session created successfully",
    sessionId: session._id,
    status: "processing"
  });

  (async () => {
    try {
      pushSocketUpdate(
        io,
        userId,
        session._id,
        "processing",
        `Generating ${count} questions for ${level} ${role} interview...`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2minute timeout

      const aiResponse = await fetch(`${AI_SERVICE_URL}/generate-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role, level, count, interviewType }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!aiResponse.ok) {
        const errorBody = await aiResponse.text();
        throw new Error(`AI service error: ${aiResponse.status} - ${errorBody}`);
      }

      const aiData = await aiResponse.json();
      const codingCount = interviewType === "coding+oral" ? Math.floor(count * 0.2) : 0; // 20% of the questions are coding

      const questions = aiData.questions.map(({ qText, index }) => ({
        questionText: qText,
        questionType: index < codingCount ? "coding" : "oral",
        isEvaluated: false,
        isSubmitted: false
      }));

      session.question = questions;
      session.status = "in-progress";
      await session.save();

      pushSocketUpdate(io, userId, session._id, "Questions ready", "Starting the interview...");
    } catch (error) {
      console.error(`Error generating questions: ${error.message}`);
      session.status = "failed";
      await session.save();
      
      // Provide specific error message based on error type
      const errorMsg = error.name === 'AbortError' 
        ? 'AI service request timed out. Please check if the AI service is running and responsive.'
        : `Failed to generate questions: ${error.message}`;
      
      pushSocketUpdate(io, userId, session._id, "failed", errorMsg);
    }
  })();
});

const getSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessions = await Session.find({ userId }).select("-question");
  res.status(200).json(sessions);
});

const getSessionById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.id;
  const session = await Session.findOne({ _id: sessionId, userId });

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  res.status(200).json(session);
});

const deleteSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.id;
  const session = await Session.findOne({ _id: sessionId, userId });

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  await session.deleteOne();
  res.status(200).json({ id: sessionId, message: "Session deleted successfully" });
});

const calculateOverallScore = async (sessionId) => {
  const results = await Session.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(sessionId)
      }
    },
    {
      $unwind: "$question"
    },
    {
      $match: {
        "question.isEvaluated": true
      }
    },
    {
      $group: {
        _id: "$_id",
        avgTechnical: { $avg: "$question.technicalScore" },
        avgConfidence: { $avg: "$question.confidenceScore" }
      }
    },
    {
      $project: {
        _id: 0,
        avgTechnicalScore: { $round: ["$avgTechnical", 0] },
        avgConfidenceScore: { $round: ["$avgConfidence", 0] },
        overallScore: { $round: [{ $avg: ["$avgTechnical", "$avgConfidence"] }, 0] }
      }
    }
  ]);

  return results[0] || { overallScore: 0, avgTechnicalScore: 0, avgConfidenceScore: 0 };
};

async function evaluateAnswerAsync(io, userId, sessionId, questionIndex, audioFilePath = null, codeSubmission = null) {
  const session = await Session.findById(sessionId);
  const index = typeof questionIndex === "string" ? parseInt(questionIndex, 10) : questionIndex;

  if (!session) {
    pushSocketUpdate(io, userId, sessionId, "failed", "Session not found");
    return;
  }

  const question = session.question?.[index];

  if (!question) {
    pushSocketUpdate(io, userId, sessionId, "failed", `Question not found at index ${index}`);
    return;
  }
  //step 1
  let transcription = "";

  if (audioFilePath) {
    try {
      pushSocketUpdate(io, userId, sessionId, "AI_TRANSCRIBING", `Transcribing answer for question ${index + 1}`);

      const formData = new FormData();
      formData.append("file", fs.createReadStream(audioFilePath));

      const transcriptionResponse = await fetch(`${AI_SERVICE_URL}/transcribe-audio`, {
        method: "POST",
        body: formData,
        headers: formData.getHeaders()
      });

      if (!transcriptionResponse.ok) {
        const errorBody = await transcriptionResponse.text();
        throw new Error(`Transcription error: ${transcriptionResponse.status} - ${errorBody}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      transcription = transcriptionData.transcription || "";
    } catch (error) {
      console.error(`Error during transcription: ${error.message}`);
      
      return;
    } finally {
      if (audioFilePath && fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath); //to save space
      }
    }
  }
  //step 2
  try {
    pushSocketUpdate(io, userId, sessionId, "AI_EVALUATING", `Evaluating answer for question ${index + 1}...`);

    const evalResponse = await fetch(`${AI_SERVICE_URL}/evaluate-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: question.questionText,
        question_type: question.questionType,
        role: session.role,
        level: session.level,
        user_answer: transcription,
        user_code: codeSubmission || ""
      })
    });

    if (!evalResponse.ok) {
      const errorBody = await evalResponse.text();
      throw new Error(`Evaluation error: ${evalResponse.status} - ${errorBody}`);
    }
    //step 3 scoring

    const evalData = await evalResponse.json();

    question.isEvaluated = true;
    question.userAnswerText = transcription;
    question.userSubmittedCode = codeSubmission || "";
    question.idealAnswer = evalData.idealAnswer;
    question.aiFeedback = evalData.aiFeedback;
    question.technicalScore = evalData.technicalScore;
    question.confidenceScore = evalData.confidenceScore;

    //step 4
    const allQuestionsEvaluated = session.question.every((q) => q.isEvaluated); //checks if all questions are evaluated

    if (allQuestionsEvaluated) {
      const scoreSummary = await calculateOverallScore(sessionId);
      session.overallScore = scoreSummary.overallScore;
      session.matrix = {
        avgTechnical: scoreSummary.avgTechnicalScore,
        avgConfidence: scoreSummary.avgConfidenceScore
      };
      session.status = "completed";
      session.endTime = session.endTime || Date.now();
      await session.save();
      pushSocketUpdate(io, userId, sessionId, "session_completed", `Evaluation complete for question ${index + 1}`, session);
    } else {
      await session.save();
      pushSocketUpdate(io, userId, sessionId, "evaluation_complete", {
        message: `Feedback for question ${index + 1} is ready`,
        questionIndex: index,
        aiFeedback: question.aiFeedback,      // Pass the feedback
        technicalScore: question.technicalScore // Pass the score
      }, session);
    }
  } catch (error) {
    console.error(`Error during evaluation: ${error.message}`);
    pushSocketUpdate(io, userId, sessionId, "failed", `Error during evaluation: ${error.message}`, session);
  }
}

const submitAnswer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.id;
  const { questionIndex, code } = req.body;

  const session = await Session.findById(sessionId);
  if (!session || session.userId.toString() !== userId.toString()) {
    res.status(404);
    throw new Error("Session not found or user unauthorized");
  }

  const questionIdx = parseInt(questionIndex, 10);
  const questionsArray = session.question || session.questions || [];
  const question = questionsArray[questionIdx];

  if (!question) {
    res.status(404);
    throw new Error(`Question not found at index ${questionIndex}`);
  }

  let audioFilePath = null;
  if (req.file) {
    audioFilePath = path.join(process.cwd(), req.file.path);
  }

  question.isSubmitted = true;
  if (session.question) session.markModified('question');
  if (session.questions) session.markModified('questions');
  await session.save();

  res.status(200).json({ message: "Answer submitted successfully", status: "received" });

  const io = req.app.get("io");
  evaluateAnswerAsync(io, userId, sessionId, questionIdx, audioFilePath, code || null);
});

const endSession = asyncHandler(async (req, res) => {
  
  const userId=req.user._id;
  const sessionId=req.params.id;
  const session = await Session.findById(sessionId);
  if(!session || session.userId.toString() !== userId.toString()){
    res.status(404);
    throw new Error('Session not found or user unauthorized');
  }
  const isProcessing = session.question?.some(q => q.isSubmitted && !q.isEvaluated) || false; //checks if any question is submitted and not evaluated
  if (isProcessing) {
    res.status(400);
    throw new Error('Cannot end interview while answers are being processed'); //Race Condition
  }
  if (session.status === "completed") {
    res.status(400);
    throw new Error('Session already completed');
  }
  const scoreSummary = await calculateOverallScore(sessionId);
  session.overallScore = scoreSummary.overallScore || 0;
  session.matrix = {
    avgTechnicalScore: scoreSummary.avgTechnicalScore || 0,
    avgConfidenceScore: scoreSummary.avgConfidenceScore || 0
  }
  session.status='completed';
  await session.save();
  const io=req.app.get('io');
  pushSocketUpdate(io,userId,sessionId,'session_completed','Interview ended early',session);
  res.status(200).json({message:'Session ended successfully',session});
});

export { createSession, getSessions, getSessionById, deleteSession, submitAnswer, endSession, calculateOverallScore };
