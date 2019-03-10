
const {requireLocal, executeServer} = require('./utils');
const {log} = require('./utils');

async function runGanache(port, wsPort, ganacheOptions) {
    let ganache;
    try{
        ganache = requireLocal('ganache-core');
        log.green('using ganache-core from dependencies');
    }catch(e){}

    if(!ganache) {
        try{
            ganache = requireLocal('ganache-cli');
            log.green('using ganache-cli from dependencies');
        } catch(e) {
            log.red(e);
            reject('you need to install your desired ganache-core version in your own project: "npm install ganache-core')
        }
    }

    const server = ganache.server(ganacheOptions);
    await executeServer(server, port);
}

module.exports = runGanache;
