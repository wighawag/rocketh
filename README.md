A simple test tool for ethereum smart contract that allow to use whatever web3 lib and test runner you choose.

to use it with mocha for example:

```rocketh launch mocha ...```

then in your mocha test :

```js
...
const rocketh = require('rocketh');
const web3 = new Web3(rocketh.ethereum)
const accounts = rocketh.accounts; // shortcuts
const chainId = rocketh.chainId; // shortcuts
const deployments = rocketh.deployments(); // get current deployments
await rocketh.runStages(); // re run the deployments to a new set of contract
```

By the way rocketh lookup the dependencies (solc and ganache) in the folder you operate. so you'll need solc, ganache-cli as dependencies

support solc >= 0.4.11
