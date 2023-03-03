import { PublicKey, Connection } from "@solana/web3.js";
import {
  getTwitterRegistry,
  getHandleAndRegistryKey,
} from "@bonfida/spl-name-service";
import { URLS } from "./constants";
import dotenv from "dotenv";
// https://www.npmjs.com/package/@onsol/tldparser

dotenv.config();

export const walletToTwitterHandle = async (wallet: string) => {
  const connection = new Connection(URLS["mainNetBeta"]);

  try {
    // Pubkey of the wallet you want to retrieve the Twitter handle
    const publickey = new PublicKey(wallet);

    const [handle, _RegistryKey] = await getHandleAndRegistryKey(
      connection,
      publickey
    );

    return handle;
  } catch (thrownObject) {
    const error = thrownObject as Error;
    if (error.message === "Invalid public key input") {
      return null;
    }
    // They SNS user just doesn't have a Twitter reverse mapping set up
    // This is super common
    if (error.message === "Invalid reverse Twitter account provided") {
      return null;
    }

    // An unexpected error
    throw error;
  }
};

export const twitterHandleToWallet = async (
  connection: Connection,
  twitterHandle: string
) => {
  // Normalise the @ symbol. We don't need it.
  if (twitterHandle.startsWith("@")) {
    twitterHandle = twitterHandle.slice(1);
  }
  try {
    const registry = await getTwitterRegistry(connection, twitterHandle);
    return registry.owner.toString();
  } catch (thrownObject) {
    const error = thrownObject as Error;
    if (error.message === "Invalid name account provided") {
      return null;
    }
  }
};

export const resolveAnyName = async (string: String) => {
  // Try .sol
  // Try .twitter
  // Try .abc
  // Try .glow
  // Try .backpack
};
