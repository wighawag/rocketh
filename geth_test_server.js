const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const spawn = require('cross-spawn');
const {onExit} = require('@rauschma/stringio');
const terminate = require('terminate');
const tmp = require('tmp');
const portfinder = require('portfinder');

const {
    requireLocal,
} = require('./utils');


function spawnGeth(gethPath, args, hookStd, logFile) {

    let stdio;
    if(logFile) {
        fs.writeFileSync(logFile, '');
        var output = fs.openSync(logFile, 'a');
        var output2 = fs.openSync(logFile, 'a');
        stdio = ['ignore', output, output2];
    } else {
        if(hookStd) {
            stdio = [process.stdin, process.stdout, process.stderr];
        } else {
            // const devnull = require('dev-null');
            stdio = ['ignore', 'ignore', 'ignore'];
        }
    }
    return spawn(
        gethPath,
        args,
        {
            stdio,
            env:{
                _GETH_CMD_ARGUMENTS: args.join(' ')
            }
        }
    );
}

async function serve(port, wsPort, accounts, chainId, config) {
    let gethBinary;
    try{
        gethBinary = requireLocal('geth-binary');
    } catch(e) {
        throw new Error('In order to use geth as a provider you need to install your desired geth-binary in your own project: "npm install geth-binary');
    }
    
    let gethPath = gethBinary ? gethBinary.path : 'geth';

    /*
    rm -Rf .geth
    <generate .geth/genesis.json>
    printf sesame > .geth/pass
    printf 2bd8fd4e7c04075345677d3127842e737a62db1918beef4cbea6cbc95db0cbdb > .geth/priv
    geth --datadir .geth init .geth/genesis.json
    geth --datadir .geth account import --password .geth/pass .geth/priv
    geth --datadir .geth --syncmode full  --networkid 110 --gasprice 1 --password .geth/pass --unlock 30cb8ee8b1bfacdd5edf8ae9f82e59925263c966 --mine --targetgaslimit 6000000 --rpc --rpcaddr localhost --rpcport 8502 --rpcapi eth,net,web3
    */
    
    var tmpobj = tmp.dirSync();
    const gethDataPath = tmpobj.name;
    rimraf.sync(gethDataPath);
    try { fs.mkdirSync(gethDataPath); } catch(e) {}
    const genesisPath = path.join(gethDataPath, 'genesis.json');
    
    const gethPort = await portfinder.getPortPromise({
        port: 30310,    // minimum port
        stopPort: 39999 // maximum port
    });
    const genesis = {
        config: {
            chainId: chainId || Math.floor(Date.now() / 1000),
            homesteadBlock: 1,
            eip150Block: 2,
            eip150Hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
            eip155Block: 3,
            eip158Block: 3,
            byzantiumBlock: 4,
            clique: {
                period: 0,
                epoch: 30000
            }
        },
        nonce: "0x0000000000000042",
        timestamp: "0x00",
        extraData: "0x000000000000000000000000000000000000000000000000000000000000000030cb8ee8b1bfacdd5edf8ae9f82e59925263c9660000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        gasLimit: "0x59A5380",
        difficulty: "0x1",
        mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        coinbase: "0x0000000000000000000000000000000000000000",
        alloc: {},
        number: "0x0",
        gasUsed: "0x0",
        parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    for(let i = 0; i < accounts.length; i++) {
        genesis.alloc[accounts[i]] = {
            balance: config.defaultBalance || "0x56BC75E2D63100000"
        };
    }

    fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, '  '));
    const initProcess = spawnGeth(
        gethPath,
        ['--datadir', gethDataPath, 'init', genesisPath],
        // true
    );
    await onExit(initProcess)
    
    const passPath = path.join(gethDataPath, 'pass');
    fs.writeFileSync(passPath,'sesame');


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // sealer account is pregenerated :

    // const privPath = path.join(gethDataPath, 'priv');
    // fs.writeFileSync(privPath,'2bd8fd4e7c04075345677d3127842e737a62db1918beef4cbea6cbc95db0cbdb');
    // console.log('Initialising account....');
    // const accountCreationProcess = spawnGeth(
    //     gethPath,
    //     ['--datadir', gethDataPath, 'account', 'import', '--password', passPath, privPath],
    //     // true
    // );
    // await onExit(accountCreationProcess)

    const keystorePath = path.join(gethDataPath, 'keystore');
    keystoreFilepath = path.join(keystorePath, 'UTC--2019-02-26T12-51-20.735389900Z--30cb8ee8b1bfacdd5edf8ae9f82e59925263c966');
    try { fs.mkdirSync(keystorePath); } catch(e) {}
    fs.writeFileSync(keystoreFilepath, '{"address":"30cb8ee8b1bfacdd5edf8ae9f82e59925263c966","crypto":{"cipher":"aes-128-ctr","ciphertext":"e1140b6de3997af4605cc378f08bd58f6b2f1637dbc1bfcdbef93a31665fbedb","cipherparams":{"iv":"e9751ae14e68c9327b6aed03654c2eee"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"d00a5afd0b8decca4a65d8da30fa20419bbacc663213b7368d268f4a0997f8bf"},"mac":"e9ba6a86129f9fbd02ea287fd6eea47e9543d5c3257a4440499b5bcb314251ce"},"id":"4ea8a249-40af-44db-ba7a-d56a239add7e","version":3}');
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    const gethProcess = spawnGeth(
        gethPath,
        [
            '--datadir', gethDataPath,
            '--syncmode', 'full',
            '--networkid', genesis.config.chainId,
            '--password', passPath,
            '--unlock', '30cb8ee8b1bfacdd5edf8ae9f82e59925263c966',
            '--mine',
            '--gasprice', '1', // 2000000000
            '--targetgaslimit', '0x4c4b400000', // 6000000
            '--rpc',
            '--rpcaddr', 'localhost', // 0.0.0.0 for public
            // '--rpcvhosts', '*',
            '--rpcport', '' + port,
            '--rpcapi', 'eth,net,web3,personal,db,txpool,miner,debug',
            '--ws',
            '--wsaddr', 'localhost', // 0.0.0.0 for public
            '--wsport', '' + wsPort,
            // '--wsorigins', '*',
            '--wsapi', 'eth,net,web3,personal,db,txpool,miner,debug',
            // '--vmdebug',
            '--nat', 'none',
            '--nodiscover',
            '--port', '' + gethPort,
            '--txpool.journal', "''",
        ],
        // false,// true // TODO remove
        // '.geth.log'
    );
    
    stop = () => {
        return new Promise((resolve, reject) => {
            try {
                terminate(gethProcess.pid, (err) => {
                    if(err) {
                        reject(err);
                    } else {
                        setTimeout(() => {
                            try{rimraf.sync(gethDataPath);}catch(e){console.error(e);}
                            resolve();
                        }, 1000);
                    }
                })
            } catch(e) {
                reject(e);
            }
        });
    }

    return {
        stop
    }
}

module.exports = {
    serve
}