-- AlterTable
ALTER TABLE "EndpointExecution" ADD COLUMN     "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "responseSize" INTEGER NOT NULL DEFAULT 0;
