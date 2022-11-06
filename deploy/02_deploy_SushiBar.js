const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments

    const sushiToken = await ethers.getContract("SushiToken")

    log("=====================================================================")

    const sushiBar = await deploy("SushiBar", {
        from: deployer,
        args: [sushiToken.address],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("=====================================================================")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(nftMarketplace.address, args)
    }
}

module.exports.tags = ["all", "bar"]
