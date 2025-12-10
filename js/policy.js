// Policy constants (editable if policy changes)
export const OCCURRENCES_PER_WARNING = 3;
export const MAX_WARNINGS = 4; // termination threshold
export const WARNING_LIFESPAN_DAYS = 183; // approx 6 months
export const LOOKBACK_DAYS = 365;
export const MAX_SAFE_OCCURRENCES = MAX_WARNINGS * OCCURRENCES_PER_WARNING - 1; // 11

