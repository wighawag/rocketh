export default {
	contractName: 'EIP173Proxy',
	sourceName: 'solc_0.8/proxy/EIP173Proxy.sol',
	abi: [
		{
			inputs: [
				{
					internalType: 'address',
					name: 'implementationAddress',
					type: 'address',
				},
				{
					internalType: 'address',
					name: 'ownerAddress',
					type: 'address',
				},
				{
					internalType: 'bytes',
					name: 'data',
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
					indexed: true,
					internalType: 'address',
					name: 'previousOwner',
					type: 'address',
				},
				{
					indexed: true,
					internalType: 'address',
					name: 'newOwner',
					type: 'address',
				},
			],
			name: 'OwnershipTransferred',
			type: 'event',
		},
		{
			anonymous: false,
			inputs: [
				{
					indexed: true,
					internalType: 'address',
					name: 'previousImplementation',
					type: 'address',
				},
				{
					indexed: true,
					internalType: 'address',
					name: 'newImplementation',
					type: 'address',
				},
			],
			name: 'ProxyImplementationUpdated',
			type: 'event',
		},
		{
			stateMutability: 'payable',
			type: 'fallback',
		},
		{
			inputs: [],
			name: 'owner',
			outputs: [
				{
					internalType: 'address',
					name: '',
					type: 'address',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'bytes4',
					name: 'id',
					type: 'bytes4',
				},
			],
			name: 'supportsInterface',
			outputs: [
				{
					internalType: 'bool',
					name: '',
					type: 'bool',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'address',
					name: 'newOwner',
					type: 'address',
				},
			],
			name: 'transferOwnership',
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
		'0x608060405260405162000ccc38038062000ccc8339810160408190526200002691620001fc565b620000318262000046565b6200003d8382620000b8565b505050620002fa565b60006200006060008051602062000cac8339815191525490565b90508160008051602062000cac83398151915255816001600160a01b0316816001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc8054908390556040516001600160a01b0380851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a381511562000195576000836001600160a01b0316836040516200013c9190620002dc565b600060405180830381855af49150503d806000811462000179576040519150601f19603f3d011682016040523d82523d6000602084013e6200017e565b606091505b505090508062000193573d806000803e806000fd5b505b505050565b80516001600160a01b0381168114620001b257600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620001ea578181015183820152602001620001d0565b83811115620001935750506000910152565b6000806000606084860312156200021257600080fd5b6200021d846200019a565b92506200022d602085016200019a565b60408501519092506001600160401b03808211156200024b57600080fd5b818601915086601f8301126200026057600080fd5b815181811115620002755762000275620001b7565b604051601f8201601f19908116603f01168101908382118183101715620002a057620002a0620001b7565b81604052828152896020848701011115620002ba57600080fd5b620002cd836020830160208801620001cd565b80955050505050509250925092565b60008251620002f0818460208701620001cd565b9190910192915050565b6109a2806200030a6000396000f3fe60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146101295780638da5cb5b1461013c578063f2fde38b14610176576100ca565b806301ffc9a7146100d45780633659cfe614610109576100ca565b366100ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f45544845525f52454a454354454400000000000000000000000000000000000060448201526064015b60405180910390fd5b6100d2610196565b005b3480156100e057600080fd5b506100f46100ef366004610806565b6101e1565b60405190151581526020015b60405180910390f35b34801561011557600080fd5b506100d2610124366004610871565b6103af565b6100d261013736600461088c565b610481565b34801561014857600080fd5b5061015161057c565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610100565b34801561018257600080fd5b506100d2610191366004610871565b6105ab565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e8280156101d7578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061027457507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561028157506001919050565b7fffffffff0000000000000000000000000000000000000000000000000000000080831614156102b357506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa92505050801561039b575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092526103989181019061090f565b60015b6103a85750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610465576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e816040518060200160405280600081525061066a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610537576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b6105778383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061066a92505050565b505050565b60006105a67fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610661576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e81610759565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105775760008373ffffffffffffffffffffffffffffffffffffffff16836040516107059190610931565b600060405180830381855af49150503d8060008114610740576040519150601f19603f3d011682016040523d82523d6000602084013e610745565b606091505b50509050806101db573d806000803e806000fd5b60006107837fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60006020828403121561081857600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146103a857600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461086c57600080fd5b919050565b60006020828403121561088357600080fd5b6103a882610848565b6000806000604084860312156108a157600080fd5b6108aa84610848565b9250602084013567ffffffffffffffff808211156108c757600080fd5b818601915086601f8301126108db57600080fd5b8135818111156108ea57600080fd5b8760208285010111156108fc57600080fd5b6020830194508093505050509250925092565b60006020828403121561092157600080fd5b815180151581146103a857600080fd5b6000825160005b818110156109525760208186018101518583015201610938565b81811115610961576000828501525b50919091019291505056fea2646970667358221220e649c37c69d6249070369be01f33af3368fcdcea9814421a048306c2829c125964736f6c634300080a0033b53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
	deployedBytecode:
		'0x60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146101295780638da5cb5b1461013c578063f2fde38b14610176576100ca565b806301ffc9a7146100d45780633659cfe614610109576100ca565b366100ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f45544845525f52454a454354454400000000000000000000000000000000000060448201526064015b60405180910390fd5b6100d2610196565b005b3480156100e057600080fd5b506100f46100ef366004610806565b6101e1565b60405190151581526020015b60405180910390f35b34801561011557600080fd5b506100d2610124366004610871565b6103af565b6100d261013736600461088c565b610481565b34801561014857600080fd5b5061015161057c565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610100565b34801561018257600080fd5b506100d2610191366004610871565b6105ab565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e8280156101d7578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061027457507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561028157506001919050565b7fffffffff0000000000000000000000000000000000000000000000000000000080831614156102b357506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa92505050801561039b575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092526103989181019061090f565b60015b6103a85750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610465576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e816040518060200160405280600081525061066a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610537576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b6105778383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061066a92505050565b505050565b60006105a67fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610661576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e81610759565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105775760008373ffffffffffffffffffffffffffffffffffffffff16836040516107059190610931565b600060405180830381855af49150503d8060008114610740576040519150601f19603f3d011682016040523d82523d6000602084013e610745565b606091505b50509050806101db573d806000803e806000fd5b60006107837fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60006020828403121561081857600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146103a857600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461086c57600080fd5b919050565b60006020828403121561088357600080fd5b6103a882610848565b6000806000604084860312156108a157600080fd5b6108aa84610848565b9250602084013567ffffffffffffffff808211156108c757600080fd5b818601915086601f8301126108db57600080fd5b8135818111156108ea57600080fd5b8760208285010111156108fc57600080fd5b6020830194508093505050509250925092565b60006020828403121561092157600080fd5b815180151581146103a857600080fd5b6000825160005b818110156109525760208186018101518583015201610938565b81811115610961576000828501525b50919091019291505056fea2646970667358221220e649c37c69d6249070369be01f33af3368fcdcea9814421a048306c2829c125964736f6c634300080a0033',
	linkReferences: {},
	deployedLinkReferences: {},
	devdoc: {
		kind: 'dev',
		methods: {},
		version: 1,
	},
	evm: {
		bytecode: {
			functionDebugData: {
				'@_38': {
					entryPoint: null,
					id: 38,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@_owner_154': {
					entryPoint: null,
					id: 154,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_setImplementation_263': {
					entryPoint: 184,
					id: 263,
					parameterSlots: 2,
					returnSlots: 0,
				},
				'@_setOwner_171': {
					entryPoint: 70,
					id: 171,
					parameterSlots: 1,
					returnSlots: 0,
				},
				abi_decode_address_fromMemory: {
					entryPoint: 410,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				abi_decode_tuple_t_addresst_addresst_bytes_memory_ptr_fromMemory: {
					entryPoint: 508,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 732,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				copy_memory_to_memory: {
					entryPoint: 461,
					id: null,
					parameterSlots: 3,
					returnSlots: 0,
				},
				panic_error_0x41: {
					entryPoint: 439,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:1925:3',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:3',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '74:117:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '84:22:3',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '99:6:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '93:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '93:13:3',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '84:5:3',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '169:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '178:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '181:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '171:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '171:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '171:12:3',
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
																src: '128:5:3',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '139:5:3',
																	},
																	{
																		arguments: [
																			{
																				arguments: [
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '154:3:3',
																						type: '',
																						value: '160',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '159:1:3',
																						type: '',
																						value: '1',
																					},
																				],
																				functionName: {
																					name: 'shl',
																					nodeType: 'YulIdentifier',
																					src: '150:3:3',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '150:11:3',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '163:1:3',
																				type: '',
																				value: '1',
																			},
																		],
																		functionName: {
																			name: 'sub',
																			nodeType: 'YulIdentifier',
																			src: '146:3:3',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '146:19:3',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '135:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '135:31:3',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '125:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '125:42:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '118:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '118:50:3',
											},
											nodeType: 'YulIf',
											src: '115:70:3',
										},
									],
								},
								name: 'abi_decode_address_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '53:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '64:5:3',
										type: '',
									},
								],
								src: '14:177:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '228:95:3',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '245:1:3',
														type: '',
														value: '0',
													},
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '252:3:3',
																type: '',
																value: '224',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '257:10:3',
																type: '',
																value: '0x4e487b71',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '248:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '248:20:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '238:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '238:31:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '238:31:3',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '285:1:3',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '288:4:3',
														type: '',
														value: '0x41',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '278:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '278:15:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '278:15:3',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '309:1:3',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '312:4:3',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '302:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '302:15:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '302:15:3',
										},
									],
								},
								name: 'panic_error_0x41',
								nodeType: 'YulFunctionDefinition',
								src: '196:127:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '381:205:3',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '391:10:3',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '400:1:3',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '395:1:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '460:63:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '485:3:3',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '490:1:3',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '481:3:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '481:11:3',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'src',
																					nodeType: 'YulIdentifier',
																					src: '504:3:3',
																				},
																				{
																					name: 'i',
																					nodeType: 'YulIdentifier',
																					src: '509:1:3',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '500:3:3',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '500:11:3',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '494:5:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '494:18:3',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '474:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '474:39:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '474:39:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '421:1:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '424:6:3',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '418:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '418:13:3',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '432:19:3',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '434:15:3',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '443:1:3',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '446:2:3',
																	type: '',
																	value: '32',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '439:3:3',
															},
															nodeType: 'YulFunctionCall',
															src: '439:10:3',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '434:1:3',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '414:3:3',
												statements: [],
											},
											src: '410:113:3',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '549:31:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '562:3:3',
																		},
																		{
																			name: 'length',
																			nodeType: 'YulIdentifier',
																			src: '567:6:3',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '558:3:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '558:16:3',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '576:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '551:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '551:27:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '551:27:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '538:1:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '541:6:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '535:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '535:13:3',
											},
											nodeType: 'YulIf',
											src: '532:48:3',
										},
									],
								},
								name: 'copy_memory_to_memory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'src',
										nodeType: 'YulTypedName',
										src: '359:3:3',
										type: '',
									},
									{
										name: 'dst',
										nodeType: 'YulTypedName',
										src: '364:3:3',
										type: '',
									},
									{
										name: 'length',
										nodeType: 'YulTypedName',
										src: '369:6:3',
										type: '',
									},
								],
								src: '328:258:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '715:929:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '761:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '770:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '773:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '763:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '763:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '763:12:3',
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
																src: '736:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '745:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '732:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '732:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '757:2:3',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '728:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '728:32:3',
											},
											nodeType: 'YulIf',
											src: '725:52:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '786:50:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '826:9:3',
													},
												],
												functionName: {
													name: 'abi_decode_address_fromMemory',
													nodeType: 'YulIdentifier',
													src: '796:29:3',
												},
												nodeType: 'YulFunctionCall',
												src: '796:40:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '786:6:3',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '845:59:3',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '889:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '900:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '885:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '885:18:3',
													},
												],
												functionName: {
													name: 'abi_decode_address_fromMemory',
													nodeType: 'YulIdentifier',
													src: '855:29:3',
												},
												nodeType: 'YulFunctionCall',
												src: '855:49:3',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '845:6:3',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '913:39:3',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '937:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '948:2:3',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '933:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '933:18:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '927:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '927:25:3',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '917:6:3',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '961:28:3',
											value: {
												arguments: [
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '979:2:3',
																type: '',
																value: '64',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '983:1:3',
																type: '',
																value: '1',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '975:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '975:10:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '987:1:3',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'sub',
													nodeType: 'YulIdentifier',
													src: '971:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '971:18:3',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '965:2:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1016:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1025:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1028:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1018:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1018:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1018:12:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1004:6:3',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1012:2:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1001:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1001:14:3',
											},
											nodeType: 'YulIf',
											src: '998:34:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1041:32:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1055:9:3',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1066:6:3',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1051:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1051:22:3',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1045:2:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1121:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1130:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1133:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1123:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1123:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1123:12:3',
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
																		src: '1100:2:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1104:4:3',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1096:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1096:13:3',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '1111:7:3',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '1092:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1092:27:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1085:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1085:35:3',
											},
											nodeType: 'YulIf',
											src: '1082:55:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1146:19:3',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1162:2:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1156:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1156:9:3',
											},
											variables: [
												{
													name: '_3',
													nodeType: 'YulTypedName',
													src: '1150:2:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1188:22:3',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1190:16:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1190:18:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1190:18:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1180:2:3',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1184:2:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1177:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1177:10:3',
											},
											nodeType: 'YulIf',
											src: '1174:36:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1219:17:3',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1233:2:3',
														type: '',
														value: '31',
													},
												],
												functionName: {
													name: 'not',
													nodeType: 'YulIdentifier',
													src: '1229:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1229:7:3',
											},
											variables: [
												{
													name: '_4',
													nodeType: 'YulTypedName',
													src: '1223:2:3',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1245:23:3',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1265:2:3',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1259:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1259:9:3',
											},
											variables: [
												{
													name: 'memPtr',
													nodeType: 'YulTypedName',
													src: '1249:6:3',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1277:71:3',
											value: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1299:6:3',
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
																						src: '1323:2:3',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '1327:4:3',
																						type: '',
																						value: '0x1f',
																					},
																				],
																				functionName: {
																					name: 'add',
																					nodeType: 'YulIdentifier',
																					src: '1319:3:3',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '1319:13:3',
																			},
																			{
																				name: '_4',
																				nodeType: 'YulIdentifier',
																				src: '1334:2:3',
																			},
																		],
																		functionName: {
																			name: 'and',
																			nodeType: 'YulIdentifier',
																			src: '1315:3:3',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '1315:22:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1339:2:3',
																		type: '',
																		value: '63',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1311:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1311:31:3',
															},
															{
																name: '_4',
																nodeType: 'YulIdentifier',
																src: '1344:2:3',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1307:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1307:40:3',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1295:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1295:53:3',
											},
											variables: [
												{
													name: 'newFreePtr',
													nodeType: 'YulTypedName',
													src: '1281:10:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1407:22:3',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1409:16:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1409:18:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1409:18:3',
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
																src: '1366:10:3',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '1378:2:3',
															},
														],
														functionName: {
															name: 'gt',
															nodeType: 'YulIdentifier',
															src: '1363:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1363:18:3',
													},
													{
														arguments: [
															{
																name: 'newFreePtr',
																nodeType: 'YulIdentifier',
																src: '1386:10:3',
															},
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1398:6:3',
															},
														],
														functionName: {
															name: 'lt',
															nodeType: 'YulIdentifier',
															src: '1383:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1383:22:3',
													},
												],
												functionName: {
													name: 'or',
													nodeType: 'YulIdentifier',
													src: '1360:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1360:46:3',
											},
											nodeType: 'YulIf',
											src: '1357:72:3',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1445:2:3',
														type: '',
														value: '64',
													},
													{
														name: 'newFreePtr',
														nodeType: 'YulIdentifier',
														src: '1449:10:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1438:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1438:22:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '1438:22:3',
										},
										{
											expression: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1476:6:3',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1484:2:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1469:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1469:18:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '1469:18:3',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1533:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1542:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1545:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1535:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1535:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1535:12:3',
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
																		src: '1510:2:3',
																	},
																	{
																		name: '_3',
																		nodeType: 'YulIdentifier',
																		src: '1514:2:3',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1506:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1506:11:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1519:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1502:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1502:20:3',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1524:7:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1499:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1499:33:3',
											},
											nodeType: 'YulIf',
											src: '1496:53:3',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: '_2',
																nodeType: 'YulIdentifier',
																src: '1584:2:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1588:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1580:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1580:11:3',
													},
													{
														arguments: [
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1597:6:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1605:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1593:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1593:15:3',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1610:2:3',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '1558:21:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1558:55:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '1558:55:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '1622:16:3',
											value: {
												name: 'memPtr',
												nodeType: 'YulIdentifier',
												src: '1632:6:3',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1622:6:3',
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
										src: '665:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '676:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '688:6:3',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '696:6:3',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '704:6:3',
										type: '',
									},
								],
								src: '591:1053:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1786:137:3',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '1796:27:3',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '1816:6:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1810:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1810:13:3',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1800:6:3',
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
																src: '1858:6:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1866:4:3',
																type: '',
																value: '0x20',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1854:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1854:17:3',
													},
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '1873:3:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1878:6:3',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '1832:21:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1832:53:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '1832:53:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '1894:23:3',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '1905:3:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1910:6:3',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1901:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1901:16:3',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '1894:3:3',
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
										src: '1762:3:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1767:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '1778:3:3',
										type: '',
									},
								],
								src: '1649:274:3',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_address_fromMemory(offset) -> value\n    {\n        value := mload(offset)\n        if iszero(eq(value, and(value, sub(shl(160, 1), 1)))) { revert(0, 0) }\n    }\n    function panic_error_0x41()\n    {\n        mstore(0, shl(224, 0x4e487b71))\n        mstore(4, 0x41)\n        revert(0, 0x24)\n    }\n    function copy_memory_to_memory(src, dst, length)\n    {\n        let i := 0\n        for { } lt(i, length) { i := add(i, 32) }\n        {\n            mstore(add(dst, i), mload(add(src, i)))\n        }\n        if gt(i, length) { mstore(add(dst, length), 0) }\n    }\n    function abi_decode_tuple_t_addresst_addresst_bytes_memory_ptr_fromMemory(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 96) { revert(0, 0) }\n        value0 := abi_decode_address_fromMemory(headStart)\n        value1 := abi_decode_address_fromMemory(add(headStart, 32))\n        let offset := mload(add(headStart, 64))\n        let _1 := sub(shl(64, 1), 1)\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let _3 := mload(_2)\n        if gt(_3, _1) { panic_error_0x41() }\n        let _4 := not(31)\n        let memPtr := mload(64)\n        let newFreePtr := add(memPtr, and(add(and(add(_3, 0x1f), _4), 63), _4))\n        if or(gt(newFreePtr, _1), lt(newFreePtr, memPtr)) { panic_error_0x41() }\n        mstore(64, newFreePtr)\n        mstore(memPtr, _3)\n        if gt(add(add(_2, _3), 32), dataEnd) { revert(0, 0) }\n        copy_memory_to_memory(add(_2, 32), add(memPtr, 32), _3)\n        value2 := memPtr\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        copy_memory_to_memory(add(value0, 0x20), pos, length)\n        end := add(pos, length)\n    }\n}',
					id: 3,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH3 0xCCC CODESIZE SUB DUP1 PUSH3 0xCCC DUP4 CODECOPY DUP2 ADD PUSH1 0x40 DUP2 SWAP1 MSTORE PUSH3 0x26 SWAP2 PUSH3 0x1FC JUMP JUMPDEST PUSH3 0x31 DUP3 PUSH3 0x46 JUMP JUMPDEST PUSH3 0x3D DUP4 DUP3 PUSH3 0xB8 JUMP JUMPDEST POP POP POP PUSH3 0x2FA JUMP JUMPDEST PUSH1 0x0 PUSH3 0x60 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xCAC DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xCAC DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SSTORE DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH3 0x195 JUMPI PUSH1 0x0 DUP4 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP4 PUSH1 0x40 MLOAD PUSH3 0x13C SWAP2 SWAP1 PUSH3 0x2DC JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH3 0x179 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH3 0x17E JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH3 0x193 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST POP JUMPDEST POP POP POP JUMP JUMPDEST DUP1 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP2 AND DUP2 EQ PUSH3 0x1B2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH3 0x1EA JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH3 0x1D0 JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH3 0x193 JUMPI POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x60 DUP5 DUP7 SUB SLT ISZERO PUSH3 0x212 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x21D DUP5 PUSH3 0x19A JUMP JUMPDEST SWAP3 POP PUSH3 0x22D PUSH1 0x20 DUP6 ADD PUSH3 0x19A JUMP JUMPDEST PUSH1 0x40 DUP6 ADD MLOAD SWAP1 SWAP3 POP PUSH1 0x1 PUSH1 0x1 PUSH1 0x40 SHL SUB DUP1 DUP3 GT ISZERO PUSH3 0x24B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH3 0x260 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP2 DUP2 GT ISZERO PUSH3 0x275 JUMPI PUSH3 0x275 PUSH3 0x1B7 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH1 0x1F NOT SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH3 0x2A0 JUMPI PUSH3 0x2A0 PUSH3 0x1B7 JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP10 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH3 0x2BA JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x2CD DUP4 PUSH1 0x20 DUP4 ADD PUSH1 0x20 DUP9 ADD PUSH3 0x1CD JUMP JUMPDEST DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH3 0x2F0 DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH3 0x1CD JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH2 0x9A2 DUP1 PUSH3 0x30A PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0x129 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x13C JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x176 JUMPI PUSH2 0xCA JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0xD4 JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0x109 JUMPI PUSH2 0xCA JUMP JUMPDEST CALLDATASIZE PUSH2 0xCA JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x45544845525F52454A4543544544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0xD2 PUSH2 0x196 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xF4 PUSH2 0xEF CALLDATASIZE PUSH1 0x4 PUSH2 0x806 JUMP JUMPDEST PUSH2 0x1E1 JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x115 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x124 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x3AF JUMP JUMPDEST PUSH2 0xD2 PUSH2 0x137 CALLDATASIZE PUSH1 0x4 PUSH2 0x88C JUMP JUMPDEST PUSH2 0x481 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x148 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x151 PUSH2 0x57C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x100 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x182 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x191 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x5AB JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x1D7 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x274 JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x281 JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND EQ ISZERO PUSH2 0x2B3 JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x39B JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x398 SWAP2 DUP2 ADD SWAP1 PUSH2 0x90F JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x3A8 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x465 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x66A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x537 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x577 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x66A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x5A6 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x661 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH2 0x759 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x577 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x705 SWAP2 SWAP1 PUSH2 0x931 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x740 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x745 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x1DB JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x783 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x818 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x86C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x883 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x3A8 DUP3 PUSH2 0x848 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x8A1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x8AA DUP5 PUSH2 0x848 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x8C7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x8DB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x8EA JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x8FC JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x921 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x952 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x938 JUMP JUMPDEST DUP2 DUP2 GT ISZERO PUSH2 0x961 JUMPI PUSH1 0x0 DUP3 DUP6 ADD MSTORE JUMPDEST POP SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xE6 0x49 0xC3 PUSH29 0x69D6249070369BE01F33AF3368FCDCEA9814421A048306C2829C125964 PUSH20 0x6F6C634300080A0033B53127684A568B3173AE13 0xB9 0xF8 0xA6 ADD PUSH15 0x243E63B6E8EE1178D6A717850B5D61 SUB ',
			sourceMap:
				'236:3020:0:-:0;;;591:219;;;;;;;;;;;;;;;;;;:::i;:::-;723:23;733:12;723:9;:23::i;:::-;756:47;775:21;798:4;756:18;:47::i;:::-;591:219;;;236:3020;;2908:346;2964:21;2988:8;-1:-1:-1;;;;;;;;;;;2813:73:0;;2636:266;2988:8;2964:32;;3169:8;-1:-1:-1;;;;;;;;;;;3094:84:0;3238:8;-1:-1:-1;;;;;3202:45:0;3223:13;-1:-1:-1;;;;;3202:45:0;;;;;;;;;;;2954:300;2908:346;:::o;1377:1068:2:-;1630:66;1624:73;;1805:93;;;;1923:69;;-1:-1:-1;;;;;1923:69:2;;;;;;;;;;1470:30;;1923:69;2007:11;;:15;2003:436;;2039:12;2057:17;-1:-1:-1;;;;;2057:30:2;2088:4;2057:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2038:55;;;2112:7;2107:322;;2278:16;2336:14;2333:1;;2315:36;2382:14;2333:1;2372:25;2107:322;2024:415;2003:436;1460:985;1377:1068;;:::o;14:177:3:-;93:13;;-1:-1:-1;;;;;135:31:3;;125:42;;115:70;;181:1;178;171:12;115:70;14:177;;;:::o;196:127::-;257:10;252:3;248:20;245:1;238:31;288:4;285:1;278:15;312:4;309:1;302:15;328:258;400:1;410:113;424:6;421:1;418:13;410:113;;;500:11;;;494:18;481:11;;;474:39;446:2;439:10;410:113;;;541:6;538:1;535:13;532:48;;;-1:-1:-1;;576:1:3;558:16;;551:27;328:258::o;591:1053::-;688:6;696;704;757:2;745:9;736:7;732:23;728:32;725:52;;;773:1;770;763:12;725:52;796:40;826:9;796:40;:::i;:::-;786:50;;855:49;900:2;889:9;885:18;855:49;:::i;:::-;948:2;933:18;;927:25;845:59;;-1:-1:-1;;;;;;1001:14:3;;;998:34;;;1028:1;1025;1018:12;998:34;1066:6;1055:9;1051:22;1041:32;;1111:7;1104:4;1100:2;1096:13;1092:27;1082:55;;1133:1;1130;1123:12;1082:55;1162:2;1156:9;1184:2;1180;1177:10;1174:36;;;1190:18;;:::i;:::-;1265:2;1259:9;1233:2;1319:13;;-1:-1:-1;;1315:22:3;;;1339:2;1311:31;1307:40;1295:53;;;1363:18;;;1383:22;;;1360:46;1357:72;;;1409:18;;:::i;:::-;1449:10;1445:2;1438:22;1484:2;1476:6;1469:18;1524:7;1519:2;1514;1510;1506:11;1502:20;1499:33;1496:53;;;1545:1;1542;1535:12;1496:53;1558:55;1610:2;1605;1597:6;1593:15;1588:2;1584;1580:11;1558:55;:::i;:::-;1632:6;1622:16;;;;;;;591:1053;;;;;:::o;1649:274::-;1778:3;1816:6;1810:13;1832:53;1878:6;1873:3;1866:4;1858:6;1854:17;1832:53;:::i;:::-;1901:16;;;;;1649:274;-1:-1:-1;;1649:274:3:o;:::-;236:3020:0;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@_215': {
					entryPoint: null,
					id: 215,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_222': {
					entryPoint: null,
					id: 222,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_fallback_227': {
					entryPoint: 406,
					id: 227,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_owner_154': {
					entryPoint: null,
					id: 154,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_setImplementation_263': {
					entryPoint: 1642,
					id: 263,
					parameterSlots: 2,
					returnSlots: 0,
				},
				'@_setOwner_171': {
					entryPoint: 1881,
					id: 171,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@owner_47': {
					entryPoint: 1404,
					id: 47,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@supportsInterface_94': {
					entryPoint: 481,
					id: 94,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@transferOwnership_106': {
					entryPoint: 1451,
					id: 106,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@upgradeToAndCall_134': {
					entryPoint: 1153,
					id: 134,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@upgradeTo_119': {
					entryPoint: 943,
					id: 119,
					parameterSlots: 1,
					returnSlots: 0,
				},
				abi_decode_address: {
					entryPoint: 2120,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				abi_decode_tuple_t_address: {
					entryPoint: 2161,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_addresst_bytes_calldata_ptr: {
					entryPoint: 2188,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_decode_tuple_t_bool_fromMemory: {
					entryPoint: 2319,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_bytes4: {
					entryPoint: 2054,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 2353,
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
				abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed: {
					entryPoint: null,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed: {
					entryPoint: null,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_stringliteral_e7e213d5e2bee0acc2c7bf8bfda19ef0cae82e7b8c997e7e898919269971e7c4__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				abi_encode_tuple_t_stringliteral_ef8a4c3fcfbfa959f184421d0ef9a577b18116cafbc5879aff4e2f1881c7c1f0__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:3485:3',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:3',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '188:164:3',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '205:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '216:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '198:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '198:21:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '198:21:3',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '239:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '250:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '235:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '235:18:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '255:2:3',
														type: '',
														value: '14',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '228:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '228:30:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '228:30:3',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '278:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '289:2:3',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '274:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '274:18:3',
													},
													{
														hexValue: '45544845525f52454a4543544544',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '294:16:3',
														type: '',
														value: 'ETHER_REJECTED',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '267:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '267:44:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '267:44:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '320:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '332:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '343:2:3',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '328:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '328:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '320:4:3',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_ef8a4c3fcfbfa959f184421d0ef9a577b18116cafbc5879aff4e2f1881c7c1f0__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '165:9:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '179:4:3',
										type: '',
									},
								],
								src: '14:338:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '426:263:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '472:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '481:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '484:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '474:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '474:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '474:12:3',
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
																src: '447:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '456:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '443:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '443:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '468:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '439:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '439:32:3',
											},
											nodeType: 'YulIf',
											src: '436:52:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '497:36:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '523:9:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '510:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '510:23:3',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '501:5:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '643:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '652:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '655:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '645:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '645:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '645:12:3',
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
																src: '555:5:3',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '566:5:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '573:66:3',
																		type: '',
																		value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '562:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '562:78:3',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '552:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '552:89:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '545:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '545:97:3',
											},
											nodeType: 'YulIf',
											src: '542:117:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '668:15:3',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '678:5:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '668:6:3',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_bytes4',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '392:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '403:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '415:6:3',
										type: '',
									},
								],
								src: '357:332:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '789:92:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '799:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '811:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '822:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '807:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '807:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '799:4:3',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '841:9:3',
													},
													{
														arguments: [
															{
																arguments: [
																	{
																		name: 'value0',
																		nodeType: 'YulIdentifier',
																		src: '866:6:3',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '859:6:3',
																},
																nodeType: 'YulFunctionCall',
																src: '859:14:3',
															},
														],
														functionName: {
															name: 'iszero',
															nodeType: 'YulIdentifier',
															src: '852:6:3',
														},
														nodeType: 'YulFunctionCall',
														src: '852:22:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '834:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '834:41:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '834:41:3',
										},
									],
								},
								name: 'abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '758:9:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '769:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '780:4:3',
										type: '',
									},
								],
								src: '694:187:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '935:147:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '945:29:3',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '967:6:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '954:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '954:20:3',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '945:5:3',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1060:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1069:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1072:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1062:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1062:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1062:12:3',
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
																src: '996:5:3',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '1007:5:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1014:42:3',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '1003:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1003:54:3',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '993:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '993:65:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '986:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '986:73:3',
											},
											nodeType: 'YulIf',
											src: '983:93:3',
										},
									],
								},
								name: 'abi_decode_address',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '914:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '925:5:3',
										type: '',
									},
								],
								src: '886:196:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1157:116:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1203:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1212:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1215:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1205:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1205:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1205:12:3',
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
																src: '1178:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1187:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1174:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1174:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1199:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1170:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1170:32:3',
											},
											nodeType: 'YulIf',
											src: '1167:52:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '1228:39:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1257:9:3',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '1238:18:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1238:29:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1228:6:3',
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
										src: '1123:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1134:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1146:6:3',
										type: '',
									},
								],
								src: '1087:186:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1384:559:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1430:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1439:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1442:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1432:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1432:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1432:12:3',
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
																src: '1405:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1414:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1401:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1401:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1426:2:3',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1397:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1397:32:3',
											},
											nodeType: 'YulIf',
											src: '1394:52:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '1455:39:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1484:9:3',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '1465:18:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1465:29:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1455:6:3',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1503:46:3',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1534:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1545:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1530:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1530:18:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1517:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1517:32:3',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '1507:6:3',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1558:28:3',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1568:18:3',
												type: '',
												value: '0xffffffffffffffff',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1562:2:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1613:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1622:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1625:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1615:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1615:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1615:12:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1601:6:3',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1609:2:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1598:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1598:14:3',
											},
											nodeType: 'YulIf',
											src: '1595:34:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1638:32:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1652:9:3',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1663:6:3',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1648:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1648:22:3',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1642:2:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1718:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1727:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1730:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1720:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1720:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1720:12:3',
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
																		src: '1697:2:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1701:4:3',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1693:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1693:13:3',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '1708:7:3',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '1689:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1689:27:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1682:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1682:35:3',
											},
											nodeType: 'YulIf',
											src: '1679:55:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1743:30:3',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1770:2:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1757:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1757:16:3',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1747:6:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1800:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1809:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1812:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1802:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1802:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1802:12:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1788:6:3',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1796:2:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1785:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1785:14:3',
											},
											nodeType: 'YulIf',
											src: '1782:34:3',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1866:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1875:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1878:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1868:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1868:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1868:12:3',
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
																		src: '1839:2:3',
																	},
																	{
																		name: 'length',
																		nodeType: 'YulIdentifier',
																		src: '1843:6:3',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1835:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1835:15:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1852:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1831:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1831:24:3',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1857:7:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1828:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1828:37:3',
											},
											nodeType: 'YulIf',
											src: '1825:57:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '1891:21:3',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1905:2:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1909:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1901:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1901:11:3',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1891:6:3',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1921:16:3',
											value: {
												name: 'length',
												nodeType: 'YulIdentifier',
												src: '1931:6:3',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1921:6:3',
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
										src: '1334:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1345:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1357:6:3',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '1365:6:3',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '1373:6:3',
										type: '',
									},
								],
								src: '1278:665:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2049:125:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '2059:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2071:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2082:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2067:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2067:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2059:4:3',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2101:9:3',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2116:6:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2124:42:3',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '2112:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2112:55:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2094:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2094:74:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2094:74:3',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2018:9:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2029:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2040:4:3',
										type: '',
									},
								],
								src: '1948:226:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2278:149:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '2288:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2300:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2311:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2296:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2296:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2288:4:3',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2330:9:3',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2345:6:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2353:66:3',
																type: '',
																value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '2341:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2341:79:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2323:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2323:98:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2323:98:3',
										},
									],
								},
								name: 'abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2247:9:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2258:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2269:4:3',
										type: '',
									},
								],
								src: '2179:248:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2510:199:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '2556:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2565:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2568:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2558:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '2558:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '2558:12:3',
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
																src: '2531:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2540:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '2527:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2527:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2552:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '2523:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2523:32:3',
											},
											nodeType: 'YulIf',
											src: '2520:52:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2581:29:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2600:9:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2594:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2594:16:3',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '2585:5:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2663:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2672:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2675:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2665:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '2665:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '2665:12:3',
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
																src: '2632:5:3',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'value',
																				nodeType: 'YulIdentifier',
																				src: '2653:5:3',
																			},
																		],
																		functionName: {
																			name: 'iszero',
																			nodeType: 'YulIdentifier',
																			src: '2646:6:3',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '2646:13:3',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '2639:6:3',
																},
																nodeType: 'YulFunctionCall',
																src: '2639:21:3',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '2629:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2629:32:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '2622:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2622:40:3',
											},
											nodeType: 'YulIf',
											src: '2619:60:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '2688:15:3',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '2698:5:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '2688:6:3',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_bool_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2476:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2487:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2499:6:3',
										type: '',
									},
								],
								src: '2432:277:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2888:164:3',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2905:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2916:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2898:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2898:21:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2898:21:3',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2939:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2950:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2935:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2935:18:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2955:2:3',
														type: '',
														value: '14',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2928:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2928:30:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2928:30:3',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2978:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2989:2:3',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2974:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2974:18:3',
													},
													{
														hexValue: '4e4f545f415554484f52495a4544',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2994:16:3',
														type: '',
														value: 'NOT_AUTHORIZED',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2967:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2967:44:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2967:44:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '3020:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3032:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3043:2:3',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3028:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '3028:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3020:4:3',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_e7e213d5e2bee0acc2c7bf8bfda19ef0cae82e7b8c997e7e898919269971e7c4__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2865:9:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2879:4:3',
										type: '',
									},
								],
								src: '2714:338:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3194:289:3',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '3204:27:3',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '3224:6:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '3218:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '3218:13:3',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '3208:6:3',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3240:10:3',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '3249:1:3',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '3244:1:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '3311:77:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'pos',
																			nodeType: 'YulIdentifier',
																			src: '3336:3:3',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '3341:1:3',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '3332:3:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3332:11:3',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					arguments: [
																						{
																							name: 'value0',
																							nodeType: 'YulIdentifier',
																							src: '3359:6:3',
																						},
																						{
																							name: 'i',
																							nodeType: 'YulIdentifier',
																							src: '3367:1:3',
																						},
																					],
																					functionName: {
																						name: 'add',
																						nodeType: 'YulIdentifier',
																						src: '3355:3:3',
																					},
																					nodeType: 'YulFunctionCall',
																					src: '3355:14:3',
																				},
																				{
																					kind: 'number',
																					nodeType: 'YulLiteral',
																					src: '3371:4:3',
																					type: '',
																					value: '0x20',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '3351:3:3',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '3351:25:3',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '3345:5:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3345:32:3',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '3325:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '3325:53:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '3325:53:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '3270:1:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3273:6:3',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '3267:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '3267:13:3',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '3281:21:3',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '3283:17:3',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '3292:1:3',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3295:4:3',
																	type: '',
																	value: '0x20',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '3288:3:3',
															},
															nodeType: 'YulFunctionCall',
															src: '3288:12:3',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '3283:1:3',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '3263:3:3',
												statements: [],
											},
											src: '3259:129:3',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '3414:31:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'pos',
																			nodeType: 'YulIdentifier',
																			src: '3427:3:3',
																		},
																		{
																			name: 'length',
																			nodeType: 'YulIdentifier',
																			src: '3432:6:3',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '3423:3:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3423:16:3',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3441:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '3416:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '3416:27:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '3416:27:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '3403:1:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3406:6:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '3400:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '3400:13:3',
											},
											nodeType: 'YulIf',
											src: '3397:48:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '3454:23:3',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3465:3:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3470:6:3',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3461:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '3461:16:3',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '3454:3:3',
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
										src: '3170:3:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3175:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '3186:3:3',
										type: '',
									},
								],
								src: '3057:426:3',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_encode_tuple_t_stringliteral_ef8a4c3fcfbfa959f184421d0ef9a577b18116cafbc5879aff4e2f1881c7c1f0__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 14)\n        mstore(add(headStart, 64), "ETHER_REJECTED")\n        tail := add(headStart, 96)\n    }\n    function abi_decode_tuple_t_bytes4(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffff00000000000000000000000000000000000000000000000000000000))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, iszero(iszero(value0)))\n    }\n    function abi_decode_address(offset) -> value\n    {\n        value := calldataload(offset)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n    }\n    function abi_decode_tuple_t_addresst_bytes_calldata_ptr(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n        let offset := calldataload(add(headStart, 32))\n        let _1 := 0xffffffffffffffff\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let length := calldataload(_2)\n        if gt(length, _1) { revert(0, 0) }\n        if gt(add(add(_2, length), 32), dataEnd) { revert(0, 0) }\n        value1 := add(_2, 32)\n        value2 := length\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffff00000000000000000000000000000000000000000000000000000000))\n    }\n    function abi_decode_tuple_t_bool_fromMemory(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := mload(headStart)\n        if iszero(eq(value, iszero(iszero(value)))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_stringliteral_e7e213d5e2bee0acc2c7bf8bfda19ef0cae82e7b8c997e7e898919269971e7c4__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 14)\n        mstore(add(headStart, 64), "NOT_AUTHORIZED")\n        tail := add(headStart, 96)\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 0x20) }\n        {\n            mstore(add(pos, i), mload(add(add(value0, i), 0x20)))\n        }\n        if gt(i, length) { mstore(add(pos, length), 0) }\n        end := add(pos, length)\n    }\n}',
					id: 3,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0x129 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x13C JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x176 JUMPI PUSH2 0xCA JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0xD4 JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0x109 JUMPI PUSH2 0xCA JUMP JUMPDEST CALLDATASIZE PUSH2 0xCA JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x45544845525F52454A4543544544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0xD2 PUSH2 0x196 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xF4 PUSH2 0xEF CALLDATASIZE PUSH1 0x4 PUSH2 0x806 JUMP JUMPDEST PUSH2 0x1E1 JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x115 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x124 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x3AF JUMP JUMPDEST PUSH2 0xD2 PUSH2 0x137 CALLDATASIZE PUSH1 0x4 PUSH2 0x88C JUMP JUMPDEST PUSH2 0x481 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x148 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x151 PUSH2 0x57C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x100 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x182 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x191 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x5AB JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x1D7 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x274 JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x281 JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND EQ ISZERO PUSH2 0x2B3 JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x39B JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x398 SWAP2 DUP2 ADD SWAP1 PUSH2 0x90F JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x3A8 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x465 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x66A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x537 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x577 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x66A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x5A6 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x661 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH2 0x759 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x577 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x705 SWAP2 SWAP1 PUSH2 0x931 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x740 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x745 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x1DB JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x783 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x818 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x86C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x883 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x3A8 DUP3 PUSH2 0x848 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x8A1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x8AA DUP5 PUSH2 0x848 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x8C7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x8DB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x8EA JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x8FC JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x921 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x952 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x938 JUMP JUMPDEST DUP2 DUP2 GT ISZERO PUSH2 0x961 JUMPI PUSH1 0x0 DUP3 DUP6 ADD MSTORE JUMPDEST POP SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xE6 0x49 0xC3 PUSH29 0x69D6249070369BE01F33AF3368FCDCEA9814421A048306C2829C125964 PUSH20 0x6F6C634300080A00330000000000000000000000 ',
			sourceMap:
				'236:3020:0:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;488:24:2;;;;;216:2:3;488:24:2;;;198:21:3;255:2;235:18;;;228:30;294:16;274:18;;;267:44;328:18;;488:24:2;;;;;;;;236:3020:0;593:11:2;:9;:11::i;:::-;236:3020:0;1018:877;;;;;;;;;;-1:-1:-1;1018:877:0;;;;;:::i;:::-;;:::i;:::-;;;859:14:3;;852:22;834:41;;822:2;807:18;1018:877:0;;;;;;;;2007:123;;;;;;;;;;-1:-1:-1;2007:123:0;;;;;:::i;:::-;;:::i;2136:161::-;;;;;;:::i;:::-;;:::i;931:81::-;;;;;;;;;;;;;:::i;:::-;;;2124:42:3;2112:55;;;2094:74;;2082:2;2067:18;931:81:0;1948:226:3;1901:100:0;;;;;;;;;;-1:-1:-1;1901:100:0;;;;;:::i;:::-;;:::i;731:640:2:-;894:66;888:73;992:3;997:14;992:3;;974:38;992:3;;997:14;992:3;1060:21;1053:5;1040:69;1025:84;;1135:16;1185:5;992:3;;1164:27;1211:7;1231:55;;;;1335:5;992:3;1325:16;1231:55;1266:5;992:3;1256:16;1204:151;;;;;731:640::o;1018:877:0:-;1079:4;1099:16;;;;;;:36;;-1:-1:-1;1119:16:0;;;;;1099:36;1095:78;;;-1:-1:-1;1158:4:0;;1018:877;-1:-1:-1;1018:877:0:o;1095:78::-;1186:16;;;;;1182:59;;;-1:-1:-1;1225:5:0;;1018:877;-1:-1:-1;1018:877:0:o;1182:59::-;1394:66;1388:73;1746:36;;;;;2353:66:3;2341:79;;1746:36:0;;;2323:98:3;1746:32:0;;;;;;2296:18:3;;1746:36:0;;;;;;;;;;;;;;;;;;-1:-1:-1;1746:36:0;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;1742:147;;-1:-1:-1;1873:5:0;;1018:877;-1:-1:-1;;1018:877:0:o;1742:147::-;1827:7;1018:877;-1:-1:-1;;;1018:877:0:o;2007:123::-;2819:66;2813:73;2457:22;;:10;:22;;;2449:49;;;;;;;2916:2:3;2449:49:0;;;2898:21:3;2955:2;2935:18;;;2928:30;2994:16;2974:18;;;2967:44;3028:18;;2449:49:0;2714:338:3;2449:49:0;2082:41:::1;2101:17;2082:41;;;;;;;;;;;::::0;:18:::1;:41::i;:::-;2007:123:::0;:::o;2136:161::-;2819:66;2813:73;2457:22;;:10;:22;;;2449:49;;;;;;;2916:2:3;2449:49:0;;;2898:21:3;2955:2;2935:18;;;2928:30;2994:16;2974:18;;;2967:44;3028:18;;2449:49:0;2714:338:3;2449:49:0;2247:43:::1;2266:17;2285:4;;2247:43;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::0;::::1;::::0;;;;-1:-1:-1;2247:18:0::1;::::0;-1:-1:-1;;;2247:43:0:i:1;:::-;2136:161:::0;;;:::o;931:81::-;971:7;997:8;2819:66;2813:73;;2636:266;997:8;990:15;;931:81;:::o;1901:100::-;2819:66;2813:73;2457:22;;:10;:22;;;2449:49;;;;;;;2916:2:3;2449:49:0;;;2898:21:3;2955:2;2935:18;;;2928:30;2994:16;2974:18;;;2967:44;3028:18;;2449:49:0;2714:338:3;2449:49:0;1975:19:::1;1985:8;1975:9;:19::i;1377:1068:2:-:0;1630:66;1624:73;;1805:93;;;;1923:69;;;;;;;;;;;;;1470:30;;1923:69;2007:11;;:15;2003:436;;2039:12;2057:17;:30;;2088:4;2057:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2038:55;;;2112:7;2107:322;;2278:16;2336:14;2333:1;;2315:36;2382:14;2333:1;2372:25;2908:346:0;2964:21;2988:8;2819:66;2813:73;;2636:266;2988:8;2964:32;;3169:8;3101:66;3094:84;3238:8;3202:45;;3223:13;3202:45;;;;;;;;;;;;2954:300;2908:346;:::o;357:332:3:-;415:6;468:2;456:9;447:7;443:23;439:32;436:52;;;484:1;481;474:12;436:52;523:9;510:23;573:66;566:5;562:78;555:5;552:89;542:117;;655:1;652;645:12;886:196;954:20;;1014:42;1003:54;;993:65;;983:93;;1072:1;1069;1062:12;983:93;886:196;;;:::o;1087:186::-;1146:6;1199:2;1187:9;1178:7;1174:23;1170:32;1167:52;;;1215:1;1212;1205:12;1167:52;1238:29;1257:9;1238:29;:::i;1278:665::-;1357:6;1365;1373;1426:2;1414:9;1405:7;1401:23;1397:32;1394:52;;;1442:1;1439;1432:12;1394:52;1465:29;1484:9;1465:29;:::i;:::-;1455:39;;1545:2;1534:9;1530:18;1517:32;1568:18;1609:2;1601:6;1598:14;1595:34;;;1625:1;1622;1615:12;1595:34;1663:6;1652:9;1648:22;1638:32;;1708:7;1701:4;1697:2;1693:13;1689:27;1679:55;;1730:1;1727;1720:12;1679:55;1770:2;1757:16;1796:2;1788:6;1785:14;1782:34;;;1812:1;1809;1802:12;1782:34;1857:7;1852:2;1843:6;1839:2;1835:15;1831:24;1828:37;1825:57;;;1878:1;1875;1868:12;1825:57;1909:2;1905;1901:11;1891:21;;1931:6;1921:16;;;;;1278:665;;;;;:::o;2432:277::-;2499:6;2552:2;2540:9;2531:7;2527:23;2523:32;2520:52;;;2568:1;2565;2558:12;2520:52;2600:9;2594:16;2653:5;2646:13;2639:21;2632:5;2629:32;2619:60;;2675:1;2672;2665:12;3057:426;3186:3;3224:6;3218:13;3249:1;3259:129;3273:6;3270:1;3267:13;3259:129;;;3371:4;3355:14;;;3351:25;;3345:32;3332:11;;;3325:53;3288:12;3259:129;;;3406:6;3403:1;3400:13;3397:48;;;3441:1;3432:6;3427:3;3423:16;3416:27;3397:48;-1:-1:-1;3461:16:3;;;;;3057:426;-1:-1:-1;;3057:426:3:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '493200',
				executionCost: 'infinite',
				totalCost: 'infinite',
			},
			external: {
				'': 'infinite',
				'owner()': '2361',
				'supportsInterface(bytes4)': 'infinite',
				'transferOwnership(address)': '28278',
				'upgradeTo(address)': '28306',
				'upgradeToAndCall(address,bytes)': 'infinite',
			},
			internal: {
				'_owner()': 'infinite',
				'_setOwner(address)': '25799',
			},
		},
		methodIdentifiers: {
			'owner()': '8da5cb5b',
			'supportsInterface(bytes4)': '01ffc9a7',
			'transferOwnership(address)': 'f2fde38b',
			'upgradeTo(address)': '3659cfe6',
			'upgradeToAndCall(address,bytes)': '4f1ef286',
		},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"implementationAddress","type":"address"},{"internalType":"address","name":"ownerAddress","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousImplementation","type":"address"},{"indexed":true,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ProxyImplementationUpdated","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"id","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}],"devdoc":{"kind":"dev","methods":{},"version":1},"userdoc":{"kind":"user","methods":{},"notice":"Proxy implementing EIP173 for ownership management","version":1}},"settings":{"compilationTarget":{"solc_0.8/proxy/EIP173Proxy.sol":"EIP173Proxy"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/proxy/EIP173Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./Proxy.sol\\";\\n\\ninterface ERC165 {\\n    function supportsInterface(bytes4 id) external view returns (bool);\\n}\\n\\n///@notice Proxy implementing EIP173 for ownership management\\ncontract EIP173Proxy is Proxy {\\n    // ////////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    // /////////////////////// CONSTRUCTOR //////////////////////////////////////////////////////////////////////\\n\\n    constructor(\\n        address implementationAddress,\\n        address ownerAddress,\\n        bytes memory data\\n    ) payable {\\n        _setOwner(ownerAddress);\\n        _setImplementation(implementationAddress, data);\\n    }\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    function owner() external view returns (address) {\\n        return _owner();\\n    }\\n\\n    function supportsInterface(bytes4 id) external view returns (bool) {\\n        if (id == 0x01ffc9a7 || id == 0x7f5828d0) {\\n            return true;\\n        }\\n        if (id == 0xFFFFFFFF) {\\n            return false;\\n        }\\n\\n        ERC165 implementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            implementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // Technically this is not standard compliant as ERC-165 require 30,000 gas which that call cannot ensure\\n        // because it is itself inside `supportsInterface` that might only get 30,000 gas.\\n        // In practise this is unlikely to be an issue.\\n        try implementation.supportsInterface(id) returns (bool support) {\\n            return support;\\n        } catch {\\n            return false;\\n        }\\n    }\\n\\n    function transferOwnership(address newOwner) external onlyOwner {\\n        _setOwner(newOwner);\\n    }\\n\\n    function upgradeTo(address newImplementation) external onlyOwner {\\n        _setImplementation(newImplementation, \\"\\");\\n    }\\n\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable onlyOwner {\\n        _setImplementation(newImplementation, data);\\n    }\\n\\n    // /////////////////////// MODIFIERS ////////////////////////////////////////////////////////////////////////\\n\\n    modifier onlyOwner() {\\n        require(msg.sender == _owner(), \\"NOT_AUTHORIZED\\");\\n        _;\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _owner() internal view returns (address adminAddress) {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)\\n        }\\n    }\\n\\n    function _setOwner(address newOwner) internal {\\n        address previousOwner = _owner();\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, newOwner)\\n        }\\n        emit OwnershipTransferred(previousOwner, newOwner);\\n    }\\n}\\n","keccak256":"0xa52a027d9e3ad599c98da343572c0f8e16d65551d6fa0ab218e9e2d0f76e2ab0","license":"MIT"},"solc_0.8/proxy/Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n// EIP-1967\\nabstract contract Proxy {\\n    // /////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////////\\n\\n    event ProxyImplementationUpdated(address indexed previousImplementation, address indexed newImplementation);\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    receive() external payable virtual {\\n        revert(\\"ETHER_REJECTED\\"); // explicit reject by default\\n    }\\n\\n    fallback() external payable {\\n        _fallback();\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _fallback() internal {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            let implementationAddress := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n            calldatacopy(0x0, 0x0, calldatasize())\\n            let success := delegatecall(gas(), implementationAddress, 0x0, calldatasize(), 0, 0)\\n            let retSz := returndatasize()\\n            returndatacopy(0, 0, retSz)\\n            switch success\\n            case 0 {\\n                revert(0, retSz)\\n            }\\n            default {\\n                return(0, retSz)\\n            }\\n        }\\n    }\\n\\n    function _setImplementation(address newImplementation, bytes memory data) internal {\\n        address previousImplementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            previousImplementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, newImplementation)\\n        }\\n\\n        emit ProxyImplementationUpdated(previousImplementation, newImplementation);\\n\\n        if (data.length > 0) {\\n            (bool success, ) = newImplementation.delegatecall(data);\\n            if (!success) {\\n                assembly {\\n                    // This assembly ensure the revert contains the exact string data\\n                    let returnDataSize := returndatasize()\\n                    returndatacopy(0, 0, returnDataSize)\\n                    revert(0, returnDataSize)\\n                }\\n            }\\n        }\\n    }\\n}\\n","keccak256":"0x68c8cf1a340a53d31de8ed808bb66d64e83d50b20d80a0b2dff6aba903cebc98","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {},
		notice: 'Proxy implementing EIP173 for ownership management',
		version: 1,
	},
	solcInput:
		'{\n  "language": "Solidity",\n  "sources": {\n    "solc_0.8/proxy/EIP173Proxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./Proxy.sol\\";\\n\\ninterface ERC165 {\\n    function supportsInterface(bytes4 id) external view returns (bool);\\n}\\n\\n///@notice Proxy implementing EIP173 for ownership management\\ncontract EIP173Proxy is Proxy {\\n    // ////////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    // /////////////////////// CONSTRUCTOR //////////////////////////////////////////////////////////////////////\\n\\n    constructor(\\n        address implementationAddress,\\n        address ownerAddress,\\n        bytes memory data\\n    ) payable {\\n        _setOwner(ownerAddress);\\n        _setImplementation(implementationAddress, data);\\n    }\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    function owner() external view returns (address) {\\n        return _owner();\\n    }\\n\\n    function supportsInterface(bytes4 id) external view returns (bool) {\\n        if (id == 0x01ffc9a7 || id == 0x7f5828d0) {\\n            return true;\\n        }\\n        if (id == 0xFFFFFFFF) {\\n            return false;\\n        }\\n\\n        ERC165 implementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            implementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // Technically this is not standard compliant as ERC-165 require 30,000 gas which that call cannot ensure\\n        // because it is itself inside `supportsInterface` that might only get 30,000 gas.\\n        // In practise this is unlikely to be an issue.\\n        try implementation.supportsInterface(id) returns (bool support) {\\n            return support;\\n        } catch {\\n            return false;\\n        }\\n    }\\n\\n    function transferOwnership(address newOwner) external onlyOwner {\\n        _setOwner(newOwner);\\n    }\\n\\n    function upgradeTo(address newImplementation) external onlyOwner {\\n        _setImplementation(newImplementation, \\"\\");\\n    }\\n\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable onlyOwner {\\n        _setImplementation(newImplementation, data);\\n    }\\n\\n    // /////////////////////// MODIFIERS ////////////////////////////////////////////////////////////////////////\\n\\n    modifier onlyOwner() {\\n        require(msg.sender == _owner(), \\"NOT_AUTHORIZED\\");\\n        _;\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _owner() internal view returns (address adminAddress) {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)\\n        }\\n    }\\n\\n    function _setOwner(address newOwner) internal {\\n        address previousOwner = _owner();\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, newOwner)\\n        }\\n        emit OwnershipTransferred(previousOwner, newOwner);\\n    }\\n}\\n"\n    },\n    "solc_0.8/proxy/Proxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n// EIP-1967\\nabstract contract Proxy {\\n    // /////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////////\\n\\n    event ProxyImplementationUpdated(address indexed previousImplementation, address indexed newImplementation);\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    receive() external payable virtual {\\n        revert(\\"ETHER_REJECTED\\"); // explicit reject by default\\n    }\\n\\n    fallback() external payable {\\n        _fallback();\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _fallback() internal {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            let implementationAddress := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n            calldatacopy(0x0, 0x0, calldatasize())\\n            let success := delegatecall(gas(), implementationAddress, 0x0, calldatasize(), 0, 0)\\n            let retSz := returndatasize()\\n            returndatacopy(0, 0, retSz)\\n            switch success\\n            case 0 {\\n                revert(0, retSz)\\n            }\\n            default {\\n                return(0, retSz)\\n            }\\n        }\\n    }\\n\\n    function _setImplementation(address newImplementation, bytes memory data) internal {\\n        address previousImplementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            previousImplementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, newImplementation)\\n        }\\n\\n        emit ProxyImplementationUpdated(previousImplementation, newImplementation);\\n\\n        if (data.length > 0) {\\n            (bool success, ) = newImplementation.delegatecall(data);\\n            if (!success) {\\n                assembly {\\n                    // This assembly ensure the revert contains the exact string data\\n                    let returnDataSize := returndatasize()\\n                    returndatacopy(0, 0, returnDataSize)\\n                    revert(0, returnDataSize)\\n                }\\n            }\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/proxy/EIP173ProxyWithReceive.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./EIP173Proxy.sol\\";\\n\\n///@notice Proxy implementing EIP173 for ownership management that accept ETH via receive\\ncontract EIP173ProxyWithReceive is EIP173Proxy {\\n    constructor(\\n        address implementationAddress,\\n        address ownerAddress,\\n        bytes memory data\\n    ) payable EIP173Proxy(implementationAddress, ownerAddress, data) {}\\n\\n    receive() external payable override {}\\n}\\n"\n    }\n  },\n  "settings": {\n    "optimizer": {\n      "enabled": true,\n      "runs": 999999\n    },\n    "outputSelection": {\n      "*": {\n        "*": [\n          "abi",\n          "evm.bytecode",\n          "evm.deployedBytecode",\n          "evm.methodIdentifiers",\n          "metadata",\n          "devdoc",\n          "userdoc",\n          "storageLayout",\n          "evm.gasEstimates"\n        ],\n        "": [\n          "ast"\n        ]\n      }\n    },\n    "metadata": {\n      "useLiteralContent": true\n    }\n  }\n}',
	solcInputHash: '4a46ee6c1a29be400c9fab1ecc28e172',
} as const;
