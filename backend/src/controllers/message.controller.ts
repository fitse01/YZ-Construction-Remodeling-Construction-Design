import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendNotificationToOwner, sendConfirmationToClient } from '../services/email.service';

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, projectType, budget, timeline, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Save to database
    const savedMessage = await prisma.message.create({
      data: {
        name,
        email,
        phone: phone || null,
        projectType: projectType || 'General Inquiry',
        budget: budget || null,
        timeline: timeline || null,
        message,
      },
    });

    // Send emails asynchronously
    sendNotificationToOwner({ name, email, phone, projectType, budget, timeline, message }).catch(err =>
      console.error('Owner email error:', err)
    );

    sendConfirmationToClient({ name, email, phone, projectType, budget, timeline, message }).catch(err =>
      console.error('Client email error:', err)
    );

    return res.status(201).json({ success: true, message: savedMessage });
  } catch (error) {
    console.error('Create message error:', error);
    return res.status(500).json({ error: 'Failed to create message' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { status = 'all', search, page = '1', limit = '50' } = req.query;

    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const take = parseInt(limit as string, 10);

    const where: any = {};

    if (status === 'unread') {
      where.isRead = false;
      where.isArchived = false;
      where.isSpam = false;
    } else if (status === 'read') {
      where.isRead = true;
      where.isArchived = false;
      where.isSpam = false;
    } else if (status === 'archived') {
      where.isArchived = true;
    } else if (status === 'spam') {
      where.isSpam = true;
    } else if (status === 'active') {
      where.isArchived = false;
      where.isSpam = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } },
        { projectType: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where }),
      prisma.message.count({ where: { isRead: false, isArchived: false, isSpam: false } }),
    ]);

    return res.json({
      messages,
      unreadCount,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    return res.status(500).json({ error: 'Failed to fetch message' });
  }
};

export const updateMessageStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isRead, isArchived, isSpam, replyMessage } = req.body;

    const updateData: any = {};
    if (typeof isRead === 'boolean') updateData.isRead = isRead;
    if (typeof isArchived === 'boolean') updateData.isArchived = isArchived;
    if (typeof isSpam === 'boolean') updateData.isSpam = isSpam;
    if (replyMessage) {
      updateData.replyMessage = replyMessage;
      updateData.repliedAt = new Date();
    }

    const message = await prisma.message.update({
      where: { id },
      data: updateData,
    });

    return res.json(message);
  } catch (error) {
    console.error('Update message error:', error);
    return res.status(500).json({ error: 'Failed to update message' });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.message.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
};
