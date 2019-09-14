const ProviderEngine = require('./providerengine');

const Provider = function(fallbackURL, subproviders) {

    // TODO : support sourcemap for source line debugging
    // if(contractInfos && compilationInput && srcPath) {
    //     const { RevertTraceSubprovider, AbstractArtifactAdapter } = require('@0x/sol-trace');

    //     const sourceCodes = {};
    //     const sources = {};
    
    //     const path = require('path');
    //     const sourceFilepaths = Object.keys(compilationInput.sources);
    //     for(let i = 0; i < sourceFilepaths.length; i++) {
    //         const sourceFilepath = sourceFilepaths[i];
    //         const content = compilationInput.sources[sourceFilepath].content;
    //         sourceCodes[i] = content;
    //         sources[i] = path.resolve(srcPath, sourceFilepath);
    //     }
        
    //     const contractDatas = [];
    //     const contractNames = Object.keys(contractInfos);
    //     for(let i = 0; i < contractNames.length; i++){
    //         const contractName = contractNames[i];
    //         const contractInfo = contractInfos[contractName];
    //         if(contractInfo.evm.bytecode.object === '0x' && contractInfo.evm.deployedBytecode.object === '0x') {
    //             continue;
    //         }
    //         contractDatas.push({
    //             name: contractName,
    //             sourceCodes: compilationInput,
    //             sources: compilationInput,
    //             bytecode: contractInfo.evm.bytecode.object,
    //             sourceMap: contractInfo.evm.bytecode.sourceMap,
    //             runtimeBytecode: contractInfo.evm.deployedBytecode.object,
    //             sourceMapRuntime: contractInfo.evm.deployedBytecode.sourceMap
    //         });
    //     }
        
    //     const artifactAdapter = new AbstractArtifactAdapter();
    //     artifactAdapter.collectContractsDataAsync = () => {
    //         return contractDatas;
    //     };
    
    //     const ethers = require('ethers');
    //     const wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/"+0);
    //     const defaultFromAddress = wallet.address; // Some ethereum address with test funds
    
    
    //     const revertTraceSubprovider = new RevertTraceSubprovider(artifactAdapter, defaultFromAddress);
    //     subproviders.push(revertTraceSubprovider);
    // }
    ProviderEngine.call(this, fallbackURL, subproviders);
}

Provider.prototype = ProviderEngine.prototype;

module.exports = Provider;
