import { getTransactionsByDays, summarizeTransaction } from "./transactions";
import {
  MOCK_SENDER_PUBLIC_KEY,
  MOCK_RECIPIENT_PUBLIC_KEY,
} from "./test-data/transactions/mocks";
import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import {
  sendToExistingTokenAccountSenderComesFirst,
  sendToExistingTokenAccountSenderComesSecond,
} from "./test-data/transactions/sendToExistingTokenAccount";
import {
  EMPTY,
  getCurrencyByName,
  GREGS_WALLET,
  JOHN_TESTUSER_DEMO_WALLET,
  MIKES_WALLET,
  YCOMBINATOR_DEMO_WALLET_FOR_JARED,
} from "./constants";
import { Currency, type TransactionSummary, Direction } from "../lib/types";

import { hexToUtf8, log, stringify } from "./functions";
import { sendFiveUSDC } from "./test-data/transactions/sendFiveUSDC";
import { swapSolWithUSDCOnJupiter } from "./test-data/transactions/swapSolWithUSDC";
import { sendingMoneyToSelf } from "./test-data/transactions/sendingMoneyToSelf";
import {
  sendingSol,
  sendingSolWithMemo,
  sendingSolWithNote,
} from "./test-data/transactions/sendingSol";
import { sendingUSDH } from "./test-data/transactions/sendingUSDH";

jest.mock("./functions");

const contacts = [
  {
    walletAddress: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
    isNew: false,
    isPending: false,
    verifiedClaims: {
      // TODO: kinda odd but we have to satify the TS compiler
      type: "INDIVIDUAL" as "INDIVIDUAL",
      givenName: "Jared",
      familyName: "Friedman",
      imageUrl:
        "https://arweave.net/wthKTNtIJezFDl3uevmGfGLiYdZ-5IN5LlfvLJNWc9U",
    },
  },
];

const transactionSummaries: Array<TransactionSummary> = [
  {
    id: "1",
    date: 1662985498000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 1000000,
    currency: Currency.USDC,
    from: MIKES_WALLET,
    to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
    memo: null,
    receipt: null,
  },
  {
    id: "2",
    date: 1662741437000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 500000,
    currency: Currency.USDC,
    from: MIKES_WALLET,
    to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
    memo: null,
    receipt: null,
  },
  // Sneaky sol transaction - we don't want to see this in our USDC transaction summary!
  {
    id: "3",
    date: 1662733089000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 30000000,
    currency: Currency.SOL,
    from: MIKES_WALLET,
    to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
    memo: null,
    receipt: null,
  },
  {
    id: "4",
    date: 1662657138000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 70000,
    currency: Currency.USDC,
    from: MIKES_WALLET,
    to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
    memo: null,
    receipt: null,
  },
  {
    id: "5",
    date: 1662656099000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 210000,
    currency: Currency.USDC,
    from: MIKES_WALLET,
    to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
    memo: null,
    receipt: null,
  },
  {
    id: "6",
    date: 1662654222000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 230000,
    currency: Currency.USDC,
    from: MIKES_WALLET,
    to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
    memo: null,
    receipt: null,
  },
  {
    id: "7",
    date: 1662653886000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 210000,
    currency: Currency.USDC,
    from: MIKES_WALLET,
    to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
    memo: null,
    receipt: null,
  },
  {
    id: "8",
    date: 1662643371000,
    status: true,
    networkFee: 5000,
    direction: 0,
    amount: 70000,
    currency: Currency.USDC,
    from: MIKES_WALLET,
    to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
    memo: null,
    receipt: null,
  },
];

