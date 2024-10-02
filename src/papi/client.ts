import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { config } from "#src/config";

import { getNetworkData } from "./chains";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const provider = new WsProvider(networkData.data.rpcEndpoint);
let client: ApiPromise | undefined;

export const getClient = async () => {
  if (!client) {
    await cryptoWaitReady();
    client = await ApiPromise.create({ provider });
  }
  return client;
};
