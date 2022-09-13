// Put these at the top to avoid indentation issues
export const dirtyPhrase = `Say your prayers, little one
Don't forget, my son
To include everyone

I tuck you in, warm within
Keep you free from sin
Till the Sandman he comes
`;

export const expectedCleanedPhrase = `say your prayers little one dont forget my son to include everyone i tuck you in warm within keep you free from sin till the sandman he comes`;

export const MOCK_SENDER_PUBLIC_KEY =
  "AfpdXGBdFiyQfXdf4x3yYWiJgPqp6xBNvy3UwHyuLgGn";
export const MOCK_RECIPIENT_PUBLIC_KEY =
  "2DCC44zP2BDxTKzgi4yYScEJmbyhW2G8aYCQUrEcABts";

export const transactionResponseSenderComesFirst = {
  blockTime: 1663119635,
  meta: {
    err: null,
    fee: 5000,
    innerInstructions: [],
    logMessages: [
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
      "Program log: Instruction: Transfer",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3199 of 200000 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
    ],
    postBalances: [999995000, 2039280, 2039280, 1],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: "kp2Fz8PctAEZd7Mk6XMhz5aZ7kxwvHBrvRfcaokLo6s",
        owner: MOCK_SENDER_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "370",
          decimals: 2,
          uiAmount: 3.7,
          uiAmountString: "3.7",
        },
      },
      {
        accountIndex: 2,
        mint: "kp2Fz8PctAEZd7Mk6XMhz5aZ7kxwvHBrvRfcaokLo6s",
        owner: MOCK_RECIPIENT_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "50",
          decimals: 2,
          uiAmount: 0.5,
          uiAmountString: "0.5",
        },
      },
    ],
    preBalances: [1000000000, 2039280, 2039280, 1],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: "kp2Fz8PctAEZd7Mk6XMhz5aZ7kxwvHBrvRfcaokLo6s",
        owner: MOCK_SENDER_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "420",
          decimals: 2,
          uiAmount: 4.2,
          uiAmountString: "4.2",
        },
      },
      {
        accountIndex: 2,
        mint: "kp2Fz8PctAEZd7Mk6XMhz5aZ7kxwvHBrvRfcaokLo6s",
        owner: MOCK_RECIPIENT_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "0",
          decimals: 2,
          uiAmount: null,
          uiAmountString: "0",
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 86144,
  transaction: {
    message: {
      accountKeys: [
        {
          pubkey: MOCK_SENDER_PUBLIC_KEY,
          signer: true,
          writable: true,
        },
        {
          pubkey: "12dDNgiaFfebHtoZo1p43gYUPpnoPbHXngMSDBUbXwtf",
          signer: false,
          writable: true,
        },
        {
          pubkey: "E477JFPCYqp5RyPNzeaCP1XP2ExaroBwufAwNPu17UVu",
          signer: false,
          writable: true,
        },
        {
          pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          signer: false,
          writable: false,
        },
      ],
      instructions: [
        {
          parsed: {
            info: {
              amount: "50",
              authority: MOCK_SENDER_PUBLIC_KEY,
              destination: "E477JFPCYqp5RyPNzeaCP1XP2ExaroBwufAwNPu17UVu",
              source: "12dDNgiaFfebHtoZo1p43gYUPpnoPbHXngMSDBUbXwtf",
            },
            type: "transfer",
          },
          program: "spl-token",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      recentBlockhash: "5kVFBB8dLXho4YWUgCMP4c4Hrrrzor9RkcAciePWjgtf",
    },
    signatures: [
      "2PF9JkUYfARqWbxFv5fBNLK7VhQ9NTsSA5QYcUUNDTQZyX4JATE8TjnLBhoaMNsZ1F1ETUxmM8LUygqRUBtbhgFS",
    ],
  },
};

export const transactionResponseSenderComesSecond = {
  blockTime: 1663120787,
  meta: {
    err: null,
    fee: 5000,
    innerInstructions: [],
    logMessages: [
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
      "Program log: Instruction: Transfer",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 3199 of 200000 compute units",
      "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
    ],
    postBalances: [999995000, 2039280, 2039280, 1],
    postTokenBalances: [
      {
        accountIndex: 1,
        mint: "3gQx1MzTPkfJCyr6grUrLZYXJ9vQKD2Vzbvnt8zLyW26",
        owner: MOCK_RECIPIENT_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "50",
          decimals: 2,
          uiAmount: 0.5,
          uiAmountString: "0.5",
        },
      },
      {
        accountIndex: 2,
        mint: "3gQx1MzTPkfJCyr6grUrLZYXJ9vQKD2Vzbvnt8zLyW26",
        owner: MOCK_SENDER_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "370",
          decimals: 2,
          uiAmount: 3.7,
          uiAmountString: "3.7",
        },
      },
    ],
    preBalances: [1000000000, 2039280, 2039280, 1],
    preTokenBalances: [
      {
        accountIndex: 1,
        mint: "3gQx1MzTPkfJCyr6grUrLZYXJ9vQKD2Vzbvnt8zLyW26",
        owner: MOCK_RECIPIENT_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "0",
          decimals: 2,
          uiAmount: null,
          uiAmountString: "0",
        },
      },
      {
        accountIndex: 2,
        mint: "3gQx1MzTPkfJCyr6grUrLZYXJ9vQKD2Vzbvnt8zLyW26",
        owner: MOCK_SENDER_PUBLIC_KEY,
        uiTokenAmount: {
          amount: "420",
          decimals: 2,
          uiAmount: 4.2,
          uiAmountString: "4.2",
        },
      },
    ],
    rewards: [],
    status: {
      Ok: null,
    },
  },
  slot: 87296,
  transaction: {
    message: {
      accountKeys: [
        {
          pubkey: MOCK_SENDER_PUBLIC_KEY,
          signer: true,
          writable: true,
        },
        {
          pubkey: "6ZyWQ1aA8Sbsz2oFyzNWmb6ik7Wy1Qz4CYuvRqGsTzwy",
          signer: false,
          writable: true,
        },
        {
          pubkey: "FQbodcdPR23po6ePZPZDkp8EWdbYb3d9m27DFH3h6N94",
          signer: false,
          writable: true,
        },
        {
          pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          signer: false,
          writable: false,
        },
      ],
      instructions: [
        {
          parsed: {
            info: {
              amount: "50",
              authority: MOCK_SENDER_PUBLIC_KEY,
              destination: "6ZyWQ1aA8Sbsz2oFyzNWmb6ik7Wy1Qz4CYuvRqGsTzwy",
              source: "FQbodcdPR23po6ePZPZDkp8EWdbYb3d9m27DFH3h6N94",
            },
            type: "transfer",
          },
          program: "spl-token",
          programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
      ],
      recentBlockhash: "78p2CW4M12K7CuZrH5YE2pT31K8oX4Q1nXew9BDAtDok",
    },
    signatures: [
      "3VsPLbEgjT2YTGp6PWXBDDc6kMFd4UwLHNWWNzjvf1QMutAihtDYzmfUY6Wdr2MffBDmNhP1YPR681d9Y9CgXe2V",
    ],
  },
};
