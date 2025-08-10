

import type { TaskDefinition, UserLevelInfo, TierConfig } from '@/types';

export const LOCAL_STORAGE_KEY = 'recordTrackerData';
export const LOCAL_STORAGE_TASKS_KEY = 'recordTrackerTaskDefinitions';
export const LOCAL_STORAGE_BONUS_POINTS_KEY = 'recordTrackerBonusPoints';
export const LOCAL_STORAGE_MET_GOALS_KEY = 'recordTrackerMetGoals';
export const LOCAL_STORAGE_HANDLED_STREAKS_KEY = 'recordTrackerHandledStreaks';
export const LOCAL_STORAGE_TODO_KEY = 'sigiLTodoItems';
export const LOCAL_STORAGE_LORE_KEY = 'sigiLLoreEntries';
export const LOCAL_STORAGE_SPENT_SKILL_POINTS_KEY = 'sigiLSpentSkillPoints';
export const LOCAL_STORAGE_UNLOCKED_SKILLS_KEY = 'sigiLUnlockedSkills';
export const LOCAL_STORAGE_HANDLED_DARK_STREAKS_KEY = 'sigiLHandledDarkStreaks';
export const LOCAL_STORAGE_FREEZE_CRYSTALS_KEY = 'sigiLFreezeCrystals';
export const LOCAL_STORAGE_AWARDED_STREAK_MILESTONES_KEY = 'sigiLAwardedStreakMilestones';
export const LOCAL_STORAGE_UNLOCKED_ACHIEVEMENTS_KEY = 'sigiLUnlockedAchievements';
export const LOCAL_STORAGE_HIGH_GOALS_KEY = 'sigiLHighGoals';
export const LOCAL_STORAGE_DASHBOARD_SETTINGS_KEY = 'sigiLDashboardSettings';
export const LOCAL_STORAGE_LAST_VISITED_DATE_KEY = 'sigiLLastVisitedDate';

export const LOCAL_STORAGE_KEYS = [
  LOCAL_STORAGE_KEY,
  LOCAL_STORAGE_TASKS_KEY,
  LOCAL_STORAGE_BONUS_POINTS_KEY,
  LOCAL_STORAGE_MET_GOALS_KEY,
  LOCAL_STORAGE_HANDLED_STREAKS_KEY,
  LOCAL_STORAGE_TODO_KEY,
  LOCAL_STORAGE_LORE_KEY,
  LOCAL_STORAGE_SPENT_SKILL_POINTS_KEY,
  LOCAL_STORAGE_UNLOCKED_SKILLS_KEY,
  LOCAL_STORAGE_HANDLED_DARK_STREAKS_KEY,
  LOCAL_STORAGE_FREEZE_CRYSTALS_KEY,
  LOCAL_STORAGE_AWARDED_STREAK_MILESTONES_KEY,
  LOCAL_STORAGE_UNLOCKED_ACHIEVEMENTS_KEY,
  LOCAL_STORAGE_HIGH_GOALS_KEY,
  LOCAL_STORAGE_DASHBOARD_SETTINGS_KEY,
  LOCAL_STORAGE_LAST_VISITED_DATE_KEY,
];


export const MAX_CONTRIBUTION_LEVEL = 4;
export const NUM_WEEKS_TO_DISPLAY = 52;

// Consistency Breach Settings
export const CONSISTENCY_BREACH_DAYS = 3; // Days of inactivity to trigger a breach
export const CONSISTENCY_BREACH_PENALTY = 50; // XP penalty for a breach

// Dark Streak Settings
export const DARK_STREAK_PENALTY = 150; // High XP penalty for breaking a dark streak
export const STREAK_MILESTONES_FOR_CRYSTALS = [7, 15]; // Days of streak to earn a freeze crystal

export const VALUE_THRESHOLDS: readonly number[] = [5, 10, 15, 20];

export const getContributionLevel = (value: number | null | undefined, customThresholds?: readonly number[]): number => {
  if (value === null || value === undefined || value <= 0) {
    return 0;
  }

  const thresholdsToUse = customThresholds && customThresholds.length === MAX_CONTRIBUTION_LEVEL
                           ? customThresholds
                           : VALUE_THRESHOLDS;

  for (let i = 0; i < thresholdsToUse.length; i++) {
    if (value <= thresholdsToUse[i]) {
      return i + 1;
    }
  }
  return MAX_CONTRIBUTION_LEVEL;
};

export const TASK_DEFINITIONS: TaskDefinition[] = [
    { id: 'work', name: 'Work', color: 'hsl(210 80% 60%)' },      // Bright Blue
    { id: 'exercise', name: 'Exercise', color: 'hsl(140 70% 55%)' },  // Vibrant Green
    { id: 'learning', name: 'Learning', color: 'hsl(45 90% 55%)' },   // Sunny Yellow
    { id: 'personal', name: 'Personal', color: 'hsl(290 80% 65%)' },  // Bright Purple
    { id: 'reading', name: 'Reading', color: 'hsl(25 95% 60%)' },    // Energetic Orange
    { id: 'other', name: 'Other', color: 'hsl(0 0% 80%)' },          // Neutral Light Grey
];


