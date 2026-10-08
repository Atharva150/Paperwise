import { PDFParse } from "pdf-parse";
import sessionModel from "../Model/sessionModel";
import fileModel from "../Model/fileModel";
import prisma from "../prismaClient";
import createChunk from "../utils/chunk";
import credibilityCheck from "../utils/credibilityCheck";
import { indexDocumentInRagService } from "../utils/ragClient";
import { AppError } from "../app";


const fileService = {

  async upload(
    file: Express.Multer.File,
    userId: number,
  ) {

    async function parsePDF(
      data: Express.Multer.File["buffer"],
    ) {

      const pdf = new PDFParse({ data });

      const result = await pdf.getText();

      await pdf.destroy();

      const text = result.text.replace(/\s+/g, " ");

      return text;
    }


    const content = await parsePDF(file.buffer);


    const session = await sessionModel.create(userId);

    if (!session) {
      throw new AppError(
        "Session does not exist",
        404,
      );
    }


    const words = content.split(/\s+/);

    const credible: boolean =
      credibilityCheck(content);


    let chunks: string[] = [];


    if (credible) {

      const createdChunks =
        await createChunk(words);

      if (createdChunks === false) {
        return;
      }

      chunks = createdChunks;
    }


    console.log(credible);


    const transactionResult =
      await prisma.$transaction(
        async (tx: any) => {

          console.log(
            "Starting database transaction",
          );


          const document =
            await fileModel.createDocument(
              tx,
              content,
              session.id,
              credible,
              file.originalname,
            );


          console.log(
            "Document created:",
            document.id,
          );


          const chunkIds: number[] = [];


          if (credible) {

            console.log(
              `Starting insertion of ${chunks.length} chunks`,
            );


            for (
              let i = 0;
              i < chunks.length;
              i++
            ) {

              console.log(
                `Inserting chunk ${i + 1}/${chunks.length}`,
              );


              const chunk =
                await fileModel.createChunk(
                  tx,
                  chunks[i],
                  document.id,
                );


              chunkIds.push(chunk.id);


              console.log(
                `Inserted chunk ${i + 1}/${chunks.length}`,
              );
            }
          }


          console.log(
            "Finished database transaction work",
          );


          return {
            document,
            chunkIds,
          };
        },
        {
          timeout: 30000,
        },
      );


    console.log(
      "Transaction completed",
    );


    if (credible) {

      console.log(
        "Sending chunks to Python RAG service",
      );


      const ragChunks = chunks.map(
        (text, index) => ({
          chunk_id: transactionResult.chunkIds[index],
          text,
        }),
      );


      const ragResult =
        await indexDocumentInRagService(
          transactionResult.document.id,
          ragChunks,
        );


      console.log(
        "Python RAG indexing completed:",
        ragResult,
      );
    }


    return {
      session,
      isValid:
        transactionResult.document.isValid,
    };
  },
};


export default fileService;