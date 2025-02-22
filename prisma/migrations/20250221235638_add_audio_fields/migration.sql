-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isAudio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isResponseToAudio" BOOLEAN NOT NULL DEFAULT false;
