import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import prisma from "../config/database";
import { Prisma, ServiceCategory, ContentStatus } from "@prisma/client";

type ServiceQuery = {
  category?: string | string[];
  status?: string | string[];
  showOnHomepage?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

type ServiceWhere = {
  category?: ServiceCategory;
  status?: ContentStatus;
  showOnHomepage?: boolean;
};

const readQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const {
      category,
      status,
      showOnHomepage,
      page = "1",
      limit = "10",
    } = req.query as ServiceQuery;

    const pageValue = readQueryValue(page) ?? "1";
    const limitValue = readQueryValue(limit) ?? "10";
    const categoryValue = readQueryValue(category);
    const statusValue = readQueryValue(status);
    const showOnHomepageValue = readQueryValue(showOnHomepage);

    const skip = (parseInt(pageValue, 10) - 1) * parseInt(limitValue, 10);
    const take = parseInt(limitValue, 10);

    const where: ServiceWhere = {};

    if (categoryValue) {
      where.category = categoryValue as ServiceCategory;
    }

    if (statusValue) {
      where.status = statusValue as ContentStatus;
    }

    if (showOnHomepageValue !== undefined) {
      where.showOnHomepage = showOnHomepageValue === "true";
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take,
        include: {
          media: {
            orderBy: { order: "asc" },
          },
          coverImage: true,
        },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.service.count({ where }),
    ]);

    res.json({
      services,
      pagination: {
        page: parseInt(pageValue, 10),
        limit: parseInt(limitValue, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limitValue, 10)),
      },
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
        coverImage: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("Get service error:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
};

export const getServiceBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
        coverImage: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    console.error("Get service by slug error:", error);
    res.status(500).json({ error: "Failed to fetch service" });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      slug,
      category,
      shortDesc,
      longDesc,
      showOnHomepage = true,
      displayOrder = 0,
      features = [],
      benefits = [],
      tags = [],
      seoTitle,
      seoDescription,
      coverImageId,
    } = req.body;

    if (!title || !slug || !category || !shortDesc || !longDesc) {
      return res
        .status(400)
        .json({ error: "Title, slug, category, shortDesc, and longDesc are required" });
    }

    // Check if slug is unique
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    const service = await prisma.service.create({
      data: {
        title,
        slug,
        category: category as ServiceCategory,
        shortDesc,
        longDesc,
        showOnHomepage,
        displayOrder,
        features,
        benefits,
        tags,
        seoTitle,
        seoDescription,
        coverImageId: coverImageId || null,
        status: ContentStatus.DRAFT,
      },
      include: {
        media: true,
        coverImage: true,
      },
    });

    res.status(201).json(service);
  } catch (error) {
    console.error("Create service error:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      category,
      shortDesc,
      longDesc,
      showOnHomepage,
      displayOrder,
      features,
      benefits,
      tags,
      seoTitle,
      seoDescription,
      coverImageId,
    } = req.body;

    const updateData: Prisma.ServiceUpdateInput = {};

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) {
      // Check if new slug is unique
      const existing = await prisma.service.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: "Slug already exists" });
      }
      updateData.slug = slug;
    }
    if (category !== undefined) updateData.category = category as ServiceCategory;
    if (shortDesc !== undefined) updateData.shortDesc = shortDesc;
    if (longDesc !== undefined) updateData.longDesc = longDesc;
    if (showOnHomepage !== undefined) updateData.showOnHomepage = showOnHomepage;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (features !== undefined) updateData.features = Array.isArray(features) ? features : [];
    if (benefits !== undefined) updateData.benefits = Array.isArray(benefits) ? benefits : [];
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (coverImageId !== undefined) {
      updateData.coverImage = coverImageId
        ? { connect: { id: coverImageId } }
        : { disconnect: true };
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        media: {
          orderBy: { order: "asc" },
        },
        coverImage: true,
      },
    });

    res.json(service);
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
};

export const togglePublish = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const newStatus =
      service.status === ContentStatus.PUBLISHED ? ContentStatus.DRAFT : ContentStatus.PUBLISHED;

    const updated = await prisma.service.update({
      where: { id },
      data: { status: newStatus },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
        coverImage: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Toggle publish error:", error);
    res.status(500).json({ error: "Failed to toggle publish status" });
  }
};

export const archiveService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { status: ContentStatus.ARCHIVED },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
        coverImage: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Archive service error:", error);
    res.status(500).json({ error: "Failed to archive service" });
  }
};

export const duplicateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const original = await prisma.service.findUnique({
      where: { id },
      include: {
        media: true,
        coverImage: true,
      },
    });

    if (!original) {
      return res.status(404).json({ error: "Service not found" });
    }

    const newSlug = `${original.slug}-copy-${Date.now()}`;

    const duplicated = await prisma.service.create({
      data: {
        title: `${original.title} (Copy)`,
        slug: newSlug,
        category: original.category,
        shortDesc: original.shortDesc,
        longDesc: original.longDesc,
        showOnHomepage: false,
        displayOrder: original.displayOrder + 1,
        features: original.features,
        benefits: original.benefits,
        tags: original.tags,
        seoTitle: original.seoTitle,
        seoDescription: original.seoDescription,
        status: ContentStatus.DRAFT,
      },
      include: {
        media: true,
        coverImage: true,
      },
    });

    res.status(201).json(duplicated);
  } catch (error) {
    console.error("Duplicate service error:", error);
    res.status(500).json({ error: "Failed to duplicate service" });
  }
};
