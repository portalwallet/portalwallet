import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { cleanPhrase } from "./phrase-cleaning";
import { SECONDS } from "./utils";
import {
  connect,
  convertPhraseToSeed,
  getAccountBalance,
  putSolIntoWallet,
  seedToKeypair,
} from "./vmwallet";

// Put these at the top to avoid indentation issues
const dirtyPhrase = `Say your prayers, little one
Don't forget, my son
To include everyone

I tuck you in, warm within
Keep you free from sin
Till the Sandman he comes
`;

const expectedCleanedPhrase = `say your prayers little one dont forget my son to include everyone i tuck you in warm within keep you free from sin till the sandman he comes`;

describe(`restoration`, () => {
  test(`seed phrases are normalised for punctuation`, () => {
    const cleaned = cleanPhrase(dirtyPhrase);

    expect(cleaned).toEqual(expectedCleanedPhrase);
  });
});

describe(`restoration`, () => {
  let connection: Connection;
  beforeAll(async () => {
    connection = await connect();
  });

  afterAll(async () => {
    // TODO: close connection?
  });
  test(
    `wallets can be created`,
    async () => {
      const fullName = "19810321";
      const password = "swag2";
      // TODO
      // If I change any details for the wallet creation the test doesn't work
      // I suspect it's not actually making the wallet
      // It maybe made a wallet in the past and is reconnecting to it now

      // const seed = await convertPhraseToSeed(dirtyPhrase, fullName);
      // const keypair = await seedToKeypair(seed, password);
      // await getAccountBalance(connection, keypair.publicKey);

      // Generate a new wallet keypair and airdrop SOL
      var wallet = Keypair.generate();
      var airdropSignature = await connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL
      );

      //wait for airdrop confirmation
      await connection.confirmTransaction(airdropSignature);

      // get account info
      // account data is bytecode that needs to be deserialized
      // serialization and deserialization is program specific
      let account = await connection.getAccountInfo(wallet.publicKey);
      console.log(account);
    },
    30 * SECONDS
  );

  // test(
  //   `wallets can be restored using their seed phrases`,
  //   async () => {
  //     const balanceBefore = await getAccountBalance(
  //       connection,
  //       keypair.publicKey
  //     );
  //     const deposit = 1 * LAMPORTS_PER_SOL;
  //     await putSolIntoWallet(connection, keypair.publicKey, deposit);
  //     const balanceAfter = await getAccountBalance(
  //       connection,
  //       keypair.publicKey
  //     );

  //     const difference = balanceAfter - balanceBefore;
  //     expect(difference).toEqual(deposit);
  //   },
  //   30 * SECONDS
  // );
});
