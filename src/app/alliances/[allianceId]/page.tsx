import ClientAlliancePage from './ClientAlliancePage';

type Params = { allianceId: string };

export default async function AlliancePage({ params }: { params: Params }) {
  const { allianceId } = params;
  return <ClientAlliancePage allianceId={allianceId} />;
}