describe(`transaction summaries`, () => {
  // Mike using Jupiter DEX, picking Orca, swapping some Sol for USDC
  test(`We can produce a transaction summary from swapping Sol for USDC on Jupiter`, async () => {
    const portalTransactionSummary = await summarizeTransaction(
      // TODO: fix 'transaction.message.accountKeys' (is a string, should be something else)
      // in the demo transaction below
      // @ts-ignore
      swapSolWithUSDCOnJupiter,
      new PublicKey(MIKES_WALLET),
      null,
      false
    );

    expect(portalTransactionSummary).toEqual({
      amount: 32903572,
      currency: 4,
      date: 1673260796000,
      direction: 1,
      from: "7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm",
      id: "4SBiyR6rrie4M78S2dLQjkcb8Ja1mFmuAL4furw5NcpKZkYjsC31EWtycLY3WdatngkiLPEqGwTPncAg41fQATFW",
      memo: null,
      networkFee: 5000,
      receipt: null,
      status: true,
      to: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2UJnM",
    });
  });

  // Mike sending CnBEqiUpz9iK45GTsfu3Ckgp9jnjpoCNrRjSPSdQbqGs with glow
  test(`We can produce a transaction summary from us sending someone money with glow`, async () => {
    const portalTransactionSummary = await summarizeTransaction(
      // TODO: fix 'transaction.message.accountKeys' (is a string, should be something else)
      // in the demo transaction below
      // @ts-ignore
      sendFiveUSDC,
      new PublicKey(MIKES_WALLET),
      null,
      false
    );

    expect(portalTransactionSummary).toEqual({
      id: "5e9xViaBigEX6G17PvHt9AizyJwRBHPdxCEkz2eLRYsanr53567SHzULhYT6zk63vbsZ4puN3WY7i5774HS7CneZ",
      date: 1669052844000,
      status: true,
      networkFee: 5000,
      direction: 0,
      amount: 5000000,
      currency: 0,
      from: MIKES_WALLET,
      to: GREGS_WALLET,
      memo: "Hey Greg! 🙋🏻‍♂️",
      receipt: null,
    });
  });

  test(`We can produce a transaction summary from someone sending us money with glow`, async () => {
    // Same transaction as before but with perspective shifted to greg
    const portalTransactionSummary = await summarizeTransaction(
      // TODO: fix 'transaction.message.accountKeys' (is a string, should be something else)
      // in the demo transaction below
      // @ts-ignore
      sendFiveUSDC,
      new PublicKey(GREGS_WALLET)
    );

    expect(portalTransactionSummary).toEqual({
      id: "5e9xViaBigEX6G17PvHt9AizyJwRBHPdxCEkz2eLRYsanr53567SHzULhYT6zk63vbsZ4puN3WY7i5774HS7CneZ",
      date: 1669052844000,
      status: true,
      networkFee: 5000,
      direction: 1,
      amount: 5000000,
      currency: Currency.USDC,
      from: MIKES_WALLET,
      to: GREGS_WALLET,
      memo: "Hey Greg! 🙋🏻‍♂️",
      receipt: null,
    });
  });

  test(`We can produce a transaction summary from someone sending us USDH`, async () => {
    // Same transaction as before but with perspective shifted to greg
    const portalTransactionSummary = await summarizeTransaction(
      // TODO: fix 'transaction.message.accountKeys' (is a string, should be something else)
      // in the demo transaction below
      // @ts-ignore
      sendingUSDH,
      new PublicKey(MIKES_WALLET)
    );

    expect(portalTransactionSummary).toEqual({
      id: "4gknQh12svZHqrZN9sKCHetaP87TbPns6pd83jknZPA3vEjN7jQ53sA3xpVs7ZH2oeCKnjrgHDqVMMxf3vBMoTwz",
      amount: 1000000,
      currency: 1,
      date: 1667306128000,
      direction: 1,
      from: "BfkRD3gGQGLjHxUw7oqhizkaxrDrw7itHT98f9j2gh6t",
      memo: null,
      networkFee: 10000,
      receipt: null,
      status: true,
      to: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2UJnM",
    });
  });

  // 'USDC' on our local environment is just a token mint account we make
  const getFakeMintToCurrencyMapFromTestTransaction = (
    rawTransaction: ParsedTransactionWithMeta
  ) => {
    const fakeUSDCTokenAccount = rawTransaction.meta.preTokenBalances[0].mint;
    const fakeMintToCurrencyMap = {
      [fakeUSDCTokenAccount]: {
        id: Currency.USDC,
        name: "USDC local testing",
        decimals: 6,
      },
    };
    return fakeMintToCurrencyMap;
  };

  test(`We can produce a transaction summary from a pre-cooked transaction where the sender is first`, async () => {
    const currentUserWallet = MOCK_SENDER_PUBLIC_KEY;

    const fakeMintToCurrencyMap = getFakeMintToCurrencyMapFromTestTransaction(
      sendToExistingTokenAccountSenderComesFirst
    );

    const portalTransactionSummary = await summarizeTransaction(
      sendToExistingTokenAccountSenderComesFirst,
      new PublicKey(currentUserWallet),
      fakeMintToCurrencyMap
    );

    expect(portalTransactionSummary).toEqual({
      id: "2PF9JkUYfARqWbxFv5fBNLK7VhQ9NTsSA5QYcUUNDTQZyX4JATE8TjnLBhoaMNsZ1F1ETUxmM8LUygqRUBtbhgFS",
      date: 1663119635000,
      status: true,
      networkFee: 5000,
      direction: Direction.sent,
      amount: 50,
      currency: Currency.USDC,
      from: MOCK_SENDER_PUBLIC_KEY,
      to: MOCK_RECIPIENT_PUBLIC_KEY,
      memo: null,
      receipt: null,
    });
  });

  test(`We can produce a transaction summary from a pre-cooked transaction where the sender isn't first`, async () => {
    const currentUserWallet = MOCK_SENDER_PUBLIC_KEY;

    const fakeMintToCurrencyMap = getFakeMintToCurrencyMapFromTestTransaction(
      sendToExistingTokenAccountSenderComesSecond
    );
    const portalTransactionSummary = await summarizeTransaction(
      // TODO: our logged transaction.message seems to be missing some properties - investigate - could just be typescript types not being up to date
      // @ts-ignore
      sendToExistingTokenAccountSenderComesSecond,
      new PublicKey(currentUserWallet),
      fakeMintToCurrencyMap
    );

    expect(portalTransactionSummary).toEqual({
      id: "3VsPLbEgjT2YTGp6PWXBDDc6kMFd4UwLHNWWNzjvf1QMutAihtDYzmfUY6Wdr2MffBDmNhP1YPR681d9Y9CgXe2V",
      date: 1663120787000,
      status: true,
      networkFee: 5000,
      direction: Direction.sent,
      amount: 50,
      currency: Currency.USDC,
      from: MOCK_SENDER_PUBLIC_KEY,
      to: MOCK_RECIPIENT_PUBLIC_KEY,
      memo: null,
      receipt: null,
    });
  });

  test(`We can produce a transaction summary from a pre-cooked transaction where the sender is first index from recipient's point of view`, async () => {
    const currentUserWallet = MOCK_RECIPIENT_PUBLIC_KEY;

    const fakeMintToCurrencyMap = getFakeMintToCurrencyMapFromTestTransaction(
      sendToExistingTokenAccountSenderComesFirst
    );

    const portalTransactionSummary = await summarizeTransaction(
      // TODO: our logged transaction.message seems to be missing some properties - investigate - could just be typescript types not being up to date
      // @ts-ignore
      sendToExistingTokenAccountSenderComesFirst,
      new PublicKey(currentUserWallet),
      fakeMintToCurrencyMap
    );

    expect(portalTransactionSummary).toEqual({
      id: "2PF9JkUYfARqWbxFv5fBNLK7VhQ9NTsSA5QYcUUNDTQZyX4JATE8TjnLBhoaMNsZ1F1ETUxmM8LUygqRUBtbhgFS",
      date: 1663119635000,
      status: true,
      networkFee: 5000,
      direction: Direction.recieved,
      amount: 50,
      currency: Currency.USDC,
      from: MOCK_SENDER_PUBLIC_KEY,
      to: MOCK_RECIPIENT_PUBLIC_KEY,
      memo: null,
      receipt: null,
    });
  });

  test(`We ignore a transaction of Mike sending himself some money`, async () => {
    const portalTransactionSummary =
      // TODO: 'as' shouldn't be necessary, we should tweak our test data
      await summarizeTransaction(
        sendingMoneyToSelf as ParsedTransactionWithMeta,
        new PublicKey(MIKES_WALLET)
      );

    expect(portalTransactionSummary).toEqual(null);
  });

  test(`Mike sending Jared some lamports`, async () => {
    const portalTransactionSummary =
      // TODO: 'as' shouldn't be necessary, we should tweak our test data
      await summarizeTransaction(
        sendingSol as ParsedTransactionWithMeta,
        new PublicKey(MIKES_WALLET)
      );

    expect(portalTransactionSummary).toEqual({
      id: "5KKQASDKTxoViRWYzN7Rf8X9n3wiiNVztpgpNG1oyyZbkNiai1JVcD4rAV2XYzFPgRP4dXQv7A3Bku68UT4j2FZk",
      amount: 30000000,
      currency: Currency.SOL,
      date: 1662733089000,
      direction: 0,
      from: MIKES_WALLET,
      networkFee: 5000,
      status: true,
      to: YCOMBINATOR_DEMO_WALLET_FOR_JARED,
      memo: null,
      receipt: null,
    });
  });
});

