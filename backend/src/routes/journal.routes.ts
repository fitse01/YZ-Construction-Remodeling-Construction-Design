import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as journalController from "../controllers/journal.controller";

const router = Router();

// Public routes
router.get("/", journalController.getJournals);
router.get("/slug/:slug", journalController.getJournalBySlug);
router.get("/:id", journalController.getJournalById);

// Protected routes (admin only)
router.post("/", authenticate, authorize(["OWNER", "ADMIN"]), journalController.createJournal);
router.put("/:id", authenticate, authorize(["OWNER", "ADMIN"]), journalController.updateJournal);
router.delete("/:id", authenticate, authorize(["OWNER", "ADMIN"]), journalController.deleteJournal);
router.patch("/:id/publish", authenticate, authorize(["OWNER", "ADMIN"]), journalController.togglePublishJournal);
router.patch("/:id/archive", authenticate, authorize(["OWNER", "ADMIN"]), journalController.archiveJournal);
router.post("/:id/duplicate", authenticate, authorize(["OWNER", "ADMIN"]), journalController.duplicateJournal);

export default router;
