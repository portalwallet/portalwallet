// This file is part of Portal Wallet.
//
// Portal Wallet is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, specifically version 2 of the License.
//
// Portal Wallet is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Portal Wallet. If not, see <https://www.gnu.org/licenses/>.
//
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  type SignaturesForAddressOptions,
} from "@solana/web3.js";
import type { ParsedTransactionWithMeta } from "@solana/web3.js";

import { log, sleep, stringify } from "./functions";
import { mintToCurrencyMap } from "./mint-to-currency-map";
import {
  LATEST_IDENTITY_TOKEN_VERSION,
  URLS,
  SECOND,
  SOLANA_DECIMALS,
} from "./constants";
import { getCurrencyBySymbol } from "./solana-functions";
import { asyncMap } from "./functions";
import base58 from "bs58";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getProfilePicture as getProfilePictureUsingSolanaPFPStandard } from "@solflare-wallet/pfp";
import {
  getIdentityTokensFromWallet,
  getVerifiedClaimsFromNFTMetadata,
} from "./identity-tokens";
import type {
  BasicTokenAccount,
  NonFungibleTokenMetadataStandard,
  OldNonStandardTokenMetaData,
  ProfilePictureResponse,
  VerifiedClaimsForIndividual,
  VerifiedClaimsForOrganization,
} from "./types";
import { summarizeTransaction } from "./transactions";
import { toUniqueStringArray } from "../lib/utils";
import * as http from "../lib/http-client";
import { HOW_MANY_TRANSACTIONS_TO_GET_AT_ONCE } from "../lib/frontend-constants";
import { Direction, type Contact, type SimpleTransaction } from "./types";
import type { AccountSummary } from "./types";
import { PORTAL_IDENTITY_TOKEN_ISSUER_WALLET } from "../backend/constants";

const identityTokenIssuerPublicKey = new PublicKey(
  PORTAL_IDENTITY_TOKEN_ISSUER_WALLET
);

const VERIFIED_CLAIMS_BY_ADDRESS: Record<
  string,
  VerifiedClaimsForIndividual | VerifiedClaimsForOrganization
> = {};

const debug = (_unused) => {};

export const getKeypairFromString = (secretKeyString: string) => {
  let decodedSecretKey: Uint8Array;
  try {
    decodedSecretKey = base58.decode(secretKeyString);
  } catch (throwObject) {
    throw new Error("Invalid secret key! See README.md");
  }
  return Keypair.fromSecretKey(decodedSecretKey);
};

export const connect = async (
  networkName: keyof typeof URLS
): Promise<Connection> => {
  log(`⚡ Connecting to ${networkName}`);
  const connection = new Connection(URLS[networkName], {
    // Use 'finalized' as we often want to do things with items right after we make them
    // (like make a token account and then immediately transfer tokens to it)
    //
    // NOTE: we can't use commitment: finalised in our localhost validator
    // (it's a limitation of the localhost validator)
    // Confirmed - 66%+ stake voted on block
    // finalized - above, plus 31+ confirmed blocks built atop block
    commitment: networkName === "localhost" ? "confirmed" : "finalized",
    disableRetryOnRateLimit: true,
  });
  return connection;
};

// See https://github.com/Bonfida/bonfida-utils/blob/main/js
export const checkAccountExists = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<boolean> => {
  const accountInfo = await connection.getAccountInfo(publicKey);
  if (!accountInfo) {
    return false;
  }
  return true;
};

export const getAccountBalance = async (
  connection: Connection,
  publicKey: PublicKey
) => {
  let accountInfo = await connection.getAccountInfo(publicKey);
  if (!accountInfo) {
    throw new Error(`Could not find account '${publicKey}'`);
  }
  log("💰 Account balance:", accountInfo.lamports);
  return accountInfo.lamports;
};

export const putSolIntoWallet = async (
  connection: Connection,
  publicKey: PublicKey,
  lamports: number
) => {
  // Generate a new wallet keypair and airdrop SOL
  var airdropSignature = await connection.requestAirdrop(publicKey, lamports);

  const latestBlockHash = await connection.getLatestBlockhash();

  // Wait for airdrop confirmation
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: airdropSignature,
  });
};

export const getKeypairFromEnvFile = (envFileKey: string) => {
  // From https://yihau.github.io/solana-web3-demo/tour/create-keypair.html
  const secretKeyFromEnvFile = process.env[envFileKey];
  if (!secretKeyFromEnvFile) {
    throw new Error(
      `Please add '${envFileKey}' to your .env file with a private key extracted from Phantom etc.`
    );
  }
  const keyPair = getKeypairFromString(secretKeyFromEnvFile);
  return keyPair;
};

