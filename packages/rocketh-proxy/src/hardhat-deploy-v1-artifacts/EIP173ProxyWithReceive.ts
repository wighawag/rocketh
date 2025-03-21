export default {
	contractName: 'EIP173ProxyWithReceive',
	sourceName: 'solc_0.8/proxy/EIP173ProxyWithReceive.sol',
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
		'0x608060405260405162000c7238038062000c72833981016040819052620000269162000202565b82828262000034826200004c565b620000408382620000be565b50505050505062000300565b60006200006660008051602062000c528339815191525490565b90508160008051602062000c5283398151915255816001600160a01b0316816001600160a01b03167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc8054908390556040516001600160a01b0380851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156200019b576000836001600160a01b031683604051620001429190620002e2565b600060405180830381855af49150503d80600081146200017f576040519150601f19603f3d011682016040523d82523d6000602084013e62000184565b606091505b505090508062000199573d806000803e806000fd5b505b505050565b80516001600160a01b0381168114620001b857600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620001f0578181015183820152602001620001d6565b83811115620001995750506000910152565b6000806000606084860312156200021857600080fd5b6200022384620001a0565b92506200023360208501620001a0565b60408501519092506001600160401b03808211156200025157600080fd5b818601915086601f8301126200026657600080fd5b8151818111156200027b576200027b620001bd565b604051601f8201601f19908116603f01168101908382118183101715620002a657620002a6620001bd565b81604052828152896020848701011115620002c057600080fd5b620002d3836020830160208801620001d3565b80955050505050509250925092565b60008251620002f6818460208701620001d3565b9190910192915050565b61094280620003106000396000f3fe60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146100c45780638da5cb5b146100d7578063f2fde38b1461011157610065565b806301ffc9a71461006f5780633659cfe6146100a457610065565b3661006557005b61006d610131565b005b34801561007b57600080fd5b5061008f61008a3660046107a6565b61017c565b60405190151581526020015b60405180910390f35b3480156100b057600080fd5b5061006d6100bf366004610811565b61034a565b61006d6100d236600461082c565b610421565b3480156100e357600080fd5b506100ec61051c565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200161009b565b34801561011d57600080fd5b5061006d61012c366004610811565b61054b565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e828015610172578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061020f57507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561021c57506001919050565b7fffffffff00000000000000000000000000000000000000000000000000000000808316141561024e57506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa925050508015610336575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201909252610333918101906108af565b60015b6103435750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610405576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064015b60405180910390fd5b61041e816040518060200160405280600081525061060a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104d7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b6105178383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061060a92505050565b505050565b60006105467fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610601576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b61041e816106f9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105175760008373ffffffffffffffffffffffffffffffffffffffff16836040516106a591906108d1565b600060405180830381855af49150503d80600081146106e0576040519150601f19603f3d011682016040523d82523d6000602084013e6106e5565b606091505b5050905080610176573d806000803e806000fd5b60006107237fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000602082840312156107b857600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461034357600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461080c57600080fd5b919050565b60006020828403121561082357600080fd5b610343826107e8565b60008060006040848603121561084157600080fd5b61084a846107e8565b9250602084013567ffffffffffffffff8082111561086757600080fd5b818601915086601f83011261087b57600080fd5b81358181111561088a57600080fd5b87602082850101111561089c57600080fd5b6020830194508093505050509250925092565b6000602082840312156108c157600080fd5b8151801515811461034357600080fd5b6000825160005b818110156108f257602081860181015185830152016108d8565b81811115610901576000828501525b50919091019291505056fea264697066735822122025d617949212f6e25493444995ffdc8648140fd8579de6638be329eb1483050f64736f6c634300080a0033b53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
	deployedBytecode:
		'0x60806040526004361061005e5760003560e01c80634f1ef286116100435780634f1ef286146100c45780638da5cb5b146100d7578063f2fde38b1461011157610065565b806301ffc9a71461006f5780633659cfe6146100a457610065565b3661006557005b61006d610131565b005b34801561007b57600080fd5b5061008f61008a3660046107a6565b61017c565b60405190151581526020015b60405180910390f35b3480156100b057600080fd5b5061006d6100bf366004610811565b61034a565b61006d6100d236600461082c565b610421565b3480156100e357600080fd5b506100ec61051c565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200161009b565b34801561011d57600080fd5b5061006d61012c366004610811565b61054b565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5460003681823780813683855af491503d8082833e828015610172578183f35b8183fd5b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316148061020f57507f7f5828d0000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316145b1561021c57506001919050565b7fffffffff00000000000000000000000000000000000000000000000000000000808316141561024e57506000919050565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546040517f01ffc9a70000000000000000000000000000000000000000000000000000000081527fffffffff000000000000000000000000000000000000000000000000000000008416600482015273ffffffffffffffffffffffffffffffffffffffff8216906301ffc9a790602401602060405180830381865afa925050508015610336575060408051601f3d9081017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0168201909252610333918101906108af565b60015b6103435750600092915050565b9392505050565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610405576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064015b60405180910390fd5b61041e816040518060200160405280600081525061060a565b50565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104d7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b6105178383838080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061060a92505050565b505050565b60006105467fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b905090565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035473ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610601576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600e60248201527f4e4f545f415554484f52495a454400000000000000000000000000000000000060448201526064016103fc565b61041e816106f9565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80549083905560405173ffffffffffffffffffffffffffffffffffffffff80851691908316907f5570d70a002632a7b0b3c9304cc89efb62d8da9eca0dbd7752c83b737906829690600090a38151156105175760008373ffffffffffffffffffffffffffffffffffffffff16836040516106a591906108d1565b600060405180830381855af49150503d80600081146106e0576040519150601f19603f3d011682016040523d82523d6000602084013e6106e5565b606091505b5050905080610176573d806000803e806000fd5b60006107237fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b9050817fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103558173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b6000602082840312156107b857600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461034357600080fd5b803573ffffffffffffffffffffffffffffffffffffffff8116811461080c57600080fd5b919050565b60006020828403121561082357600080fd5b610343826107e8565b60008060006040848603121561084157600080fd5b61084a846107e8565b9250602084013567ffffffffffffffff8082111561086757600080fd5b818601915086601f83011261087b57600080fd5b81358181111561088a57600080fd5b87602082850101111561089c57600080fd5b6020830194508093505050509250925092565b6000602082840312156108c157600080fd5b8151801515811461034357600080fd5b6000825160005b818110156108f257602081860181015185830152016108d8565b81811115610901576000828501525b50919091019291505056fea264697066735822122025d617949212f6e25493444995ffdc8648140fd8579de6638be329eb1483050f64736f6c634300080a0033',
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
				'@_setImplementation_263': {
					entryPoint: 190,
					id: 263,
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
					entryPoint: 514,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 738,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				copy_memory_to_memory: {
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
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH3 0xC72 CODESIZE SUB DUP1 PUSH3 0xC72 DUP4 CODECOPY DUP2 ADD PUSH1 0x40 DUP2 SWAP1 MSTORE PUSH3 0x26 SWAP2 PUSH3 0x202 JUMP JUMPDEST DUP3 DUP3 DUP3 PUSH3 0x34 DUP3 PUSH3 0x4C JUMP JUMPDEST PUSH3 0x40 DUP4 DUP3 PUSH3 0xBE JUMP JUMPDEST POP POP POP POP POP POP PUSH3 0x300 JUMP JUMPDEST PUSH1 0x0 PUSH3 0x66 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xC52 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH3 0xC52 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE SSTORE DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP2 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH3 0x19B JUMPI PUSH1 0x0 DUP4 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP4 PUSH1 0x40 MLOAD PUSH3 0x142 SWAP2 SWAP1 PUSH3 0x2E2 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH3 0x17F JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH3 0x184 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH3 0x199 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST POP JUMPDEST POP POP POP JUMP JUMPDEST DUP1 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP2 AND DUP2 EQ PUSH3 0x1B8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH3 0x1F0 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH3 0x1D6 JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH3 0x199 JUMPI POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x60 DUP5 DUP7 SUB SLT ISZERO PUSH3 0x218 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x223 DUP5 PUSH3 0x1A0 JUMP JUMPDEST SWAP3 POP PUSH3 0x233 PUSH1 0x20 DUP6 ADD PUSH3 0x1A0 JUMP JUMPDEST PUSH1 0x40 DUP6 ADD MLOAD SWAP1 SWAP3 POP PUSH1 0x1 PUSH1 0x1 PUSH1 0x40 SHL SUB DUP1 DUP3 GT ISZERO PUSH3 0x251 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH3 0x266 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP2 DUP2 GT ISZERO PUSH3 0x27B JUMPI PUSH3 0x27B PUSH3 0x1BD JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH1 0x1F NOT SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH3 0x2A6 JUMPI PUSH3 0x2A6 PUSH3 0x1BD JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP10 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH3 0x2C0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH3 0x2D3 DUP4 PUSH1 0x20 DUP4 ADD PUSH1 0x20 DUP9 ADD PUSH3 0x1D3 JUMP JUMPDEST DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH3 0x2F6 DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH3 0x1D3 JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH2 0x942 DUP1 PUSH3 0x310 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0xC4 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0xD7 JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x111 JUMPI PUSH2 0x65 JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0x6F JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0xA4 JUMPI PUSH2 0x65 JUMP JUMPDEST CALLDATASIZE PUSH2 0x65 JUMPI STOP JUMPDEST PUSH2 0x6D PUSH2 0x131 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x7B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x8F PUSH2 0x8A CALLDATASIZE PUSH1 0x4 PUSH2 0x7A6 JUMP JUMPDEST PUSH2 0x17C JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xB0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0xBF CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x34A JUMP JUMPDEST PUSH2 0x6D PUSH2 0xD2 CALLDATASIZE PUSH1 0x4 PUSH2 0x82C JUMP JUMPDEST PUSH2 0x421 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE3 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xEC PUSH2 0x51C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x9B JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x11D JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0x12C CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x54B JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x172 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x20F JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x21C JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND EQ ISZERO PUSH2 0x24E JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x336 JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x333 SWAP2 DUP2 ADD SWAP1 PUSH2 0x8AF JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x343 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x405 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0x41E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x60A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x4D7 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x517 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x60A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x546 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x601 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x41E DUP2 PUSH2 0x6F9 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x517 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x6A5 SWAP2 SWAP1 PUSH2 0x8D1 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x6E0 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x6E5 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x176 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x723 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x7B8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x80C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x823 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x343 DUP3 PUSH2 0x7E8 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x841 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x84A DUP5 PUSH2 0x7E8 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x867 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x87B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x88A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x89C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x8C1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x8F2 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x8D8 JUMP JUMPDEST DUP2 DUP2 GT ISZERO PUSH2 0x901 JUMPI PUSH1 0x0 DUP3 DUP6 ADD MSTORE JUMPDEST POP SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0x25 0xD6 OR SWAP5 SWAP3 SLT 0xF6 0xE2 SLOAD SWAP4 DIFFICULTY 0x49 SWAP6 SELFDESTRUCT 0xDC DUP7 BASEFEE EQ 0xF 0xD8 JUMPI SWAP14 0xE6 PUSH4 0x8BE329EB EQ DUP4 SDIV 0xF PUSH5 0x736F6C6343 STOP ADDMOD EXP STOP CALLER 0xB5 BALANCE 0x27 PUSH9 0x4A568B3173AE13B9F8 0xA6 ADD PUSH15 0x243E63B6E8EE1178D6A717850B5D61 SUB ',
			sourceMap:
				'176:278:1:-:0;;;229:179;;;;;;;;;;;;;;;;;;:::i;:::-;363:21;386:12;400:4;723:23:0;386:12:1;723:9:0;:23::i;:::-;756:47;775:21;798:4;756:18;:47::i;:::-;591:219;;;229:179:1;;;176:278;;2908:346:0;2964:21;2988:8;-1:-1:-1;;;;;;;;;;;2813:73:0;;2636:266;2988:8;2964:32;;3169:8;-1:-1:-1;;;;;;;;;;;3094:84:0;3238:8;-1:-1:-1;;;;;3202:45:0;3223:13;-1:-1:-1;;;;;3202:45:0;;;;;;;;;;;2954:300;2908:346;:::o;1377:1068:2:-;1630:66;1624:73;;1805:93;;;;1923:69;;-1:-1:-1;;;;;1923:69:2;;;;;;;;;;1470:30;;1923:69;2007:11;;:15;2003:436;;2039:12;2057:17;-1:-1:-1;;;;;2057:30:2;2088:4;2057:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2038:55;;;2112:7;2107:322;;2278:16;2336:14;2333:1;;2315:36;2382:14;2333:1;2372:25;2107:322;2024:415;2003:436;1460:985;1377:1068;;:::o;14:177:3:-;93:13;;-1:-1:-1;;;;;135:31:3;;125:42;;115:70;;181:1;178;171:12;115:70;14:177;;;:::o;196:127::-;257:10;252:3;248:20;245:1;238:31;288:4;285:1;278:15;312:4;309:1;302:15;328:258;400:1;410:113;424:6;421:1;418:13;410:113;;;500:11;;;494:18;481:11;;;474:39;446:2;439:10;410:113;;;541:6;538:1;535:13;532:48;;;-1:-1:-1;;576:1:3;558:16;;551:27;328:258::o;591:1053::-;688:6;696;704;757:2;745:9;736:7;732:23;728:32;725:52;;;773:1;770;763:12;725:52;796:40;826:9;796:40;:::i;:::-;786:50;;855:49;900:2;889:9;885:18;855:49;:::i;:::-;948:2;933:18;;927:25;845:59;;-1:-1:-1;;;;;;1001:14:3;;;998:34;;;1028:1;1025;1018:12;998:34;1066:6;1055:9;1051:22;1041:32;;1111:7;1104:4;1100:2;1096:13;1092:27;1082:55;;1133:1;1130;1123:12;1082:55;1162:2;1156:9;1184:2;1180;1177:10;1174:36;;;1190:18;;:::i;:::-;1265:2;1259:9;1233:2;1319:13;;-1:-1:-1;;1315:22:3;;;1339:2;1311:31;1307:40;1295:53;;;1363:18;;;1383:22;;;1360:46;1357:72;;;1409:18;;:::i;:::-;1449:10;1445:2;1438:22;1484:2;1476:6;1469:18;1524:7;1519:2;1514;1510;1506:11;1502:20;1499:33;1496:53;;;1545:1;1542;1535:12;1496:53;1558:55;1610:2;1605;1597:6;1593:15;1588:2;1584;1580:11;1558:55;:::i;:::-;1632:6;1622:16;;;;;;;591:1053;;;;;:::o;1649:274::-;1778:3;1816:6;1810:13;1832:53;1878:6;1873:3;1866:4;1858:6;1854:17;1832:53;:::i;:::-;1901:16;;;;;1649:274;-1:-1:-1;;1649:274:3:o;:::-;176:278:1;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@_198': {
					entryPoint: null,
					id: 198,
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
					entryPoint: 305,
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
					entryPoint: 1546,
					id: 263,
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
						src: '0:3142:3',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:3',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '83:263:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '129:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '138:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '141:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '131:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '131:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '131:12:3',
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
																src: '104:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '113:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '100:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '100:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '125:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '96:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '96:32:3',
											},
											nodeType: 'YulIf',
											src: '93:52:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '154:36:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '180:9:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '167:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '167:23:3',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '158:5:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '300:16:3',
												statements: [
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
																	src: '312:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '302:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '302:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '302:12:3',
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
																src: '212:5:3',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '223:5:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '230:66:3',
																		type: '',
																		value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '219:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '219:78:3',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '209:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '209:89:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '202:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '202:97:3',
											},
											nodeType: 'YulIf',
											src: '199:117:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '325:15:3',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '335:5:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '325:6:3',
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
										src: '49:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '60:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '72:6:3',
										type: '',
									},
								],
								src: '14:332:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '446:92:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '456:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '468:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '479:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '464:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '464:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '456:4:3',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '498:9:3',
													},
													{
														arguments: [
															{
																arguments: [
																	{
																		name: 'value0',
																		nodeType: 'YulIdentifier',
																		src: '523:6:3',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '516:6:3',
																},
																nodeType: 'YulFunctionCall',
																src: '516:14:3',
															},
														],
														functionName: {
															name: 'iszero',
															nodeType: 'YulIdentifier',
															src: '509:6:3',
														},
														nodeType: 'YulFunctionCall',
														src: '509:22:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '491:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '491:41:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '491:41:3',
										},
									],
								},
								name: 'abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '415:9:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '426:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '437:4:3',
										type: '',
									},
								],
								src: '351:187:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '592:147:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '602:29:3',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '624:6:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '611:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '611:20:3',
											},
											variableNames: [
												{
													name: 'value',
													nodeType: 'YulIdentifier',
													src: '602:5:3',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '717:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '726:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '729:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '719:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '719:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '719:12:3',
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
																src: '653:5:3',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '664:5:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '671:42:3',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '660:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '660:54:3',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '650:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '650:65:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '643:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '643:73:3',
											},
											nodeType: 'YulIf',
											src: '640:93:3',
										},
									],
								},
								name: 'abi_decode_address',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '571:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '582:5:3',
										type: '',
									},
								],
								src: '543:196:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '814:116:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '860:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '869:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '872:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '862:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '862:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '862:12:3',
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
																src: '835:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '844:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '831:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '831:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '856:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '827:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '827:32:3',
											},
											nodeType: 'YulIf',
											src: '824:52:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '885:39:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '914:9:3',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '895:18:3',
												},
												nodeType: 'YulFunctionCall',
												src: '895:29:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '885:6:3',
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
										src: '780:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '791:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '803:6:3',
										type: '',
									},
								],
								src: '744:186:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1041:559:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1087:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1096:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1099:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1089:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1089:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1089:12:3',
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
																src: '1062:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1071:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1058:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1058:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1083:2:3',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1054:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1054:32:3',
											},
											nodeType: 'YulIf',
											src: '1051:52:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '1112:39:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1141:9:3',
													},
												],
												functionName: {
													name: 'abi_decode_address',
													nodeType: 'YulIdentifier',
													src: '1122:18:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1122:29:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1112:6:3',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1160:46:3',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1191:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1202:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1187:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1187:18:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1174:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1174:32:3',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '1164:6:3',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1215:28:3',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1225:18:3',
												type: '',
												value: '0xffffffffffffffff',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1219:2:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1270:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1279:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1282:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1272:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1272:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1272:12:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1258:6:3',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1266:2:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1255:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1255:14:3',
											},
											nodeType: 'YulIf',
											src: '1252:34:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1295:32:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1309:9:3',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '1320:6:3',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1305:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1305:22:3',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1299:2:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1375:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1384:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1387:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1377:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1377:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1377:12:3',
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
																		src: '1354:2:3',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1358:4:3',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1350:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1350:13:3',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '1365:7:3',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '1346:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1346:27:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1339:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1339:35:3',
											},
											nodeType: 'YulIf',
											src: '1336:55:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1400:30:3',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1427:2:3',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1414:12:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1414:16:3',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1404:6:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1457:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1466:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1469:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1459:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1459:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1459:12:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1445:6:3',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1453:2:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1442:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1442:14:3',
											},
											nodeType: 'YulIf',
											src: '1439:34:3',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1523:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1532:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1535:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1525:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '1525:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '1525:12:3',
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
																		src: '1496:2:3',
																	},
																	{
																		name: 'length',
																		nodeType: 'YulIdentifier',
																		src: '1500:6:3',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1492:3:3',
																},
																nodeType: 'YulFunctionCall',
																src: '1492:15:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1509:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1488:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1488:24:3',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1514:7:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1485:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1485:37:3',
											},
											nodeType: 'YulIf',
											src: '1482:57:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '1548:21:3',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1562:2:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1566:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1558:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1558:11:3',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1548:6:3',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1578:16:3',
											value: {
												name: 'length',
												nodeType: 'YulIdentifier',
												src: '1588:6:3',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1578:6:3',
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
										src: '991:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1002:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1014:6:3',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '1022:6:3',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '1030:6:3',
										type: '',
									},
								],
								src: '935:665:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1706:125:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '1716:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1728:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1739:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1724:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1724:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1716:4:3',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1758:9:3',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '1773:6:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1781:42:3',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1769:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1769:55:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1751:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1751:74:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '1751:74:3',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1675:9:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1686:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1697:4:3',
										type: '',
									},
								],
								src: '1605:226:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1935:149:3',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '1945:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1957:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1968:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1953:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1953:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1945:4:3',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1987:9:3',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '2002:6:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2010:66:3',
																type: '',
																value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1998:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '1998:79:3',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1980:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '1980:98:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '1980:98:3',
										},
									],
								},
								name: 'abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1904:9:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1915:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1926:4:3',
										type: '',
									},
								],
								src: '1836:248:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2167:199:3',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '2213:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2222:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2225:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2215:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '2215:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '2215:12:3',
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
																src: '2188:7:3',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2197:9:3',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '2184:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2184:23:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2209:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '2180:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2180:32:3',
											},
											nodeType: 'YulIf',
											src: '2177:52:3',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2238:29:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2257:9:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2251:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2251:16:3',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '2242:5:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2320:16:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2329:1:3',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2332:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2322:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '2322:12:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '2322:12:3',
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
																src: '2289:5:3',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'value',
																				nodeType: 'YulIdentifier',
																				src: '2310:5:3',
																			},
																		],
																		functionName: {
																			name: 'iszero',
																			nodeType: 'YulIdentifier',
																			src: '2303:6:3',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '2303:13:3',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '2296:6:3',
																},
																nodeType: 'YulFunctionCall',
																src: '2296:21:3',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '2286:2:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2286:32:3',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '2279:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2279:40:3',
											},
											nodeType: 'YulIf',
											src: '2276:60:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '2345:15:3',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '2355:5:3',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '2345:6:3',
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
										src: '2133:9:3',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2144:7:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2156:6:3',
										type: '',
									},
								],
								src: '2089:277:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2545:164:3',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2562:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2573:2:3',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2555:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2555:21:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2555:21:3',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2596:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2607:2:3',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2592:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2592:18:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2612:2:3',
														type: '',
														value: '14',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2585:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2585:30:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2585:30:3',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2635:9:3',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2646:2:3',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2631:3:3',
														},
														nodeType: 'YulFunctionCall',
														src: '2631:18:3',
													},
													{
														hexValue: '4e4f545f415554484f52495a4544',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2651:16:3',
														type: '',
														value: 'NOT_AUTHORIZED',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2624:6:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2624:44:3',
											},
											nodeType: 'YulExpressionStatement',
											src: '2624:44:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '2677:26:3',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2689:9:3',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2700:2:3',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2685:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2685:18:3',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2677:4:3',
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
										src: '2522:9:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2536:4:3',
										type: '',
									},
								],
								src: '2371:338:3',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2851:289:3',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '2861:27:3',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2881:6:3',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2875:5:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2875:13:3',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '2865:6:3',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2897:10:3',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '2906:1:3',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '2901:1:3',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2968:77:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'pos',
																			nodeType: 'YulIdentifier',
																			src: '2993:3:3',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '2998:1:3',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2989:3:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2989:11:3',
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
																							src: '3016:6:3',
																						},
																						{
																							name: 'i',
																							nodeType: 'YulIdentifier',
																							src: '3024:1:3',
																						},
																					],
																					functionName: {
																						name: 'add',
																						nodeType: 'YulIdentifier',
																						src: '3012:3:3',
																					},
																					nodeType: 'YulFunctionCall',
																					src: '3012:14:3',
																				},
																				{
																					kind: 'number',
																					nodeType: 'YulLiteral',
																					src: '3028:4:3',
																					type: '',
																					value: '0x20',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '3008:3:3',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '3008:25:3',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '3002:5:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3002:32:3',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2982:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '2982:53:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '2982:53:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '2927:1:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2930:6:3',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '2924:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '2924:13:3',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '2938:21:3',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '2940:17:3',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '2949:1:3',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2952:4:3',
																	type: '',
																	value: '0x20',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2945:3:3',
															},
															nodeType: 'YulFunctionCall',
															src: '2945:12:3',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '2940:1:3',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '2920:3:3',
												statements: [],
											},
											src: '2916:129:3',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '3071:31:3',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'pos',
																			nodeType: 'YulIdentifier',
																			src: '3084:3:3',
																		},
																		{
																			name: 'length',
																			nodeType: 'YulIdentifier',
																			src: '3089:6:3',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '3080:3:3',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '3080:16:3',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3098:1:3',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '3073:6:3',
															},
															nodeType: 'YulFunctionCall',
															src: '3073:27:3',
														},
														nodeType: 'YulExpressionStatement',
														src: '3073:27:3',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '3060:1:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3063:6:3',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '3057:2:3',
												},
												nodeType: 'YulFunctionCall',
												src: '3057:13:3',
											},
											nodeType: 'YulIf',
											src: '3054:48:3',
										},
										{
											nodeType: 'YulAssignment',
											src: '3111:23:3',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3122:3:3',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3127:6:3',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3118:3:3',
												},
												nodeType: 'YulFunctionCall',
												src: '3118:16:3',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '3111:3:3',
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
										src: '2827:3:3',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2832:6:3',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '2843:3:3',
										type: '',
									},
								],
								src: '2714:426:3',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_tuple_t_bytes4(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffff00000000000000000000000000000000000000000000000000000000))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, iszero(iszero(value0)))\n    }\n    function abi_decode_address(offset) -> value\n    {\n        value := calldataload(offset)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n    }\n    function abi_decode_tuple_t_addresst_bytes_calldata_ptr(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        value0 := abi_decode_address(headStart)\n        let offset := calldataload(add(headStart, 32))\n        let _1 := 0xffffffffffffffff\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let length := calldataload(_2)\n        if gt(length, _1) { revert(0, 0) }\n        if gt(add(add(_2, length), 32), dataEnd) { revert(0, 0) }\n        value1 := add(_2, 32)\n        value2 := length\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function abi_encode_tuple_t_bytes4__to_t_bytes4__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffff00000000000000000000000000000000000000000000000000000000))\n    }\n    function abi_decode_tuple_t_bool_fromMemory(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := mload(headStart)\n        if iszero(eq(value, iszero(iszero(value)))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_stringliteral_e7e213d5e2bee0acc2c7bf8bfda19ef0cae82e7b8c997e7e898919269971e7c4__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 14)\n        mstore(add(headStart, 64), "NOT_AUTHORIZED")\n        tail := add(headStart, 96)\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 0x20) }\n        {\n            mstore(add(pos, i), mload(add(add(value0, i), 0x20)))\n        }\n        if gt(i, length) { mstore(add(pos, length), 0) }\n        end := add(pos, length)\n    }\n}',
					id: 3,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x5E JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x4F1EF286 GT PUSH2 0x43 JUMPI DUP1 PUSH4 0x4F1EF286 EQ PUSH2 0xC4 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0xD7 JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x111 JUMPI PUSH2 0x65 JUMP JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0x6F JUMPI DUP1 PUSH4 0x3659CFE6 EQ PUSH2 0xA4 JUMPI PUSH2 0x65 JUMP JUMPDEST CALLDATASIZE PUSH2 0x65 JUMPI STOP JUMPDEST PUSH2 0x6D PUSH2 0x131 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x7B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x8F PUSH2 0x8A CALLDATASIZE PUSH1 0x4 PUSH2 0x7A6 JUMP JUMPDEST PUSH2 0x17C JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xB0 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0xBF CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x34A JUMP JUMPDEST PUSH2 0x6D PUSH2 0xD2 CALLDATASIZE PUSH1 0x4 PUSH2 0x82C JUMP JUMPDEST PUSH2 0x421 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xE3 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xEC PUSH2 0x51C JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x9B JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x11D JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x6D PUSH2 0x12C CALLDATASIZE PUSH1 0x4 PUSH2 0x811 JUMP JUMPDEST PUSH2 0x54B JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x0 CALLDATASIZE DUP2 DUP3 CALLDATACOPY DUP1 DUP2 CALLDATASIZE DUP4 DUP6 GAS DELEGATECALL SWAP2 POP RETURNDATASIZE DUP1 DUP3 DUP4 RETURNDATACOPY DUP3 DUP1 ISZERO PUSH2 0x172 JUMPI DUP2 DUP4 RETURN JUMPDEST DUP2 DUP4 REVERT JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ DUP1 PUSH2 0x20F JUMPI POP PUSH32 0x7F5828D000000000000000000000000000000000000000000000000000000000 PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP4 AND EQ JUMPDEST ISZERO PUSH2 0x21C JUMPI POP PUSH1 0x1 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP1 DUP4 AND EQ ISZERO PUSH2 0x24E JUMPI POP PUSH1 0x0 SWAP2 SWAP1 POP JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH1 0x40 MLOAD PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP5 AND PUSH1 0x4 DUP3 ADD MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 AND SWAP1 PUSH4 0x1FFC9A7 SWAP1 PUSH1 0x24 ADD PUSH1 0x20 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP7 GAS STATICCALL SWAP3 POP POP POP DUP1 ISZERO PUSH2 0x336 JUMPI POP PUSH1 0x40 DUP1 MLOAD PUSH1 0x1F RETURNDATASIZE SWAP1 DUP2 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND DUP3 ADD SWAP1 SWAP3 MSTORE PUSH2 0x333 SWAP2 DUP2 ADD SWAP1 PUSH2 0x8AF JUMP JUMPDEST PUSH1 0x1 JUMPDEST PUSH2 0x343 JUMPI POP PUSH1 0x0 SWAP3 SWAP2 POP POP JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x405 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0x41E DUP2 PUSH1 0x40 MLOAD DUP1 PUSH1 0x20 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x0 DUP2 MSTORE POP PUSH2 0x60A JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x4D7 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x517 DUP4 DUP4 DUP4 DUP1 DUP1 PUSH1 0x1F ADD PUSH1 0x20 DUP1 SWAP2 DIV MUL PUSH1 0x20 ADD PUSH1 0x40 MLOAD SWAP1 DUP2 ADD PUSH1 0x40 MSTORE DUP1 SWAP4 SWAP3 SWAP2 SWAP1 DUP2 DUP2 MSTORE PUSH1 0x20 ADD DUP4 DUP4 DUP1 DUP3 DUP5 CALLDATACOPY PUSH1 0x0 SWAP3 ADD SWAP2 SWAP1 SWAP2 MSTORE POP PUSH2 0x60A SWAP3 POP POP POP JUMP JUMPDEST POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH2 0x546 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EQ PUSH2 0x601 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0xE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4E4F545F415554484F52495A4544000000000000000000000000000000000000 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x3FC JUMP JUMPDEST PUSH2 0x41E DUP2 PUSH2 0x6F9 JUMP JUMPDEST PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC DUP1 SLOAD SWAP1 DUP4 SWAP1 SSTORE PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP1 DUP6 AND SWAP2 SWAP1 DUP4 AND SWAP1 PUSH32 0x5570D70A002632A7B0B3C9304CC89EFB62D8DA9ECA0DBD7752C83B7379068296 SWAP1 PUSH1 0x0 SWAP1 LOG3 DUP2 MLOAD ISZERO PUSH2 0x517 JUMPI PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 PUSH1 0x40 MLOAD PUSH2 0x6A5 SWAP2 SWAP1 PUSH2 0x8D1 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x6E0 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x6E5 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP POP SWAP1 POP DUP1 PUSH2 0x176 JUMPI RETURNDATASIZE DUP1 PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH2 0x723 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SLOAD SWAP1 JUMP JUMPDEST SWAP1 POP DUP2 PUSH32 0xB53127684A568B3173AE13B9F8A6016E243E63B6E8EE1178D6A717850B5D6103 SSTORE DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 PUSH1 0x40 MLOAD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x7B8 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x80C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x823 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x343 DUP3 PUSH2 0x7E8 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x40 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x841 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x84A DUP5 PUSH2 0x7E8 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x867 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x87B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x88A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP8 PUSH1 0x20 DUP3 DUP6 ADD ADD GT ISZERO PUSH2 0x89C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP5 POP DUP1 SWAP4 POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x8C1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP1 ISZERO ISZERO DUP2 EQ PUSH2 0x343 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x8F2 JUMPI PUSH1 0x20 DUP2 DUP7 ADD DUP2 ADD MLOAD DUP6 DUP4 ADD MSTORE ADD PUSH2 0x8D8 JUMP JUMPDEST DUP2 DUP2 GT ISZERO PUSH2 0x901 JUMPI PUSH1 0x0 DUP3 DUP6 ADD MSTORE JUMPDEST POP SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0x25 0xD6 OR SWAP5 SWAP3 SLT 0xF6 0xE2 SLOAD SWAP4 DIFFICULTY 0x49 SWAP6 SELFDESTRUCT 0xDC DUP7 BASEFEE EQ 0xF 0xD8 JUMPI SWAP14 0xE6 PUSH4 0x8BE329EB EQ DUP4 SDIV 0xF PUSH5 0x736F6C6343 STOP ADDMOD EXP STOP CALLER ',
			sourceMap:
				'176:278:1:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;593:11:2;:9;:11::i;:::-;176:278:1;1018:877:0;;;;;;;;;;-1:-1:-1;1018:877:0;;;;;:::i;:::-;;:::i;:::-;;;516:14:3;;509:22;491:41;;479:2;464:18;1018:877:0;;;;;;;;2007:123;;;;;;;;;;-1:-1:-1;2007:123:0;;;;;:::i;:::-;;:::i;2136:161::-;;;;;;:::i;:::-;;:::i;931:81::-;;;;;;;;;;;;;:::i;:::-;;;1781:42:3;1769:55;;;1751:74;;1739:2;1724:18;931:81:0;1605:226:3;1901:100:0;;;;;;;;;;-1:-1:-1;1901:100:0;;;;;:::i;:::-;;:::i;731:640:2:-;894:66;888:73;992:3;997:14;992:3;;974:38;992:3;;997:14;992:3;1060:21;1053:5;1040:69;1025:84;;1135:16;1185:5;992:3;;1164:27;1211:7;1231:55;;;;1335:5;992:3;1325:16;1231:55;1266:5;992:3;1256:16;1204:151;;;;;731:640::o;1018:877:0:-;1079:4;1099:16;;;;;;:36;;-1:-1:-1;1119:16:0;;;;;1099:36;1095:78;;;-1:-1:-1;1158:4:0;;1018:877;-1:-1:-1;1018:877:0:o;1095:78::-;1186:16;;;;;1182:59;;;-1:-1:-1;1225:5:0;;1018:877;-1:-1:-1;1018:877:0:o;1182:59::-;1394:66;1388:73;1746:36;;;;;2010:66:3;1998:79;;1746:36:0;;;1980:98:3;1746:32:0;;;;;;1953:18:3;;1746:36:0;;;;;;;;;;;;;;;;;;-1:-1:-1;1746:36:0;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;1742:147;;-1:-1:-1;1873:5:0;;1018:877;-1:-1:-1;;1018:877:0:o;1742:147::-;1827:7;1018:877;-1:-1:-1;;;1018:877:0:o;2007:123::-;2819:66;2813:73;2457:22;;:10;:22;;;2449:49;;;;;;;2573:2:3;2449:49:0;;;2555:21:3;2612:2;2592:18;;;2585:30;2651:16;2631:18;;;2624:44;2685:18;;2449:49:0;;;;;;;;;2082:41:::1;2101:17;2082:41;;;;;;;;;;;::::0;:18:::1;:41::i;:::-;2007:123:::0;:::o;2136:161::-;2819:66;2813:73;2457:22;;:10;:22;;;2449:49;;;;;;;2573:2:3;2449:49:0;;;2555:21:3;2612:2;2592:18;;;2585:30;2651:16;2631:18;;;2624:44;2685:18;;2449:49:0;2371:338:3;2449:49:0;2247:43:::1;2266:17;2285:4;;2247:43;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;::::0;::::1;::::0;;;;-1:-1:-1;2247:18:0::1;::::0;-1:-1:-1;;;2247:43:0:i:1;:::-;2136:161:::0;;;:::o;931:81::-;971:7;997:8;2819:66;2813:73;;2636:266;997:8;990:15;;931:81;:::o;1901:100::-;2819:66;2813:73;2457:22;;:10;:22;;;2449:49;;;;;;;2573:2:3;2449:49:0;;;2555:21:3;2612:2;2592:18;;;2585:30;2651:16;2631:18;;;2624:44;2685:18;;2449:49:0;2371:338:3;2449:49:0;1975:19:::1;1985:8;1975:9;:19::i;1377:1068:2:-:0;1630:66;1624:73;;1805:93;;;;1923:69;;;;;;;;;;;;;1470:30;;1923:69;2007:11;;:15;2003:436;;2039:12;2057:17;:30;;2088:4;2057:36;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2038:55;;;2112:7;2107:322;;2278:16;2336:14;2333:1;;2315:36;2382:14;2333:1;2372:25;2908:346:0;2964:21;2988:8;2819:66;2813:73;;2636:266;2988:8;2964:32;;3169:8;3101:66;3094:84;3238:8;3202:45;;3223:13;3202:45;;;;;;;;;;;;2954:300;2908:346;:::o;14:332:3:-;72:6;125:2;113:9;104:7;100:23;96:32;93:52;;;141:1;138;131:12;93:52;180:9;167:23;230:66;223:5;219:78;212:5;209:89;199:117;;312:1;309;302:12;543:196;611:20;;671:42;660:54;;650:65;;640:93;;729:1;726;719:12;640:93;543:196;;;:::o;744:186::-;803:6;856:2;844:9;835:7;831:23;827:32;824:52;;;872:1;869;862:12;824:52;895:29;914:9;895:29;:::i;935:665::-;1014:6;1022;1030;1083:2;1071:9;1062:7;1058:23;1054:32;1051:52;;;1099:1;1096;1089:12;1051:52;1122:29;1141:9;1122:29;:::i;:::-;1112:39;;1202:2;1191:9;1187:18;1174:32;1225:18;1266:2;1258:6;1255:14;1252:34;;;1282:1;1279;1272:12;1252:34;1320:6;1309:9;1305:22;1295:32;;1365:7;1358:4;1354:2;1350:13;1346:27;1336:55;;1387:1;1384;1377:12;1336:55;1427:2;1414:16;1453:2;1445:6;1442:14;1439:34;;;1469:1;1466;1459:12;1439:34;1514:7;1509:2;1500:6;1496:2;1492:15;1488:24;1485:37;1482:57;;;1535:1;1532;1525:12;1482:57;1566:2;1562;1558:11;1548:21;;1588:6;1578:16;;;;;935:665;;;;;:::o;2089:277::-;2156:6;2209:2;2197:9;2188:7;2184:23;2180:32;2177:52;;;2225:1;2222;2215:12;2177:52;2257:9;2251:16;2310:5;2303:13;2296:21;2289:5;2286:32;2276:60;;2332:1;2329;2322:12;2714:426;2843:3;2881:6;2875:13;2906:1;2916:129;2930:6;2927:1;2924:13;2916:129;;;3028:4;3012:14;;;3008:25;;3002:32;2989:11;;;2982:53;2945:12;2916:129;;;3063:6;3060:1;3057:13;3054:48;;;3098:1;3089:6;3084:3;3080:16;3073:27;3054:48;-1:-1:-1;3118:16:3;;;;;2714:426;-1:-1:-1;;2714:426:3:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '474000',
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
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"implementationAddress","type":"address"},{"internalType":"address","name":"ownerAddress","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousImplementation","type":"address"},{"indexed":true,"internalType":"address","name":"newImplementation","type":"address"}],"name":"ProxyImplementationUpdated","type":"event"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"id","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"}],"name":"upgradeTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newImplementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeToAndCall","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}],"devdoc":{"kind":"dev","methods":{},"version":1},"userdoc":{"kind":"user","methods":{},"notice":"Proxy implementing EIP173 for ownership management that accept ETH via receive","version":1}},"settings":{"compilationTarget":{"solc_0.8/proxy/EIP173ProxyWithReceive.sol":"EIP173ProxyWithReceive"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/proxy/EIP173Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./Proxy.sol\\";\\n\\ninterface ERC165 {\\n    function supportsInterface(bytes4 id) external view returns (bool);\\n}\\n\\n///@notice Proxy implementing EIP173 for ownership management\\ncontract EIP173Proxy is Proxy {\\n    // ////////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    // /////////////////////// CONSTRUCTOR //////////////////////////////////////////////////////////////////////\\n\\n    constructor(\\n        address implementationAddress,\\n        address ownerAddress,\\n        bytes memory data\\n    ) payable {\\n        _setOwner(ownerAddress);\\n        _setImplementation(implementationAddress, data);\\n    }\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    function owner() external view returns (address) {\\n        return _owner();\\n    }\\n\\n    function supportsInterface(bytes4 id) external view returns (bool) {\\n        if (id == 0x01ffc9a7 || id == 0x7f5828d0) {\\n            return true;\\n        }\\n        if (id == 0xFFFFFFFF) {\\n            return false;\\n        }\\n\\n        ERC165 implementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            implementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // Technically this is not standard compliant as ERC-165 require 30,000 gas which that call cannot ensure\\n        // because it is itself inside `supportsInterface` that might only get 30,000 gas.\\n        // In practise this is unlikely to be an issue.\\n        try implementation.supportsInterface(id) returns (bool support) {\\n            return support;\\n        } catch {\\n            return false;\\n        }\\n    }\\n\\n    function transferOwnership(address newOwner) external onlyOwner {\\n        _setOwner(newOwner);\\n    }\\n\\n    function upgradeTo(address newImplementation) external onlyOwner {\\n        _setImplementation(newImplementation, \\"\\");\\n    }\\n\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable onlyOwner {\\n        _setImplementation(newImplementation, data);\\n    }\\n\\n    // /////////////////////// MODIFIERS ////////////////////////////////////////////////////////////////////////\\n\\n    modifier onlyOwner() {\\n        require(msg.sender == _owner(), \\"NOT_AUTHORIZED\\");\\n        _;\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _owner() internal view returns (address adminAddress) {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)\\n        }\\n    }\\n\\n    function _setOwner(address newOwner) internal {\\n        address previousOwner = _owner();\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, newOwner)\\n        }\\n        emit OwnershipTransferred(previousOwner, newOwner);\\n    }\\n}\\n","keccak256":"0xa52a027d9e3ad599c98da343572c0f8e16d65551d6fa0ab218e9e2d0f76e2ab0","license":"MIT"},"solc_0.8/proxy/EIP173ProxyWithReceive.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./EIP173Proxy.sol\\";\\n\\n///@notice Proxy implementing EIP173 for ownership management that accept ETH via receive\\ncontract EIP173ProxyWithReceive is EIP173Proxy {\\n    constructor(\\n        address implementationAddress,\\n        address ownerAddress,\\n        bytes memory data\\n    ) payable EIP173Proxy(implementationAddress, ownerAddress, data) {}\\n\\n    receive() external payable override {}\\n}\\n","keccak256":"0x360b80cd1907a2f32963e3defe6869b60bc99fd6b21b8ef8f91177ec2dd1956d","license":"MIT"},"solc_0.8/proxy/Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n// EIP-1967\\nabstract contract Proxy {\\n    // /////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////////\\n\\n    event ProxyImplementationUpdated(address indexed previousImplementation, address indexed newImplementation);\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    receive() external payable virtual {\\n        revert(\\"ETHER_REJECTED\\"); // explicit reject by default\\n    }\\n\\n    fallback() external payable {\\n        _fallback();\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _fallback() internal {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            let implementationAddress := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n            calldatacopy(0x0, 0x0, calldatasize())\\n            let success := delegatecall(gas(), implementationAddress, 0x0, calldatasize(), 0, 0)\\n            let retSz := returndatasize()\\n            returndatacopy(0, 0, retSz)\\n            switch success\\n            case 0 {\\n                revert(0, retSz)\\n            }\\n            default {\\n                return(0, retSz)\\n            }\\n        }\\n    }\\n\\n    function _setImplementation(address newImplementation, bytes memory data) internal {\\n        address previousImplementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            previousImplementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, newImplementation)\\n        }\\n\\n        emit ProxyImplementationUpdated(previousImplementation, newImplementation);\\n\\n        if (data.length > 0) {\\n            (bool success, ) = newImplementation.delegatecall(data);\\n            if (!success) {\\n                assembly {\\n                    // This assembly ensure the revert contains the exact string data\\n                    let returnDataSize := returndatasize()\\n                    returndatacopy(0, 0, returnDataSize)\\n                    revert(0, returnDataSize)\\n                }\\n            }\\n        }\\n    }\\n}\\n","keccak256":"0x68c8cf1a340a53d31de8ed808bb66d64e83d50b20d80a0b2dff6aba903cebc98","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {},
		notice: 'Proxy implementing EIP173 for ownership management that accept ETH via receive',
		version: 1,
	},
	solcInput:
		'{\n  "language": "Solidity",\n  "sources": {\n    "solc_0.8/proxy/EIP173Proxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./Proxy.sol\\";\\n\\ninterface ERC165 {\\n    function supportsInterface(bytes4 id) external view returns (bool);\\n}\\n\\n///@notice Proxy implementing EIP173 for ownership management\\ncontract EIP173Proxy is Proxy {\\n    // ////////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    // /////////////////////// CONSTRUCTOR //////////////////////////////////////////////////////////////////////\\n\\n    constructor(\\n        address implementationAddress,\\n        address ownerAddress,\\n        bytes memory data\\n    ) payable {\\n        _setOwner(ownerAddress);\\n        _setImplementation(implementationAddress, data);\\n    }\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    function owner() external view returns (address) {\\n        return _owner();\\n    }\\n\\n    function supportsInterface(bytes4 id) external view returns (bool) {\\n        if (id == 0x01ffc9a7 || id == 0x7f5828d0) {\\n            return true;\\n        }\\n        if (id == 0xFFFFFFFF) {\\n            return false;\\n        }\\n\\n        ERC165 implementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            implementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // Technically this is not standard compliant as ERC-165 require 30,000 gas which that call cannot ensure\\n        // because it is itself inside `supportsInterface` that might only get 30,000 gas.\\n        // In practise this is unlikely to be an issue.\\n        try implementation.supportsInterface(id) returns (bool support) {\\n            return support;\\n        } catch {\\n            return false;\\n        }\\n    }\\n\\n    function transferOwnership(address newOwner) external onlyOwner {\\n        _setOwner(newOwner);\\n    }\\n\\n    function upgradeTo(address newImplementation) external onlyOwner {\\n        _setImplementation(newImplementation, \\"\\");\\n    }\\n\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable onlyOwner {\\n        _setImplementation(newImplementation, data);\\n    }\\n\\n    // /////////////////////// MODIFIERS ////////////////////////////////////////////////////////////////////////\\n\\n    modifier onlyOwner() {\\n        require(msg.sender == _owner(), \\"NOT_AUTHORIZED\\");\\n        _;\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _owner() internal view returns (address adminAddress) {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)\\n        }\\n    }\\n\\n    function _setOwner(address newOwner) internal {\\n        address previousOwner = _owner();\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, newOwner)\\n        }\\n        emit OwnershipTransferred(previousOwner, newOwner);\\n    }\\n}\\n"\n    },\n    "solc_0.8/proxy/Proxy.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n// EIP-1967\\nabstract contract Proxy {\\n    // /////////////////////// EVENTS ///////////////////////////////////////////////////////////////////////////\\n\\n    event ProxyImplementationUpdated(address indexed previousImplementation, address indexed newImplementation);\\n\\n    // ///////////////////// EXTERNAL ///////////////////////////////////////////////////////////////////////////\\n\\n    receive() external payable virtual {\\n        revert(\\"ETHER_REJECTED\\"); // explicit reject by default\\n    }\\n\\n    fallback() external payable {\\n        _fallback();\\n    }\\n\\n    // ///////////////////////// INTERNAL //////////////////////////////////////////////////////////////////////\\n\\n    function _fallback() internal {\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            let implementationAddress := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n            calldatacopy(0x0, 0x0, calldatasize())\\n            let success := delegatecall(gas(), implementationAddress, 0x0, calldatasize(), 0, 0)\\n            let retSz := returndatasize()\\n            returndatacopy(0, 0, retSz)\\n            switch success\\n            case 0 {\\n                revert(0, retSz)\\n            }\\n            default {\\n                return(0, retSz)\\n            }\\n        }\\n    }\\n\\n    function _setImplementation(address newImplementation, bytes memory data) internal {\\n        address previousImplementation;\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            previousImplementation := sload(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc)\\n        }\\n\\n        // solhint-disable-next-line security/no-inline-assembly\\n        assembly {\\n            sstore(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc, newImplementation)\\n        }\\n\\n        emit ProxyImplementationUpdated(previousImplementation, newImplementation);\\n\\n        if (data.length > 0) {\\n            (bool success, ) = newImplementation.delegatecall(data);\\n            if (!success) {\\n                assembly {\\n                    // This assembly ensure the revert contains the exact string data\\n                    let returnDataSize := returndatasize()\\n                    returndatacopy(0, 0, returnDataSize)\\n                    revert(0, returnDataSize)\\n                }\\n            }\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/proxy/EIP173ProxyWithReceive.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./EIP173Proxy.sol\\";\\n\\n///@notice Proxy implementing EIP173 for ownership management that accept ETH via receive\\ncontract EIP173ProxyWithReceive is EIP173Proxy {\\n    constructor(\\n        address implementationAddress,\\n        address ownerAddress,\\n        bytes memory data\\n    ) payable EIP173Proxy(implementationAddress, ownerAddress, data) {}\\n\\n    receive() external payable override {}\\n}\\n"\n    }\n  },\n  "settings": {\n    "optimizer": {\n      "enabled": true,\n      "runs": 999999\n    },\n    "outputSelection": {\n      "*": {\n        "*": [\n          "abi",\n          "evm.bytecode",\n          "evm.deployedBytecode",\n          "evm.methodIdentifiers",\n          "metadata",\n          "devdoc",\n          "userdoc",\n          "storageLayout",\n          "evm.gasEstimates"\n        ],\n        "": [\n          "ast"\n        ]\n      }\n    },\n    "metadata": {\n      "useLiteralContent": true\n    }\n  }\n}',
	solcInputHash: '4a46ee6c1a29be400c9fab1ecc28e172',
} as const;
