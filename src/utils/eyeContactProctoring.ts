/**
 * PlacementOS — AI Mock Interview Proctoring: Rule 3
 * Eye Contact Below 50% for 3 Continuous Seconds
 *
 * Requirements:
 * - EYE_CONTACT_THRESHOLD = 50
 * - EYE_CONTACT_VIOLATION_DURATION_MS = 3000
 * - eyeContactScore < 50 qualifies (strictly below; exactly 50% is NOT a violation)
 * - Must remain below 50% continuously for 3 seconds
 * - Timestamp-based tracking (belowThresholdSince)
 * - ONE violation per continuous episode (no spamming on every frame while remaining < 50%)
 * - Episode resets only when score returns to >= 50%
 * - Active interview only
 * - Does not trigger on invalid/missing face data
 */

export const EYE_CONTACT_THRESHOLD = 50;
export const EYE_CONTACT_VIOLATION_DURATION_MS = 3000;
export const EYE_CONTACT_VIOLATION_TYPE = 'EYE_CONTACT';
export const EYE_CONTACT_VIOLATION_MESSAGE = 'Eye contact below 50% for 3 continuous seconds.';

// --- PlacementOS Proctoring Rule 4 Centralized Constants ---
export const MAX_PROCTORING_VIOLATIONS = 3;
export const MULTIPLE_VIOLATIONS_TERMINATION_REASON = 'MULTIPLE_PROCTORING_VIOLATIONS';
export const MULTIPLE_VIOLATIONS_TERMINATION_REMARK = 'Interview terminated automatically after multiple proctoring violations.';

export interface ProctoringViolationEvent {
  id?: string;
  type: string;
  timestamp?: string;
  durationMs?: number;
  details?: string;
  isInformational?: boolean;
  eyeContactScore?: number;
}

/**
 * Determines whether a given proctoring event is an actual violation.
 * Informational events (such as CONNECTED_DEVICE_DETECTED or CONNECTED_DEVICE_DISCONNECTED)
 * do NOT count as violations.
 */
export function isActualProctoringViolation(
  v: ProctoringViolationEvent | null | undefined
): boolean {
  if (!v || !v.type) return false;
  if (v.isInformational) return false;
  const upper = String(v.type).toUpperCase();
  if (
    upper === 'CONNECTED_DEVICE_DETECTED' ||
    upper === 'CONNECTED_DEVICE_DISCONNECTED' ||
    upper.startsWith('CONNECTED_DEVICE')
  ) {
    return false;
  }
  return true;
}

/**
 * Calculates the total number of actual violations from an array of proctoring events.
 */
export function countActualProctoringViolations(
  violations: Array<ProctoringViolationEvent> | null | undefined
): number {
  if (!Array.isArray(violations)) return 0;
  return violations.filter(isActualProctoringViolation).length;
}

export interface EyeContactViolationRecord {
  id: string;
  type: typeof EYE_CONTACT_VIOLATION_TYPE;
  timestamp: string;
  durationMs: number;
  details: string;
  eyeContactScore?: number;
}

export class EyeContactTracker {
  private belowThresholdSince: number | null = null;
  private violationLogged: boolean = false;
  private lastViolationId: string | null = null;

  constructor(
    private threshold: number = EYE_CONTACT_THRESHOLD,
    private durationMs: number = EYE_CONTACT_VIOLATION_DURATION_MS
  ) {}

  /**
   * Evaluates a frame against the 3-second continuous below 50% rule.
   *
   * @param score - The current real-time eye-contact score (0-100), or null/undefined if face absent
   * @param nowMs - Current timestamp in milliseconds (defaults to Date.now())
   * @param isSessionActive - Whether the interview is currently active
   * @returns EyeContactViolationRecord if a NEW violation condition was met, otherwise null
   */
  public processFrame(
    score: number | null | undefined,
    nowMs: number = Date.now(),
    isSessionActive: boolean = true
  ): EyeContactViolationRecord | null {
    // 1. Rule 8: Active interview only. Inactive sessions reset the state and produce no violations.
    if (!isSessionActive) {
      this.reset();
      return null;
    }

    // 2. Rule 9: Edge cases - if score is unavailable, undefined, or invalid (no face, initializing),
    // do not start or continue the below-50% timer.
    if (score === null || score === undefined || typeof score !== 'number' || isNaN(score)) {
      this.belowThresholdSince = null;
      return null;
    }

    // 3. Rule 2: Strictly below threshold (score < 50). Exactly 50% is NOT a violation.
    if (score < this.threshold) {
      if (this.belowThresholdSince === null) {
        // Start the continuous timer
        this.belowThresholdSince = nowMs;
      } else {
        const elapsed = nowMs - this.belowThresholdSince;
        // 4. Rule 3: Continuous 3-second condition reached
        if (elapsed >= this.durationMs) {
          // 5. Rule 5: ONE violation per continuous episode
          if (!this.violationLogged) {
            this.violationLogged = true;
            const violationId = `v_ec_${nowMs}`;
            this.lastViolationId = violationId;
            return {
              id: violationId,
              type: EYE_CONTACT_VIOLATION_TYPE,
              timestamp: new Date(nowMs).toISOString(),
              durationMs: Math.round(elapsed),
              details: EYE_CONTACT_VIOLATION_MESSAGE,
              eyeContactScore: score,
            };
          }
          // Already logged for this episode; do not emit repeated violations
        }
      }
    } else {
      // Score is >= 50%: Reset timer and reset episode flag so a subsequent drop can trigger a new violation
      this.belowThresholdSince = null;
      this.violationLogged = false;
      this.lastViolationId = null;
    }

    return null;
  }

  public getBelowThresholdSince(): number | null {
    return this.belowThresholdSince;
  }

  public isViolationLogged(): boolean {
    return this.violationLogged;
  }

  public getLastViolationId(): string | null {
    return this.lastViolationId;
  }

  public reset(): void {
    this.belowThresholdSince = null;
    this.violationLogged = false;
    this.lastViolationId = null;
  }
}
