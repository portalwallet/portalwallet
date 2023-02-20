// This file is part of Portal Wallet.
//
// Portal Wallet is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, specifically version 2 of the License.
//
// Portal Wallet is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Portal Wallet. If not, see <https://www.gnu.org/licenses/>.
//
// https://github.com/metaplex-foundation/js

// TODO:
// joncinque commented on 6 Jun
// https://github.com/solana-labs/solana-program-library/issues/2909
//  the feature is available on token-2022, but has not been released to mainnet yet. Also, Metaplex is not using token-2022 at the moment. If you need this soon, then you will have to develop your own on-chain program.
// https://github.com/solana-labs/solana-program-library/pull/3178/files

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";

import {
  Metaplex,
  keypairIdentity,
  mockStorage,
  bundlrStorage,
  type CreateNftOutput,
  toTokenAccount,
} from "@metaplex-foundation/js";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { asyncMap, log, stringify } from "./functions";
import {
  IDENTITY_TOKEN_NAME,
  LATEST_IDENTITY_TOKEN_VERSION,
} from "./constants";

import type {
  VerifiedClaimsForIndividual,
  VerifiedClaimsForOrganization,
  TokenMetaData,
} from "./types";
import { makeTransaction } from "./tokens";
import { connect } from "./wallet";
import * as http from "../lib/http-client";

export const getMetaplex = (
  connection: Connection,
  keypair: Keypair,
  isProduction: boolean = false
) => {
  if (isProduction) {
    return Metaplex.make(connection)
      .use(keypairIdentity(keypair))
      .use(bundlrStorage());
  }
  return Metaplex.make(connection)
    .use(keypairIdentity(keypair))
    .use(mockStorage());
};

// Problem is in the form of
// "The account of type [MintAccount] was not found at the provided address [4DuUeum1r4MP19SAYfg57LdeqeWui7Z5a8mc1KCTiS1N]."
const getAddressFromProblem = (problem: string): string | null => {
  const regex = /provided address \[(.*)\]/g;
  const matches = [...problem.matchAll(regex)];
  if (!matches.length) {
    return null;
  }

  // First match, item 2
  return matches[0][1];
};

// Create an identityToken, it will be owned by identityTokenIssuer
export const mintIdentityToken = async (
  connection: Connection,
  recipientWallet: PublicKey,
  tokenContents: VerifiedClaimsForIndividual | VerifiedClaimsForOrganization,
  identityTokenIssuer: Keypair,
  isProduction: boolean
) => {
  log(`🏦 Minting identity token...`);

  // TODO: use NonFungibleTokenMetadataStandard, maybe (it's kinda aimed at digital art)
  let tokenMetaData: TokenMetaData;
  if (tokenContents.type === "INDIVIDUAL") {
    tokenMetaData = makeTokenMetaDataForIndividual(
      recipientWallet,
      tokenContents.givenName,
      tokenContents.familyName,
      tokenContents.imageUrl
    );
  } else {
    if (tokenContents.type === "ORGANIZATION") {
      tokenMetaData = makeTokenMetaDataForOrganization(
        recipientWallet,
        tokenContents.legalName,
        tokenContents.imageUrl
      );
    }
    if (!tokenMetaData) {
      throw new Error(
        `COuld not work out why type of token metadata to create.`
      );
    }
  }

  const metaplex = getMetaplex(connection, identityTokenIssuer, isProduction);
  const metaplexNFTs = metaplex.nfts();
  // TODO: see norte re: NonFungibleTokenMetadataStandard above
  // @ts-ignore
  const uploadResponse = await metaplexNFTs.uploadMetadata(tokenMetaData);

  // From https://github.com/metaplex-foundation/js#create
  // "This will take care of creating the mint account, the associated token account, the metadata PDA and the original edition PDA (a.k.a. the master edition) for you.""
  // Full parameters at https://github.com/metaplex-foundation/js/blob/main/packages/js/src/plugins/nftModule/createNft.ts#L64

  // See https://github.com/metaplex-foundation/js-examples/blob/main/getting-started-expressjs/createNFT.cjs too

  // Sometimes fails with
  let tokenCreateOutput: CreateNftOutput;
  try {
    tokenCreateOutput = await metaplexNFTs.create({
      uri: uploadResponse.uri, // "https://arweave.net/123",
      name: IDENTITY_TOKEN_NAME,
      sellerFeeBasisPoints: 0, // 500 would represent 5.00%.
    });
  } catch (thrownError) {
    const error = thrownError as Error;

    // See https://github.com/metaplex-foundation/js/issues/148
    if (error.message.includes("Failed to pack instruction data")) {
      throw new Error(
        `Increase Sol balance of wallet for token issuer ${identityTokenIssuer.publicKey.toBase58()}`
      );
    }

    if (error.message.includes("insufficient lamports")) {
      throw new Error(
        `⚠️ The token mint account has run out of Sol. Please send a small amount of Sol to the Token issuer account ${identityTokenIssuer.publicKey.toBase58()}`
      );
    }

    // Another possible error - this may be a metaplex bug
    // Unexpected error Account Not Found
    // >> Source: SDK
    // >> Problem: The account of type [MintAccount] was not found at the provided address [51pE2seG8HAk9ToWrKQfakMWrp3dJ8RPqRnnXu9jqyzV].
    // >> Solution: Ensure the provided address is correct and that an account exists at this address.
    log(`Potential metaplex bug found when creating NFT: ${error.message}`);

    // @ts-ignore - error.problem does actually exist.
    const errorProblem = error.problem;
    if (errorProblem) {
      const mintAddressInProblem = getAddressFromProblem(errorProblem);
      if (mintAddressInProblem) {
        throw new Error(
          `Metaplex couldn't find the mint account, but https://explorer.solana.com/address/${mintAddressInProblem}`
        );
      }
    }

    log(`Unexpected error creating NFT:`, error.message);
    throw error;
  }

  log(
    `🎟️ The token for ${
      tokenContents.type === "INDIVIDUAL"
        ? tokenContents.givenName
        : tokenContents.legalName
    } has been created, senderTokenAccount is ${
      tokenCreateOutput.tokenAddress
    }.`
  );

  return tokenCreateOutput;
};

