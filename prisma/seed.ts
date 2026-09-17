import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EMPTY_DOC } from "../src/lib/tiptap-doc";

const prisma = new PrismaClient();

const welcomeDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to Ajaia Docs" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a seeded product brief. Try " },
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
        { type: "text", text: ", " },
        { type: "text", text: "italic", marks: [{ type: "italic" }] },
        { type: "text", text: ", and " },
        { type: "text", text: "underline", marks: [{ type: "underline" }] },
        { type: "text", text: "." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Reviewer checklist" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Edit this document and refresh — it should persist." }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Share it with alan@ajaia.dev if it is not already shared." }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Log in as Alan and open it from Shared with me." }],
            },
          ],
        },
      ],
    },
    {
      type: "orderedList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Upload a .txt or .md file from the docs list." }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Confirm owned vs shared badges stay distinct." }],
            },
          ],
        },
      ],
    },
  ],
};

const notesDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Engineering notes" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Alan owns this document. It is private unless he shares it.",
        },
      ],
    },
  ],
};

async function main() {
  const passwordHash = await bcrypt.hash("docs1234", 10);

  await prisma.share.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  const ada = await prisma.user.create({
    data: {
      email: "ada@ajaia.dev",
      name: "Ada Lovelace",
      passwordHash,
    },
  });
  const alan = await prisma.user.create({
    data: {
      email: "alan@ajaia.dev",
      name: "Alan Turing",
      passwordHash,
    },
  });
  await prisma.user.create({
    data: {
      email: "grace@ajaia.dev",
      name: "Grace Hopper",
      passwordHash,
    },
  });

  const welcome = await prisma.document.create({
    data: {
      title: "Product brief",
      content: JSON.stringify(welcomeDoc),
      ownerId: ada.id,
    },
  });

  await prisma.share.create({
    data: { documentId: welcome.id, userId: alan.id },
  });

  await prisma.document.create({
    data: {
      title: "Engineering notes",
      content: JSON.stringify(notesDoc),
      ownerId: alan.id,
    },
  });

  await prisma.document.create({
    data: {
      title: "Untitled draft",
      content: JSON.stringify(EMPTY_DOC),
      ownerId: ada.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
