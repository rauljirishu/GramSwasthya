export type RequestedAccountRole = 'central_authority' | 'phc_head' | 'phc_worker' | 'patient';

const accountPrefixes: Record<RequestedAccountRole, string> = {
  central_authority: 'CID',
  phc_head: 'PHH',
  phc_worker: 'PHW',
  patient: 'PID',
};

/** Create a displayable account identifier; the database validates and enforces uniqueness. */
export function createAccountId(role: RequestedAccountRole): string {
  return `${accountPrefixes[role]}-${globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
}
