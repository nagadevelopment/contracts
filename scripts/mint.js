const NAGACoin = artifacts.require('NAGACoin');

const SCRIPT_NAME = 'mint.js';
const GAS_MINT = 90000;
const GAS_MINT_TIMELOCK = 100000;

module.exports = callback => {
    const distributionArgIndex = process.argv.findIndex(item => item.indexOf(SCRIPT_NAME) !== -1) + 1;
    const distributionFileName = process.argv[distributionArgIndex];
    if (typeof distributionFileName === 'undefined') {
        callback(new Error('Distribution file not provided'));
        process.exit();
    }

    const distribution = require(process.cwd() + '/' + distributionFileName);

    NAGACoin.deployed().then(token => {
        Object.keys(distribution).map(address => {
            new Promise(() => {
                if (distribution[address].releaseTime > 0) {
                    return token.mintWithTimeLock(
                        address,
                        NAGACoin.web3.toWei(distribution[address].amount),
                        distribution[address].releaseTime,
                        {gas: GAS_MINT_TIMELOCK}
                    );
                }

                return token.mint(address, NAGACoin.web3.toWei(distribution[address].amount), {gas: GAS_MINT});
            })
                .then(tx => {
                    if (tx.receipt.status === '0x0') {
                        throw 'transaction failed';
                    }

                    console.log(`Successfully minted ${distribution[address].amount} to ${address}`);
                })
                .catch(err => console.log(`FAILED to mint ${distribution[address].amount} to ${address}:`, err));
        });
    });
};