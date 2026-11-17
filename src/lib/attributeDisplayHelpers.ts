import type { AttributeInDb } from "../types/attribute";

// ---------------------------------------------------------------------------
// Business rules about HOW an attribute is shown to the user.
// They live here (and not inside the components) so that every page that
// shows an attribute applies exactly the same rules.
// ---------------------------------------------------------------------------

/**
 * Returns the XP "ceiling" of the attribute's current level, i.e. the second
 * number of the "29/100 XP" label.
 *
 * WHY THIS IS NOT JUST `xp_to_next_level`:
 * In the database, `xp_to_next_level` holds the XP that are still MISSING to
 * reach the next level (e.g. 71), NOT the total cost of the level. The
 * backend decreases it every time XP is earned (see
 * calculateAttributeXpProgressHelper). So the total cost of the current level
 * is "XP already earned in this level" + "XP still missing":
 *   29 + 71 = 100
 *
 * `xp_to_next_level` is never null (it is created with
 * INITIAL_XP_TO_NEXT_LEVEL in the backend), so no fallback is needed for it.
 * `xp` can be null on a brand new attribute, so it falls back to 0.
 */
export function getAttributeXpCeiling(attribute: AttributeInDb): number {
  const xpEarnedInCurrentLevel = attribute.xp ?? 0;
  const xpMissingToNextLevel = attribute.xp_to_next_level;
  return xpEarnedInCurrentLevel + xpMissingToNextLevel;
}

// The two states the "decay" line of an attribute can be in.
// A discriminated union (the `kind` field) makes the component handle both
// cases explicitly with a plain if/else.
export type DecayDisplay =
  // The attribute can decay: we know the date on which it would decay.
  | { kind: "scheduled"; date: Date }
  // The attribute cannot decay yet (or anymore): we show an explanatory text.
  | { kind: "not-started" };

/**
 * Decides what the decay line of an attribute must show.
 *
 * Rule 1 - Never used: the backend assigns `decay_date` only the first time
 *   the attribute earns XP, so a
 *   null date means "never used".
 * Rule 2 - Cannot decay further: an attribute at level 1 with 0 XP has
 *   nothing left to lose. The backend
 *   still keeps a decay_date on it after a decay, but showing that date would
 *   be misleading, so we treat it like a never-used attribute.
 * Otherwise - show the date stored by the backend.
 *
 * NOTE: there is intentionally no state/effect to "keep the date updated".
 * The date is derived from the attribute data on every render, so it changes
 * on screen if and only if the backend changed it (extended after a level-up
 * or a big XP gain, or renewed after a decay).
 */
export function getDecayDisplay(attribute: AttributeInDb): DecayDisplay {
  if (!attribute.decay_date) {
    return { kind: "not-started" };
  }

  const isAtLevelOne = (attribute.level ?? 1) <= 1;
  const hasNoXp = (attribute.xp ?? 0) <= 0;
  if (isAtLevelOne && hasNoXp) {
    return { kind: "not-started" };
  }

  // The API serializes dates as ISO strings, so we rebuild a Date.
  return { kind: "scheduled", date: new Date(attribute.decay_date) };
}
