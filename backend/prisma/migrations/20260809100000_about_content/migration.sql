-- CreateTable
CREATE TABLE "about_content" (
    "id" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPosition" TEXT NOT NULL,
    "ownerDescription" TEXT NOT NULL,
    "ownerImageId" TEXT,
    "companyStory" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "values" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "description" TEXT,
    "imageId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "about_content_ownerImageId_key" ON "about_content"("ownerImageId");

-- CreateIndex
CREATE INDEX "about_team_members_displayOrder_idx" ON "about_team_members"("displayOrder");

-- CreateIndex
CREATE INDEX "about_team_members_isActive_idx" ON "about_team_members"("isActive");

-- AddForeignKey
ALTER TABLE "about_content" ADD CONSTRAINT "about_content_ownerImageId_fkey" FOREIGN KEY ("ownerImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_team_members" ADD CONSTRAINT "about_team_members_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
