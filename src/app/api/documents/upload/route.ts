import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { fileToDocument } from "@/lib/import-file";
import { titleFromFilename, validateUploadFile } from "@/lib/validation";
import { ALLOWED_UPLOAD_LABEL, MAX_UPLOAD_BYTES } from "@/lib/constants";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Upload a file using multipart form data.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError(`Choose a ${ALLOWED_UPLOAD_LABEL} file (max ${MAX_UPLOAD_BYTES / 1024} KB).`, 400);
  }

  const check = validateUploadFile(file.name, file.size);
  if (!check.ok) return jsonError(check.error, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.includes(0)) {
    return jsonError("The file looks binary. Upload UTF-8 .txt or .md only.", 400);
  }

  const text = buffer.toString("utf8");
  const content = fileToDocument(check.extension, text);

  const document = await prisma.document.create({
    data: {
      title: titleFromFilename(file.name),
      content: JSON.stringify(content),
      ownerId: auth.user.id,
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    {
      document: {
        id: document.id,
        title: document.title,
        updatedAt: document.updatedAt.toISOString(),
        createdAt: document.createdAt.toISOString(),
        owner: document.owner,
      },
    },
    { status: 201 },
  );
}
