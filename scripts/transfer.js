const NAGACoin = artifacts.require('NAGACoin');

const SCRIPT_NAME = 'transfer.js';
const GAS_TRANSFER = 90000;

module.exports = () => {
    const distributionArgIndex = process.argv.findIndex(item => item.indexOf(SCRIPT_NAME) !== -1) + 1;
    const distributionFileName = process.argv[distributionArgIndex];
    if (typeof distributionFileName === 'undefined') {
        callback(new Error('Distribution file not provided'));
        process.exit();
    }

    const distribution = require(process.cwd() + '/' + distributionFileName);

    const result = {};

    const fs = require('fs');

    const saveResult = () => {
        fs.writeFileSync('result-' + distributionFileName, JSON.stringify(result, null, 4), 'utf8');
    };

    return NAGACoin.deployed().then(token => {
        return Promise.all(Object.keys(distribution).map(address => {
            return new Promise((resolve, reject) => {
                if (distribution[address].amount <= 0) {
                    reject('non-positive amount');
                    return;
                }

                if (distribution[address].releaseTime > 0) {
                    reject('time-locked transfer is impossible');
                    return;
                }

                resolve(token.transfer(address, NAGACoin.web3.toWei(distribution[address].amount), {gas: GAS_TRANSFER}));
            })
                .then(tx => {
                    if (tx.receipt.status === '0x0') {
                        throw 'transaction failed';
                    }

                    console.log(`Successfully transferred ${distribution[address].amount} to ${address}`);

                    result[address] = {
                        success: true,
                        amount: distribution[address].amount,
                        transactionHash: tx.receipt.transactionHash,
                        blockNumber: tx.receipt.blockNumber,
                    };
                    saveResult();
                })
                .catch(err => {
                    console.log(`FAILED to transfer ${distribution[address].amount} to ${address}:`, err);


                    result[address] = {
                        success: false,
                        amount: distribution[address].amount,
                    };
                    saveResult();
                });
        }));
    });
};