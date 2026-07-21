import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { sendContactEmail } from '../config/email';

export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Save to database
    const savedMessage = await prisma.message.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
      },
    });

    // Send email notification
    try {
      await sendContactEmail({ name, email, phone, message });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({ success: true, id: savedMessage.id });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { unread, search, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (unread === 'true') {
      where.isRead = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      messages,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getMessageById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(message);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.message.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
