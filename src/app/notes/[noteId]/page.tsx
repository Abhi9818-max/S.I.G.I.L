import ClientNotePage from './ClientNotePage';

type Params = { noteId: string };

export async function generateStaticParams() {
  // This page is dynamic, so we return an empty array.
  // Next.js will then generate pages on-demand.
  return [];
}

export default async function NotePage({ params }: { params: Promise<Params> }) {
  const { noteId } = await params;
  return <ClientNotePage noteId={noteId} />;
}
