import { ApiPromise } from "@polkadot/api";
import { decodeAddress } from "@polkadot/util-crypto";
import { logger } from "#src/logger";
import { NetworkApi, NetworkData } from "#src/papi/chains/index";
import { getSigner } from "#src/papi/signer";
import { bech32 } from "bech32";

const networkData: NetworkData = {
  balanceCap: 500,
  currency: "Zig",
  decimals: 18,
  dripAmount: "1",
  explorer: null,
  networkName: "Ziggurat",
  rpcEndpoint: "ws://localhost:9944",
};

function convertAddress(address: string): string {
  try {
    if (address.startsWith("cosmos1")) {
      const { words } = bech32.decode(address);
      const cosmosAddress = Buffer.from(bech32.fromWords(words));
      return `0x${Buffer.concat([Buffer.from([0x01]), cosmosAddress]).toString("hex")}`;
    } else if (address.startsWith("0x")) {
      const ethereumAddress = Buffer.from(address.slice(2), "hex");
      return `0x${Buffer.concat([Buffer.from([0x02]), ethereumAddress]).toString("hex")}`;
    } else {
      const polkadotAddress = decodeAddress(address);
      return `0x${Buffer.concat([Buffer.from([0x00]), polkadotAddress]).toString("hex")}`;
    }
  } catch (e) {
    throw new Error(`Requested invalid address: ${address}`);
  }
}

export const networkApi: NetworkApi = {
  transferBalances: async ({ dripAmount, address, client, nonce }): Promise<string> => {
    const signer = await getSigner();
    logger.info(`Requested origin address: ${address}`);

    const toAddress = convertAddress(address);
    logger.info(`Requested converted address: ${toAddress}`);

    return (await client.tx.babel.transfer(toAddress, dripAmount).signAndSend(signer, { nonce })).toString();
  },

  getBalance: async (address: string, client: ApiPromise): Promise<bigint> => {
    const account = (await client.query.system.account(address)).toString();
    if (account) {
      return BigInt(JSON.parse(account).data.free);
    } else {
      return 0n;
    }
  },

  healthcheck: async (client: ApiPromise): Promise<void> => {
    await client.query.system.number();
  },

  getNonce: async (address: string, client: ApiPromise): Promise<number> => {
    const account = (await client.query.system.account(address)).toString();
    if (account) {
      return JSON.parse(account).nonce;
    } else {
      return 0;
    }
  },

  transferAssets: async ({ dripAmount, address, client, nonce, assetId }): Promise<string> => {
    const signer = await getSigner();
    return (
      await client.tx.assets.transferKeepAlive(assetId, address, dripAmount).signAndSend(signer, { nonce })
    ).toString();
  },

  getAsset: async (address: string, assetId: number, client: ApiPromise): Promise<bigint> => {
    const balance = (await client.query.assets.account(assetId, address)).toString();
    if (balance) {
      return BigInt(JSON.parse(balance).balance);
    } else {
      return 0n;
    }
  },

  existAsset: async (assetId: number, client: ApiPromise): Promise<boolean> =>
    (await client.query.assets.asset(assetId)).toString() ? true : false,
};

export default { data: networkData, api: networkApi };