describe(`grouping transactions`, () => {
  test(`grouping transactions`, () => {
    const transactionsByDays = getTransactionsByDays(
      transactionSummaries,
      contacts,
      EMPTY,
      getCurrencyByName("USDC").decimals
    );

    expect(transactionsByDays).toEqual([
      {
        isoDate: "2022-09-12",
        totalSpending: 1000000,
        totalSpendingDisplay: "1.00",
        transactions: [
          {
            id: "1",
            date: 1662985498000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 1000000,
            currency: 0,
            from: MIKES_WALLET,
            to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
            memo: null,
            receipt: null,
          },
        ],
      },
      {
        isoDate: "2022-09-09",
        totalSpending: 30500000,
        totalSpendingDisplay: "0.50",
        transactions: [
          {
            id: "2",
            date: 1662741437000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 500000,
            currency: 0,
            from: MIKES_WALLET,
            to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
            memo: null,
            receipt: null,
          },
          {
            amount: 30000000,
            currency: 3,
            date: 1662733089000,
            direction: 0,
            from: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2UJnM",
            id: "3",
            memo: null,
            networkFee: 5000,
            receipt: null,
            status: true,
            to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
          },
        ],
      },
      {
        isoDate: "2022-09-08",
        totalSpending: 790000,
        totalSpendingDisplay: "0.07",
        transactions: [
          {
            id: "4",
            date: 1662657138000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 70000,
            currency: 0,
            from: MIKES_WALLET,
            to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
            memo: null,
            receipt: null,
          },
          {
            id: "5",
            date: 1662656099000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 210000,
            currency: 0,
            from: MIKES_WALLET,
            to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
            memo: null,
            receipt: null,
          },
          {
            id: "6",
            date: 1662654222000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 230000,
            currency: 0,
            from: MIKES_WALLET,
            to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
            memo: null,
            receipt: null,
          },
          {
            id: "7",
            date: 1662653886000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 210000,
            currency: 0,
            from: MIKES_WALLET,
            to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
            memo: null,
            receipt: null,
          },
          {
            id: "8",
            date: 1662643371000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 70000,
            currency: 0,
            from: MIKES_WALLET,
            to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
            memo: null,
            receipt: null,
          },
        ],
      },
    ]);
  });

  test(`grouping transactions with a filter for Mike's wallet address`, () => {
    const transactionSummariesSmall = [
      {
        id: "1",
        date: 1662985498000,
        status: true,
        networkFee: 5000,
        direction: 0,
        amount: 1000000,
        currency: 0,
        from: MIKES_WALLET,
        to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
        memo: null,
        receipt: null,
      },
    ];

    const transactionsByDays = getTransactionsByDays(
      transactionSummariesSmall,
      contacts,
      MIKES_WALLET,
      getCurrencyByName("USDC").decimals
    );

    expect(transactionsByDays).toEqual([
      {
        isoDate: "2022-09-12",
        totalSpending: 1000000,
        totalSpendingDisplay: "1.00",
        transactions: [
          {
            id: "1",
            date: 1662985498000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 1000000,
            currency: 0,
            from: MIKES_WALLET,
            to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
            memo: null,
            receipt: null,
          },
        ],
      },
    ]);
  });

  test(`grouping transactions with a filter for Jared's name`, () => {
    const transactionSummariesSmall = [
      {
        id: "1",
        date: 1662985498000,
        status: true,
        networkFee: 5000,
        direction: 0,
        amount: 1000000,
        currency: 0,
        from: MIKES_WALLET,
        to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
        memo: null,
        receipt: null,
      },
    ];

    const transactionsByDays = getTransactionsByDays(
      transactionSummariesSmall,
      contacts,
      "jared",
      getCurrencyByName("USDC").decimals
    );

    expect(transactionsByDays).toEqual([
      {
        isoDate: "2022-09-12",
        totalSpending: 1000000,
        totalSpendingDisplay: "1.00",
        transactions: [
          {
            id: "1",
            date: 1662985498000,
            status: true,
            networkFee: 5000,
            direction: 0,
            amount: 1000000,

            currency: 0,
            from: MIKES_WALLET,
            to: "Adyu2gX2zmLmHbgAoiXe2n4egp6x8PS7EFAqcFvhqahz",
            memo: null,
            receipt: null,
          },
        ],
      },
    ]);
  });
});

