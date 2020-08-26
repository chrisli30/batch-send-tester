const inquirer = require('inquirer');
const Web3 = require('web3');
const Spinnies = require('spinnies');
const moment = require('moment');
const fs = require('fs');

const config = require('./config/index');
const Logger = require('./logger');

const RSK_CHAIN_ID = {
    Mainnet: 30,
    Testnet: 31,
};

const spinnies = new Spinnies();

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

    const trackTxs = [...Array(needSendTxCount)].map((_, i) => {
        spinnies.add(`spinner-${i}`, { text: `No.${i} transaction init` });

        const realTrackTx = {
            no: i,
            hash: null,
            status: null,
            confirmedAt: null,
        };

        const trackTx = new Proxy(realTrackTx, { set: tarckSetHandler });

        return trackTx;
    });

    spinnies.add('spinner-target', { text: 'Waiting for output/data.json generate' });
    const completeTarget = { count: 0 };
    for await (const trackTx of trackTxs) {
        try {
            const { signedTransaction } = await createRawTransaction({
                web3,
                sender: publicKey,
                receiver: receivers[trackTx.no % receivers.length],
                type: RSKChainType,
                privateKey,
            });

            sendSignedTransaction({
                web3,
                signedTransaction,
                trackTx,
                completeTarget,
                needSendTxCount,
                trackTxs,
            }).catch(() => { });

            trackTx.status = 'Sent';
        } catch (error) {
            Logger.error('handle trackTx fail, trackTx: %O, error: %s', trackTx, error.stack);
        }
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

async function createRawTransaction({ web3, sender, receiver, type, privateKey }) {
    const valueOfETH = (Math.random() * (0.0001 - 0.00001) + 0.00001).toFixed(6);
    const valueOfWei = web3.utils.numberToHex(web3.utils.toWei(valueOfETH));
    const nonce = await web3.eth.getTransactionCount(sender, 'pending');

    const rawTx = {
        from: sender,
        to: receiver,
        value: valueOfWei,
        chainId: RSK_CHAIN_ID[type],
        nonce,
        gas: 21272,
        gasPrice: '118480000',
    };

    Logger.debug('createRawTransaction rawTx: %O', rawTx);

    const { rawTransaction } = await web3.eth.accounts.signTransaction(rawTx, privateKey);

    Logger.debug('createRawTransaction rawTransaction: %O', rawTransaction);

    return { signedTransaction: rawTransaction };
}

async function sendSignedTransaction({ web3, signedTransaction, trackTx, completeTarget,
    needSendTxCount, trackTxs }) {
    return web3.eth.sendSignedTransaction(signedTransaction)
        .once('transactionHash', function (hash) {
            trackTx.hash = hash;
            trackTx.status = 'Accepted';
            Logger.debug('sendSignedTransaction transactionHash event, hash: %s, tarckTx: %O', hash, trackTx);
        })
        .once('receipt', function (receipt) {
            Logger.debug('sendSignedTransaction receipt event, receipt: %O, tarckTx: %O', receipt, trackTx);
        })
        .once('confirmation', function (confNumber, receipt) {
            trackTx.confirmedAt = moment().format();
            trackTx.status = 'Confirmed';
            Logger.debug('sendSignedTransaction confirmation event, receipt: %O, tarckTx: %O', receipt, trackTx);

            completeHandler({ completeTarget, needSendTxCount, trackTxs });
        })
        .once('error', function (error) {
            trackTx.status = 'Failed';
            Logger.error('sendSignedTransaction error event, tarckTx: %O, error: %s', trackTx, error.stack);

            completeHandler({ completeTarget, needSendTxCount, trackTxs });
        })
        .then(function (receipt) {
            return receipt;
        });
}

function tarckSetHandler(obj, prop, value) {
    if (prop === 'status' && obj[prop] !== value) {
        switch (value) {
            case 'Sent':
                spinnies.update(`spinner-${obj.no}`, { text: `No.${obj.no} transaction Sent` });
                break;
            case 'Accepted':
                spinnies.update(`spinner-${obj.no}`, { text: `No.${obj.no} transaction Accepted hash: ${obj.hash}` });
                break;
            case 'Confirmed':
                spinnies.succeed(`spinner-${obj.no}`, { text: `No.${obj.no} transaction Confirmed confirmedAt: ${obj.confirmedAt}` });
                break;
            case 'Failed':
                spinnies.fail(`spinner-${obj.no}`, { text: `No.${obj.no} transaction Failed` });
                break;
            default:
                break;
        }
    }

    obj[prop] = value;

    return true;
}

function completeHandler({ completeTarget, needSendTxCount, trackTxs }) {
    completeTarget.count++;
    if (completeTarget.count >= needSendTxCount) {
        const dir = './output';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(`${dir}/data.json`, JSON.stringify(trackTxs, null, 2), 'utf-8');
        spinnies.succeed('spinner-target', { text: 'output/data.json is generated' });
    }
    return;
}