export const DEFAULT_TASK_COLOR = 'hsl(0 0% 50%)';

// User Leveling System - 100 Levels
export const LEVEL_NAMES: readonly string[] = [
  // Tier 1 – Unknown Blades (Lv. 1–10)
  "Ashborn", "Hollow Wolf", "Grey Fang", "Nameless Stride", "Iron Howl",
  "First Fang", "Ragetooth", "Bloodless", "Stoneveil", "Shadecaller",
  // Tier 2 – Vowbreakers (Lv. 11–20)
  "Driftblade", "Red Crest", "Thornwrithe", "Coldbrand", "Vow Eater",
  "Dustwake", "Hollowmark", "Chainspire", "Dirge Kin", "Lowborn Fang",
  // Tier 3 – Silent Names (Lv. 21–30)
  "Echo Vein", "Ruinborne", "Black Ember", "Crimson Husk", "Gravemark",
  "Nine Fade", "Dead Script", "Blind Spire", "Murk Sigil", "Split Veil",
  // Tier 4 – Forgotten Lineage (Lv. 31–40)
  "Ashrot", "Spitewire", "Crooked Sun", "Iron Veldt", "Last Fang",
  "Dustgore", "Gutterborn", "Seventh Coil", "Writ Cinder", "Black Throat",
  // Tier 5 – Ancient Kin (Lv. 41–50)
  "Hexgrave", "Bloodbrand", "Oathsplitter", "Mournedge", "Deep Hollow",
  "Glassbone", "Rotblade", "Flint Ghost", "Palejaw", "Chained Crown",
  // Tier 6 – Doompath Heralds (Lv. 51–60)
  "Scorchhelm", "Ebon Root", "Blackridge", "Rustmaw", "Deadwake",
  "Gravelorn", "Bladeshade", "Voidtongue", "Murk Vow", "Gravetooth",
  // Tier 7 – Names Lost to Fire (Lv. 61–70)
  "Coldspire", "Ashgrin", "Red Silence", "Skullbent", "Duskworn",
  "Greywake", "Flamekeeper", "Riftjaw", "Frostborn Coil", "Stillgore",
  // Tier 8 – Myth Engines (Lv. 71–80)
  "Wrought One", "Grindclad", "Thornking", "Sigilworn", "Embercall",
  "Voidstitcher", "Blight Crest", "Forged Maw", "Burndagger", "Rust Saint",
  // Tier 9 – Elders of Dust (Lv. 81–90)
  "Goreveil", "Blackcoil", "Spinebrand", "Crackjaw", "Shroudkin",
  "Fangroot", "Banewake", "Vessel of Nine", "The Cutmark", "Dusttaker",
  // Tier 10 – Final Forms (Lv. 91–100)
  "The Ash Wolf", "Wyrmblood", "Redrift", "The Lost Fang", "Nullmark",
  "Broken Throne", "Crownless Lord", "Steelwither", "Mouth of Stone", "Endborne",
];

export const TIER_INFO: readonly TierConfig[] = [
    { name: "Unknown Blades", slug: "unknown-blades", icon: "⚔️", minLevel: 1, maxLevel: 10, tierGroup: 1, welcomeMessage: "You were no one. Just dust and instinct. But the blade remembers who dares to hold it.", tierEntryBonus: 0 },
    { name: "Vowbreakers", slug: "vowbreakers", icon: "🛡️", minLevel: 11, maxLevel: 20, tierGroup: 1, welcomeMessage: "You swore once. Then you shattered it. Power lives in the broken oaths — and you are now their kin.", tierEntryBonus: 100 },
    { name: "Silent Names", slug: "silent-names", icon: "🔥", minLevel: 21, maxLevel: 30, tierGroup: 2, welcomeMessage: "They won’t speak your name, but they feel your echo in the dark. Silence cuts deeper than screams.", tierEntryBonus: 250 },
    { name: "Forgotten Lineage", slug: "forgotten-lineage", icon: "🐍", minLevel: 31, maxLevel: 40, tierGroup: 2, welcomeMessage: "No bloodline. No crown. Just scars passed from the void. You are born again — of nothing.", tierEntryBonus: 500 },
    { name: "Ancient Kin", slug: "ancient-kin", icon: "💀", minLevel: 41, maxLevel: 50, tierGroup: 3, welcomeMessage: "Older than memory. Deeper than regret. You rise with bones beneath you and fire behind your eyes.", tierEntryBonus: 750 },
    { name: "Doompath Heralds", slug: "doompath-heralds", icon: "🌑", minLevel: 51, maxLevel: 60, tierGroup: 3, welcomeMessage: "The sky darkens when you walk. You are no longer part of the world — you are its warning.", tierEntryBonus: 1000 },
    { name: "Names Lost to Fire", slug: "names-lost-to-fire", icon: "🩶", minLevel: 61, maxLevel: 70, tierGroup: 4, welcomeMessage: "What you were burned away. What remains has no name — only flame.", tierEntryBonus: 1500 },
    { name: "Myth Engines", slug: "myth-engines", icon: "⚙️", minLevel: 71, maxLevel: 80, tierGroup: 4, welcomeMessage: "You are no longer flesh and will. You are function and fury. A system that breaks systems.", tierEntryBonus: 2000 },
    { name: "Elders of Dust", slug: "elders-of-dust", icon: "🕷️", minLevel: 81, maxLevel: 90, tierGroup: 5, welcomeMessage: "Time failed to kill you. History bent around your shadow. You are not remembered — you are endured.", tierEntryBonus: 2500 },
    { name: "Final Forms", slug: "final-forms", icon: "🌑", minLevel: 91, maxLevel: 100, tierGroup: 5, welcomeMessage: "No more trials. No more thresholds. This is not potential — this is you, fully formed and feared.", tierEntryBonus: 5000 },
];


