import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadImages, uploadVideos } from '../middleware/upload';

export const uploadProjectImages = async (req: AuthRequest, res: Response) => {
  uploadImages.array('files')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];

    // Return file information to client
    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/projects/${req.params.projectId}/images/${file.filename}`,
    }));

    res.json({ files: uploadedFiles });
  });
};

export const uploadProjectVideos = async (req: AuthRequest, res: Response) => {
  uploadVideos.array('files')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/projects/${req.params.projectId}/videos/${file.filename}`,
    }));

    res.json({ files: uploadedFiles });
  });
};
