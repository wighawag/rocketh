export default {
	_format: 'hh-sol-artifact-1',
	contractName: 'ERC173Proxy',
	sourceName: 'solc_0_8/ERC173/ERC173Proxy.sol',
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
		'0x608060405260405162000cb738038062000cb78339810160408190526200002691620001f3565b620000318262000046565b6200003d8382620000b8565b505050620002f1565b60006200006060008051602062000c978339815191525490565b90508160008051602062000c9783398151915255816001600160a01b0316816001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc8054908390556040516001600160a01b0380851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a381511562000195576000836001600160a01b0316836040516200013c9190620002d3565b600060405180830381855af49150503d806000811462000179576040519150601f19603f3d011682016040523d82523d6000602084013e6200017e565b606091505b505090508062000193573d806000803e806000fd5b505b505050565b80516001600160a01b0381168114620001b257600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620001ea578181015183820152602001620001d0565b50506000910152565b6000806000606084860312156200020957600080fd5b62000214846200019a565b925062000224602085016200019a565b60408501519092506001600160401b03808211156200024257600080fd5b818601915086601f8301126200025757600080fd5b8151818111156200026c576200026c620001b7565b604051601f8201601f19908116603f01168101908382118183101715620002975762000297620001b7565b81604052828152896020848701011115620002b157600080fd5b620002c4836020830160208801620001cd565b80955050505050509250925092565b60008251620002e7818460208701620001cd565b9190910192915050565b61099680620003016000396000f3fe60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146101295780638da5cb5b1461013c578063f2fde38b14610176576100ca565b806301ffc9a7146100d45780633659cfe614610109576100ca565b366100ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f45544845525f52454a454354454400000000000000000000000000000000000060448201526064015b60405180910390fd5b6100d2610196565b005b3480156100e057600080fd5b506100f46100ef366004610806565b6101e1565b60405190151581526020015b60405180910390f35b34801561011557600080fd5b506100d2610124366004610871565b6103af565b6100d261013736600461088c565b610481565b34801561014857600080fd5b5061015161057c565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610100565b34801561018257600080fd5b506100d2610191366004610871565b6105ab565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e8280156101d7578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061027457507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561028157506001919050565b7fffffffff0000000000000000000000000000000000000000000000000000000080831690036102b357506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa92505050801561039b575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092526103989181019061090f565b60015b6103a85750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610465576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e816040518060200160405280600081525061066a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610537576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b6105778383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061066a92505050565b505050565b60006105a67fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610661576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e81610759565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105775760008373ffffffffffffffffffffffffffffffffffffffff16836040516107059190610931565b600060405180830381855af49150503d8060008114610740576040519150601f19603f3d011682016040523d82523d6000602084013e610745565b606091505b50509050806101db573d806000803e806000fd5b60006107837fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60006020828403121561081857600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146103a857600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461086c57600080fd5b919050565b60006020828403121561088357600080fd5b6103a882610848565b6000806000604084860312156108a157600080fd5b6108aa84610848565b9250602084013567ffffffffffffffff808211156108c757600080fd5b818601915086601f8301126108db57600080fd5b8135818111156108ea57600080fd5b8760208285010111156108fc57600080fd5b6020830194508093505050509250925092565b60006020828403121561092157600080fd5b815180151581146103a857600080fd5b6000825160005b818110156109525760208186018101518583015201610938565b50600092019182525091905056fea2646970667358221220d4b8e63adccbcd059003c6af7195d51778aa436b5d3ecf7e6d5414d9adc0164d64736f6c63430008140033b53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
	deployedBytecode:
		'0x60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146101295780638da5cb5b1461013c578063f2fde38b14610176576100ca565b806301ffc9a7146100d45780633659cfe614610109576100ca565b366100ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f45544845525f52454a454354454400000000000000000000000000000000000060448201526064015b60405180910390fd5b6100d2610196565b005b3480156100e057600080fd5b506100f46100ef366004610806565b6101e1565b60405190151581526020015b60405180910390f35b34801561011557600080fd5b506100d2610124366004610871565b6103af565b6100d261013736600461088c565b610481565b34801561014857600080fd5b5061015161057c565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610100565b34801561018257600080fd5b506100d2610191366004610871565b6105ab565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e8280156101d7578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061027457507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561028157506001919050565b7fffffffff0000000000000000000000000000000000000000000000000000000080831690036102b357506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa92505050801561039b575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092526103989181019061090f565b60015b6103a85750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610465576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e816040518060200160405280600081525061066a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610537576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b6105778383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061066a92505050565b505050565b60006105a67fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610661576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e81610759565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105775760008373ffffffffffffffffffffffffffffffffffffffff16836040516107059190610931565b600060405180830381855af49150503d8060008114610740576040519150601f19603f3d011682016040523d82523d6000602084013e610745565b606091505b50509050806101db573d806000803e806000fd5b60006107837fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60006020828403121561081857600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146103a857600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461086c57600080fd5b919050565b60006020828403121561088357600080fd5b6103a882610848565b6000806000604084860312156108a157600080fd5b6108aa84610848565b9250602084013567ffffffffffffffff808211156108c757600080fd5b818601915086601f8301126108db57600080fd5b8135818111156108ea57600080fd5b8760208285010111156108fc57600080fd5b6020830194508093505050509250925092565b60006020828403121561092157600080fd5b815180151581146103a857600080fd5b6000825160005b818110156109525760208186018101518583015201610938565b50600092019182525091905056fea2646970667358221220d4b8e63adccbcd059003c6af7195d51778aa436b5d3ecf7e6d5414d9adc0164d64736f6c63430008140033',
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
				'@_setImplementation_313': {
					entryPoint: 184,
					id: 313,
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
					entryPoint: 499,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 723,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				copy_memory_to_memory_with_cleanup: {
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
						src: '0:1943:5',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:5',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '74:117:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '84:22:5',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '99:6:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '93:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '93:13:5',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '84:5:5',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '169:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '178:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '181:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '171:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '171:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '171:12:5',
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
																src: '128:5:5',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '139:5:5',
																	},
																	{
																		arguments: [
																			{
																				arguments: [
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '154:3:5',
																						type: '',
																						value: '160',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '159:1:5',
																						type: '',
																						value: '1',
																					},
																				],
																				functionName: {
																					name: 'shl',
																					nodeType: 'YulIdentifier',
																					src: '150:3:5',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '150:11:5',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '163:1:5',
																				type: '',
																				value: '1',
																			},
																		],
																		functionName: {
																			name: 'sub',
																			nodeType: 'YulIdentifier',
																			src: '146:3:5',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '146:19:5',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '135:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '135:31:5',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '125:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '125:42:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '118:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '118:50:5',
											},
											nodeType: 'YulIf',
											src: '115:70:5',
										},
									],
								},
								name: 'abi_decode_address_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '53:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '64:5:5',
										type: '',
									},
								],
								src: '14:177:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '228:95:5',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '245:1:5',
														type: '',
														value: '0',
													},
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '252:3:5',
																type: '',
																value: '224',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '257:10:5',
																type: '',
																value: '0x4e487b71',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '248:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '248:20:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '238:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '238:31:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '238:31:5',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '285:1:5',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '288:4:5',
														type: '',
														value: '0x41',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '278:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '278:15:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '278:15:5',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '309:1:5',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '312:4:5',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '302:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '302:15:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '302:15:5',
										},
									],
								},
								name: 'panic_error_0x41',
								nodeType: 'YulFunctionDefinition',
								src: '196:127:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '394:184:5',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '404:10:5',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '413:1:5',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '408:1:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '473:63:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '498:3:5',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '503:1:5',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '494:3:5',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '494:11:5',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'src',
																					nodeType: 'YulIdentifier',
																					src: '517:3:5',
																				},
																				{
																					name: 'i',
																					nodeType: 'YulIdentifier',
																					src: '522:1:5',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '513:3:5',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '513:11:5',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '507:5:5',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '507:18:5',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '487:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '487:39:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '487:39:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '434:1:5',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '437:6:5',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '431:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '431:13:5',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '445:19:5',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '447:15:5',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '456:1:5',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '459:2:5',
																	type: '',
																	value: '32',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '452:3:5',
															},
															nodeType: 'YulFunctionCall',
															src: '452:10:5',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '447:1:5',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '427:3:5',
												statements: [],
											},
											src: '423:113:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'dst',
																nodeType: 'YulIdentifier',
																src: '556:3:5',
															},
															{
																name: 'length',
																nodeType: 'YulIdentifier',
																src: '561:6:5',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '552:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '552:16:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '570:1:5',
														type: '',
														value: '0',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '545:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '545:27:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '545:27:5',
										},
									],
								},
								name: 'copy_memory_to_memory_with_cleanup',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'src',
										nodeType: 'YulTypedName',
										src: '372:3:5',
										type: '',
									},
									{
										name: 'dst',
										nodeType: 'YulTypedName',
										src: '377:3:5',
										type: '',
									},
									{
										name: 'length',
										nodeType: 'YulTypedName',
										src: '382:6:5',
										type: '',
									},
								],
								src: '328:250:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '707:942:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '753:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '762:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '765:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '755:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '755:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '755:12:5',
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
																src: '728:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '737:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '724:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '724:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '749:2:5',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '720:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '720:32:5',
											},
											nodeType: 'YulIf',
											src: '717:52:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '778:50:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '818:9:5',
													},
												],
												functionName: {
													name: 'abi_decode_address_fromMemory',
													nodeType: 'YulIdentifier',
													src: '788:29:5',
												},
												nodeType: 'YulFunctionCall',
												src: '788:40:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '778:6:5',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '837:59:5',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '881:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '892:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '877:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '877:18:5',
													},
												],
												functionName: {
													name: 'abi_decode_address_fromMemory',
													nodeType: 'YulIdentifier',
													src: '847:29:5',
												},
												nodeType: 'YulFunctionCall',
												src: '847:49:5',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '837:6:5',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '905:39:5',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '929:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '940:2:5',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '925:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '925:18:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '919:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '919:25:5',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '909:6:5',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '953:28:5',
											value: {
												arguments: [
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '971:2:5',
																type: '',
																value: '64',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '975:1:5',
																type: '',
																value: '1',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '967:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '967:10:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '979:1:5',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'sub',
													nodeType: 'YulIdentifier',
													src: '963:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '963:18:5',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '957:2:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1008:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1017:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1020:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1010:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1010:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1010:12:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '996:6:5',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1004:2:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '993:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '993:14:5',
											},
											nodeType: 'YulIf',
											src: '990:34:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1033:32:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1047:9:5',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1058:6:5',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1043:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1043:22:5',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1037:2:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1113:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1122:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1125:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1115:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1115:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1115:12:5',
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
																		src: '1092:2:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1096:4:5',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1088:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1088:13:5',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '1103:7:5',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '1084:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1084:27:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1077:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1077:35:5',
											},
											nodeType: 'YulIf',
											src: '1074:55:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1138:19:5',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1154:2:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1148:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1148:9:5',
											},
											variables: [
												{
													name: '_3',
													nodeType: 'YulTypedName',
													src: '1142:2:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1180:22:5',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1182:16:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1182:18:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1182:18:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1172:2:5',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1176:2:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1169:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1169:10:5',
											},
											nodeType: 'YulIf',
											src: '1166:36:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1211:17:5',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1225:2:5',
														type: '',
														value: '31',
													},
												],
												functionName: {
													name: 'not',
													nodeType: 'YulIdentifier',
													src: '1221:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1221:7:5',
											},
											variables: [
												{
													name: '_4',
													nodeType: 'YulTypedName',
													src: '1215:2:5',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1237:23:5',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1257:2:5',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1251:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1251:9:5',
											},
											variables: [
												{
													name: 'memPtr',
													nodeType: 'YulTypedName',
													src: '1241:6:5',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1269:71:5',
											value: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1291:6:5',
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
																						src: '1315:2:5',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '1319:4:5',
																						type: '',
																						value: '0x1f',
																					},
																				],
																				functionName: {
																					name: 'add',
																					nodeType: 'YulIdentifier',
																					src: '1311:3:5',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '1311:13:5',
																			},
																			{
																				name: '_4',
																				nodeType: 'YulIdentifier',
																				src: '1326:2:5',
																			},
																		],
																		functionName: {
																			name: 'and',
																			nodeType: 'YulIdentifier',
																			src: '1307:3:5',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '1307:22:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1331:2:5',
																		type: '',
																		value: '63',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1303:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1303:31:5',
															},
															{
																name: '_4',
																nodeType: 'YulIdentifier',
																src: '1336:2:5',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1299:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1299:40:5',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1287:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1287:53:5',
											},
											variables: [
												{
													name: 'newFreePtr',
													nodeType: 'YulTypedName',
													src: '1273:10:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1399:22:5',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1401:16:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1401:18:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1401:18:5',
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
																src: '1358:10:5',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '1370:2:5',
															},
														],
														functionName: {
															name: 'gt',
															nodeType: 'YulIdentifier',
															src: '1355:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1355:18:5',
													},
													{
														arguments: [
															{
																name: 'newFreePtr',
																nodeType: 'YulIdentifier',
																src: '1378:10:5',
															},
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1390:6:5',
															},
														],
														functionName: {
															name: 'lt',
															nodeType: 'YulIdentifier',
															src: '1375:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1375:22:5',
													},
												],
												functionName: {
													name: 'or',
													nodeType: 'YulIdentifier',
													src: '1352:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1352:46:5',
											},
											nodeType: 'YulIf',
											src: '1349:72:5',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1437:2:5',
														type: '',
														value: '64',
													},
													{
														name: 'newFreePtr',
														nodeType: 'YulIdentifier',
														src: '1441:10:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1430:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1430:22:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '1430:22:5',
										},
										{
											expression: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1468:6:5',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1476:2:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1461:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1461:18:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '1461:18:5',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1525:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1534:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1537:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1527:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1527:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1527:12:5',
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
																		src: '1502:2:5',
																	},
																	{
																		name: '_3',
																		nodeType: 'YulIdentifier',
																		src: '1506:2:5',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1498:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1498:11:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1511:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1494:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1494:20:5',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1516:7:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1491:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1491:33:5',
											},
											nodeType: 'YulIf',
											src: '1488:53:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: '_2',
																nodeType: 'YulIdentifier',
																src: '1589:2:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1593:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1585:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1585:11:5',
													},
													{
														arguments: [
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1602:6:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1610:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1598:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1598:15:5',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1615:2:5',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory_with_cleanup',
													nodeType: 'YulIdentifier',
													src: '1550:34:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1550:68:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '1550:68:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '1627:16:5',
											value: {
												name: 'memPtr',
												nodeType: 'YulIdentifier',
												src: '1637:6:5',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1627:6:5',
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
										src: '657:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '668:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '680:6:5',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '688:6:5',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '696:6:5',
										type: '',
									},
								],
								src: '583:1066:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1791:150:5',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '1801:27:5',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '1821:6:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1815:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1815:13:5',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1805:6:5',
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
																src: '1876:6:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1884:4:5',
																type: '',
																value: '0x20',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1872:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1872:17:5',
													},
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '1891:3:5',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1896:6:5',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory_with_cleanup',
													nodeType: 'YulIdentifier',
													src: '1837:34:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1837:66:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '1837:66:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '1912:23:5',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '1923:3:5',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1928:6:5',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1919:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1919:16:5',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '1912:3:5',
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
										src: '1767:3:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1772:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '1783:3:5',
										type: '',
									},
								],
								src: '1654:287:5',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_address_fromMemory(offset) -> value\n    {\n        value := mload(offset)\n        if iszero(eq(value, and(value, sub(shl(160, 1), 1)))) { revert(0, 0) }\n    }\n    function panic_error_0x41()\n    {\n        mstore(0, shl(224, 0x4e487b71))\n        mstore(4, 0x41)\n        revert(0, 0x24)\n    }\n    function copy_memory_to_memory_with_cleanup(src, dst, length)\n    {\n        let i := 0\n        for { } lt(i, length) { i := add(i, 32) }\n        {\n            mstore(add(dst, i), mload(add(src, i)))\n        }\n        mstore(add(dst, length), 0)\n    }\n    function abi_decode_tuple_t_addresst_addresst_bytes_memory_ptr_fromMemory(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 96) { revert(0, 0) }\n        value0 := abi_decode_address_fromMemory(headStart)\n        value1 := abi_decode_address_fromMemory(add(headStart, 32))\n        let offset := mload(add(headStart, 64))\n        let _1 := sub(shl(64, 1), 1)\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let _3 := mload(_2)\n        if gt(_3, _1) { panic_error_0x41() }\n        let _4 := not(31)\n        let memPtr := mload(64)\n        let newFreePtr := add(memPtr, and(add(and(add(_3, 0x1f), _4), 63), _4))\n        if or(gt(newFreePtr, _1), lt(newFreePtr, memPtr)) { panic_error_0x41() }\n        mstore(64, newFreePtr)\n        mstore(memPtr, _3)\n        if gt(add(add(_2, _3), 32), dataEnd) { revert(0, 0) }\n        copy_memory_to_memory_with_cleanup(add(_2, 32), add(memPtr, 32), _3)\n        value2 := memPtr\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        copy_memory_to_memory_with_cleanup(add(value0, 0x20), pos, length)\n        end := add(pos, length)\n    }\n}',
					id: 5,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			linkReferences: {},
			object:
				'608060405260405162000cb738038062000cb78339810160408190526200002691620001f3565b620000318262000046565b6200003d8382620000b8565b505050620002f1565b60006200006060008051602062000c978339815191525490565b90508160008051602062000c9783398151915255816001600160a01b0316816001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc8054908390556040516001600160a01b0380851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a381511562000195576000836001600160a01b0316836040516200013c9190620002d3565b600060405180830381855af49150503d806000811462000179576040519150601f19603f3d011682016040523d82523d6000602084013e6200017e565b606091505b505090508062000193573d806000803e806000fd5b505b505050565b80516001600160a01b0381168114620001b257600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620001ea578181015183820152602001620001d0565b50506000910152565b6000806000606084860312156200020957600080fd5b62000214846200019a565b925062000224602085016200019a565b60408501519092506001600160401b03808211156200024257600080fd5b818601915086601f8301126200025757600080fd5b8151818111156200026c576200026c620001b7565b604051601f8201601f19908116603f01168101908382118183101715620002975762000297620001b7565b81604052828152896020848701011115620002b157600080fd5b620002c4836020830160208801620001cd565b80955050505050509250925092565b60008251620002e7818460208701620001cd565b9190910192915050565b61099680620003016000396000f3fe60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146101295780638da5cb5b1461013c578063f2fde38b14610176576100ca565b806301ffc9a7146100d45780633659cfe614610109576100ca565b366100ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f45544845525f52454a454354454400000000000000000000000000000000000060448201526064015b60405180910390fd5b6100d2610196565b005b3480156100e057600080fd5b506100f46100ef366004610806565b6101e1565b60405190151581526020015b60405180910390f35b34801561011557600080fd5b506100d2610124366004610871565b6103af565b6100d261013736600461088c565b610481565b34801561014857600080fd5b5061015161057c565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610100565b34801561018257600080fd5b506100d2610191366004610871565b6105ab565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e8280156101d7578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061027457507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561028157506001919050565b7fffffffff0000000000000000000000000000000000000000000000000000000080831690036102b357506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa92505050801561039b575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092526103989181019061090f565b60015b6103a85750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610465576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e816040518060200160405280600081525061066a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610537576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b6105778383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061066a92505050565b505050565b60006105a67fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610661576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e81610759565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105775760008373ffffffffffffffffffffffffffffffffffffffff16836040516107059190610931565b600060405180830381855af49150503d8060008114610740576040519150601f19603f3d011682016040523d82523d6000602084013e610745565b606091505b50509050806101db573d806000803e806000fd5b60006107837fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60006020828403121561081857600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146103a857600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461086c57600080fd5b919050565b60006020828403121561088357600080fd5b6103a882610848565b6000806000604084860312156108a157600080fd5b6108aa84610848565b9250602084013567ffffffffffffffff808211156108c757600080fd5b818601915086601f8301126108db57600080fd5b8135818111156108ea57600080fd5b8760208285010111156108fc57600080fd5b6020830194508093505050509250925092565b60006020828403121561092157600080fd5b815180151581146103a857600080fd5b6000825160005b818110156109525760208186018101518583015201610938565b50600092019182525091905056fea2646970667358221220d4b8e63adccbcd059003c6af7195d51778aa436b5d3ecf7e6d5414d9adc0164d64736f6c63430008140033b53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH3 0xCB7 CODESIZE SUB DUP1 PUSH3 0xCB7 DUP4 CODECOPY DUP2 ADD PUSH1 0x40 DUP2 SWAP1 MSTORE PUSH3 0x26 SWAP2 PUSH3 0x1F3 JUMP JUMPDEST PUSH3 0x31 DUP3 PUSH3 0x46 JUMP JUMPDEST PUSH3 0x3D DUP4 DUP3 PUSH3 0xB8 JUMP JUMPDEST POP POP POP PUSH3 0x2F1 JUMP JUMPDEST PUSH1 0x0 PUSH3 0x60 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xC97 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xC97 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SSTORE DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH3 0x195 JUMPI PUSH1 0x0 DUP4 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP4 PUSH1 0x40 MLOAD PUSH3 0x13C SWAP2 SWAP1 PUSH3 0x2D3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH3 0x179 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH3 0x17E JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH3 0x193 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST POP JUMPDEST POP POP POP JUMP JUMPDEST DUP1 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP2 AND DUP2 EQ PUSH3 0x1B2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH3 0x1EA JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH3 0x1D0 JUMP JUMPDEST POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x60 DUP5 DUP7 SUB SLT ISZERO PUSH3 0x209 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x214 DUP5 PUSH3 0x19A JUMP JUMPDEST SWAP3 POP PUSH3 0x224 PUSH1 0x20 DUP6 ADD PUSH3 0x19A JUMP JUMPDEST PUSH1 0x40 DUP6 ADD MLOAD SWAP1 SWAP3 POP PUSH1 0x1 PUSH1 0x1 PUSH1 0x40 SHL SUB DUP1 DUP3 GT ISZERO PUSH3 0x242 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH3 0x257 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP2 DUP2 GT ISZERO PUSH3 0x26C JUMPI PUSH3 0x26C PUSH3 0x1B7 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH1 0x1F NOT SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH3 0x297 JUMPI PUSH3 0x297 PUSH3 0x1B7 JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP10 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH3 0x2B1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x2C4 DUP4 PUSH1 0x20 DUP4 ADD PUSH1 0x20 DUP9 ADD PUSH3 0x1CD JUMP JUMPDEST DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH3 0x2E7 DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH3 0x1CD JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH2 0x996 DUP1 PUSH3 0x301 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0x129 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x13C JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x176 JUMPI PUSH2 0xCA JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0xD4 JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0x109 JUMPI PUSH2 0xCA JUMP JUMPDEST CALLDATASIZE PUSH2 0xCA JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x45544845525F52454A4543544544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0xD2 PUSH2 0x196 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xF4 PUSH2 0xEF CALLDATASIZE PUSH1 0x4 PUSH2 0x806 JUMP JUMPDEST PUSH2 0x1E1 JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x115 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x124 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x3AF JUMP JUMPDEST PUSH2 0xD2 PUSH2 0x137 CALLDATASIZE PUSH1 0x4 PUSH2 0x88C JUMP JUMPDEST PUSH2 0x481 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x148 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x151 PUSH2 0x57C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x100 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x182 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x191 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x5AB JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x1D7 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x274 JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x281 JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND SWAP1 SUB PUSH2 0x2B3 JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x39B JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x398 SWAP2 DUP2 ADD SWAP1 PUSH2 0x90F JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x3A8 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x465 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x66A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x537 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x577 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x66A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x5A6 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x661 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH2 0x759 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x577 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x705 SWAP2 SWAP1 PUSH2 0x931 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x740 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x745 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x1DB JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x783 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x818 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x86C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x883 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x3A8 DUP3 PUSH2 0x848 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x8A1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x8AA DUP5 PUSH2 0x848 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x8C7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x8DB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x8EA JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x8FC JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x921 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x952 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x938 JUMP JUMPDEST POP PUSH1 0x0 SWAP3 ADD SWAP2 DUP3 MSTORE POP SWAP2 SWAP1 POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xD4 0xB8 0xE6 GASPRICE 0xDC 0xCB 0xCD SDIV SWAP1 SUB 0xC6 0xAF PUSH18 0x95D51778AA436B5D3ECF7E6D5414D9ADC016 0x4D PUSH5 0x736F6C6343 STOP ADDMOD EQ STOP CALLER 0xB5 BALANCE 0x27 PUSH9 0x4A568B3173AE13B9F8 0xA6 ADD PUSH15 0x243E63B6E8EE1178D6A717850B5D61 SUB ',
			sourceMap:
				'245:3511:0:-:0;;;805:189;;;;;;;;;;;;;;;;;;:::i;:::-;907:23;917:12;907:9;:23::i;:::-;940:47;959:21;982:4;940:18;:47::i;:::-;805:189;;;245:3511;;3408:346;3464:21;3488:8;-1:-1:-1;;;;;;;;;;;3313:73:0;;3136:266;3488:8;3464:32;;3669:8;-1:-1:-1;;;;;;;;;;;3594:84:0;3738:8;-1:-1:-1;;;;;3702:45:0;3723:13;-1:-1:-1;;;;;3702:45:0;;;;;;;;;;;3454:300;3408:346;:::o;1634:1067:3:-;1887:66;1881:73;;2062:93;;;;2180:69;;-1:-1:-1;;;;;2180:69:3;;;;;;;;;;1727:30;;2180:69;2264:11;;:15;2260:435;;2296:12;2313:17;-1:-1:-1;;;;;2313:30:3;2344:4;2313:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2295:54;;;2368:7;2363:322;;2534:16;2592:14;2589:1;;2571:36;2638:14;2589:1;2628:25;2363:322;2281:414;2260:435;1717:984;1634:1067;;:::o;14:177:5:-;93:13;;-1:-1:-1;;;;;135:31:5;;125:42;;115:70;;181:1;178;171:12;115:70;14:177;;;:::o;196:127::-;257:10;252:3;248:20;245:1;238:31;288:4;285:1;278:15;312:4;309:1;302:15;328:250;413:1;423:113;437:6;434:1;431:13;423:113;;;513:11;;;507:18;494:11;;;487:39;459:2;452:10;423:113;;;-1:-1:-1;;570:1:5;552:16;;545:27;328:250::o;583:1066::-;680:6;688;696;749:2;737:9;728:7;724:23;720:32;717:52;;;765:1;762;755:12;717:52;788:40;818:9;788:40;:::i;:::-;778:50;;847:49;892:2;881:9;877:18;847:49;:::i;:::-;940:2;925:18;;919:25;837:59;;-1:-1:-1;;;;;;993:14:5;;;990:34;;;1020:1;1017;1010:12;990:34;1058:6;1047:9;1043:22;1033:32;;1103:7;1096:4;1092:2;1088:13;1084:27;1074:55;;1125:1;1122;1115:12;1074:55;1154:2;1148:9;1176:2;1172;1169:10;1166:36;;;1182:18;;:::i;:::-;1257:2;1251:9;1225:2;1311:13;;-1:-1:-1;;1307:22:5;;;1331:2;1303:31;1299:40;1287:53;;;1355:18;;;1375:22;;;1352:46;1349:72;;;1401:18;;:::i;:::-;1441:10;1437:2;1430:22;1476:2;1468:6;1461:18;1516:7;1511:2;1506;1502;1498:11;1494:20;1491:33;1488:53;;;1537:1;1534;1527:12;1488:53;1550:68;1615:2;1610;1602:6;1598:15;1593:2;1589;1585:11;1550:68;:::i;:::-;1637:6;1627:16;;;;;;;583:1066;;;;;:::o;1654:287::-;1783:3;1821:6;1815:13;1837:66;1896:6;1891:3;1884:4;1876:6;1872:17;1837:66;:::i;:::-;1919:16;;;;;1654:287;-1:-1:-1;;1654:287:5:o;:::-;245:3511:0;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@_265': {
					entryPoint: null,
					id: 265,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_272': {
					entryPoint: null,
					id: 272,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_fallback_277': {
					entryPoint: 406,
					id: 277,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_owner_154': {
					entryPoint: null,
					id: 154,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_setImplementation_313': {
					entryPoint: 1642,
					id: 313,
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
						src: '0:3471:5',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:5',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '188:164:5',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '205:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '216:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '198:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '198:21:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '198:21:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '239:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '250:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '235:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '235:18:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '255:2:5',
														type: '',
														value: '14',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '228:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '228:30:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '228:30:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '278:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '289:2:5',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '274:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '274:18:5',
													},
													{
														hexValue: '45544845525f52454a4543544544',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '294:16:5',
														type: '',
														value: 'ETHER_REJECTED',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '267:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '267:44:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '267:44:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '320:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '332:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '343:2:5',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '328:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '328:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '320:4:5',
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
										src: '165:9:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '179:4:5',
										type: '',
									},
								],
								src: '14:338:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '426:263:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '472:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '481:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '484:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '474:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '474:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '474:12:5',
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
																src: '447:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '456:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '443:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '443:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '468:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '439:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '439:32:5',
											},
											nodeType: 'YulIf',
											src: '436:52:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '497:36:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '523:9:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '510:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '510:23:5',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '501:5:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '643:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '652:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '655:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '645:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '645:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '645:12:5',
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
																src: '555:5:5',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '566:5:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '573:66:5',
																		type: '',
																		value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '562:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '562:78:5',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '552:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '552:89:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '545:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '545:97:5',
											},
											nodeType: 'YulIf',
											src: '542:117:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '668:15:5',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '678:5:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '668:6:5',
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
										src: '392:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '403:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '415:6:5',
										type: '',
									},
								],
								src: '357:332:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '789:92:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '799:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '811:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '822:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '807:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '807:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '799:4:5',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '841:9:5',
													},
													{
														arguments: [
															{
																arguments: [
																	{
																		name: 'value0',
																		nodeType: 'YulIdentifier',
																		src: '866:6:5',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '859:6:5',
																},
																nodeType: 'YulFunctionCall',
																src: '859:14:5',
															},
														],
														functionName: {
															name: 'iszero',
															nodeType: 'YulIdentifier',
															src: '852:6:5',
														},
														nodeType: 'YulFunctionCall',
														src: '852:22:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '834:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '834:41:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '834:41:5',
										},
									],
								},
								name: 'abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '758:9:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '769:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '780:4:5',
										type: '',
									},
								],
								src: '694:187:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '935:147:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '945:29:5',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '967:6:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '954:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '954:20:5',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '945:5:5',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1060:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1069:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1072:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1062:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1062:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1062:12:5',
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
																src: '996:5:5',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '1007:5:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1014:42:5',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '1003:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1003:54:5',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '993:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '993:65:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '986:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '986:73:5',
											},
											nodeType: 'YulIf',
											src: '983:93:5',
										},
									],
								},
								name: 'abi_decode_address',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '914:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '925:5:5',
										type: '',
									},
								],
								src: '886:196:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1157:116:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1203:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1212:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1215:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1205:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1205:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1205:12:5',
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
																src: '1178:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1187:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1174:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1174:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1199:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1170:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1170:32:5',
											},
											nodeType: 'YulIf',
											src: '1167:52:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '1228:39:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1257:9:5',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '1238:18:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1238:29:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1228:6:5',
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
										src: '1123:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1134:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1146:6:5',
										type: '',
									},
								],
								src: '1087:186:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1384:559:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1430:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1439:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1442:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1432:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1432:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1432:12:5',
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
																src: '1405:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1414:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1401:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1401:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1426:2:5',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1397:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1397:32:5',
											},
											nodeType: 'YulIf',
											src: '1394:52:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '1455:39:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1484:9:5',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '1465:18:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1465:29:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1455:6:5',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1503:46:5',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1534:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1545:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1530:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1530:18:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1517:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1517:32:5',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '1507:6:5',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1558:28:5',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1568:18:5',
												type: '',
												value: '0xffffffffffffffff',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1562:2:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1613:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1622:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1625:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1615:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1615:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1615:12:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1601:6:5',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1609:2:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1598:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1598:14:5',
											},
											nodeType: 'YulIf',
											src: '1595:34:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1638:32:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1652:9:5',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1663:6:5',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1648:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1648:22:5',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1642:2:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1718:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1727:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1730:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1720:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1720:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1720:12:5',
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
																		src: '1697:2:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1701:4:5',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1693:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1693:13:5',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '1708:7:5',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '1689:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1689:27:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1682:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1682:35:5',
											},
											nodeType: 'YulIf',
											src: '1679:55:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1743:30:5',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1770:2:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1757:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1757:16:5',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1747:6:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1800:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1809:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1812:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1802:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1802:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1802:12:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1788:6:5',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1796:2:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1785:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1785:14:5',
											},
											nodeType: 'YulIf',
											src: '1782:34:5',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1866:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1875:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1878:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1868:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1868:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1868:12:5',
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
																		src: '1839:2:5',
																	},
																	{
																		name: 'length',
																		nodeType: 'YulIdentifier',
																		src: '1843:6:5',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1835:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1835:15:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1852:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1831:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1831:24:5',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1857:7:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1828:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1828:37:5',
											},
											nodeType: 'YulIf',
											src: '1825:57:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '1891:21:5',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1905:2:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1909:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1901:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1901:11:5',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1891:6:5',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1921:16:5',
											value: {
												name: 'length',
												nodeType: 'YulIdentifier',
												src: '1931:6:5',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1921:6:5',
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
										src: '1334:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1345:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1357:6:5',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '1365:6:5',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '1373:6:5',
										type: '',
									},
								],
								src: '1278:665:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2049:125:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '2059:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2071:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2082:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2067:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2067:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2059:4:5',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2101:9:5',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2116:6:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2124:42:5',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '2112:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2112:55:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2094:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2094:74:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2094:74:5',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2018:9:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2029:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2040:4:5',
										type: '',
									},
								],
								src: '1948:226:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2278:149:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '2288:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2300:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2311:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2296:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2296:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2288:4:5',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2330:9:5',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2345:6:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2353:66:5',
																type: '',
																value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '2341:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2341:79:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2323:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2323:98:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2323:98:5',
										},
									],
								},
								name: 'abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2247:9:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2258:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2269:4:5',
										type: '',
									},
								],
								src: '2179:248:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2510:199:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '2556:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2565:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2568:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2558:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '2558:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '2558:12:5',
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
																src: '2531:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2540:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '2527:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2527:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2552:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '2523:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2523:32:5',
											},
											nodeType: 'YulIf',
											src: '2520:52:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2581:29:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2600:9:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2594:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2594:16:5',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '2585:5:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2663:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2672:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2675:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2665:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '2665:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '2665:12:5',
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
																src: '2632:5:5',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'value',
																				nodeType: 'YulIdentifier',
																				src: '2653:5:5',
																			},
																		],
																		functionName: {
																			name: 'iszero',
																			nodeType: 'YulIdentifier',
																			src: '2646:6:5',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '2646:13:5',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '2639:6:5',
																},
																nodeType: 'YulFunctionCall',
																src: '2639:21:5',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '2629:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2629:32:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '2622:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2622:40:5',
											},
											nodeType: 'YulIf',
											src: '2619:60:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '2688:15:5',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '2698:5:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '2688:6:5',
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
										src: '2476:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2487:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2499:6:5',
										type: '',
									},
								],
								src: '2432:277:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2888:164:5',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2905:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2916:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2898:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2898:21:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2898:21:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2939:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2950:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2935:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2935:18:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2955:2:5',
														type: '',
														value: '14',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2928:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2928:30:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2928:30:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2978:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2989:2:5',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2974:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2974:18:5',
													},
													{
														hexValue: '4e4f545f415554484f52495a4544',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2994:16:5',
														type: '',
														value: 'NOT_AUTHORIZED',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2967:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2967:44:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2967:44:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '3020:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3032:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3043:2:5',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3028:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '3028:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3020:4:5',
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
										src: '2865:9:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2879:4:5',
										type: '',
									},
								],
								src: '2714:338:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3194:275:5',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '3204:27:5',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '3224:6:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '3218:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '3218:13:5',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '3208:6:5',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3240:10:5',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '3249:1:5',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '3244:1:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '3311:77:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'pos',
																			nodeType: 'YulIdentifier',
																			src: '3336:3:5',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '3341:1:5',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '3332:3:5',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3332:11:5',
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
																							src: '3359:6:5',
																						},
																						{
																							name: 'i',
																							nodeType: 'YulIdentifier',
																							src: '3367:1:5',
																						},
																					],
																					functionName: {
																						name: 'add',
																						nodeType: 'YulIdentifier',
																						src: '3355:3:5',
																					},
																					nodeType: 'YulFunctionCall',
																					src: '3355:14:5',
																				},
																				{
																					kind: 'number',
																					nodeType: 'YulLiteral',
																					src: '3371:4:5',
																					type: '',
																					value: '0x20',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '3351:3:5',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '3351:25:5',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '3345:5:5',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3345:32:5',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '3325:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '3325:53:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '3325:53:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '3270:1:5',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3273:6:5',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '3267:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '3267:13:5',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '3281:21:5',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '3283:17:5',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '3292:1:5',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3295:4:5',
																	type: '',
																	value: '0x20',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '3288:3:5',
															},
															nodeType: 'YulFunctionCall',
															src: '3288:12:5',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '3283:1:5',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '3263:3:5',
												statements: [],
											},
											src: '3259:129:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3397:26:5',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3411:3:5',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3416:6:5',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3407:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '3407:16:5',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '3401:2:5',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '3439:2:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3443:1:5',
														type: '',
														value: '0',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3432:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '3432:13:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '3432:13:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '3454:9:5',
											value: {
												name: '_1',
												nodeType: 'YulIdentifier',
												src: '3461:2:5',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '3454:3:5',
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
										src: '3170:3:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3175:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '3186:3:5',
										type: '',
									},
								],
								src: '3057:412:5',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_encode_tuple_t_stringliteral_ef8a4c3fcfbfa959f184421d0ef9a577b18116cafbc5879aff4e2f1881c7c1f0__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 14)\n        mstore(add(headStart, 64), "ETHER_REJECTED")\n        tail := add(headStart, 96)\n    }\n    function abi_decode_tuple_t_bytes4(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffff00000000000000000000000000000000000000000000000000000000))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, iszero(iszero(value0)))\n    }\n    function abi_decode_address(offset) -> value\n    {\n        value := calldataload(offset)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n    }\n    function abi_decode_tuple_t_addresst_bytes_calldata_ptr(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n        let offset := calldataload(add(headStart, 32))\n        let _1 := 0xffffffffffffffff\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let length := calldataload(_2)\n        if gt(length, _1) { revert(0, 0) }\n        if gt(add(add(_2, length), 32), dataEnd) { revert(0, 0) }\n        value1 := add(_2, 32)\n        value2 := length\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffff00000000000000000000000000000000000000000000000000000000))\n    }\n    function abi_decode_tuple_t_bool_fromMemory(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := mload(headStart)\n        if iszero(eq(value, iszero(iszero(value)))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_stringliteral_e7e213d5e2bee0acc2c7bf8bfda19ef0cae82e7b8c997e7e898919269971e7c4__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 14)\n        mstore(add(headStart, 64), "NOT_AUTHORIZED")\n        tail := add(headStart, 96)\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 0x20) }\n        {\n            mstore(add(pos, i), mload(add(add(value0, i), 0x20)))\n        }\n        let _1 := add(pos, length)\n        mstore(_1, 0)\n        end := _1\n    }\n}',
					id: 5,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			object:
				'60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146101295780638da5cb5b1461013c578063f2fde38b14610176576100ca565b806301ffc9a7146100d45780633659cfe614610109576100ca565b366100ca576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f45544845525f52454a454354454400000000000000000000000000000000000060448201526064015b60405180910390fd5b6100d2610196565b005b3480156100e057600080fd5b506100f46100ef366004610806565b6101e1565b60405190151581526020015b60405180910390f35b34801561011557600080fd5b506100d2610124366004610871565b6103af565b6100d261013736600461088c565b610481565b34801561014857600080fd5b5061015161057c565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610100565b34801561018257600080fd5b506100d2610191366004610871565b6105ab565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e8280156101d7578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061027457507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561028157506001919050565b7fffffffff0000000000000000000000000000000000000000000000000000000080831690036102b357506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa92505050801561039b575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01682019092526103989181019061090f565b60015b6103a85750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610465576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e816040518060200160405280600081525061066a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610537576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b6105778383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061066a92505050565b505050565b60006105a67fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610661576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016100c1565b61047e81610759565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105775760008373ffffffffffffffffffffffffffffffffffffffff16836040516107059190610931565b600060405180830381855af49150503d8060008114610740576040519150601f19603f3d011682016040523d82523d6000602084013e610745565b606091505b50509050806101db573d806000803e806000fd5b60006107837fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60006020828403121561081857600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146103a857600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461086c57600080fd5b919050565b60006020828403121561088357600080fd5b6103a882610848565b6000806000604084860312156108a157600080fd5b6108aa84610848565b9250602084013567ffffffffffffffff808211156108c757600080fd5b818601915086601f8301126108db57600080fd5b8135818111156108ea57600080fd5b8760208285010111156108fc57600080fd5b6020830194508093505050509250925092565b60006020828403121561092157600080fd5b815180151581146103a857600080fd5b6000825160005b818110156109525760208186018101518583015201610938565b50600092019182525091905056fea2646970667358221220d4b8e63adccbcd059003c6af7195d51778aa436b5d3ecf7e6d5414d9adc0164d64736f6c63430008140033',
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0x129 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x13C JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x176 JUMPI PUSH2 0xCA JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0xD4 JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0x109 JUMPI PUSH2 0xCA JUMP JUMPDEST CALLDATASIZE PUSH2 0xCA JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x45544845525F52454A4543544544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0xD2 PUSH2 0x196 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xF4 PUSH2 0xEF CALLDATASIZE PUSH1 0x4 PUSH2 0x806 JUMP JUMPDEST PUSH2 0x1E1 JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x115 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x124 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x3AF JUMP JUMPDEST PUSH2 0xD2 PUSH2 0x137 CALLDATASIZE PUSH1 0x4 PUSH2 0x88C JUMP JUMPDEST PUSH2 0x481 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x148 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x151 PUSH2 0x57C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x100 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x182 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xD2 PUSH2 0x191 CALLDATASIZE PUSH1 0x4 PUSH2 0x871 JUMP JUMPDEST PUSH2 0x5AB JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x1D7 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x274 JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x281 JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND SWAP1 SUB PUSH2 0x2B3 JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x39B JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x398 SWAP2 DUP2 ADD SWAP1 PUSH2 0x90F JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x3A8 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x465 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x66A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x537 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x577 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x66A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x5A6 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x661 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0xC1 JUMP JUMPDEST PUSH2 0x47E DUP2 PUSH2 0x759 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x577 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x705 SWAP2 SWAP1 PUSH2 0x931 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x740 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x745 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x1DB JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x783 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x818 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x86C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x883 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x3A8 DUP3 PUSH2 0x848 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x8A1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x8AA DUP5 PUSH2 0x848 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x8C7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x8DB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x8EA JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x8FC JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x921 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x3A8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x952 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x938 JUMP JUMPDEST POP PUSH1 0x0 SWAP3 ADD SWAP2 DUP3 MSTORE POP SWAP2 SWAP1 POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xD4 0xB8 0xE6 GASPRICE 0xDC 0xCB 0xCD SDIV SWAP1 SUB 0xC6 0xAF PUSH18 0x95D51778AA436B5D3ECF7E6D5414D9ADC016 0x4D PUSH5 0x736F6C6343 STOP ADDMOD EQ STOP CALLER ',
			sourceMap:
				'245:3511:0:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;698:24:3;;;;;216:2:5;698:24:3;;;198:21:5;255:2;235:18;;;228:30;294:16;274:18;;;267:44;328:18;;698:24:3;;;;;;;;245:3511:0;803:11:3;:9;:11::i;:::-;245:3511:0;1312:877;;;;;;;;;;-1:-1:-1;1312:877:0;;;;;:::i;:::-;;:::i;:::-;;;859:14:5;;852:22;834:41;;822:2;807:18;1312:877:0;;;;;;;;2301:123;;;;;;;;;;-1:-1:-1;2301:123:0;;;;;:::i;:::-;;:::i;2430:161::-;;;;;;:::i;:::-;;:::i;1225:81::-;;;;;;;;;;;;;:::i;:::-;;;2124:42:5;2112:55;;;2094:74;;2082:2;2067:18;1225:81:0;1948:226:5;2195:100:0;;;;;;;;;;-1:-1:-1;2195:100:0;;;;;:::i;:::-;;:::i;1044:584:3:-;1207:66;1201:73;1305:3;1310:14;1305:3;;1287:38;1305:3;;1310:14;1305:3;1373:21;1366:5;1353:69;1338:84;;1448:16;1498:5;1305:3;;1477:27;1524:7;1544:27;;;;1604:5;1305:3;1594:16;1544:27;1563:5;1305:3;1553:16;1517:95;;;;;1044:584::o;1312:877:0:-;1373:4;1393:16;;;;;;:36;;-1:-1:-1;1413:16:0;;;;;1393:36;1389:78;;;-1:-1:-1;1452:4:0;;1312:877;-1:-1:-1;1312:877:0:o;1389:78::-;1480:16;;;;;;1476:59;;-1:-1:-1;1519:5:0;;1312:877;-1:-1:-1;1312:877:0:o;1476:59::-;1688:66;1682:73;2040:36;;;;;2353:66:5;2341:79;;2040:36:0;;;2323:98:5;2040:32:0;;;;;;2296:18:5;;2040:36:0;;;;;;;;;;;;;;;;;;-1:-1:-1;2040:36:0;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;2036:147;;-1:-1:-1;2167:5:0;;1312:877;-1:-1:-1;;1312:877:0:o;2036:147::-;2121:7;1312:877;-1:-1:-1;;;1312:877:0:o;2301:123::-;3319:66;3313:73;2854:22;;:10;:22;;;2846:49;;;;;;;2916:2:5;2846:49:0;;;2898:21:5;2955:2;2935:18;;;2928:30;2994:16;2974:18;;;2967:44;3028:18;;2846:49:0;2714:338:5;2846:49:0;2376:41:::1;2395:17;2376:41;;;;;;;;;;;::::0;:18:::1;:41::i;:::-;2301:123:::0;:::o;2430:161::-;3319:66;3313:73;2854:22;;:10;:22;;;2846:49;;;;;;;2916:2:5;2846:49:0;;;2898:21:5;2955:2;2935:18;;;2928:30;2994:16;2974:18;;;2967:44;3028:18;;2846:49:0;2714:338:5;2846:49:0;2541:43:::1;2560:17;2579:4;;2541:43;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::0;::::1;::::0;;;;-1:-1:-1;2541:18:0::1;::::0;-1:-1:-1;;;2541:43:0:i:1;:::-;2430:161:::0;;;:::o;1225:81::-;1265:7;1291:8;3319:66;3313:73;;3136:266;1291:8;1284:15;;1225:81;:::o;2195:100::-;3319:66;3313:73;2854:22;;:10;:22;;;2846:49;;;;;;;2916:2:5;2846:49:0;;;2898:21:5;2955:2;2935:18;;;2928:30;2994:16;2974:18;;;2967:44;3028:18;;2846:49:0;2714:338:5;2846:49:0;2269:19:::1;2279:8;2269:9;:19::i;1634:1067:3:-:0;1887:66;1881:73;;2062:93;;;;2180:69;;;;;;;;;;;;;1727:30;;2180:69;2264:11;;:15;2260:435;;2296:12;2313:17;:30;;2344:4;2313:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2295:54;;;2368:7;2363:322;;2534:16;2592:14;2589:1;;2571:36;2638:14;2589:1;2628:25;3408:346:0;3464:21;3488:8;3319:66;3313:73;;3136:266;3488:8;3464:32;;3669:8;3601:66;3594:84;3738:8;3702:45;;3723:13;3702:45;;;;;;;;;;;;3454:300;3408:346;:::o;357:332:5:-;415:6;468:2;456:9;447:7;443:23;439:32;436:52;;;484:1;481;474:12;436:52;523:9;510:23;573:66;566:5;562:78;555:5;552:89;542:117;;655:1;652;645:12;886:196;954:20;;1014:42;1003:54;;993:65;;983:93;;1072:1;1069;1062:12;983:93;886:196;;;:::o;1087:186::-;1146:6;1199:2;1187:9;1178:7;1174:23;1170:32;1167:52;;;1215:1;1212;1205:12;1167:52;1238:29;1257:9;1238:29;:::i;1278:665::-;1357:6;1365;1373;1426:2;1414:9;1405:7;1401:23;1397:32;1394:52;;;1442:1;1439;1432:12;1394:52;1465:29;1484:9;1465:29;:::i;:::-;1455:39;;1545:2;1534:9;1530:18;1517:32;1568:18;1609:2;1601:6;1598:14;1595:34;;;1625:1;1622;1615:12;1595:34;1663:6;1652:9;1648:22;1638:32;;1708:7;1701:4;1697:2;1693:13;1689:27;1679:55;;1730:1;1727;1720:12;1679:55;1770:2;1757:16;1796:2;1788:6;1785:14;1782:34;;;1812:1;1809;1802:12;1782:34;1857:7;1852:2;1843:6;1839:2;1835:15;1831:24;1828:37;1825:57;;;1878:1;1875;1868:12;1825:57;1909:2;1905;1901:11;1891:21;;1931:6;1921:16;;;;;1278:665;;;;;:::o;2432:277::-;2499:6;2552:2;2540:9;2531:7;2527:23;2523:32;2520:52;;;2568:1;2565;2558:12;2520:52;2600:9;2594:16;2653:5;2646:13;2639:21;2632:5;2629:32;2619:60;;2675:1;2672;2665:12;3057:412;3186:3;3224:6;3218:13;3249:1;3259:129;3273:6;3270:1;3267:13;3259:129;;;3371:4;3355:14;;;3351:25;;3345:32;3332:11;;;3325:53;3288:12;3259:129;;;-1:-1:-1;3443:1:5;3407:16;;3432:13;;;-1:-1:-1;3407:16:5;3057:412;-1:-1:-1;3057:412:5:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '490800',
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
		'{"compiler":{"version":"0.8.20+commit.a1b79de6"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"implementationAddress","type":"address"},{"internalType":"address","name":"ownerAddress","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousImplementation","type":"address"},{"indexed":true,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ProxyImplementationUpdated","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"id","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}],"devdoc":{"kind":"dev","methods":{},"version":1},"userdoc":{"kind":"user","methods":{},"notice":"Proxy implementing ERC173 for ownership management","version":1}},"settings":{"compilationTarget":{"solc_0_8/ERC173/ERC173Proxy.sol":"ERC173Proxy"},"evmVersion":"paris","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0_8/ERC173/ERC173Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"../ERC1967/Proxy.sol\\";\\n\\ninterface ERC165 {\\n    function supportsInterface(bytes4 id) external view returns (bool);\\n}\\n\\n///@notice Proxy implementing ERC173 for ownership management\\ncontract ERC173Proxy is Proxy {\\n    // --------------------------------------------------------------------------------------------\\n    // Events\\n    // --------------------------------------------------------------------------------------------\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Constructor\\n    // --------------------------------------------------------------------------------------------\\n\\n    constructor(address implementationAddress, address ownerAddress, bytes memory data) payable {\\n        _setOwner(ownerAddress);\\n        _setImplementation(implementationAddress, data);\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Public Interface\\n    // --------------------------------------------------------------------------------------------\\n\\n    function owner() external view returns (address) {\\n        return _owner();\\n    }\\n\\n    function supportsInterface(bytes4 id) external view returns (bool) {\\n        if (id == 0x01ffc9a7 || id == 0x7f5828d0) {\\n            return true;\\n        }\\n        if (id == 0xFFFFFFFF) {\\n            return false;\\n        }\\n\\n        ERC165 implementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            implementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // Technically this is not standard compliant as ERC-165 require 30,000 gas which that call cannot ensure\\n        // because it is itself inside `supportsInterface` that might only get 30,000 gas.\\n        // In practise this is unlikely to be an issue.\\n        try implementation.supportsInterface(id) returns (bool support) {\\n            return support;\\n        } catch {\\n            return false;\\n        }\\n    }\\n\\n    function transferOwnership(address newOwner) external onlyOwner {\\n        _setOwner(newOwner);\\n    }\\n\\n    function upgradeTo(address newImplementation) external onlyOwner {\\n        _setImplementation(newImplementation, \\"\\");\\n    }\\n\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable onlyOwner {\\n        _setImplementation(newImplementation, data);\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Modifiers\\n    // --------------------------------------------------------------------------------------------\\n\\n    modifier onlyOwner() {\\n        require(msg.sender == _owner(), \\"NOT_AUTHORIZED\\");\\n        _;\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Internal\\n    // --------------------------------------------------------------------------------------------\\n\\n    function _owner() internal view returns (address adminAddress) {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)\\n        }\\n    }\\n\\n    function _setOwner(address newOwner) internal {\\n        address previousOwner = _owner();\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, newOwner)\\n        }\\n        emit OwnershipTransferred(previousOwner, newOwner);\\n    }\\n}\\n","keccak256":"0xe66459b598ec609af81ef013a7cbf4cc12eea4157190882fe15c4a3f2037b8d6","license":"MIT"},"solc_0_8/ERC1967/Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n// ERC-1967\\nabstract contract Proxy {\\n    // --------------------------------------------------------------------------------------------\\n    // Events\\n    // --------------------------------------------------------------------------------------------\\n\\n    event ProxyImplementationUpdated(address indexed previousImplementation, address indexed newImplementation);\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Public Interface\\n    // --------------------------------------------------------------------------------------------\\n\\n    receive() external payable virtual {\\n        revert(\\"ETHER_REJECTED\\"); // explicit reject by default\\n    }\\n\\n    fallback() external payable {\\n        _fallback();\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Internal\\n    // --------------------------------------------------------------------------------------------\\n\\n    function _fallback() internal {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            let implementationAddress := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n            calldatacopy(0x0, 0x0, calldatasize())\\n            let success := delegatecall(gas(), implementationAddress, 0x0, calldatasize(), 0, 0)\\n            let retSz := returndatasize()\\n            returndatacopy(0, 0, retSz)\\n            switch success\\n            case 0 { revert(0, retSz) }\\n            default { return(0, retSz) }\\n        }\\n    }\\n\\n    function _setImplementation(address newImplementation, bytes memory data) internal {\\n        address previousImplementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            previousImplementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, newImplementation)\\n        }\\n\\n        emit ProxyImplementationUpdated(previousImplementation, newImplementation);\\n\\n        if (data.length > 0) {\\n            (bool success,) = newImplementation.delegatecall(data);\\n            if (!success) {\\n                assembly {\\n                    // This assembly ensure the revert contains the exact string data\\n                    let returnDataSize := returndatasize()\\n                    returndatacopy(0, 0, returnDataSize)\\n                    revert(0, returnDataSize)\\n                }\\n            }\\n        }\\n    }\\n}\\n","keccak256":"0x7b91e396821b404ffd824b60396d4f561acb5e7e8ce611b5444dfe503cc693e4","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {},
		notice: 'Proxy implementing ERC173 for ownership management',
		version: 1,
	},
} as const;
