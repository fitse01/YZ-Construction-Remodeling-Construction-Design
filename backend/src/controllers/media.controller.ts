import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const mediaData = req.body; // This will be populated by the upload middleware

    const media = await prisma.media.create({
      data: {
        projectId,
        type: 'image',
        ...mediaData,
      },
    });

    res.status(201).json(media);
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const uploadVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const mediaData = req.body; // This will be populated by the upload middleware

    const media = await prisma.media.create({
      data: {
        projectId,
        type: 'video',
        ...mediaData,
      },
    });

    res.status(201).json(media);
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
};

export const reorderMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { order } = req.body;

    const media = await prisma.media.update({
      where: { id },
      data: { order },
    });

    res.json(media);
  } catch (error) {
    console.error('Reorder media error:', error);
    res.status(500).json({ error: 'Failed to reorder media' });
  }
};

export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get media info to delete file from filesystem
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete from database (cascade will handle relationships)
    await prisma.media.delete({
      where: { id },
    });

    // TODO: Delete file from filesystem using fs.unlink
    // This should be done after database deletion to avoid orphaned records

    res.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};
