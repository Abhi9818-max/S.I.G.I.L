
export type LevelXPConfig = {
  level: number;
  priority: {
    normal: number; // multiplier
    high: number;   // multiplier
  };
  unit: {
    count: number;
    minutes: number;
    hours: number;
    pages: number;
    generic: number;
    [customUnit: string]: number; // For custom units
  };
  // You can add other factors here in the future
};

/**
 * This array will hold the specific XP modifiers for each level.
 * The user can provide the data for this array in JSON format.
 * Example for one level:
 * {
 *   "level": 1,
 *   "priority": { "normal": 1.0, "high": 1.2 },
 *   "unit": { "count": 10, "minutes": 1, "hours": 60, "pages": 5, "generic": 1 }
 * }
 */
export const XP_CONFIG: LevelXPConfig[] = [
    // Data will be added here by the user in a future step.
];
