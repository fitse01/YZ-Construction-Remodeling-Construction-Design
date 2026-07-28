import { PrismaClient, ProjectCategory, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const project = await prisma.project.create({
      data: {
        title: "Test Video Project",
        slug: `test-video-project-${Date.now().toString().slice(-4)}`,
        location: "Silver Spring, MD",
        description: "Test description of a video upload project",
        category: "RESIDENTIAL" as ProjectCategory,
        completionDate: null,
        clientName: null,
        isFeatured: false,
        tags: [],
        videoUrl: "",
        videoThumbnailUrl: "",
        youtubeUrl: "",
        uploadedVideo: "",
        beforeImageUrl: "",
        afterImageUrl: "",
        featuredImageId: null,
        seoTitle: "",
        seoDescription: "",
        displayOrder: 0,
        status: "DRAFT" as ProjectStatus,
      }
    });
    console.log("Success! Inserted project:", project);
  } catch (error) {
    console.error("Prisma Insert Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