// Transfer the token to the recipient's wallet
// https://github.com/solana-labs/solana-program-library/blob/master/token/js/examples/createMintAndTransferTokens.ts

export const transferIdentityToken = async (
  connection: Connection,
  mintAddress: PublicKey,
  senderTokenAccount: PublicKey,
  recipientWallet: PublicKey,
  identityTokenIssuer: Keypair
) => {
  log(`Transferring token to final destination...`);
  let signature: string;
  try {
    const transaction = await makeTransaction(
      connection,
      senderTokenAccount,
      recipientWallet,
      identityTokenIssuer,
      1,
      mintAddress,
      null
    );

    signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [identityTokenIssuer],
      {
        // https://solanacookbook.com/guides/retrying-transactions.html#facts
        maxRetries: 6,
      }
    );

    log(`Transferred token to final destination!`, signature);
  } catch (thrownObject) {
    const error = thrownObject as Error;
    log(`⚠️ Could not transfer token to final destination: ${error.message}`);
    throw error;
  }

  return signature;
};

// From https://solana.stackexchange.com/questions/137/how-do-i-get-all-nfts-for-a-given-wallet
export const getAllNftMetadatasFromAWallet = async (
  connection: Connection,
  metaplexKeypair: Keypair,
  wallet: PublicKey
) => {
  const metaplex = new Metaplex(connection);
  metaplex.use(keypairIdentity(metaplexKeypair));

  const owner = new PublicKey(wallet);
  const findNftsByOwnerOutput = await metaplex.nfts().findAllByOwner({
    owner,
  });

  return findNftsByOwnerOutput;
};

// TODO: comply with https://docs.metaplex.com/programs/token-metadata/token-standard
// See types.ts
export const makeTokenMetaDataForIndividual = (
  wallet: PublicKey,
  givenName: string,
  familyName: string,
  imageUrl: string
): TokenMetaData => {
  return {
    version: LATEST_IDENTITY_TOKEN_VERSION,
    // In future this can be removed, however right now Solana
    // token standard doesn't support non-transferrable tokens
    // So check that that token wasn't issued against another wallet and transferred
    issuedAgainst: wallet.toBase58(),
    claims: {
      type: "INDIVIDUAL",
      givenName,
      familyName,
      imageUrl,
    },
  };
};

export const getFullNFTsFromWallet = async (
  keypair: Keypair,
  connection: Connection,
  address: PublicKey
) => {
  const metaplex = new Metaplex(connection);
  metaplex.use(keypairIdentity(keypair));

  const owner = new PublicKey(address);
  const nftMetadatas = await metaplex.nfts().findAllByOwner({
    owner,
  });

  const nfts = await asyncMap(nftMetadatas, async (metadata) => {
    return (
      metaplex
        .nfts()
        // TODO: hacking, this is probably a bad idea but apparently .findAllByOwner() may return a bunch of different types of objects
        // @ts-ignore
        .load({ metadata })
    );
  });

  const nftData = await asyncMap(nfts, async (nft) => {
    try {
      const responseBody = await http.get(nft.uri);
      const datum = responseBody;
      return datum;
    } catch (thrownObject) {
      const error = thrownObject as Error;
      log(error.message);
      return null;
    }
  });

  return nftData;
};

export const getIdentityTokensFromWallet = async (
  connection: Connection,
  metaplexConnectionKeypair: Keypair,
  identityTokenIssuerPublicKey: PublicKey,
  wallet: PublicKey
) => {
  const metaplex = getMetaplex(connection, metaplexConnectionKeypair);
  const nfts = await metaplex.nfts().findAllByOwner({
    owner: wallet,
  });

  const identityTokens = nfts.filter((nft) => {
    // Quick note we need to toBase58() both addresses for the comparison to work.
    const tokenCreator = nft?.creators?.[0]?.address.toBase58();
    const portalCompany = identityTokenIssuerPublicKey.toBase58();
    return tokenCreator === portalCompany;
  });

  return identityTokens;
};

export const makeTokenMetaDataForOrganization = (
  wallet: PublicKey,
  legalName: string,
  imageUrl: string
): TokenMetaData => {
  return {
    version: LATEST_IDENTITY_TOKEN_VERSION,
    // In future this can be removed, however right now Solana
    // token standard doesn't support non-transferrable tokens
    // So check that that token wasn't issued against another wallet and transferred
    issuedAgainst: wallet.toBase58(),
    claims: {
      type: "ORGANIZATION",
      // Eg: https://find-and-update.company-information.service.gov.uk/search?q=portal+payments
      legalName,
      jurisdiction: "Country",
      country: "United Kingdom",
      isNotable: false,
      imageUrl,
    },
  };
};
