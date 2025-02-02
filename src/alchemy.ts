// Setup: npm install alchemy-sdk
import { Alchemy, AssetTransfersCategory, Network } from "alchemy-sdk";

const config = {
  apiKey: "JTaynsTliLtSPuHYGEHaDHDlN6sqCrqf",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

async function main() {
  const data = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    fromAddress: "0xC4f259565d3f3aEc9426C0E402a6827b89f4786b",
    category: [AssetTransfersCategory.ERC20, AssetTransfersCategory.EXTERNAL],
  });

  console.log(data);
}

main();
