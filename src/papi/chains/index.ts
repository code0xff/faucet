import { ApiPromise } from "@polkadot/api";

import ziggurat from "./ziggurat";

export interface ChainData {
  name: string;
  id: number;
}

export const networks: Record<string, { data: NetworkData; api: NetworkApi }> = {
  ziggurat,
};

export interface NetworkApi {
  transferBalances(params: { dripAmount: bigint; address: string; client: ApiPromise; nonce: number }): Promise<string>;

  getBalance(address: string, client: ApiPromise): Promise<bigint>;

  healthcheck(client: ApiPromise): Promise<void>;

  getNonce(address: string, client: ApiPromise): Promise<number>;

  transferAssets(params: {
    dripAmount: bigint;
    address: string;
    client: ApiPromise;
    nonce: number;
    assetId: number;
  }): Promise<string>;

  getAsset(address: string, assetId: number, client: ApiPromise): Promise<bigint>;

  existAsset(assetId: number, client: ApiPromise): Promise<boolean>;
}

export interface NetworkData {
  networkName: string;
  currency: string;
  explorer: string | null;
  rpcEndpoint: string;
  decimals: number;
  dripAmount: string;
  balanceCap: number;
}

export function getNetworkData(networkName: string): { data: NetworkData; api: NetworkApi } {
  // networkName value is valdated one line before, safe to use as index
  // eslint-disable-next-line security/detect-object-injection
  const network = networks[networkName];
  if (!network) {
    throw new Error(
      `Unknown NETWORK in env: ${networkName}; valid networks are: [${Object.keys(networks).join(", ")}]`,
    );
  }
  return network;
}
