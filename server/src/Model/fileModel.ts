import prisma from "../prismaClient";
import { Prisma } from "@prisma/client";

type Transaction = Prisma.TransactionClient;

const fileModel = {
  async createDocument(
    tx: Transaction,
    text: string,
    sessionId: number,
    valid: boolean,
    name: string,
  ) {
    const document = await tx.document.create({
      data: {
        sessionId,
        content: text,
        isValid: valid,
        filename: name,
      },
    });

    return document;
  },

  async findDocument(sessionId: number) {
    return prisma.document.findUnique({
      where: {
        sessionId,
      },
    });
  },

  async createChunk(
    tx: Transaction,
    text: string,
    documentId: number,
  ) {
    return tx.chunks.create({
      data: {
        text,
        documentId,
      },
    });
  },

  async getChunksByIds(chunkIds: number[]) {
    return prisma.chunks.findMany({
      where: {
        id: {
          in: chunkIds,
        },
      },
    });
  },
};

export default fileModel;