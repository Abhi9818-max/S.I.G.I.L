

export type TaskUnit = 'count' | 'minutes' | 'hours' | 'pages' | 'generic' | 'custom';
export type TaskFrequency = 'daily' | 'weekly';
export type TaskStatus = 'active' | 'paused' | 'completed';

export interface RecordEntry {
  id: string; // Unique identifier for each record
  date: string; // YYYY-MM-DD format
  value: number;
  notes?: string; // Optional notes
  taskType?: string; // ID of the task type
}

export interface DayData {
  date: string; // YYYY-MM-DD
  value: number | null;
  level: number; // For color coding or intensity, derived from value
  taskType?: string; // ID of the task type for this day's primary record
  taskName?: string; // Display name of the task
  taskColor?: string; // Direct color string for the task
}

// New types for monthly graph structure
export interface MonthlyDayData extends DayData {
  isPlaceholder?: boolean;
}

export interface MonthColumn {
  monthLabel: string; // e.g., "Jan 2023"
  year: number;
  month: number; // 0-indexed
  weeks: MonthlyDayData[][]; // Array of weeks, each week is an array of 7 days
}

// Definition for a task type
export interface TaskDefinition {
  id: string;
  name: string;
  color: string; // HSL color string e.g., 'hsl(210 90% 70%)'
  status: TaskStatus; // 'active', 'paused', or 'completed'
  priority?: 'normal' | 'high'; // Task priority
  unit?: TaskUnit; // The unit of measurement for this task's value
  customUnitName?: string; // Optional: name for the custom unit
  intensityThresholds?: readonly number[]; // Optional: Array of 4 numbers for custom intensity levels [T1, T2, T3, T4]
  darkStreakEnabled?: boolean; // Optional: Enable high-stakes daily streak for this task
  frequencyType?: TaskFrequency; // 'daily' or 'weekly'
  frequencyCount?: number; // e.g., for 'weekly', how many times per week
  completedDate?: string; // ISO date string for when a task was completed
}

// For progress charts
export interface AggregatedTimeDataPoint {
  date: string; // Could be start of week, month, etc.
  value: number;
  [key: string]: any; // For additional properties like task-specific values if doing stacked charts
}
export type ProgressChartTimeRange = 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'yearly';

export interface WeeklyProgressStats {
  total: number;
  startDate: Date;
  endDate: Date;
}

// For User Leveling System
// totalAccumulatedValue here represents the total experience points (base record values + bonuses)
export interface UserLevelInfo {
  currentLevel: number;
  levelName: string;
  tierName: string;
  tierIcon: string;
  tierSlug: string; // e.g., "unknown-blades"
  tierGroup: number; // e.g., 1 for Tiers 1-2, 2 for Tiers 3-4 etc.
  welcomeMessage: string; // Welcome message for this tier
  progressPercentage: number;
  currentLevelValueStart: number; // Experience points required to enter the current level
  nextLevelValueTarget: number | null; // Experience points required for the next level
  totalAccumulatedValue: number; // Total experience points earned by the user
  isMaxLevel: boolean;
  valueTowardsNextLevel: number; // Experience points earned within the current level
  pointsForNextLevel: number | null; // Total experience points needed to reach the next level from start of current level
}

// New type for the user-defined level config
export interface LevelXPConfig {
    level: number;
    xp_required: number;
    base_low_xp: number;
    base_high_xp: number;
}
    
// Specific for TIER_INFO in config.ts
export interface TierConfig {
  name: string;
  slug: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
  tierGroup: number;
  welcomeMessage: string;
  tierEntryBonus?: number; // Bonus XP for entering this tier
}

// For To-Do List
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO date string
  dueDate?: string; // Optional: YYYY-MM-DD format
  penalty?: number; // Optional: XP penalty if overdue
  penaltyApplied?: boolean; // Optional: whether the penalty has been applied
  dare?: string; // Optional: A dare for failing the pact
  dareCompleted?: boolean; // Optional: whether the dare was completed
  dareAssignedAt?: string; // Optional: ISO date string for when dare was assigned
  insultApplied?: boolean; // Optional: whether the insult for a missed dare has been shown
}

