// This file is part of Portal Wallet.
//
// Portal Wallet is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, specifically version 2 of the License.
//
// Portal Wallet is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Portal Wallet. If not, see <https://www.gnu.org/licenses/>.
//
import { promises as fs } from "fs";
import { SECONDS } from "./constants";
import Arweave from "arweave";

const OK = 200;

export const fileNameToContentType = (fileName: string) => {
  let contentType: "image/png" | "image/jpeg" | "image/svg+xml" | null = null;

  if (fileName.endsWith(".png")) {
    contentType = "image/png";
  }

  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    contentType = "image/jpeg";
  }

  if (fileName.endsWith(".svg")) {
    contentType = "image/svg+xml";
  }

  if (!contentType) {
    throw new Error(`Could not determine Content Type for ${fileName}`);
  }

  return contentType;
};

// See https://solanacookbook.com/references/nfts.html#upload-to-arweave
export const uploadImageToArweave = async (fileName: string) => {
  const data = await fs.readFile(fileName);

  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
    timeout: 20 * SECONDS,
    logging: false,
  });

  const contentType = fileNameToContentType(fileName);

  const arWeaveWallet = JSON.parse(
    // File supplied by https://faucet.arweave.net/
    await fs.readFile("arweave-wallet.json", "utf-8")
  );

  const transaction = await arweave.createTransaction({
    data,
  });

  transaction.addTag("Content-Type", contentType);

  await arweave.transactions.sign(transaction, arWeaveWallet);

  const response = await arweave.transactions.post(transaction);

  if (response.status !== OK) {
    throw new Error(`Got ${response.status} error from arWeave`);
  }

  const uploadedImageUrl = `https://arweave.net/${transaction.id}`;
  return uploadedImageUrl;
};
