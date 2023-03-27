// This file is part of Portal Wallet.
//
// Portal Wallet is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, specifically version 2 of the License.
//
// Portal Wallet is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Portal Wallet. If not, see <https://www.gnu.org/licenses/>.

// Do not move this file into a folder!
// Service workers must be in location that 'manages' the result on the content
// See https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/how-to/service-workers

// localForage seems to want window.
self.window = self;

// Yes use .js, TypeScript will apparently figure it out, as .ts breaks.
// https://stackoverflow.com/questions/62619058/appending-js-extension-on-relative-import-statements-during-typescript-compilat
import type { AccountSummary, Contact } from "./backend/types.js";
import { log, isFresh, stringify } from "./backend/functions.js";
import { cacheWebRequests } from "./service-worker-webcache";
// See https://github.com/localForage/localForage/issues/831
import localforage from "localforage/src/localforage.js";

//  Cannot access chrome:// and edge:// URLs
if (!window.location.protocol.startsWith("http")) {
  log(
    `Not loading service worker for a chrome:// or edge:// URL (${window.location.href}).`
  );
}

const VERSION = 23;
log(`VERSION IS ${VERSION}`);

let secretKey: string | null = null;

let nativeAccountSummary: AccountSummary | null = null;
let tokenAccountSummaries: Array<AccountSummary> | null = null;
let contacts: Array<Contact> | null = null;

const sendMessage = async (message: Record<string, any>) => {
  // @ts-ignore see top of file
  const clients = await self.clients.matchAll();
  if (clients && clients.length) {
    // TODO: we always send to first client. Not sure if this is correct.
    const firstClient = clients[0];
    firstClient.postMessage(message);
  }
};

// https://developer.chrome.com/docs/extensions/mv3/service_workers/
// and https://github.com/GoogleChrome/chrome-extensions-samples
// From https://dev.to/wtho/custom-service-worker-logic-in-typescript-on-vite-4f27

log(`Parsing service worker version: ${VERSION}`);

interface PortalMessage {
  topic: string;
  [key: string]: any;
}

