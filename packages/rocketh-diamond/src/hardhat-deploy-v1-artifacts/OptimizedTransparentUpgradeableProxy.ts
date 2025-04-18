export default {
	contractName: 'OptimizedTransparentUpgradeableProxy',
	sourceName: 'solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol',
	abi: [
		{
			inputs: [
				{
					internalType: 'address',
					name: '_logic',
					type: 'address',
				},
				{
					internalType: 'address',
					name: 'admin_',
					type: 'address',
				},
				{
					internalType: 'bytes',
					name: '_data',
					type: 'bytes',
				},
			],
			stateMutability: 'payable',
			type: 'constructor',
		},
		{
			anonymous: false,
			inputs: [
				{
					indexed: false,
					internalType: 'address',
					name: 'previousAdmin',
					type: 'address',
				},
				{
					indexed: false,
					internalType: 'address',
					name: 'newAdmin',
					type: 'address',
				},
			],
			name: 'AdminChanged',
			type: 'event',
		},
		{
			anonymous: false,
			inputs: [
				{
					indexed: true,
					internalType: 'address',
					name: 'beacon',
					type: 'address',
				},
			],
			name: 'BeaconUpgraded',
			type: 'event',
		},
		{
			anonymous: false,
			inputs: [
				{
					indexed: true,
					internalType: 'address',
					name: 'implementation',
					type: 'address',
				},
			],
			name: 'Upgraded',
			type: 'event',
		},
		{
			stateMutability: 'payable',
			type: 'fallback',
		},
		{
			inputs: [],
			name: 'admin',
			outputs: [
				{
					internalType: 'address',
					name: 'admin_',
					type: 'address',
				},
			],
			stateMutability: 'nonpayable',
			type: 'function',
		},
		{
			inputs: [],
			name: 'implementation',
			outputs: [
				{
					internalType: 'address',
					name: 'implementation_',
					type: 'address',
				},
			],
			stateMutability: 'nonpayable',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'address',
					name: 'newImplementation',
					type: 'address',
				},
			],
			name: 'upgradeTo',
			outputs: [],
			stateMutability: 'nonpayable',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'address',
					name: 'newImplementation',
					type: 'address',
				},
				{
					internalType: 'bytes',
					name: 'data',
					type: 'bytes',
				},
			],
			name: 'upgradeToAndCall',
			outputs: [],
			stateMutability: 'payable',
			type: 'function',
		},
		{
			stateMutability: 'payable',
			type: 'receive',
		},
	],
	bytecode:
		'0x60a060405260405162000f5f38038062000f5f83398101604081905262000026916200044a565b82816200005560017f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd6200052a565b60008051602062000f188339815191521462000075576200007562000550565b62000083828260006200013c565b50620000b3905060017fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61046200052a565b60008051602062000ef883398151915214620000d357620000d362000550565b6001600160a01b038216608081905260008051602062000ef88339815191528381556040805160008152602081019390935290917f7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f910160405180910390a150505050620005b9565b620001478362000179565b600082511180620001555750805b156200017457620001728383620001bb60201b620002a91760201c565b505b505050565b6200018481620001ea565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b6060620001e3838360405180606001604052806027815260200162000f3860279139620002b2565b9392505050565b62000200816200039860201b620002d51760201c565b620002685760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084015b60405180910390fd5b806200029160008051602062000f1883398151915260001b620003a760201b620002411760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b60606001600160a01b0384163b6200031c5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b60648201526084016200025f565b600080856001600160a01b03168560405162000339919062000566565b600060405180830381855af49150503d806000811462000376576040519150601f19603f3d011682016040523d82523d6000602084013e6200037b565b606091505b5090925090506200038e828286620003aa565b9695505050505050565b6001600160a01b03163b151590565b90565b60608315620003bb575081620001e3565b825115620003cc5782518084602001fd5b8160405162461bcd60e51b81526004016200025f919062000584565b80516001600160a01b03811681146200040057600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620004385781810151838201526020016200041e565b83811115620001725750506000910152565b6000806000606084860312156200046057600080fd5b6200046b84620003e8565b92506200047b60208501620003e8565b60408501519092506001600160401b03808211156200049957600080fd5b818601915086601f830112620004ae57600080fd5b815181811115620004c357620004c362000405565b604051601f8201601f19908116603f01168101908382118183101715620004ee57620004ee62000405565b816040528281528960208487010111156200050857600080fd5b6200051b8360208301602088016200041b565b80955050505050509250925092565b6000828210156200054b57634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052600160045260246000fd5b600082516200057a8184602087016200041b565b9190910192915050565b6020815260008251806020840152620005a58160408501602087016200041b565b601f01601f19169190910160400192915050565b608051610900620005f86000396000818161011201528181610176015281816102060152818161025e01528181610287015261030901526109006000f3fe6080604052600436106100435760003560e01c80633659cfe61461005a5780634f1ef2861461007a5780635c60da1b1461008d578063f851a440146100cb57610052565b36610052576100506100e0565b005b6100506100e0565b34801561006657600080fd5b5061005061007536600461076c565b6100fa565b610050610088366004610787565b61015e565b34801561009957600080fd5b506100a26101ec565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b3480156100d757600080fd5b506100a2610244565b6100e86102f1565b6100f86100f36103e2565b610422565b565b3373ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001614156101565761015381604051806020016040528060008152506000610446565b50565b6101536100e0565b3373ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001614156101e4576101df8383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525060019250610446915050565b505050565b6101df6100e0565b60003373ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000161415610239576102346103e2565b905090565b6102416100e0565b90565b60003373ffffffffffffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000016141561023957507f000000000000000000000000000000000000000000000000000000000000000090565b60606102ce83836040518060600160405280602781526020016108a460279139610471565b9392505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b3373ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001614156100f8576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604260248201527f5472616e73706172656e745570677261646561626c6550726f78793a2061646d60448201527f696e2063616e6e6f742066616c6c6261636b20746f2070726f7879207461726760648201527f6574000000000000000000000000000000000000000000000000000000000000608482015260a4015b60405180910390fd5b60006102347f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b3660008037600080366000845af43d6000803e808015610441573d6000f35b3d6000fd5b61044f83610599565b60008251118061045c5750805b156101df5761046b83836102a9565b50505050565b606073ffffffffffffffffffffffffffffffffffffffff84163b610517576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e7472616374000000000000000000000000000000000000000000000000000060648201526084016103d9565b6000808573ffffffffffffffffffffffffffffffffffffffff168560405161053f9190610836565b600060405180830381855af49150503d806000811461057a576040519150601f19603f3d011682016040523d82523d6000602084013e61057f565b606091505b509150915061058f8282866105e6565b9695505050505050565b6105a281610639565b60405173ffffffffffffffffffffffffffffffffffffffff8216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b606083156105f55750816102ce565b8251156106055782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103d99190610852565b73ffffffffffffffffffffffffffffffffffffffff81163b6106dd576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201527f6f74206120636f6e74726163740000000000000000000000000000000000000060648201526084016103d9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b803573ffffffffffffffffffffffffffffffffffffffff8116811461076757600080fd5b919050565b60006020828403121561077e57600080fd5b6102ce82610743565b60008060006040848603121561079c57600080fd5b6107a584610743565b9250602084013567ffffffffffffffff808211156107c257600080fd5b818601915086601f8301126107d657600080fd5b8135818111156107e557600080fd5b8760208285010111156107f757600080fd5b6020830194508093505050509250925092565b60005b8381101561082557818101518382015260200161080d565b8381111561046b5750506000910152565b6000825161084881846020870161080a565b9190910192915050565b602081526000825180602084015261087181604085016020870161080a565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212206f70214c51cdd41c05ba0ffeb72b309ca3c8be178fd6e73c12162330799984f364736f6c634300080a0033b53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564',
	deployedBytecode:
		'0x6080604052600436106100435760003560e01c80633659cfe61461005a5780634f1ef2861461007a5780635c60da1b1461008d578063f851a440146100cb57610052565b36610052576100506100e0565b005b6100506100e0565b34801561006657600080fd5b5061005061007536600461076c565b6100fa565b610050610088366004610787565b61015e565b34801561009957600080fd5b506100a26101ec565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b3480156100d757600080fd5b506100a2610244565b6100e86102f1565b6100f86100f36103e2565b610422565b565b3373ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001614156101565761015381604051806020016040528060008152506000610446565b50565b6101536100e0565b3373ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001614156101e4576101df8383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525060019250610446915050565b505050565b6101df6100e0565b60003373ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000161415610239576102346103e2565b905090565b6102416100e0565b90565b60003373ffffffffffffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000016141561023957507f000000000000000000000000000000000000000000000000000000000000000090565b60606102ce83836040518060600160405280602781526020016108a460279139610471565b9392505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b3373ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001614156100f8576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604260248201527f5472616e73706172656e745570677261646561626c6550726f78793a2061646d60448201527f696e2063616e6e6f742066616c6c6261636b20746f2070726f7879207461726760648201527f6574000000000000000000000000000000000000000000000000000000000000608482015260a4015b60405180910390fd5b60006102347f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b3660008037600080366000845af43d6000803e808015610441573d6000f35b3d6000fd5b61044f83610599565b60008251118061045c5750805b156101df5761046b83836102a9565b50505050565b606073ffffffffffffffffffffffffffffffffffffffff84163b610517576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e7472616374000000000000000000000000000000000000000000000000000060648201526084016103d9565b6000808573ffffffffffffffffffffffffffffffffffffffff168560405161053f9190610836565b600060405180830381855af49150503d806000811461057a576040519150601f19603f3d011682016040523d82523d6000602084013e61057f565b606091505b509150915061058f8282866105e6565b9695505050505050565b6105a281610639565b60405173ffffffffffffffffffffffffffffffffffffffff8216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b606083156105f55750816102ce565b8251156106055782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103d99190610852565b73ffffffffffffffffffffffffffffffffffffffff81163b6106dd576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201527f6f74206120636f6e74726163740000000000000000000000000000000000000060648201526084016103d9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b803573ffffffffffffffffffffffffffffffffffffffff8116811461076757600080fd5b919050565b60006020828403121561077e57600080fd5b6102ce82610743565b60008060006040848603121561079c57600080fd5b6107a584610743565b9250602084013567ffffffffffffffff808211156107c257600080fd5b818601915086601f8301126107d657600080fd5b8135818111156107e557600080fd5b8760208285010111156107f757600080fd5b6020830194508093505050509250925092565b60005b8381101561082557818101518382015260200161080d565b8381111561046b5750506000910152565b6000825161084881846020870161080a565b9190910192915050565b602081526000825180602084015261087181604085016020870161080a565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212206f70214c51cdd41c05ba0ffeb72b309ca3c8be178fd6e73c12162330799984f364736f6c634300080a0033',
	linkReferences: {},
	deployedLinkReferences: {},
	devdoc: {
		details:
			'This contract implements a proxy that is upgradeable by an admin. To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector clashing], which can potentially be used in an attack, this contract uses the https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two things that go hand in hand: 1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if that call matches one of the admin functions exposed by the proxy itself. 2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the implementation. If the admin tries to call a function on the implementation it will fail with an error that says "admin cannot fallback to proxy target". These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing the admin, so it\'s best if it\'s a dedicated account that is not used for anything else. This will avoid headaches due to sudden errors when trying to call a function from the proxy implementation. Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way, you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.',
		kind: 'dev',
		methods: {
			'admin()': {
				details:
					'Returns the current admin. NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyAdmin}. TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call. `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`',
			},
			constructor: {
				details:
					'Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.',
			},
			'implementation()': {
				details:
					'Returns the current implementation. NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyImplementation}. TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call. `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`',
			},
			'upgradeTo(address)': {
				details:
					'Upgrade the implementation of the proxy. NOTE: Only the admin can call this function. See {ProxyAdmin-upgrade}.',
			},
			'upgradeToAndCall(address,bytes)': {
				details:
					'Upgrade the implementation of the proxy, and then call a function from the new implementation as specified by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the proxied contract. NOTE: Only the admin can call this function. See {ProxyAdmin-upgradeAndCall}.',
			},
		},
		version: 1,
	},
	evm: {
		bytecode: {
			functionDebugData: {
				'@_155': {
					entryPoint: null,
					id: 155,
					parameterSlots: 2,
					returnSlots: 0,
				},
				'@_1642': {
					entryPoint: null,
					id: 1642,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@_setImplementation_224': {
					entryPoint: 490,
					id: 224,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@_upgradeToAndCall_269': {
					entryPoint: 316,
					id: 269,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@_upgradeTo_239': {
					entryPoint: 377,
					id: 239,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@functionDelegateCall_1437': {
					entryPoint: 443,
					id: 1437,
					parameterSlots: 2,
					returnSlots: 1,
				},
				'@functionDelegateCall_1472': {
					entryPoint: 690,
					id: 1472,
					parameterSlots: 3,
					returnSlots: 1,
				},
				'@getAddressSlot_1552': {
					entryPoint: 935,
					id: 1552,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@isContract_1227': {
					entryPoint: 920,
					id: 1227,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@verifyCallResult_1503': {
					entryPoint: 938,
					id: 1503,
					parameterSlots: 3,
					returnSlots: 1,
				},
				abi_decode_address_fromMemory: {
					entryPoint: 1000,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				abi_decode_tuple_t_addresst_addresst_bytes_memory_ptr_fromMemory: {
					entryPoint: 1098,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 1382,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_address_t_address__to_t_address_t_address__fromStack_reversed: {
					entryPoint: null,
					id: null,
					parameterSlots: 3,
					returnSlots: 1,
				},
				abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed: {
					entryPoint: 1412,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_stringliteral_972b7028e8de0bff0d553b3264eba2312ec98a552add05e58853b313f9f4ac65__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				checked_sub_t_uint256: {
					entryPoint: 1322,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				copy_memory_to_memory: {
					entryPoint: 1051,
					id: null,
					parameterSlots: 3,
					returnSlots: 0,
				},
				panic_error_0x01: {
					entryPoint: 1360,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
				panic_error_0x41: {
					entryPoint: 1029,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:3802:16',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:16',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '74:117:16',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '84:22:16',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '99:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '93:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '93:13:16',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '84:5:16',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '169:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '178:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '181:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '171:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '171:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '171:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																name: 'value',
																nodeType: 'YulIdentifier',
																src: '128:5:16',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '139:5:16',
																	},
																	{
																		arguments: [
																			{
																				arguments: [
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '154:3:16',
																						type: '',
																						value: '160',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '159:1:16',
																						type: '',
																						value: '1',
																					},
																				],
																				functionName: {
																					name: 'shl',
																					nodeType: 'YulIdentifier',
																					src: '150:3:16',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '150:11:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '163:1:16',
																				type: '',
																				value: '1',
																			},
																		],
																		functionName: {
																			name: 'sub',
																			nodeType: 'YulIdentifier',
																			src: '146:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '146:19:16',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '135:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '135:31:16',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '125:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '125:42:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '118:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '118:50:16',
											},
											nodeType: 'YulIf',
											src: '115:70:16',
										},
									],
								},
								name: 'abi_decode_address_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '53:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '64:5:16',
										type: '',
									},
								],
								src: '14:177:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '228:95:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '245:1:16',
														type: '',
														value: '0',
													},
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '252:3:16',
																type: '',
																value: '224',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '257:10:16',
																type: '',
																value: '0x4e487b71',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '248:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '248:20:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '238:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '238:31:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '238:31:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '285:1:16',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '288:4:16',
														type: '',
														value: '0x41',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '278:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '278:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '278:15:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '309:1:16',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '312:4:16',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '302:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '302:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '302:15:16',
										},
									],
								},
								name: 'panic_error_0x41',
								nodeType: 'YulFunctionDefinition',
								src: '196:127:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '381:205:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '391:10:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '400:1:16',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '395:1:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '460:63:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '485:3:16',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '490:1:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '481:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '481:11:16',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'src',
																					nodeType: 'YulIdentifier',
																					src: '504:3:16',
																				},
																				{
																					name: 'i',
																					nodeType: 'YulIdentifier',
																					src: '509:1:16',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '500:3:16',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '500:11:16',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '494:5:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '494:18:16',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '474:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '474:39:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '474:39:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '421:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '424:6:16',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '418:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '418:13:16',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '432:19:16',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '434:15:16',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '443:1:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '446:2:16',
																	type: '',
																	value: '32',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '439:3:16',
															},
															nodeType: 'YulFunctionCall',
															src: '439:10:16',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '434:1:16',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '414:3:16',
												statements: [],
											},
											src: '410:113:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '549:31:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '562:3:16',
																		},
																		{
																			name: 'length',
																			nodeType: 'YulIdentifier',
																			src: '567:6:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '558:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '558:16:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '576:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '551:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '551:27:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '551:27:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '538:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '541:6:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '535:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '535:13:16',
											},
											nodeType: 'YulIf',
											src: '532:48:16',
										},
									],
								},
								name: 'copy_memory_to_memory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'src',
										nodeType: 'YulTypedName',
										src: '359:3:16',
										type: '',
									},
									{
										name: 'dst',
										nodeType: 'YulTypedName',
										src: '364:3:16',
										type: '',
									},
									{
										name: 'length',
										nodeType: 'YulTypedName',
										src: '369:6:16',
										type: '',
									},
								],
								src: '328:258:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '715:929:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '761:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '770:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '773:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '763:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '763:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '763:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '736:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '745:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '732:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '732:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '757:2:16',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '728:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '728:32:16',
											},
											nodeType: 'YulIf',
											src: '725:52:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '786:50:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '826:9:16',
													},
												],
												functionName: {
													name: 'abi_decode_address_fromMemory',
													nodeType: 'YulIdentifier',
													src: '796:29:16',
												},
												nodeType: 'YulFunctionCall',
												src: '796:40:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '786:6:16',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '845:59:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '889:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '900:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '885:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '885:18:16',
													},
												],
												functionName: {
													name: 'abi_decode_address_fromMemory',
													nodeType: 'YulIdentifier',
													src: '855:29:16',
												},
												nodeType: 'YulFunctionCall',
												src: '855:49:16',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '845:6:16',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '913:39:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '937:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '948:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '933:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '933:18:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '927:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '927:25:16',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '917:6:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '961:28:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '979:2:16',
																type: '',
																value: '64',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '983:1:16',
																type: '',
																value: '1',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '975:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '975:10:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '987:1:16',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'sub',
													nodeType: 'YulIdentifier',
													src: '971:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '971:18:16',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '965:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1016:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1025:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1028:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1018:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1018:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1018:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1004:6:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1012:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1001:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1001:14:16',
											},
											nodeType: 'YulIf',
											src: '998:34:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1041:32:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1055:9:16',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1066:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1051:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1051:22:16',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1045:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1121:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1130:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1133:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1123:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1123:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1123:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																arguments: [
																	{
																		name: '_2',
																		nodeType: 'YulIdentifier',
																		src: '1100:2:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1104:4:16',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1096:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '1096:13:16',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '1111:7:16',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '1092:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1092:27:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1085:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1085:35:16',
											},
											nodeType: 'YulIf',
											src: '1082:55:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1146:19:16',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1162:2:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1156:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1156:9:16',
											},
											variables: [
												{
													name: '_3',
													nodeType: 'YulTypedName',
													src: '1150:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1188:22:16',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1190:16:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1190:18:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1190:18:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1180:2:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1184:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1177:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1177:10:16',
											},
											nodeType: 'YulIf',
											src: '1174:36:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1219:17:16',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1233:2:16',
														type: '',
														value: '31',
													},
												],
												functionName: {
													name: 'not',
													nodeType: 'YulIdentifier',
													src: '1229:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1229:7:16',
											},
											variables: [
												{
													name: '_4',
													nodeType: 'YulTypedName',
													src: '1223:2:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1245:23:16',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1265:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1259:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1259:9:16',
											},
											variables: [
												{
													name: 'memPtr',
													nodeType: 'YulTypedName',
													src: '1249:6:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1277:71:16',
											value: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1299:6:16',
													},
													{
														arguments: [
															{
																arguments: [
																	{
																		arguments: [
																			{
																				arguments: [
																					{
																						name: '_3',
																						nodeType: 'YulIdentifier',
																						src: '1323:2:16',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '1327:4:16',
																						type: '',
																						value: '0x1f',
																					},
																				],
																				functionName: {
																					name: 'add',
																					nodeType: 'YulIdentifier',
																					src: '1319:3:16',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '1319:13:16',
																			},
																			{
																				name: '_4',
																				nodeType: 'YulIdentifier',
																				src: '1334:2:16',
																			},
																		],
																		functionName: {
																			name: 'and',
																			nodeType: 'YulIdentifier',
																			src: '1315:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '1315:22:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1339:2:16',
																		type: '',
																		value: '63',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1311:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '1311:31:16',
															},
															{
																name: '_4',
																nodeType: 'YulIdentifier',
																src: '1344:2:16',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1307:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1307:40:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1295:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1295:53:16',
											},
											variables: [
												{
													name: 'newFreePtr',
													nodeType: 'YulTypedName',
													src: '1281:10:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1407:22:16',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1409:16:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1409:18:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1409:18:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																name: 'newFreePtr',
																nodeType: 'YulIdentifier',
																src: '1366:10:16',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '1378:2:16',
															},
														],
														functionName: {
															name: 'gt',
															nodeType: 'YulIdentifier',
															src: '1363:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1363:18:16',
													},
													{
														arguments: [
															{
																name: 'newFreePtr',
																nodeType: 'YulIdentifier',
																src: '1386:10:16',
															},
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1398:6:16',
															},
														],
														functionName: {
															name: 'lt',
															nodeType: 'YulIdentifier',
															src: '1383:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1383:22:16',
													},
												],
												functionName: {
													name: 'or',
													nodeType: 'YulIdentifier',
													src: '1360:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1360:46:16',
											},
											nodeType: 'YulIf',
											src: '1357:72:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1445:2:16',
														type: '',
														value: '64',
													},
													{
														name: 'newFreePtr',
														nodeType: 'YulIdentifier',
														src: '1449:10:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1438:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1438:22:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1438:22:16',
										},
										{
											expression: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1476:6:16',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1484:2:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1469:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1469:18:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1469:18:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1533:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1542:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1545:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1535:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1535:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1535:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																arguments: [
																	{
																		name: '_2',
																		nodeType: 'YulIdentifier',
																		src: '1510:2:16',
																	},
																	{
																		name: '_3',
																		nodeType: 'YulIdentifier',
																		src: '1514:2:16',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1506:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '1506:11:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1519:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1502:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1502:20:16',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1524:7:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1499:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1499:33:16',
											},
											nodeType: 'YulIf',
											src: '1496:53:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: '_2',
																nodeType: 'YulIdentifier',
																src: '1584:2:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1588:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1580:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1580:11:16',
													},
													{
														arguments: [
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1597:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1605:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1593:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1593:15:16',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1610:2:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '1558:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1558:55:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1558:55:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1622:16:16',
											value: {
												name: 'memPtr',
												nodeType: 'YulIdentifier',
												src: '1632:6:16',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1622:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_addresst_addresst_bytes_memory_ptr_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '665:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '676:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '688:6:16',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '696:6:16',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '704:6:16',
										type: '',
									},
								],
								src: '591:1053:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1698:173:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1728:111:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1749:1:16',
																	type: '',
																	value: '0',
																},
																{
																	arguments: [
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1756:3:16',
																			type: '',
																			value: '224',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1761:10:16',
																			type: '',
																			value: '0x4e487b71',
																		},
																	],
																	functionName: {
																		name: 'shl',
																		nodeType: 'YulIdentifier',
																		src: '1752:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '1752:20:16',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1742:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1742:31:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1742:31:16',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1793:1:16',
																	type: '',
																	value: '4',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1796:4:16',
																	type: '',
																	value: '0x11',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1786:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1786:15:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1786:15:16',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1821:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1824:4:16',
																	type: '',
																	value: '0x24',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1814:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1814:15:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1814:15:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'x',
														nodeType: 'YulIdentifier',
														src: '1714:1:16',
													},
													{
														name: 'y',
														nodeType: 'YulIdentifier',
														src: '1717:1:16',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '1711:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1711:8:16',
											},
											nodeType: 'YulIf',
											src: '1708:131:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1848:17:16',
											value: {
												arguments: [
													{
														name: 'x',
														nodeType: 'YulIdentifier',
														src: '1860:1:16',
													},
													{
														name: 'y',
														nodeType: 'YulIdentifier',
														src: '1863:1:16',
													},
												],
												functionName: {
													name: 'sub',
													nodeType: 'YulIdentifier',
													src: '1856:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1856:9:16',
											},
											variableNames: [
												{
													name: 'diff',
													nodeType: 'YulIdentifier',
													src: '1848:4:16',
												},
											],
										},
									],
								},
								name: 'checked_sub_t_uint256',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'x',
										nodeType: 'YulTypedName',
										src: '1680:1:16',
										type: '',
									},
									{
										name: 'y',
										nodeType: 'YulTypedName',
										src: '1683:1:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'diff',
										nodeType: 'YulTypedName',
										src: '1689:4:16',
										type: '',
									},
								],
								src: '1649:222:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1908:95:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1925:1:16',
														type: '',
														value: '0',
													},
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1932:3:16',
																type: '',
																value: '224',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1937:10:16',
																type: '',
																value: '0x4e487b71',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '1928:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1928:20:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1918:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1918:31:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1918:31:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1965:1:16',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1968:4:16',
														type: '',
														value: '0x01',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1958:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1958:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1958:15:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1989:1:16',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1992:4:16',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '1982:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1982:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1982:15:16',
										},
									],
								},
								name: 'panic_error_0x01',
								nodeType: 'YulFunctionDefinition',
								src: '1876:127:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2137:175:16',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '2147:26:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2159:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2170:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2155:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2155:18:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2147:4:16',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2182:29:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2200:3:16',
																type: '',
																value: '160',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2205:1:16',
																type: '',
																value: '1',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '2196:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2196:11:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2209:1:16',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'sub',
													nodeType: 'YulIdentifier',
													src: '2192:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2192:19:16',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '2186:2:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2227:9:16',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2242:6:16',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '2250:2:16',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '2238:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2238:15:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2220:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2220:34:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2220:34:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2274:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2285:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2270:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2270:18:16',
													},
													{
														arguments: [
															{
																name: 'value1',
																nodeType: 'YulIdentifier',
																src: '2294:6:16',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '2302:2:16',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '2290:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2290:15:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2263:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2263:43:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2263:43:16',
										},
									],
								},
								name: 'abi_encode_tuple_t_address_t_address__to_t_address_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2098:9:16',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '2109:6:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2117:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2128:4:16',
										type: '',
									},
								],
								src: '2008:304:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2491:235:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2508:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2519:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2501:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2501:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2501:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2542:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2553:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2538:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2538:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2558:2:16',
														type: '',
														value: '45',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2531:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2531:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2531:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2581:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2592:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2577:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2577:18:16',
													},
													{
														hexValue: '455243313936373a206e657720696d706c656d656e746174696f6e206973206e',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2597:34:16',
														type: '',
														value: 'ERC1967: new implementation is n',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2570:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2570:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2570:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2652:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2663:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2648:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2648:18:16',
													},
													{
														hexValue: '6f74206120636f6e7472616374',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2668:15:16',
														type: '',
														value: 'ot a contract',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2641:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2641:43:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2641:43:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '2693:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2705:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2716:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2701:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2701:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2693:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_972b7028e8de0bff0d553b3264eba2312ec98a552add05e58853b313f9f4ac65__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2468:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2482:4:16',
										type: '',
									},
								],
								src: '2317:409:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2905:228:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2922:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2933:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2915:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2915:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2915:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2956:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2967:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2952:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2952:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2972:2:16',
														type: '',
														value: '38',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2945:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2945:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2945:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2995:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3006:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2991:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2991:18:16',
													},
													{
														hexValue: '416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '3011:34:16',
														type: '',
														value: 'Address: delegate call to non-co',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2984:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2984:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2984:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3066:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3077:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3062:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3062:18:16',
													},
													{
														hexValue: '6e7472616374',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '3082:8:16',
														type: '',
														value: 'ntract',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3055:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3055:36:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3055:36:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3100:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3112:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3123:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3108:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3108:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3100:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2882:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2896:4:16',
										type: '',
									},
								],
								src: '2731:402:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3275:137:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '3285:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '3305:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '3299:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3299:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '3289:6:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '3347:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3355:4:16',
																type: '',
																value: '0x20',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3343:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3343:17:16',
													},
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3362:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3367:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '3321:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3321:53:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3321:53:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3383:23:16',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3394:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3399:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3390:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3390:16:16',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '3383:3:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'pos',
										nodeType: 'YulTypedName',
										src: '3251:3:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3256:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '3267:3:16',
										type: '',
									},
								],
								src: '3138:274:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3538:262:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3555:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3566:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3548:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3548:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3548:21:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3578:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '3598:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '3592:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3592:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '3582:6:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3625:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3636:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3621:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3621:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3641:6:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3614:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3614:34:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3614:34:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '3683:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3691:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3679:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3679:15:16',
													},
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3700:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3711:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3696:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3696:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3716:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '3657:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3657:66:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3657:66:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3732:62:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3748:9:16',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'length',
																				nodeType: 'YulIdentifier',
																				src: '3767:6:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '3775:2:16',
																				type: '',
																				value: '31',
																			},
																		],
																		functionName: {
																			name: 'add',
																			nodeType: 'YulIdentifier',
																			src: '3763:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '3763:15:16',
																	},
																	{
																		arguments: [
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '3784:2:16',
																				type: '',
																				value: '31',
																			},
																		],
																		functionName: {
																			name: 'not',
																			nodeType: 'YulIdentifier',
																			src: '3780:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '3780:7:16',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '3759:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '3759:29:16',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3744:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3744:45:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3791:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3740:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3740:54:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3732:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '3507:9:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3518:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '3529:4:16',
										type: '',
									},
								],
								src: '3417:383:16',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_address_fromMemory(offset) -> value\n    {\n        value := mload(offset)\n        if iszero(eq(value, and(value, sub(shl(160, 1), 1)))) { revert(0, 0) }\n    }\n    function panic_error_0x41()\n    {\n        mstore(0, shl(224, 0x4e487b71))\n        mstore(4, 0x41)\n        revert(0, 0x24)\n    }\n    function copy_memory_to_memory(src, dst, length)\n    {\n        let i := 0\n        for { } lt(i, length) { i := add(i, 32) }\n        {\n            mstore(add(dst, i), mload(add(src, i)))\n        }\n        if gt(i, length) { mstore(add(dst, length), 0) }\n    }\n    function abi_decode_tuple_t_addresst_addresst_bytes_memory_ptr_fromMemory(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 96) { revert(0, 0) }\n        value0 := abi_decode_address_fromMemory(headStart)\n        value1 := abi_decode_address_fromMemory(add(headStart, 32))\n        let offset := mload(add(headStart, 64))\n        let _1 := sub(shl(64, 1), 1)\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let _3 := mload(_2)\n        if gt(_3, _1) { panic_error_0x41() }\n        let _4 := not(31)\n        let memPtr := mload(64)\n        let newFreePtr := add(memPtr, and(add(and(add(_3, 0x1f), _4), 63), _4))\n        if or(gt(newFreePtr, _1), lt(newFreePtr, memPtr)) { panic_error_0x41() }\n        mstore(64, newFreePtr)\n        mstore(memPtr, _3)\n        if gt(add(add(_2, _3), 32), dataEnd) { revert(0, 0) }\n        copy_memory_to_memory(add(_2, 32), add(memPtr, 32), _3)\n        value2 := memPtr\n    }\n    function checked_sub_t_uint256(x, y) -> diff\n    {\n        if lt(x, y)\n        {\n            mstore(0, shl(224, 0x4e487b71))\n            mstore(4, 0x11)\n            revert(0, 0x24)\n        }\n        diff := sub(x, y)\n    }\n    function panic_error_0x01()\n    {\n        mstore(0, shl(224, 0x4e487b71))\n        mstore(4, 0x01)\n        revert(0, 0x24)\n    }\n    function abi_encode_tuple_t_address_t_address__to_t_address_t_address__fromStack_reversed(headStart, value1, value0) -> tail\n    {\n        tail := add(headStart, 64)\n        let _1 := sub(shl(160, 1), 1)\n        mstore(headStart, and(value0, _1))\n        mstore(add(headStart, 32), and(value1, _1))\n    }\n    function abi_encode_tuple_t_stringliteral_972b7028e8de0bff0d553b3264eba2312ec98a552add05e58853b313f9f4ac65__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 45)\n        mstore(add(headStart, 64), "ERC1967: new implementation is n")\n        mstore(add(headStart, 96), "ot a contract")\n        tail := add(headStart, 128)\n    }\n    function abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 38)\n        mstore(add(headStart, 64), "Address: delegate call to non-co")\n        mstore(add(headStart, 96), "ntract")\n        tail := add(headStart, 128)\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        copy_memory_to_memory(add(value0, 0x20), pos, length)\n        end := add(pos, length)\n    }\n    function abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        mstore(headStart, 32)\n        let length := mload(value0)\n        mstore(add(headStart, 32), length)\n        copy_memory_to_memory(add(value0, 32), add(headStart, 64), length)\n        tail := add(add(headStart, and(add(length, 31), not(31))), 64)\n    }\n}',
					id: 16,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			linkReferences: {},
			opcodes:
				'PUSH1 0xA0 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH3 0xF5F CODESIZE SUB DUP1 PUSH3 0xF5F DUP4 CODECOPY DUP2 ADD PUSH1 0x40 DUP2 SWAP1 MSTORE PUSH3 0x26 SWAP2 PUSH3 0x44A JUMP JUMPDEST DUP3 DUP2 PUSH3 0x55 PUSH1 0x1 PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBD PUSH3 0x52A JUMP JUMPDEST PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xF18 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE EQ PUSH3 0x75 JUMPI PUSH3 0x75 PUSH3 0x550 JUMP JUMPDEST PUSH3 0x83 DUP3 DUP3 PUSH1 0x0 PUSH3 0x13C JUMP JUMPDEST POP PUSH3 0xB3 SWAP1 POP PUSH1 0x1 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6104 PUSH3 0x52A JUMP JUMPDEST PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xEF8 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE EQ PUSH3 0xD3 JUMPI PUSH3 0xD3 PUSH3 0x550 JUMP JUMPDEST PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP3 AND PUSH1 0x80 DUP2 SWAP1 MSTORE PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xEF8 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE DUP4 DUP2 SSTORE PUSH1 0x40 DUP1 MLOAD PUSH1 0x0 DUP2 MSTORE PUSH1 0x20 DUP2 ADD SWAP4 SWAP1 SWAP4 MSTORE SWAP1 SWAP2 PUSH32 0x7E644D79422F17C01E4894B5F4F588D331EBFA28653D42AE832DC59E38C9798F SWAP2 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG1 POP POP POP POP PUSH3 0x5B9 JUMP JUMPDEST PUSH3 0x147 DUP4 PUSH3 0x179 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD GT DUP1 PUSH3 0x155 JUMPI POP DUP1 JUMPDEST ISZERO PUSH3 0x174 JUMPI PUSH3 0x172 DUP4 DUP4 PUSH3 0x1BB PUSH1 0x20 SHL PUSH3 0x2A9 OR PUSH1 0x20 SHR JUMP JUMPDEST POP JUMPDEST POP POP POP JUMP JUMPDEST PUSH3 0x184 DUP2 PUSH3 0x1EA JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP3 AND SWAP1 PUSH32 0xBC7CD75A20EE27FD9ADEBAB32041F755214DBC6BFFA90CC0225B39DA2E5C2D3B SWAP1 PUSH1 0x0 SWAP1 LOG2 POP JUMP JUMPDEST PUSH1 0x60 PUSH3 0x1E3 DUP4 DUP4 PUSH1 0x40 MLOAD DUP1 PUSH1 0x60 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x27 DUP2 MSTORE PUSH1 0x20 ADD PUSH3 0xF38 PUSH1 0x27 SWAP2 CODECOPY PUSH3 0x2B2 JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH3 0x200 DUP2 PUSH3 0x398 PUSH1 0x20 SHL PUSH3 0x2D5 OR PUSH1 0x20 SHR JUMP JUMPDEST PUSH3 0x268 JUMPI PUSH1 0x40 MLOAD PUSH3 0x461BCD PUSH1 0xE5 SHL DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x2D PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x455243313936373A206E657720696D706C656D656E746174696F6E206973206E PUSH1 0x44 DUP3 ADD MSTORE PUSH13 0x1BDD08184818DBDB9D1C9858DD PUSH1 0x9A SHL PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST DUP1 PUSH3 0x291 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xF18 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE PUSH1 0x0 SHL PUSH3 0x3A7 PUSH1 0x20 SHL PUSH3 0x241 OR PUSH1 0x20 SHR JUMP JUMPDEST DUP1 SLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB NOT AND PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB SWAP3 SWAP1 SWAP3 AND SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE POP JUMP JUMPDEST PUSH1 0x60 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP5 AND EXTCODESIZE PUSH3 0x31C JUMPI PUSH1 0x40 MLOAD PUSH3 0x461BCD PUSH1 0xE5 SHL DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x416464726573733A2064656C65676174652063616C6C20746F206E6F6E2D636F PUSH1 0x44 DUP3 ADD MSTORE PUSH6 0x1B9D1C9858DD PUSH1 0xD2 SHL PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH3 0x25F JUMP JUMPDEST PUSH1 0x0 DUP1 DUP6 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP6 PUSH1 0x40 MLOAD PUSH3 0x339 SWAP2 SWAP1 PUSH3 0x566 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH3 0x376 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH3 0x37B JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP1 SWAP3 POP SWAP1 POP PUSH3 0x38E DUP3 DUP3 DUP7 PUSH3 0x3AA JUMP JUMPDEST SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND EXTCODESIZE ISZERO ISZERO SWAP1 JUMP JUMPDEST SWAP1 JUMP JUMPDEST PUSH1 0x60 DUP4 ISZERO PUSH3 0x3BB JUMPI POP DUP2 PUSH3 0x1E3 JUMP JUMPDEST DUP3 MLOAD ISZERO PUSH3 0x3CC JUMPI DUP3 MLOAD DUP1 DUP5 PUSH1 0x20 ADD REVERT JUMPDEST DUP2 PUSH1 0x40 MLOAD PUSH3 0x461BCD PUSH1 0xE5 SHL DUP2 MSTORE PUSH1 0x4 ADD PUSH3 0x25F SWAP2 SWAP1 PUSH3 0x584 JUMP JUMPDEST DUP1 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP2 AND DUP2 EQ PUSH3 0x400 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH3 0x438 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH3 0x41E JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH3 0x172 JUMPI POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x60 DUP5 DUP7 SUB SLT ISZERO PUSH3 0x460 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x46B DUP5 PUSH3 0x3E8 JUMP JUMPDEST SWAP3 POP PUSH3 0x47B PUSH1 0x20 DUP6 ADD PUSH3 0x3E8 JUMP JUMPDEST PUSH1 0x40 DUP6 ADD MLOAD SWAP1 SWAP3 POP PUSH1 0x1 PUSH1 0x1 PUSH1 0x40 SHL SUB DUP1 DUP3 GT ISZERO PUSH3 0x499 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH3 0x4AE JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP2 DUP2 GT ISZERO PUSH3 0x4C3 JUMPI PUSH3 0x4C3 PUSH3 0x405 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH1 0x1F NOT SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH3 0x4EE JUMPI PUSH3 0x4EE PUSH3 0x405 JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP10 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH3 0x508 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x51B DUP4 PUSH1 0x20 DUP4 ADD PUSH1 0x20 DUP9 ADD PUSH3 0x41B JUMP JUMPDEST DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 DUP3 DUP3 LT ISZERO PUSH3 0x54B JUMPI PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP SUB SWAP1 JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x1 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH3 0x57A DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH3 0x41B JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 DUP3 MLOAD DUP1 PUSH1 0x20 DUP5 ADD MSTORE PUSH3 0x5A5 DUP2 PUSH1 0x40 DUP6 ADD PUSH1 0x20 DUP8 ADD PUSH3 0x41B JUMP JUMPDEST PUSH1 0x1F ADD PUSH1 0x1F NOT AND SWAP2 SWAP1 SWAP2 ADD PUSH1 0x40 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x80 MLOAD PUSH2 0x900 PUSH3 0x5F8 PUSH1 0x0 CODECOPY PUSH1 0x0 DUP2 DUP2 PUSH2 0x112 ADD MSTORE DUP2 DUP2 PUSH2 0x176 ADD MSTORE DUP2 DUP2 PUSH2 0x206 ADD MSTORE DUP2 DUP2 PUSH2 0x25E ADD MSTORE DUP2 DUP2 PUSH2 0x287 ADD MSTORE PUSH2 0x309 ADD MSTORE PUSH2 0x900 PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x43 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0x5A JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0x7A JUMPI DUP1 PUSH4 0x5C60DA1B EQ PUSH2 0x8D JUMPI DUP1 PUSH4 0xF851A440 EQ PUSH2 0xCB JUMPI PUSH2 0x52 JUMP JUMPDEST CALLDATASIZE PUSH2 0x52 JUMPI PUSH2 0x50 PUSH2 0xE0 JUMP JUMPDEST STOP JUMPDEST PUSH2 0x50 PUSH2 0xE0 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x66 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x50 PUSH2 0x75 CALLDATASIZE PUSH1 0x4 PUSH2 0x76C JUMP JUMPDEST PUSH2 0xFA JUMP JUMPDEST PUSH2 0x50 PUSH2 0x88 CALLDATASIZE PUSH1 0x4 PUSH2 0x787 JUMP JUMPDEST PUSH2 0x15E JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x99 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA2 PUSH2 0x1EC JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xD7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA2 PUSH2 0x244 JUMP JUMPDEST PUSH2 0xE8 PUSH2 0x2F1 JUMP JUMPDEST PUSH2 0xF8 PUSH2 0xF3 PUSH2 0x3E2 JUMP JUMPDEST PUSH2 0x422 JUMP JUMPDEST JUMP JUMPDEST CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x156 JUMPI PUSH2 0x153 DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH1 0x0 PUSH2 0x446 JUMP JUMPDEST POP JUMP JUMPDEST PUSH2 0x153 PUSH2 0xE0 JUMP JUMPDEST CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x1E4 JUMPI PUSH2 0x1DF DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH1 0x1 SWAP3 POP PUSH2 0x446 SWAP2 POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH2 0x1DF PUSH2 0xE0 JUMP JUMPDEST PUSH1 0x0 CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x239 JUMPI PUSH2 0x234 PUSH2 0x3E2 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH2 0x241 PUSH2 0xE0 JUMP JUMPDEST SWAP1 JUMP JUMPDEST PUSH1 0x0 CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x239 JUMPI POP PUSH32 0x0 SWAP1 JUMP JUMPDEST PUSH1 0x60 PUSH2 0x2CE DUP4 DUP4 PUSH1 0x40 MLOAD DUP1 PUSH1 0x60 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x27 DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x8A4 PUSH1 0x27 SWAP2 CODECOPY PUSH2 0x471 JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EXTCODESIZE ISZERO ISZERO SWAP1 JUMP JUMPDEST CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0xF8 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x42 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x5472616E73706172656E745570677261646561626C6550726F78793A2061646D PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x696E2063616E6E6F742066616C6C6261636B20746F2070726F78792074617267 PUSH1 0x64 DUP3 ADD MSTORE PUSH32 0x6574000000000000000000000000000000000000000000000000000000000000 PUSH1 0x84 DUP3 ADD MSTORE PUSH1 0xA4 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x234 PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST CALLDATASIZE PUSH1 0x0 DUP1 CALLDATACOPY PUSH1 0x0 DUP1 CALLDATASIZE PUSH1 0x0 DUP5 GAS DELEGATECALL RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 DUP1 ISZERO PUSH2 0x441 JUMPI RETURNDATASIZE PUSH1 0x0 RETURN JUMPDEST RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST PUSH2 0x44F DUP4 PUSH2 0x599 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD GT DUP1 PUSH2 0x45C JUMPI POP DUP1 JUMPDEST ISZERO PUSH2 0x1DF JUMPI PUSH2 0x46B DUP4 DUP4 PUSH2 0x2A9 JUMP JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x60 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 AND EXTCODESIZE PUSH2 0x517 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x416464726573733A2064656C65676174652063616C6C20746F206E6F6E2D636F PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6E74726163740000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH2 0x3D9 JUMP JUMPDEST PUSH1 0x0 DUP1 DUP6 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP6 PUSH1 0x40 MLOAD PUSH2 0x53F SWAP2 SWAP1 PUSH2 0x836 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x57A JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x57F JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP2 POP SWAP2 POP PUSH2 0x58F DUP3 DUP3 DUP7 PUSH2 0x5E6 JUMP JUMPDEST SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH2 0x5A2 DUP2 PUSH2 0x639 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH32 0xBC7CD75A20EE27FD9ADEBAB32041F755214DBC6BFFA90CC0225B39DA2E5C2D3B SWAP1 PUSH1 0x0 SWAP1 LOG2 POP JUMP JUMPDEST PUSH1 0x60 DUP4 ISZERO PUSH2 0x5F5 JUMPI POP DUP2 PUSH2 0x2CE JUMP JUMPDEST DUP3 MLOAD ISZERO PUSH2 0x605 JUMPI DUP3 MLOAD DUP1 DUP5 PUSH1 0x20 ADD REVERT JUMPDEST DUP2 PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD PUSH2 0x3D9 SWAP2 SWAP1 PUSH2 0x852 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND EXTCODESIZE PUSH2 0x6DD JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x2D PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x455243313936373A206E657720696D706C656D656E746174696F6E206973206E PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6F74206120636F6E747261637400000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH2 0x3D9 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000 AND PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP3 SWAP1 SWAP3 AND SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE JUMP JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x767 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x77E JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x2CE DUP3 PUSH2 0x743 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x79C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x7A5 DUP5 PUSH2 0x743 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x7C2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x7D6 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x7E5 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x7F7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x825 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH2 0x80D JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH2 0x46B JUMPI POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH2 0x848 DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH2 0x80A JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 DUP3 MLOAD DUP1 PUSH1 0x20 DUP5 ADD MSTORE PUSH2 0x871 DUP2 PUSH1 0x40 DUP6 ADD PUSH1 0x20 DUP8 ADD PUSH2 0x80A JUMP JUMPDEST PUSH1 0x1F ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND SWAP2 SWAP1 SWAP2 ADD PUSH1 0x40 ADD SWAP3 SWAP2 POP POP JUMP INVALID COINBASE PUSH5 0x6472657373 GASPRICE KECCAK256 PUSH13 0x6F772D6C6576656C2064656C65 PUSH8 0x6174652063616C6C KECCAK256 PUSH7 0x61696C6564A264 PUSH10 0x706673582212206F7021 0x4C MLOAD 0xCD 0xD4 SHR SDIV 0xBA 0xF INVALID 0xB7 0x2B ADDRESS SWAP13 LOG3 0xC8 0xBE OR DUP16 0xD6 0xE7 EXTCODECOPY SLT AND 0x23 ADDRESS PUSH26 0x9984F364736F6C634300080A0033B53127684A568B3173AE13B9 0xF8 0xA6 ADD PUSH15 0x243E63B6E8EE1178D6A717850B5D61 SUB CALLDATASIZE ADDMOD SWAP5 LOG1 EXTCODESIZE LOG1 LOG3 0x21 MOD PUSH8 0xC828492DB98DCA3E KECCAK256 PUSH23 0xCC3735A920A3CA505D382BBC416464726573733A206C6F PUSH24 0x2D6C6576656C2064656C65676174652063616C6C20666169 PUSH13 0x65640000000000000000000000 ',
			sourceMap:
				'1653:3648:15:-:0;;;1976:499;;;;;;;;;;;;;;;;;;:::i;:::-;2091:6;2099:5;1050:54:2;1103:1;1058:41;1050:54;:::i;:::-;-1:-1:-1;;;;;;;;;;;1018:87:2;1011:95;;;;:::i;:::-;1116:39;1134:6;1142:5;1149;1116:17;:39::i;:::-;-1:-1:-1;2146:45:15::1;::::0;-1:-1:-1;2190:1:15::1;2154:32;2146:45;:::i;:::-;-1:-1:-1::0;;;;;;;;;;;2123:69:15::1;2116:77;;;;:::i;:::-;-1:-1:-1::0;;;;;2203:15:15;::::1;;::::0;;;-1:-1:-1;;;;;;;;;;;2392:20:15;;;2436:32:::1;::::0;;2277:12:::1;2220:34:16::0;;2285:2;2270:18;;2263:43;;;;3847:66:3;;2436:32:15::1;::::0;2155:18:16;2436:32:15::1;;;;;;;2106:369;1976:499:::0;;;1653:3648;;2188:295:3;2326:29;2337:17;2326:10;:29::i;:::-;2383:1;2369:4;:11;:15;:28;;;;2388:9;2369:28;2365:112;;;2413:53;2442:17;2461:4;2413:28;;;;;:53;;:::i;:::-;;2365:112;2188:295;;;:::o;1902:152::-;1968:37;1987:17;1968:18;:37::i;:::-;2020:27;;-1:-1:-1;;;;;2020:27:3;;;;;;;;1902:152;:::o;6575:198:12:-;6658:12;6689:77;6710:6;6718:4;6689:77;;;;;;;;;;;;;;;;;:20;:77::i;:::-;6682:84;6575:198;-1:-1:-1;;;6575:198:12:o;1537:259:3:-;1618:37;1637:17;1618:18;;;;;:37;;:::i;:::-;1610:95;;;;-1:-1:-1;;;1610:95:3;;2519:2:16;1610:95:3;;;2501:21:16;2558:2;2538:18;;;2531:30;2597:34;2577:18;;;2570:62;-1:-1:-1;;;2648:18:16;;;2641:43;2701:19;;1610:95:3;;;;;;;;;1772:17;1715:48;-1:-1:-1;;;;;;;;;;;1742:20:3;;1715:26;;;;;:48;;:::i;:::-;:74;;-1:-1:-1;;;;;;1715:74:3;-1:-1:-1;;;;;1715:74:3;;;;;;;;;;-1:-1:-1;1537:259:3:o;6959:387:12:-;7100:12;-1:-1:-1;;;;;1470:19:12;;;7124:69;;;;-1:-1:-1;;;7124:69:12;;2933:2:16;7124:69:12;;;2915:21:16;2972:2;2952:18;;;2945:30;3011:34;2991:18;;;2984:62;-1:-1:-1;;;3062:18:16;;;3055:36;3108:19;;7124:69:12;2731:402:16;7124:69:12;7205:12;7219:23;7246:6;-1:-1:-1;;;;;7246:19:12;7266:4;7246:25;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;7204:67:12;;-1:-1:-1;7204:67:12;-1:-1:-1;7288:51:12;7204:67;;7326:12;7288:16;:51::i;:::-;7281:58;6959:387;-1:-1:-1;;;;;;6959:387:12:o;1180:320::-;-1:-1:-1;;;;;1470:19:12;;:23;;;1180:320::o;1599:147:14:-;1726:4;1599:147::o;7566:692:12:-;7712:12;7740:7;7736:516;;;-1:-1:-1;7770:10:12;7763:17;;7736:516;7881:17;;:21;7877:365;;8075:10;8069:17;8135:15;8122:10;8118:2;8114:19;8107:44;7877:365;8214:12;8207:20;;-1:-1:-1;;;8207:20:12;;;;;;;;:::i;14:177:16:-;93:13;;-1:-1:-1;;;;;135:31:16;;125:42;;115:70;;181:1;178;171:12;115:70;14:177;;;:::o;196:127::-;257:10;252:3;248:20;245:1;238:31;288:4;285:1;278:15;312:4;309:1;302:15;328:258;400:1;410:113;424:6;421:1;418:13;410:113;;;500:11;;;494:18;481:11;;;474:39;446:2;439:10;410:113;;;541:6;538:1;535:13;532:48;;;-1:-1:-1;;576:1:16;558:16;;551:27;328:258::o;591:1053::-;688:6;696;704;757:2;745:9;736:7;732:23;728:32;725:52;;;773:1;770;763:12;725:52;796:40;826:9;796:40;:::i;:::-;786:50;;855:49;900:2;889:9;885:18;855:49;:::i;:::-;948:2;933:18;;927:25;845:59;;-1:-1:-1;;;;;;1001:14:16;;;998:34;;;1028:1;1025;1018:12;998:34;1066:6;1055:9;1051:22;1041:32;;1111:7;1104:4;1100:2;1096:13;1092:27;1082:55;;1133:1;1130;1123:12;1082:55;1162:2;1156:9;1184:2;1180;1177:10;1174:36;;;1190:18;;:::i;:::-;1265:2;1259:9;1233:2;1319:13;;-1:-1:-1;;1315:22:16;;;1339:2;1311:31;1307:40;1295:53;;;1363:18;;;1383:22;;;1360:46;1357:72;;;1409:18;;:::i;:::-;1449:10;1445:2;1438:22;1484:2;1476:6;1469:18;1524:7;1519:2;1514;1510;1506:11;1502:20;1499:33;1496:53;;;1545:1;1542;1535:12;1496:53;1558:55;1610:2;1605;1597:6;1593:15;1588:2;1584;1580:11;1558:55;:::i;:::-;1632:6;1622:16;;;;;;;591:1053;;;;;:::o;1649:222::-;1689:4;1717:1;1714;1711:8;1708:131;;;1761:10;1756:3;1752:20;1749:1;1742:31;1796:4;1793:1;1786:15;1824:4;1821:1;1814:15;1708:131;-1:-1:-1;1856:9:16;;1649:222::o;1876:127::-;1937:10;1932:3;1928:20;1925:1;1918:31;1968:4;1965:1;1958:15;1992:4;1989:1;1982:15;3138:274;3267:3;3305:6;3299:13;3321:53;3367:6;3362:3;3355:4;3347:6;3343:17;3321:53;:::i;:::-;3390:16;;;;;3138:274;-1:-1:-1;;3138:274:16:o;3417:383::-;3566:2;3555:9;3548:21;3529:4;3598:6;3592:13;3641:6;3636:2;3625:9;3621:18;3614:34;3657:66;3716:6;3711:2;3700:9;3696:18;3691:2;3683:6;3679:15;3657:66;:::i;:::-;3784:2;3763:15;-1:-1:-1;;3759:29:16;3744:45;;;;3791:2;3740:54;;3417:383;-1:-1:-1;;3417:383:16:o;:::-;1653:3648:15;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@_524': {
					entryPoint: null,
					id: 524,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_532': {
					entryPoint: null,
					id: 532,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_beforeFallback_1751': {
					entryPoint: 753,
					id: 1751,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_beforeFallback_537': {
					entryPoint: null,
					id: 537,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_delegate_497': {
					entryPoint: 1058,
					id: 497,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@_fallback_516': {
					entryPoint: 224,
					id: 516,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_getAdmin_1760': {
					entryPoint: null,
					id: 1760,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_getImplementation_200': {
					entryPoint: null,
					id: 200,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_implementation_167': {
					entryPoint: 994,
					id: 167,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_setImplementation_224': {
					entryPoint: 1593,
					id: 224,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@_upgradeToAndCall_269': {
					entryPoint: 1094,
					id: 269,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@_upgradeTo_239': {
					entryPoint: 1433,
					id: 239,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@admin_1672': {
					entryPoint: 580,
					id: 1672,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@functionDelegateCall_1437': {
					entryPoint: 681,
					id: 1437,
					parameterSlots: 2,
					returnSlots: 1,
				},
				'@functionDelegateCall_1472': {
					entryPoint: 1137,
					id: 1472,
					parameterSlots: 3,
					returnSlots: 1,
				},
				'@getAddressSlot_1552': {
					entryPoint: null,
					id: 1552,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@implementation_1686': {
					entryPoint: 492,
					id: 1686,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@isContract_1227': {
					entryPoint: 725,
					id: 1227,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@upgradeToAndCall_1721': {
					entryPoint: 350,
					id: 1721,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@upgradeTo_1704': {
					entryPoint: 250,
					id: 1704,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@verifyCallResult_1503': {
					entryPoint: 1510,
					id: 1503,
					parameterSlots: 3,
					returnSlots: 1,
				},
				abi_decode_address: {
					entryPoint: 1859,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				abi_decode_tuple_t_address: {
					entryPoint: 1900,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_addresst_bytes_calldata_ptr: {
					entryPoint: 1927,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 2102,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_address__to_t_address__fromStack_reversed: {
					entryPoint: null,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed: {
					entryPoint: 2130,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_stringliteral_972b7028e8de0bff0d553b3264eba2312ec98a552add05e58853b313f9f4ac65__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				abi_encode_tuple_t_stringliteral_f5d2ea39d7e6c7d19dc32ccc2bd7ca26b7aa4a603ef4aa6f2b205c93c3ffe43d__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				copy_memory_to_memory: {
					entryPoint: 2058,
					id: null,
					parameterSlots: 3,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:3589:16',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:16',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '63:147:16',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '73:29:16',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '95:6:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '82:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '82:20:16',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '73:5:16',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '188:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '197:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '200:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '190:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '190:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '190:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																name: 'value',
																nodeType: 'YulIdentifier',
																src: '124:5:16',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '135:5:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '142:42:16',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '131:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '131:54:16',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '121:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '121:65:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '114:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '114:73:16',
											},
											nodeType: 'YulIf',
											src: '111:93:16',
										},
									],
								},
								name: 'abi_decode_address',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '42:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '53:5:16',
										type: '',
									},
								],
								src: '14:196:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '285:116:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '331:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '340:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '343:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '333:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '333:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '333:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '306:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '315:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '302:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '302:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '327:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '298:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '298:32:16',
											},
											nodeType: 'YulIf',
											src: '295:52:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '356:39:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '385:9:16',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '366:18:16',
												},
												nodeType: 'YulFunctionCall',
												src: '366:29:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '356:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_address',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '251:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '262:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '274:6:16',
										type: '',
									},
								],
								src: '215:186:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '512:559:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '558:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '567:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '570:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '560:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '560:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '560:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '533:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '542:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '529:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '529:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '554:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '525:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '525:32:16',
											},
											nodeType: 'YulIf',
											src: '522:52:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '583:39:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '612:9:16',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '593:18:16',
												},
												nodeType: 'YulFunctionCall',
												src: '593:29:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '583:6:16',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '631:46:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '662:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '673:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '658:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '658:18:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '645:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '645:32:16',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '635:6:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '686:28:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '696:18:16',
												type: '',
												value: '0xffffffffffffffff',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '690:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '741:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '750:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '753:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '743:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '743:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '743:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '729:6:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '737:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '726:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '726:14:16',
											},
											nodeType: 'YulIf',
											src: '723:34:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '766:32:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '780:9:16',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '791:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '776:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '776:22:16',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '770:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '846:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '855:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '858:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '848:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '848:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '848:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																arguments: [
																	{
																		name: '_2',
																		nodeType: 'YulIdentifier',
																		src: '825:2:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '829:4:16',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '821:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '821:13:16',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '836:7:16',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '817:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '817:27:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '810:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '810:35:16',
											},
											nodeType: 'YulIf',
											src: '807:55:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '871:30:16',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '898:2:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '885:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '885:16:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '875:6:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '928:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '937:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '940:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '930:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '930:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '930:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '916:6:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '924:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '913:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '913:14:16',
											},
											nodeType: 'YulIf',
											src: '910:34:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '994:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1003:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1006:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '996:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '996:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '996:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														arguments: [
															{
																arguments: [
																	{
																		name: '_2',
																		nodeType: 'YulIdentifier',
																		src: '967:2:16',
																	},
																	{
																		name: 'length',
																		nodeType: 'YulIdentifier',
																		src: '971:6:16',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '963:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '963:15:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '980:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '959:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '959:24:16',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '985:7:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '956:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '956:37:16',
											},
											nodeType: 'YulIf',
											src: '953:57:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1019:21:16',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1033:2:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1037:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1029:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1029:11:16',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1019:6:16',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1049:16:16',
											value: {
												name: 'length',
												nodeType: 'YulIdentifier',
												src: '1059:6:16',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1049:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_addresst_bytes_calldata_ptr',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '462:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '473:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '485:6:16',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '493:6:16',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '501:6:16',
										type: '',
									},
								],
								src: '406:665:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1177:125:16',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '1187:26:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1199:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1210:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1195:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1195:18:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1187:4:16',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1229:9:16',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '1244:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1252:42:16',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1240:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1240:55:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1222:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1222:74:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1222:74:16',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1146:9:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1157:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1168:4:16',
										type: '',
									},
								],
								src: '1076:226:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1481:296:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1498:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1509:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1491:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1491:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1491:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1532:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1543:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1528:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1528:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1548:2:16',
														type: '',
														value: '66',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1521:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1521:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1521:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1571:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1582:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1567:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1567:18:16',
													},
													{
														hexValue: '5472616e73706172656e745570677261646561626c6550726f78793a2061646d',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '1587:34:16',
														type: '',
														value: 'TransparentUpgradeableProxy: adm',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1560:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1560:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1560:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1642:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1653:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1638:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1638:18:16',
													},
													{
														hexValue: '696e2063616e6e6f742066616c6c6261636b20746f2070726f78792074617267',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '1658:34:16',
														type: '',
														value: 'in cannot fallback to proxy targ',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1631:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1631:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1631:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1713:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1724:3:16',
																type: '',
																value: '128',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1709:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1709:19:16',
													},
													{
														hexValue: '6574',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '1730:4:16',
														type: '',
														value: 'et',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1702:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1702:33:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1702:33:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1744:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1756:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1767:3:16',
														type: '',
														value: '160',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1752:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1752:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1744:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_f5d2ea39d7e6c7d19dc32ccc2bd7ca26b7aa4a603ef4aa6f2b205c93c3ffe43d__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1458:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1472:4:16',
										type: '',
									},
								],
								src: '1307:470:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1956:228:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1973:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1984:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1966:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1966:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1966:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2007:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2018:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2003:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2003:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2023:2:16',
														type: '',
														value: '38',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1996:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1996:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1996:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2046:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2057:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2042:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2042:18:16',
													},
													{
														hexValue: '416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2062:34:16',
														type: '',
														value: 'Address: delegate call to non-co',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2035:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2035:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2035:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2117:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2128:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2113:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2113:18:16',
													},
													{
														hexValue: '6e7472616374',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2133:8:16',
														type: '',
														value: 'ntract',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2106:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2106:36:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2106:36:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '2151:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2163:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2174:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2159:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2159:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2151:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1933:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1947:4:16',
										type: '',
									},
								],
								src: '1782:402:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2242:205:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '2252:10:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '2261:1:16',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '2256:1:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2321:63:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '2346:3:16',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '2351:1:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2342:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2342:11:16',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'src',
																					nodeType: 'YulIdentifier',
																					src: '2365:3:16',
																				},
																				{
																					name: 'i',
																					nodeType: 'YulIdentifier',
																					src: '2370:1:16',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '2361:3:16',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '2361:11:16',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '2355:5:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2355:18:16',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2335:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2335:39:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2335:39:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '2282:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2285:6:16',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '2279:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2279:13:16',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '2293:19:16',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '2295:15:16',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '2304:1:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2307:2:16',
																	type: '',
																	value: '32',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2300:3:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2300:10:16',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '2295:1:16',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '2275:3:16',
												statements: [],
											},
											src: '2271:113:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2410:31:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '2423:3:16',
																		},
																		{
																			name: 'length',
																			nodeType: 'YulIdentifier',
																			src: '2428:6:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2419:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2419:16:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2437:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2412:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2412:27:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2412:27:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '2399:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2402:6:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '2396:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2396:13:16',
											},
											nodeType: 'YulIf',
											src: '2393:48:16',
										},
									],
								},
								name: 'copy_memory_to_memory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'src',
										nodeType: 'YulTypedName',
										src: '2220:3:16',
										type: '',
									},
									{
										name: 'dst',
										nodeType: 'YulTypedName',
										src: '2225:3:16',
										type: '',
									},
									{
										name: 'length',
										nodeType: 'YulTypedName',
										src: '2230:6:16',
										type: '',
									},
								],
								src: '2189:258:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2589:137:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '2599:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2619:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2613:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2613:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '2603:6:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2661:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2669:4:16',
																type: '',
																value: '0x20',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2657:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2657:17:16',
													},
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '2676:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2681:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '2635:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2635:53:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2635:53:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '2697:23:16',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '2708:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2713:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2704:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2704:16:16',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '2697:3:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'pos',
										nodeType: 'YulTypedName',
										src: '2565:3:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2570:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '2581:3:16',
										type: '',
									},
								],
								src: '2452:274:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2852:321:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2869:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2880:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2862:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2862:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2862:21:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2892:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2912:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2906:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2906:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '2896:6:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2939:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2950:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2935:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2935:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2955:6:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2928:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2928:34:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2928:34:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2997:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3005:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2993:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2993:15:16',
													},
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3014:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3025:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3010:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3010:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3030:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '2971:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2971:66:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2971:66:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3046:121:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3062:9:16',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'length',
																				nodeType: 'YulIdentifier',
																				src: '3081:6:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '3089:2:16',
																				type: '',
																				value: '31',
																			},
																		],
																		functionName: {
																			name: 'add',
																			nodeType: 'YulIdentifier',
																			src: '3077:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '3077:15:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '3094:66:16',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '3073:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '3073:88:16',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3058:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3058:104:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3164:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3054:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3054:113:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3046:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2821:9:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2832:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2843:4:16',
										type: '',
									},
								],
								src: '2731:442:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3352:235:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3369:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3380:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3362:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3362:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3362:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3403:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3414:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3399:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3399:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3419:2:16',
														type: '',
														value: '45',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3392:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3392:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3392:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3442:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3453:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3438:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3438:18:16',
													},
													{
														hexValue: '455243313936373a206e657720696d706c656d656e746174696f6e206973206e',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '3458:34:16',
														type: '',
														value: 'ERC1967: new implementation is n',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3431:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3431:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3431:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3513:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3524:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3509:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3509:18:16',
													},
													{
														hexValue: '6f74206120636f6e7472616374',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '3529:15:16',
														type: '',
														value: 'ot a contract',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3502:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3502:43:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3502:43:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3554:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3566:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3577:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3562:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3562:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3554:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_972b7028e8de0bff0d553b3264eba2312ec98a552add05e58853b313f9f4ac65__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '3329:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '3343:4:16',
										type: '',
									},
								],
								src: '3178:409:16',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_address(offset) -> value\n    {\n        value := calldataload(offset)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n    }\n    function abi_decode_tuple_t_addresst_bytes_calldata_ptr(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n        let offset := calldataload(add(headStart, 32))\n        let _1 := 0xffffffffffffffff\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let length := calldataload(_2)\n        if gt(length, _1) { revert(0, 0) }\n        if gt(add(add(_2, length), 32), dataEnd) { revert(0, 0) }\n        value1 := add(_2, 32)\n        value2 := length\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function abi_encode_tuple_t_stringliteral_f5d2ea39d7e6c7d19dc32ccc2bd7ca26b7aa4a603ef4aa6f2b205c93c3ffe43d__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 66)\n        mstore(add(headStart, 64), "TransparentUpgradeableProxy: adm")\n        mstore(add(headStart, 96), "in cannot fallback to proxy targ")\n        mstore(add(headStart, 128), "et")\n        tail := add(headStart, 160)\n    }\n    function abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 38)\n        mstore(add(headStart, 64), "Address: delegate call to non-co")\n        mstore(add(headStart, 96), "ntract")\n        tail := add(headStart, 128)\n    }\n    function copy_memory_to_memory(src, dst, length)\n    {\n        let i := 0\n        for { } lt(i, length) { i := add(i, 32) }\n        {\n            mstore(add(dst, i), mload(add(src, i)))\n        }\n        if gt(i, length) { mstore(add(dst, length), 0) }\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        copy_memory_to_memory(add(value0, 0x20), pos, length)\n        end := add(pos, length)\n    }\n    function abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        mstore(headStart, 32)\n        let length := mload(value0)\n        mstore(add(headStart, 32), length)\n        copy_memory_to_memory(add(value0, 32), add(headStart, 64), length)\n        tail := add(add(headStart, and(add(length, 31), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0)), 64)\n    }\n    function abi_encode_tuple_t_stringliteral_972b7028e8de0bff0d553b3264eba2312ec98a552add05e58853b313f9f4ac65__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 45)\n        mstore(add(headStart, 64), "ERC1967: new implementation is n")\n        mstore(add(headStart, 96), "ot a contract")\n        tail := add(headStart, 128)\n    }\n}',
					id: 16,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {
				'1594': [
					{
						length: 32,
						start: 274,
					},
					{
						length: 32,
						start: 374,
					},
					{
						length: 32,
						start: 518,
					},
					{
						length: 32,
						start: 606,
					},
					{
						length: 32,
						start: 647,
					},
					{
						length: 32,
						start: 777,
					},
				],
			},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x43 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0x5A JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0x7A JUMPI DUP1 PUSH4 0x5C60DA1B EQ PUSH2 0x8D JUMPI DUP1 PUSH4 0xF851A440 EQ PUSH2 0xCB JUMPI PUSH2 0x52 JUMP JUMPDEST CALLDATASIZE PUSH2 0x52 JUMPI PUSH2 0x50 PUSH2 0xE0 JUMP JUMPDEST STOP JUMPDEST PUSH2 0x50 PUSH2 0xE0 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x66 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x50 PUSH2 0x75 CALLDATASIZE PUSH1 0x4 PUSH2 0x76C JUMP JUMPDEST PUSH2 0xFA JUMP JUMPDEST PUSH2 0x50 PUSH2 0x88 CALLDATASIZE PUSH1 0x4 PUSH2 0x787 JUMP JUMPDEST PUSH2 0x15E JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x99 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA2 PUSH2 0x1EC JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xD7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA2 PUSH2 0x244 JUMP JUMPDEST PUSH2 0xE8 PUSH2 0x2F1 JUMP JUMPDEST PUSH2 0xF8 PUSH2 0xF3 PUSH2 0x3E2 JUMP JUMPDEST PUSH2 0x422 JUMP JUMPDEST JUMP JUMPDEST CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x156 JUMPI PUSH2 0x153 DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH1 0x0 PUSH2 0x446 JUMP JUMPDEST POP JUMP JUMPDEST PUSH2 0x153 PUSH2 0xE0 JUMP JUMPDEST CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x1E4 JUMPI PUSH2 0x1DF DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH1 0x1 SWAP3 POP PUSH2 0x446 SWAP2 POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH2 0x1DF PUSH2 0xE0 JUMP JUMPDEST PUSH1 0x0 CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x239 JUMPI PUSH2 0x234 PUSH2 0x3E2 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH2 0x241 PUSH2 0xE0 JUMP JUMPDEST SWAP1 JUMP JUMPDEST PUSH1 0x0 CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0x239 JUMPI POP PUSH32 0x0 SWAP1 JUMP JUMPDEST PUSH1 0x60 PUSH2 0x2CE DUP4 DUP4 PUSH1 0x40 MLOAD DUP1 PUSH1 0x60 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x27 DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x8A4 PUSH1 0x27 SWAP2 CODECOPY PUSH2 0x471 JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EXTCODESIZE ISZERO ISZERO SWAP1 JUMP JUMPDEST CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF PUSH32 0x0 AND EQ ISZERO PUSH2 0xF8 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x42 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x5472616E73706172656E745570677261646561626C6550726F78793A2061646D PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x696E2063616E6E6F742066616C6C6261636B20746F2070726F78792074617267 PUSH1 0x64 DUP3 ADD MSTORE PUSH32 0x6574000000000000000000000000000000000000000000000000000000000000 PUSH1 0x84 DUP3 ADD MSTORE PUSH1 0xA4 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x234 PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST CALLDATASIZE PUSH1 0x0 DUP1 CALLDATACOPY PUSH1 0x0 DUP1 CALLDATASIZE PUSH1 0x0 DUP5 GAS DELEGATECALL RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 DUP1 ISZERO PUSH2 0x441 JUMPI RETURNDATASIZE PUSH1 0x0 RETURN JUMPDEST RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST PUSH2 0x44F DUP4 PUSH2 0x599 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD GT DUP1 PUSH2 0x45C JUMPI POP DUP1 JUMPDEST ISZERO PUSH2 0x1DF JUMPI PUSH2 0x46B DUP4 DUP4 PUSH2 0x2A9 JUMP JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x60 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 AND EXTCODESIZE PUSH2 0x517 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x416464726573733A2064656C65676174652063616C6C20746F206E6F6E2D636F PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6E74726163740000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH2 0x3D9 JUMP JUMPDEST PUSH1 0x0 DUP1 DUP6 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP6 PUSH1 0x40 MLOAD PUSH2 0x53F SWAP2 SWAP1 PUSH2 0x836 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x57A JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x57F JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP2 POP SWAP2 POP PUSH2 0x58F DUP3 DUP3 DUP7 PUSH2 0x5E6 JUMP JUMPDEST SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH2 0x5A2 DUP2 PUSH2 0x639 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH32 0xBC7CD75A20EE27FD9ADEBAB32041F755214DBC6BFFA90CC0225B39DA2E5C2D3B SWAP1 PUSH1 0x0 SWAP1 LOG2 POP JUMP JUMPDEST PUSH1 0x60 DUP4 ISZERO PUSH2 0x5F5 JUMPI POP DUP2 PUSH2 0x2CE JUMP JUMPDEST DUP3 MLOAD ISZERO PUSH2 0x605 JUMPI DUP3 MLOAD DUP1 DUP5 PUSH1 0x20 ADD REVERT JUMPDEST DUP2 PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD PUSH2 0x3D9 SWAP2 SWAP1 PUSH2 0x852 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND EXTCODESIZE PUSH2 0x6DD JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x2D PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x455243313936373A206E657720696D706C656D656E746174696F6E206973206E PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6F74206120636F6E747261637400000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH2 0x3D9 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000 AND PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP3 SWAP1 SWAP3 AND SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE JUMP JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x767 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x77E JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x2CE DUP3 PUSH2 0x743 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x79C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x7A5 DUP5 PUSH2 0x743 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x7C2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x7D6 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x7E5 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x7F7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x825 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH2 0x80D JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH2 0x46B JUMPI POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH2 0x848 DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH2 0x80A JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 DUP3 MLOAD DUP1 PUSH1 0x20 DUP5 ADD MSTORE PUSH2 0x871 DUP2 PUSH1 0x40 DUP6 ADD PUSH1 0x20 DUP8 ADD PUSH2 0x80A JUMP JUMPDEST PUSH1 0x1F ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND SWAP2 SWAP1 SWAP2 ADD PUSH1 0x40 ADD SWAP3 SWAP2 POP POP JUMP INVALID COINBASE PUSH5 0x6472657373 GASPRICE KECCAK256 PUSH13 0x6F772D6C6576656C2064656C65 PUSH8 0x6174652063616C6C KECCAK256 PUSH7 0x61696C6564A264 PUSH10 0x706673582212206F7021 0x4C MLOAD 0xCD 0xD4 SHR SDIV 0xBA 0xF INVALID 0xB7 0x2B ADDRESS SWAP13 LOG3 0xC8 0xBE OR DUP16 0xD6 0xE7 EXTCODECOPY SLT AND 0x23 ADDRESS PUSH26 0x9984F364736F6C634300080A0033000000000000000000000000 ',
			sourceMap:
				'1653:3648:15:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2903:11:4;:9;:11::i;:::-;1653:3648:15;;2680:11:4;:9;:11::i;4037:134:15:-;;;;;;;;;;-1:-1:-1;4037:134:15;;;;;:::i;:::-;;:::i;4547:164::-;;;;;;:::i;:::-;;:::i;3748:129::-;;;;;;;;;;;;;:::i;:::-;;;1252:42:16;1240:55;;;1222:74;;1210:2;1195:18;3748:129:15;;;;;;;3192:96;;;;;;;;;;;;;:::i;2327:110:4:-;2375:17;:15;:17::i;:::-;2402:28;2412:17;:15;:17::i;:::-;2402:9;:28::i;:::-;2327:110::o;4037:134:15:-;2649:10;:25;5286:6;2649:25;;2645:99;;;4110:54:::1;4128:17;4147:9;;;;;;;;;;;::::0;4158:5:::1;4110:17;:54::i;:::-;4037:134:::0;:::o;2645:99::-;2722:11;:9;:11::i;4547:164::-;2649:10;:25;5286:6;2649:25;;2645:99;;;4656:48:::1;4674:17;4693:4;;4656:48;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::0;::::1;::::0;;;;-1:-1:-1;4699:4:15::1;::::0;-1:-1:-1;4656:17:15::1;::::0;-1:-1:-1;;4656:48:15:i:1;:::-;4547:164:::0;;;:::o;2645:99::-;2722:11;:9;:11::i;3748:129::-;3800:23;2649:10;:25;5286:6;2649:25;;2645:99;;;3853:17:::1;:15;:17::i;:::-;3835:35;;3748:129:::0;:::o;2645:99::-;2722:11;:9;:11::i;:::-;3748:129;:::o;3192:96::-;3235:14;2649:10;:25;5286:6;2649:25;;2645:99;;;-1:-1:-1;5286:6:15;;3748:129::o;6575:198:12:-;6658:12;6689:77;6710:6;6718:4;6689:77;;;;;;;;;;;;;;;;;:20;:77::i;:::-;6682:84;6575:198;-1:-1:-1;;;6575:198:12:o;1180:320::-;1470:19;;;:23;;;1180:320::o;4986:207:15:-;5057:10;:25;5286:6;5057:25;;;5049:104;;;;;;;1509:2:16;5049:104:15;;;1491:21:16;1548:2;1528:18;;;1521:30;1587:34;1567:18;;;1560:62;1658:34;1638:18;;;1631:62;1730:4;1709:19;;;1702:33;1752:19;;5049:104:15;;;;;;;;1240:140:2;1307:12;1338:35;1035:66:3;1385:54;;;;1306:140;953:895:4;1291:14;1288:1;1285;1272:34;1505:1;1502;1486:14;1483:1;1467:14;1460:5;1447:60;1581:16;1578:1;1575;1560:38;1619:6;1686:66;;;;1801:16;1798:1;1791:27;1686:66;1721:16;1718:1;1711:27;2188:295:3;2326:29;2337:17;2326:10;:29::i;:::-;2383:1;2369:4;:11;:15;:28;;;;2388:9;2369:28;2365:112;;;2413:53;2442:17;2461:4;2413:28;:53::i;:::-;;2188:295;;;:::o;6959:387:12:-;7100:12;1470:19;;;;7124:69;;;;;;;1984:2:16;7124:69:12;;;1966:21:16;2023:2;2003:18;;;1996:30;2062:34;2042:18;;;2035:62;2133:8;2113:18;;;2106:36;2159:19;;7124:69:12;1782:402:16;7124:69:12;7205:12;7219:23;7246:6;:19;;7266:4;7246:25;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7204:67;;;;7288:51;7305:7;7314:10;7326:12;7288:16;:51::i;:::-;7281:58;6959:387;-1:-1:-1;;;;;;6959:387:12:o;1902:152:3:-;1968:37;1987:17;1968:18;:37::i;:::-;2020:27;;;;;;;;;;;1902:152;:::o;7566:692:12:-;7712:12;7740:7;7736:516;;;-1:-1:-1;7770:10:12;7763:17;;7736:516;7881:17;;:21;7877:365;;8075:10;8069:17;8135:15;8122:10;8118:2;8114:19;8107:44;7877:365;8214:12;8207:20;;;;;;;;;;;:::i;1537:259:3:-;1470:19:12;;;;1610:95:3;;;;;;;3380:2:16;1610:95:3;;;3362:21:16;3419:2;3399:18;;;3392:30;3458:34;3438:18;;;3431:62;3529:15;3509:18;;;3502:43;3562:19;;1610:95:3;3178:409:16;1610:95:3;1035:66;1715:74;;;;;;;;;;;;;;;1537:259::o;14:196:16:-;82:20;;142:42;131:54;;121:65;;111:93;;200:1;197;190:12;111:93;14:196;;;:::o;215:186::-;274:6;327:2;315:9;306:7;302:23;298:32;295:52;;;343:1;340;333:12;295:52;366:29;385:9;366:29;:::i;406:665::-;485:6;493;501;554:2;542:9;533:7;529:23;525:32;522:52;;;570:1;567;560:12;522:52;593:29;612:9;593:29;:::i;:::-;583:39;;673:2;662:9;658:18;645:32;696:18;737:2;729:6;726:14;723:34;;;753:1;750;743:12;723:34;791:6;780:9;776:22;766:32;;836:7;829:4;825:2;821:13;817:27;807:55;;858:1;855;848:12;807:55;898:2;885:16;924:2;916:6;913:14;910:34;;;940:1;937;930:12;910:34;985:7;980:2;971:6;967:2;963:15;959:24;956:37;953:57;;;1006:1;1003;996:12;953:57;1037:2;1033;1029:11;1019:21;;1059:6;1049:16;;;;;406:665;;;;;:::o;2189:258::-;2261:1;2271:113;2285:6;2282:1;2279:13;2271:113;;;2361:11;;;2355:18;2342:11;;;2335:39;2307:2;2300:10;2271:113;;;2402:6;2399:1;2396:13;2393:48;;;-1:-1:-1;;2437:1:16;2419:16;;2412:27;2189:258::o;2452:274::-;2581:3;2619:6;2613:13;2635:53;2681:6;2676:3;2669:4;2661:6;2657:17;2635:53;:::i;:::-;2704:16;;;;;2452:274;-1:-1:-1;;2452:274:16:o;2731:442::-;2880:2;2869:9;2862:21;2843:4;2912:6;2906:13;2955:6;2950:2;2939:9;2935:18;2928:34;2971:66;3030:6;3025:2;3014:9;3010:18;3005:2;2997:6;2993:15;2971:66;:::i;:::-;3089:2;3077:15;3094:66;3073:88;3058:104;;;;3164:2;3054:113;;2731:442;-1:-1:-1;;2731:442:16:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '460800',
				executionCost: 'infinite',
				totalCost: 'infinite',
			},
			external: {
				'': 'infinite',
				'admin()': 'infinite',
				'implementation()': 'infinite',
				'upgradeTo(address)': 'infinite',
				'upgradeToAndCall(address,bytes)': 'infinite',
			},
			internal: {
				'_admin()': 'infinite',
				'_beforeFallback()': 'infinite',
				'_getAdmin()': 'infinite',
			},
		},
		methodIdentifiers: {
			'admin()': 'f851a440',
			'implementation()': '5c60da1b',
			'upgradeTo(address)': '3659cfe6',
			'upgradeToAndCall(address,bytes)': '4f1ef286',
		},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"_logic","type":"address"},{"internalType":"address","name":"admin_","type":"address"},{"internalType":"bytes","name":"_data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"admin_","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"implementation","outputs":[{"internalType":"address","name":"implementation_","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}],"devdoc":{"details":"This contract implements a proxy that is upgradeable by an admin. To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector clashing], which can potentially be used in an attack, this contract uses the https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two things that go hand in hand: 1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if that call matches one of the admin functions exposed by the proxy itself. 2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the implementation. If the admin tries to call a function on the implementation it will fail with an error that says \\"admin cannot fallback to proxy target\\". These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing the admin, so it\'s best if it\'s a dedicated account that is not used for anything else. This will avoid headaches due to sudden errors when trying to call a function from the proxy implementation. Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way, you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.","kind":"dev","methods":{"admin()":{"details":"Returns the current admin. NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyAdmin}. TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call. `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`"},"constructor":{"details":"Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}."},"implementation()":{"details":"Returns the current implementation. NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyImplementation}. TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call. `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`"},"upgradeTo(address)":{"details":"Upgrade the implementation of the proxy. NOTE: Only the admin can call this function. See {ProxyAdmin-upgrade}."},"upgradeToAndCall(address,bytes)":{"details":"Upgrade the implementation of the proxy, and then call a function from the new implementation as specified by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the proxied contract. NOTE: Only the admin can call this function. See {ProxyAdmin-upgradeAndCall}."}},"version":1},"userdoc":{"kind":"user","methods":{},"version":1}},"settings":{"compilationTarget":{"solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol":"OptimizedTransparentUpgradeableProxy"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/openzeppelin/interfaces/draft-IERC1822.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (interfaces/draft-IERC1822.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev ERC1822: Universal Upgradeable Proxy Standard (UUPS) documents a method for upgradeability through a simplified\\n * proxy whose upgrades are fully controlled by the current implementation.\\n */\\ninterface IERC1822Proxiable {\\n    /**\\n     * @dev Returns the storage slot that the proxiable contract assumes is being used to store the implementation\\n     * address.\\n     *\\n     * IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks\\n     * bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this\\n     * function revert if invoked through a proxy.\\n     */\\n    function proxiableUUID() external view returns (bytes32);\\n}\\n","keccak256":"0x93b4e21c931252739a1ec13ea31d3d35a5c068be3163ccab83e4d70c40355f03","license":"MIT"},"solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/ERC1967/ERC1967Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../Proxy.sol\\";\\nimport \\"./ERC1967Upgrade.sol\\";\\n\\n/**\\n * @dev This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an\\n * implementation address that can be changed. This address is stored in storage in the location specified by\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn\'t conflict with the storage layout of the\\n * implementation behind the proxy.\\n */\\ncontract ERC1967Proxy is Proxy, ERC1967Upgrade {\\n    /**\\n     * @dev Initializes the upgradeable proxy with an initial implementation specified by `_logic`.\\n     *\\n     * If `_data` is nonempty, it\'s used as data in a delegate call to `_logic`. This will typically be an encoded\\n     * function call, and allows initializating the storage of the proxy like a Solidity constructor.\\n     */\\n    constructor(address _logic, bytes memory _data) payable {\\n        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.implementation\\")) - 1));\\n        _upgradeToAndCall(_logic, _data, false);\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _implementation() internal view virtual override returns (address impl) {\\n        return ERC1967Upgrade._getImplementation();\\n    }\\n}\\n","keccak256":"0x6309f9f39dc6f4f45a24f296543867aa358e32946cd6b2874627a996d606b3a0","license":"MIT"},"solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Upgrade.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/ERC1967/ERC1967Upgrade.sol)\\n\\npragma solidity ^0.8.2;\\n\\nimport \\"../beacon/IBeacon.sol\\";\\nimport \\"../../interfaces/draft-IERC1822.sol\\";\\nimport \\"../../utils/Address.sol\\";\\nimport \\"../../utils/StorageSlot.sol\\";\\n\\n/**\\n * @dev This abstract contract provides getters and event emitting update functions for\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967] slots.\\n *\\n * _Available since v4.1._\\n *\\n * @custom:oz-upgrades-unsafe-allow delegatecall\\n */\\nabstract contract ERC1967Upgrade {\\n    // This is the keccak-256 hash of \\"eip1967.proxy.rollback\\" subtracted by 1\\n    bytes32 private constant _ROLLBACK_SLOT = 0x4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd9143;\\n\\n    /**\\n     * @dev Storage slot with the address of the current implementation.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.implementation\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n\\n    /**\\n     * @dev Emitted when the implementation is upgraded.\\n     */\\n    event Upgraded(address indexed implementation);\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _getImplementation() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 implementation slot.\\n     */\\n    function _setImplementation(address newImplementation) private {\\n        require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeTo(address newImplementation) internal {\\n        _setImplementation(newImplementation);\\n        emit Upgraded(newImplementation);\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCall(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _upgradeTo(newImplementation);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(newImplementation, data);\\n        }\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with security checks for UUPS proxies, and additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCallUUPS(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        // Upgrades from old implementations will perform a rollback test. This test requires the new\\n        // implementation to upgrade back to the old, non-ERC1822 compliant, implementation. Removing\\n        // this special case will break upgrade paths from old UUPS implementation to new ones.\\n        if (StorageSlot.getBooleanSlot(_ROLLBACK_SLOT).value) {\\n            _setImplementation(newImplementation);\\n        } else {\\n            try IERC1822Proxiable(newImplementation).proxiableUUID() returns (bytes32 slot) {\\n                require(slot == _IMPLEMENTATION_SLOT, \\"ERC1967Upgrade: unsupported proxiableUUID\\");\\n            } catch {\\n                revert(\\"ERC1967Upgrade: new implementation is not UUPS\\");\\n            }\\n            _upgradeToAndCall(newImplementation, data, forceCall);\\n        }\\n    }\\n\\n    /**\\n     * @dev Storage slot with the admin of the contract.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.admin\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;\\n\\n    /**\\n     * @dev Emitted when the admin account has changed.\\n     */\\n    event AdminChanged(address previousAdmin, address newAdmin);\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _getAdmin() internal view virtual returns (address) {\\n        return StorageSlot.getAddressSlot(_ADMIN_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 admin slot.\\n     */\\n    function _setAdmin(address newAdmin) private {\\n        require(newAdmin != address(0), \\"ERC1967: new admin is the zero address\\");\\n        StorageSlot.getAddressSlot(_ADMIN_SLOT).value = newAdmin;\\n    }\\n\\n    /**\\n     * @dev Changes the admin of the proxy.\\n     *\\n     * Emits an {AdminChanged} event.\\n     */\\n    function _changeAdmin(address newAdmin) internal {\\n        emit AdminChanged(_getAdmin(), newAdmin);\\n        _setAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.\\n     * This is bytes32(uint256(keccak256(\'eip1967.proxy.beacon\')) - 1)) and is validated in the constructor.\\n     */\\n    bytes32 internal constant _BEACON_SLOT = 0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50;\\n\\n    /**\\n     * @dev Emitted when the beacon is upgraded.\\n     */\\n    event BeaconUpgraded(address indexed beacon);\\n\\n    /**\\n     * @dev Returns the current beacon.\\n     */\\n    function _getBeacon() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_BEACON_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new beacon in the EIP1967 beacon slot.\\n     */\\n    function _setBeacon(address newBeacon) private {\\n        require(Address.isContract(newBeacon), \\"ERC1967: new beacon is not a contract\\");\\n        require(Address.isContract(IBeacon(newBeacon).implementation()), \\"ERC1967: beacon implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_BEACON_SLOT).value = newBeacon;\\n    }\\n\\n    /**\\n     * @dev Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does\\n     * not upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that).\\n     *\\n     * Emits a {BeaconUpgraded} event.\\n     */\\n    function _upgradeBeaconToAndCall(\\n        address newBeacon,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _setBeacon(newBeacon);\\n        emit BeaconUpgraded(newBeacon);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(IBeacon(newBeacon).implementation(), data);\\n        }\\n    }\\n}\\n","keccak256":"0x17668652127feebed0ce8d9431ef95ccc8c4292f03e3b8cf06c6ca16af396633","license":"MIT"},"solc_0.8/openzeppelin/proxy/Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This abstract contract provides a fallback function that delegates all calls to another contract using the EVM\\n * instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to\\n * be specified by overriding the virtual {_implementation} function.\\n *\\n * Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a\\n * different contract through the {_delegate} function.\\n *\\n * The success and return data of the delegated call will be returned back to the caller of the proxy.\\n */\\nabstract contract Proxy {\\n    /**\\n     * @dev Delegates the current call to `implementation`.\\n     *\\n     * This function does not return to its internal call site, it will return directly to the external caller.\\n     */\\n    function _delegate(address implementation) internal virtual {\\n        assembly {\\n            // Copy msg.data. We take full control of memory in this inline assembly\\n            // block because it will not return to Solidity code. We overwrite the\\n            // Solidity scratch pad at memory position 0.\\n            calldatacopy(0, 0, calldatasize())\\n\\n            // Call the implementation.\\n            // out and outsize are 0 because we don\'t know the size yet.\\n            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)\\n\\n            // Copy the returned data.\\n            returndatacopy(0, 0, returndatasize())\\n\\n            switch result\\n            // delegatecall returns 0 on error.\\n            case 0 {\\n                revert(0, returndatasize())\\n            }\\n            default {\\n                return(0, returndatasize())\\n            }\\n        }\\n    }\\n\\n    /**\\n     * @dev This is a virtual function that should be overriden so it returns the address to which the fallback function\\n     * and {_fallback} should delegate.\\n     */\\n    function _implementation() internal view virtual returns (address);\\n\\n    /**\\n     * @dev Delegates the current call to the address returned by `_implementation()`.\\n     *\\n     * This function does not return to its internall call site, it will return directly to the external caller.\\n     */\\n    function _fallback() internal virtual {\\n        _beforeFallback();\\n        _delegate(_implementation());\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other\\n     * function in the contract matches the call data.\\n     */\\n    fallback() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data\\n     * is empty.\\n     */\\n    receive() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Hook that is called before falling back to the implementation. Can happen as part of a manual `_fallback`\\n     * call, or as part of the Solidity `fallback` or `receive` functions.\\n     *\\n     * If overriden should call `super._beforeFallback()`.\\n     */\\n    function _beforeFallback() internal virtual {}\\n}\\n","keccak256":"0xd5d1fd16e9faff7fcb3a52e02a8d49156f42a38a03f07b5f1810c21c2149a8ab","license":"MIT"},"solc_0.8/openzeppelin/proxy/beacon/IBeacon.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/beacon/IBeacon.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This is the interface that {BeaconProxy} expects of its beacon.\\n */\\ninterface IBeacon {\\n    /**\\n     * @dev Must return an address that can be used as a delegate call target.\\n     *\\n     * {BeaconProxy} will check that this address is a contract.\\n     */\\n    function implementation() external view returns (address);\\n}\\n","keccak256":"0xd50a3421ac379ccb1be435fa646d66a65c986b4924f0849839f08692f39dde61","license":"MIT"},"solc_0.8/openzeppelin/utils/Address.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (utils/Address.sol)\\n\\npragma solidity ^0.8.1;\\n\\n/**\\n * @dev Collection of functions related to the address type\\n */\\nlibrary Address {\\n    /**\\n     * @dev Returns true if `account` is a contract.\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * It is unsafe to assume that an address for which this function returns\\n     * false is an externally-owned account (EOA) and not a contract.\\n     *\\n     * Among others, `isContract` will return false for the following\\n     * types of addresses:\\n     *\\n     *  - an externally-owned account\\n     *  - a contract in construction\\n     *  - an address where a contract will be created\\n     *  - an address where a contract lived, but was destroyed\\n     * ====\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * You shouldn\'t rely on `isContract` to protect against flash loan attacks!\\n     *\\n     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets\\n     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract\\n     * constructor.\\n     * ====\\n     */\\n    function isContract(address account) internal view returns (bool) {\\n        // This method relies on extcodesize/address.code.length, which returns 0\\n        // for contracts in construction, since the code is only stored at the end\\n        // of the constructor execution.\\n\\n        return account.code.length > 0;\\n    }\\n\\n    /**\\n     * @dev Replacement for Solidity\'s `transfer`: sends `amount` wei to\\n     * `recipient`, forwarding all available gas and reverting on errors.\\n     *\\n     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost\\n     * of certain opcodes, possibly making contracts go over the 2300 gas limit\\n     * imposed by `transfer`, making them unable to receive funds via\\n     * `transfer`. {sendValue} removes this limitation.\\n     *\\n     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].\\n     *\\n     * IMPORTANT: because control is transferred to `recipient`, care must be\\n     * taken to not create reentrancy vulnerabilities. Consider using\\n     * {ReentrancyGuard} or the\\n     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].\\n     */\\n    function sendValue(address payable recipient, uint256 amount) internal {\\n        require(address(this).balance >= amount, \\"Address: insufficient balance\\");\\n\\n        (bool success, ) = recipient.call{value: amount}(\\"\\");\\n        require(success, \\"Address: unable to send value, recipient may have reverted\\");\\n    }\\n\\n    /**\\n     * @dev Performs a Solidity function call using a low level `call`. A\\n     * plain `call` is an unsafe replacement for a function call: use this\\n     * function instead.\\n     *\\n     * If `target` reverts with a revert reason, it is bubbled up by this\\n     * function (like regular Solidity function calls).\\n     *\\n     * Returns the raw returned data. To convert to the expected return value,\\n     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].\\n     *\\n     * Requirements:\\n     *\\n     * - `target` must be a contract.\\n     * - calling `target` with `data` must not revert.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionCall(target, data, \\"Address: low-level call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with\\n     * `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, 0, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but also transferring `value` wei to `target`.\\n     *\\n     * Requirements:\\n     *\\n     * - the calling contract must have an ETH balance of at least `value`.\\n     * - the called Solidity function must be `payable`.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, value, \\"Address: low-level call with value failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but\\n     * with `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(address(this).balance >= value, \\"Address: insufficient balance for call\\");\\n        require(isContract(target), \\"Address: call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.call{value: value}(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {\\n        return functionStaticCall(target, data, \\"Address: low-level static call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal view returns (bytes memory) {\\n        require(isContract(target), \\"Address: static call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.staticcall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionDelegateCall(target, data, \\"Address: low-level delegate call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(isContract(target), \\"Address: delegate call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.delegatecall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Tool to verifies that a low level call was successful, and revert if it wasn\'t, either by bubbling the\\n     * revert reason using the provided one.\\n     *\\n     * _Available since v4.3._\\n     */\\n    function verifyCallResult(\\n        bool success,\\n        bytes memory returndata,\\n        string memory errorMessage\\n    ) internal pure returns (bytes memory) {\\n        if (success) {\\n            return returndata;\\n        } else {\\n            // Look for revert reason and bubble it up if present\\n            if (returndata.length > 0) {\\n                // The easiest way to bubble the revert reason is using memory via assembly\\n\\n                assembly {\\n                    let returndata_size := mload(returndata)\\n                    revert(add(32, returndata), returndata_size)\\n                }\\n            } else {\\n                revert(errorMessage);\\n            }\\n        }\\n    }\\n}\\n","keccak256":"0x3777e696b62134e6177440dbe6e6601c0c156a443f57167194b67e75527439de","license":"MIT"},"solc_0.8/openzeppelin/utils/StorageSlot.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (utils/StorageSlot.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev Library for reading and writing primitive types to specific storage slots.\\n *\\n * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.\\n * This library helps with reading and writing to such slots without the need for inline assembly.\\n *\\n * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.\\n *\\n * Example usage to set ERC1967 implementation slot:\\n * ```\\n * contract ERC1967 {\\n *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n *\\n *     function _getImplementation() internal view returns (address) {\\n *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n *     }\\n *\\n *     function _setImplementation(address newImplementation) internal {\\n *         require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n *     }\\n * }\\n * ```\\n *\\n * _Available since v4.1 for `address`, `bool`, `bytes32`, and `uint256`._\\n */\\nlibrary StorageSlot {\\n    struct AddressSlot {\\n        address value;\\n    }\\n\\n    struct BooleanSlot {\\n        bool value;\\n    }\\n\\n    struct Bytes32Slot {\\n        bytes32 value;\\n    }\\n\\n    struct Uint256Slot {\\n        uint256 value;\\n    }\\n\\n    /**\\n     * @dev Returns an `AddressSlot` with member `value` located at `slot`.\\n     */\\n    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `BooleanSlot` with member `value` located at `slot`.\\n     */\\n    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Bytes32Slot` with member `value` located at `slot`.\\n     */\\n    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Uint256Slot` with member `value` located at `slot`.\\n     */\\n    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n}\\n","keccak256":"0xfe1b7a9aa2a530a9e705b220e26cd584e2fbdc9602a3a1066032b12816b46aca","license":"MIT"},"solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/transparent/TransparentUpgradeableProxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../openzeppelin/proxy/ERC1967/ERC1967Proxy.sol\\";\\n\\n/**\\n * @dev This contract implements a proxy that is upgradeable by an admin.\\n *\\n * To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector\\n * clashing], which can potentially be used in an attack, this contract uses the\\n * https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two\\n * things that go hand in hand:\\n *\\n * 1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if\\n * that call matches one of the admin functions exposed by the proxy itself.\\n * 2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the\\n * implementation. If the admin tries to call a function on the implementation it will fail with an error that says\\n * \\"admin cannot fallback to proxy target\\".\\n *\\n * These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing\\n * the admin, so it\'s best if it\'s a dedicated account that is not used for anything else. This will avoid headaches due\\n * to sudden errors when trying to call a function from the proxy implementation.\\n *\\n * Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way,\\n * you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.\\n */\\ncontract OptimizedTransparentUpgradeableProxy is ERC1967Proxy {\\n    address internal immutable _ADMIN;\\n\\n    /**\\n     * @dev Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and\\n     * optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.\\n     */\\n    constructor(\\n        address _logic,\\n        address admin_,\\n        bytes memory _data\\n    ) payable ERC1967Proxy(_logic, _data) {\\n        assert(_ADMIN_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.admin\\")) - 1));\\n        _ADMIN = admin_;\\n\\n        // still store it to work with EIP-1967\\n        bytes32 slot = _ADMIN_SLOT;\\n        // solhint-disable-next-line no-inline-assembly\\n        assembly {\\n            sstore(slot, admin_)\\n        }\\n        emit AdminChanged(address(0), admin_);\\n    }\\n\\n    /**\\n     * @dev Modifier used internally that will delegate the call to the implementation unless the sender is the admin.\\n     */\\n    modifier ifAdmin() {\\n        if (msg.sender == _getAdmin()) {\\n            _;\\n        } else {\\n            _fallback();\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyAdmin}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`\\n     */\\n    function admin() external ifAdmin returns (address admin_) {\\n        admin_ = _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyImplementation}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`\\n     */\\n    function implementation() external ifAdmin returns (address implementation_) {\\n        implementation_ = _implementation();\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgrade}.\\n     */\\n    function upgradeTo(address newImplementation) external ifAdmin {\\n        _upgradeToAndCall(newImplementation, bytes(\\"\\"), false);\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy, and then call a function from the new implementation as specified\\n     * by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the\\n     * proxied contract.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgradeAndCall}.\\n     */\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable ifAdmin {\\n        _upgradeToAndCall(newImplementation, data, true);\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _admin() internal view virtual returns (address) {\\n        return _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Makes sure the admin cannot access the fallback function. See {Proxy-_beforeFallback}.\\n     */\\n    function _beforeFallback() internal virtual override {\\n        require(msg.sender != _getAdmin(), \\"TransparentUpgradeableProxy: admin cannot fallback to proxy target\\");\\n        super._beforeFallback();\\n    }\\n\\n    function _getAdmin() internal view virtual override returns (address) {\\n        return _ADMIN;\\n    }\\n}\\n","keccak256":"0xa30117644e27fa5b49e162aae2f62b36c1aca02f801b8c594d46e2024963a534","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {},
		version: 1,
	},
	solcInput:
		'{\n  "language": "Solidity",\n  "sources": {\n    "solc_0.8/openzeppelin/access/Ownable.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../utils/Context.sol\\";\\n\\n/**\\n * @dev Contract module which provides a basic access control mechanism, where\\n * there is an account (an owner) that can be granted exclusive access to\\n * specific functions.\\n *\\n * By default, the owner account will be the one that deploys the contract. This\\n * can later be changed with {transferOwnership}.\\n *\\n * This module is used through inheritance. It will make available the modifier\\n * `onlyOwner`, which can be applied to your functions to restrict their use to\\n * the owner.\\n */\\nabstract contract Ownable is Context {\\n    address private _owner;\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    /**\\n     * @dev Initializes the contract setting the deployer as the initial owner.\\n     */\\n    constructor (address initialOwner) {\\n        _transferOwnership(initialOwner);\\n    }\\n\\n    /**\\n     * @dev Returns the address of the current owner.\\n     */\\n    function owner() public view virtual returns (address) {\\n        return _owner;\\n    }\\n\\n    /**\\n     * @dev Throws if called by any account other than the owner.\\n     */\\n    modifier onlyOwner() {\\n        require(owner() == _msgSender(), \\"Ownable: caller is not the owner\\");\\n        _;\\n    }\\n\\n    /**\\n     * @dev Leaves the contract without owner. It will not be possible to call\\n     * `onlyOwner` functions anymore. Can only be called by the current owner.\\n     *\\n     * NOTE: Renouncing ownership will leave the contract without an owner,\\n     * thereby removing any functionality that is only available to the owner.\\n     */\\n    function renounceOwnership() public virtual onlyOwner {\\n        _transferOwnership(address(0));\\n    }\\n\\n    /**\\n     * @dev Transfers ownership of the contract to a new account (`newOwner`).\\n     * Can only be called by the current owner.\\n     */\\n    function transferOwnership(address newOwner) public virtual onlyOwner {\\n        require(newOwner != address(0), \\"Ownable: new owner is the zero address\\");\\n        _transferOwnership(newOwner);\\n    }\\n\\n    /**\\n     * @dev Transfers ownership of the contract to a new account (`newOwner`).\\n     * Internal function without access restriction.\\n     */\\n    function _transferOwnership(address newOwner) internal virtual {\\n        address oldOwner = _owner;\\n        _owner = newOwner;\\n        emit OwnershipTransferred(oldOwner, newOwner);\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/utils/Context.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev Provides information about the current execution context, including the\\n * sender of the transaction and its data. While these are generally available\\n * via msg.sender and msg.data, they should not be accessed in such a direct\\n * manner, since when dealing with meta-transactions the account sending and\\n * paying for execution may not be the actual sender (as far as an application\\n * is concerned).\\n *\\n * This contract is only required for intermediate, library-like contracts.\\n */\\nabstract contract Context {\\n    function _msgSender() internal view virtual returns (address) {\\n        return msg.sender;\\n    }\\n\\n    function _msgData() internal view virtual returns (bytes calldata) {\\n        return msg.data;\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/transparent/ProxyAdmin.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"./TransparentUpgradeableProxy.sol\\";\\nimport \\"../../access/Ownable.sol\\";\\n\\n/**\\n * @dev This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an\\n * explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.\\n */\\ncontract ProxyAdmin is Ownable {\\n\\n    constructor (address initialOwner) Ownable(initialOwner) {}\\n\\n    /**\\n     * @dev Returns the current implementation of `proxy`.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function getProxyImplementation(TransparentUpgradeableProxy proxy) public view virtual returns (address) {\\n        // We need to manually run the static call since the getter cannot be flagged as view\\n        // bytes4(keccak256(\\"implementation()\\")) == 0x5c60da1b\\n        (bool success, bytes memory returndata) = address(proxy).staticcall(hex\\"5c60da1b\\");\\n        require(success);\\n        return abi.decode(returndata, (address));\\n    }\\n\\n    /**\\n     * @dev Returns the current admin of `proxy`.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function getProxyAdmin(TransparentUpgradeableProxy proxy) public view virtual returns (address) {\\n        // We need to manually run the static call since the getter cannot be flagged as view\\n        // bytes4(keccak256(\\"admin()\\")) == 0xf851a440\\n        (bool success, bytes memory returndata) = address(proxy).staticcall(hex\\"f851a440\\");\\n        require(success);\\n        return abi.decode(returndata, (address));\\n    }\\n\\n    /**\\n     * @dev Changes the admin of `proxy` to `newAdmin`.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the current admin of `proxy`.\\n     */\\n    function changeProxyAdmin(TransparentUpgradeableProxy proxy, address newAdmin) public virtual onlyOwner {\\n        proxy.changeAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function upgrade(TransparentUpgradeableProxy proxy, address implementation) public virtual onlyOwner {\\n        proxy.upgradeTo(implementation);\\n    }\\n\\n    /**\\n     * @dev Upgrades `proxy` to `implementation` and calls a function on the new implementation. See\\n     * {TransparentUpgradeableProxy-upgradeToAndCall}.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function upgradeAndCall(\\n        TransparentUpgradeableProxy proxy,\\n        address implementation,\\n        bytes memory data\\n    ) public payable virtual onlyOwner {\\n        proxy.upgradeToAndCall{value: msg.value}(implementation, data);\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/transparent/TransparentUpgradeableProxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/transparent/TransparentUpgradeableProxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../ERC1967/ERC1967Proxy.sol\\";\\n\\n/**\\n * @dev This contract implements a proxy that is upgradeable by an admin.\\n *\\n * To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector\\n * clashing], which can potentially be used in an attack, this contract uses the\\n * https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two\\n * things that go hand in hand:\\n *\\n * 1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if\\n * that call matches one of the admin functions exposed by the proxy itself.\\n * 2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the\\n * implementation. If the admin tries to call a function on the implementation it will fail with an error that says\\n * \\"admin cannot fallback to proxy target\\".\\n *\\n * These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing\\n * the admin, so it\'s best if it\'s a dedicated account that is not used for anything else. This will avoid headaches due\\n * to sudden errors when trying to call a function from the proxy implementation.\\n *\\n * Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way,\\n * you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.\\n */\\ncontract TransparentUpgradeableProxy is ERC1967Proxy {\\n    /**\\n     * @dev Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and\\n     * optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.\\n     */\\n    constructor(\\n        address _logic,\\n        address admin_,\\n        bytes memory _data\\n    ) payable ERC1967Proxy(_logic, _data) {\\n        assert(_ADMIN_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.admin\\")) - 1));\\n        _changeAdmin(admin_);\\n    }\\n\\n    /**\\n     * @dev Modifier used internally that will delegate the call to the implementation unless the sender is the admin.\\n     */\\n    modifier ifAdmin() {\\n        if (msg.sender == _getAdmin()) {\\n            _;\\n        } else {\\n            _fallback();\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyAdmin}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`\\n     */\\n    function admin() external ifAdmin returns (address admin_) {\\n        admin_ = _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyImplementation}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`\\n     */\\n    function implementation() external ifAdmin returns (address implementation_) {\\n        implementation_ = _implementation();\\n    }\\n\\n    /**\\n     * @dev Changes the admin of the proxy.\\n     *\\n     * Emits an {AdminChanged} event.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-changeProxyAdmin}.\\n     */\\n    function changeAdmin(address newAdmin) external virtual ifAdmin {\\n        _changeAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgrade}.\\n     */\\n    function upgradeTo(address newImplementation) external ifAdmin {\\n        _upgradeToAndCall(newImplementation, bytes(\\"\\"), false);\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy, and then call a function from the new implementation as specified\\n     * by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the\\n     * proxied contract.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgradeAndCall}.\\n     */\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable ifAdmin {\\n        _upgradeToAndCall(newImplementation, data, true);\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _admin() internal view virtual returns (address) {\\n        return _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Makes sure the admin cannot access the fallback function. See {Proxy-_beforeFallback}.\\n     */\\n    function _beforeFallback() internal virtual override {\\n        require(msg.sender != _getAdmin(), \\"TransparentUpgradeableProxy: admin cannot fallback to proxy target\\");\\n        super._beforeFallback();\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/ERC1967/ERC1967Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../Proxy.sol\\";\\nimport \\"./ERC1967Upgrade.sol\\";\\n\\n/**\\n * @dev This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an\\n * implementation address that can be changed. This address is stored in storage in the location specified by\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn\'t conflict with the storage layout of the\\n * implementation behind the proxy.\\n */\\ncontract ERC1967Proxy is Proxy, ERC1967Upgrade {\\n    /**\\n     * @dev Initializes the upgradeable proxy with an initial implementation specified by `_logic`.\\n     *\\n     * If `_data` is nonempty, it\'s used as data in a delegate call to `_logic`. This will typically be an encoded\\n     * function call, and allows initializating the storage of the proxy like a Solidity constructor.\\n     */\\n    constructor(address _logic, bytes memory _data) payable {\\n        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.implementation\\")) - 1));\\n        _upgradeToAndCall(_logic, _data, false);\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _implementation() internal view virtual override returns (address impl) {\\n        return ERC1967Upgrade._getImplementation();\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/Proxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This abstract contract provides a fallback function that delegates all calls to another contract using the EVM\\n * instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to\\n * be specified by overriding the virtual {_implementation} function.\\n *\\n * Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a\\n * different contract through the {_delegate} function.\\n *\\n * The success and return data of the delegated call will be returned back to the caller of the proxy.\\n */\\nabstract contract Proxy {\\n    /**\\n     * @dev Delegates the current call to `implementation`.\\n     *\\n     * This function does not return to its internal call site, it will return directly to the external caller.\\n     */\\n    function _delegate(address implementation) internal virtual {\\n        assembly {\\n            // Copy msg.data. We take full control of memory in this inline assembly\\n            // block because it will not return to Solidity code. We overwrite the\\n            // Solidity scratch pad at memory position 0.\\n            calldatacopy(0, 0, calldatasize())\\n\\n            // Call the implementation.\\n            // out and outsize are 0 because we don\'t know the size yet.\\n            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)\\n\\n            // Copy the returned data.\\n            returndatacopy(0, 0, returndatasize())\\n\\n            switch result\\n            // delegatecall returns 0 on error.\\n            case 0 {\\n                revert(0, returndatasize())\\n            }\\n            default {\\n                return(0, returndatasize())\\n            }\\n        }\\n    }\\n\\n    /**\\n     * @dev This is a virtual function that should be overriden so it returns the address to which the fallback function\\n     * and {_fallback} should delegate.\\n     */\\n    function _implementation() internal view virtual returns (address);\\n\\n    /**\\n     * @dev Delegates the current call to the address returned by `_implementation()`.\\n     *\\n     * This function does not return to its internall call site, it will return directly to the external caller.\\n     */\\n    function _fallback() internal virtual {\\n        _beforeFallback();\\n        _delegate(_implementation());\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other\\n     * function in the contract matches the call data.\\n     */\\n    fallback() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data\\n     * is empty.\\n     */\\n    receive() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Hook that is called before falling back to the implementation. Can happen as part of a manual `_fallback`\\n     * call, or as part of the Solidity `fallback` or `receive` functions.\\n     *\\n     * If overriden should call `super._beforeFallback()`.\\n     */\\n    function _beforeFallback() internal virtual {}\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Upgrade.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/ERC1967/ERC1967Upgrade.sol)\\n\\npragma solidity ^0.8.2;\\n\\nimport \\"../beacon/IBeacon.sol\\";\\nimport \\"../../interfaces/draft-IERC1822.sol\\";\\nimport \\"../../utils/Address.sol\\";\\nimport \\"../../utils/StorageSlot.sol\\";\\n\\n/**\\n * @dev This abstract contract provides getters and event emitting update functions for\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967] slots.\\n *\\n * _Available since v4.1._\\n *\\n * @custom:oz-upgrades-unsafe-allow delegatecall\\n */\\nabstract contract ERC1967Upgrade {\\n    // This is the keccak-256 hash of \\"eip1967.proxy.rollback\\" subtracted by 1\\n    bytes32 private constant _ROLLBACK_SLOT = 0x4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd9143;\\n\\n    /**\\n     * @dev Storage slot with the address of the current implementation.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.implementation\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n\\n    /**\\n     * @dev Emitted when the implementation is upgraded.\\n     */\\n    event Upgraded(address indexed implementation);\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _getImplementation() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 implementation slot.\\n     */\\n    function _setImplementation(address newImplementation) private {\\n        require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeTo(address newImplementation) internal {\\n        _setImplementation(newImplementation);\\n        emit Upgraded(newImplementation);\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCall(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _upgradeTo(newImplementation);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(newImplementation, data);\\n        }\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with security checks for UUPS proxies, and additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCallUUPS(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        // Upgrades from old implementations will perform a rollback test. This test requires the new\\n        // implementation to upgrade back to the old, non-ERC1822 compliant, implementation. Removing\\n        // this special case will break upgrade paths from old UUPS implementation to new ones.\\n        if (StorageSlot.getBooleanSlot(_ROLLBACK_SLOT).value) {\\n            _setImplementation(newImplementation);\\n        } else {\\n            try IERC1822Proxiable(newImplementation).proxiableUUID() returns (bytes32 slot) {\\n                require(slot == _IMPLEMENTATION_SLOT, \\"ERC1967Upgrade: unsupported proxiableUUID\\");\\n            } catch {\\n                revert(\\"ERC1967Upgrade: new implementation is not UUPS\\");\\n            }\\n            _upgradeToAndCall(newImplementation, data, forceCall);\\n        }\\n    }\\n\\n    /**\\n     * @dev Storage slot with the admin of the contract.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.admin\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;\\n\\n    /**\\n     * @dev Emitted when the admin account has changed.\\n     */\\n    event AdminChanged(address previousAdmin, address newAdmin);\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _getAdmin() internal view virtual returns (address) {\\n        return StorageSlot.getAddressSlot(_ADMIN_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 admin slot.\\n     */\\n    function _setAdmin(address newAdmin) private {\\n        require(newAdmin != address(0), \\"ERC1967: new admin is the zero address\\");\\n        StorageSlot.getAddressSlot(_ADMIN_SLOT).value = newAdmin;\\n    }\\n\\n    /**\\n     * @dev Changes the admin of the proxy.\\n     *\\n     * Emits an {AdminChanged} event.\\n     */\\n    function _changeAdmin(address newAdmin) internal {\\n        emit AdminChanged(_getAdmin(), newAdmin);\\n        _setAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.\\n     * This is bytes32(uint256(keccak256(\'eip1967.proxy.beacon\')) - 1)) and is validated in the constructor.\\n     */\\n    bytes32 internal constant _BEACON_SLOT = 0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50;\\n\\n    /**\\n     * @dev Emitted when the beacon is upgraded.\\n     */\\n    event BeaconUpgraded(address indexed beacon);\\n\\n    /**\\n     * @dev Returns the current beacon.\\n     */\\n    function _getBeacon() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_BEACON_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new beacon in the EIP1967 beacon slot.\\n     */\\n    function _setBeacon(address newBeacon) private {\\n        require(Address.isContract(newBeacon), \\"ERC1967: new beacon is not a contract\\");\\n        require(Address.isContract(IBeacon(newBeacon).implementation()), \\"ERC1967: beacon implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_BEACON_SLOT).value = newBeacon;\\n    }\\n\\n    /**\\n     * @dev Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does\\n     * not upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that).\\n     *\\n     * Emits a {BeaconUpgraded} event.\\n     */\\n    function _upgradeBeaconToAndCall(\\n        address newBeacon,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _setBeacon(newBeacon);\\n        emit BeaconUpgraded(newBeacon);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(IBeacon(newBeacon).implementation(), data);\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/beacon/IBeacon.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/beacon/IBeacon.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This is the interface that {BeaconProxy} expects of its beacon.\\n */\\ninterface IBeacon {\\n    /**\\n     * @dev Must return an address that can be used as a delegate call target.\\n     *\\n     * {BeaconProxy} will check that this address is a contract.\\n     */\\n    function implementation() external view returns (address);\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/interfaces/draft-IERC1822.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (interfaces/draft-IERC1822.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev ERC1822: Universal Upgradeable Proxy Standard (UUPS) documents a method for upgradeability through a simplified\\n * proxy whose upgrades are fully controlled by the current implementation.\\n */\\ninterface IERC1822Proxiable {\\n    /**\\n     * @dev Returns the storage slot that the proxiable contract assumes is being used to store the implementation\\n     * address.\\n     *\\n     * IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks\\n     * bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this\\n     * function revert if invoked through a proxy.\\n     */\\n    function proxiableUUID() external view returns (bytes32);\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/utils/Address.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (utils/Address.sol)\\n\\npragma solidity ^0.8.1;\\n\\n/**\\n * @dev Collection of functions related to the address type\\n */\\nlibrary Address {\\n    /**\\n     * @dev Returns true if `account` is a contract.\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * It is unsafe to assume that an address for which this function returns\\n     * false is an externally-owned account (EOA) and not a contract.\\n     *\\n     * Among others, `isContract` will return false for the following\\n     * types of addresses:\\n     *\\n     *  - an externally-owned account\\n     *  - a contract in construction\\n     *  - an address where a contract will be created\\n     *  - an address where a contract lived, but was destroyed\\n     * ====\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * You shouldn\'t rely on `isContract` to protect against flash loan attacks!\\n     *\\n     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets\\n     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract\\n     * constructor.\\n     * ====\\n     */\\n    function isContract(address account) internal view returns (bool) {\\n        // This method relies on extcodesize/address.code.length, which returns 0\\n        // for contracts in construction, since the code is only stored at the end\\n        // of the constructor execution.\\n\\n        return account.code.length > 0;\\n    }\\n\\n    /**\\n     * @dev Replacement for Solidity\'s `transfer`: sends `amount` wei to\\n     * `recipient`, forwarding all available gas and reverting on errors.\\n     *\\n     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost\\n     * of certain opcodes, possibly making contracts go over the 2300 gas limit\\n     * imposed by `transfer`, making them unable to receive funds via\\n     * `transfer`. {sendValue} removes this limitation.\\n     *\\n     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].\\n     *\\n     * IMPORTANT: because control is transferred to `recipient`, care must be\\n     * taken to not create reentrancy vulnerabilities. Consider using\\n     * {ReentrancyGuard} or the\\n     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].\\n     */\\n    function sendValue(address payable recipient, uint256 amount) internal {\\n        require(address(this).balance >= amount, \\"Address: insufficient balance\\");\\n\\n        (bool success, ) = recipient.call{value: amount}(\\"\\");\\n        require(success, \\"Address: unable to send value, recipient may have reverted\\");\\n    }\\n\\n    /**\\n     * @dev Performs a Solidity function call using a low level `call`. A\\n     * plain `call` is an unsafe replacement for a function call: use this\\n     * function instead.\\n     *\\n     * If `target` reverts with a revert reason, it is bubbled up by this\\n     * function (like regular Solidity function calls).\\n     *\\n     * Returns the raw returned data. To convert to the expected return value,\\n     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].\\n     *\\n     * Requirements:\\n     *\\n     * - `target` must be a contract.\\n     * - calling `target` with `data` must not revert.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionCall(target, data, \\"Address: low-level call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with\\n     * `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, 0, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but also transferring `value` wei to `target`.\\n     *\\n     * Requirements:\\n     *\\n     * - the calling contract must have an ETH balance of at least `value`.\\n     * - the called Solidity function must be `payable`.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, value, \\"Address: low-level call with value failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but\\n     * with `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(address(this).balance >= value, \\"Address: insufficient balance for call\\");\\n        require(isContract(target), \\"Address: call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.call{value: value}(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {\\n        return functionStaticCall(target, data, \\"Address: low-level static call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal view returns (bytes memory) {\\n        require(isContract(target), \\"Address: static call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.staticcall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionDelegateCall(target, data, \\"Address: low-level delegate call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(isContract(target), \\"Address: delegate call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.delegatecall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Tool to verifies that a low level call was successful, and revert if it wasn\'t, either by bubbling the\\n     * revert reason using the provided one.\\n     *\\n     * _Available since v4.3._\\n     */\\n    function verifyCallResult(\\n        bool success,\\n        bytes memory returndata,\\n        string memory errorMessage\\n    ) internal pure returns (bytes memory) {\\n        if (success) {\\n            return returndata;\\n        } else {\\n            // Look for revert reason and bubble it up if present\\n            if (returndata.length > 0) {\\n                // The easiest way to bubble the revert reason is using memory via assembly\\n\\n                assembly {\\n                    let returndata_size := mload(returndata)\\n                    revert(add(32, returndata), returndata_size)\\n                }\\n            } else {\\n                revert(errorMessage);\\n            }\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/utils/StorageSlot.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (utils/StorageSlot.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev Library for reading and writing primitive types to specific storage slots.\\n *\\n * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.\\n * This library helps with reading and writing to such slots without the need for inline assembly.\\n *\\n * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.\\n *\\n * Example usage to set ERC1967 implementation slot:\\n * ```\\n * contract ERC1967 {\\n *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n *\\n *     function _getImplementation() internal view returns (address) {\\n *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n *     }\\n *\\n *     function _setImplementation(address newImplementation) internal {\\n *         require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n *     }\\n * }\\n * ```\\n *\\n * _Available since v4.1 for `address`, `bool`, `bytes32`, and `uint256`._\\n */\\nlibrary StorageSlot {\\n    struct AddressSlot {\\n        address value;\\n    }\\n\\n    struct BooleanSlot {\\n        bool value;\\n    }\\n\\n    struct Bytes32Slot {\\n        bytes32 value;\\n    }\\n\\n    struct Uint256Slot {\\n        uint256 value;\\n    }\\n\\n    /**\\n     * @dev Returns an `AddressSlot` with member `value` located at `slot`.\\n     */\\n    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `BooleanSlot` with member `value` located at `slot`.\\n     */\\n    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Bytes32Slot` with member `value` located at `slot`.\\n     */\\n    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Uint256Slot` with member `value` located at `slot`.\\n     */\\n    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/transparent/TransparentUpgradeableProxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../openzeppelin/proxy/ERC1967/ERC1967Proxy.sol\\";\\n\\n/**\\n * @dev This contract implements a proxy that is upgradeable by an admin.\\n *\\n * To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector\\n * clashing], which can potentially be used in an attack, this contract uses the\\n * https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two\\n * things that go hand in hand:\\n *\\n * 1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if\\n * that call matches one of the admin functions exposed by the proxy itself.\\n * 2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the\\n * implementation. If the admin tries to call a function on the implementation it will fail with an error that says\\n * \\"admin cannot fallback to proxy target\\".\\n *\\n * These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing\\n * the admin, so it\'s best if it\'s a dedicated account that is not used for anything else. This will avoid headaches due\\n * to sudden errors when trying to call a function from the proxy implementation.\\n *\\n * Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way,\\n * you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.\\n */\\ncontract OptimizedTransparentUpgradeableProxy is ERC1967Proxy {\\n    address internal immutable _ADMIN;\\n\\n    /**\\n     * @dev Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and\\n     * optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.\\n     */\\n    constructor(\\n        address _logic,\\n        address admin_,\\n        bytes memory _data\\n    ) payable ERC1967Proxy(_logic, _data) {\\n        assert(_ADMIN_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.admin\\")) - 1));\\n        _ADMIN = admin_;\\n\\n        // still store it to work with EIP-1967\\n        bytes32 slot = _ADMIN_SLOT;\\n        // solhint-disable-next-line no-inline-assembly\\n        assembly {\\n            sstore(slot, admin_)\\n        }\\n        emit AdminChanged(address(0), admin_);\\n    }\\n\\n    /**\\n     * @dev Modifier used internally that will delegate the call to the implementation unless the sender is the admin.\\n     */\\n    modifier ifAdmin() {\\n        if (msg.sender == _getAdmin()) {\\n            _;\\n        } else {\\n            _fallback();\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyAdmin}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`\\n     */\\n    function admin() external ifAdmin returns (address admin_) {\\n        admin_ = _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyImplementation}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`\\n     */\\n    function implementation() external ifAdmin returns (address implementation_) {\\n        implementation_ = _implementation();\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgrade}.\\n     */\\n    function upgradeTo(address newImplementation) external ifAdmin {\\n        _upgradeToAndCall(newImplementation, bytes(\\"\\"), false);\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy, and then call a function from the new implementation as specified\\n     * by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the\\n     * proxied contract.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgradeAndCall}.\\n     */\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable ifAdmin {\\n        _upgradeToAndCall(newImplementation, data, true);\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _admin() internal view virtual returns (address) {\\n        return _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Makes sure the admin cannot access the fallback function. See {Proxy-_beforeFallback}.\\n     */\\n    function _beforeFallback() internal virtual override {\\n        require(msg.sender != _getAdmin(), \\"TransparentUpgradeableProxy: admin cannot fallback to proxy target\\");\\n        super._beforeFallback();\\n    }\\n\\n    function _getAdmin() internal view virtual override returns (address) {\\n        return _ADMIN;\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/utils/UUPSUpgradeable.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/utils/UUPSUpgradeable.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../../interfaces/draft-IERC1822.sol\\";\\nimport \\"../ERC1967/ERC1967Upgrade.sol\\";\\n\\n/**\\n * @dev An upgradeability mechanism designed for UUPS proxies. The functions included here can perform an upgrade of an\\n * {ERC1967Proxy}, when this contract is set as the implementation behind such a proxy.\\n *\\n * A security mechanism ensures that an upgrade does not turn off upgradeability accidentally, although this risk is\\n * reinstated if the upgrade retains upgradeability but removes the security mechanism, e.g. by replacing\\n * `UUPSUpgradeable` with a custom implementation of upgrades.\\n *\\n * The {_authorizeUpgrade} function must be overridden to include access restriction to the upgrade mechanism.\\n *\\n * _Available since v4.1._\\n */\\nabstract contract UUPSUpgradeable is IERC1822Proxiable, ERC1967Upgrade {\\n    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable state-variable-assignment\\n    address private immutable __self = address(this);\\n\\n    /**\\n     * @dev Check that the execution is being performed through a delegatecall call and that the execution context is\\n     * a proxy contract with an implementation (as defined in ERC1967) pointing to self. This should only be the case\\n     * for UUPS and transparent proxies that are using the current contract as their implementation. Execution of a\\n     * function through ERC1167 minimal proxies (clones) would not normally pass this test, but is not guaranteed to\\n     * fail.\\n     */\\n    modifier onlyProxy() {\\n        require(address(this) != __self, \\"Function must be called through delegatecall\\");\\n        require(_getImplementation() == __self, \\"Function must be called through active proxy\\");\\n        _;\\n    }\\n\\n    /**\\n     * @dev Check that the execution is not being performed through a delegate call. This allows a function to be\\n     * callable on the implementing contract but not through proxies.\\n     */\\n    modifier notDelegated() {\\n        require(address(this) == __self, \\"UUPSUpgradeable: must not be called through delegatecall\\");\\n        _;\\n    }\\n\\n    /**\\n     * @dev Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the\\n     * implementation. It is used to validate that the this implementation remains valid after an upgrade.\\n     *\\n     * IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks\\n     * bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this\\n     * function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.\\n     */\\n    function proxiableUUID() external view virtual override notDelegated returns (bytes32) {\\n        return _IMPLEMENTATION_SLOT;\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy to `newImplementation`.\\n     *\\n     * Calls {_authorizeUpgrade}.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function upgradeTo(address newImplementation) external virtual onlyProxy {\\n        _authorizeUpgrade(newImplementation);\\n        _upgradeToAndCallUUPS(newImplementation, new bytes(0), false);\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call\\n     * encoded in `data`.\\n     *\\n     * Calls {_authorizeUpgrade}.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual onlyProxy {\\n        _authorizeUpgrade(newImplementation);\\n        _upgradeToAndCallUUPS(newImplementation, data, true);\\n    }\\n\\n    /**\\n     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract. Called by\\n     * {upgradeTo} and {upgradeToAndCall}.\\n     *\\n     * Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.\\n     *\\n     * ```solidity\\n     * function _authorizeUpgrade(address) internal override onlyOwner {}\\n     * ```\\n     */\\n    function _authorizeUpgrade(address newImplementation) internal virtual;\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/utils/Initializable.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/utils/Initializable.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../../utils/Address.sol\\";\\n\\n/**\\n * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed\\n * behind a proxy. Since proxied contracts do not make use of a constructor, it\'s common to move constructor logic to an\\n * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer\\n * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.\\n *\\n * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as\\n * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.\\n *\\n * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure\\n * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.\\n *\\n * [CAUTION]\\n * ====\\n * Avoid leaving a contract uninitialized.\\n *\\n * An uninitialized contract can be taken over by an attacker. This applies to both a proxy and its implementation\\n * contract, which may impact the proxy. To initialize the implementation contract, you can either invoke the\\n * initializer manually, or you can include a constructor to automatically mark it as initialized when it is deployed:\\n *\\n * [.hljs-theme-light.nopadding]\\n * ```\\n * /// @custom:oz-upgrades-unsafe-allow constructor\\n * constructor() initializer {}\\n * ```\\n * ====\\n */\\nabstract contract Initializable {\\n    /**\\n     * @dev Indicates that the contract has been initialized.\\n     */\\n    bool private _initialized;\\n\\n    /**\\n     * @dev Indicates that the contract is in the process of being initialized.\\n     */\\n    bool private _initializing;\\n\\n    /**\\n     * @dev Modifier to protect an initializer function from being invoked twice.\\n     */\\n    modifier initializer() {\\n        // If the contract is initializing we ignore whether _initialized is set in order to support multiple\\n        // inheritance patterns, but we only do this in the context of a constructor, because in other contexts the\\n        // contract may have been reentered.\\n        require(_initializing ? _isConstructor() : !_initialized, \\"Initializable: contract is already initialized\\");\\n\\n        bool isTopLevelCall = !_initializing;\\n        if (isTopLevelCall) {\\n            _initializing = true;\\n            _initialized = true;\\n        }\\n\\n        _;\\n\\n        if (isTopLevelCall) {\\n            _initializing = false;\\n        }\\n    }\\n\\n    /**\\n     * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the\\n     * {initializer} modifier, directly or indirectly.\\n     */\\n    modifier onlyInitializing() {\\n        require(_initializing, \\"Initializable: contract is not initializing\\");\\n        _;\\n    }\\n\\n    function _isConstructor() private view returns (bool) {\\n        return !Address.isContract(address(this));\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/beacon/UpgradeableBeacon.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/beacon/UpgradeableBeacon.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"./IBeacon.sol\\";\\nimport \\"../../access/Ownable.sol\\";\\nimport \\"../../utils/Address.sol\\";\\n\\n/**\\n * @dev This contract is used in conjunction with one or more instances of {BeaconProxy} to determine their\\n * implementation contract, which is where they will delegate all function calls.\\n *\\n * An owner is able to change the implementation the beacon points to, thus upgrading the proxies that use this beacon.\\n */\\ncontract UpgradeableBeacon is IBeacon, Ownable {\\n    address private _implementation;\\n\\n    /**\\n     * @dev Emitted when the implementation returned by the beacon is changed.\\n     */\\n    event Upgraded(address indexed implementation);\\n\\n    /**\\n     * @dev Sets the address of the initial implementation, and the deployer account as the owner who can upgrade the\\n     * beacon.\\n     */\\n\\n    constructor(address implementation_, address initialOwner) Ownable(initialOwner) {\\n        _setImplementation(implementation_);\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function implementation() public view virtual override returns (address) {\\n        return _implementation;\\n    }\\n\\n    /**\\n     * @dev Upgrades the beacon to a new implementation.\\n     *\\n     * Emits an {Upgraded} event.\\n     *\\n     * Requirements:\\n     *\\n     * - msg.sender must be the owner of the contract.\\n     * - `newImplementation` must be a contract.\\n     */\\n    function upgradeTo(address newImplementation) public virtual onlyOwner {\\n        _setImplementation(newImplementation);\\n        emit Upgraded(newImplementation);\\n    }\\n\\n    /**\\n     * @dev Sets the implementation contract address for this beacon\\n     *\\n     * Requirements:\\n     *\\n     * - `newImplementation` must be a contract.\\n     */\\n    function _setImplementation(address newImplementation) private {\\n        require(Address.isContract(newImplementation), \\"UpgradeableBeacon: implementation is not a contract\\");\\n        _implementation = newImplementation;\\n    }\\n}\\n"\n    },\n    "solc_0.8/openzeppelin/proxy/beacon/BeaconProxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/beacon/BeaconProxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"./IBeacon.sol\\";\\nimport \\"../Proxy.sol\\";\\nimport \\"../ERC1967/ERC1967Upgrade.sol\\";\\n\\n/**\\n * @dev This contract implements a proxy that gets the implementation address for each call from a {UpgradeableBeacon}.\\n *\\n * The beacon address is stored in storage slot `uint256(keccak256(\'eip1967.proxy.beacon\')) - 1`, so that it doesn\'t\\n * conflict with the storage layout of the implementation behind the proxy.\\n *\\n * _Available since v3.4._\\n */\\ncontract BeaconProxy is Proxy, ERC1967Upgrade {\\n    /**\\n     * @dev Initializes the proxy with `beacon`.\\n     *\\n     * If `data` is nonempty, it\'s used as data in a delegate call to the implementation returned by the beacon. This\\n     * will typically be an encoded function call, and allows initializating the storage of the proxy like a Solidity\\n     * constructor.\\n     *\\n     * Requirements:\\n     *\\n     * - `beacon` must be a contract with the interface {IBeacon}.\\n     */\\n    constructor(address beacon, bytes memory data) payable {\\n        assert(_BEACON_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.beacon\\")) - 1));\\n        _upgradeBeaconToAndCall(beacon, data, false);\\n    }\\n\\n    /**\\n     * @dev Returns the current beacon address.\\n     */\\n    function _beacon() internal view virtual returns (address) {\\n        return _getBeacon();\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation address of the associated beacon.\\n     */\\n    function _implementation() internal view virtual override returns (address) {\\n        return IBeacon(_getBeacon()).implementation();\\n    }\\n\\n    /**\\n     * @dev Changes the proxy to use a new beacon. Deprecated: see {_upgradeBeaconToAndCall}.\\n     *\\n     * If `data` is nonempty, it\'s used as data in a delegate call to the implementation returned by the beacon.\\n     *\\n     * Requirements:\\n     *\\n     * - `beacon` must be a contract.\\n     * - The implementation returned by `beacon` must be a contract.\\n     */\\n    function _setBeacon(address beacon, bytes memory data) internal virtual {\\n        _upgradeBeaconToAndCall(beacon, data, false);\\n    }\\n}\\n"\n    }\n  },\n  "settings": {\n    "optimizer": {\n      "enabled": true,\n      "runs": 999999\n    },\n    "outputSelection": {\n      "*": {\n        "*": [\n          "abi",\n          "evm.bytecode",\n          "evm.deployedBytecode",\n          "evm.methodIdentifiers",\n          "metadata",\n          "devdoc",\n          "userdoc",\n          "storageLayout",\n          "evm.gasEstimates"\n        ],\n        "": [\n          "ast"\n        ]\n      }\n    },\n    "metadata": {\n      "useLiteralContent": true\n    }\n  }\n}',
	solcInputHash: '0e89febeebc7444140de8e67c9067d2c',
} as const;
