// This file is part of Portal Wallet.
//
// Portal Wallet is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, specifically version 2 of the License.
//
// Portal Wallet is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Portal Wallet. If not, see <https://www.gnu.org/licenses/>.
//
import type { Connection, Keypair } from "@solana/web3.js";
import { Keypair as KeypairConstructor } from "@solana/web3.js";
import { log } from "./functions";
import {
  personalPhraseToEntropy,
  mnemonicToKeypairs,
  entropyToMnemonic,
  checkIfSecretKeyIsValid,
  checkIfMnemonicPhraseIsValid,
} from "./recovery-token";
import { DEPOSIT, SECONDS } from "./constants";
import { connect, getAccountBalance, putSolIntoWallet } from "./wallet";
import * as dotenv from "dotenv";
import * as base58 from "bs58";
import { expectedCleanedPersonalPhrase } from "./phrase-cleaning.test";
import * as bip39 from "bip39";

jest.mock("./functions");

const firstName = `Joe`;
const lastName = `Cottoneye`;

const fullName = `${firstName} ${lastName}`;
const password = `${new Date().toString()}`;

dotenv.config();

describe(`traditional keypair creation and restoration`, () => {
  let connection: Connection;
  const mnemonic = bip39.generateMnemonic();
  let originalWallet: Keypair;
  let restoredWallet: Keypair;

  beforeAll(async () => {
    connection = await connect("localhost");
  });

  test(`wallets can be created from a mnemonic`, async () => {
    const seed = bip39.mnemonicToSeedSync(mnemonic, password);
    originalWallet = KeypairConstructor.fromSeed(seed.slice(0, 32));

    // IMPORTANT: if we don't deposit any Sol the wallet won't exist
    await putSolIntoWallet(connection, originalWallet.publicKey, DEPOSIT);

    const accountBalance = await getAccountBalance(
      connection,
      originalWallet.publicKey
    );
    expect(accountBalance).toEqual(DEPOSIT);
  });

  test(`wallets can be restored using their seed phrases`, async () => {
    // Lets re-make the keypairs from the seed

    const restoredKeypairs = await mnemonicToKeypairs(mnemonic, password);

    restoredWallet = restoredKeypairs[0];
    expect(restoredWallet.secretKey).toEqual(originalWallet.secretKey);
    expect(restoredWallet.publicKey.toBase58()).toEqual(
      originalWallet.publicKey.toBase58()
    );
  });
});

describe(`recovery`, () => {
  test(`we show a valid secret key is valid`, () => {
    const mikesSecretKey = process.env.MIKES_SECRET_KEY;
    expect(mikesSecretKey).toBeDefined();
    const result = checkIfSecretKeyIsValid(mikesSecretKey);
    expect(result).toBeTruthy();
  });

  test(`we show a bad secret key is bad`, () => {
    const result = checkIfSecretKeyIsValid("im a bad secret key");
    expect(result).toBeFalsy();
  });

  test(`We can check if mnemonics are valid`, () => {
    const mikesMnemonic = process.env.MIKES_MNEMONIC;
    expect(mikesMnemonic).toBeDefined();
    const result = checkIfMnemonicPhraseIsValid(mikesMnemonic);
    expect(result).toBeTruthy();
  });

  test(`We show a bad mnemonic key is bad`, () => {
    const result = checkIfMnemonicPhraseIsValid("i am not a vlaid mnemonic");
    expect(result).toBeFalsy();
  });

  test(`Using Mike's mnemonic generates Mike's correct secret key`, async () => {
    const mikesSecretKey = process.env.MIKES_SECRET_KEY;
    const mikesMnemonic = process.env.MIKES_MNEMONIC;
    const secretKeyOne = base58.decode(mikesSecretKey);

    const keypairs = await mnemonicToKeypairs(mikesMnemonic, null);
    const firstWallet = keypairs[0];
    const secretKeyTwo = firstWallet.secretKey;

    expect(secretKeyOne).toEqual(secretKeyTwo);
  });
});
