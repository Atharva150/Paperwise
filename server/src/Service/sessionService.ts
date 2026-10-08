import fileModel from "../Model/fileModel";
import sessionModel from "../Model/sessionModel";
import { AppError } from "../app";
import {
  searchDocumentInRagService,
  generateRagService,
} from "../utils/ragClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const sessionService = {
  // async create(userId: number) {
  //   const session = await sessionModel.create(userId);
  //   return session;
  // },

  async delete(userId: number, sessionId: number) {
    const session =
      await sessionModel.getSingleSession(sessionId);

    if (!session) {
      throw new AppError(
        "Session does not exist",
        404,
      );
    }

    if (session.userId !== userId) {
      throw new AppError(
        "UNAUTHORISED",
        403,
      );
    }

    const result =
      await sessionModel.deleteSession(
        sessionId,
        userId,
      );

    return result;
  },

  async messageQuestion(
    question: string,
    sessionId: number,
    userId: number,
  ) {
    const session =
      await sessionModel.getSingleSession(
        sessionId,
      );

    if (!session) {
      throw new AppError(
        "Session does not exist",
        404,
      );
    }

    if (session.userId !== userId) {
      throw new AppError(
        "UNAUTHORISED",
        403,
      );
    }

    const document =
      await fileModel.findDocument(
        sessionId,
      );

    if (!document) {
      throw new AppError(
        "NO DOCUMENT EXISTS",
        500,
      );
    }

    let context = "";

    if (document.isValid) {
      const searchResult =
        await searchDocumentInRagService(
          document.id,
          question,
          3,
        );

      const chunkIds =
        searchResult.results.map(
          (result) => result.chunk_id,
        );

      const chunks: {
        id: number;
        text: string;
      }[] =
        await fileModel.getChunksByIds(
          chunkIds,
        );

      const chunkMap = new Map(
        chunks.map((chunk) => [
          chunk.id,
          chunk.text,
        ]),
      );

      context =
        searchResult.results
          .map((result) =>
            chunkMap.get(
              result.chunk_id,
            ),
          )
          .filter(
            (
              text,
            ): text is string =>
              Boolean(text),
          )
          .join("\n\n");
    } else {
      context =
        document.content.slice(
          0,
          3000,
        );
    }

    const messageHistory =
      await sessionModel.getMessageHistory(
        sessionId,
        userId,
      );

    await sessionModel.storeUserMessage(
      question,
      sessionId,
    );

    const history: ChatMessage[] =
      (
        messageHistory?.messages ?? []
      )
        .slice(-4)
        .map((m: any) => ({
          role: m.role as
            | "user"
            | "assistant",
          content: m.content,
        }));

    const generationResult =
      await generateRagService(
        question,
        context,
      );

    const response =
      await sessionModel.storeAiMessage(
        generationResult.answer ||
          "No response Generated",
        sessionId,
      );

    return response;
  },

  async getAllSessions(
    userId: number,
  ) {
    const sessions =
      await sessionModel.getAllSessions(
        userId,
      );

    return sessions;
  },

  async getSingleSession(
    sessionId: number,
    userId: number,
  ) {
    const session =
      await sessionModel.getSingleSession(
        sessionId,
      );

    if (session?.userId !== userId) {
      throw new AppError(
        "UNAUTHORISED",
        403,
      );
    }

    return session;
  },
};

export default sessionService;