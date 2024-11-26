import { ethers, upgrades, network } from "hardhat";
import { NETWORKS } from "./config";
import hre from "hardhat";
import { confirmContinue, waitForInput } from "./utils";

const networkConfig = NETWORKS[network.config.chainId as keyof typeof NETWORKS];

async function upgradeProxy() {
	await confirmContinue({
			contract: "Gateway",
			network: network.name,
			chainId: network.config.chainId,
		});
	try {
		const [signer] = await ethers.getSigners(); // Get the signer (the account performing the upgrade)
		const balance = await signer.getBalance(); // Get the balance of the signer's address

		if (balance.eq(0)) {
			throw new Error(
				`"Can't upgrade ${network.config.chainId} with 0 balance`
			);
		}

		const proxyContractAddress = networkConfig.GATEWAY_CONTRACT;
		const factory = await ethers.getContractFactory("Gateway");
		const contract = await upgrades.upgradeProxy(proxyContractAddress, factory);

		console.log("✅ Upgraded Gateway: ", contract.address);

		await hre.run("verify:verify", {
			address: contract.address,
		});
	} catch (error) {
		if (error instanceof Error) {
			console.error("❌ Upgrade failed: ", error.message);
		} else {
			console.error("❌ Upgrade failed: Unknown error occurred");
		}

	}
}

async function manualUpgrade() {
	await confirmContinue({
		contract: "Gateway",
		network: network.name,
		chainId: network.config.chainId,
	});

	try {

		const [signer] = await ethers.getSigners(); // Get the signer (the account performing the upgrade)
		const balance = await signer.getBalance(); // Get the balance of the signer's address

		if (balance.eq(0)) {
			throw new Error(`Can't upgrade ${network.config.chainId} with 0 balance`);
		}
		const proxyContractAddress = networkConfig.GATEWAY_CONTRACT;
		const proxy = await ethers.getContractAt("TransparentUpgradeableProxy", proxyContractAddress);
		// Get the proxy admin address
		const proxyAdminAddress = await proxy.admin();
		console.log(`Proxy Admin Address: ${proxyAdminAddress}`);

		// Get the Proxy Admin contract
		const proxyAdmin = await ethers.getContractAt("ProxyAdmin", proxyAdminAddress);

		// Check if IMPLEMENTATION exists in networkConfig
		if (!('IMPLEMENTATION' in networkConfig)) {
			throw new Error(`No implementation address found for chainId: ${network.config.chainId}`);
		}
		// Fetch the new implementation address from deployment.json
		const newImplementationAddress = networkConfig.IMPLEMENTATION;

		if (!newImplementationAddress) {
			throw new Error(`No implementation address found for chainId: ${network.config.chainId}`);
		}

		console.log(`Upgrading proxy to new implementation: ${newImplementationAddress}`);

		// Call the upgrade function on the Proxy Admin contract
		await proxyAdmin.upgrade(proxyContractAddress, newImplementationAddress);

		console.log(`✅ Successfully upgraded proxy at ${proxyContractAddress} to new implementation at ${newImplementationAddress}`);
	} catch (error) {
		if (error instanceof Error) {
		console.error("❌ Upgrade failed: ", error.message);
		} else {
		console.error("❌ Upgrade failed: Unknown error occurred");
		}
	}

}

async function main() {
	const response = await waitForInput("\nDo you want to deploy and upgrade? y/N\n");
	if (response !== "y") {
		await manualUpgrade();
	} else {
		await upgradeProxy();
	}
}
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
