import { config } from "#src/config";
import { logger } from "#src/logger";
import { getClient, getNetworkData } from "#src/papi/index";
import { getSigner } from "#src/papi/signer";
import { DripResponse } from "#src/types";

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const rpcTimeout = (service: string) => {
  const timeout = 100_000;
  return setTimeout(() => {
    // log an error in console and in prometheus if the timeout is reached
    logger.error(`⭕ Oops, ${service} took more than ${timeout}ms to answer`);
  }, timeout);
};

const NONCE_SYNC_INTERVAL = 10_000;

export class PolkadotActions {
  address: string;
  isReady: Promise<void>;
  #nonce: Promise<number>;
  #pendingTransactions: Set<string>;

  constructor() {
    logger.info("🚰 Plip plop - Creating the faucets's account");

    /**
     * Nonce synchronization is tricky. Blindly incrementing nonce each transaction might brick the faucet effectively.
     * However, nonce is incremented on network when last transaction finalizes.
     *
     * Thus, we're skipping syncs if we have pending transactions, while having this.#nonce as a Promise
     * allows us to wait for sync to end, before submitting next transaction
     */
    this.#pendingTransactions = new Set();
    setInterval(async () => {
      if (this.#pendingTransactions.size === 0) {
        const client = await getClient();
        const oldNoncePromise = this.#nonce;
        this.address = (await getSigner()).address;

        this.#nonce = networkData.api.getNonce(this.address, client);

        // In cases of nonce mismatch, it might be useful to have nonce change in logs
        this.#nonce.then(async (newNonce) => {
          const oldNonce = await oldNoncePromise;
          if (newNonce !== oldNonce) {
            logger.debug(`Nonce updated from ${oldNonce} to ${newNonce}`);
          }
        });
      }
    }, NONCE_SYNC_INTERVAL);

    this.isReady = (async () => {
      const client = await getClient();

      this.address = (await getSigner()).address;
      this.#nonce = networkData.api.getNonce(this.address, client);

      logger.info(`Faucet address is ${this.address}`);
    })();
  }

  // Synchronously queues nonce increment
  private getNonce(): Promise<number> {
    const currentNonce = this.#nonce;
    this.#nonce = this.#nonce.then((nonce) => nonce + 1);
    return currentNonce;
  }

  public async getFaucetBalance(assetId: number): Promise<bigint> {
    const client = await getClient();

    if (assetId === -1) {
      return await networkData.api.getBalance(this.address, client);
    } else {
      return await networkData.api.getAsset(this.address, assetId, client);
    }
  }

  public async getAccountBalance(address: string, assetId: number): Promise<number> {
    const client = await getClient();

    if (assetId === -1) {
      const balance = await networkData.api.getBalance(address, client);
      return Number(balance / 10n ** BigInt(networkData.data.decimals));
    } else {
      const balance = await networkData.api.getAsset(address, assetId, client);
      return Number(balance / 10n ** BigInt(networkData.data.decimals));
    }
  }

  public async isAccountOverBalanceCap(address: string, assetId: number): Promise<boolean> {
    return (await this.getAccountBalance(address, assetId)) > networkData.data.balanceCap;
  }

  async transferBalances(dripAmount: bigint, address: string): Promise<DripResponse> {
    logger.info(`💸 sending balances to ${address}`);

    const client = await getClient();
    const nonce = await this.getNonce();
    const hash = await networkData.api.transferBalances({
      dripAmount,
      address,
      client,
      nonce,
    });

    logger.info(`💸 sending balances to ${address}: done: ${hash}`);
    return { hash };
  }

  async transferAssets(dripAmount: bigint, address: string, assetId: number): Promise<DripResponse> {
    logger.info(`💸 sending tokens to ${address}`);

    const client = await getClient();
    const nonce = await this.getNonce();
    const hash = await networkData.api.transferAssets({
      dripAmount,
      address,
      client,
      nonce,
      assetId,
    });

    logger.info(`💸 sending assets to ${address}: done: ${hash}`);
    return { hash };
  }

  async sendTokens(address: string, amount: bigint, assetId: number): Promise<DripResponse> {
    let dripTimeout: ReturnType<typeof rpcTimeout> | null = null;
    let result: DripResponse;

    try {
      dripTimeout = rpcTimeout("drip");
      const client = await getClient();
      if (assetId === -1) {
        const balance = await networkData.api.getBalance(this.address, client);
        if (balance < amount) {
          throw new Error("Faucet is turned off");
        }
        result = await this.transferBalances(amount, address);
      } else {
        if (!(await networkData.api.existAsset(assetId, client))) {
          throw new Error(`Unknown asset ID: ${assetId}`);
        }

        const balance = await networkData.api.getAsset(this.address, assetId, client);
        if (balance < amount) {
          throw new Error("Faucet is turned off");
        }
        result = await this.transferAssets(amount, address, assetId);
      }
    } catch (e) {
      logger.error("⭕ An error occured when sending tokens", e);
      let message = "An error occured when sending tokens";
      if (e instanceof Error) {
        message = e.message;
      }
      result = { error: message };
    }

    // we got and answer reset the timeout
    if (dripTimeout) clearTimeout(dripTimeout);

    return result;
  }
}

export default new PolkadotActions();
