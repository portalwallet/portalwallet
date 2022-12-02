import {
  getDecafReceiptMessage,
  getRawReceiptFromMessage,
  getReceiptForTransactionSummary,
  getReceiptSummaryFromRawReceipt,
} from "./receipts";
import { stringify, log } from "./functions";
import { mikesKeypair } from "./get-mikes-keypair";
import { ThreadMemberScope } from "@dialectlabs/sdk";
import { rawReceipt } from "./__mocks__/receipt";

describe(`dialect`, () => {
  test(`getting messages`, async () => {
    // Date Mike bought a t shirt
    const transactionDate = new Date("November 05, 2022 20:10:02").valueOf();

    const receiptMessage = await getDecafReceiptMessage(
      mikesKeypair,
      transactionDate
    );

    expect(receiptMessage).toEqual({
      author: {
        address: "dcafKdWLATod3BLRngsqZ7CrQwcrUxrLjFWYJwYP1Fy",
        scopes: ["ADMIN", "WRITE"],
      },
      timestamp: expect.anything(),
      text: "Thank you for your order! You can find your receipt here: https://www.decaf.so/receipt/XgVU1qK4i4zXKanjHZpr",
    });
  });

  test(`Getting receipts from messages`, async () => {
    const rawReceipt = await getRawReceiptFromMessage({
      author: {
        address: "dcafKdWLATod3BLRngsqZ7CrQwcrUxrLjFWYJwYP1Fy",
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
      timestamp: expect.anything(),
      text: "Thank you for your order! You can find your receipt here: https://www.decaf.so/receipt/XgVU1qK4i4zXKanjHZpr",
    });

    expect(rawReceipt).toMatchSnapshot();
  });

  test(`Getting receiptSummary from raw receipts`, async () => {
    const receiptSummary = getReceiptSummaryFromRawReceipt(rawReceipt);
    log(stringify(receiptSummary));
    expect(receiptSummary).toMatchObject({
      items: [
        {
          name: "Not Financial Advice Tee",
          price: 32,
          quantity: 1,
        },
      ],
      shop: "Solana Spaces Breakpoint",
    });
  });

  test(`Adds receipts to transaction that have them`, async () => {
    const transactionSummary = {
      id: "2Wgzyv1fFFiF4jd8ckPvSJa2eRBHF7pj3wbeTpEzMvqzpfx1jpUgWUZbJW9h915rxWccNqZ9ksFjP7PVVckArZtX",
      date: 1667679002000,
      status: true,
      networkFee: 10000,
      direction: 0,
      amount: 32000000,
      currency: 0,
      from: "5FHwkrdxntdK24hgQU8qgBjn35Y1zwhz1GZwCkP2UJnM",
      to: "4iDRFnp2N4UAsZEePHAxs7ozBanQcGtLYd12HG2HJm4s",
      memo: "qqS5qxxEjMg7mSup0rBI",
    };

    const receipt = await getReceiptForTransactionSummary(
      mikesKeypair,
      transactionSummary.memo,
      transactionSummary.date
    );
    expect(receipt).toMatchObject({});
  });
});
