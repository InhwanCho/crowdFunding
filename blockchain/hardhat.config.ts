import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
    ],
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  networks: {
    holesky_testnet: {
      url: "https://ethereum-holesky.blockpi.network/v1/rpc/public",
      accounts: [require("./secret.json").private],
    },
  },
};

export default config;