export const LEVEL_THRESHOLDS: readonly number[] = (() => {
    const thresholds = [0]; // Level 1 starts at 0 points
    let currentPoints = 0;
    let increment = 100;
    let incrementIncreaseBase = 50;
    const tierPointMultiplier = [1.0, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0, 2.3, 2.7, 3.0]; // Adjusted for 10 tiers

    for (let i = 1; i < 100; i++) {
        currentPoints += increment;
        thresholds.push(currentPoints);

        const levelForTierCalc = i + 1;
        let currentTierIndex = TIER_INFO.findIndex(tier => levelForTierCalc >= tier.minLevel && levelForTierCalc <= tier.maxLevel);

        if (currentTierIndex === -1) {
            if (levelForTierCalc > TIER_INFO[TIER_INFO.length - 1].maxLevel) {
                 currentTierIndex = TIER_INFO.length -1;
            } else {
                currentTierIndex = 0;
            }
        }

        const multiplier = tierPointMultiplier[currentTierIndex] ?? 1.0;

        increment += Math.floor(incrementIncreaseBase * multiplier);
    }
    return thresholds;
})();


export const MAX_USER_LEVEL = LEVEL_THRESHOLDS.length;

// totalExperiencePoints is the sum of all record values PLUS any awarded bonuses
export const calculateUserLevelInfo = (totalExperiencePoints: number): UserLevelInfo => {
  let currentLevel = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExperiencePoints >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
      break;
    }
  }
  if (currentLevel === 0 && LEVEL_THRESHOLDS.length > 0) currentLevel = 1;
  if (currentLevel > MAX_USER_LEVEL) currentLevel = MAX_USER_LEVEL;


  const levelName = LEVEL_NAMES[currentLevel - 1] || "Champion";

  const currentTierInfo = TIER_INFO.find(tier => currentLevel >= tier.minLevel && currentLevel <= tier.maxLevel) || TIER_INFO[0];
  const tierName = currentTierInfo.name;
  const tierIcon = currentTierInfo.icon;
  const tierSlug = currentTierInfo.slug;
  const tierGroup = currentTierInfo.tierGroup;
  const welcomeMessage = currentTierInfo.welcomeMessage;

  const isMaxLevel = currentLevel >= MAX_USER_LEVEL;
  const currentLevelValueStart = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextLevelValueTarget = isMaxLevel ? totalExperiencePoints : (LEVEL_THRESHOLDS[currentLevel] ?? totalExperiencePoints);


  let progressPercentage = 0;
  if (!isMaxLevel && nextLevelValueTarget > currentLevelValueStart) {
    progressPercentage = ((totalExperiencePoints - currentLevelValueStart) / (nextLevelValueTarget - currentLevelValueStart)) * 100;
    progressPercentage = Math.max(0, Math.min(progressPercentage, 100));
  } else if (isMaxLevel) {
    progressPercentage = 100;
  }

  const valueTowardsNextLevel = totalExperiencePoints - currentLevelValueStart;
  const pointsForNextLevel = isMaxLevel ? 0 : nextLevelValueTarget - currentLevelValueStart;

  return {
    currentLevel,
    levelName,
    tierName,
    tierIcon,
    tierSlug,
    tierGroup,
    welcomeMessage,
    progressPercentage,
    currentLevelValueStart,
    nextLevelValueTarget: isMaxLevel ? null : nextLevelValueTarget,
    totalAccumulatedValue: totalExperiencePoints,
    isMaxLevel,
    valueTowardsNextLevel,
    pointsForNextLevel: isMaxLevel ? null : pointsForNextLevel,
  };
};
