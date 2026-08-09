import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import prisma from "../config/database";
import { Prisma, ContentStatus } from "@prisma/client";

type JournalQuery = {
  status?: string | string[];
  isFeatured?: string | string[];
  search?: string | string[];
  page?: string | string[];
  limit?: string | string[];
  category?: string | string[];
};

type JournalWhere = {
  status?: ContentStatus;
  isFeatured?: boolean;
  category?: string;
  OR?: Array<{
    title?: { contains: string; mode: "insensitive" };
    shortDesc?: { contains: string; mode: "insensitive" };
    content?: { contains: string; mode: "insensitive" };
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

export const getJournals = async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      isFeatured,
      search,
      page = "1",
      limit = "10",
      category,
    } = req.query as JournalQuery;

    const pageValue = readQueryValue(page) ?? "1";
    const limitValue = readQueryValue(limit) ?? "10";
    const statusValue = readQueryValue(status);
    const featuredValue = readQueryValue(isFeatured);
    const searchValue = readQueryValue(search);
    const categoryValue = readQueryValue(category);

    const skip = (parseInt(pageValue, 10) - 1) * parseInt(limitValue, 10);
    const take = parseInt(limitValue, 10);

    const where: JournalWhere = {};

    if (statusValue && statusValue !== "ALL") {
      where.status = statusValue as ContentStatus;
    }

    if (featuredValue !== undefined) {
      where.isFeatured = featuredValue === "true";
    }

    if (categoryValue && categoryValue !== "ALL") {
      where.category = categoryValue;
    }

    if (searchValue) {
      where.OR = [
        { title: { contains: searchValue, mode: "insensitive" } },
        { shortDesc: { contains: searchValue, mode: "insensitive" } },
        { content: { contains: searchValue, mode: "insensitive" } },
      ];
    }

    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        skip,
        take,
        include: {
          media: { orderBy: { order: "asc" } },
          featuredImage: true,
        },
        orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.journal.count({ where }),
    ]);

    return res.json({
      journals,
      pagination: {
        page: parseInt(pageValue, 10),
        limit: parseInt(limitValue, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limitValue, 10)),
      },
    });
  } catch (error) {
    console.error("Get journals error:", error);
    return res.status(500).json({ error: "Failed to fetch journal articles" });
  }
};

export const getJournalById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        media: { orderBy: { order: "asc" } },
        featuredImage: true,
      },
    });

    if (!journal) {
      return res.status(404).json({ error: "Journal article not found" });
    }

    return res.json(journal);
  } catch (error) {
    console.error("Get journal by ID error:", error);
    return res.status(500).json({ error: "Failed to fetch journal article" });
  }
};

export const getJournalBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const journal = await prisma.journal.findUnique({
      where: { slug },
      include: {
        media: { orderBy: { order: "asc" } },
        featuredImage: true,
      },
    });

    if (!journal) {
      return res.status(404).json({ error: "Journal article not found" });
    }

    return res.json(journal);
  } catch (error) {
    console.error("Get journal by slug error:", error);
    return res.status(500).json({ error: "Failed to fetch journal article" });
  }
};

export const createJournal = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      slug,
      shortDesc,
      content,
      category,
      tags = [],
      author = "Yohannes Z.",
      readingTime,
      status = "DRAFT",
      isFeatured = false,
      featuredImageId,
      seoTitle,
      seoDescription,
      publishDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);

    // Check slug uniqueness
    const existing = await prisma.journal.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return res.status(400).json({ error: "An article with this slug already exists" });
    }

    const journal = await prisma.journal.create({
      data: {
        title,
        slug: finalSlug,
        shortDesc,
        content,
        category,
        tags,
        author,
        readingTime,
        status: status as ContentStatus,
        isFeatured,
        featuredImageId: featuredImageId || null,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || shortDesc,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
      },
      include: {
        featuredImage: true,
      },
    });

    return res.status(201).json(journal);
  } catch (error) {
    console.error("Create journal error:", error);
    return res.status(500).json({ error: "Failed to create journal article" });
  }
};

