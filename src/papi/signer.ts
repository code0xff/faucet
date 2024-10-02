import { Keyring } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { config } from "#src/config";

const suri = config.Get("FAUCET_ACCOUNT_MNEMONIC");
const keyring = new Keyring({ ss58Format: 42, type: "sr25519" });

let signer: KeyringPair | undefined;

export const getSigner = async (): Promise<KeyringPair> => {
  if (!signer) {
    await cryptoWaitReady();
    signer = keyring.createFromUri(suri);
  }
  return signer;
};
