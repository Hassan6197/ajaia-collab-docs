import { DocumentEditor } from "@/components/DocumentEditor";

export default async function DocumentPage({ params }: PageProps<"/docs/[id]">) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <DocumentEditor documentId={id} />
    </main>
  );
}
