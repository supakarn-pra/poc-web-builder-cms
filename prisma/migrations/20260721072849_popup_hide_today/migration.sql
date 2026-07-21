-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Popup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "websiteId" TEXT NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "pageIds" TEXT NOT NULL DEFAULT 'ALL',
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "allowHideToday" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Popup_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Popup" ("createdAt", "enabled", "id", "imageUrl", "pageIds", "sortIndex", "text", "title", "updatedAt", "websiteId") SELECT "createdAt", "enabled", "id", "imageUrl", "pageIds", "sortIndex", "text", "title", "updatedAt", "websiteId" FROM "Popup";
DROP TABLE "Popup";
ALTER TABLE "new_Popup" RENAME TO "Popup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
