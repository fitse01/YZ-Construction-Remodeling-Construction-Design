import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

const defaultAboutContent = {
    ownerName: 'Yohannes Zewde',
    ownerPosition: 'Founder & Owner',
    ownerDescription: 'Founder of YZ Construction with over 12 years of experience in residential and commercial construction.',
    companyStory:
        'YZ Construction started with a pickup truck, a small crew, and a simple standard: do the work right and communicate clearly. The company has grown, but the approach has not changed.',
    mission:
        'Deliver residential and commercial construction that respects the client\'s time, money, and vision.',
    vision:
        'Be the DMV\'s most trusted boutique builder - the shop people call when it has to be done right.',
    values:
        'Craft. Communication. Cleanliness. Character. If it is not on the wall, it is on the truck.',
};

const defaultTeamMembers = [
    { name: 'Yohannes Zewde', position: 'Founder & Owner', displayOrder: 0, isActive: true },
    { name: 'Miguel R.', position: 'Senior Project Manager', displayOrder: 1, isActive: true },
    { name: 'Anthony B.', position: 'Lead Carpenter', displayOrder: 2, isActive: true },
    { name: 'Elena S.', position: 'Interior Designer', displayOrder: 3, isActive: true },
];

const includeAboutContent = {
    ownerImage: true,
} as const;

const includeTeamMember = {
    image: true,
} as const;

async function ensureAboutContent() {
    let content = await prisma.aboutContent.findFirst({ include: includeAboutContent });

    if (!content) {
        content = await prisma.aboutContent.create({
            data: defaultAboutContent,
            include: includeAboutContent,
        });
    }

    return content;
}

async function ensureTeamMembers() {
    const existing = await prisma.aboutTeamMember.count();

    if (existing === 0) {
        await prisma.aboutTeamMember.createMany({ data: defaultTeamMembers });
    }

    return prisma.aboutTeamMember.findMany({
        include: includeTeamMember,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
}

export const getAboutContent = async (req: AuthRequest, res: Response) => {
    try {
        const content = await ensureAboutContent();
        res.json(content);
    } catch (error) {
        console.error('Get about content error:', error);
        res.status(500).json({ error: 'Failed to fetch about content' });
    }
};

export const updateAboutContent = async (req: AuthRequest, res: Response) => {
    try {
        const {
            ownerName,
            ownerPosition,
            ownerDescription,
            ownerImageId,
            companyStory,
            mission,
            vision,
            values,
        } = req.body;

        const current = await ensureAboutContent();

        const updated = await prisma.aboutContent.update({
            where: { id: current.id },
            data: {
                ownerName,
                ownerPosition,
                ownerDescription,
                ownerImageId: ownerImageId || null,
                companyStory,
                mission,
                vision,
                values,
            },
            include: includeAboutContent,
        });

        res.json(updated);
    } catch (error) {
        console.error('Update about content error:', error);
        res.status(500).json({ error: 'Failed to update about content' });
    }
};

export const getTeamMembers = async (req: AuthRequest, res: Response) => {
    try {
        const members = await ensureTeamMembers();
        const activeMembers = members.filter((member) => member.isActive);
        res.json({ members: activeMembers });
    } catch (error) {
        console.error('Get team members error:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
};

export const getAllTeamMembers = async (req: AuthRequest, res: Response) => {
    try {
        const members = await ensureTeamMembers();
        res.json({ members });
    } catch (error) {
        console.error('Get all team members error:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
};

export const createTeamMember = async (req: AuthRequest, res: Response) => {
    try {
        const { name, position, description, imageId, displayOrder = 0, isActive = true } = req.body;

        if (!name || !position) {
            return res.status(400).json({ error: 'Name and position are required' });
        }

        const member = await prisma.aboutTeamMember.create({
            data: {
                name,
                position,
                description: description || null,
                imageId: imageId || null,
                displayOrder: Number(displayOrder) || 0,
                isActive: Boolean(isActive),
            },
            include: includeTeamMember,
        });

        res.status(201).json(member);
    } catch (error) {
        console.error('Create team member error:', error);
        res.status(500).json({ error: 'Failed to create team member' });
    }
};

export const updateTeamMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, position, description, imageId, displayOrder, isActive } = req.body;

        const member = await prisma.aboutTeamMember.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(position !== undefined ? { position } : {}),
                ...(description !== undefined ? { description: description || null } : {}),
                ...(imageId !== undefined ? { imageId: imageId || null } : {}),
                ...(displayOrder !== undefined ? { displayOrder: Number(displayOrder) || 0 } : {}),
                ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
            },
            include: includeTeamMember,
        });

        res.json(member);
    } catch (error) {
        console.error('Update team member error:', error);
        res.status(500).json({ error: 'Failed to update team member' });
    }
};

export const deleteTeamMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.aboutTeamMember.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete team member error:', error);
        res.status(500).json({ error: 'Failed to delete team member' });
    }
};