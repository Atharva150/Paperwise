import type { Request, Response } from "express";
import fileService from "../Service/fileService";
import { AppError } from "../app";

interface AuthRequest extends Request {
  userId?: number;
}

const fileController = {
  async upload(req: AuthRequest, res: Response) {
  console.log("UPLOAD REQUEST RECEIVED");

  const userId = req.userId;
  console.log("USER ID:", userId);

  const file = req.file;
  console.log("FILE:", file ? file.originalname : "NO FILE");

  if (!userId) {
    console.log("NO USER ID");
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!file) {
    console.log("NO FILE");
    return res.status(400).json({ message: "File not sent" });
  }

  if (file.mimetype !== "application/pdf") {
    console.log("INVALID MIME TYPE:", file.mimetype);
    return res.status(400).json({ message: "Invalid File Type" });
  }

  console.log("VALIDATION PASSED");
  
  try {
    console.log("CALLING FILE SERVICE");

    const result = await fileService.upload(file, userId);

    console.log("FILE SERVICE COMPLETED");

    return res.status(201).json(result);
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    if (err instanceof AppError) {
      return res.status(err.status).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
};

export default fileController;