const handleMessage = async (
  message: PortalMessage,
  sendReply: (object: any) => void
) => {
  log(
    `📩 Service worker got a message from elsewhere in the extension on this topic: '${message.topic}'`
  );

  if (message.topic === "getSecretKey") {
    if (secretKey) {
      log(`😃 Service worker cache: we have the secret key`);

      sendReply({
        topic: "replySecretKey",
        secretKey,
      });
    } else {
      log(`☹️ Service worker does not have the secret key`);
    }
  }

  if (message.topic === "setSecretKey") {
    secretKey = message.secretKey;
  }

  if (message.topic === "getNativeAccountSummary") {
    if (nativeAccountSummary) {
      log(
        `😃 Service worker cache: we have the nativeAccountSummary in memory already`
      );

      sendReply({
        topic: "replyNativeAccountSummary",
        nativeAccountSummary,
      });
      return;
    }
    const nativeAccountSummaryFromLocalForage = (await localforage.getItem(
      "NATIVE_ACCOUNT_SUMMARY"
    )) as AccountSummary;
    if (nativeAccountSummaryFromLocalForage) {
      if (isFresh(nativeAccountSummaryFromLocalForage.lastUpdated)) {
        log(
          `😀 Service worker cache: we have the nativeAccountSummary in localforage and it's fresh!`
        );
        sendMessage({
          topic: "replyNativeAccountSummary",
          nativeAccountSummary: nativeAccountSummaryFromLocalForage,
        });
        return;
      } else {
        log(
          `☹️ Service worker cache: we have the nativeAccountSummary in localforage but it's not fresh`
        );
        return;
      }
    }
    log(`☹️ Service worker does not have the nativeAccountSummary`);
  }

  if (message.topic === "setNativeAccountSummary") {
    nativeAccountSummary = message.nativeAccountSummary;
    nativeAccountSummary.lastUpdated = Date.now();
    await localforage.setItem("NATIVE_ACCOUNT_SUMMARY", nativeAccountSummary);
    log(`Saved NATIVE_ACCOUNT_SUMMARY to localForage`);
  }

  if (message.topic === "getTokenAccountSummaries") {
    if (tokenAccountSummaries) {
      log(`😃 Service worker cache: we have the tokenAccountSummaries`);

      sendReply({
        topic: "replyTokenAccountSummaries",
        tokenAccountSummaries,
      });
      return;
    }
    const tokenAccountSummariesFromLocalForage = (await localforage.getItem(
      "TOKEN_ACCOUNT_SUMMARIES"
    )) as Array<AccountSummary>;

    const allAreFresh =
      tokenAccountSummariesFromLocalForage &&
      tokenAccountSummariesFromLocalForage.every((accountSummary) =>
        isFresh(accountSummary.lastUpdated)
      );

    if (allAreFresh) {
      log(
        `😀 Service worker cache: we have the tokenAccountSummaries in localforage and they're all fresh!`
      );
      sendReply({
        topic: "replyTokenAccountSummaries",
        tokenAccountSummaries: tokenAccountSummariesFromLocalForage,
      });
      return;
    } else {
      log(
        `☹️ Service worker cache: we have the tokenAccountSummaries in localforage but they're not all fresh`
      );
    }

    log(`☹️ Service worker does not have the tokenAccountSummaries`);
    return;
  }

  if (message.topic === "setTokenAccountSummaries") {
    tokenAccountSummaries = message.tokenAccountSummaries;
    tokenAccountSummaries.map((tokenAccountSummary) => {
      tokenAccountSummary.lastUpdated = Date.now();
    });
    await localforage.setItem("TOKEN_ACCOUNT_SUMMARIES", tokenAccountSummaries);
    log(`Saved TOKEN_ACCOUNT_SUMMARIES to localForage`);
  }

  if (message.topic === "getContacts") {
    if (contacts) {
      log(`😃 Service worker cache: we have the contacts`);
      sendReply({
        topic: "replyContacts",
        contacts,
      });
    } else {
      log(`☹️ Service worker does not have Contacts`);
    }
  }

  if (message.topic === "setContacts") {
    contacts = message.contacts;
  }
};

// https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/how-to/service-workers
self.addEventListener("install", function (event) {
  // From https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
  // 'forces the waiting service worker to become the active service worker.'

  // @ts-ignore see top of file
  self.skipWaiting();
  log(`INSTALL service worker version: ${VERSION}`);
  log(`globalThis is`, globalThis);
});

self.addEventListener("activate", (event) => {
  log(`ACTIVATE service worker version: ${VERSION}`);
  log(event);
});

// We don't use 'self.addEventListener("message")' or serviceWorker.controller.postMessage for general messages
// because Chrome has a better API for messaging across the entire extension
chrome.runtime.onMessage.addListener(function (message, sender, sendReply) {
  // TODO: this is just debugging we can get rid of it
  const isFromContentScript = sender.tab || false;
  log(`isFromContentScript: ${isFromContentScript}`);

  if (!message.topic) {
    throw new Error(`No topic in request`);
  }
  handleMessage(message as PortalMessage, sendReply);
});

// Cache GET requests for images
// Based on https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent
self.addEventListener("fetch", (event) => {
  return cacheWebRequests(event, VERSION);
});

// https://developer.mozilla.org/en-US/docs/mozilla/add-ons/webextensions/api/webnavigation/oncompleted
chrome.webNavigation.onCompleted.addListener((event) => {
  if (!event.url.startsWith("http")) {
    return;
  }
  log(`The user has loaded ${event.url}! Time to inject the wallet!`);
  const tabId = event.tabId;

  // https://developer.chrome.com/docs/extensions/reference/scripting/#method-executeScript
  chrome.scripting.executeScript({
    files: ["./injected.js"],
    target: { tabId },
    world: "MAIN",
  });
});
