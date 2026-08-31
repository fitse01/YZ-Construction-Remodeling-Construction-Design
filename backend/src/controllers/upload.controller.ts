import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadImages, uploadVideos } from '../middleware/upload';

export const uploadProjectImages = async (req: AuthRequest, res: Response) => {
  uploadImages.array('files')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Image file is too large. Maximum allowed size is 2GB.',
          code: 'LIMIT_FILE_SIZE',
        });
      }
      return res.status(400).json({ error: err.message || 'Failed to upload images' });
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
      url: `/uploads/projects/${file.filename}`,
    }));

    res.json({ files: uploadedFiles });
  });
};

export const uploadProjectVideos = async (req: AuthRequest, res: Response) => {
  uploadVideos.array('files')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Video file is too large. Maximum allowed size is 2GB.',
          code: 'LIMIT_FILE_SIZE',
        });
      }
      return res.status(400).json({ error: err.message || 'Failed to upload videos' });
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
      url: `/uploads/videos/${file.filename}`,
    }));

    res.json({ files: uploadedFiles });
  });
};
