import { Request, Response } from "express";
import prisma from "../config/database";
import { Prisma, ProjectCategory, ProjectStatus } from "@prisma/client";

type ProjectQuery = {
  category?: string | string[];
  status?: string | string[];
  isFeatured?: string | string[];
  search?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

type ProjectWhere = {
  category?: ProjectCategory;
  status?: ProjectStatus;
  isFeatured?: boolean;
  OR?: Array<{
    title?: { contains: string; mode: "insensitive" };
    location?: { contains: string; mode: "insensitive" };
    description?: { contains: string; mode: "insensitive" };
  }>;
};

const readQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getProjects = async (req: Request, res: Response) => {
  try {
    const {
      category,
      status,
      isFeatured,
      search,
      page = "1",
      limit = "50",
    } = req.query as ProjectQuery;

    const pageValue = readQueryValue(page) ?? "1";
    const limitValue = readQueryValue(limit) ?? "50";
    const categoryValue = readQueryValue(category);
    const statusValue = readQueryValue(status);
    const featuredValue = readQueryValue(isFeatured);
    const searchValue = readQueryValue(search);

    const skip = (parseInt(pageValue, 10) - 1) * parseInt(limitValue, 10);
    const take = parseInt(limitValue, 10);

    const where: ProjectWhere = {};

    if (categoryValue && categoryValue !== "ALL") {
      where.category = categoryValue as ProjectCategory;
    }

    if (statusValue && statusValue !== "ALL") {
      where.status = statusValue as ProjectStatus;
    }

    if (featuredValue !== undefined) {
      where.isFeatured = featuredValue === "true";
    }

    if (searchValue) {
      where.OR = [
        { title: { contains: searchValue, mode: "insensitive" } },
        { location: { contains: searchValue, mode: "insensitive" } },
        { description: { contains: searchValue, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        include: {
          media: { orderBy: { order: "asc" } },
          featuredImage: true,
        },
        orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.project.count({ where }),
    ]);

    const formatted = projects.map((p) => ({
      ...p,
      images: p.media.filter((m) => m.type === "image"),
      videos: p.media.filter((m) => m.type === "video"),
    }));

    return res.json({
      projects: formatted,
      pagination: {
        page: parseInt(pageValue, 10),
        limit: parseInt(limitValue, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limitValue, 10)),
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        media: { orderBy: { order: "asc" } },
        featuredImage: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({
      ...project,
      images: project.media.filter((m) => m.type === "image"),
      videos: project.media.filter((m) => m.type === "video"),
    });
  } catch (error) {
    console.error("Get project error:", error);
    return res.status(500).json({ error: "Failed to fetch project" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      location,
      description,
      category,
      completionDate,
      clientName,
      isFeatured = false,
      tags = [],
      videoUrl,
      videoThumbnailUrl,
      beforeImageUrl,
      afterImageUrl,
      featuredImageId,
      seoTitle,
      seoDescription,
      displayOrder = 0,
      status = ProjectStatus.DRAFT,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required" });
    }

    const finalSlug = slug ? slugify(slug) : `${slugify(title)}-${Date.now().toString().slice(-4)}`;

    const project = await prisma.project.create({
      data: {
        title,
        slug: finalSlug,
        location: location || null,
        description,
        category: category as ProjectCategory,
        completionDate: completionDate ? new Date(completionDate) : null,
        clientName: clientName || null,
        isFeatured: Boolean(isFeatured),
        tags: Array.isArray(tags) ? tags : [],
        videoUrl: videoUrl || null,
        videoThumbnailUrl: videoThumbnailUrl || null,
        beforeImageUrl: beforeImageUrl || null,
        afterImageUrl: afterImageUrl || null,
        featuredImageId: featuredImageId || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        displayOrder: parseInt(displayOrder, 10) || 0,
        status: status as ProjectStatus,
        publishedAt: status === ProjectStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        media: true,
        featuredImage: true,
      },
    });

    return res.status(201).json({
      ...project,
      images: [],
      videos: [],
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ error: "Failed to create project" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      location,
      description,
      category,
      completionDate,
      clientName,
      isFeatured,
      tags,
      videoUrl,
      videoThumbnailUrl,
      beforeImageUrl,
      afterImageUrl,
      seoTitle,
      seoDescription,
      displayOrder,
      status,
      featuredImageId,
    } = req.body;

    const updateData: Prisma.ProjectUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slugify(slug);
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category as ProjectCategory;
    if (completionDate !== undefined)
      updateData.completionDate = completionDate ? new Date(completionDate) : null;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (videoThumbnailUrl !== undefined) updateData.videoThumbnailUrl = videoThumbnailUrl;
    if (beforeImageUrl !== undefined) updateData.beforeImageUrl = beforeImageUrl;
    if (afterImageUrl !== undefined) updateData.afterImageUrl = afterImageUrl;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder, 10);
    if (featuredImageId !== undefined) {
      updateData.featuredImage = featuredImageId
        ? { connect: { id: featuredImageId } }
        : { disconnect: true };
    }
    if (status !== undefined) {
      updateData.status = status as ProjectStatus;
      if (status === ProjectStatus.PUBLISHED) updateData.publishedAt = new Date();
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        media: { orderBy: { order: "asc" } },
        featuredImage: true,
      },
    });

    return res.json({
      ...project,
      images: project.media.filter((m) => m.type === "image"),
      videos: project.media.filter((m) => m.type === "video"),
    });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({ error: "Failed to update project" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ error: "Failed to delete project" });
  }
};

export const togglePublish = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const newStatus =
      project.status === ProjectStatus.PUBLISHED ? ProjectStatus.DRAFT : ProjectStatus.PUBLISHED;

    const updated = await prisma.project.update({
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

    return res.json({
      ...updated,
      images: updated.media.filter((m) => m.type === "image"),
      videos: updated.media.filter((m) => m.type === "video"),
    });
  } catch (error) {
    console.error("Toggle publish error:", error);
    return res.status(500).json({ error: "Failed to toggle publish status" });
  }
};

export const duplicateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const original = await prisma.project.findUnique({ where: { id }, include: { media: true } });
    if (!original) return res.status(404).json({ error: "Project not found" });

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const duplicated = await prisma.project.create({
      data: {
        title: `${original.title} (Copy)`,
        slug: newSlug,
        location: original.location,
        description: original.description,
        category: original.category,
        completionDate: original.completionDate,
        clientName: original.clientName,
        isFeatured: false,
        tags: original.tags,
        videoUrl: original.videoUrl,
        videoThumbnailUrl: original.videoThumbnailUrl,
        beforeImageUrl: original.beforeImageUrl,
        afterImageUrl: original.afterImageUrl,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        displayOrder: original.displayOrder + 1,
        status: ProjectStatus.DRAFT,
      },
      include: { media: true, featuredImage: true },
    });

    return res.status(201).json({
      ...duplicated,
      images: [],
      videos: [],
    });
  } catch (error) {
    console.error("Duplicate project error:", error);
    return res.status(500).json({ error: "Failed to duplicate project" });
  }
};
