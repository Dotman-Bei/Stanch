import raw from "./deployment.json";

interface DeployedContract {
  address?: string;
  txHash?: string;
  explorer?: string;
  addressExplorer?: string;
  executionResult?: string;
  lifecycle?: { state?: string; outcome?: string };
}

interface Registration {
  tx?: DeployedContract;
  statusAfter?: string;
  target?: string;
}

export interface DeploymentRecord {
  status?: string;
  note?: string;
  updatedAtUtc?: string;
  stanch?: DeployedContract | null;
  cistern?: DeployedContract | null;
  cistern_fixed?: DeployedContract | null;
  injection_target?: DeployedContract | null;
  registrations?: Record<string, Registration>;
  gates?: Record<string, { gate?: string; pass?: boolean; tx?: DeployedContract }>;
}

export const DEPLOYMENT = raw as DeploymentRecord;

export function isDeployed(): boolean {
  return Boolean(DEPLOYMENT.stanch?.address);
}

export function registrationTx(key: string): DeployedContract | undefined {
  return DEPLOYMENT.registrations?.[key]?.tx;
}
