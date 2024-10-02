export type TypeofMap = {
  string: string;
  number: number;
  boolean: boolean;
};
export type PrimitivTypeString = keyof TypeofMap;

export type PrimitivType = string | number | boolean;

export interface MetricsDefinition {
  meta: {
    prefix: string;
  };
  data: { [id: string]: number };
}

export interface EnvOpt {
  default?: PrimitivType;
  required: boolean;
  secret: boolean;
  type: PrimitivTypeString;
}

export interface BalanceResponse {
  balance: string;
}

export interface DripErrorResponse {
  error: string;
}

export interface DripSuccessResponse {
  hash: string;
}

export type DripResponse = DripErrorResponse | DripSuccessResponse;

export interface DripRequestType {
  address: string;
  amount: bigint;
  asset_id: number;
  recaptcha: string;
}

export interface FaucetRequestType {
  address: string;
  asset_id: number;
  recaptcha: string;
}
