import ClientAlliancePage from './ClientAlliancePage';

type Params = { allianceId: string };

export default async function AlliancePage({ params }: { params: Promise<Params> }) {
  const { allianceId } = await params;
  return <ClientAlliancePage allianceId={allianceId} />;
}
