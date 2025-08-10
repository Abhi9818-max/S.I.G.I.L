
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart2, Activity } from 'lucide-react';
import type { UserData } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { calculateUserLevelInfo } from '@/lib/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import Link from 'next/link';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { getPublicUserData } from '@/lib/server/get-public-data';


// Simple hash function to get a number from a string
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

type Props = {
    params: { userId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const userId = params.userId;
  const userData = await getPublicUserData(userId);

  if (!userData) {
    return {
      title: 'Profile Not Found',
    }
  }

  const userAvatar = userData.photoURL || `/avatars/avatar${(simpleHash(userId) % 12) + 1}.jpeg`;
  const pageTitle = `${userData.username}'s Profile | S.I.G.I.L.`;
  const description = userData.bio || `Check out ${userData.username}'s progress on S.I.G.I.L.`;
  
  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      images: [
        {
          url: userAvatar,
          width: 256,
          height: 256,
          alt: `${userData.username}'s avatar`,
        },
      ],
      type: 'profile',
      profile: {
        username: userData.username,
      },
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: description,
      images: [userAvatar],
    },
  }
}


export default async function PublicProfilePage({ params }: Props) {
    const userId = params.userId;
    const friendData = await getPublicUserData(userId);

    if (!friendData) {
        notFound();
    }
    
    const friendRecords = friendData.records || [];
    const friendTasks = friendData.taskDefinitions || [];
    
    const totalRecordValue = friendRecords.reduce((sum, r) => sum + r.value, 0) || 0;
    const totalExperience = totalRecordValue + (friendData.bonusPoints || 0);
    const friendLevelInfo = calculateUserLevelInfo(totalExperience);

    const friendAvatar = friendData.photoURL || `/avatars/avatar${(simpleHash(userId) % 12) + 1}.jpeg`;

    return (
        <div className={cn("min-h-screen flex flex-col", friendLevelInfo ? `page-tier-group-${friendLevelInfo.tierGroup}` : 'page-tier-group-1')}>
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to S.I.G.I.L.
                    </Link>
                </Button>

                <div className="pt-6 md:p-0">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                        <div className="flex items-center gap-4 md:items-start">
                             <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                                <AvatarImage src={friendAvatar} alt={friendData.username} />
                                <AvatarFallback>{friendData.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                             <div className="md:hidden">
                                <h1 className="text-lg font-semibold">{friendData.username}</h1>
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                <h1 className="text-xl font-semibold">{friendData.username}</h1>
                                {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                            </div>
                             <div className="mt-1 md:hidden">
                                {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                            </div>
                            <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                {friendData.bio || "No bio yet."}
                            </p>
                        </div>
                    </div>
                </div>
                
                <Tabs defaultValue="stats" className="w-full">
                    <TabsList>
                    <TabsTrigger value="stats"><BarChart2 className="mr-2 h-4 w-4" />Stats</TabsTrigger>
                    <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" />Activity</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="stats" className="mt-6">
                    <StatsPanel friendData={friendData} />
                    </TabsContent>

                    <TabsContent value="activity" className="mt-6">
                        <div className="mb-8 max-w-4xl mx-auto">
                            <h2 className="text-2xl font-semibold mb-4">Daily Breakdown</h2>
                            <DailyTimeBreakdownChart
                                records={friendRecords}
                                taskDefinitions={friendTasks}
                                hideFooter={true}
                            />
                        </div>
                        <div>
                        <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                        <ContributionGraph 
                            year={new Date().getFullYear()}
                            onDayClick={() => {}} 
                            selectedTaskFilterId={null}
                            records={friendRecords} 
                            taskDefinitions={friendTasks}
                            displayMode="full"
                        />
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};
