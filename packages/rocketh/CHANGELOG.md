# rocketh

## 0.14.5

### Patch Changes

- allow to configure polling interval + remove confirmation field from deployment data

## 0.14.4

### Patch Changes

- revert

## 0.14.2

### Patch Changes

- also setup for loadEnvironment (used by hardhat-deploy)

## 0.14.1

### Patch Changes

- fix type

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

## 0.13.4

### Patch Changes

- extension for loadAndExecuteDeployments

## 0.13.3

### Patch Changes

- fix waitForTransactionReceipt + handle missing earliest

## 0.13.2

### Patch Changes

- fix

## 0.13.1

### Patch Changes

- rename and allow for variable getters in env

## 0.13.0

### Minor Changes

- use env function for extended functions

## 0.12.1

### Patch Changes

- Merge branch 'feat/create3-support'

## 0.12.0

### Minor Changes

- switch to setup function

## 0.11.22

### Patch Changes

- 5bf9962: allow to pass Extra date to environment
- a76870d: signer protocols are specified via config
- de97d9c: fix
- 77c2ffd: fix
- c841f17: use hard deps
- 966bab6: fixes
- c03812e: Extra type generic
- 1148e1c: fix
- 4d37f14: remove use of global, breakinmg change

## 0.11.22-testing.8

### Patch Changes

- fix

## 0.11.22-testing.7

### Patch Changes

- Extra type generic

## 0.11.22-testing.6

### Patch Changes

- fix

## 0.11.22-testing.5

### Patch Changes

- allow to pass Extra date to environment

## 0.11.22-testing.4

### Patch Changes

- fix

## 0.11.22-testing.3

### Patch Changes

- signer protocols are specified via config

## 0.11.22-testing.2

### Patch Changes

- use hard deps

## 0.11.22-testing.1

### Patch Changes

- fixes

## 0.11.22-testing.0

### Patch Changes

- remove use of global, breakinmg change

## 0.11.21

### Patch Changes

- allow minimal deployment info for read/execute

## 0.11.20

### Patch Changes

- use file:// import so it works on windows

## 0.11.19

### Patch Changes

- fix publicInfo for networks

## 0.11.18

### Patch Changes

- fixes + add basescan

## 0.11.17

### Patch Changes

- fix

## 0.11.16

### Patch Changes

- public chain info in config

## 0.11.15

### Patch Changes

- for convenience:support bigint but stringify it

## 0.11.14

### Patch Changes

- LinkedData + remove auto-json-convertion

## 0.11.13

### Patch Changes

- fix

## 0.11.12

### Patch Changes

- fix network specifics script folder

## 0.11.11

### Patch Changes

- actual fix

## 0.11.10

### Patch Changes

- fix

## 0.11.9

### Patch Changes

- 6d4e756: allow to specific data per network
- 82f6787: allow for specific deploy scripts folder per network
- 37e6a46: fix types

## 0.11.8

### Patch Changes

- fix

## 0.11.7

### Patch Changes

- deterministicDeployment fix

## 0.11.6

### Patch Changes

- fixes

## 0.11.5

### Patch Changes

- 4426c7d: remove .json config file + support custom deterministic deployment factory

## 0.11.4

### Patch Changes

- add default tags option for network

## 0.11.3

### Patch Changes

- 2431e8f: remove the use of context

## 0.11.2

### Patch Changes

- f2959f3: display <no-name>
- 169b618: migrations
- aaba9cb: allow to not save deployment + use it for diamond unamed artifact execution
- fee5656: upgradeIndex and numDeployments tracking

## 0.11.1

### Patch Changes

- release as v0.11.1

### Major Changes

- first alpha release

## 0.10.18

### Patch Changes

- fix chains import, no default export

## 0.10.17

### Patch Changes

- hardhat3-rocketh

## 0.10.16

### Patch Changes

- use tsx

## 0.10.15

### Patch Changes

- update latest esbuil

## 0.10.14

### Patch Changes

- latest dependencies

## 0.10.13

### Patch Changes

- forgot to build

## 0.10.12

### Patch Changes

- fixes for rocketh-doc and allow memory hardhat network to be used for it

## 0.10.11

### Patch Changes