export const updateJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      shortDesc,
      content,
      category,
      tags,
      author,
      readingTime,
      status,
      isFeatured,
      featuredImageId,
      seoTitle,
      seoDescription,
      publishDate,
    } = req.body;

    const existingJournal = await prisma.journal.findUnique({ where: { id } });
    if (!existingJournal) {
      return res.status(404).json({ error: "Journal article not found" });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (shortDesc !== undefined) updateData.shortDesc = shortDesc;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (author !== undefined) updateData.author = author;
    if (readingTime !== undefined) updateData.readingTime = readingTime;
    if (status !== undefined) updateData.status = status as ContentStatus;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (featuredImageId !== undefined) updateData.featuredImageId = featuredImageId || null;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (publishDate !== undefined) updateData.publishDate = publishDate ? new Date(publishDate) : null;

    if (slug !== undefined && slug !== existingJournal.slug) {
      const finalSlug = slugify(slug);
      const duplicate = await prisma.journal.findUnique({ where: { slug: finalSlug } });
      if (duplicate) {
        return res.status(400).json({ error: "An article with this slug already exists" });
      }
      updateData.slug = finalSlug;
    }

    const updated = await prisma.journal.update({
      where: { id },
      data: updateData,
      include: {
        featuredImage: true,
        media: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Update journal error:", error);
    return res.status(500).json({ error: "Failed to update journal article" });
  }
};

export const deleteJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.journal.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Journal article not found" });
    }

    await prisma.journal.delete({ where: { id } });
    return res.json({ success: true, message: "Journal article deleted successfully" });
  } catch (error) {
    console.error("Delete journal error:", error);
    return res.status(500).json({ error: "Failed to delete journal article" });
  }
};

export const duplicateJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const source = await prisma.journal.findUnique({
      where: { id },
      include: { media: true },
    });

    if (!source) {
      return res.status(404).json({ error: "Source journal article not found" });
    }

    let nextTitle = `${source.title} (Copy)`;
    let nextSlug = `${source.slug}-copy`;

    // Ensure slug uniqueness loop
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.journal.findUnique({ where: { slug: nextSlug } });
      if (!existing) break;
      attempts += 1;
      nextSlug = `${source.slug}-copy-${attempts}`;
      nextTitle = `${source.title} (Copy ${attempts})`;
    }

    const duplicated = await prisma.journal.create({
      data: {
        title: nextTitle,
        slug: nextSlug,
        shortDesc: source.shortDesc,
        content: source.content,
        category: source.category,
        tags: source.tags,
        author: source.author,
        readingTime: source.readingTime,
        status: ContentStatus.DRAFT,
        isFeatured: false,
        featuredImageId: source.featuredImageId,
        seoTitle: source.seoTitle ? `${source.seoTitle} (Copy)` : null,
        seoDescription: source.seoDescription,
        publishDate: new Date(),
      },
    });

    return res.status(201).json(duplicated);
  } catch (error) {
    console.error("Duplicate journal error:", error);
    return res.status(500).json({ error: "Failed to duplicate journal article" });
  }
};

export const togglePublishJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.journal.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Journal article not found" });
    }

    const nextStatus = existing.status === ContentStatus.PUBLISHED ? ContentStatus.DRAFT : ContentStatus.PUBLISHED;

    const updated = await prisma.journal.update({
      where: { id },
      data: {
        status: nextStatus,
        publishDate: nextStatus === ContentStatus.PUBLISHED ? new Date() : existing.publishDate,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Toggle publish journal error:", error);
    return res.status(500).json({ error: "Failed to toggle publishing status" });
  }
};

export const archiveJournal = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.journal.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Journal article not found" });
    }

    const updated = await prisma.journal.update({
      where: { id },
      data: { status: ContentStatus.ARCHIVED },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Archive journal error:", error);
    return res.status(500).json({ error: "Failed to archive journal article" });
  }
};
