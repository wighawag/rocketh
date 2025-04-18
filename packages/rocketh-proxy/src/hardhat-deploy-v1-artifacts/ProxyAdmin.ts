export default {
	contractName: 'ProxyAdmin',
	sourceName: 'solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol',
	abi: [
		{
			inputs: [
				{
					internalType: 'address',
					name: 'initialOwner',
					type: 'address',
				},
			],
			stateMutability: 'nonpayable',
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
			inputs: [
				{
					internalType: 'contract TransparentUpgradeableProxy',
					name: 'proxy',
					type: 'address',
				},
				{
					internalType: 'address',
					name: 'newAdmin',
					type: 'address',
				},
			],
			name: 'changeProxyAdmin',
			outputs: [],
			stateMutability: 'nonpayable',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'contract TransparentUpgradeableProxy',
					name: 'proxy',
					type: 'address',
				},
			],
			name: 'getProxyAdmin',
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
					internalType: 'contract TransparentUpgradeableProxy',
					name: 'proxy',
					type: 'address',
				},
			],
			name: 'getProxyImplementation',
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
			inputs: [],
			name: 'renounceOwnership',
			outputs: [],
			stateMutability: 'nonpayable',
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
					internalType: 'contract TransparentUpgradeableProxy',
					name: 'proxy',
					type: 'address',
				},
				{
					internalType: 'address',
					name: 'implementation',
					type: 'address',
				},
			],
			name: 'upgrade',
			outputs: [],
			stateMutability: 'nonpayable',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'contract TransparentUpgradeableProxy',
					name: 'proxy',
					type: 'address',
				},
				{
					internalType: 'address',
					name: 'implementation',
					type: 'address',
				},
				{
					internalType: 'bytes',
					name: 'data',
					type: 'bytes',
				},
			],
			name: 'upgradeAndCall',
			outputs: [],
			stateMutability: 'payable',
			type: 'function',
		},
	],
	bytecode:
		'0x608060405234801561001057600080fd5b50604051610b17380380610b1783398101604081905261002f91610090565b8061003981610040565b50506100c0565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6000602082840312156100a257600080fd5b81516001600160a01b03811681146100b957600080fd5b9392505050565b610a48806100cf6000396000f3fe60806040526004361061007b5760003560e01c80639623609d1161004e5780639623609d1461012b57806399a88ec41461013e578063f2fde38b1461015e578063f3b7dead1461017e57600080fd5b8063204e1c7a14610080578063715018a6146100c95780637eff275e146100e05780638da5cb5b14610100575b600080fd5b34801561008c57600080fd5b506100a061009b3660046107e4565b61019e565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b3480156100d557600080fd5b506100de610255565b005b3480156100ec57600080fd5b506100de6100fb366004610808565b6102e7565b34801561010c57600080fd5b5060005473ffffffffffffffffffffffffffffffffffffffff166100a0565b6100de610139366004610870565b6103ee565b34801561014a57600080fd5b506100de610159366004610808565b6104fc565b34801561016a57600080fd5b506100de6101793660046107e4565b6105d1565b34801561018a57600080fd5b506100a06101993660046107e4565b610701565b60008060008373ffffffffffffffffffffffffffffffffffffffff166040516101ea907f5c60da1b00000000000000000000000000000000000000000000000000000000815260040190565b600060405180830381855afa9150503d8060008114610225576040519150601f19603f3d011682016040523d82523d6000602084013e61022a565b606091505b50915091508161023957600080fd5b8080602001905181019061024d9190610964565b949350505050565b60005473ffffffffffffffffffffffffffffffffffffffff1633146102db576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064015b60405180910390fd5b6102e5600061074d565b565b60005473ffffffffffffffffffffffffffffffffffffffff163314610368576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b6040517f8f28397000000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8281166004830152831690638f283970906024015b600060405180830381600087803b1580156103d257600080fd5b505af11580156103e6573d6000803e3d6000fd5b505050505050565b60005473ffffffffffffffffffffffffffffffffffffffff16331461046f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b6040517f4f1ef28600000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff841690634f1ef2869034906104c59086908690600401610981565b6000604051808303818588803b1580156104de57600080fd5b505af11580156104f2573d6000803e3d6000fd5b5050505050505050565b60005473ffffffffffffffffffffffffffffffffffffffff16331461057d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b6040517f3659cfe600000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8281166004830152831690633659cfe6906024016103b8565b60005473ffffffffffffffffffffffffffffffffffffffff163314610652576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b73ffffffffffffffffffffffffffffffffffffffff81166106f5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f646472657373000000000000000000000000000000000000000000000000000060648201526084016102d2565b6106fe8161074d565b50565b60008060008373ffffffffffffffffffffffffffffffffffffffff166040516101ea907ff851a44000000000000000000000000000000000000000000000000000000000815260040190565b6000805473ffffffffffffffffffffffffffffffffffffffff8381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b73ffffffffffffffffffffffffffffffffffffffff811681146106fe57600080fd5b6000602082840312156107f657600080fd5b8135610801816107c2565b9392505050565b6000806040838503121561081b57600080fd5b8235610826816107c2565b91506020830135610836816107c2565b809150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60008060006060848603121561088557600080fd5b8335610890816107c2565b925060208401356108a0816107c2565b9150604084013567ffffffffffffffff808211156108bd57600080fd5b818601915086601f8301126108d157600080fd5b8135818111156108e3576108e3610841565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0908116603f0116810190838211818310171561092957610929610841565b8160405282815289602084870101111561094257600080fd5b8260208601602083013760006020848301015280955050505050509250925092565b60006020828403121561097657600080fd5b8151610801816107c2565b73ffffffffffffffffffffffffffffffffffffffff8316815260006020604081840152835180604085015260005b818110156109cb578581018301518582016060015282016109af565b818111156109dd576000606083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160600194935050505056fea2646970667358221220bd6c09ab03bfaf9ec60a4bf8cd98903cecb891974e17e2d76a3b2002c97eeb8964736f6c634300080a0033',
	deployedBytecode:
		'0x60806040526004361061007b5760003560e01c80639623609d1161004e5780639623609d1461012b57806399a88ec41461013e578063f2fde38b1461015e578063f3b7dead1461017e57600080fd5b8063204e1c7a14610080578063715018a6146100c95780637eff275e146100e05780638da5cb5b14610100575b600080fd5b34801561008c57600080fd5b506100a061009b3660046107e4565b61019e565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b3480156100d557600080fd5b506100de610255565b005b3480156100ec57600080fd5b506100de6100fb366004610808565b6102e7565b34801561010c57600080fd5b5060005473ffffffffffffffffffffffffffffffffffffffff166100a0565b6100de610139366004610870565b6103ee565b34801561014a57600080fd5b506100de610159366004610808565b6104fc565b34801561016a57600080fd5b506100de6101793660046107e4565b6105d1565b34801561018a57600080fd5b506100a06101993660046107e4565b610701565b60008060008373ffffffffffffffffffffffffffffffffffffffff166040516101ea907f5c60da1b00000000000000000000000000000000000000000000000000000000815260040190565b600060405180830381855afa9150503d8060008114610225576040519150601f19603f3d011682016040523d82523d6000602084013e61022a565b606091505b50915091508161023957600080fd5b8080602001905181019061024d9190610964565b949350505050565b60005473ffffffffffffffffffffffffffffffffffffffff1633146102db576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064015b60405180910390fd5b6102e5600061074d565b565b60005473ffffffffffffffffffffffffffffffffffffffff163314610368576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b6040517f8f28397000000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8281166004830152831690638f283970906024015b600060405180830381600087803b1580156103d257600080fd5b505af11580156103e6573d6000803e3d6000fd5b505050505050565b60005473ffffffffffffffffffffffffffffffffffffffff16331461046f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b6040517f4f1ef28600000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff841690634f1ef2869034906104c59086908690600401610981565b6000604051808303818588803b1580156104de57600080fd5b505af11580156104f2573d6000803e3d6000fd5b5050505050505050565b60005473ffffffffffffffffffffffffffffffffffffffff16331461057d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b6040517f3659cfe600000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8281166004830152831690633659cfe6906024016103b8565b60005473ffffffffffffffffffffffffffffffffffffffff163314610652576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016102d2565b73ffffffffffffffffffffffffffffffffffffffff81166106f5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f646472657373000000000000000000000000000000000000000000000000000060648201526084016102d2565b6106fe8161074d565b50565b60008060008373ffffffffffffffffffffffffffffffffffffffff166040516101ea907ff851a44000000000000000000000000000000000000000000000000000000000815260040190565b6000805473ffffffffffffffffffffffffffffffffffffffff8381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b73ffffffffffffffffffffffffffffffffffffffff811681146106fe57600080fd5b6000602082840312156107f657600080fd5b8135610801816107c2565b9392505050565b6000806040838503121561081b57600080fd5b8235610826816107c2565b91506020830135610836816107c2565b809150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b60008060006060848603121561088557600080fd5b8335610890816107c2565b925060208401356108a0816107c2565b9150604084013567ffffffffffffffff808211156108bd57600080fd5b818601915086601f8301126108d157600080fd5b8135818111156108e3576108e3610841565b604051601f82017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0908116603f0116810190838211818310171561092957610929610841565b8160405282815289602084870101111561094257600080fd5b8260208601602083013760006020848301015280955050505050509250925092565b60006020828403121561097657600080fd5b8151610801816107c2565b73ffffffffffffffffffffffffffffffffffffffff8316815260006020604081840152835180604085015260005b818110156109cb578581018301518582016060015282016109af565b818111156109dd576000606083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160600194935050505056fea2646970667358221220bd6c09ab03bfaf9ec60a4bf8cd98903cecb891974e17e2d76a3b2002c97eeb8964736f6c634300080a0033',
	linkReferences: {},
	deployedLinkReferences: {},
	devdoc: {
		details:
			'This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.',
		kind: 'dev',
		methods: {
			'changeProxyAdmin(address,address)': {
				details:
					'Changes the admin of `proxy` to `newAdmin`. Requirements: - This contract must be the current admin of `proxy`.',
			},
			'getProxyAdmin(address)': {
				details: 'Returns the current admin of `proxy`. Requirements: - This contract must be the admin of `proxy`.',
			},
			'getProxyImplementation(address)': {
				details:
					'Returns the current implementation of `proxy`. Requirements: - This contract must be the admin of `proxy`.',
			},
			'owner()': {
				details: 'Returns the address of the current owner.',
			},
			'renounceOwnership()': {
				details:
					'Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.',
			},
			'transferOwnership(address)': {
				details:
					'Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.',
			},
			'upgrade(address,address)': {
				details:
					'Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}. Requirements: - This contract must be the admin of `proxy`.',
			},
			'upgradeAndCall(address,address,bytes)': {
				details:
					'Upgrades `proxy` to `implementation` and calls a function on the new implementation. See {TransparentUpgradeableProxy-upgradeToAndCall}. Requirements: - This contract must be the admin of `proxy`.',
			},
		},
		version: 1,
	},
	evm: {
		bytecode: {
			functionDebugData: {
				'@_24': {
					entryPoint: null,
					id: 24,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@_726': {
					entryPoint: null,
					id: 726,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@_transferOwnership_104': {
					entryPoint: 64,
					id: 104,
					parameterSlots: 1,
					returnSlots: 0,
				},
				abi_decode_tuple_t_address_fromMemory: {
					entryPoint: 144,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:306:16',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:16',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '95:209:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '141:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '150:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '153:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '143:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '143:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '143:12:16',
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
																src: '116:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '125:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '112:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '112:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '137:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '108:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '108:32:16',
											},
											nodeType: 'YulIf',
											src: '105:52:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '166:29:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '185:9:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '179:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '179:16:16',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '170:5:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '258:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '267:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '270:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '260:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '260:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '260:12:16',
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
																src: '217:5:16',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '228:5:16',
																	},
																	{
																		arguments: [
																			{
																				arguments: [
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '243:3:16',
																						type: '',
																						value: '160',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '248:1:16',
																						type: '',
																						value: '1',
																					},
																				],
																				functionName: {
																					name: 'shl',
																					nodeType: 'YulIdentifier',
																					src: '239:3:16',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '239:11:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '252:1:16',
																				type: '',
																				value: '1',
																			},
																		],
																		functionName: {
																			name: 'sub',
																			nodeType: 'YulIdentifier',
																			src: '235:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '235:19:16',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '224:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '224:31:16',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '214:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '214:42:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '207:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '207:50:16',
											},
											nodeType: 'YulIf',
											src: '204:70:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '283:15:16',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '293:5:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '283:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_address_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '61:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '72:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '84:6:16',
										type: '',
									},
								],
								src: '14:290:16',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_tuple_t_address_fromMemory(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := mload(headStart)\n        if iszero(eq(value, and(value, sub(shl(160, 1), 1)))) { revert(0, 0) }\n        value0 := value\n    }\n}',
					id: 16,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x40 MLOAD PUSH2 0xB17 CODESIZE SUB DUP1 PUSH2 0xB17 DUP4 CODECOPY DUP2 ADD PUSH1 0x40 DUP2 SWAP1 MSTORE PUSH2 0x2F SWAP2 PUSH2 0x90 JUMP JUMPDEST DUP1 PUSH2 0x39 DUP2 PUSH2 0x40 JUMP JUMPDEST POP POP PUSH2 0xC0 JUMP JUMPDEST PUSH1 0x0 DUP1 SLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP4 DUP2 AND PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB NOT DUP4 AND DUP2 OR DUP5 SSTORE PUSH1 0x40 MLOAD SWAP2 SWAP1 SWAP3 AND SWAP3 DUP4 SWAP2 PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 SWAP2 SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0xA2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP2 AND DUP2 EQ PUSH2 0xB9 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH2 0xA48 DUP1 PUSH2 0xCF PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x7B JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x9623609D GT PUSH2 0x4E JUMPI DUP1 PUSH4 0x9623609D EQ PUSH2 0x12B JUMPI DUP1 PUSH4 0x99A88EC4 EQ PUSH2 0x13E JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x15E JUMPI DUP1 PUSH4 0xF3B7DEAD EQ PUSH2 0x17E JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 PUSH4 0x204E1C7A EQ PUSH2 0x80 JUMPI DUP1 PUSH4 0x715018A6 EQ PUSH2 0xC9 JUMPI DUP1 PUSH4 0x7EFF275E EQ PUSH2 0xE0 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x100 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x8C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA0 PUSH2 0x9B CALLDATASIZE PUSH1 0x4 PUSH2 0x7E4 JUMP JUMPDEST PUSH2 0x19E JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xD5 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0x255 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xEC JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0xFB CALLDATASIZE PUSH1 0x4 PUSH2 0x808 JUMP JUMPDEST PUSH2 0x2E7 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x10C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH2 0xA0 JUMP JUMPDEST PUSH2 0xDE PUSH2 0x139 CALLDATASIZE PUSH1 0x4 PUSH2 0x870 JUMP JUMPDEST PUSH2 0x3EE JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x14A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0x159 CALLDATASIZE PUSH1 0x4 PUSH2 0x808 JUMP JUMPDEST PUSH2 0x4FC JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x16A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0x179 CALLDATASIZE PUSH1 0x4 PUSH2 0x7E4 JUMP JUMPDEST PUSH2 0x5D1 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x18A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA0 PUSH2 0x199 CALLDATASIZE PUSH1 0x4 PUSH2 0x7E4 JUMP JUMPDEST PUSH2 0x701 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH1 0x40 MLOAD PUSH2 0x1EA SWAP1 PUSH32 0x5C60DA1B00000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD SWAP1 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS STATICCALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x225 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x22A JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP2 POP SWAP2 POP DUP2 PUSH2 0x239 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 DUP1 PUSH1 0x20 ADD SWAP1 MLOAD DUP2 ADD SWAP1 PUSH2 0x24D SWAP2 SWAP1 PUSH2 0x964 JUMP JUMPDEST SWAP5 SWAP4 POP POP POP POP JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x2DB JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0x2E5 PUSH1 0x0 PUSH2 0x74D JUMP JUMPDEST JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x368 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH32 0x8F28397000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 DUP2 AND PUSH1 0x4 DUP4 ADD MSTORE DUP4 AND SWAP1 PUSH4 0x8F283970 SWAP1 PUSH1 0x24 ADD JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 PUSH1 0x0 DUP8 DUP1 EXTCODESIZE ISZERO DUP1 ISZERO PUSH2 0x3D2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP GAS CALL ISZERO DUP1 ISZERO PUSH2 0x3E6 JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x46F JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH32 0x4F1EF28600000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 AND SWAP1 PUSH4 0x4F1EF286 SWAP1 CALLVALUE SWAP1 PUSH2 0x4C5 SWAP1 DUP7 SWAP1 DUP7 SWAP1 PUSH1 0x4 ADD PUSH2 0x981 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 DUP9 DUP1 EXTCODESIZE ISZERO DUP1 ISZERO PUSH2 0x4DE JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP GAS CALL ISZERO DUP1 ISZERO PUSH2 0x4F2 JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x57D JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH32 0x3659CFE600000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 DUP2 AND PUSH1 0x4 DUP4 ADD MSTORE DUP4 AND SWAP1 PUSH4 0x3659CFE6 SWAP1 PUSH1 0x24 ADD PUSH2 0x3B8 JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x652 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND PUSH2 0x6F5 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A206E6577206F776E657220697320746865207A65726F2061 PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6464726573730000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH2 0x6FE DUP2 PUSH2 0x74D JUMP JUMPDEST POP JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH1 0x40 MLOAD PUSH2 0x1EA SWAP1 PUSH32 0xF851A44000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD SWAP1 JUMP JUMPDEST PUSH1 0x0 DUP1 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP4 DUP2 AND PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000 DUP4 AND DUP2 OR DUP5 SSTORE PUSH1 0x40 MLOAD SWAP2 SWAP1 SWAP3 AND SWAP3 DUP4 SWAP2 PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 SWAP2 SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x6FE JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x7F6 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH2 0x801 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x40 DUP4 DUP6 SUB SLT ISZERO PUSH2 0x81B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP3 CALLDATALOAD PUSH2 0x826 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP2 POP PUSH1 0x20 DUP4 ADD CALLDATALOAD PUSH2 0x836 DUP2 PUSH2 0x7C2 JUMP JUMPDEST DUP1 SWAP2 POP POP SWAP3 POP SWAP3 SWAP1 POP JUMP JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x60 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x885 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP4 CALLDATALOAD PUSH2 0x890 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH2 0x8A0 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP2 POP PUSH1 0x40 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x8BD JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x8D1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x8E3 JUMPI PUSH2 0x8E3 PUSH2 0x841 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH2 0x929 JUMPI PUSH2 0x929 PUSH2 0x841 JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP10 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH2 0x942 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP3 PUSH1 0x20 DUP7 ADD PUSH1 0x20 DUP4 ADD CALLDATACOPY PUSH1 0x0 PUSH1 0x20 DUP5 DUP4 ADD ADD MSTORE DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x976 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD PUSH2 0x801 DUP2 PUSH2 0x7C2 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP4 AND DUP2 MSTORE PUSH1 0x0 PUSH1 0x20 PUSH1 0x40 DUP2 DUP5 ADD MSTORE DUP4 MLOAD DUP1 PUSH1 0x40 DUP6 ADD MSTORE PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x9CB JUMPI DUP6 DUP2 ADD DUP4 ADD MLOAD DUP6 DUP3 ADD PUSH1 0x60 ADD MSTORE DUP3 ADD PUSH2 0x9AF JUMP JUMPDEST DUP2 DUP2 GT ISZERO PUSH2 0x9DD JUMPI PUSH1 0x0 PUSH1 0x60 DUP4 DUP8 ADD ADD MSTORE JUMPDEST POP PUSH1 0x1F ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND SWAP3 SWAP1 SWAP3 ADD PUSH1 0x60 ADD SWAP5 SWAP4 POP POP POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xBD PUSH13 0x9AB03BFAF9EC60A4BF8CD9890 EXTCODECOPY 0xEC 0xB8 SWAP2 SWAP8 0x4E OR 0xE2 0xD7 PUSH11 0x3B2002C97EEB8964736F6C PUSH4 0x4300080A STOP CALLER ',
			sourceMap:
				'435:2470:8:-:0;;;473:59;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;516:12;942:32:0;516:12:8;942:18:0;:32::i;:::-;897:84;473:59:8;435:2470;;2291:187:0;2364:16;2383:6;;-1:-1:-1;;;;;2399:17:0;;;-1:-1:-1;;;;;;2399:17:0;;;;;;2431:40;;2383:6;;;;;;;2431:40;;2364:16;2431:40;2354:124;2291:187;:::o;14:290:16:-;84:6;137:2;125:9;116:7;112:23;108:32;105:52;;;153:1;150;143:12;105:52;179:16;;-1:-1:-1;;;;;224:31:16;;214:42;;204:70;;270:1;267;260:12;204:70;293:5;14:290;-1:-1:-1;;;14:290:16:o;:::-;435:2470:8;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@_msgSender_1516': {
					entryPoint: null,
					id: 1516,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_transferOwnership_104': {
					entryPoint: 1869,
					id: 104,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@changeProxyAdmin_812': {
					entryPoint: 743,
					id: 812,
					parameterSlots: 2,
					returnSlots: 0,
				},
				'@getProxyAdmin_794': {
					entryPoint: 1793,
					id: 794,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@getProxyImplementation_760': {
					entryPoint: 414,
					id: 760,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@owner_33': {
					entryPoint: null,
					id: 33,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@renounceOwnership_61': {
					entryPoint: 597,
					id: 61,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@transferOwnership_84': {
					entryPoint: 1489,
					id: 84,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@upgradeAndCall_854': {
					entryPoint: 1006,
					id: 854,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@upgrade_830': {
					entryPoint: 1276,
					id: 830,
					parameterSlots: 2,
					returnSlots: 0,
				},
				abi_decode_tuple_t_address: {
					entryPoint: null,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_address_payable_fromMemory: {
					entryPoint: 2404,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019: {
					entryPoint: 2020,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019t_address: {
					entryPoint: 2056,
					id: null,
					parameterSlots: 2,
					returnSlots: 2,
				},
				abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019t_addresst_bytes_memory_ptr: {
					entryPoint: 2160,
					id: null,
					parameterSlots: 2,
					returnSlots: 3,
				},
				abi_encode_tuple_packed_t_stringliteral_96a4c6be7716f5be15d118c16bd1d464cb27f01187d0b9218993a5d488a47c29__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				abi_encode_tuple_packed_t_stringliteral_cb23cf6c353ccb16f0d92c8e6b5c5b425654e65dd07e2d295b394de4cf15afb7__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				abi_encode_tuple_t_address__to_t_address__fromStack_reversed: {
					entryPoint: null,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_address_t_bytes_memory_ptr__to_t_address_t_bytes_memory_ptr__fromStack_reversed: {
					entryPoint: 2433,
					id: null,
					parameterSlots: 3,
					returnSlots: 1,
				},
				abi_encode_tuple_t_stringliteral_245f15ff17f551913a7a18385165551503906a406f905ac1c2437281a7cd0cfe__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				abi_encode_tuple_t_stringliteral_9924ebdf1add33d25d4ef888e16131f0a5687b0580a36c21b5c301a6c462effe__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				panic_error_0x41: {
					entryPoint: 2113,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
				validator_revert_contract_TransparentUpgradeableProxy: {
					entryPoint: 1986,
					id: null,
					parameterSlots: 1,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:5535:16',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:16',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '88:109:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '175:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '184:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '187:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '177:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '177:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '177:12:16',
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
																src: '111:5:16',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '122:5:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '129:42:16',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '118:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '118:54:16',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '108:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '108:65:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '101:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '101:73:16',
											},
											nodeType: 'YulIf',
											src: '98:93:16',
										},
									],
								},
								name: 'validator_revert_contract_TransparentUpgradeableProxy',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '77:5:16',
										type: '',
									},
								],
								src: '14:183:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '308:206:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '354:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '363:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '366:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '356:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '356:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '356:12:16',
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
																src: '329:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '338:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '325:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '325:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '350:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '321:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '321:32:16',
											},
											nodeType: 'YulIf',
											src: '318:52:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '379:36:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '405:9:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '392:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '392:23:16',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '383:5:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '478:5:16',
													},
												],
												functionName: {
													name: 'validator_revert_contract_TransparentUpgradeableProxy',
													nodeType: 'YulIdentifier',
													src: '424:53:16',
												},
												nodeType: 'YulFunctionCall',
												src: '424:60:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '424:60:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '493:15:16',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '503:5:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '493:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '274:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '285:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '297:6:16',
										type: '',
									},
								],
								src: '202:312:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '620:125:16',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '630:26:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '642:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '653:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '638:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '638:18:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '630:4:16',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '672:9:16',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '687:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '695:42:16',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '683:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '683:55:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '665:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '665:74:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '665:74:16',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '589:9:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '600:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '611:4:16',
										type: '',
									},
								],
								src: '519:226:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '873:359:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '919:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '928:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '931:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '921:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '921:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '921:12:16',
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
																src: '894:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '903:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '890:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '890:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '915:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '886:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '886:32:16',
											},
											nodeType: 'YulIf',
											src: '883:52:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '944:36:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '970:9:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '957:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '957:23:16',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '948:5:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '1043:5:16',
													},
												],
												functionName: {
													name: 'validator_revert_contract_TransparentUpgradeableProxy',
													nodeType: 'YulIdentifier',
													src: '989:53:16',
												},
												nodeType: 'YulFunctionCall',
												src: '989:60:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '989:60:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1058:15:16',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '1068:5:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1058:6:16',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1082:47:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1114:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1125:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1110:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1110:18:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1097:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1097:32:16',
											},
											variables: [
												{
													name: 'value_1',
													nodeType: 'YulTypedName',
													src: '1086:7:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'value_1',
														nodeType: 'YulIdentifier',
														src: '1192:7:16',
													},
												],
												functionName: {
													name: 'validator_revert_contract_TransparentUpgradeableProxy',
													nodeType: 'YulIdentifier',
													src: '1138:53:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1138:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1138:62:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1209:17:16',
											value: {
												name: 'value_1',
												nodeType: 'YulIdentifier',
												src: '1219:7:16',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1209:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019t_address',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '831:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '842:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '854:6:16',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '862:6:16',
										type: '',
									},
								],
								src: '750:482:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1269:152:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1286:1:16',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1289:77:16',
														type: '',
														value: '35408467139433450592217433187231851964531694900788300625387963629091585785856',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1279:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1279:88:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1279:88:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1383:1:16',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1386:4:16',
														type: '',
														value: '0x41',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1376:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1376:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1376:15:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1407:1:16',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1410:4:16',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '1400:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1400:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1400:15:16',
										},
									],
								},
								name: 'panic_error_0x41',
								nodeType: 'YulFunctionDefinition',
								src: '1237:184:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1575:1201:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1621:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1630:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1633:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1623:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1623:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1623:12:16',
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
																src: '1596:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1605:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1592:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1592:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1617:2:16',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1588:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1588:32:16',
											},
											nodeType: 'YulIf',
											src: '1585:52:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1646:36:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1672:9:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1659:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1659:23:16',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '1650:5:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '1745:5:16',
													},
												],
												functionName: {
													name: 'validator_revert_contract_TransparentUpgradeableProxy',
													nodeType: 'YulIdentifier',
													src: '1691:53:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1691:60:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1691:60:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1760:15:16',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '1770:5:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1760:6:16',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1784:47:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1816:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1827:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1812:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1812:18:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1799:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1799:32:16',
											},
											variables: [
												{
													name: 'value_1',
													nodeType: 'YulTypedName',
													src: '1788:7:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'value_1',
														nodeType: 'YulIdentifier',
														src: '1894:7:16',
													},
												],
												functionName: {
													name: 'validator_revert_contract_TransparentUpgradeableProxy',
													nodeType: 'YulIdentifier',
													src: '1840:53:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1840:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1840:62:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1911:17:16',
											value: {
												name: 'value_1',
												nodeType: 'YulIdentifier',
												src: '1921:7:16',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1911:6:16',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1937:46:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1968:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1979:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1964:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1964:18:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1951:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1951:32:16',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '1941:6:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1992:28:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '2002:18:16',
												type: '',
												value: '0xffffffffffffffff',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1996:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2047:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2056:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2059:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2049:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2049:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2049:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '2035:6:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '2043:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '2032:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2032:14:16',
											},
											nodeType: 'YulIf',
											src: '2029:34:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2072:32:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2086:9:16',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '2097:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2082:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2082:22:16',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '2076:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2152:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2161:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2164:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2154:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2154:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2154:12:16',
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
																		src: '2131:2:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '2135:4:16',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '2127:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '2127:13:16',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '2142:7:16',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '2123:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2123:27:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '2116:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2116:35:16',
											},
											nodeType: 'YulIf',
											src: '2113:55:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2177:26:16',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '2200:2:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '2187:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2187:16:16',
											},
											variables: [
												{
													name: '_3',
													nodeType: 'YulTypedName',
													src: '2181:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2226:22:16',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '2228:16:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2228:18:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2228:18:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '2218:2:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '2222:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '2215:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2215:10:16',
											},
											nodeType: 'YulIf',
											src: '2212:36:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2257:76:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '2267:66:16',
												type: '',
												value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0',
											},
											variables: [
												{
													name: '_4',
													nodeType: 'YulTypedName',
													src: '2261:2:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2342:23:16',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2362:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2356:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2356:9:16',
											},
											variables: [
												{
													name: 'memPtr',
													nodeType: 'YulTypedName',
													src: '2346:6:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2374:71:16',
											value: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '2396:6:16',
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
																						src: '2420:2:16',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '2424:4:16',
																						type: '',
																						value: '0x1f',
																					},
																				],
																				functionName: {
																					name: 'add',
																					nodeType: 'YulIdentifier',
																					src: '2416:3:16',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '2416:13:16',
																			},
																			{
																				name: '_4',
																				nodeType: 'YulIdentifier',
																				src: '2431:2:16',
																			},
																		],
																		functionName: {
																			name: 'and',
																			nodeType: 'YulIdentifier',
																			src: '2412:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '2412:22:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '2436:2:16',
																		type: '',
																		value: '63',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '2408:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '2408:31:16',
															},
															{
																name: '_4',
																nodeType: 'YulIdentifier',
																src: '2441:2:16',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '2404:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2404:40:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2392:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2392:53:16',
											},
											variables: [
												{
													name: 'newFreePtr',
													nodeType: 'YulTypedName',
													src: '2378:10:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2504:22:16',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '2506:16:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2506:18:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2506:18:16',
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
																src: '2463:10:16',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '2475:2:16',
															},
														],
														functionName: {
															name: 'gt',
															nodeType: 'YulIdentifier',
															src: '2460:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2460:18:16',
													},
													{
														arguments: [
															{
																name: 'newFreePtr',
																nodeType: 'YulIdentifier',
																src: '2483:10:16',
															},
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '2495:6:16',
															},
														],
														functionName: {
															name: 'lt',
															nodeType: 'YulIdentifier',
															src: '2480:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2480:22:16',
													},
												],
												functionName: {
													name: 'or',
													nodeType: 'YulIdentifier',
													src: '2457:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2457:46:16',
											},
											nodeType: 'YulIf',
											src: '2454:72:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2542:2:16',
														type: '',
														value: '64',
													},
													{
														name: 'newFreePtr',
														nodeType: 'YulIdentifier',
														src: '2546:10:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2535:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2535:22:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2535:22:16',
										},
										{
											expression: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '2573:6:16',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '2581:2:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2566:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2566:18:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2566:18:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2630:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2639:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2642:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2632:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2632:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2632:12:16',
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
																		src: '2607:2:16',
																	},
																	{
																		name: '_3',
																		nodeType: 'YulIdentifier',
																		src: '2611:2:16',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '2603:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '2603:11:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2616:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2599:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2599:20:16',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '2621:7:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '2596:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2596:33:16',
											},
											nodeType: 'YulIf',
											src: '2593:53:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '2672:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2680:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2668:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2668:15:16',
													},
													{
														arguments: [
															{
																name: '_2',
																nodeType: 'YulIdentifier',
																src: '2689:2:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2693:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2685:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2685:11:16',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '2698:2:16',
													},
												],
												functionName: {
													name: 'calldatacopy',
													nodeType: 'YulIdentifier',
													src: '2655:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2655:46:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2655:46:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																arguments: [
																	{
																		name: 'memPtr',
																		nodeType: 'YulIdentifier',
																		src: '2725:6:16',
																	},
																	{
																		name: '_3',
																		nodeType: 'YulIdentifier',
																		src: '2733:2:16',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '2721:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '2721:15:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2738:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2717:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2717:24:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2743:1:16',
														type: '',
														value: '0',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2710:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2710:35:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2710:35:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '2754:16:16',
											value: {
												name: 'memPtr',
												nodeType: 'YulIdentifier',
												src: '2764:6:16',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '2754:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019t_addresst_bytes_memory_ptr',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1525:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1536:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1548:6:16',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '1556:6:16',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '1564:6:16',
										type: '',
									},
								],
								src: '1426:1350:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2851:206:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '2897:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2906:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2909:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2899:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '2899:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '2899:12:16',
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
																src: '2872:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2881:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '2868:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2868:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2893:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '2864:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2864:32:16',
											},
											nodeType: 'YulIf',
											src: '2861:52:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2922:36:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2948:9:16',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '2935:12:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2935:23:16',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '2926:5:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '3021:5:16',
													},
												],
												functionName: {
													name: 'validator_revert_contract_TransparentUpgradeableProxy',
													nodeType: 'YulIdentifier',
													src: '2967:53:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2967:60:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2967:60:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3036:15:16',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '3046:5:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '3036:6:16',
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
										src: '2817:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2828:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2840:6:16',
										type: '',
									},
								],
								src: '2781:276:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3253:122:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3270:3:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3275:66:16',
														type: '',
														value: '0x5c60da1b00000000000000000000000000000000000000000000000000000000',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3263:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3263:79:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3263:79:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3351:18:16',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '3362:3:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3367:1:16',
														type: '',
														value: '4',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3358:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3358:11:16',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '3351:3:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_packed_t_stringliteral_96a4c6be7716f5be15d118c16bd1d464cb27f01187d0b9218993a5d488a47c29__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'pos',
										nodeType: 'YulTypedName',
										src: '3237:3:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '3245:3:16',
										type: '',
									},
								],
								src: '3062:313:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3469:199:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '3515:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3524:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3527:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '3517:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '3517:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '3517:12:16',
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
																src: '3490:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3499:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '3486:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3486:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3511:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '3482:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3482:32:16',
											},
											nodeType: 'YulIf',
											src: '3479:52:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3540:29:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3559:9:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '3553:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3553:16:16',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '3544:5:16',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '3632:5:16',
													},
												],
												functionName: {
													name: 'validator_revert_contract_TransparentUpgradeableProxy',
													nodeType: 'YulIdentifier',
													src: '3578:53:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3578:60:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3578:60:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3647:15:16',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '3657:5:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '3647:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_address_payable_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '3435:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '3446:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3458:6:16',
										type: '',
									},
								],
								src: '3380:288:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3847:182:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3864:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3875:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3857:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3857:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3857:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3898:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3909:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3894:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3894:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3914:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3887:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3887:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3887:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3937:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3948:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3933:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3933:18:16',
													},
													{
														hexValue: '4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '3953:34:16',
														type: '',
														value: 'Ownable: caller is not the owner',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3926:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3926:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3926:62:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3997:26:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '4009:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4020:2:16',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '4005:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4005:18:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3997:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_9924ebdf1add33d25d4ef888e16131f0a5687b0580a36c21b5c301a6c462effe__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '3824:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '3838:4:16',
										type: '',
									},
								],
								src: '3673:356:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '4181:627:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '4198:9:16',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '4213:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '4221:42:16',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '4209:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '4209:55:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '4191:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4191:74:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '4191:74:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '4274:12:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '4284:2:16',
												type: '',
												value: '32',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '4278:2:16',
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
																src: '4306:9:16',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '4317:2:16',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '4302:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '4302:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4322:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '4295:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4295:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '4295:30:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '4334:27:16',
											value: {
												arguments: [
													{
														name: 'value1',
														nodeType: 'YulIdentifier',
														src: '4354:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '4348:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4348:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '4338:6:16',
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
																src: '4381:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '4392:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '4377:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '4377:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '4397:6:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '4370:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4370:34:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '4370:34:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '4413:10:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '4422:1:16',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '4417:1:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '4482:90:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'headStart',
																					nodeType: 'YulIdentifier',
																					src: '4511:9:16',
																				},
																				{
																					name: 'i',
																					nodeType: 'YulIdentifier',
																					src: '4522:1:16',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '4507:3:16',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '4507:17:16',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '4526:2:16',
																			type: '',
																			value: '96',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '4503:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '4503:26:16',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					arguments: [
																						{
																							name: 'value1',
																							nodeType: 'YulIdentifier',
																							src: '4545:6:16',
																						},
																						{
																							name: 'i',
																							nodeType: 'YulIdentifier',
																							src: '4553:1:16',
																						},
																					],
																					functionName: {
																						name: 'add',
																						nodeType: 'YulIdentifier',
																						src: '4541:3:16',
																					},
																					nodeType: 'YulFunctionCall',
																					src: '4541:14:16',
																				},
																				{
																					name: '_1',
																					nodeType: 'YulIdentifier',
																					src: '4557:2:16',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '4537:3:16',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '4537:23:16',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '4531:5:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '4531:30:16',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '4496:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '4496:66:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '4496:66:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '4443:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '4446:6:16',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '4440:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4440:13:16',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '4454:19:16',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '4456:15:16',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '4465:1:16',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '4468:2:16',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '4461:3:16',
															},
															nodeType: 'YulFunctionCall',
															src: '4461:10:16',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '4456:1:16',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '4436:3:16',
												statements: [],
											},
											src: '4432:140:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '4606:66:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'headStart',
																					nodeType: 'YulIdentifier',
																					src: '4635:9:16',
																				},
																				{
																					name: 'length',
																					nodeType: 'YulIdentifier',
																					src: '4646:6:16',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '4631:3:16',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '4631:22:16',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '4655:2:16',
																			type: '',
																			value: '96',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '4627:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '4627:31:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4660:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '4620:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '4620:42:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '4620:42:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '4587:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '4590:6:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '4584:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4584:13:16',
											},
											nodeType: 'YulIf',
											src: '4581:91:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '4681:121:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '4697:9:16',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'length',
																				nodeType: 'YulIdentifier',
																				src: '4716:6:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '4724:2:16',
																				type: '',
																				value: '31',
																			},
																		],
																		functionName: {
																			name: 'add',
																			nodeType: 'YulIdentifier',
																			src: '4712:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '4712:15:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '4729:66:16',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '4708:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '4708:88:16',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '4693:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '4693:104:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4799:2:16',
														type: '',
														value: '96',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '4689:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4689:113:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '4681:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_address_t_bytes_memory_ptr__to_t_address_t_bytes_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '4142:9:16',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '4153:6:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '4161:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '4172:4:16',
										type: '',
									},
								],
								src: '4034:774:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '4987:228:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '5004:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '5015:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '4997:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '4997:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '4997:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '5038:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '5049:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '5034:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '5034:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '5054:2:16',
														type: '',
														value: '38',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '5027:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '5027:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '5027:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '5077:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '5088:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '5073:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '5073:18:16',
													},
													{
														hexValue: '4f776e61626c653a206e6577206f776e657220697320746865207a65726f2061',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '5093:34:16',
														type: '',
														value: 'Ownable: new owner is the zero a',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '5066:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '5066:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '5066:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '5148:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '5159:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '5144:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '5144:18:16',
													},
													{
														hexValue: '646472657373',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '5164:8:16',
														type: '',
														value: 'ddress',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '5137:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '5137:36:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '5137:36:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '5182:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '5194:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '5205:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '5190:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '5190:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '5182:4:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_245f15ff17f551913a7a18385165551503906a406f905ac1c2437281a7cd0cfe__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '4964:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '4978:4:16',
										type: '',
									},
								],
								src: '4813:402:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '5411:122:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '5428:3:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '5433:66:16',
														type: '',
														value: '0xf851a44000000000000000000000000000000000000000000000000000000000',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '5421:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '5421:79:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '5421:79:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '5509:18:16',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '5520:3:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '5525:1:16',
														type: '',
														value: '4',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '5516:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '5516:11:16',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '5509:3:16',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_packed_t_stringliteral_cb23cf6c353ccb16f0d92c8e6b5c5b425654e65dd07e2d295b394de4cf15afb7__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'pos',
										nodeType: 'YulTypedName',
										src: '5395:3:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '5403:3:16',
										type: '',
									},
								],
								src: '5220:313:16',
							},
						],
					},
					contents:
						'{\n    { }\n    function validator_revert_contract_TransparentUpgradeableProxy(value)\n    {\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n    }\n    function abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        validator_revert_contract_TransparentUpgradeableProxy(value)\n        value0 := value\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019t_address(headStart, dataEnd) -> value0, value1\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        let value := calldataload(headStart)\n        validator_revert_contract_TransparentUpgradeableProxy(value)\n        value0 := value\n        let value_1 := calldataload(add(headStart, 32))\n        validator_revert_contract_TransparentUpgradeableProxy(value_1)\n        value1 := value_1\n    }\n    function panic_error_0x41()\n    {\n        mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n        mstore(4, 0x41)\n        revert(0, 0x24)\n    }\n    function abi_decode_tuple_t_contract$_TransparentUpgradeableProxy_$1019t_addresst_bytes_memory_ptr(headStart, dataEnd) -> value0, value1, value2\n    {\n        if slt(sub(dataEnd, headStart), 96) { revert(0, 0) }\n        let value := calldataload(headStart)\n        validator_revert_contract_TransparentUpgradeableProxy(value)\n        value0 := value\n        let value_1 := calldataload(add(headStart, 32))\n        validator_revert_contract_TransparentUpgradeableProxy(value_1)\n        value1 := value_1\n        let offset := calldataload(add(headStart, 64))\n        let _1 := 0xffffffffffffffff\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let _3 := calldataload(_2)\n        if gt(_3, _1) { panic_error_0x41() }\n        let _4 := 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0\n        let memPtr := mload(64)\n        let newFreePtr := add(memPtr, and(add(and(add(_3, 0x1f), _4), 63), _4))\n        if or(gt(newFreePtr, _1), lt(newFreePtr, memPtr)) { panic_error_0x41() }\n        mstore(64, newFreePtr)\n        mstore(memPtr, _3)\n        if gt(add(add(_2, _3), 32), dataEnd) { revert(0, 0) }\n        calldatacopy(add(memPtr, 32), add(_2, 32), _3)\n        mstore(add(add(memPtr, _3), 32), 0)\n        value2 := memPtr\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        validator_revert_contract_TransparentUpgradeableProxy(value)\n        value0 := value\n    }\n    function abi_encode_tuple_packed_t_stringliteral_96a4c6be7716f5be15d118c16bd1d464cb27f01187d0b9218993a5d488a47c29__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos) -> end\n    {\n        mstore(pos, 0x5c60da1b00000000000000000000000000000000000000000000000000000000)\n        end := add(pos, 4)\n    }\n    function abi_decode_tuple_t_address_payable_fromMemory(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := mload(headStart)\n        validator_revert_contract_TransparentUpgradeableProxy(value)\n        value0 := value\n    }\n    function abi_encode_tuple_t_stringliteral_9924ebdf1add33d25d4ef888e16131f0a5687b0580a36c21b5c301a6c462effe__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 32)\n        mstore(add(headStart, 64), "Ownable: caller is not the owner")\n        tail := add(headStart, 96)\n    }\n    function abi_encode_tuple_t_address_t_bytes_memory_ptr__to_t_address_t_bytes_memory_ptr__fromStack_reversed(headStart, value1, value0) -> tail\n    {\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n        let _1 := 32\n        mstore(add(headStart, _1), 64)\n        let length := mload(value1)\n        mstore(add(headStart, 64), length)\n        let i := 0\n        for { } lt(i, length) { i := add(i, _1) }\n        {\n            mstore(add(add(headStart, i), 96), mload(add(add(value1, i), _1)))\n        }\n        if gt(i, length)\n        {\n            mstore(add(add(headStart, length), 96), 0)\n        }\n        tail := add(add(headStart, and(add(length, 31), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0)), 96)\n    }\n    function abi_encode_tuple_t_stringliteral_245f15ff17f551913a7a18385165551503906a406f905ac1c2437281a7cd0cfe__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 38)\n        mstore(add(headStart, 64), "Ownable: new owner is the zero a")\n        mstore(add(headStart, 96), "ddress")\n        tail := add(headStart, 128)\n    }\n    function abi_encode_tuple_packed_t_stringliteral_cb23cf6c353ccb16f0d92c8e6b5c5b425654e65dd07e2d295b394de4cf15afb7__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos) -> end\n    {\n        mstore(pos, 0xf851a44000000000000000000000000000000000000000000000000000000000)\n        end := add(pos, 4)\n    }\n}',
					id: 16,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x4 CALLDATASIZE LT PUSH2 0x7B JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x9623609D GT PUSH2 0x4E JUMPI DUP1 PUSH4 0x9623609D EQ PUSH2 0x12B JUMPI DUP1 PUSH4 0x99A88EC4 EQ PUSH2 0x13E JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x15E JUMPI DUP1 PUSH4 0xF3B7DEAD EQ PUSH2 0x17E JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 PUSH4 0x204E1C7A EQ PUSH2 0x80 JUMPI DUP1 PUSH4 0x715018A6 EQ PUSH2 0xC9 JUMPI DUP1 PUSH4 0x7EFF275E EQ PUSH2 0xE0 JUMPI DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x100 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x8C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA0 PUSH2 0x9B CALLDATASIZE PUSH1 0x4 PUSH2 0x7E4 JUMP JUMPDEST PUSH2 0x19E JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xD5 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0x255 JUMP JUMPDEST STOP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0xEC JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0xFB CALLDATASIZE PUSH1 0x4 PUSH2 0x808 JUMP JUMPDEST PUSH2 0x2E7 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x10C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH2 0xA0 JUMP JUMPDEST PUSH2 0xDE PUSH2 0x139 CALLDATASIZE PUSH1 0x4 PUSH2 0x870 JUMP JUMPDEST PUSH2 0x3EE JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x14A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0x159 CALLDATASIZE PUSH1 0x4 PUSH2 0x808 JUMP JUMPDEST PUSH2 0x4FC JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x16A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xDE PUSH2 0x179 CALLDATASIZE PUSH1 0x4 PUSH2 0x7E4 JUMP JUMPDEST PUSH2 0x5D1 JUMP JUMPDEST CALLVALUE DUP1 ISZERO PUSH2 0x18A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0xA0 PUSH2 0x199 CALLDATASIZE PUSH1 0x4 PUSH2 0x7E4 JUMP JUMPDEST PUSH2 0x701 JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH1 0x40 MLOAD PUSH2 0x1EA SWAP1 PUSH32 0x5C60DA1B00000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD SWAP1 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS STATICCALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x225 JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x22A JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP2 POP SWAP2 POP DUP2 PUSH2 0x239 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 DUP1 PUSH1 0x20 ADD SWAP1 MLOAD DUP2 ADD SWAP1 PUSH2 0x24D SWAP2 SWAP1 PUSH2 0x964 JUMP JUMPDEST SWAP5 SWAP4 POP POP POP POP JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x2DB JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH2 0x2E5 PUSH1 0x0 PUSH2 0x74D JUMP JUMPDEST JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x368 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH32 0x8F28397000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 DUP2 AND PUSH1 0x4 DUP4 ADD MSTORE DUP4 AND SWAP1 PUSH4 0x8F283970 SWAP1 PUSH1 0x24 ADD JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 PUSH1 0x0 DUP8 DUP1 EXTCODESIZE ISZERO DUP1 ISZERO PUSH2 0x3D2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP GAS CALL ISZERO DUP1 ISZERO PUSH2 0x3E6 JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x46F JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH32 0x4F1EF28600000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 AND SWAP1 PUSH4 0x4F1EF286 SWAP1 CALLVALUE SWAP1 PUSH2 0x4C5 SWAP1 DUP7 SWAP1 DUP7 SWAP1 PUSH1 0x4 ADD PUSH2 0x981 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 DUP9 DUP1 EXTCODESIZE ISZERO DUP1 ISZERO PUSH2 0x4DE JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP GAS CALL ISZERO DUP1 ISZERO PUSH2 0x4F2 JUMPI RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST POP POP POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x57D JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH32 0x3659CFE600000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 DUP2 AND PUSH1 0x4 DUP4 ADD MSTORE DUP4 AND SWAP1 PUSH4 0x3659CFE6 SWAP1 PUSH1 0x24 ADD PUSH2 0x3B8 JUMP JUMPDEST PUSH1 0x0 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x652 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A2063616C6C6572206973206E6F7420746865206F776E6572 PUSH1 0x44 DUP3 ADD MSTORE PUSH1 0x64 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND PUSH2 0x6F5 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4F776E61626C653A206E6577206F776E657220697320746865207A65726F2061 PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6464726573730000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH2 0x2D2 JUMP JUMPDEST PUSH2 0x6FE DUP2 PUSH2 0x74D JUMP JUMPDEST POP JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 DUP4 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND PUSH1 0x40 MLOAD PUSH2 0x1EA SWAP1 PUSH32 0xF851A44000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD SWAP1 JUMP JUMPDEST PUSH1 0x0 DUP1 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP4 DUP2 AND PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000 DUP4 AND DUP2 OR DUP5 SSTORE PUSH1 0x40 MLOAD SWAP2 SWAP1 SWAP3 AND SWAP3 DUP4 SWAP2 PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 SWAP2 SWAP1 LOG3 POP POP JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x6FE JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x7F6 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH2 0x801 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x40 DUP4 DUP6 SUB SLT ISZERO PUSH2 0x81B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP3 CALLDATALOAD PUSH2 0x826 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP2 POP PUSH1 0x20 DUP4 ADD CALLDATALOAD PUSH2 0x836 DUP2 PUSH2 0x7C2 JUMP JUMPDEST DUP1 SWAP2 POP POP SWAP3 POP SWAP3 SWAP1 POP JUMP JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 PUSH1 0x60 DUP5 DUP7 SUB SLT ISZERO PUSH2 0x885 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP4 CALLDATALOAD PUSH2 0x890 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP3 POP PUSH1 0x20 DUP5 ADD CALLDATALOAD PUSH2 0x8A0 DUP2 PUSH2 0x7C2 JUMP JUMPDEST SWAP2 POP PUSH1 0x40 DUP5 ADD CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x8BD JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP7 ADD SWAP2 POP DUP7 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x8D1 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD DUP2 DUP2 GT ISZERO PUSH2 0x8E3 JUMPI PUSH2 0x8E3 PUSH2 0x841 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH2 0x929 JUMPI PUSH2 0x929 PUSH2 0x841 JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP10 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH2 0x942 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP3 PUSH1 0x20 DUP7 ADD PUSH1 0x20 DUP4 ADD CALLDATACOPY PUSH1 0x0 PUSH1 0x20 DUP5 DUP4 ADD ADD MSTORE DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 POP SWAP3 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x976 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD PUSH2 0x801 DUP2 PUSH2 0x7C2 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP4 AND DUP2 MSTORE PUSH1 0x0 PUSH1 0x20 PUSH1 0x40 DUP2 DUP5 ADD MSTORE DUP4 MLOAD DUP1 PUSH1 0x40 DUP6 ADD MSTORE PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x9CB JUMPI DUP6 DUP2 ADD DUP4 ADD MLOAD DUP6 DUP3 ADD PUSH1 0x60 ADD MSTORE DUP3 ADD PUSH2 0x9AF JUMP JUMPDEST DUP2 DUP2 GT ISZERO PUSH2 0x9DD JUMPI PUSH1 0x0 PUSH1 0x60 DUP4 DUP8 ADD ADD MSTORE JUMPDEST POP PUSH1 0x1F ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND SWAP3 SWAP1 SWAP3 ADD PUSH1 0x60 ADD SWAP5 SWAP4 POP POP POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xBD PUSH13 0x9AB03BFAF9EC60A4BF8CD9890 EXTCODECOPY 0xEC 0xB8 SWAP2 SWAP8 0x4E OR 0xE2 0xD7 PUSH11 0x3B2002C97EEB8964736F6C PUSH4 0x4300080A STOP CALLER ',
			sourceMap:
				'435:2470:8:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;701:437;;;;;;;;;;-1:-1:-1;701:437:8;;;;;:::i;:::-;;:::i;:::-;;;695:42:16;683:55;;;665:74;;653:2;638:18;701:437:8;;;;;;;1689:101:0;;;;;;;;;;;;;:::i;:::-;;1891:148:8;;;;;;;;;;-1:-1:-1;1891:148:8;;;;;:::i;:::-;;:::i;1057:85:0:-;;;;;;;;;;-1:-1:-1;1103:7:0;1129:6;;;1057:85;;2659:244:8;;;;;;:::i;:::-;;:::i;2244:149::-;;;;;;;;;;-1:-1:-1;2244:149:8;;;;;:::i;:::-;;:::i;1939:198:0:-;;;;;;;;;;-1:-1:-1;1939:198:0;;;;;:::i;:::-;;:::i;1298:419:8:-;;;;;;;;;;-1:-1:-1;1298:419:8;;;;;:::i;:::-;;:::i;701:437::-;797:7;974:12;988:23;1023:5;1015:25;;:40;;;;3275:66:16;3263:79;;3367:1;3358:11;;3062:313;1015:40:8;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;973:82;;;;1073:7;1065:16;;;;;;1109:10;1098:33;;;;;;;;;;;;:::i;:::-;1091:40;701:437;-1:-1:-1;;;;701:437:8:o;1689:101:0:-;1103:7;1129:6;1269:23;1129:6;719:10:13;1269:23:0;1261:68;;;;;;;3875:2:16;1261:68:0;;;3857:21:16;;;3894:18;;;3887:30;3953:34;3933:18;;;3926:62;4005:18;;1261:68:0;;;;;;;;;1753:30:::1;1780:1;1753:18;:30::i;:::-;1689:101::o:0;1891:148:8:-;1103:7:0;1129:6;1269:23;1129:6;719:10:13;1269:23:0;1261:68;;;;;;;3875:2:16;1261:68:0;;;3857:21:16;;;3894:18;;;3887:30;3953:34;3933:18;;;3926:62;4005:18;;1261:68:0;3673:356:16;1261:68:0;2005:27:8::1;::::0;;;;:17:::1;683:55:16::0;;;2005:27:8::1;::::0;::::1;665:74:16::0;2005:17:8;::::1;::::0;::::1;::::0;638:18:16;;2005:27:8::1;;;;;;;;;;;;;;;;;;::::0;::::1;;;;;;;;;;;;::::0;::::1;;;;;;;;;1891:148:::0;;:::o;2659:244::-;1103:7:0;1129:6;1269:23;1129:6;719:10:13;1269:23:0;1261:68;;;;;;;3875:2:16;1261:68:0;;;3857:21:16;;;3894:18;;;3887:30;3953:34;3933:18;;;3926:62;4005:18;;1261:68:0;3673:356:16;1261:68:0;2834:62:8::1;::::0;;;;:22:::1;::::0;::::1;::::0;::::1;::::0;2864:9:::1;::::0;2834:62:::1;::::0;2875:14;;2891:4;;2834:62:::1;;;:::i;:::-;;;;;;;;;;;;;;;;;;::::0;::::1;;;;;;;;;;;;::::0;::::1;;;;;;;;;;2659:244:::0;;;:::o;2244:149::-;1103:7:0;1129:6;1269:23;1129:6;719:10:13;1269:23:0;1261:68;;;;;;;3875:2:16;1261:68:0;;;3857:21:16;;;3894:18;;;3887:30;3953:34;3933:18;;;3926:62;4005:18;;1261:68:0;3673:356:16;1261:68:0;2355:31:8::1;::::0;;;;:15:::1;683:55:16::0;;;2355:31:8::1;::::0;::::1;665:74:16::0;2355:15:8;::::1;::::0;::::1;::::0;638:18:16;;2355:31:8::1;519:226:16::0;1939:198:0;1103:7;1129:6;1269:23;1129:6;719:10:13;1269:23:0;1261:68;;;;;;;3875:2:16;1261:68:0;;;3857:21:16;;;3894:18;;;3887:30;3953:34;3933:18;;;3926:62;4005:18;;1261:68:0;3673:356:16;1261:68:0;2027:22:::1;::::0;::::1;2019:73;;;::::0;::::1;::::0;;5015:2:16;2019:73:0::1;::::0;::::1;4997:21:16::0;5054:2;5034:18;;;5027:30;5093:34;5073:18;;;5066:62;5164:8;5144:18;;;5137:36;5190:19;;2019:73:0::1;4813:402:16::0;2019:73:0::1;2102:28;2121:8;2102:18;:28::i;:::-;1939:198:::0;:::o;1298:419:8:-;1385:7;1553:12;1567:23;1602:5;1594:25;;:40;;;;5433:66:16;5421:79;;5525:1;5516:11;;5220:313;2291:187:0;2364:16;2383:6;;;2399:17;;;;;;;;;;2431:40;;2383:6;;;;;;;2431:40;;2364:16;2431:40;2354:124;2291:187;:::o;14:183:16:-;129:42;122:5;118:54;111:5;108:65;98:93;;187:1;184;177:12;202:312;297:6;350:2;338:9;329:7;325:23;321:32;318:52;;;366:1;363;356:12;318:52;405:9;392:23;424:60;478:5;424:60;:::i;:::-;503:5;202:312;-1:-1:-1;;;202:312:16:o;750:482::-;854:6;862;915:2;903:9;894:7;890:23;886:32;883:52;;;931:1;928;921:12;883:52;970:9;957:23;989:60;1043:5;989:60;:::i;:::-;1068:5;-1:-1:-1;1125:2:16;1110:18;;1097:32;1138:62;1097:32;1138:62;:::i;:::-;1219:7;1209:17;;;750:482;;;;;:::o;1237:184::-;1289:77;1286:1;1279:88;1386:4;1383:1;1376:15;1410:4;1407:1;1400:15;1426:1350;1548:6;1556;1564;1617:2;1605:9;1596:7;1592:23;1588:32;1585:52;;;1633:1;1630;1623:12;1585:52;1672:9;1659:23;1691:60;1745:5;1691:60;:::i;:::-;1770:5;-1:-1:-1;1827:2:16;1812:18;;1799:32;1840:62;1799:32;1840:62;:::i;:::-;1921:7;-1:-1:-1;1979:2:16;1964:18;;1951:32;2002:18;2032:14;;;2029:34;;;2059:1;2056;2049:12;2029:34;2097:6;2086:9;2082:22;2072:32;;2142:7;2135:4;2131:2;2127:13;2123:27;2113:55;;2164:1;2161;2154:12;2113:55;2200:2;2187:16;2222:2;2218;2215:10;2212:36;;;2228:18;;:::i;:::-;2362:2;2356:9;2424:4;2416:13;;2267:66;2412:22;;;2436:2;2408:31;2404:40;2392:53;;;2460:18;;;2480:22;;;2457:46;2454:72;;;2506:18;;:::i;:::-;2546:10;2542:2;2535:22;2581:2;2573:6;2566:18;2621:7;2616:2;2611;2607;2603:11;2599:20;2596:33;2593:53;;;2642:1;2639;2632:12;2593:53;2698:2;2693;2689;2685:11;2680:2;2672:6;2668:15;2655:46;2743:1;2738:2;2733;2725:6;2721:15;2717:24;2710:35;2764:6;2754:16;;;;;;;1426:1350;;;;;:::o;3380:288::-;3458:6;3511:2;3499:9;3490:7;3486:23;3482:32;3479:52;;;3527:1;3524;3517:12;3479:52;3559:9;3553:16;3578:60;3632:5;3578:60;:::i;4034:774::-;4221:42;4213:6;4209:55;4198:9;4191:74;4172:4;4284:2;4322;4317;4306:9;4302:18;4295:30;4354:6;4348:13;4397:6;4392:2;4381:9;4377:18;4370:34;4422:1;4432:140;4446:6;4443:1;4440:13;4432:140;;;4541:14;;;4537:23;;4531:30;4507:17;;;4526:2;4503:26;4496:66;4461:10;;4432:140;;;4590:6;4587:1;4584:13;4581:91;;;4660:1;4655:2;4646:6;4635:9;4631:22;4627:31;4620:42;4581:91;-1:-1:-1;4724:2:16;4712:15;4729:66;4708:88;4693:104;;;;4799:2;4689:113;;4034:774;-1:-1:-1;;;;4034:774:16:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '526400',
				executionCost: 'infinite',
				totalCost: 'infinite',
			},
			external: {
				'changeProxyAdmin(address,address)': 'infinite',
				'getProxyAdmin(address)': 'infinite',
				'getProxyImplementation(address)': 'infinite',
				'owner()': '2362',
				'renounceOwnership()': '28098',
				'transferOwnership(address)': 'infinite',
				'upgrade(address,address)': 'infinite',
				'upgradeAndCall(address,address,bytes)': 'infinite',
			},
		},
		methodIdentifiers: {
			'changeProxyAdmin(address,address)': '7eff275e',
			'getProxyAdmin(address)': 'f3b7dead',
			'getProxyImplementation(address)': '204e1c7a',
			'owner()': '8da5cb5b',
			'renounceOwnership()': '715018a6',
			'transferOwnership(address)': 'f2fde38b',
			'upgrade(address,address)': '99a88ec4',
			'upgradeAndCall(address,address,bytes)': '9623609d',
		},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"contract TransparentUpgradeableProxy","name":"proxy","type":"address"},{"internalType":"address","name":"newAdmin","type":"address"}],"name":"changeProxyAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract TransparentUpgradeableProxy","name":"proxy","type":"address"}],"name":"getProxyAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract TransparentUpgradeableProxy","name":"proxy","type":"address"}],"name":"getProxyImplementation","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract TransparentUpgradeableProxy","name":"proxy","type":"address"},{"internalType":"address","name":"implementation","type":"address"}],"name":"upgrade","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract TransparentUpgradeableProxy","name":"proxy","type":"address"},{"internalType":"address","name":"implementation","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"upgradeAndCall","outputs":[],"stateMutability":"payable","type":"function"}],"devdoc":{"details":"This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.","kind":"dev","methods":{"changeProxyAdmin(address,address)":{"details":"Changes the admin of `proxy` to `newAdmin`. Requirements: - This contract must be the current admin of `proxy`."},"getProxyAdmin(address)":{"details":"Returns the current admin of `proxy`. Requirements: - This contract must be the admin of `proxy`."},"getProxyImplementation(address)":{"details":"Returns the current implementation of `proxy`. Requirements: - This contract must be the admin of `proxy`."},"owner()":{"details":"Returns the address of the current owner."},"renounceOwnership()":{"details":"Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner."},"transferOwnership(address)":{"details":"Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner."},"upgrade(address,address)":{"details":"Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}. Requirements: - This contract must be the admin of `proxy`."},"upgradeAndCall(address,address,bytes)":{"details":"Upgrades `proxy` to `implementation` and calls a function on the new implementation. See {TransparentUpgradeableProxy-upgradeToAndCall}. Requirements: - This contract must be the admin of `proxy`."}},"version":1},"userdoc":{"kind":"user","methods":{},"version":1}},"settings":{"compilationTarget":{"solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol":"ProxyAdmin"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/openzeppelin/access/Ownable.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../utils/Context.sol\\";\\n\\n/**\\n * @dev Contract module which provides a basic access control mechanism, where\\n * there is an account (an owner) that can be granted exclusive access to\\n * specific functions.\\n *\\n * By default, the owner account will be the one that deploys the contract. This\\n * can later be changed with {transferOwnership}.\\n *\\n * This module is used through inheritance. It will make available the modifier\\n * `onlyOwner`, which can be applied to your functions to restrict their use to\\n * the owner.\\n */\\nabstract contract Ownable is Context {\\n    address private _owner;\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    /**\\n     * @dev Initializes the contract setting the deployer as the initial owner.\\n     */\\n    constructor (address initialOwner) {\\n        _transferOwnership(initialOwner);\\n    }\\n\\n    /**\\n     * @dev Returns the address of the current owner.\\n     */\\n    function owner() public view virtual returns (address) {\\n        return _owner;\\n    }\\n\\n    /**\\n     * @dev Throws if called by any account other than the owner.\\n     */\\n    modifier onlyOwner() {\\n        require(owner() == _msgSender(), \\"Ownable: caller is not the owner\\");\\n        _;\\n    }\\n\\n    /**\\n     * @dev Leaves the contract without owner. It will not be possible to call\\n     * `onlyOwner` functions anymore. Can only be called by the current owner.\\n     *\\n     * NOTE: Renouncing ownership will leave the contract without an owner,\\n     * thereby removing any functionality that is only available to the owner.\\n     */\\n    function renounceOwnership() public virtual onlyOwner {\\n        _transferOwnership(address(0));\\n    }\\n\\n    /**\\n     * @dev Transfers ownership of the contract to a new account (`newOwner`).\\n     * Can only be called by the current owner.\\n     */\\n    function transferOwnership(address newOwner) public virtual onlyOwner {\\n        require(newOwner != address(0), \\"Ownable: new owner is the zero address\\");\\n        _transferOwnership(newOwner);\\n    }\\n\\n    /**\\n     * @dev Transfers ownership of the contract to a new account (`newOwner`).\\n     * Internal function without access restriction.\\n     */\\n    function _transferOwnership(address newOwner) internal virtual {\\n        address oldOwner = _owner;\\n        _owner = newOwner;\\n        emit OwnershipTransferred(oldOwner, newOwner);\\n    }\\n}\\n","keccak256":"0x9b2bbba5bb04f53f277739c1cdff896ba8b3bf591cfc4eab2098c655e8ac251e","license":"MIT"},"solc_0.8/openzeppelin/interfaces/draft-IERC1822.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (interfaces/draft-IERC1822.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev ERC1822: Universal Upgradeable Proxy Standard (UUPS) documents a method for upgradeability through a simplified\\n * proxy whose upgrades are fully controlled by the current implementation.\\n */\\ninterface IERC1822Proxiable {\\n    /**\\n     * @dev Returns the storage slot that the proxiable contract assumes is being used to store the implementation\\n     * address.\\n     *\\n     * IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks\\n     * bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this\\n     * function revert if invoked through a proxy.\\n     */\\n    function proxiableUUID() external view returns (bytes32);\\n}\\n","keccak256":"0x93b4e21c931252739a1ec13ea31d3d35a5c068be3163ccab83e4d70c40355f03","license":"MIT"},"solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/ERC1967/ERC1967Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../Proxy.sol\\";\\nimport \\"./ERC1967Upgrade.sol\\";\\n\\n/**\\n * @dev This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an\\n * implementation address that can be changed. This address is stored in storage in the location specified by\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn\'t conflict with the storage layout of the\\n * implementation behind the proxy.\\n */\\ncontract ERC1967Proxy is Proxy, ERC1967Upgrade {\\n    /**\\n     * @dev Initializes the upgradeable proxy with an initial implementation specified by `_logic`.\\n     *\\n     * If `_data` is nonempty, it\'s used as data in a delegate call to `_logic`. This will typically be an encoded\\n     * function call, and allows initializating the storage of the proxy like a Solidity constructor.\\n     */\\n    constructor(address _logic, bytes memory _data) payable {\\n        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.implementation\\")) - 1));\\n        _upgradeToAndCall(_logic, _data, false);\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _implementation() internal view virtual override returns (address impl) {\\n        return ERC1967Upgrade._getImplementation();\\n    }\\n}\\n","keccak256":"0x6309f9f39dc6f4f45a24f296543867aa358e32946cd6b2874627a996d606b3a0","license":"MIT"},"solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Upgrade.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/ERC1967/ERC1967Upgrade.sol)\\n\\npragma solidity ^0.8.2;\\n\\nimport \\"../beacon/IBeacon.sol\\";\\nimport \\"../../interfaces/draft-IERC1822.sol\\";\\nimport \\"../../utils/Address.sol\\";\\nimport \\"../../utils/StorageSlot.sol\\";\\n\\n/**\\n * @dev This abstract contract provides getters and event emitting update functions for\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967] slots.\\n *\\n * _Available since v4.1._\\n *\\n * @custom:oz-upgrades-unsafe-allow delegatecall\\n */\\nabstract contract ERC1967Upgrade {\\n    // This is the keccak-256 hash of \\"eip1967.proxy.rollback\\" subtracted by 1\\n    bytes32 private constant _ROLLBACK_SLOT = 0x4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd9143;\\n\\n    /**\\n     * @dev Storage slot with the address of the current implementation.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.implementation\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n\\n    /**\\n     * @dev Emitted when the implementation is upgraded.\\n     */\\n    event Upgraded(address indexed implementation);\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _getImplementation() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 implementation slot.\\n     */\\n    function _setImplementation(address newImplementation) private {\\n        require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeTo(address newImplementation) internal {\\n        _setImplementation(newImplementation);\\n        emit Upgraded(newImplementation);\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCall(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _upgradeTo(newImplementation);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(newImplementation, data);\\n        }\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with security checks for UUPS proxies, and additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCallUUPS(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        // Upgrades from old implementations will perform a rollback test. This test requires the new\\n        // implementation to upgrade back to the old, non-ERC1822 compliant, implementation. Removing\\n        // this special case will break upgrade paths from old UUPS implementation to new ones.\\n        if (StorageSlot.getBooleanSlot(_ROLLBACK_SLOT).value) {\\n            _setImplementation(newImplementation);\\n        } else {\\n            try IERC1822Proxiable(newImplementation).proxiableUUID() returns (bytes32 slot) {\\n                require(slot == _IMPLEMENTATION_SLOT, \\"ERC1967Upgrade: unsupported proxiableUUID\\");\\n            } catch {\\n                revert(\\"ERC1967Upgrade: new implementation is not UUPS\\");\\n            }\\n            _upgradeToAndCall(newImplementation, data, forceCall);\\n        }\\n    }\\n\\n    /**\\n     * @dev Storage slot with the admin of the contract.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.admin\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;\\n\\n    /**\\n     * @dev Emitted when the admin account has changed.\\n     */\\n    event AdminChanged(address previousAdmin, address newAdmin);\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _getAdmin() internal view virtual returns (address) {\\n        return StorageSlot.getAddressSlot(_ADMIN_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 admin slot.\\n     */\\n    function _setAdmin(address newAdmin) private {\\n        require(newAdmin != address(0), \\"ERC1967: new admin is the zero address\\");\\n        StorageSlot.getAddressSlot(_ADMIN_SLOT).value = newAdmin;\\n    }\\n\\n    /**\\n     * @dev Changes the admin of the proxy.\\n     *\\n     * Emits an {AdminChanged} event.\\n     */\\n    function _changeAdmin(address newAdmin) internal {\\n        emit AdminChanged(_getAdmin(), newAdmin);\\n        _setAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.\\n     * This is bytes32(uint256(keccak256(\'eip1967.proxy.beacon\')) - 1)) and is validated in the constructor.\\n     */\\n    bytes32 internal constant _BEACON_SLOT = 0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50;\\n\\n    /**\\n     * @dev Emitted when the beacon is upgraded.\\n     */\\n    event BeaconUpgraded(address indexed beacon);\\n\\n    /**\\n     * @dev Returns the current beacon.\\n     */\\n    function _getBeacon() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_BEACON_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new beacon in the EIP1967 beacon slot.\\n     */\\n    function _setBeacon(address newBeacon) private {\\n        require(Address.isContract(newBeacon), \\"ERC1967: new beacon is not a contract\\");\\n        require(Address.isContract(IBeacon(newBeacon).implementation()), \\"ERC1967: beacon implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_BEACON_SLOT).value = newBeacon;\\n    }\\n\\n    /**\\n     * @dev Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does\\n     * not upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that).\\n     *\\n     * Emits a {BeaconUpgraded} event.\\n     */\\n    function _upgradeBeaconToAndCall(\\n        address newBeacon,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _setBeacon(newBeacon);\\n        emit BeaconUpgraded(newBeacon);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(IBeacon(newBeacon).implementation(), data);\\n        }\\n    }\\n}\\n","keccak256":"0x17668652127feebed0ce8d9431ef95ccc8c4292f03e3b8cf06c6ca16af396633","license":"MIT"},"solc_0.8/openzeppelin/proxy/Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This abstract contract provides a fallback function that delegates all calls to another contract using the EVM\\n * instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to\\n * be specified by overriding the virtual {_implementation} function.\\n *\\n * Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a\\n * different contract through the {_delegate} function.\\n *\\n * The success and return data of the delegated call will be returned back to the caller of the proxy.\\n */\\nabstract contract Proxy {\\n    /**\\n     * @dev Delegates the current call to `implementation`.\\n     *\\n     * This function does not return to its internal call site, it will return directly to the external caller.\\n     */\\n    function _delegate(address implementation) internal virtual {\\n        assembly {\\n            // Copy msg.data. We take full control of memory in this inline assembly\\n            // block because it will not return to Solidity code. We overwrite the\\n            // Solidity scratch pad at memory position 0.\\n            calldatacopy(0, 0, calldatasize())\\n\\n            // Call the implementation.\\n            // out and outsize are 0 because we don\'t know the size yet.\\n            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)\\n\\n            // Copy the returned data.\\n            returndatacopy(0, 0, returndatasize())\\n\\n            switch result\\n            // delegatecall returns 0 on error.\\n            case 0 {\\n                revert(0, returndatasize())\\n            }\\n            default {\\n                return(0, returndatasize())\\n            }\\n        }\\n    }\\n\\n    /**\\n     * @dev This is a virtual function that should be overriden so it returns the address to which the fallback function\\n     * and {_fallback} should delegate.\\n     */\\n    function _implementation() internal view virtual returns (address);\\n\\n    /**\\n     * @dev Delegates the current call to the address returned by `_implementation()`.\\n     *\\n     * This function does not return to its internall call site, it will return directly to the external caller.\\n     */\\n    function _fallback() internal virtual {\\n        _beforeFallback();\\n        _delegate(_implementation());\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other\\n     * function in the contract matches the call data.\\n     */\\n    fallback() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data\\n     * is empty.\\n     */\\n    receive() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Hook that is called before falling back to the implementation. Can happen as part of a manual `_fallback`\\n     * call, or as part of the Solidity `fallback` or `receive` functions.\\n     *\\n     * If overriden should call `super._beforeFallback()`.\\n     */\\n    function _beforeFallback() internal virtual {}\\n}\\n","keccak256":"0xd5d1fd16e9faff7fcb3a52e02a8d49156f42a38a03f07b5f1810c21c2149a8ab","license":"MIT"},"solc_0.8/openzeppelin/proxy/beacon/IBeacon.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/beacon/IBeacon.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This is the interface that {BeaconProxy} expects of its beacon.\\n */\\ninterface IBeacon {\\n    /**\\n     * @dev Must return an address that can be used as a delegate call target.\\n     *\\n     * {BeaconProxy} will check that this address is a contract.\\n     */\\n    function implementation() external view returns (address);\\n}\\n","keccak256":"0xd50a3421ac379ccb1be435fa646d66a65c986b4924f0849839f08692f39dde61","license":"MIT"},"solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/transparent/ProxyAdmin.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"./TransparentUpgradeableProxy.sol\\";\\nimport \\"../../access/Ownable.sol\\";\\n\\n/**\\n * @dev This is an auxiliary contract meant to be assigned as the admin of a {TransparentUpgradeableProxy}. For an\\n * explanation of why you would want to use this see the documentation for {TransparentUpgradeableProxy}.\\n */\\ncontract ProxyAdmin is Ownable {\\n\\n    constructor (address initialOwner) Ownable(initialOwner) {}\\n\\n    /**\\n     * @dev Returns the current implementation of `proxy`.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function getProxyImplementation(TransparentUpgradeableProxy proxy) public view virtual returns (address) {\\n        // We need to manually run the static call since the getter cannot be flagged as view\\n        // bytes4(keccak256(\\"implementation()\\")) == 0x5c60da1b\\n        (bool success, bytes memory returndata) = address(proxy).staticcall(hex\\"5c60da1b\\");\\n        require(success);\\n        return abi.decode(returndata, (address));\\n    }\\n\\n    /**\\n     * @dev Returns the current admin of `proxy`.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function getProxyAdmin(TransparentUpgradeableProxy proxy) public view virtual returns (address) {\\n        // We need to manually run the static call since the getter cannot be flagged as view\\n        // bytes4(keccak256(\\"admin()\\")) == 0xf851a440\\n        (bool success, bytes memory returndata) = address(proxy).staticcall(hex\\"f851a440\\");\\n        require(success);\\n        return abi.decode(returndata, (address));\\n    }\\n\\n    /**\\n     * @dev Changes the admin of `proxy` to `newAdmin`.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the current admin of `proxy`.\\n     */\\n    function changeProxyAdmin(TransparentUpgradeableProxy proxy, address newAdmin) public virtual onlyOwner {\\n        proxy.changeAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev Upgrades `proxy` to `implementation`. See {TransparentUpgradeableProxy-upgradeTo}.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function upgrade(TransparentUpgradeableProxy proxy, address implementation) public virtual onlyOwner {\\n        proxy.upgradeTo(implementation);\\n    }\\n\\n    /**\\n     * @dev Upgrades `proxy` to `implementation` and calls a function on the new implementation. See\\n     * {TransparentUpgradeableProxy-upgradeToAndCall}.\\n     *\\n     * Requirements:\\n     *\\n     * - This contract must be the admin of `proxy`.\\n     */\\n    function upgradeAndCall(\\n        TransparentUpgradeableProxy proxy,\\n        address implementation,\\n        bytes memory data\\n    ) public payable virtual onlyOwner {\\n        proxy.upgradeToAndCall{value: msg.value}(implementation, data);\\n    }\\n}\\n","keccak256":"0x754888b9c9ab5525343460b0a4fa2e2f4fca9b6a7e0e7ddea4154e2b1182a45d","license":"MIT"},"solc_0.8/openzeppelin/proxy/transparent/TransparentUpgradeableProxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/transparent/TransparentUpgradeableProxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../ERC1967/ERC1967Proxy.sol\\";\\n\\n/**\\n * @dev This contract implements a proxy that is upgradeable by an admin.\\n *\\n * To avoid https://medium.com/nomic-labs-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357[proxy selector\\n * clashing], which can potentially be used in an attack, this contract uses the\\n * https://blog.openzeppelin.com/the-transparent-proxy-pattern/[transparent proxy pattern]. This pattern implies two\\n * things that go hand in hand:\\n *\\n * 1. If any account other than the admin calls the proxy, the call will be forwarded to the implementation, even if\\n * that call matches one of the admin functions exposed by the proxy itself.\\n * 2. If the admin calls the proxy, it can access the admin functions, but its calls will never be forwarded to the\\n * implementation. If the admin tries to call a function on the implementation it will fail with an error that says\\n * \\"admin cannot fallback to proxy target\\".\\n *\\n * These properties mean that the admin account can only be used for admin actions like upgrading the proxy or changing\\n * the admin, so it\'s best if it\'s a dedicated account that is not used for anything else. This will avoid headaches due\\n * to sudden errors when trying to call a function from the proxy implementation.\\n *\\n * Our recommendation is for the dedicated account to be an instance of the {ProxyAdmin} contract. If set up this way,\\n * you should think of the `ProxyAdmin` instance as the real administrative interface of your proxy.\\n */\\ncontract TransparentUpgradeableProxy is ERC1967Proxy {\\n    /**\\n     * @dev Initializes an upgradeable proxy managed by `_admin`, backed by the implementation at `_logic`, and\\n     * optionally initialized with `_data` as explained in {ERC1967Proxy-constructor}.\\n     */\\n    constructor(\\n        address _logic,\\n        address admin_,\\n        bytes memory _data\\n    ) payable ERC1967Proxy(_logic, _data) {\\n        assert(_ADMIN_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.admin\\")) - 1));\\n        _changeAdmin(admin_);\\n    }\\n\\n    /**\\n     * @dev Modifier used internally that will delegate the call to the implementation unless the sender is the admin.\\n     */\\n    modifier ifAdmin() {\\n        if (msg.sender == _getAdmin()) {\\n            _;\\n        } else {\\n            _fallback();\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyAdmin}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`\\n     */\\n    function admin() external ifAdmin returns (address admin_) {\\n        admin_ = _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-getProxyImplementation}.\\n     *\\n     * TIP: To get this value clients can read directly from the storage slot shown below (specified by EIP1967) using the\\n     * https://eth.wiki/json-rpc/API#eth_getstorageat[`eth_getStorageAt`] RPC call.\\n     * `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`\\n     */\\n    function implementation() external ifAdmin returns (address implementation_) {\\n        implementation_ = _implementation();\\n    }\\n\\n    /**\\n     * @dev Changes the admin of the proxy.\\n     *\\n     * Emits an {AdminChanged} event.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-changeProxyAdmin}.\\n     */\\n    function changeAdmin(address newAdmin) external virtual ifAdmin {\\n        _changeAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgrade}.\\n     */\\n    function upgradeTo(address newImplementation) external ifAdmin {\\n        _upgradeToAndCall(newImplementation, bytes(\\"\\"), false);\\n    }\\n\\n    /**\\n     * @dev Upgrade the implementation of the proxy, and then call a function from the new implementation as specified\\n     * by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the\\n     * proxied contract.\\n     *\\n     * NOTE: Only the admin can call this function. See {ProxyAdmin-upgradeAndCall}.\\n     */\\n    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable ifAdmin {\\n        _upgradeToAndCall(newImplementation, data, true);\\n    }\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _admin() internal view virtual returns (address) {\\n        return _getAdmin();\\n    }\\n\\n    /**\\n     * @dev Makes sure the admin cannot access the fallback function. See {Proxy-_beforeFallback}.\\n     */\\n    function _beforeFallback() internal virtual override {\\n        require(msg.sender != _getAdmin(), \\"TransparentUpgradeableProxy: admin cannot fallback to proxy target\\");\\n        super._beforeFallback();\\n    }\\n}\\n","keccak256":"0x140055a64cf579d622e04f5a198595832bf2cb193cd0005f4f2d4d61ca906253","license":"MIT"},"solc_0.8/openzeppelin/utils/Address.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (utils/Address.sol)\\n\\npragma solidity ^0.8.1;\\n\\n/**\\n * @dev Collection of functions related to the address type\\n */\\nlibrary Address {\\n    /**\\n     * @dev Returns true if `account` is a contract.\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * It is unsafe to assume that an address for which this function returns\\n     * false is an externally-owned account (EOA) and not a contract.\\n     *\\n     * Among others, `isContract` will return false for the following\\n     * types of addresses:\\n     *\\n     *  - an externally-owned account\\n     *  - a contract in construction\\n     *  - an address where a contract will be created\\n     *  - an address where a contract lived, but was destroyed\\n     * ====\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * You shouldn\'t rely on `isContract` to protect against flash loan attacks!\\n     *\\n     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets\\n     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract\\n     * constructor.\\n     * ====\\n     */\\n    function isContract(address account) internal view returns (bool) {\\n        // This method relies on extcodesize/address.code.length, which returns 0\\n        // for contracts in construction, since the code is only stored at the end\\n        // of the constructor execution.\\n\\n        return account.code.length > 0;\\n    }\\n\\n    /**\\n     * @dev Replacement for Solidity\'s `transfer`: sends `amount` wei to\\n     * `recipient`, forwarding all available gas and reverting on errors.\\n     *\\n     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost\\n     * of certain opcodes, possibly making contracts go over the 2300 gas limit\\n     * imposed by `transfer`, making them unable to receive funds via\\n     * `transfer`. {sendValue} removes this limitation.\\n     *\\n     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].\\n     *\\n     * IMPORTANT: because control is transferred to `recipient`, care must be\\n     * taken to not create reentrancy vulnerabilities. Consider using\\n     * {ReentrancyGuard} or the\\n     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].\\n     */\\n    function sendValue(address payable recipient, uint256 amount) internal {\\n        require(address(this).balance >= amount, \\"Address: insufficient balance\\");\\n\\n        (bool success, ) = recipient.call{value: amount}(\\"\\");\\n        require(success, \\"Address: unable to send value, recipient may have reverted\\");\\n    }\\n\\n    /**\\n     * @dev Performs a Solidity function call using a low level `call`. A\\n     * plain `call` is an unsafe replacement for a function call: use this\\n     * function instead.\\n     *\\n     * If `target` reverts with a revert reason, it is bubbled up by this\\n     * function (like regular Solidity function calls).\\n     *\\n     * Returns the raw returned data. To convert to the expected return value,\\n     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].\\n     *\\n     * Requirements:\\n     *\\n     * - `target` must be a contract.\\n     * - calling `target` with `data` must not revert.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionCall(target, data, \\"Address: low-level call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with\\n     * `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, 0, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but also transferring `value` wei to `target`.\\n     *\\n     * Requirements:\\n     *\\n     * - the calling contract must have an ETH balance of at least `value`.\\n     * - the called Solidity function must be `payable`.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, value, \\"Address: low-level call with value failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but\\n     * with `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(address(this).balance >= value, \\"Address: insufficient balance for call\\");\\n        require(isContract(target), \\"Address: call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.call{value: value}(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {\\n        return functionStaticCall(target, data, \\"Address: low-level static call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal view returns (bytes memory) {\\n        require(isContract(target), \\"Address: static call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.staticcall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionDelegateCall(target, data, \\"Address: low-level delegate call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(isContract(target), \\"Address: delegate call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.delegatecall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Tool to verifies that a low level call was successful, and revert if it wasn\'t, either by bubbling the\\n     * revert reason using the provided one.\\n     *\\n     * _Available since v4.3._\\n     */\\n    function verifyCallResult(\\n        bool success,\\n        bytes memory returndata,\\n        string memory errorMessage\\n    ) internal pure returns (bytes memory) {\\n        if (success) {\\n            return returndata;\\n        } else {\\n            // Look for revert reason and bubble it up if present\\n            if (returndata.length > 0) {\\n                // The easiest way to bubble the revert reason is using memory via assembly\\n\\n                assembly {\\n                    let returndata_size := mload(returndata)\\n                    revert(add(32, returndata), returndata_size)\\n                }\\n            } else {\\n                revert(errorMessage);\\n            }\\n        }\\n    }\\n}\\n","keccak256":"0x3777e696b62134e6177440dbe6e6601c0c156a443f57167194b67e75527439de","license":"MIT"},"solc_0.8/openzeppelin/utils/Context.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev Provides information about the current execution context, including the\\n * sender of the transaction and its data. While these are generally available\\n * via msg.sender and msg.data, they should not be accessed in such a direct\\n * manner, since when dealing with meta-transactions the account sending and\\n * paying for execution may not be the actual sender (as far as an application\\n * is concerned).\\n *\\n * This contract is only required for intermediate, library-like contracts.\\n */\\nabstract contract Context {\\n    function _msgSender() internal view virtual returns (address) {\\n        return msg.sender;\\n    }\\n\\n    function _msgData() internal view virtual returns (bytes calldata) {\\n        return msg.data;\\n    }\\n}\\n","keccak256":"0xe2e337e6dde9ef6b680e07338c493ebea1b5fd09b43424112868e9cc1706bca7","license":"MIT"},"solc_0.8/openzeppelin/utils/StorageSlot.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (utils/StorageSlot.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev Library for reading and writing primitive types to specific storage slots.\\n *\\n * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.\\n * This library helps with reading and writing to such slots without the need for inline assembly.\\n *\\n * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.\\n *\\n * Example usage to set ERC1967 implementation slot:\\n * ```\\n * contract ERC1967 {\\n *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n *\\n *     function _getImplementation() internal view returns (address) {\\n *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n *     }\\n *\\n *     function _setImplementation(address newImplementation) internal {\\n *         require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n *     }\\n * }\\n * ```\\n *\\n * _Available since v4.1 for `address`, `bool`, `bytes32`, and `uint256`._\\n */\\nlibrary StorageSlot {\\n    struct AddressSlot {\\n        address value;\\n    }\\n\\n    struct BooleanSlot {\\n        bool value;\\n    }\\n\\n    struct Bytes32Slot {\\n        bytes32 value;\\n    }\\n\\n    struct Uint256Slot {\\n        uint256 value;\\n    }\\n\\n    /**\\n     * @dev Returns an `AddressSlot` with member `value` located at `slot`.\\n     */\\n    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `BooleanSlot` with member `value` located at `slot`.\\n     */\\n    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Bytes32Slot` with member `value` located at `slot`.\\n     */\\n    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Uint256Slot` with member `value` located at `slot`.\\n     */\\n    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n}\\n","keccak256":"0xfe1b7a9aa2a530a9e705b220e26cd584e2fbdc9602a3a1066032b12816b46aca","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [
			{
				astId: 7,
				contract: 'solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol:ProxyAdmin',
				label: '_owner',
				offset: 0,
				slot: '0',
				type: 't_address',
			},
		],
		types: {
			t_address: {
				encoding: 'inplace',
				label: 'address',
				numberOfBytes: '20',
			},
		},
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
