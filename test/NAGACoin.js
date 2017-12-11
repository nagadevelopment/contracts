const NAGACoin = artifacts.require('NAGACoin');

contract('NAGACoin', accounts => {
    const currentTimestamp = () => Math.floor(new Date / 1000);

    it('should create a token contract and mint pre-distributed tokens', () => {

        return NAGACoin.new()
            .then(token => Promise.all([
                token.name.call()
                    .then(name => assert.equal(name, 'NAGA Coin')),
                token.symbol.call()
                    .then(tokenSymbol => assert.equal(tokenSymbol, 'NGC')),
                token.decimals.call()
                    .then(decimals => assert.equal(decimals, 18)),
            ]));
    });

    // We combine all requirement checks here because testrpc can’t revert after evm_increaseTime
    // https://github.com/ethereumjs/testrpc/issues/390
    it('should mint both normal and time-locked', function () {
        return NAGACoin.new()
            .then(token => {
                // Minting should work
                return token.mint(accounts[0], 1)
                    .then(() => token.balanceOf.call(accounts[0]))
                    .then(balance => assert.equal(balance.toString(), '1'))


                    // Only owner can mint
                    .then(() => {
                        return token.mint(accounts[1], 2, {from: accounts[2]})
                            .then(() => Promise.reject('This call should fail'))
                            .catch(error => assert.notEqual(error.toString(), 'This call should fail'));
                    })

                    // It’s not allowed to transfer from time-locked accounts before release time
                    .then(() => {
                        return token.mintWithTimeLock(accounts[3], 3, currentTimestamp() + 60000)
                            .then(() => Promise.all([
                                token.transfer(accounts[0], 1, {from: accounts[3]})
                                    .then(() => Promise.reject('This call should fail'))
                                    .catch(error => assert.notEqual(error.toString(), 'This call should fail')),
                                token.approve(accounts[0], 1, {from: accounts[3]})
                                    .then(() => token.transferFrom(accounts[3], accounts[1], 1)
                                        .then(() => Promise.reject('This call should fail'))
                                        .catch(error => assert.notEqual(error.toString(), 'This call should fail')),
                                    )
                            ]));
                    })

                    // But it’s possible after release time
                    .then(() => {
                        return token.mintWithTimeLock(accounts[4], 4, currentTimestamp())
                            .then(() => Promise.all([
                                token.transfer(accounts[0], 1, {from: accounts[4]}),
                                token.approve(accounts[0], 1, {from: accounts[4]})
                                    .then(() => token.transferFrom(accounts[4], accounts[0], 1))
                            ]));
                    })

                    // If minting is finished by the contract owner, it’s not allowed to mint
                    .then(() => {
                        return NAGACoin.new()
                            .then(() => {
                                return token.finishMinting()
                                    .then(() => mint(accounts[5], 5))
                                    .then(() => Promise.reject('This call should fail'))
                                    .catch(error => assert.notEqual(error.toString(), 'This call should fail'));
                            });
                    })

                    // Increase time to the moment when transfer is allowed
                    .then(() => {
                        NAGACoin.currentProvider.send({
                            method: 'evm_increaseTime',
                            params: [60000]
                        });

                        // Try transfer again, it should work
                        return Promise.all([
                                token.transfer(accounts[0], 1, {from: accounts[4]}),
                                token.approve(accounts[0], 1, {from: accounts[4]})
                                    .then(() => token.transferFrom(accounts[4], accounts[0], 1))
                            ]);
                    });
            });
    });
});
