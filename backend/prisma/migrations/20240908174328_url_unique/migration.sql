/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Stream` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Stream_url_key" ON "Stream"("url");
