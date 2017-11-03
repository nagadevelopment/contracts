NAGA Coin Smart Contract
========================

### Preparations

Install dependencies:
```
npm i
```


### Deploy

First, compile the contract:
```
npm run compile
```

To deploy the smart contract on the development network, run:
```
npm run deploy-dev
```

To deploy the smart contract on the Ropsten testnet, run:
```
npm run deploy-ropsten
```

**Be careful!** Every deploy on the same network replaces metadata (including the contract address) stored in the `build` directory.


### Minting

To mint tokens, prepare a JSON file `distribution.json`. For example:
```json
{
  "0x8A6d9138e960577D230Ba5F86f872418EA8c0506": {
    "amount": 1.23,
    "releaseTime": 1519862400
  },
  "0xf6d1fa4fd83ba3e0c77642756e95917b8a47c1dd": {
    "amount": 0.000000000000000001,
    "releaseTime": 0
  }
}
```

Then run (on the development network):
```
npm run mint-dev distribution.json
```

Or on the Ropsten testnet:
```
npm run mint-ropsten distribution.json
```


### Finish minting

On the development network:
```
npm run finish-dev
```

On the Ropsten testnet:
```
npm run finish-ropsten
```


### Running tests

Run testrpc:
```
npm run testrpc
```

While testrpc is running, run tests:
```
npm test
```

*Due to use of testrpc’s `evm_increaseTime`, you should restart testrpc after each run of tests.*

## Ropsten testnet setup

1. Install geth: https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum
1. Run it on the Ropsten testnet:
    ```
    geth --testnet --rpc
    ```
1. Find in the beginning of the geth log a line like this one:
    ```
    IPC endpoint opened: /Users/username/Library/Ethereum/testnet/geth.ipc
    ```
1. Open another terminal and run (using the file path from the previous step):
    ```
    geth attach /Users/username/Library/Ethereum/testnet/geth.ipc
    ```
1. Wait for the blockchain to sync. In the geth log, it looks like:
    ```
    ... Imported new chain segment               blocks=1 ...
    ```
    Also you can run `eth.syncing` in the geth console. It should return `false` instead of sync information.
1. We need to create an account. In the geth console, run:
    ```
    personal.newAccount()
    ```
    When it prompts for a passphrase, input a strong one (32 random chars, for example). Of course, you have to store it somewhere.
1. Now restart geth with the unlock parameter:
    ```
    geth --testnet --rpc --unlock "0x0000000000000000000000000000000000000000"
    ```
    Instead of `0x0000000000000000000000000000000000000000`, use account you created in the previous step. While starting, geth will prompt you for the passphrase.
1. Transfer some ETH to account to pay for gas.

