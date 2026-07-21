import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getSiteSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.siteSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          companyName: 'YZ Construction, LLC',
          tagline: 'Building Better Spaces',
          ownerName: 'Yohannes Zewde',
          email: 'yohanneszewdebayu@gmail.com',
          phone: '(240) 781-8778',
          address: 'Silver Spring',
          city: 'Silver Spring',
          state: 'MD',
          zip: '20906',
          hours: 'Mon-Fri 8am-6pm, Sat 9am-1pm',
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get site settings error:', error);
    res.status(500).json({ error: 'Failed to fetch site settings' });
  }
};

export const updateSiteSettings = async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      tagline,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      hours,
      logoUrl,
      faviconUrl,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
      googleMapsUrl,
      metaTitle,
      metaDescription,
      googleAnalyticsId,
    } = req.body;

    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.siteSettings.create({
        data: {
          companyName,
          tagline,
          ownerName,
          email,
          phone,
          address,
          city,
          state,
          zip,
          hours,
          logoUrl,
          faviconUrl,
          facebookUrl,
          instagramUrl,
          linkedinUrl,
          googleMapsUrl,
          metaTitle,
          metaDescription,
          googleAnalyticsId,
        },
      });
    } else {
      // Update existing
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          companyName,
          tagline,
          ownerName,
          email,
          phone,
          address,
          city,
          state,
          zip,
          hours,
          logoUrl,
          faviconUrl,
          facebookUrl,
          instagramUrl,
          linkedinUrl,
          googleMapsUrl,
          metaTitle,
          metaDescription,
          googleAnalyticsId,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Update site settings error:', error);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
};

export const getHomePage = async (req: AuthRequest, res: Response) => {
  try {
    let homePage = await prisma.homePage.findFirst({
      include: {
        heroImage: true,
      },
    });

    // Create default home page if none exists
    if (!homePage) {
      homePage = await prisma.homePage.create({
        data: {
          heroTitle: 'Building better spaces for the way you live and work.',
          heroSubtitle: 'A boutique design-build studio delivering premium residential and commercial construction across Maryland, DC, and Virginia.',
          heroCtaText: 'Get a Free Estimate',
          heroCtaLink: '/contact',
          servicesTitle: 'Design-build services under one roof.',
          servicesSubtitle: 'One team from first sketch to final punch-list with the crews, credentials, and coordination to deliver every scope, big or small.',
          projectsTitle: 'Recent projects across the DMV.',
          projectsSubtitle: 'Every project below was designed, permitted, and built by the YZ Construction team.',
          testimonialsTitle: 'Trusted by homeowners and business owners.',
          testimonialsSubtitle: '120+ reviews, a stack of 5-star Google ratings, and a growing library of guides.',
          ctaTitle: "Let's talk about your project.",
          ctaSubtitle: 'Free on-site consultation. No obligation, no pressure just honest numbers and a realistic timeline.',
          ctaButtonText: 'Free Estimate',
          ctaButtonLink: '/contact',
        },
        include: {
          heroImage: true,
        },
      });
    }

    res.json(homePage);
  } catch (error) {
    console.error('Get home page error:', error);
    res.status(500).json({ error: 'Failed to fetch home page content' });
  }
};

export const updateHomePage = async (req: AuthRequest, res: Response) => {
  try {
    const {
      heroTitle,
      heroSubtitle,
      heroCtaText,
      heroCtaLink,
      heroImageId,
      statsTitle,
      statsSubtitle,
      servicesTitle,
      servicesSubtitle,
      projectsTitle,
      projectsSubtitle,
      testimonialsTitle,
      testimonialsSubtitle,
      ctaTitle,
      ctaSubtitle,
      ctaButtonText,
      ctaButtonLink,
    } = req.body;

    let homePage = await prisma.homePage.findFirst();

    if (!homePage) {
      // Create if doesn't exist
      homePage = await prisma.homePage.create({
        data: {
          heroTitle,
          heroSubtitle,
          heroCtaText,
          heroCtaLink,
          heroImageId,
          statsTitle,
          statsSubtitle,
          servicesTitle,
          servicesSubtitle,
          projectsTitle,
          projectsSubtitle,
          testimonialsTitle,
          testimonialsSubtitle,
          ctaTitle,
          ctaSubtitle,
          ctaButtonText,
          ctaButtonLink,
        },
        include: {
          heroImage: true,
        },
      });
    } else {
      // Update existing
      homePage = await prisma.homePage.update({
        where: { id: homePage.id },
        data: {
          heroTitle,
          heroSubtitle,
          heroCtaText,
          heroCtaLink,
          heroImageId,
          statsTitle,
          statsSubtitle,
          servicesTitle,
          servicesSubtitle,
          projectsTitle,
          projectsSubtitle,
          testimonialsTitle,
          testimonialsSubtitle,
          ctaTitle,
          ctaSubtitle,
          ctaButtonText,
          ctaButtonLink,
        },
        include: {
          heroImage: true,
        },
      });
    }

    res.json(homePage);
  } catch (error) {
    console.error('Update home page error:', error);
    res.status(500).json({ error: 'Failed to update home page content' });
  }
};
