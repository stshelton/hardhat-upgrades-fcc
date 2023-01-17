const { network } = require("hardhat")

const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utlis/verify")

module.exports = async ({ getNamedAcounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("---------")
    const box = await deploy("Box", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations,
        proxy: {
            proxyContract: "OpenZeppelinTransparentProxy",
            // the proxy contract is owned by a contract
            viaAdminContract: {
                name: "BoxProxyAdmin",
                artifact: "BoxProxyAdmin",
            },
        },
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying ....")
        await verify(box.address, args)
    }

    console.log(`deployed contract at address ${box.address}`)

    console.log("----------")
}

module.exports.tags = ["all", "main"]
