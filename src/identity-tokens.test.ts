import { Metaplex, Pda } from "@metaplex-foundation/js";
import {
  getAllNftMetadatasFromAWallet,
  getMetaplex,
  getTokenMetaData,
  mintIdentityToken,
} from "./identity-tokens";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { connect, putSolIntoWallet } from "./vmwallet";
import { deepClone, log, stringify } from "./functions";
import {
  IDENTITY_TOKEN_NAME,
  MIKES_WALLET,
  ONE,
  ZERO,
  ENOUGH_TO_MAKE_A_NEW_TOKEN,
} from "./constants";
import { BN as BigNumber } from "bn.js";
import { makeTokenAccount, transferPortalIdentityToken } from "./tokens";

// Quiet utils.log() during tests
// jest.mock("./functions", () => ({
//   ...jest.requireActual("./functions"),
//   log: jest.fn(),
// }));

describe(`identity tokens`, () => {
  let connection: Connection;
  const alice = new Keypair();
  const testIdentityTokenIssuer = new Keypair();
  let mintAddress: PublicKey | null = null;
  let senderTokenAccount: PublicKey | null = null;

  beforeAll(async () => {
    connection = await connect("localhost");
    await putSolIntoWallet(
      connection,
      testIdentityTokenIssuer.publicKey,
      1_000_000_000
    );
  });

  afterAll(async () => {
    // Close connection?
  });

  test(`we can mint an identity token for Alice`, async () => {
    await putSolIntoWallet(connection, alice.publicKey, 1_000_000_000);

    const metadata = getTokenMetaData(
      alice.publicKey.toBase58(),
      "Alice",
      "Smith"
    );

    const name = IDENTITY_TOKEN_NAME;
    const createOutput = await mintIdentityToken(
      connection,
      testIdentityTokenIssuer,
      metadata,
      false
    );

    mintAddress = createOutput.mintAddress;

    // Created fresh, but will be referenced a few times in our output
    //
    // From https://github.com/metaplex-foundation/js#create
    // metaplexNFTs.create will take care of creating the mint account, the associated token account, the metadata PDA and the original edition PDA (a.k.a. the master edition) for you.
    const masterEditionAddress = createOutput.masterEditionAddress;
    const metadataAddress = createOutput.metadataAddress;
    const tokenAddress = createOutput.tokenAddress;
    const updateAuthorityAddress = createOutput.nft.updateAuthorityAddress;

    expect(createOutput).toEqual({
      response: {
        signature: expect.any(String),
        confirmResponse: {
          context: {
            slot: expect.any(Number),
          },
          value: {
            err: null,
          },
        },
      },
      mintAddress: expect.any(PublicKey),
      metadataAddress,
      masterEditionAddress,
      tokenAddress,
      nft: {
        model: "nft",
        updateAuthorityAddress,
        json: metadata,
        jsonLoaded: true,
        name,
        symbol: "",
        // https://mockstorage.example.com/...
        uri: expect.any(String),
        isMutable: true,
        primarySaleHappened: false,
        sellerFeeBasisPoints: 0,
        editionNonce: expect.any(Number),
        creators: [
          {
            address: testIdentityTokenIssuer.publicKey,
            verified: true,
            share: 100,
          },
        ],
        tokenStandard: 0,
        collection: null,
        collectionDetails: null,
        uses: null,
        address: mintAddress,
        metadataAddress: metadataAddress,
        mint: {
          model: "mint",
          address: mintAddress,
          mintAuthorityAddress: expect.any(PublicKey), // masterEditionAddressPDA,
          freezeAuthorityAddress: expect.any(PublicKey), //masterEditionAddressPDA,
          decimals: 0,
          supply: {
            basisPoints: ONE,
            currency: {
              symbol: "Token",
              decimals: 0,
              namespace: "spl-token",
            },
          },
          isWrappedSol: false,
          currency: {
            symbol: "Token",
            decimals: 0,
            namespace: "spl-token",
          },
        },
        token: {
          model: "token",
          address: tokenAddress,
          isAssociatedToken: true,
          mintAddress: mintAddress,
          ownerAddress: testIdentityTokenIssuer.publicKey,
          amount: {
            basisPoints: ONE,
            currency: {
              symbol: "Token",
              decimals: 0,
              namespace: "spl-token",
            },
          },
          closeAuthorityAddress: null,
          delegateAddress: null,
          delegateAmount: {
            basisPoints: ZERO,
            currency: {
              symbol: "Token",
              decimals: 0,
              namespace: "spl-token",
            },
          },
          state: 1,
        },
        edition: {
          model: "nftEdition",
          isOriginal: true,
          address: masterEditionAddress,
          // TODO: this is zero, but in a lsightly different form
          // from new BigNum(0). Actually check value.
          supply: expect.any(BigNumber),
          // TODO: this is zero, but in a lsightly different form
          // from new BigNum(0). Actually check value.
          maxSupply: expect.any(BigNumber),
        },
      },
    });
  });

  test(`We can retrieve the NFT we just minted`, async () => {
    const metaplex = await getMetaplex(connection, testIdentityTokenIssuer);
    if (!mintAddress) {
      throw new Error(`Couldn't get a mint address`);
    }
    const nft = await metaplex.nfts().findByMint({ mintAddress }).run();

    const artistAddress = nft.mint.mintAuthorityAddress;
    const nftAddress = nft.address;

    // log(stringify(nft));

    expect(nft).toEqual({
      model: "nft",
      updateAuthorityAddress: expect.any(PublicKey),
      json: null,
      jsonLoaded: true,
      name: IDENTITY_TOKEN_NAME,
      symbol: "",
      // Eg https://mockstorage.example.com/ew211zOcizEL1IKjaY2N
      uri: expect.any(String),
      isMutable: true,
      primarySaleHappened: false,
      sellerFeeBasisPoints: 0,
      editionNonce: expect.any(Number),
      creators: [
        {
          address: expect.any(PublicKey),
          verified: true,
          share: 100,
        },
      ],
      tokenStandard: 0,
      collection: null,
      collectionDetails: null,
      uses: null,
      address: expect.any(PublicKey),
      metadataAddress: expect.any(PublicKey),
      mint: {
        model: "mint",
        address: nftAddress,
        mintAuthorityAddress: artistAddress,
        freezeAuthorityAddress: artistAddress,
        decimals: 0,
        supply: {
          basisPoints: ONE,
          currency: {
            symbol: "Token",
            decimals: 0,
            namespace: "spl-token",
          },
        },
        isWrappedSol: false,
        currency: {
          symbol: "Token",
          decimals: 0,
          namespace: "spl-token",
        },
      },
      edition: {
        model: "nftEdition",
        isOriginal: true,
        address: expect.any(Pda),
        // Both zero
        supply: expect.any(BigNumber),
        maxSupply: expect.any(BigNumber),
      },
    });
  });

  test(`We make an Associated Token Account for the Portal Identity Token in Alice's wallet`, async () => {
    if (!mintAddress) {
      throw new Error(`You need to mint a token first`);
    }
    const destinationTokenAccount = await makeTokenAccount(
      connection,
      testIdentityTokenIssuer,
      mintAddress,
      alice.publicKey
    );

    expect(destinationTokenAccount).toEqual({
      address: expect.any(PublicKey),
      amount: BigInt(0),
      closeAuthority: null,
      delegate: null,
      delegatedAmount: BigInt(0),
      isFrozen: false,
      isInitialized: true,
      isNative: false,
      mint: mintAddress,
      owner: alice.publicKey,
      rentExemptReserve: null,
    });
  });

  // test(`We can transfer the NFT we just made to the Associated Token Account in Alice's wallet`, async () => {
  //   const signature = await transferPortalIdentityToken(
  //     connection,
  //     testIdentityTokenIssuer,
  //     // TODO: check this account from the NFT output above
  //     senderTokenAccount,
  //     alice.publicKey
  //   );
  // });

  // test(`We can get the associated token account for Portal Identity Token for alice's wallet`, () => {
  //   //
  // });

  // test(`We can read the Portal Identity Token from the Alice's wallet's Portal Identity Token account`, () => {
  //   //
  // });
});
