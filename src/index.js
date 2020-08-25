const inquirer = require('inquirer');
const Web3 = require('web3');

const config = require('./config/index');

async function main() {
    const { publicKey, privateKey, RSKChainType, rsk, receivers } = config;
    if (!publicKey || !privateKey) {
        throw new Error('Must specify env publicKey and privateKey.');
    }
    if (RSKChainType !== 'Testnet' && RSKChainType !== 'Mainnet') {
        throw new Error('Must specify env RSK_CHAIN_TYPE: Testnet OR Mainnet.');
    }

    const { needSendTxCount } = await getPromptInputs();

    const web3 = new Web3(rsk[RSKChainType].host);
    for await (const receiver of receivers) {

    }
}

main();

async function getPromptInputs() {
    const { needSendTxCount } = await new Promise((resolve, reject) => {
        inquirer
            .prompt([{
                type: 'input',
                name: 'needSendTxCount',
                message: "what's the currency number of transactions to be send ?",
                validate: function (value) {
                    if (!isNaN(value)) {
                        return true;
                    }

                    return 'Please enter a valid number';
                }
            }])
            .then(answers => {
                resolve(answers);
            })
            .catch(error => {
                if (error.isTtyError) {
                    console.log(`Prompt couldn't be rendered in the current environmen`);
                } else {
                    console.log(`Something else when wrong, ${error}`);
                }

                reject(error);
            });
    });

    return {
        needSendTxCount: Number(needSendTxCount),
    };
}

async function createRawTransaction({ web3, sender, receiver, }) {

}

async function sendSignedTransaction({ }) {

}
