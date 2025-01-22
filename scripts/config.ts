import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

let { SHIELD3_API_KEY } = process.env;

const NETWORKS = {
	/////////////////////////////////
	// Mainnets
	/////////////////////////////////

	/**
	 * @dev Arbitrum One
	 */
	42161: {
		RPC_URL: `https://rpc.shield3.com/v3/0xa4b1/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
			USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xE8bc3B607CfE68F47000E3d200310D49041148Fc",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Base
	 */
	8453: {
		GATEWAY_IMPLEMENTATION: "0xd28da2E11FCd2A9F44D5a4952430CE8b4f3Ee05f",
		RPC_URL: `https://rpc.shield3.com/v3/0x2105/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0x30F6A8457F8E42371E204a9c103f2Bd42341dD0F",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Binance Smart Chain
	 */
	56: {
		RPC_URL: `https://rpc.shield3.com/v3/0x38/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
			USDT: "0x55d398326f99059ff775485246999027b3197955",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0x1FA0EE7F9410F6fa49B7AD5Da72Cf01647090028",
	},

	/**
	 * @dev Polygon Mainnet
	 */
	137: {
		RPC_URL: `https://rpc.shield3.com/v3/0x89/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
			USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xfB411Cc6385Af50A562aFCb441864E9d541CDA67",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Ethereum Mainnet
	 */
	1: {
		RPC_URL: `https://rpc.shield3.com/v3/0x1/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Optimism Mainnet
	 */
	10: {
		RPC_URL: `https://rpc.shield3.com/v3/0x1/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
			USDT: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xD293fCd3dBc025603911853d893A4724CF9f70a0",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Scroll Mainnet
	 */
	534352: {
		RPC_URL: `https://rpc.shield3.com/v3/0x82750/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0x663C5BfE7d44bA946C2dd4b2D1Cf9580319F9338",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Celo Mainnet
	 */
	42220: {
		RPC_URL: `https://forno.celo.org`,
		SUPPORTED_TOKENS: {
			USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0x8FD1f78d88Dd008E557273b5Cd517487C2A9A7de",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Tron Mainnet
	 * @Note This is a placeholder network as Tron chainID will interfere with ETH chainID
	 */
	12001: {
		RPC_URL: `https://api.trongrid.io`,
		SUPPORTED_TOKENS: {
			USDT: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "THyFP5ST9YyLZn6EzjKjFhZti6aKPgEXNU",
	},
	/**
	 * @dev Celo Mainnet
	 */
	42220: {
		GATEWAY_IMPLEMENTATION: "0x8508c1C9f29BD1e73B5A9bD8FB87720927c681FA",
		RPC_URL: `https://forno.celo.org`,
		SUPPORTED_TOKENS: {
			USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xF418217E3f81092eF44b81C5C8336e6A6fDB0E4b",
		IMPERSONATE_ACCOUNT: "",
	},
	/**
	 * @dev AssetChain Mainnet
	 */
	42420: {
		RPC_URL: `https://mainnet-rpc.assetchain.org`,
		GATEWAY_IMPLEMENTATION: "0x3Dc80272cE93cBFF3351913bB089B59C4a9141DE",
		SUPPORTED_TOKENS: {
			USDC: "0x2B7C1342Cc64add10B2a79C8f9767d2667DE64B2",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xff0E00E0110C1FBb5315D276243497b66D3a4d8a",
		IMPERSONATE_ACCOUNT: "",
	},

	/////////////////////////////////
	// Testnets
	/////////////////////////////////

	/**
	 * @dev Polygon Amoy
	 */
	80002: {
		RPC_URL: `https://rpc.shield3.com/v3/0x13882/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Arbitrum Sepolia
	 */
	421614: {
		RPC_URL: `https://rpc.shield3.com/v3/0x66eee/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			"6TEST": "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B",
			USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0x87B321fc77A0fDD0ca1fEe7Ab791131157B9841A",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Base Sepolia
	 */
	84532: {
		GATEWAY_IMPLEMENTATION: "0xd28da2E11FCd2A9F44D5a4952430CE8b4f3Ee05f",
		RPC_URL: `https://rpc.shield3.com/v3/0x14a34/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
			DAI: "0x7683022d84f726a96c4a6611cd31dbf5409c0ac9",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xc8D160c23FcA7CD6E386Cc5Bc50BEe88a84F7E1b",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Ethereum Sepolia
	 */
	11155111: {
		RPC_URL: `https://rpc.shield3.com/v3/0xaa36a7/${SHIELD3_API_KEY}/rpc`,
		SUPPORTED_TOKENS: {
			"6TEST": "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B",
			DAI: "0x77Ab54631BfBAE40383c62044dC30B229c7df9f5",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xCAD53Ff499155Cc2fAA2082A85716322906886c2",
		IMPERSONATE_ACCOUNT: "",
	},

	/**
	 * @dev Tron Shasta
	 * @Note This is a placeholder network as Tron chainID will interfere with ETH chainID
	 */
	12002: {
		RPC_URL: `https://api.shasta.trongrid.io`,
		SUPPORTED_TOKENS: {
			USDT: "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "TYA8urq7nkN2yU7rJqAgwDShCusDZrrsxZ",
	},
	/**
	 * @dev AssetChain Testnet
	 */
	42421: {
		GATEWAY_IMPLEMENTATION: "0x9519D63fbF9717Fa3419846eBA92B01Cd1d1D131",
		RPC_URL: `https://enugu-rpc.assetchain.org/`,
		SUPPORTED_TOKENS: {
			USDC: "0x04f868C5b3F0A100a207c7e9312946cC2c48a7a3",
		},
		TREASURY_FEE_PERCENT: 100, // in BPS i.e 0.1%
		GATEWAY_CONTRACT: "0xBe6dE889795677736919A7880324A71Dc7dFa162",
		IMPERSONATE_ACCOUNT: "",
	},
};

export { NETWORKS };
