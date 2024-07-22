import { Router } from "express";
import * as solution_path from "../controllers/solution_path.controller";

export default (app) => {
  const router = Router();
  router.get("/:id", solution_path.find_path);
  app.use("/api/solution_path", router);
};
