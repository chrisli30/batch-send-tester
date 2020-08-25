const dotenv = require('dotenv');

const envFound = dotenv.config();
if (envFound.error) {
    // This error should crash whole process
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const config = {
    logs: {
        level: 'silly',
    },

    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY,

    RSKChainType: process.env.RSK_CHAIN_TYPE,

    rsk: {
        Mainnet: {
            host: 'https://public-node.rsk.co',
        },
        Testnet: {
            host: 'https://public-node.testnet.rsk.co',
        },
    },

    receivers: [
        '0xE2bb6Ae7741f9C975E676C1Bd26f7503Cdb36377',
        '0x1921d925498C373c93Aa5941346144B56b7d2f0B',
        '0x4c796F23ACED0B65e25Ab4a1Ce12820d59c6AB3f',
    ],
};

module.exports = config;
