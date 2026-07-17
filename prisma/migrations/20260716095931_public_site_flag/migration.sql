-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Website" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,
    "globalStyle" TEXT NOT NULL,
    "headerRow" TEXT,
    "footerRow" TEXT,
    "siteType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "Website_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Website_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Website" ("createdAt", "customDomain", "footerRow", "globalStyle", "headerRow", "id", "name", "ownerId", "parentId", "publishedAt", "siteType", "status", "subdomain", "updatedAt") SELECT "createdAt", "customDomain", "footerRow", "globalStyle", "headerRow", "id", "name", "ownerId", "parentId", "publishedAt", "siteType", "status", "subdomain", "updatedAt" FROM "Website";
DROP TABLE "Website";
ALTER TABLE "new_Website" RENAME TO "Website";
CREATE UNIQUE INDEX "Website_subdomain_key" ON "Website"("subdomain");
CREATE UNIQUE INDEX "Website_customDomain_key" ON "Website"("customDomain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
