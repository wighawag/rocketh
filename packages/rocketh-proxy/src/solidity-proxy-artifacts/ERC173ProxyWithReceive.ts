export default {
	_format: 'hh-sol-artifact-1',
	contractName: 'ERC173ProxyWithReceive',
	sourceName: 'solc_0_8/ERC173/ERC173ProxyWithReceive.sol',
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
		'0x608060405260405162000c5d38038062000c5d8339810160408190526200002691620001f9565b82828262000034826200004c565b620000408382620000be565b505050505050620002f7565b60006200006660008051602062000c3d8339815191525490565b90508160008051602062000c3d83398151915255816001600160a01b0316816001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc8054908390556040516001600160a01b0380851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156200019b576000836001600160a01b031683604051620001429190620002d9565b600060405180830381855af49150503d80600081146200017f576040519150601f19603f3d011682016040523d82523d6000602084013e62000184565b606091505b505090508062000199573d806000803e806000fd5b505b505050565b80516001600160a01b0381168114620001b857600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620001f0578181015183820152602001620001d6565b50506000910152565b6000806000606084860312156200020f57600080fd5b6200021a84620001a0565b92506200022a60208501620001a0565b60408501519092506001600160401b03808211156200024857600080fd5b818601915086601f8301126200025d57600080fd5b815181811115620002725762000272620001bd565b604051601f8201601f19908116603f011681019083821181831017156200029d576200029d620001bd565b81604052828152896020848701011115620002b757600080fd5b620002ca836020830160208801620001d3565b80955050505050509250925092565b60008251620002ed818460208701620001d3565b9190910192915050565b61093680620003076000396000f3fe60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146100c45780638da5cb5b146100d7578063f2fde38b1461011157610065565b806301ffc9a71461006f5780633659cfe6146100a457610065565b3661006557005b61006d610131565b005b34801561007b57600080fd5b5061008f61008a3660046107a6565b61017c565b60405190151581526020015b60405180910390f35b3480156100b057600080fd5b5061006d6100bf366004610811565b61034a565b61006d6100d236600461082c565b610421565b3480156100e357600080fd5b506100ec61051c565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200161009b565b34801561011d57600080fd5b5061006d61012c366004610811565b61054b565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e828015610172578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061020f57507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561021c57506001919050565b7fffffffff00000000000000000000000000000000000000000000000000000000808316900361024e57506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa925050508015610336575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201909252610333918101906108af565b60015b6103435750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610405576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064015b60405180910390fd5b61041e816040518060200160405280600081525061060a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104d7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b6105178383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061060a92505050565b505050565b60006105467fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610601576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b61041e816106f9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105175760008373ffffffffffffffffffffffffffffffffffffffff16836040516106a591906108d1565b600060405180830381855af49150503d80600081146106e0576040519150601f19603f3d011682016040523d82523d6000602084013e6106e5565b606091505b5050905080610176573d806000803e806000fd5b60006107237fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000602082840312156107b857600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461034357600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461080c57600080fd5b919050565b60006020828403121561082357600080fd5b610343826107e8565b60008060006040848603121561084157600080fd5b61084a846107e8565b9250602084013567ffffffffffffffff8082111561086757600080fd5b818601915086601f83011261087b57600080fd5b81358181111561088a57600080fd5b87602082850101111561089c57600080fd5b6020830194508093505050509250925092565b6000602082840312156108c157600080fd5b8151801515811461034357600080fd5b6000825160005b818110156108f257602081860181015185830152016108d8565b50600092019182525091905056fea2646970667358221220cad75e98f01253b84252361ca872b04f3930e2af26a9a45d2650a79aeb34564a64736f6c63430008140033b53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
	deployedBytecode:
		'0x60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146100c45780638da5cb5b146100d7578063f2fde38b1461011157610065565b806301ffc9a71461006f5780633659cfe6146100a457610065565b3661006557005b61006d610131565b005b34801561007b57600080fd5b5061008f61008a3660046107a6565b61017c565b60405190151581526020015b60405180910390f35b3480156100b057600080fd5b5061006d6100bf366004610811565b61034a565b61006d6100d236600461082c565b610421565b3480156100e357600080fd5b506100ec61051c565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200161009b565b34801561011d57600080fd5b5061006d61012c366004610811565b61054b565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e828015610172578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061020f57507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561021c57506001919050565b7fffffffff00000000000000000000000000000000000000000000000000000000808316900361024e57506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa925050508015610336575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201909252610333918101906108af565b60015b6103435750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610405576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064015b60405180910390fd5b61041e816040518060200160405280600081525061060a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104d7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b6105178383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061060a92505050565b505050565b60006105467fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610601576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b61041e816106f9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105175760008373ffffffffffffffffffffffffffffffffffffffff16836040516106a591906108d1565b600060405180830381855af49150503d80600081146106e0576040519150601f19603f3d011682016040523d82523d6000602084013e6106e5565b606091505b5050905080610176573d806000803e806000fd5b60006107237fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000602082840312156107b857600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461034357600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461080c57600080fd5b919050565b60006020828403121561082357600080fd5b610343826107e8565b60008060006040848603121561084157600080fd5b61084a846107e8565b9250602084013567ffffffffffffffff8082111561086757600080fd5b818601915086601f83011261087b57600080fd5b81358181111561088a57600080fd5b87602082850101111561089c57600080fd5b6020830194508093505050509250925092565b6000602082840312156108c157600080fd5b8151801515811461034357600080fd5b6000825160005b818110156108f257602081860181015185830152016108d8565b50600092019182525091905056fea2646970667358221220cad75e98f01253b84252361ca872b04f3930e2af26a9a45d2650a79aeb34564a64736f6c63430008140033',
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
				'@_193': {
					entryPoint: null,
					id: 193,
					parameterSlots: 3,
					returnSlots: 0,
				},
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
					entryPoint: 190,
					id: 313,
					parameterSlots: 2,
					returnSlots: 0,
				},
				'@_setOwner_171': {
					entryPoint: 76,
					id: 171,
					parameterSlots: 1,
					returnSlots: 0,
				},
				abi_decode_address_fromMemory: {
					entryPoint: 416,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				abi_decode_tuple_t_addresst_addresst_bytes_memory_ptr_fromMemory: {
					entryPoint: 505,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 729,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				copy_memory_to_memory_with_cleanup: {
					entryPoint: 467,
					id: null,
					parameterSlots: 3,
					returnSlots: 0,
				},
				panic_error_0x41: {
					entryPoint: 445,
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
				'608060405260405162000c5d38038062000c5d8339810160408190526200002691620001f9565b82828262000034826200004c565b620000408382620000be565b505050505050620002f7565b60006200006660008051602062000c3d8339815191525490565b90508160008051602062000c3d83398151915255816001600160a01b0316816001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc8054908390556040516001600160a01b0380851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156200019b576000836001600160a01b031683604051620001429190620002d9565b600060405180830381855af49150503d80600081146200017f576040519150601f19603f3d011682016040523d82523d6000602084013e62000184565b606091505b505090508062000199573d806000803e806000fd5b505b505050565b80516001600160a01b0381168114620001b857600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620001f0578181015183820152602001620001d6565b50506000910152565b6000806000606084860312156200020f57600080fd5b6200021a84620001a0565b92506200022a60208501620001a0565b60408501519092506001600160401b03808211156200024857600080fd5b818601915086601f8301126200025d57600080fd5b815181811115620002725762000272620001bd565b604051601f8201601f19908116603f011681019083821181831017156200029d576200029d620001bd565b81604052828152896020848701011115620002b757600080fd5b620002ca836020830160208801620001d3565b80955050505050509250925092565b60008251620002ed818460208701620001d3565b9190910192915050565b61093680620003076000396000f3fe60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146100c45780638da5cb5b146100d7578063f2fde38b1461011157610065565b806301ffc9a71461006f5780633659cfe6146100a457610065565b3661006557005b61006d610131565b005b34801561007b57600080fd5b5061008f61008a3660046107a6565b61017c565b60405190151581526020015b60405180910390f35b3480156100b057600080fd5b5061006d6100bf366004610811565b61034a565b61006d6100d236600461082c565b610421565b3480156100e357600080fd5b506100ec61051c565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200161009b565b34801561011d57600080fd5b5061006d61012c366004610811565b61054b565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e828015610172578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061020f57507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561021c57506001919050565b7fffffffff00000000000000000000000000000000000000000000000000000000808316900361024e57506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa925050508015610336575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201909252610333918101906108af565b60015b6103435750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610405576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064015b60405180910390fd5b61041e816040518060200160405280600081525061060a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104d7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b6105178383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061060a92505050565b505050565b60006105467fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610601576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b61041e816106f9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105175760008373ffffffffffffffffffffffffffffffffffffffff16836040516106a591906108d1565b600060405180830381855af49150503d80600081146106e0576040519150601f19603f3d011682016040523d82523d6000602084013e6106e5565b606091505b5050905080610176573d806000803e806000fd5b60006107237fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000602082840312156107b857600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461034357600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461080c57600080fd5b919050565b60006020828403121561082357600080fd5b610343826107e8565b60008060006040848603121561084157600080fd5b61084a846107e8565b9250602084013567ffffffffffffffff8082111561086757600080fd5b818601915086601f83011261087b57600080fd5b81358181111561088a57600080fd5b87602082850101111561089c57600080fd5b6020830194508093505050509250925092565b6000602082840312156108c157600080fd5b8151801515811461034357600080fd5b6000825160005b818110156108f257602081860181015185830152016108d8565b50600092019182525091905056fea2646970667358221220cad75e98f01253b84252361ca872b04f3930e2af26a9a45d2650a79aeb34564a64736f6c63430008140033b53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH3 0xC5D CODESIZE SUB DUP1 PUSH3 0xC5D DUP4 CODECOPY DUP2 ADD PUSH1 0x40 DUP2 SWAP1 MSTORE PUSH3 0x26 SWAP2 PUSH3 0x1F9 JUMP JUMPDEST DUP3 DUP3 DUP3 PUSH3 0x34 DUP3 PUSH3 0x4C JUMP JUMPDEST PUSH3 0x40 DUP4 DUP3 PUSH3 0xBE JUMP JUMPDEST POP POP POP POP POP POP PUSH3 0x2F7 JUMP JUMPDEST PUSH1 0x0 PUSH3 0x66 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xC3D DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xC3D DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SSTORE DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH3 0x19B JUMPI PUSH1 0x0 DUP4 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP4 PUSH1 0x40 MLOAD PUSH3 0x142 SWAP2 SWAP1 PUSH3 0x2D9 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH3 0x17F JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH3 0x184 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH3 0x199 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST POP JUMPDEST POP POP POP JUMP JUMPDEST DUP1 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP2 AND DUP2 EQ PUSH3 0x1B8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH3 0x1F0 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH3 0x1D6 JUMP JUMPDEST POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x60 DUP5 DUP7 SUB SLT ISZERO PUSH3 0x20F JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x21A DUP5 PUSH3 0x1A0 JUMP JUMPDEST SWAP3 POP PUSH3 0x22A PUSH1 0x20 DUP6 ADD PUSH3 0x1A0 JUMP JUMPDEST PUSH1 0x40 DUP6 ADD MLOAD SWAP1 SWAP3 POP PUSH1 0x1 PUSH1 0x1 PUSH1 0x40 SHL SUB DUP1 DUP3 GT ISZERO PUSH3 0x248 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH3 0x25D JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP2 DUP2 GT ISZERO PUSH3 0x272 JUMPI PUSH3 0x272 PUSH3 0x1BD JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH1 0x1F NOT SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH3 0x29D JUMPI PUSH3 0x29D PUSH3 0x1BD JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP10 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH3 0x2B7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x2CA DUP4 PUSH1 0x20 DUP4 ADD PUSH1 0x20 DUP9 ADD PUSH3 0x1D3 JUMP JUMPDEST DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH3 0x2ED DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH3 0x1D3 JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH2 0x936 DUP1 PUSH3 0x307 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0xC4 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0xD7 JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x111 JUMPI PUSH2 0x65 JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0x6F JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0xA4 JUMPI PUSH2 0x65 JUMP JUMPDEST CALLDATASIZE PUSH2 0x65 JUMPI STOP JUMPDEST PUSH2 0x6D PUSH2 0x131 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x7B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x8F PUSH2 0x8A CALLDATASIZE PUSH1 0x4 PUSH2 0x7A6 JUMP JUMPDEST PUSH2 0x17C JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xB0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0xBF CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x34A JUMP JUMPDEST PUSH2 0x6D PUSH2 0xD2 CALLDATASIZE PUSH1 0x4 PUSH2 0x82C JUMP JUMPDEST PUSH2 0x421 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE3 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xEC PUSH2 0x51C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x9B JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x11D JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0x12C CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x54B JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x172 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x20F JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x21C JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND SWAP1 SUB PUSH2 0x24E JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x336 JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x333 SWAP2 DUP2 ADD SWAP1 PUSH2 0x8AF JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x343 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x405 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0x41E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x60A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x4D7 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x517 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x60A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x546 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x601 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x41E DUP2 PUSH2 0x6F9 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x517 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x6A5 SWAP2 SWAP1 PUSH2 0x8D1 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x6E0 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x6E5 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x176 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x723 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x7B8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x80C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x823 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x343 DUP3 PUSH2 0x7E8 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x841 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x84A DUP5 PUSH2 0x7E8 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x867 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x87B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x88A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x89C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x8C1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x8F2 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x8D8 JUMP JUMPDEST POP PUSH1 0x0 SWAP3 ADD SWAP2 DUP3 MSTORE POP SWAP2 SWAP1 POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xCA 0xD7 0x5E SWAP9 CREATE SLT MSTORE8 0xB8 TIMESTAMP MSTORE CALLDATASIZE SHR 0xA8 PUSH19 0xB04F3930E2AF26A9A45D2650A79AEB34564A64 PUSH20 0x6F6C63430008140033B53127684A568B3173AE13 0xB9 0xF8 0xA6 ADD PUSH15 0x243E63B6E8EE1178D6A717850B5D61 SUB ',
			sourceMap:
				'176:268:1:-:0;;;229:169;;;;;;;;;;;;;;;;;;:::i;:::-;349:21;372:12;386:4;907:23:0;372:12:1;907:9:0;:23::i;:::-;940:47;959:21;982:4;940:18;:47::i;:::-;805:189;;;229:169:1;;;176:268;;3408:346:0;3464:21;3488:8;-1:-1:-1;;;;;;;;;;;3313:73:0;;3136:266;3488:8;3464:32;;3669:8;-1:-1:-1;;;;;;;;;;;3594:84:0;3738:8;-1:-1:-1;;;;;3702:45:0;3723:13;-1:-1:-1;;;;;3702:45:0;;;;;;;;;;;3454:300;3408:346;:::o;1634:1067:3:-;1887:66;1881:73;;2062:93;;;;2180:69;;-1:-1:-1;;;;;2180:69:3;;;;;;;;;;1727:30;;2180:69;2264:11;;:15;2260:435;;2296:12;2313:17;-1:-1:-1;;;;;2313:30:3;2344:4;2313:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2295:54;;;2368:7;2363:322;;2534:16;2592:14;2589:1;;2571:36;2638:14;2589:1;2628:25;2363:322;2281:414;2260:435;1717:984;1634:1067;;:::o;14:177:5:-;93:13;;-1:-1:-1;;;;;135:31:5;;125:42;;115:70;;181:1;178;171:12;115:70;14:177;;;:::o;196:127::-;257:10;252:3;248:20;245:1;238:31;288:4;285:1;278:15;312:4;309:1;302:15;328:250;413:1;423:113;437:6;434:1;431:13;423:113;;;513:11;;;507:18;494:11;;;487:39;459:2;452:10;423:113;;;-1:-1:-1;;570:1:5;552:16;;545:27;328:250::o;583:1066::-;680:6;688;696;749:2;737:9;728:7;724:23;720:32;717:52;;;765:1;762;755:12;717:52;788:40;818:9;788:40;:::i;:::-;778:50;;847:49;892:2;881:9;877:18;847:49;:::i;:::-;940:2;925:18;;919:25;837:59;;-1:-1:-1;;;;;;993:14:5;;;990:34;;;1020:1;1017;1010:12;990:34;1058:6;1047:9;1043:22;1033:32;;1103:7;1096:4;1092:2;1088:13;1084:27;1074:55;;1125:1;1122;1115:12;1074:55;1154:2;1148:9;1176:2;1172;1169:10;1166:36;;;1182:18;;:::i;:::-;1257:2;1251:9;1225:2;1311:13;;-1:-1:-1;;1307:22:5;;;1331:2;1303:31;1299:40;1287:53;;;1355:18;;;1375:22;;;1352:46;1349:72;;;1401:18;;:::i;:::-;1441:10;1437:2;1430:22;1476:2;1468:6;1461:18;1516:7;1511:2;1506;1502;1498:11;1494:20;1491:33;1488:53;;;1537:1;1534;1527:12;1488:53;1550:68;1615:2;1610;1602:6;1598:15;1593:2;1589;1585:11;1550:68;:::i;:::-;1637:6;1627:16;;;;;;;583:1066;;;;;:::o;1654:287::-;1783:3;1821:6;1815:13;1837:66;1896:6;1891:3;1884:4;1876:6;1872:17;1837:66;:::i;:::-;1919:16;;;;;1654:287;-1:-1:-1;;1654:287:5:o;:::-;176:268:1;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@_198': {
					entryPoint: null,
					id: 198,
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
					entryPoint: 305,
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
					entryPoint: 1546,
					id: 313,
					parameterSlots: 2,
					returnSlots: 0,
				},
				'@_setOwner_171': {
					entryPoint: 1785,
					id: 171,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@owner_47': {
					entryPoint: 1308,
					id: 47,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@supportsInterface_94': {
					entryPoint: 380,
					id: 94,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@transferOwnership_106': {
					entryPoint: 1355,
					id: 106,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@upgradeToAndCall_134': {
					entryPoint: 1057,
					id: 134,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@upgradeTo_119': {
					entryPoint: 842,
					id: 119,
					parameterSlots: 1,
					returnSlots: 0,
				},
				abi_decode_address: {
					entryPoint: 2024,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				abi_decode_tuple_t_address: {
					entryPoint: 2065,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_addresst_bytes_calldata_ptr: {
					entryPoint: 2092,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_decode_tuple_t_bool_fromMemory: {
					entryPoint: 2223,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_bytes4: {
					entryPoint: 1958,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 2257,
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
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:3128:5',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:5',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '83:263:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '129:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '138:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '141:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '131:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '131:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '131:12:5',
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
																src: '104:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '113:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '100:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '100:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '125:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '96:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '96:32:5',
											},
											nodeType: 'YulIf',
											src: '93:52:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '154:36:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '180:9:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '167:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '167:23:5',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '158:5:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '300:16:5',
												statements: [
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
																	src: '312:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '302:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '302:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '302:12:5',
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
																src: '212:5:5',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '223:5:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '230:66:5',
																		type: '',
																		value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '219:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '219:78:5',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '209:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '209:89:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '202:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '202:97:5',
											},
											nodeType: 'YulIf',
											src: '199:117:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '325:15:5',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '335:5:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '325:6:5',
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
										src: '49:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '60:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '72:6:5',
										type: '',
									},
								],
								src: '14:332:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '446:92:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '456:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '468:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '479:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '464:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '464:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '456:4:5',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '498:9:5',
													},
													{
														arguments: [
															{
																arguments: [
																	{
																		name: 'value0',
																		nodeType: 'YulIdentifier',
																		src: '523:6:5',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '516:6:5',
																},
																nodeType: 'YulFunctionCall',
																src: '516:14:5',
															},
														],
														functionName: {
															name: 'iszero',
															nodeType: 'YulIdentifier',
															src: '509:6:5',
														},
														nodeType: 'YulFunctionCall',
														src: '509:22:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '491:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '491:41:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '491:41:5',
										},
									],
								},
								name: 'abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '415:9:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '426:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '437:4:5',
										type: '',
									},
								],
								src: '351:187:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '592:147:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '602:29:5',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '624:6:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '611:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '611:20:5',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '602:5:5',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '717:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '726:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '729:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '719:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '719:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '719:12:5',
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
																src: '653:5:5',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '664:5:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '671:42:5',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '660:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '660:54:5',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '650:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '650:65:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '643:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '643:73:5',
											},
											nodeType: 'YulIf',
											src: '640:93:5',
										},
									],
								},
								name: 'abi_decode_address',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '571:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '582:5:5',
										type: '',
									},
								],
								src: '543:196:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '814:116:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '860:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '869:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '872:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '862:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '862:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '862:12:5',
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
																src: '835:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '844:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '831:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '831:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '856:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '827:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '827:32:5',
											},
											nodeType: 'YulIf',
											src: '824:52:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '885:39:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '914:9:5',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '895:18:5',
												},
												nodeType: 'YulFunctionCall',
												src: '895:29:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '885:6:5',
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
										src: '780:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '791:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '803:6:5',
										type: '',
									},
								],
								src: '744:186:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1041:559:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1087:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1096:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1099:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1089:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1089:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1089:12:5',
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
																src: '1062:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1071:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1058:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1058:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1083:2:5',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1054:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1054:32:5',
											},
											nodeType: 'YulIf',
											src: '1051:52:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '1112:39:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1141:9:5',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '1122:18:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1122:29:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1112:6:5',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1160:46:5',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1191:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1202:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1187:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1187:18:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1174:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1174:32:5',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '1164:6:5',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1215:28:5',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1225:18:5',
												type: '',
												value: '0xffffffffffffffff',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1219:2:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1270:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1279:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1282:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1272:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1272:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1272:12:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1258:6:5',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1266:2:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1255:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1255:14:5',
											},
											nodeType: 'YulIf',
											src: '1252:34:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1295:32:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1309:9:5',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1320:6:5',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1305:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1305:22:5',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1299:2:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1375:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1384:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1387:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1377:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1377:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1377:12:5',
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
																		src: '1354:2:5',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1358:4:5',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1350:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1350:13:5',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '1365:7:5',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '1346:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1346:27:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1339:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1339:35:5',
											},
											nodeType: 'YulIf',
											src: '1336:55:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1400:30:5',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1427:2:5',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1414:12:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1414:16:5',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1404:6:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1457:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1466:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1469:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1459:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1459:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1459:12:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1445:6:5',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1453:2:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1442:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1442:14:5',
											},
											nodeType: 'YulIf',
											src: '1439:34:5',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1523:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1532:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1535:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1525:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '1525:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '1525:12:5',
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
																		src: '1496:2:5',
																	},
																	{
																		name: 'length',
																		nodeType: 'YulIdentifier',
																		src: '1500:6:5',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1492:3:5',
																},
																nodeType: 'YulFunctionCall',
																src: '1492:15:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1509:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1488:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1488:24:5',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1514:7:5',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1485:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1485:37:5',
											},
											nodeType: 'YulIf',
											src: '1482:57:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '1548:21:5',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1562:2:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1566:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1558:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1558:11:5',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1548:6:5',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1578:16:5',
											value: {
												name: 'length',
												nodeType: 'YulIdentifier',
												src: '1588:6:5',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1578:6:5',
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
										src: '991:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1002:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1014:6:5',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '1022:6:5',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '1030:6:5',
										type: '',
									},
								],
								src: '935:665:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1706:125:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '1716:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1728:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1739:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1724:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1724:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1716:4:5',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1758:9:5',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '1773:6:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1781:42:5',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1769:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1769:55:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1751:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1751:74:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '1751:74:5',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1675:9:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1686:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1697:4:5',
										type: '',
									},
								],
								src: '1605:226:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1935:149:5',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '1945:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1957:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1968:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1953:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1953:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1945:4:5',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1987:9:5',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2002:6:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2010:66:5',
																type: '',
																value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1998:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '1998:79:5',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1980:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '1980:98:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '1980:98:5',
										},
									],
								},
								name: 'abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1904:9:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1915:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1926:4:5',
										type: '',
									},
								],
								src: '1836:248:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2167:199:5',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '2213:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2222:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2225:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2215:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '2215:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '2215:12:5',
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
																src: '2188:7:5',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2197:9:5',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '2184:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2184:23:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2209:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '2180:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2180:32:5',
											},
											nodeType: 'YulIf',
											src: '2177:52:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2238:29:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2257:9:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2251:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2251:16:5',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '2242:5:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2320:16:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2329:1:5',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2332:1:5',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2322:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '2322:12:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '2322:12:5',
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
																src: '2289:5:5',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'value',
																				nodeType: 'YulIdentifier',
																				src: '2310:5:5',
																			},
																		],
																		functionName: {
																			name: 'iszero',
																			nodeType: 'YulIdentifier',
																			src: '2303:6:5',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '2303:13:5',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '2296:6:5',
																},
																nodeType: 'YulFunctionCall',
																src: '2296:21:5',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '2286:2:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2286:32:5',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '2279:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2279:40:5',
											},
											nodeType: 'YulIf',
											src: '2276:60:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '2345:15:5',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '2355:5:5',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '2345:6:5',
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
										src: '2133:9:5',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2144:7:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2156:6:5',
										type: '',
									},
								],
								src: '2089:277:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2545:164:5',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2562:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2573:2:5',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2555:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2555:21:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2555:21:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2596:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2607:2:5',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2592:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2592:18:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2612:2:5',
														type: '',
														value: '14',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2585:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2585:30:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2585:30:5',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2635:9:5',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2646:2:5',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2631:3:5',
														},
														nodeType: 'YulFunctionCall',
														src: '2631:18:5',
													},
													{
														hexValue: '4e4f545f415554484f52495a4544',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2651:16:5',
														type: '',
														value: 'NOT_AUTHORIZED',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2624:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2624:44:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '2624:44:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '2677:26:5',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2689:9:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2700:2:5',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2685:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2685:18:5',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2677:4:5',
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
										src: '2522:9:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2536:4:5',
										type: '',
									},
								],
								src: '2371:338:5',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2851:275:5',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '2861:27:5',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2881:6:5',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2875:5:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2875:13:5',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '2865:6:5',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2897:10:5',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '2906:1:5',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '2901:1:5',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2968:77:5',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'pos',
																			nodeType: 'YulIdentifier',
																			src: '2993:3:5',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '2998:1:5',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2989:3:5',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2989:11:5',
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
																							src: '3016:6:5',
																						},
																						{
																							name: 'i',
																							nodeType: 'YulIdentifier',
																							src: '3024:1:5',
																						},
																					],
																					functionName: {
																						name: 'add',
																						nodeType: 'YulIdentifier',
																						src: '3012:3:5',
																					},
																					nodeType: 'YulFunctionCall',
																					src: '3012:14:5',
																				},
																				{
																					kind: 'number',
																					nodeType: 'YulLiteral',
																					src: '3028:4:5',
																					type: '',
																					value: '0x20',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '3008:3:5',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '3008:25:5',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '3002:5:5',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3002:32:5',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2982:6:5',
															},
															nodeType: 'YulFunctionCall',
															src: '2982:53:5',
														},
														nodeType: 'YulExpressionStatement',
														src: '2982:53:5',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '2927:1:5',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2930:6:5',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '2924:2:5',
												},
												nodeType: 'YulFunctionCall',
												src: '2924:13:5',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '2938:21:5',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '2940:17:5',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '2949:1:5',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2952:4:5',
																	type: '',
																	value: '0x20',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2945:3:5',
															},
															nodeType: 'YulFunctionCall',
															src: '2945:12:5',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '2940:1:5',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '2920:3:5',
												statements: [],
											},
											src: '2916:129:5',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3054:26:5',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3068:3:5',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3073:6:5',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3064:3:5',
												},
												nodeType: 'YulFunctionCall',
												src: '3064:16:5',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '3058:2:5',
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
														src: '3096:2:5',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3100:1:5',
														type: '',
														value: '0',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3089:6:5',
												},
												nodeType: 'YulFunctionCall',
												src: '3089:13:5',
											},
											nodeType: 'YulExpressionStatement',
											src: '3089:13:5',
										},
										{
											nodeType: 'YulAssignment',
											src: '3111:9:5',
											value: {
												name: '_1',
												nodeType: 'YulIdentifier',
												src: '3118:2:5',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '3111:3:5',
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
										src: '2827:3:5',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2832:6:5',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '2843:3:5',
										type: '',
									},
								],
								src: '2714:412:5',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_tuple_t_bytes4(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffff00000000000000000000000000000000000000000000000000000000))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, iszero(iszero(value0)))\n    }\n    function abi_decode_address(offset) -> value\n    {\n        value := calldataload(offset)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n    }\n    function abi_decode_tuple_t_addresst_bytes_calldata_ptr(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n        let offset := calldataload(add(headStart, 32))\n        let _1 := 0xffffffffffffffff\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let length := calldataload(_2)\n        if gt(length, _1) { revert(0, 0) }\n        if gt(add(add(_2, length), 32), dataEnd) { revert(0, 0) }\n        value1 := add(_2, 32)\n        value2 := length\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffff00000000000000000000000000000000000000000000000000000000))\n    }\n    function abi_decode_tuple_t_bool_fromMemory(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := mload(headStart)\n        if iszero(eq(value, iszero(iszero(value)))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_stringliteral_e7e213d5e2bee0acc2c7bf8bfda19ef0cae82e7b8c997e7e898919269971e7c4__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 14)\n        mstore(add(headStart, 64), "NOT_AUTHORIZED")\n        tail := add(headStart, 96)\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 0x20) }\n        {\n            mstore(add(pos, i), mload(add(add(value0, i), 0x20)))\n        }\n        let _1 := add(pos, length)\n        mstore(_1, 0)\n        end := _1\n    }\n}',
					id: 5,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			object:
				'60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146100c45780638da5cb5b146100d7578063f2fde38b1461011157610065565b806301ffc9a71461006f5780633659cfe6146100a457610065565b3661006557005b61006d610131565b005b34801561007b57600080fd5b5061008f61008a3660046107a6565b61017c565b60405190151581526020015b60405180910390f35b3480156100b057600080fd5b5061006d6100bf366004610811565b61034a565b61006d6100d236600461082c565b610421565b3480156100e357600080fd5b506100ec61051c565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200161009b565b34801561011d57600080fd5b5061006d61012c366004610811565b61054b565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e828015610172578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061020f57507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561021c57506001919050565b7fffffffff00000000000000000000000000000000000000000000000000000000808316900361024e57506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa925050508015610336575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201909252610333918101906108af565b60015b6103435750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610405576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064015b60405180910390fd5b61041e816040518060200160405280600081525061060a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104d7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b6105178383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061060a92505050565b505050565b60006105467fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610601576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b61041e816106f9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105175760008373ffffffffffffffffffffffffffffffffffffffff16836040516106a591906108d1565b600060405180830381855af49150503d80600081146106e0576040519150601f19603f3d011682016040523d82523d6000602084013e6106e5565b606091505b5050905080610176573d806000803e806000fd5b60006107237fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000602082840312156107b857600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461034357600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461080c57600080fd5b919050565b60006020828403121561082357600080fd5b610343826107e8565b60008060006040848603121561084157600080fd5b61084a846107e8565b9250602084013567ffffffffffffffff8082111561086757600080fd5b818601915086601f83011261087b57600080fd5b81358181111561088a57600080fd5b87602082850101111561089c57600080fd5b6020830194508093505050509250925092565b6000602082840312156108c157600080fd5b8151801515811461034357600080fd5b6000825160005b818110156108f257602081860181015185830152016108d8565b50600092019182525091905056fea2646970667358221220cad75e98f01253b84252361ca872b04f3930e2af26a9a45d2650a79aeb34564a64736f6c63430008140033',
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0xC4 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0xD7 JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x111 JUMPI PUSH2 0x65 JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0x6F JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0xA4 JUMPI PUSH2 0x65 JUMP JUMPDEST CALLDATASIZE PUSH2 0x65 JUMPI STOP JUMPDEST PUSH2 0x6D PUSH2 0x131 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x7B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x8F PUSH2 0x8A CALLDATASIZE PUSH1 0x4 PUSH2 0x7A6 JUMP JUMPDEST PUSH2 0x17C JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xB0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0xBF CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x34A JUMP JUMPDEST PUSH2 0x6D PUSH2 0xD2 CALLDATASIZE PUSH1 0x4 PUSH2 0x82C JUMP JUMPDEST PUSH2 0x421 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE3 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xEC PUSH2 0x51C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x9B JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x11D JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0x12C CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x54B JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x172 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x20F JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x21C JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND SWAP1 SUB PUSH2 0x24E JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x336 JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x333 SWAP2 DUP2 ADD SWAP1 PUSH2 0x8AF JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x343 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x405 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0x41E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x60A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x4D7 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x517 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x60A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x546 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x601 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x41E DUP2 PUSH2 0x6F9 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x517 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x6A5 SWAP2 SWAP1 PUSH2 0x8D1 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x6E0 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x6E5 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x176 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x723 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x7B8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x80C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x823 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x343 DUP3 PUSH2 0x7E8 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x841 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x84A DUP5 PUSH2 0x7E8 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x867 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x87B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x88A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x89C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x8C1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x8F2 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x8D8 JUMP JUMPDEST POP PUSH1 0x0 SWAP3 ADD SWAP2 DUP3 MSTORE POP SWAP2 SWAP1 POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xCA 0xD7 0x5E SWAP9 CREATE SLT MSTORE8 0xB8 TIMESTAMP MSTORE CALLDATASIZE SHR 0xA8 PUSH19 0xB04F3930E2AF26A9A45D2650A79AEB34564A64 PUSH20 0x6F6C634300081400330000000000000000000000 ',
			sourceMap:
				'176:268:1:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;803:11:3;:9;:11::i;:::-;176:268:1;1312:877:0;;;;;;;;;;-1:-1:-1;1312:877:0;;;;;:::i;:::-;;:::i;:::-;;;516:14:5;;509:22;491:41;;479:2;464:18;1312:877:0;;;;;;;;2301:123;;;;;;;;;;-1:-1:-1;2301:123:0;;;;;:::i;:::-;;:::i;2430:161::-;;;;;;:::i;:::-;;:::i;1225:81::-;;;;;;;;;;;;;:::i;:::-;;;1781:42:5;1769:55;;;1751:74;;1739:2;1724:18;1225:81:0;1605:226:5;2195:100:0;;;;;;;;;;-1:-1:-1;2195:100:0;;;;;:::i;:::-;;:::i;1044:584:3:-;1207:66;1201:73;1305:3;1310:14;1305:3;;1287:38;1305:3;;1310:14;1305:3;1373:21;1366:5;1353:69;1338:84;;1448:16;1498:5;1305:3;;1477:27;1524:7;1544:27;;;;1604:5;1305:3;1594:16;1544:27;1563:5;1305:3;1553:16;1517:95;;;;;1044:584::o;1312:877:0:-;1373:4;1393:16;;;;;;:36;;-1:-1:-1;1413:16:0;;;;;1393:36;1389:78;;;-1:-1:-1;1452:4:0;;1312:877;-1:-1:-1;1312:877:0:o;1389:78::-;1480:16;;;;;;1476:59;;-1:-1:-1;1519:5:0;;1312:877;-1:-1:-1;1312:877:0:o;1476:59::-;1688:66;1682:73;2040:36;;;;;2010:66:5;1998:79;;2040:36:0;;;1980:98:5;2040:32:0;;;;;;1953:18:5;;2040:36:0;;;;;;;;;;;;;;;;;;-1:-1:-1;2040:36:0;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;2036:147;;-1:-1:-1;2167:5:0;;1312:877;-1:-1:-1;;1312:877:0:o;2036:147::-;2121:7;1312:877;-1:-1:-1;;;1312:877:0:o;2301:123::-;3319:66;3313:73;2854:22;;:10;:22;;;2846:49;;;;;;;2573:2:5;2846:49:0;;;2555:21:5;2612:2;2592:18;;;2585:30;2651:16;2631:18;;;2624:44;2685:18;;2846:49:0;;;;;;;;;2376:41:::1;2395:17;2376:41;;;;;;;;;;;::::0;:18:::1;:41::i;:::-;2301:123:::0;:::o;2430:161::-;3319:66;3313:73;2854:22;;:10;:22;;;2846:49;;;;;;;2573:2:5;2846:49:0;;;2555:21:5;2612:2;2592:18;;;2585:30;2651:16;2631:18;;;2624:44;2685:18;;2846:49:0;2371:338:5;2846:49:0;2541:43:::1;2560:17;2579:4;;2541:43;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::0;::::1;::::0;;;;-1:-1:-1;2541:18:0::1;::::0;-1:-1:-1;;;2541:43:0:i:1;:::-;2430:161:::0;;;:::o;1225:81::-;1265:7;1291:8;3319:66;3313:73;;3136:266;1291:8;1284:15;;1225:81;:::o;2195:100::-;3319:66;3313:73;2854:22;;:10;:22;;;2846:49;;;;;;;2573:2:5;2846:49:0;;;2555:21:5;2612:2;2592:18;;;2585:30;2651:16;2631:18;;;2624:44;2685:18;;2846:49:0;2371:338:5;2846:49:0;2269:19:::1;2279:8;2269:9;:19::i;1634:1067:3:-:0;1887:66;1881:73;;2062:93;;;;2180:69;;;;;;;;;;;;;1727:30;;2180:69;2264:11;;:15;2260:435;;2296:12;2313:17;:30;;2344:4;2313:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2295:54;;;2368:7;2363:322;;2534:16;2592:14;2589:1;;2571:36;2638:14;2589:1;2628:25;3408:346:0;3464:21;3488:8;3319:66;3313:73;;3136:266;3488:8;3464:32;;3669:8;3601:66;3594:84;3738:8;3702:45;;3723:13;3702:45;;;;;;;;;;;;3454:300;3408:346;:::o;14:332:5:-;72:6;125:2;113:9;104:7;100:23;96:32;93:52;;;141:1;138;131:12;93:52;180:9;167:23;230:66;223:5;219:78;212:5;209:89;199:117;;312:1;309;302:12;543:196;611:20;;671:42;660:54;;650:65;;640:93;;729:1;726;719:12;640:93;543:196;;;:::o;744:186::-;803:6;856:2;844:9;835:7;831:23;827:32;824:52;;;872:1;869;862:12;824:52;895:29;914:9;895:29;:::i;935:665::-;1014:6;1022;1030;1083:2;1071:9;1062:7;1058:23;1054:32;1051:52;;;1099:1;1096;1089:12;1051:52;1122:29;1141:9;1122:29;:::i;:::-;1112:39;;1202:2;1191:9;1187:18;1174:32;1225:18;1266:2;1258:6;1255:14;1252:34;;;1282:1;1279;1272:12;1252:34;1320:6;1309:9;1305:22;1295:32;;1365:7;1358:4;1354:2;1350:13;1346:27;1336:55;;1387:1;1384;1377:12;1336:55;1427:2;1414:16;1453:2;1445:6;1442:14;1439:34;;;1469:1;1466;1459:12;1439:34;1514:7;1509:2;1500:6;1496:2;1492:15;1488:24;1485:37;1482:57;;;1535:1;1532;1525:12;1482:57;1566:2;1562;1558:11;1548:21;;1588:6;1578:16;;;;;935:665;;;;;:::o;2089:277::-;2156:6;2209:2;2197:9;2188:7;2184:23;2180:32;2177:52;;;2225:1;2222;2215:12;2177:52;2257:9;2251:16;2310:5;2303:13;2296:21;2289:5;2286:32;2276:60;;2332:1;2329;2322:12;2714:412;2843:3;2881:6;2875:13;2906:1;2916:129;2930:6;2927:1;2924:13;2916:129;;;3028:4;3012:14;;;3008:25;;3002:32;2989:11;;;2982:53;2945:12;2916:129;;;-1:-1:-1;3100:1:5;3064:16;;3089:13;;;-1:-1:-1;3064:16:5;2714:412;-1:-1:-1;2714:412:5:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '471600',
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
		'{"compiler":{"version":"0.8.20+commit.a1b79de6"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"implementationAddress","type":"address"},{"internalType":"address","name":"ownerAddress","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousImplementation","type":"address"},{"indexed":true,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ProxyImplementationUpdated","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"id","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}],"devdoc":{"kind":"dev","methods":{},"version":1},"userdoc":{"kind":"user","methods":{},"notice":"Proxy implementing ERC173 for ownership management that accept ETH via receive","version":1}},"settings":{"compilationTarget":{"solc_0_8/ERC173/ERC173ProxyWithReceive.sol":"ERC173ProxyWithReceive"},"evmVersion":"paris","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0_8/ERC173/ERC173Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"../ERC1967/Proxy.sol\\";\\n\\ninterface ERC165 {\\n    function supportsInterface(bytes4 id) external view returns (bool);\\n}\\n\\n///@notice Proxy implementing ERC173 for ownership management\\ncontract ERC173Proxy is Proxy {\\n    // --------------------------------------------------------------------------------------------\\n    // Events\\n    // --------------------------------------------------------------------------------------------\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Constructor\\n    // --------------------------------------------------------------------------------------------\\n\\n    constructor(address implementationAddress, address ownerAddress, bytes memory data) payable {\\n        _setOwner(ownerAddress);\\n        _setImplementation(implementationAddress, data);\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Public Interface\\n    // --------------------------------------------------------------------------------------------\\n\\n    function owner() external view returns (address) {\\n        return _owner();\\n    }\\n\\n    function supportsInterface(bytes4 id) external view returns (bool) {\\n        if (id == 0x01ffc9a7 || id == 0x7f5828d0) {\\n            return true;\\n        }\\n        if (id == 0xFFFFFFFF) {\\n            return false;\\n        }\\n\\n        ERC165 implementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            implementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // Technically this is not standard compliant as ERC-165 require 30,000 gas which that call cannot ensure\\n        // because it is itself inside `supportsInterface` that might only get 30,000 gas.\\n        // In practise this is unlikely to be an issue.\\n        try implementation.supportsInterface(id) returns (bool support) {\\n            return support;\\n        } catch {\\n            return false;\\n        }\\n    }\\n\\n    function transferOwnership(address newOwner) external onlyOwner {\\n        _setOwner(newOwner);\\n    }\\n\\n    function upgradeTo(address newImplementation) external onlyOwner {\\n        _setImplementation(newImplementation, \\"\\");\\n    }\\n\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable onlyOwner {\\n        _setImplementation(newImplementation, data);\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Modifiers\\n    // --------------------------------------------------------------------------------------------\\n\\n    modifier onlyOwner() {\\n        require(msg.sender == _owner(), \\"NOT_AUTHORIZED\\");\\n        _;\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Internal\\n    // --------------------------------------------------------------------------------------------\\n\\n    function _owner() internal view returns (address adminAddress) {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)\\n        }\\n    }\\n\\n    function _setOwner(address newOwner) internal {\\n        address previousOwner = _owner();\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, newOwner)\\n        }\\n        emit OwnershipTransferred(previousOwner, newOwner);\\n    }\\n}\\n","keccak256":"0xe66459b598ec609af81ef013a7cbf4cc12eea4157190882fe15c4a3f2037b8d6","license":"MIT"},"solc_0_8/ERC173/ERC173ProxyWithReceive.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./ERC173Proxy.sol\\";\\n\\n///@notice Proxy implementing ERC173 for ownership management that accept ETH via receive\\ncontract ERC173ProxyWithReceive is ERC173Proxy {\\n    constructor(address implementationAddress, address ownerAddress, bytes memory data)\\n        payable\\n        ERC173Proxy(implementationAddress, ownerAddress, data)\\n    {}\\n\\n    receive() external payable override {}\\n}\\n","keccak256":"0x438c4be4faaedea50f5fbbd03c26c99c03ce6435a539bd192d42271102633515","license":"MIT"},"solc_0_8/ERC1967/Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n// ERC-1967\\nabstract contract Proxy {\\n    // --------------------------------------------------------------------------------------------\\n    // Events\\n    // --------------------------------------------------------------------------------------------\\n\\n    event ProxyImplementationUpdated(address indexed previousImplementation, address indexed newImplementation);\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Public Interface\\n    // --------------------------------------------------------------------------------------------\\n\\n    receive() external payable virtual {\\n        revert(\\"ETHER_REJECTED\\"); // explicit reject by default\\n    }\\n\\n    fallback() external payable {\\n        _fallback();\\n    }\\n\\n    // --------------------------------------------------------------------------------------------\\n    // Internal\\n    // --------------------------------------------------------------------------------------------\\n\\n    function _fallback() internal {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            let implementationAddress := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n            calldatacopy(0x0, 0x0, calldatasize())\\n            let success := delegatecall(gas(), implementationAddress, 0x0, calldatasize(), 0, 0)\\n            let retSz := returndatasize()\\n            returndatacopy(0, 0, retSz)\\n            switch success\\n            case 0 { revert(0, retSz) }\\n            default { return(0, retSz) }\\n        }\\n    }\\n\\n    function _setImplementation(address newImplementation, bytes memory data) internal {\\n        address previousImplementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            previousImplementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, newImplementation)\\n        }\\n\\n        emit ProxyImplementationUpdated(previousImplementation, newImplementation);\\n\\n        if (data.length > 0) {\\n            (bool success,) = newImplementation.delegatecall(data);\\n            if (!success) {\\n                assembly {\\n                    // This assembly ensure the revert contains the exact string data\\n                    let returnDataSize := returndatasize()\\n                    returndatacopy(0, 0, returnDataSize)\\n                    revert(0, returnDataSize)\\n                }\\n            }\\n        }\\n    }\\n}\\n","keccak256":"0x7b91e396821b404ffd824b60396d4f561acb5e7e8ce611b5444dfe503cc693e4","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {},
		notice: 'Proxy implementing ERC173 for ownership management that accept ETH via receive',
		version: 1,
	},
} as const;
