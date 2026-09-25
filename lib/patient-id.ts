/** Generates a non-identifying patient registry code; the database enforces uniqueness. */
export function createPatientCode(): string {
  return `PID-${globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
}
