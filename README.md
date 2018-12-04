    A simple lib to test ethereum smart contract that allow to use whatever web3 lib and test runner you choose.

- currently add special support for mocha (since mocha requires it) but can be used with tap (https://www.node-tap.org) easily, see examples

For mocha you need to execute this way:

```mocha --delay -r rocketh/mocha```

By the way rocketh lookup the dependencies (solc and ganache) in the folder you operate. so you'll need solc, ganache-cli as dependencies

support solc >= 0.4.11
