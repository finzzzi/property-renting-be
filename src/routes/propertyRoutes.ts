import { Router } from "express";
import { searchProperties } from "../controllers/propertyController";

const router = Router();

router.get("/search", searchProperties);

export default router;
