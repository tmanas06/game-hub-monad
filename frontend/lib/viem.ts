// lib/viem.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadKey } from "./keyCache";

// Contract configuration
// TODO: Update this address after deploying the contract
// Run: cd contracts && npm run deploy
// Then copy the deployed address here
export const CONTRACT_ADDRESS = "0x10C8365cE4a8091084701A215f5FeabcD62B1045" as const;
export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_usdc",
        type: "address"
      },
      {
        internalType: "address",
        name: "_treasury",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_rewardAmount",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "updater",
        type: "address"
      }
    ],
    name: "ConfigUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "RewardClaimed",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newAmount",
        type: "uint256"
      }
    ],
    name: "setRewardAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newTreasury",
        type: "address"
      }
    ],
    name: "setTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newUSDC",
        type: "address"
      }
    ],
    name: "setUSDC",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "hasClaimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "rewardAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143, // Monad Testnet chain ID
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"]
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"]
    }
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadvision.com",
    },
  },
  testnet: true,
});

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// Create contract instance
export const contract = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  publicClient,
} as const;

// Type definitions for contract functions
export type ContractFunction = {
  claimReward: () => Promise<void>;
  hasClaimed: (address: `0x${string}`) => Promise<boolean>;
  rewardAmount: () => Promise<bigint>;
  setRewardAmount: (amount: bigint) => Promise<void>;
  setTreasury: (address: `0x${string}`) => Promise<void>;
  setUSDC: (address: `0x${string}`) => Promise<void>;
  owner: () => Promise<`0x${string}`>;
  treasury: () => Promise<`0x${string}`>;
  usdc: () => Promise<`0x${string}`>;
};

export function getSigner() {
  const pk = loadKey();
  if (!pk) throw new Error("No cached private key");
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({
    chain: monadTestnet,
    account,
    transport: http(),
  });
}