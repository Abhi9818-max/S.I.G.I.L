
import React from 'react';
import { getPublicUserData } from '@/lib/server/get-public-data';
import ProfileCard from '@/components/profile/ProfileCard';
import { calculateUserLevelInfo, getContributionLevel } from '@/lib/config';
import type { Metadata, ResolvingMetadata } from 'next';
import type { UserData, TaskDefinition, RecordEntry, UserLevelInfo } from '@/types';
import { XP_CONFIG } from '@/lib/xp-config';

type Props = {
  params: { userId: string }
}

const calculateXpForRecord = (
  recordValue: number,
  task: TaskDefinition | undefined,
  userLevel: number
): number => {
    if (!task || !XP_CONFIG || XP_CONFIG.length === 0) return 0;
    
    const levelConfig = XP_CONFIG.find(c => c.level === userLevel);
    if (!levelConfig) return 0;

    let value = recordValue;
    if (task.unit === 'hours') {
        value = recordValue * 60;
    }

    const phase = getContributionLevel(value, task.intensityThresholds);
    if (phase === 0) return 0;

    const baseXP = task.priority === 'high' ? levelConfig.base_high_xp : levelConfig.base_low_xp;
    
    const phasePercentages = [0, 0.25, 0.50, 0.75, 1.00];
    const percentage = phasePercentages[phase] || 0;

    return Math.round(baseXP * percentage);
};

const getFriendLevelInfo = (friendData: UserData): UserLevelInfo | null => {
    if (!friendData) return null;

    const getFriendTaskDefinitionById = (taskId: string): TaskDefinition | undefined => {
        return friendData.taskDefinitions?.find(task => task.id === taskId);
    };
    
    let cumulativeXp = 0;
    const sortedRecords = [...(friendData.records || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let tempXpForLevelCalc = 0;
    for (const record of sortedRecords) {
        const { currentLevel } = calculateUserLevelInfo(tempXpForLevelCalc);
        const task = getFriendTaskDefinitionById(record.taskType || '');
        const recordXp = calculateXpForRecord(record.value, task, currentLevel);
        tempXpForLevelCalc += recordXp;
    }
    cumulativeXp = tempXpForLevelCalc;

    const totalExperience = cumulativeXp + (friendData.bonusPoints || 0);

    return calculateUserLevelInfo(totalExperience);
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userId = params.userId;
  const userData = await getPublicUserData(userId);

  if (!userData) {
    return {
      title: 'User Not Found | S.I.G.I.L.',
    }
  }

  return {
    title: `${userData.username}'s Profile | S.I.G.I.L.`,
    description: `View the public profile and progress of ${userData.username}.`,
    openGraph: {
      title: `${userData.username}'s Profile`,
      description: userData.bio || 'Check out their progress on S.I.G.I.L.',
      images: [
        {
          url: userData.photoURL || '/default-avatar.png',
          width: 200,
          height: 200,
          alt: `${userData.username}'s avatar`,
        },
      ],
      type: 'profile',
      username: userData.username,
      url: `/public/${userId}`,
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = params;
  const userData = await getPublicUserData(userId);

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center">
        <div>
            <h1 className="text-2xl font-bold">User Not Found</h1>
            <p className="text-muted-foreground">The profile you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const levelInfo = getFriendLevelInfo(userData);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="animate-fade-in-up">
        {levelInfo && (
            <ProfileCard 
                levelInfo={levelInfo}
                userData={userData}
                userAvatar={userData.photoURL || `/avatars/avatar1.jpeg`}
                displayStat="tierName"
            />
        )}
      </div>
    </div>
  );
}
