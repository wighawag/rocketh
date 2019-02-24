const path = require('path');
const fs = require('fs');
const spawn = require('cross-spawn');
const {onExit} = require('@rauschma/stringio');

async function runGeth() {
    const genesisPath = path.join(__dirname, 'geth_genesis.json');  // TODO best place to save it : currently this confilc with a global install
    const gethPath = path.join(__dirname, 'vendor', "geth-windows-amd64-1.8.23-c9427004.exe"); // TODO use bin-wrapper
    fs.writeFileSync(genesisPath, JSON.stringify({
        config: {
              chainId: 111,
              homesteadBlock: 0,
              eip155Block: 0,
              eip158Block: 0
        },
        alloc      : {},
        coinbase   : "0x0000000000000000000000000000000000000000",
        difficulty : "0x20000",
        extraData  : "",
        gasLimit   : "0x2fefd8",
        nonce      : "0x0000000000000042",
        mixhash    : "0x0000000000000000000000000000000000000000000000000000000000000000",
        parentHash : "0x0000000000000000000000000000000000000000000000000000000000000000",
        timestamp  : "0x00"
    }, null, '  '));

    // https://gethstore.blob.core.windows.net/builds/geth-windows-amd64-1.8.23-c9427004.zip
    const geth_init_process = spawn(
        gethPath,
        ['init', genesisPath],
        {
            stdio: [process.stdin, process.stdout, process.stderr],
        }
    );

    await onExit(geth_init_process);

    const geth_process = spawn(
        gethPath,
        ['init', genesisPath],
        {
            stdio: [process.stdin, process.stdout, process.stderr],
        }
    );

    await onExit(geth_process);
}

module.exports = {
    runGeth
}