const dotenv = require('dotenv');

const envFound = dotenv.config();
if (envFound.error) {
    // This error should crash whole process
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const config = {
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
        '',
        '',
    ],
};

module.exports = config;
