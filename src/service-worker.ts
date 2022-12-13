// Service worker types support has a number of major bugs
// See https://joshuatz.com/posts/2021/strongly-typed-service-workers/
// Compiling with tsconfig specified in that blog post creates a service worker that won't install.
// Proper TS support is a huge time suck, be warned! Best wait until bugs mentioned above are fixed.

// @ts-ignore see top of file
const VERSION = 21;

const log = console.log.bind(console);

const stringify = function (object) {
  return JSON.stringify(object, null, 2);
};

let secretKey: string | null = null;

// https://developer.chrome.com/docs/extensions/mv3/service_workers/
// and https://github.com/GoogleChrome/chrome-extensions-samples

// From https://dev.to/wtho/custom-service-worker-logic-in-typescript-on-vite-4f27

log(`Parsing service worker version: ${VERSION}`);

const handleMessage = async (eventData) => {
  if (eventData.topic === "getSecretKey") {
    log(`Service worker: we recieved a request for the secret key`);
    if (secretKey) {
      log(`Service worker: good news, we have the secret key`);

      // @ts-ignore see top of file
      const clients = await self.clients.matchAll();
      if (clients && clients.length) {
        // TODO: we always send to first client. Not sure if this is correct.
        const firstClient = clients[0];
        firstClient.postMessage({
          topic: "replySecretKey",
          secretKey,
        });
      }
    } else {
      log(`bad news, we do not have the secret key`);
    }
  }

  if (eventData.topic === "setSecretKey") {
    log(`Service worker: we recieved a request to get the secret key`);
    secretKey = eventData.secretKey;
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

self.addEventListener("message", (event) => {
  log("✅: recieved message on topic", stringify(event.data.topic));
  handleMessage(event.data);
});
