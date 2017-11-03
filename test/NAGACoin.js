const NAGACoin = artifacts.require('NAGACoin');

contract('NAGACoin', accounts => {
    const currentTimestamp = () => Math.floor(new Date / 1000);

    it('should create a token contract', () => {
        const someReleaseTime = currentTimestamp() + 1000;

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

    // We combine 8 requirement checks here because testrpc can’t revert after evm_increaseTime
    // https://github.com/ethereumjs/testrpc/issues/390
    it('should limit minting period, total supply, and time-locked transfers', function () {
        return NAGACoin.new()
            .then(token => {
                // Try minting before it’s allowed, it should fail
                return token.mint(accounts[0], 2)
                    .then(() => Promise.reject('This call should fail'))
                    .catch(error => assert.notEqual(error.toString(), 'This call should fail'))

                    // Increase time to the moment when minting is allowed
                    .then(() => token.mintingAllowedFrom.call())
                    .then(mintingAllowedFrom => {
                        NAGACoin.currentProvider.send({
                            method: 'evm_increaseTime',
                            params: [mintingAllowedFrom.sub(currentTimestamp()).toNumber()]
                        });

                        // Now minting should work
                        return token.mint(accounts[0], 1)
                            .then(() => token.balanceOf.call(accounts[0]))
                            .then(balance => assert.equal(balance.toString(), '1'))

                            // But it’s not allowed to exceed the total supply limit
                            .then(() => token.totalSupplyLimit.call())
                            .then(totalSupplyLimit => {
                                return token.mint(accounts[1], totalSupplyLimit.toString())
                                    .then(() => Promise.reject('This call should fail'))
                                    .catch(error => assert.notEqual(error.toString(), 'This call should fail'));
                            })

                            // Only owner can mint
                            .then(() => {
                                return token.mint(accounts[2], 4, {from: accounts[3]})
                                    .then(() => Promise.reject('This call should fail'))
                                    .catch(error => assert.notEqual(error.toString(), 'This call should fail'));
                            })

                            // It’s not allowed to transfer from time-locked accounts before release time
                            .then(() => {
                                return token.mintWithTimeLock(accounts[6], 3, currentTimestamp() + 10000000000)
                                    .then(() => Promise.all([
                                        token.transfer(accounts[0], 1, {from: accounts[6]})
                                            .then(() => Promise.reject('This call should fail'))
                                            .catch(error => assert.notEqual(error.toString(), 'This call should fail')),
                                        token.approve(accounts[0], 1, {from: accounts[6]})
                                            .then(() => token.transferFrom(accounts[6], accounts[1], 1)
                                                .then(() => Promise.reject('This call should fail'))
                                                .catch(error => assert.notEqual(error.toString(), 'This call should fail')),
                                            )
                                    ]));
                            })

                            // But it’s possible after release time
                            .then(() => {
                                return token.mintWithTimeLock(accounts[7], 3, currentTimestamp())
                                    .then(() => Promise.all([
                                        token.transfer(accounts[0], 1, {from: accounts[7]}),
                                        token.approve(accounts[0], 1, {from: accounts[7]})
                                            .then(() => token.transferFrom(accounts[7], accounts[0], 1))
                                    ]));
                            })

                            // If minting is finished by the contract owner, it’s not allowed to mint
                            .then(() => {
                                return NAGACoin.new()
                                    .then(() => {
                                        return token.finishMinting()
                                            .then(() => mint(accounts[5], 16))
                                            .then(() => Promise.reject('This call should fail'))
                                            .catch(error => assert.notEqual(error.toString(), 'This call should fail'));
                                    });
                            })

                            // Increase time to the moment when minting should be finished
                            .then(() => token.mintingAllowedTo.call())
                            .then(mintingAllowedTo => {
                                NAGACoin.currentProvider.send({
                                    method: 'evm_increaseTime',
                                    params: [mintingAllowedTo.sub(mintingAllowedFrom).add(1).toNumber()]
                                });

                                // Try minting, it should fail
                                return token.mint(accounts[3], 8)
                                    .then(() => Promise.reject('This call should fail'))
                                    .catch(error => assert.notEqual(error.toString(), 'This call should fail'));
                            });
                    });
            });
    });
});