// For Notes
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO date string
}

// For Constellations
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface Constellation {
  taskId: string;
  taskName: string;
  taskColor: string;
  nodes: SkillNode[];
}

// For Insights Page
export interface TaskDistributionData {
  name: string;
  value: number;
  percentage?: number;
  fill: string; // Changed from color to fill to match recharts
}

export interface ProductivityByDayData {
    day: string;
    total: number;
}

export interface DailyTimeBreakdownData {
  name: string;
  value: number; // in minutes
  color: string;
}


// For Achievements
export type AchievementCategory = 'level' | 'streak' | 'skills' | 'creation' | 'title';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: React.ElementType;
  isSecret?: boolean; // If true, hide details until unlocked
  isTitle?: boolean; // If true, can be displayed as a user title
  isClaimable?: boolean;
  costSP?: number;
  costTaskId?: string;
  check: (context: {
    levelInfo: UserLevelInfo;
    streaks: Record<string, number>;
    unlockedSkillCount: number;
    loreEntryCount: number;
    getAggregateSumForTask: (taskId: string) => number;
  }) => boolean;
}

// For High Goals
export interface HighGoal {
  id: string;
  name: string;
  taskId: string;
  targetValue: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

// For Settings
export type DareCategory = 'standard' | '18+' | 'serious';
export type ProfileCardStat = 'tierName' | 'currentStreak' | 'totalXp' | 'equippedTitle';
export type PrivacySetting = 'everyone' | 'friends_only';
export interface DashboardSettings {
  showTotalLast30Days: boolean;
  totalDays: number;
  showCurrentStreak: boolean;
  showDailyConsistency: boolean;
  consistencyDays: number;
  showHighGoalStat: boolean;
  showTaskFilterBar: boolean;
  showContributionGraph: boolean;
  showTodoList: boolean;
  showProgressChart: boolean;
  progressChartTimeRange: ProgressChartTimeRange;
  showTimeBreakdownChart: boolean;
  pieChartLabelFormat?: 'percentage' | 'time';
  profileCardStat?: ProfileCardStat;
  dareCategory?: DareCategory;
  calendarView?: 'classic' | 'modern';
  taskCardTimeRange?: 1 | 3 | 6 | 12;
}

// NEW: For Task Mastery
export interface TaskMastery {
    level: number;
    xp: number;
}

export interface TaskMasteryInfo extends TaskMastery {
    xpForNextLevel: number;
    progressPercentage: number;
    xpBonus: number; // The % bonus this level gives
}

// NEW: For Economy & Reputation
export interface Faction {
  id: string;
  name: string;
  description: string;
  taskCategoryId: string; // Links faction to a task definition ID
  icon: React.ElementType;
  color: string;
}

export interface ReputationLevel {
  level: number;
  name: string;
  minRep: number;
  reward: {
    type: 'title' | 'xp_boost' | 'currency';
    value: string | number;
    description: string;
  }
}

// For Marketplace
export interface MarketplaceListing {
  id: string;
  itemId: string; // The achievement ID
  itemName: string;
  itemDescription?: string;
  itemType: 'title';
  sellerId: string;
  sellerUsername: string;
  price: number;
  createdAt: string; // ISO date string
}

// For Social Feed
export interface Comment {
  id: string;
  authorId: string;
  authorUsername: string;
  authorPhotoURL?: string | null;
  content: string;
  createdAt: string; // ISO
  likes: string[]; // Array of user IDs who liked the comment
  parentId?: string | null; // ID of the comment this is a reply to
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO
  editedAt?: string; // ISO
  likes: string[]; // Array of user IDs who liked
  comments: Comment[];
}

// NEW: For Notifications
export type NotificationType = 
    | 'friend_request' 
    | 'relationship_proposal' 
    | 'alliance_invite' 
    | 'alliance_challenge' 
    | 'friend_activity'
    | 'comment_on_post';

export interface Notification {
    id: string;
    recipientId: string;
    senderId: string;
    senderUsername: string;
    senderPhotoURL?: string | null;
    type: NotificationType;
    message: string; // e.g., "sent you a friend request." or "completed the task 'Reading'."
    link?: string; // e.g., /friends/{senderId}
    isRead: boolean;
    createdAt: string; // ISO
    // Add original request data for action buttons
    originalRequest?: FriendRequest | RelationshipProposal | AllianceInvitation | AllianceChallenge;
}

// For Auth/User Data
export interface UserData {
    uid?: string;
    username: string;
    username_lowercase?: string; // For case-insensitive search
    photoURL?: string | null;
    bio?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    records?: RecordEntry[];
    taskDefinitions?: TaskDefinition[];
    bonusPoints?: number;
    unlockedAchievements?: string[];
    claimableAchievements?: string[];
    spentSkillPoints?: Record<string, number>;
    unlockedSkills?: string[];
    freezeCrystals?: number;
    awardedStreakMilestones?: Record<string, number[]>;
    highGoals?: HighGoal[];
    todoItems?: TodoItem[];
    notes?: Note[];
    dashboardSettings?: DashboardSettings;
    masterBonusAwarded?: boolean;
    taskMastery?: Record<string, TaskMastery>;
    aetherShards?: number;
    reputation?: Record<string, number>; // e.g., { 'scholars-guild': 1250, 'iron-legion': 500 }
    marketplaceListings?: MarketplaceListing[]; // User's own active listings
    equippedTitleId?: string | null | undefined;
    pinnedAllianceIds?: string[];
    posts?: Post[];
    privacySettings?: {
        pacts?: PrivacySetting;
        activity?: PrivacySetting;
    };
}

// For Friends feature
export interface SearchedUser {
    uid: string;
    username: string;
    photoURL?: string | null;
}

export interface FriendRequest {
    id: string;
    senderId: string;
    senderUsername: string;
    senderPhotoURL?: string | null;
    recipientId: string;
    recipientUsername: string;
    recipientPhotoURL?: string | null;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
}

export interface Friend {
    uid: string;
    username: string;
    nickname?: string;
    relationship?: string;
    photoURL?: string | null;
    since: string;
    taskDefinitions?: TaskDefinition[];
}

export interface RelationshipProposal {
    id: string;
    senderId: string;
    senderUsername: string;
    senderPhotoURL?: string | null;
    recipientId: string;
    recipientUsername: string;
    recipientPhotoURL?: string | null;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
    relationship: string;
    correspondingRelationship: string;
}

// For Alliances (Group Goals)
export interface AllianceMember {
  uid: string;
  username: string;
  nickname?: string;
  photoURL?: string | null;
  contribution: number;
}

export type AllianceStatus = 'ongoing' | 'completed' | 'failed';

export interface Alliance {
  id: string;
  name: string;
  description: string;
  photoURL: string;
  creatorId: string;
  taskId: string;
  taskName: string;
  taskColor: string;
  target: number;
  progress: number;
  startDate: string; // ISO
  endDate: string; // ISO
  createdAt: string; // ISO
  members: AllianceMember[];
  memberIds: string[];
  dare?: string; // Optional dare for failed alliances
  status: AllianceStatus;
  activeChallengeId?: string;
  opponentDetails?: {
    allianceId: string;
    allianceName: string;
    opponentProgress?: number;
  };
}

export interface AllianceInvitation {
  id: string;
  allianceId: string;
  allianceName: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string; // ISO
}

export interface AllianceChallenge {
  id: string;
  challengerAllianceId: string;
  challengerAllianceName: string;
  challengerCreatorId: string;
  challengedAllianceId: string;
  challengedAllianceName: string;
  challengedCreatorId: string;
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed';
  createdAt: string; // ISO
}
