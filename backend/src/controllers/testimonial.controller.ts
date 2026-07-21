import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { ContentStatus } from '@prisma/client';

export const getTestimonials = async (req: AuthRequest, res: Response) => {
  try {
    const { status, isFeatured, page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (status) {
      where.status = status as ContentStatus;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        skip,
        take,
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.testimonial.count({ where }),
    ]);

    res.json({
      testimonials,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
};

export const getTestimonialById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json(testimonial);
  } catch (error) {
    console.error('Get testimonial error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonial' });
  }
};

export const createTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const {
      quote,
      author,
      location,
      rating = 5,
      isFeatured = false,
      isVideo = false,
      videoUrl,
      displayOrder = 0,
    } = req.body;

    if (!quote || !author) {
      return res.status(400).json({ error: 'Quote and author are required' });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        quote,
        author,
        location,
        rating,
        isFeatured,
        isVideo,
        videoUrl,
        displayOrder,
        status: ContentStatus.DRAFT,
      },
    });

    res.status(201).json(testimonial);
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
};

export const updateTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      quote,
      author,
      location,
      rating,
      isFeatured,
      isVideo,
      videoUrl,
      displayOrder,
    } = req.body;

    const updateData: any = {};

    if (quote !== undefined) updateData.quote = quote;
    if (author !== undefined) updateData.author = author;
    if (location !== undefined) updateData.location = location;
    if (rating !== undefined) updateData.rating = rating;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isVideo !== undefined) updateData.isVideo = isVideo;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: updateData,
    });

    res.json(testimonial);
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
};

export const deleteTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.testimonial.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
};

export const togglePublish = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const newStatus = testimonial.status === ContentStatus.PUBLISHED
      ? ContentStatus.DRAFT
      : ContentStatus.PUBLISHED;

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt: newStatus === ContentStatus.PUBLISHED ? new Date() : null,
      },
    });

    res.json(updatedTestimonial);
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
};
