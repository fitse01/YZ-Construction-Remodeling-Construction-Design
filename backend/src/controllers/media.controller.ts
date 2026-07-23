import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import { processImage } from '../middleware/upload';

export const getMediaList = async (req: Request, res: Response) => {
  try {
    const { folder, type, search, page = '1', limit = '60' } = req.query;

    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const where: any = {};
    if (folder && folder !== 'all') {
      where.folder = folder as string;
    }
    if (type && type !== 'all') {
      where.type = type as string;
    }
    if (search) {
      where.OR = [
        { originalName: { contains: search as string, mode: 'insensitive' } },
        { filename: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where }),
    ]);

    return res.json({
      media,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    });
  } catch (error) {
    console.error('Get media list error:', error);
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
};

export const uploadMediaFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.params.folder || req.query.folder as string || 'general';
    const isVideo = req.file.mimetype.startsWith('video/');
    const fileType = isVideo ? 'video' : 'image';

    const relativeUrl = `/uploads/${folder}/${req.file.filename}`;
    let width = null;
    let height = null;
    let thumbnailUrl = null;
    let thumbnailPath = null;

    if (!isVideo && req.file.mimetype.startsWith('image/')) {
      const processed = await processImage(req.file.path);
      width = processed.width;
      height = processed.height;
      if (processed.thumbnailPath !== req.file.path) {
        thumbnailPath = processed.thumbnailPath;
        thumbnailUrl = `/uploads/${folder}/${path.basename(processed.thumbnailPath)}`;
      }
    }

    const media = await prisma.media.create({
      data: {
        folder,
        type: fileType,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        width,
        height,
        path: req.file.path,
        url: relativeUrl,
        thumbnailPath,
        thumbnailUrl: thumbnailUrl || relativeUrl,
        projectId: req.body.projectId || null,
        serviceId: req.body.serviceId || null,
      },
    });

    return res.status(201).json(media);
  } catch (error) {
    console.error('Upload media error:', error);
    return res.status(500).json({ error: 'Failed to upload media file' });
  }
};

export const renameMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { originalName } = req.body;

    if (!originalName) {
      return res.status(400).json({ error: 'Original name is required' });
    }

    const media = await prisma.media.update({
      where: { id },
      data: { originalName },
    });

    return res.json(media);
  } catch (error) {
    console.error('Rename media error:', error);
    return res.status(500).json({ error: 'Failed to rename media' });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({ where: { id } });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    await prisma.media.delete({ where: { id } });

    // Clean up physical file if present
    if (media.path && fs.existsSync(media.path)) {
      try {
        fs.unlinkSync(media.path);
      } catch (err) {
        console.error('File unlink error:', err);
      }
    }
    if (media.thumbnailPath && fs.existsSync(media.thumbnailPath) && media.thumbnailPath !== media.path) {
      try {
        fs.unlinkSync(media.thumbnailPath);
      } catch (err) {
        console.error('Thumbnail unlink error:', err);
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    return res.status(500).json({ error: 'Failed to delete media' });
  }
};
