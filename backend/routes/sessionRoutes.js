import express from "express";
import { createSession, getSessions, getSessionById, deleteSession, submitAnswer, endSession } from "../controllers/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadSingleAudio } from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.use(protect);

//api/sessions end point
router.route("/").post(createSession);
router.route("/").get(getSessions); //get all sessions
router.route("/:id").get(getSessionById)
                    .delete(deleteSession); //get session by id

router.route("/:id/submit-answer").post(uploadSingleAudio, submitAnswer);
router.route("/:id/end").post(endSession);//end session


export default router;