const { network } = require("hardhat")

const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utlis/verify")

module.exports = async ({ getNamedAcounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("---------")
    const boxv2 = await deploy("BoxV2", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying ....")
        await verify(boxv2.address, args)
    }

    console.log(`deployed contract at address ${boxv2.address}`)

    console.log("----------")
}
