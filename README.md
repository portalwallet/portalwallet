# Portal Wallet

##

In Chrome, click **manage Extensions**, turn on **Developer Mode**, **Load unpacked** and pick the `dist` folder.

## A crypto wallet for regular people

YC - we have made a demo wallet for Garry Tan that's already signed in. The account has 5 real USDC, and the wallet is running in production.

In normal practice, users go through a regular Jumio / Onfido government-supplied ID check as part of signup. 

If you'd like to see what sending money looks like, try sending to the the address `6PCANXw778iMrBzLUVK4c9q6Xc2X9oRUCvLoa4tfsLWG` - your friend Vaheh say's this is their Solana account. Let's find out if this is true! 

## 
Then in your browser DevTools console run:

```
localStorage.setItem("PORTAL_PRIVATE_KEY", "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678")
```

Get your private key from **Phantom** -> ⚙️ -> **Export Private Key**
