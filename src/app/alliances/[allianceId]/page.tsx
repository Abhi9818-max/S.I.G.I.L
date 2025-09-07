import ClientAlliancePage from './ClientAlliancePage';

type AlliancePageProps = {
  params: { allianceId: string };
};

export default function AlliancePage({ params }: AlliancePageProps) {
  return <ClientAlliancePage allianceId={params.allianceId} />;
}