describe(`memos and notes`, () => {
  test(`We can read a transaction with a memo`, async () => {
    const summary = await summarizeTransaction(
      // TODO: fix 'transaction.message.accountKeys' (is a string, should be something else)
      // in the demo transaction below
      // @ts-ignore
      sendingSolWithMemo,
      new PublicKey(MIKES_WALLET)
    );
    expect(summary).toEqual({
      amount: 210000,
      currency: 0,
      date: 1665683493000,
      direction: 0,
      from: MIKES_WALLET,
      id: "3JRTJXcdu17Br4wFG2RmrYWyueEjHTQXPY8kt9rzM9AM7outauUNLcxAs5yjSFsEvaXbwa4fJVwPyG5srgK8cySM",
      memo: "basketball",
      networkFee: 5000,
      status: true,
      to: "6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG",
      receipt: null,
    });
  });

  test(`We can read a raw note`, () => {
    // Copied from https://explorer.solana.com/tx/PdX96DWpeMRqjxP7tQHU7aVMkjongnQz7mmkLPmvtezvWoJzqnVfJpYu3xxmRWSTngKDQ9A7a4UP4s4Tj463jr4
    const note = hexToUtf8(
      `54657374206e6f746520746f20726563697069656e742066726f6d204d696b65`
    );
    expect(note).toEqual("Test note to recipient from Mike");
  });

  test(`We can extract a note out of a transaction`, async () => {
    const portalTransactionSummary =
      // TODO: 'as' shouldn't be necessary, we should tweak our test data
      await summarizeTransaction(
        sendingSolWithNote as ParsedTransactionWithMeta,
        new PublicKey(JOHN_TESTUSER_DEMO_WALLET)
      );

    expect(portalTransactionSummary).toEqual({
      amount: 100000000,
      currency: Currency.SOL,
      date: 1665584732000,
      direction: 1,
      from: "FSVgrW58amFmH91ZKBic686qVhHayMt3wS8bCpisUph9",
      id: "PdX96DWpeMRqjxP7tQHU7aVMkjongnQz7mmkLPmvtezvWoJzqnVfJpYu3xxmRWSTngKDQ9A7a4UP4s4Tj463jr4",
      networkFee: 5000,
      status: true,
      to: "8N7ek7FydYYt7GfhM8a3PLjj1dh9fTftdVLHnbJdThe7",
      memo: "Test note to recipient from Mike",
      receipt: null,
    });
  });
});
