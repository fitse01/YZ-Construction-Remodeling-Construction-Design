import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { ProjectCategory, ProjectStatus } from '@prisma/client';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, page = '1', limit = '10' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (category) {
      where.category = category as ProjectCategory;
    }

    if (status) {
      where.status = status as ProjectStatus;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        include: {
          media: {
            orderBy: { order: 'asc' },
          },
          featuredImage: true,
        },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.project.count({ where }),
    ]);

    // Separate media into images and videos for the response
    const projectsWithSeparatedMedia = projects.map(project => ({
      ...project,
      images: project.media.filter(m => m.type === 'image'),
      videos: project.media.filter(m => m.type === 'video'),
    }));

    res.json({
      projects: projectsWithSeparatedMedia,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
        featuredImage: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Separate media into images and videos for the response
    const projectWithSeparatedMedia = {
      ...project,
      images: project.media.filter(m => m.type === 'image'),
      videos: project.media.filter(m => m.type === 'video'),
    };

    res.json(projectWithSeparatedMedia);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, displayOrder = 0 } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        category: category as ProjectCategory,
        displayOrder,
        status: ProjectStatus.DRAFT,
      },
      include: {
        media: true,
        featuredImage: true,
      },
    });

    // Separate media into images and videos for the response
    const projectWithSeparatedMedia = {
      ...project,
      images: project.media.filter(m => m.type === 'image'),
      videos: project.media.filter(m => m.type === 'video'),
    };

    res.status(201).json(projectWithSeparatedMedia);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, displayOrder, featuredImageId } = req.body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category as ProjectCategory;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (featuredImageId !== undefined) updateData.featuredImageId = featuredImageId;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
        featuredImage: true,
      },
    });

    // Separate media into images and videos for the response
    const projectWithSeparatedMedia = {
      ...project,
      images: project.media.filter(m => m.type === 'image'),
      videos: project.media.filter(m => m.type === 'video'),
    };

    res.json(projectWithSeparatedMedia);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const togglePublish = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const newStatus = project.status === ProjectStatus.PUBLISHED 
      ? ProjectStatus.DRAFT 
      : ProjectStatus.PUBLISHED;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt: newStatus === ProjectStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        media: true,
        featuredImage: true,
      },
    });

    // Separate media into images and videos for the response
    const projectWithSeparatedMedia = {
      ...updatedProject,
      images: updatedProject.media.filter(m => m.type === 'image'),
      videos: updatedProject.media.filter(m => m.type === 'video'),
    };

    res.json(projectWithSeparatedMedia);
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
};
