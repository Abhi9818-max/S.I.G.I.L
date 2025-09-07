import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ClientAlliancePage = dynamic(
  () => import('./ClientAlliancePage'),
  { 
    ssr: false,
    loading: () => (
        <div className="min-h-screen container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    )
  }
);

type AlliancePageProps = {
  params: { allianceId: string };
};

export default function AlliancePage({ params }: AlliancePageProps) {
  return <ClientAlliancePage allianceId={params.allianceId} />;
}
