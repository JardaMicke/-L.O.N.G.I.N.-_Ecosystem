/**
 * Represents the state of a faction in the campaign world.
 */
export interface FactionState {
  /** Unique identifier for the faction. */
  id: string;
  /** Current amount of resources (e.g., gold) the faction possesses. */
  totalResources: Map<string, number>; // Changed to Map to match CampaignManager
  /** List of units owned by the faction */
  ownedUnits: string[];
  /** List of structures owned by the faction */
  ownedStructures: string[];
  /** Current score */
  score: number;
}

/**
 * Represents the global state of the game world for campaign AI.
 * Contains information about time, factions, and strategic points.
 */
export interface WorldStateSnapshot { // Renamed to WorldStateSnapshot to match usage
  /** Map of all factions in the game. */
  factions: Map<string, FactionState>;
  
  /** Global threat level */
  globalThreatLevel: number;
  
  /** Time of day (0-24) */
  timeOfDay: number;
  
  /** Current season */
  season: string;
  
  /** List of resource node entity IDs */
  resourceNodes: string[];
  
  /** List of IDs of entities that are considered strategic points. */
  strategicPoints: string[];
}

export type WorldState = WorldStateSnapshot; // Alias for backward compatibility if needed