// Get the token accounts, and return only the details we care about
export const getTokenAccountsByOwner = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<Array<BasicTokenAccount>> => {
  const rawTokenAccountsByOwner = await connection.getTokenAccountsByOwner(
    publicKey,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  const tokenAccounts = await asyncMap(
    rawTokenAccountsByOwner.value,
    async (rawTokenAccount) => {
      // A Partial since we don't add 'address' until the next line
      const rawAccount = AccountLayout.decode(rawTokenAccount.account.data);

      const rawAccountBasics = {
        address: rawTokenAccount.pubkey,
        amount: rawAccount.amount,
        mint: rawAccount.mint,
      };

      return rawAccountBasics;
    }
  );

  return tokenAccounts;
};

export const verifyWallet = async (
  connection: Connection,
  metaplexConnectionKeypair: Keypair,
  identityTokenIssuerPublicKey: PublicKey,
  wallet: PublicKey,
  useCache = true,
  allowOldIdentityToken = true
): Promise<
  VerifiedClaimsForIndividual | VerifiedClaimsForOrganization | null
> => {
  if (useCache) {
    const cachedVerifiedClaims = VERIFIED_CLAIMS_BY_ADDRESS[wallet.toBase58()];
    if (cachedVerifiedClaims) {
      log(`Found verified claims for ${wallet.toBase58()} in cache`);
      sleep(1 * SECOND);
      return cachedVerifiedClaims;
    }
  }

  const identityTokens = await getIdentityTokensFromWallet(
    connection,
    metaplexConnectionKeypair,
    identityTokenIssuerPublicKey,
    wallet
  );

  if (!identityTokens.length) {
    return null;
  }

  const metadataForIdentityTokens = await asyncMap(
    identityTokens,
    async (identityTokens) => {
      const metadata = (await http.get(identityTokens.uri)) as
        | NonFungibleTokenMetadataStandard
        | OldNonStandardTokenMetaData;
      return metadata;
    }
  );

  if (!metadataForIdentityTokens.length) {
    // TODO: this seems to fire even with verified wallets
    log(`No current identity token was issued to this wallet`);
    return null;
  }

  const latestTokenMetadata = metadataForIdentityTokens?.[0];

  const verifiedClaims:
    | VerifiedClaimsForIndividual
    | VerifiedClaimsForOrganization = getVerifiedClaimsFromNFTMetadata(
    latestTokenMetadata,
    wallet,
    allowOldIdentityToken
  );

  return verifiedClaims;
};

// https://www.quicknode.com/guides/web3-sdks/how-to-get-transaction-logs-on-solana
export const getTransactionsForAddress = async (
  connection: Connection,
  address: PublicKey,
  limit: number | null = null,
  before: string | null = null,
  until: string | null = null
): Promise<Array<ParsedTransactionWithMeta>> => {
  const options: SignaturesForAddressOptions = {};
  if (limit) {
    options.limit = limit;
  }
  if (before) {
    options.before = before;
  }
  if (until) {
    options.until = until;
  }

  const confirmedSignatureInfos = await connection.getSignaturesForAddress(
    address,
    options
  );

  log(
    `Got ${confirmedSignatureInfos.length} confirmedSignatureInfos with a limit of ${limit}`
  );

  let signatures: Array<string> = confirmedSignatureInfos.map(
    (confirmedSignatureInfo) => confirmedSignatureInfo.signature
  );

  log(`Got ${signatures.length} signatures`);

  const transactions: Array<ParsedTransactionWithMeta> =
    await connection.getParsedTransactions(signatures, {
      // NOTE: we can't use commitment: finalised in our localhost validator
      // (it's a limitation of the localhost validator)
      // commitment: "finalized",

      // Fixes:
      // SolanaJSONRPCError: failed to get transactions: Transaction version (0) is not supported
      maxSupportedTransactionVersion: 0,
    });

  return transactions;
};

export const getTransactionSummariesForAddress = async (
  connection: Connection,
  walletAddress: PublicKey,
  tokenAccount: PublicKey | null,
  limit: number | null = null,
  secretKey: Uint8Array | null = null,
  before: string | null = null,
  until: string | null = null
) => {
  // For token accounts, we must get transactions for the token account specifically
  // - getting transactions for the parent wallet won't show deposits by other people
  // since deposits by other people aren't signed by our wallet
  const addressToGetTransactionsFor = tokenAccount || walletAddress;
  const rawTransactions = await getTransactionsForAddress(
    connection,
    addressToGetTransactionsFor,
    limit,
    before,
    until
  );

  if (!rawTransactions.length) {
    log(`Got 0 rawTransactions for ${walletAddress.toBase58()}`);
    return [];
  }

  let transactionSummaries = await asyncMap(
    rawTransactions,
    (rawTransaction) => {
      return summarizeTransaction(
        rawTransaction,
        walletAddress,
        null,
        true,
        secretKey
      );
    }
  );

  // We can't summarize all transactions yet
  transactionSummaries = transactionSummaries.filter(
    (simpleTransaction) => simpleTransaction !== null
  );

  log(
    `In getTransactionSummariesForAddress, for wallet ${walletAddress.toBase58()} token account ${tokenAccount.toBase58()} limit was ${limit}, got ${
      rawTransactions.length
    } rawTransactions, produced ${
      transactionSummaries.length
    } transactionSummaries`
  );

  return transactionSummaries;
};

export const getTokenAccountSummaries = async (
  connection: Connection,
  keyPair: Keypair
): Promise<Array<AccountSummary>> => {
  const tokenAccounts = await getTokenAccountsByOwner(
    connection,
    keyPair.publicKey
  );
  const accountSummariesOrNulls: Array<AccountSummary | null> = await asyncMap(
    tokenAccounts,
    async (tokenAccount) => {
      const currencyInfo = mintToCurrencyMap[tokenAccount.mint.toBase58()];

      if (!currencyInfo) {
        debug(`Unknown currency for mint ${tokenAccount.mint}`);
        return null;
      }

      const currencyName = currencyInfo.symbol;
      log(`Getting transactions for ${currencyName} account`);
      const transactionSummaries = await getTransactionSummariesForAddress(
        connection,
        keyPair.publicKey,
        tokenAccount.address,
        HOW_MANY_TRANSACTIONS_TO_GET_AT_ONCE,
        keyPair.secretKey
      );
      const accountSummary: AccountSummary = {
        address: tokenAccount.address,
        currency: currencyInfo.mintAddress,
        // TODO - converting BigInt to Number may be sketchy
        balance: Number(tokenAccount.amount),
        decimals: currencyInfo.decimals,
        transactionSummaries,
        lastUpdated: Date.now(),
      };
      return accountSummary;
    }
  );
  const accountSummaries: Array<AccountSummary> =
    accountSummariesOrNulls.filter((accountSummary) => accountSummary !== null);
  return accountSummaries;
};

export const getNativeAccountSummary = async (
  connection: Connection,
  keyPair: Keypair
): Promise<AccountSummary> => {
  log(`Getting transactions for native account`, new Date());
  let accountBalance = 0;
  let transactionSummaries: Array<SimpleTransaction> = [];
  try {
    accountBalance = await getAccountBalance(connection, keyPair.publicKey);
    transactionSummaries = await getTransactionSummariesForAddress(
      connection,
      keyPair.publicKey,
      keyPair.publicKey,
      HOW_MANY_TRANSACTIONS_TO_GET_AT_ONCE,
      keyPair.secretKey
    );
  } catch (error) {
    log(`No sol account balance for ${keyPair.publicKey}`);
  }
  const accountSummary: AccountSummary = {
    address: keyPair.publicKey,
    currency: getCurrencyBySymbol("SOL").mintAddress,
    balance: accountBalance,
    decimals: SOLANA_DECIMALS,
    transactionSummaries,
    lastUpdated: Date.now(),
  };
  return accountSummary;
};

export const getProfilePicture = async (
  connection: Connection,
  walletPubkey: PublicKey
) => {
  // https://www.npmjs.com/package/@solflare-wallet/pfp
  const response = (await getProfilePictureUsingSolanaPFPStandard(
    connection,
    walletPubkey,
    {
      fallback: false,
    }
  )) as ProfilePictureResponse;

  // This API returns the Netscape 'broken' image instead of null when 'fallback' is set to false.
  // (also if we turned 'fallback' on, fallback images are ugly gravatar style autogenerated images)
  // We don't want the ugly Netscape broken images or the ugly garavatar style images so let's return null
  if (!response.url.startsWith("http")) {
    return null;
  }
  return response.url;
};

export const getContactsFromTransactions = async (
  connection: Connection,
  keyPair: Keypair,
  // Can be all accounts, or just a single one.
  accounts: Array<AccountSummary>
): Promise<Array<Contact>> => {
  const transactionWalletAddresses = accounts.map((account) => {
    return account.transactionSummaries.map((transaction) => {
      let transactionWalletAddress: string;
      if (transaction.direction === Direction.sent) {
        transactionWalletAddress = transaction.to;
      } else {
        transactionWalletAddress = transaction.from;
      }
      return transactionWalletAddress;
    });
  });

  const uniqueTransactionWalletAddresses: Array<string> = toUniqueStringArray(
    transactionWalletAddresses.flat()
  );
  log(
    `We need to verify ${uniqueTransactionWalletAddresses.length} uniqueTransactionWalletAddresses:`
  );

  const contacts = await asyncMap(
    uniqueTransactionWalletAddresses,
    async (walletAddress): Promise<Contact> => {
      const [verifiedClaims, profilePictureURL] = await Promise.all([
        verifyWallet(
          connection,
          keyPair,
          identityTokenIssuerPublicKey,
          new PublicKey(walletAddress)
        ),
        getProfilePicture(connection, new PublicKey(walletAddress)),
      ]);

      const contact: Contact = {
        walletAddress,
        isNew: false,
        isPending: false,
        verifiedClaims,
        profilePictureURL,
      };
      return contact;
    }
  );

  log(`Got ${contacts.length} contacts used in transactions`);

  return contacts;
};