- speicfy context from executor

## 0.10.10

### Patch Changes

- unnamedAccounts

## 0.10.9

### Patch Changes

- use pkgroll and @rocketh namespace

## 0.10.8

### Patch Changes

- add ancient8 to chains + export info via rocketh-export

## 0.10.7

### Patch Changes

- export eth utils like getGasPriceEstimate

## 0.10.6

### Patch Changes

- add info about network

## 0.10.5

### Patch Changes

- fix

## 0.10.4

### Patch Changes

- can skp report and prompts

## 0.10.3

### Patch Changes

- router allow extra abi

## 0.10.2

### Patch Changes

- report gas use

## 0.10.1

### Patch Changes

- ask before proceeding option

## 0.10.0

### Minor Changes

- read config always

## 0.9.2

### Patch Changes

- can reverse lookup named abi rom address

## 0.9.1

### Patch Changes

- use latest solidity-proxy

## 0.9.0

### Minor Changes

- get throw if deployment not found, add getOrNull

## 0.8.2

### Patch Changes

- attempt fix

## 0.8.1

### Patch Changes

- remove the need to pass chain

## 0.8.0

### Minor Changes

- use latest viem + add read

## 0.7.6

### Patch Changes

- type devdoc more leniant for older solc

## 0.7.5

### Patch Changes

- type devdoc more leniant for older solc

## 0.7.4

### Patch Changes

- use eip-1193-jsonrpc-provider new name

## 0.7.3

### Patch Changes

- fix

## 0.7.2

### Patch Changes

- use .chain file and include genesisHash

## 0.7.1

### Patch Changes

- use latest eip-1193-json-provider

## 0.7.0

### Minor Changes

- latest deps minus isomorphic-unfetch

## 0.6.20

### Patch Changes

- fix message indentation

## 0.6.19

### Patch Changes

- forgot to build

## 0.6.18

### Patch Changes

- show Contract Address

## 0.6.17

### Patch Changes

- fix deterministic deployment when already deployed + showMessage

## 0.6.16

### Patch Changes

- deterministic deployment via create2 factory

## 0.6.15

### Patch Changes

- confirmations for receipt

## 0.6.14

### Patch Changes

- simplify receipt

## 0.6.13

### Patch Changes

- add receipt to deployments

## 0.6.12

### Patch Changes

- forgot to build

## 0.6.11

### Patch Changes

- log using console if Logging level

## 0.6.10

### Patch Changes

- Option to skip esbuild-register

## 0.6.9

### Patch Changes

- add bytecode and linkedData to export

## 0.6.8

### Patch Changes

- better docs

## 0.6.7

### Patch Changes

- fix types

## 0.6.6

### Patch Changes

- fix types

## 0.6.5

### Patch Changes

- add rocketh-doc

## 0.6.4

### Patch Changes

- void spinner

## 0.6.3

### Patch Changes

- let deploy script accept arguments

## 0.6.2

### Patch Changes

- fix logging

## 0.6.1

### Patch Changes

- latest update + rocketh-router

## 0.6.0

### Minor Changes

- transaction field in deployment

## 0.5.18

### Patch Changes

- add loadEnvironment

## 0.5.17

### Patch Changes

- skip tx recovery when saveDeployments=false

## 0.5.16

### Patch Changes

- return environment instead of just deployments

## 0.5.15

### Patch Changes

- forgot to pass tx info

## 0.5.14

### Patch Changes

- add tx info in all case

## 0.5.13

### Patch Changes

- fixes

## 0.5.12

### Patch Changes

- fix

## 0.5.11

### Patch Changes

- better handling of pending tx

## 0.5.10

### Patch Changes

- show deploy name

## 0.5.9

### Patch Changes

- remove some log as we can't use ora

## 0.5.8

### Patch Changes

- remove ora

## 0.5.7

### Patch Changes

- use latest ora-cjs

## 0.5.6

### Patch Changes

- forgot to build

## 0.5.5

### Patch Changes

- fix

## 0.5.4

### Patch Changes

- use ora-cjs

## 0.5.3

### Patch Changes

- add logging

## 0.5.2

### Patch Changes

- fix

## 0.5.1

### Patch Changes

- 0.5.1
