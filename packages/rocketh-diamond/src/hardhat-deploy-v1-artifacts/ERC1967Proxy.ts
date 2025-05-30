export default {
	contractName: 'ERC1967Proxy',
	sourceName: 'solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol',
	abi: [
		{
			inputs: [
				{
					internalType: 'address',
					name: '_logic',
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
			stateMutability: 'payable',
			type: 'receive',
		},
	],
	bytecode:
		'0x608060405260405161084e38038061084e83398101604081905261002291610349565b61004d60017f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd610417565b600080516020610807833981519152146100695761006961043c565b6100758282600061007c565b50506104a1565b610085836100b2565b6000825111806100925750805b156100ad576100ab83836100f260201b6100291760201c565b505b505050565b6100bb8161011e565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b60606101178383604051806060016040528060278152602001610827602791396101de565b9392505050565b610131816102bc60201b6100551760201c565b6101985760405162461bcd60e51b815260206004820152602d60248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e60448201526c1bdd08184818dbdb9d1c9858dd609a1b60648201526084015b60405180910390fd5b806101bd60008051602061080783398151915260001b6102cb60201b6100711760201c565b80546001600160a01b0319166001600160a01b039290921691909117905550565b60606001600160a01b0384163b6102465760405162461bcd60e51b815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f6044820152651b9d1c9858dd60d21b606482015260840161018f565b600080856001600160a01b0316856040516102619190610452565b600060405180830381855af49150503d806000811461029c576040519150601f19603f3d011682016040523d82523d6000602084013e6102a1565b606091505b5090925090506102b28282866102ce565b9695505050505050565b6001600160a01b03163b151590565b90565b606083156102dd575081610117565b8251156102ed5782518084602001fd5b8160405162461bcd60e51b815260040161018f919061046e565b634e487b7160e01b600052604160045260246000fd5b60005b83811015610338578181015183820152602001610320565b838111156100ab5750506000910152565b6000806040838503121561035c57600080fd5b82516001600160a01b038116811461037357600080fd5b60208401519092506001600160401b038082111561039057600080fd5b818501915085601f8301126103a457600080fd5b8151818111156103b6576103b6610307565b604051601f8201601f19908116603f011681019083821181831017156103de576103de610307565b816040528281528860208487010111156103f757600080fd5b61040883602083016020880161031d565b80955050505050509250929050565b60008282101561043757634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052600160045260246000fd5b6000825161046481846020870161031d565b9190910192915050565b602081526000825180602084015261048d81604085016020870161031d565b601f01601f19169190910160400192915050565b610357806104b06000396000f3fe60806040523661001357610011610017565b005b6100115b610027610022610074565b6100b9565b565b606061004e83836040518060600160405280602781526020016102fb602791396100dd565b9392505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b905090565b3660008037600080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b606073ffffffffffffffffffffffffffffffffffffffff84163b610188576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e7472616374000000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffffffff16856040516101b0919061028d565b600060405180830381855af49150503d80600081146101eb576040519150601f19603f3d011682016040523d82523d6000602084013e6101f0565b606091505b509150915061020082828661020a565b9695505050505050565b6060831561021957508161004e565b8251156102295782518084602001fd5b816040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161017f91906102a9565b60005b83811015610278578181015183820152602001610260565b83811115610287576000848401525b50505050565b6000825161029f81846020870161025d565b9190910192915050565b60208152600082518060208401526102c881604085016020870161025d565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212201e3c9348ed6dd2f363e89451207bd8df182bc878dc80d47166301a510c8801e964736f6c634300080a0033360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564',
	deployedBytecode:
		'0x60806040523661001357610011610017565b005b6100115b610027610022610074565b6100b9565b565b606061004e83836040518060600160405280602781526020016102fb602791396100dd565b9392505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b90565b60006100b47f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5473ffffffffffffffffffffffffffffffffffffffff1690565b905090565b3660008037600080366000845af43d6000803e8080156100d8573d6000f35b3d6000fd5b606073ffffffffffffffffffffffffffffffffffffffff84163b610188576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602660248201527f416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f60448201527f6e7472616374000000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b6000808573ffffffffffffffffffffffffffffffffffffffff16856040516101b0919061028d565b600060405180830381855af49150503d80600081146101eb576040519150601f19603f3d011682016040523d82523d6000602084013e6101f0565b606091505b509150915061020082828661020a565b9695505050505050565b6060831561021957508161004e565b8251156102295782518084602001fd5b816040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161017f91906102a9565b60005b83811015610278578181015183820152602001610260565b83811115610287576000848401525b50505050565b6000825161029f81846020870161025d565b9190910192915050565b60208152600082518060208401526102c881604085016020870161025d565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016919091016040019291505056fe416464726573733a206c6f772d6c6576656c2064656c65676174652063616c6c206661696c6564a26469706673582212201e3c9348ed6dd2f363e89451207bd8df182bc878dc80d47166301a510c8801e964736f6c634300080a0033',
	linkReferences: {},
	deployedLinkReferences: {},
	devdoc: {
		details:
			"This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an implementation address that can be changed. This address is stored in storage in the location specified by https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn't conflict with the storage layout of the implementation behind the proxy.",
		kind: 'dev',
		methods: {
			constructor: {
				details:
					"Initializes the upgradeable proxy with an initial implementation specified by `_logic`. If `_data` is nonempty, it's used as data in a delegate call to `_logic`. This will typically be an encoded function call, and allows initializating the storage of the proxy like a Solidity constructor.",
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
				'@_setImplementation_224': {
					entryPoint: 286,
					id: 224,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@_upgradeToAndCall_269': {
					entryPoint: 124,
					id: 269,
					parameterSlots: 3,
					returnSlots: 0,
				},
				'@_upgradeTo_239': {
					entryPoint: 178,
					id: 239,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@functionDelegateCall_1437': {
					entryPoint: 242,
					id: 1437,
					parameterSlots: 2,
					returnSlots: 1,
				},
				'@functionDelegateCall_1472': {
					entryPoint: 478,
					id: 1472,
					parameterSlots: 3,
					returnSlots: 1,
				},
				'@getAddressSlot_1552': {
					entryPoint: 715,
					id: 1552,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@isContract_1227': {
					entryPoint: 700,
					id: 1227,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@verifyCallResult_1503': {
					entryPoint: 718,
					id: 1503,
					parameterSlots: 3,
					returnSlots: 1,
				},
				abi_decode_tuple_t_addresst_bytes_memory_ptr_fromMemory: {
					entryPoint: 841,
					id: null,
					parameterSlots: 2,
					returnSlots: 2,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 1106,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed: {
					entryPoint: 1134,
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
					entryPoint: 1047,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				copy_memory_to_memory: {
					entryPoint: 797,
					id: null,
					parameterSlots: 3,
					returnSlots: 0,
				},
				panic_error_0x01: {
					entryPoint: 1084,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
				panic_error_0x41: {
					entryPoint: 775,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:3308:16',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:16',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '46:95:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '63:1:16',
														type: '',
														value: '0',
													},
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '70:3:16',
																type: '',
																value: '224',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '75:10:16',
																type: '',
																value: '0x4e487b71',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '66:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '66:20:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '56:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '56:31:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '56:31:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '103:1:16',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '106:4:16',
														type: '',
														value: '0x41',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '96:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '96:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '96:15:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '127:1:16',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '130:4:16',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '120:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '120:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '120:15:16',
										},
									],
								},
								name: 'panic_error_0x41',
								nodeType: 'YulFunctionDefinition',
								src: '14:127:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '199:205:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '209:10:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '218:1:16',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '213:1:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '278:63:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '303:3:16',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '308:1:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '299:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '299:11:16',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'src',
																					nodeType: 'YulIdentifier',
																					src: '322:3:16',
																				},
																				{
																					name: 'i',
																					nodeType: 'YulIdentifier',
																					src: '327:1:16',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '318:3:16',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '318:11:16',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '312:5:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '312:18:16',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '292:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '292:39:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '292:39:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '239:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '242:6:16',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '236:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '236:13:16',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '250:19:16',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '252:15:16',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '261:1:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '264:2:16',
																	type: '',
																	value: '32',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '257:3:16',
															},
															nodeType: 'YulFunctionCall',
															src: '257:10:16',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '252:1:16',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '232:3:16',
												statements: [],
											},
											src: '228:113:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '367:31:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '380:3:16',
																		},
																		{
																			name: 'length',
																			nodeType: 'YulIdentifier',
																			src: '385:6:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '376:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '376:16:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '394:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '369:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '369:27:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '369:27:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '356:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '359:6:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '353:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '353:13:16',
											},
											nodeType: 'YulIf',
											src: '350:48:16',
										},
									],
								},
								name: 'copy_memory_to_memory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'src',
										nodeType: 'YulTypedName',
										src: '177:3:16',
										type: '',
									},
									{
										name: 'dst',
										nodeType: 'YulTypedName',
										src: '182:3:16',
										type: '',
									},
									{
										name: 'length',
										nodeType: 'YulTypedName',
										src: '187:6:16',
										type: '',
									},
								],
								src: '146:258:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '516:943:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '562:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '571:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '574:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '564:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '564:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '564:12:16',
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
																src: '537:7:16',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '546:9:16',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '533:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '533:23:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '558:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '529:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '529:32:16',
											},
											nodeType: 'YulIf',
											src: '526:52:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '587:29:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '606:9:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '600:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '600:16:16',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '591:5:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '679:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '688:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '691:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '681:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '681:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '681:12:16',
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
																src: '638:5:16',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '649:5:16',
																	},
																	{
																		arguments: [
																			{
																				arguments: [
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '664:3:16',
																						type: '',
																						value: '160',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '669:1:16',
																						type: '',
																						value: '1',
																					},
																				],
																				functionName: {
																					name: 'shl',
																					nodeType: 'YulIdentifier',
																					src: '660:3:16',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '660:11:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '673:1:16',
																				type: '',
																				value: '1',
																			},
																		],
																		functionName: {
																			name: 'sub',
																			nodeType: 'YulIdentifier',
																			src: '656:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '656:19:16',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '645:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '645:31:16',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '635:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '635:42:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '628:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '628:50:16',
											},
											nodeType: 'YulIf',
											src: '625:70:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '704:15:16',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '714:5:16',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '704:6:16',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '728:39:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '752:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '763:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '748:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '748:18:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '742:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '742:25:16',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '732:6:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '776:28:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '794:2:16',
																type: '',
																value: '64',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '798:1:16',
																type: '',
																value: '1',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '790:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '790:10:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '802:1:16',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'sub',
													nodeType: 'YulIdentifier',
													src: '786:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '786:18:16',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '780:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '831:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '840:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '843:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '833:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '833:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '833:12:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '819:6:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '827:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '816:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '816:14:16',
											},
											nodeType: 'YulIf',
											src: '813:34:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '856:32:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '870:9:16',
													},
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '881:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '866:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '866:22:16',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '860:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '936:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '945:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '948:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '938:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '938:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '938:12:16',
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
																		src: '915:2:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '919:4:16',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '911:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '911:13:16',
															},
															{
																name: 'dataEnd',
																nodeType: 'YulIdentifier',
																src: '926:7:16',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '907:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '907:27:16',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '900:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '900:35:16',
											},
											nodeType: 'YulIf',
											src: '897:55:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '961:19:16',
											value: {
												arguments: [
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '977:2:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '971:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '971:9:16',
											},
											variables: [
												{
													name: '_3',
													nodeType: 'YulTypedName',
													src: '965:2:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1003:22:16',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1005:16:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1005:18:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1005:18:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '995:2:16',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '999:2:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '992:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '992:10:16',
											},
											nodeType: 'YulIf',
											src: '989:36:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1034:17:16',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1048:2:16',
														type: '',
														value: '31',
													},
												],
												functionName: {
													name: 'not',
													nodeType: 'YulIdentifier',
													src: '1044:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1044:7:16',
											},
											variables: [
												{
													name: '_4',
													nodeType: 'YulTypedName',
													src: '1038:2:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1060:23:16',
											value: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1080:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1074:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1074:9:16',
											},
											variables: [
												{
													name: 'memPtr',
													nodeType: 'YulTypedName',
													src: '1064:6:16',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1092:71:16',
											value: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1114:6:16',
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
																						src: '1138:2:16',
																					},
																					{
																						kind: 'number',
																						nodeType: 'YulLiteral',
																						src: '1142:4:16',
																						type: '',
																						value: '0x1f',
																					},
																				],
																				functionName: {
																					name: 'add',
																					nodeType: 'YulIdentifier',
																					src: '1134:3:16',
																				},
																				nodeType: 'YulFunctionCall',
																				src: '1134:13:16',
																			},
																			{
																				name: '_4',
																				nodeType: 'YulIdentifier',
																				src: '1149:2:16',
																			},
																		],
																		functionName: {
																			name: 'and',
																			nodeType: 'YulIdentifier',
																			src: '1130:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '1130:22:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1154:2:16',
																		type: '',
																		value: '63',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1126:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '1126:31:16',
															},
															{
																name: '_4',
																nodeType: 'YulIdentifier',
																src: '1159:2:16',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '1122:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1122:40:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1110:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1110:53:16',
											},
											variables: [
												{
													name: 'newFreePtr',
													nodeType: 'YulTypedName',
													src: '1096:10:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1222:22:16',
												statements: [
													{
														expression: {
															arguments: [],
															functionName: {
																name: 'panic_error_0x41',
																nodeType: 'YulIdentifier',
																src: '1224:16:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1224:18:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1224:18:16',
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
																src: '1181:10:16',
															},
															{
																name: '_1',
																nodeType: 'YulIdentifier',
																src: '1193:2:16',
															},
														],
														functionName: {
															name: 'gt',
															nodeType: 'YulIdentifier',
															src: '1178:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1178:18:16',
													},
													{
														arguments: [
															{
																name: 'newFreePtr',
																nodeType: 'YulIdentifier',
																src: '1201:10:16',
															},
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1213:6:16',
															},
														],
														functionName: {
															name: 'lt',
															nodeType: 'YulIdentifier',
															src: '1198:2:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1198:22:16',
													},
												],
												functionName: {
													name: 'or',
													nodeType: 'YulIdentifier',
													src: '1175:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1175:46:16',
											},
											nodeType: 'YulIf',
											src: '1172:72:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1260:2:16',
														type: '',
														value: '64',
													},
													{
														name: 'newFreePtr',
														nodeType: 'YulIdentifier',
														src: '1264:10:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1253:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1253:22:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1253:22:16',
										},
										{
											expression: {
												arguments: [
													{
														name: 'memPtr',
														nodeType: 'YulIdentifier',
														src: '1291:6:16',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1299:2:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1284:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1284:18:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1284:18:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1348:16:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1357:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1360:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1350:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1350:12:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1350:12:16',
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
																		src: '1325:2:16',
																	},
																	{
																		name: '_3',
																		nodeType: 'YulIdentifier',
																		src: '1329:2:16',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '1321:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '1321:11:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1334:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1317:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1317:20:16',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1339:7:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '1314:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1314:33:16',
											},
											nodeType: 'YulIf',
											src: '1311:53:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: '_2',
																nodeType: 'YulIdentifier',
																src: '1399:2:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1403:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1395:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1395:11:16',
													},
													{
														arguments: [
															{
																name: 'memPtr',
																nodeType: 'YulIdentifier',
																src: '1412:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1420:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1408:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1408:15:16',
													},
													{
														name: '_3',
														nodeType: 'YulIdentifier',
														src: '1425:2:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '1373:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1373:55:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1373:55:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1437:16:16',
											value: {
												name: 'memPtr',
												nodeType: 'YulIdentifier',
												src: '1447:6:16',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '1437:6:16',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_addresst_bytes_memory_ptr_fromMemory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '474:9:16',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '485:7:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '497:6:16',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '505:6:16',
										type: '',
									},
								],
								src: '409:1050:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1513:173:16',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1543:111:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1564:1:16',
																	type: '',
																	value: '0',
																},
																{
																	arguments: [
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1571:3:16',
																			type: '',
																			value: '224',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1576:10:16',
																			type: '',
																			value: '0x4e487b71',
																		},
																	],
																	functionName: {
																		name: 'shl',
																		nodeType: 'YulIdentifier',
																		src: '1567:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '1567:20:16',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1557:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1557:31:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1557:31:16',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1608:1:16',
																	type: '',
																	value: '4',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1611:4:16',
																	type: '',
																	value: '0x11',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1601:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1601:15:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1601:15:16',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1636:1:16',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1639:4:16',
																	type: '',
																	value: '0x24',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1629:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '1629:15:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '1629:15:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'x',
														nodeType: 'YulIdentifier',
														src: '1529:1:16',
													},
													{
														name: 'y',
														nodeType: 'YulIdentifier',
														src: '1532:1:16',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '1526:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1526:8:16',
											},
											nodeType: 'YulIf',
											src: '1523:131:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1663:17:16',
											value: {
												arguments: [
													{
														name: 'x',
														nodeType: 'YulIdentifier',
														src: '1675:1:16',
													},
													{
														name: 'y',
														nodeType: 'YulIdentifier',
														src: '1678:1:16',
													},
												],
												functionName: {
													name: 'sub',
													nodeType: 'YulIdentifier',
													src: '1671:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1671:9:16',
											},
											variableNames: [
												{
													name: 'diff',
													nodeType: 'YulIdentifier',
													src: '1663:4:16',
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
										src: '1495:1:16',
										type: '',
									},
									{
										name: 'y',
										nodeType: 'YulTypedName',
										src: '1498:1:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'diff',
										nodeType: 'YulTypedName',
										src: '1504:4:16',
										type: '',
									},
								],
								src: '1464:222:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1723:95:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1740:1:16',
														type: '',
														value: '0',
													},
													{
														arguments: [
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1747:3:16',
																type: '',
																value: '224',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1752:10:16',
																type: '',
																value: '0x4e487b71',
															},
														],
														functionName: {
															name: 'shl',
															nodeType: 'YulIdentifier',
															src: '1743:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1743:20:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1733:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1733:31:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1733:31:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1780:1:16',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1783:4:16',
														type: '',
														value: '0x01',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1773:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1773:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1773:15:16',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1804:1:16',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1807:4:16',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '1797:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1797:15:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1797:15:16',
										},
									],
								},
								name: 'panic_error_0x01',
								nodeType: 'YulFunctionDefinition',
								src: '1691:127:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1997:235:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2014:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2025:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2007:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2007:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2007:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2048:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2059:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2044:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2044:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2064:2:16',
														type: '',
														value: '45',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2037:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2037:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2037:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2087:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2098:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2083:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2083:18:16',
													},
													{
														hexValue: '455243313936373a206e657720696d706c656d656e746174696f6e206973206e',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2103:34:16',
														type: '',
														value: 'ERC1967: new implementation is n',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2076:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2076:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2076:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2158:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2169:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2154:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2154:18:16',
													},
													{
														hexValue: '6f74206120636f6e7472616374',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2174:15:16',
														type: '',
														value: 'ot a contract',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2147:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2147:43:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2147:43:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '2199:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2211:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2222:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2207:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2207:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2199:4:16',
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
										src: '1974:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1988:4:16',
										type: '',
									},
								],
								src: '1823:409:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2411:228:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2428:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2439:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2421:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2421:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2421:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2462:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2473:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2458:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2458:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2478:2:16',
														type: '',
														value: '38',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2451:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2451:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2451:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2501:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2512:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2497:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2497:18:16',
													},
													{
														hexValue: '416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2517:34:16',
														type: '',
														value: 'Address: delegate call to non-co',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2490:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2490:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2490:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2572:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2583:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2568:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2568:18:16',
													},
													{
														hexValue: '6e7472616374',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '2588:8:16',
														type: '',
														value: 'ntract',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2561:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2561:36:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2561:36:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '2606:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2618:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2629:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2614:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2614:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2606:4:16',
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
										src: '2388:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2402:4:16',
										type: '',
									},
								],
								src: '2237:402:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2781:137:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '2791:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2811:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2805:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2805:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '2795:6:16',
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
																src: '2853:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2861:4:16',
																type: '',
																value: '0x20',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2849:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '2849:17:16',
													},
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '2868:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2873:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '2827:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2827:53:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '2827:53:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '2889:23:16',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '2900:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2905:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2896:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '2896:16:16',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '2889:3:16',
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
										src: '2757:3:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2762:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '2773:3:16',
										type: '',
									},
								],
								src: '2644:274:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3044:262:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3061:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3072:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3054:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3054:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3054:21:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3084:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '3104:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '3098:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3098:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '3088:6:16',
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
																src: '3131:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3142:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3127:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3127:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3147:6:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3120:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3120:34:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3120:34:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '3189:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3197:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3185:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3185:15:16',
													},
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3206:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3217:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3202:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3202:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '3222:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '3163:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3163:66:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '3163:66:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '3238:62:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3254:9:16',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'length',
																				nodeType: 'YulIdentifier',
																				src: '3273:6:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '3281:2:16',
																				type: '',
																				value: '31',
																			},
																		],
																		functionName: {
																			name: 'add',
																			nodeType: 'YulIdentifier',
																			src: '3269:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '3269:15:16',
																	},
																	{
																		arguments: [
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '3290:2:16',
																				type: '',
																				value: '31',
																			},
																		],
																		functionName: {
																			name: 'not',
																			nodeType: 'YulIdentifier',
																			src: '3286:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '3286:7:16',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '3265:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '3265:29:16',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3250:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '3250:45:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3297:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3246:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '3246:54:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3238:4:16',
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
										src: '3013:9:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3024:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '3035:4:16',
										type: '',
									},
								],
								src: '2923:383:16',
							},
						],
					},
					contents:
						'{\n    { }\n    function panic_error_0x41()\n    {\n        mstore(0, shl(224, 0x4e487b71))\n        mstore(4, 0x41)\n        revert(0, 0x24)\n    }\n    function copy_memory_to_memory(src, dst, length)\n    {\n        let i := 0\n        for { } lt(i, length) { i := add(i, 32) }\n        {\n            mstore(add(dst, i), mload(add(src, i)))\n        }\n        if gt(i, length) { mstore(add(dst, length), 0) }\n    }\n    function abi_decode_tuple_t_addresst_bytes_memory_ptr_fromMemory(headStart, dataEnd) -> value0, value1\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        let value := mload(headStart)\n        if iszero(eq(value, and(value, sub(shl(160, 1), 1)))) { revert(0, 0) }\n        value0 := value\n        let offset := mload(add(headStart, 32))\n        let _1 := sub(shl(64, 1), 1)\n        if gt(offset, _1) { revert(0, 0) }\n        let _2 := add(headStart, offset)\n        if iszero(slt(add(_2, 0x1f), dataEnd)) { revert(0, 0) }\n        let _3 := mload(_2)\n        if gt(_3, _1) { panic_error_0x41() }\n        let _4 := not(31)\n        let memPtr := mload(64)\n        let newFreePtr := add(memPtr, and(add(and(add(_3, 0x1f), _4), 63), _4))\n        if or(gt(newFreePtr, _1), lt(newFreePtr, memPtr)) { panic_error_0x41() }\n        mstore(64, newFreePtr)\n        mstore(memPtr, _3)\n        if gt(add(add(_2, _3), 32), dataEnd) { revert(0, 0) }\n        copy_memory_to_memory(add(_2, 32), add(memPtr, 32), _3)\n        value1 := memPtr\n    }\n    function checked_sub_t_uint256(x, y) -> diff\n    {\n        if lt(x, y)\n        {\n            mstore(0, shl(224, 0x4e487b71))\n            mstore(4, 0x11)\n            revert(0, 0x24)\n        }\n        diff := sub(x, y)\n    }\n    function panic_error_0x01()\n    {\n        mstore(0, shl(224, 0x4e487b71))\n        mstore(4, 0x01)\n        revert(0, 0x24)\n    }\n    function abi_encode_tuple_t_stringliteral_972b7028e8de0bff0d553b3264eba2312ec98a552add05e58853b313f9f4ac65__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 45)\n        mstore(add(headStart, 64), "ERC1967: new implementation is n")\n        mstore(add(headStart, 96), "ot a contract")\n        tail := add(headStart, 128)\n    }\n    function abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 38)\n        mstore(add(headStart, 64), "Address: delegate call to non-co")\n        mstore(add(headStart, 96), "ntract")\n        tail := add(headStart, 128)\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        copy_memory_to_memory(add(value0, 0x20), pos, length)\n        end := add(pos, length)\n    }\n    function abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        mstore(headStart, 32)\n        let length := mload(value0)\n        mstore(add(headStart, 32), length)\n        copy_memory_to_memory(add(value0, 32), add(headStart, 64), length)\n        tail := add(add(headStart, and(add(length, 31), not(31))), 64)\n    }\n}',
					id: 16,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE PUSH1 0x40 MLOAD PUSH2 0x84E CODESIZE SUB DUP1 PUSH2 0x84E DUP4 CODECOPY DUP2 ADD PUSH1 0x40 DUP2 SWAP1 MSTORE PUSH2 0x22 SWAP2 PUSH2 0x349 JUMP JUMPDEST PUSH2 0x4D PUSH1 0x1 PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBD PUSH2 0x417 JUMP JUMPDEST PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH2 0x807 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE EQ PUSH2 0x69 JUMPI PUSH2 0x69 PUSH2 0x43C JUMP JUMPDEST PUSH2 0x75 DUP3 DUP3 PUSH1 0x0 PUSH2 0x7C JUMP JUMPDEST POP POP PUSH2 0x4A1 JUMP JUMPDEST PUSH2 0x85 DUP4 PUSH2 0xB2 JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD GT DUP1 PUSH2 0x92 JUMPI POP DUP1 JUMPDEST ISZERO PUSH2 0xAD JUMPI PUSH2 0xAB DUP4 DUP4 PUSH2 0xF2 PUSH1 0x20 SHL PUSH2 0x29 OR PUSH1 0x20 SHR JUMP JUMPDEST POP JUMPDEST POP POP POP JUMP JUMPDEST PUSH2 0xBB DUP2 PUSH2 0x11E JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP3 AND SWAP1 PUSH32 0xBC7CD75A20EE27FD9ADEBAB32041F755214DBC6BFFA90CC0225B39DA2E5C2D3B SWAP1 PUSH1 0x0 SWAP1 LOG2 POP JUMP JUMPDEST PUSH1 0x60 PUSH2 0x117 DUP4 DUP4 PUSH1 0x40 MLOAD DUP1 PUSH1 0x60 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x27 DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x827 PUSH1 0x27 SWAP2 CODECOPY PUSH2 0x1DE JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH2 0x131 DUP2 PUSH2 0x2BC PUSH1 0x20 SHL PUSH2 0x55 OR PUSH1 0x20 SHR JUMP JUMPDEST PUSH2 0x198 JUMPI PUSH1 0x40 MLOAD PUSH3 0x461BCD PUSH1 0xE5 SHL DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x2D PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x455243313936373A206E657720696D706C656D656E746174696F6E206973206E PUSH1 0x44 DUP3 ADD MSTORE PUSH13 0x1BDD08184818DBDB9D1C9858DD PUSH1 0x9A SHL PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST DUP1 PUSH2 0x1BD PUSH1 0x0 DUP1 MLOAD PUSH1 0x20 PUSH2 0x807 DUP4 CODECOPY DUP2 MLOAD SWAP2 MSTORE PUSH1 0x0 SHL PUSH2 0x2CB PUSH1 0x20 SHL PUSH2 0x71 OR PUSH1 0x20 SHR JUMP JUMPDEST DUP1 SLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB NOT AND PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB SWAP3 SWAP1 SWAP3 AND SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE POP JUMP JUMPDEST PUSH1 0x60 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP5 AND EXTCODESIZE PUSH2 0x246 JUMPI PUSH1 0x40 MLOAD PUSH3 0x461BCD PUSH1 0xE5 SHL DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x416464726573733A2064656C65676174652063616C6C20746F206E6F6E2D636F PUSH1 0x44 DUP3 ADD MSTORE PUSH6 0x1B9D1C9858DD PUSH1 0xD2 SHL PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH2 0x18F JUMP JUMPDEST PUSH1 0x0 DUP1 DUP6 PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND DUP6 PUSH1 0x40 MLOAD PUSH2 0x261 SWAP2 SWAP1 PUSH2 0x452 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x29C JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x2A1 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP1 SWAP3 POP SWAP1 POP PUSH2 0x2B2 DUP3 DUP3 DUP7 PUSH2 0x2CE JUMP JUMPDEST SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB AND EXTCODESIZE ISZERO ISZERO SWAP1 JUMP JUMPDEST SWAP1 JUMP JUMPDEST PUSH1 0x60 DUP4 ISZERO PUSH2 0x2DD JUMPI POP DUP2 PUSH2 0x117 JUMP JUMPDEST DUP3 MLOAD ISZERO PUSH2 0x2ED JUMPI DUP3 MLOAD DUP1 DUP5 PUSH1 0x20 ADD REVERT JUMPDEST DUP2 PUSH1 0x40 MLOAD PUSH3 0x461BCD PUSH1 0xE5 SHL DUP2 MSTORE PUSH1 0x4 ADD PUSH2 0x18F SWAP2 SWAP1 PUSH2 0x46E JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x338 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH2 0x320 JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH2 0xAB JUMPI POP POP PUSH1 0x0 SWAP2 ADD MSTORE JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x40 DUP4 DUP6 SUB SLT ISZERO PUSH2 0x35C JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP3 MLOAD PUSH1 0x1 PUSH1 0x1 PUSH1 0xA0 SHL SUB DUP2 AND DUP2 EQ PUSH2 0x373 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP5 ADD MLOAD SWAP1 SWAP3 POP PUSH1 0x1 PUSH1 0x1 PUSH1 0x40 SHL SUB DUP1 DUP3 GT ISZERO PUSH2 0x390 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 DUP6 ADD SWAP2 POP DUP6 PUSH1 0x1F DUP4 ADD SLT PUSH2 0x3A4 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 MLOAD DUP2 DUP2 GT ISZERO PUSH2 0x3B6 JUMPI PUSH2 0x3B6 PUSH2 0x307 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH1 0x1F DUP3 ADD PUSH1 0x1F NOT SWAP1 DUP2 AND PUSH1 0x3F ADD AND DUP2 ADD SWAP1 DUP4 DUP3 GT DUP2 DUP4 LT OR ISZERO PUSH2 0x3DE JUMPI PUSH2 0x3DE PUSH2 0x307 JUMP JUMPDEST DUP2 PUSH1 0x40 MSTORE DUP3 DUP2 MSTORE DUP9 PUSH1 0x20 DUP5 DUP8 ADD ADD GT ISZERO PUSH2 0x3F7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x408 DUP4 PUSH1 0x20 DUP4 ADD PUSH1 0x20 DUP9 ADD PUSH2 0x31D JUMP JUMPDEST DUP1 SWAP6 POP POP POP POP POP POP SWAP3 POP SWAP3 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 DUP3 DUP3 LT ISZERO PUSH2 0x437 JUMPI PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP SUB SWAP1 JUMP JUMPDEST PUSH4 0x4E487B71 PUSH1 0xE0 SHL PUSH1 0x0 MSTORE PUSH1 0x1 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH2 0x464 DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH2 0x31D JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 DUP3 MLOAD DUP1 PUSH1 0x20 DUP5 ADD MSTORE PUSH2 0x48D DUP2 PUSH1 0x40 DUP6 ADD PUSH1 0x20 DUP8 ADD PUSH2 0x31D JUMP JUMPDEST PUSH1 0x1F ADD PUSH1 0x1F NOT AND SWAP2 SWAP1 SWAP2 ADD PUSH1 0x40 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH2 0x357 DUP1 PUSH2 0x4B0 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE CALLDATASIZE PUSH2 0x13 JUMPI PUSH2 0x11 PUSH2 0x17 JUMP JUMPDEST STOP JUMPDEST PUSH2 0x11 JUMPDEST PUSH2 0x27 PUSH2 0x22 PUSH2 0x74 JUMP JUMPDEST PUSH2 0xB9 JUMP JUMPDEST JUMP JUMPDEST PUSH1 0x60 PUSH2 0x4E DUP4 DUP4 PUSH1 0x40 MLOAD DUP1 PUSH1 0x60 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x27 DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x2FB PUSH1 0x27 SWAP2 CODECOPY PUSH2 0xDD JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EXTCODESIZE ISZERO ISZERO SWAP1 JUMP JUMPDEST SWAP1 JUMP JUMPDEST PUSH1 0x0 PUSH2 0xB4 PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST CALLDATASIZE PUSH1 0x0 DUP1 CALLDATACOPY PUSH1 0x0 DUP1 CALLDATASIZE PUSH1 0x0 DUP5 GAS DELEGATECALL RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 DUP1 ISZERO PUSH2 0xD8 JUMPI RETURNDATASIZE PUSH1 0x0 RETURN JUMPDEST RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST PUSH1 0x60 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 AND EXTCODESIZE PUSH2 0x188 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x416464726573733A2064656C65676174652063616C6C20746F206E6F6E2D636F PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6E74726163740000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH1 0x0 DUP1 DUP6 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP6 PUSH1 0x40 MLOAD PUSH2 0x1B0 SWAP2 SWAP1 PUSH2 0x28D JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x1EB JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x1F0 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP2 POP SWAP2 POP PUSH2 0x200 DUP3 DUP3 DUP7 PUSH2 0x20A JUMP JUMPDEST SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x60 DUP4 ISZERO PUSH2 0x219 JUMPI POP DUP2 PUSH2 0x4E JUMP JUMPDEST DUP3 MLOAD ISZERO PUSH2 0x229 JUMPI DUP3 MLOAD DUP1 DUP5 PUSH1 0x20 ADD REVERT JUMPDEST DUP2 PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD PUSH2 0x17F SWAP2 SWAP1 PUSH2 0x2A9 JUMP JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x278 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH2 0x260 JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH2 0x287 JUMPI PUSH1 0x0 DUP5 DUP5 ADD MSTORE JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH2 0x29F DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH2 0x25D JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 DUP3 MLOAD DUP1 PUSH1 0x20 DUP5 ADD MSTORE PUSH2 0x2C8 DUP2 PUSH1 0x40 DUP6 ADD PUSH1 0x20 DUP8 ADD PUSH2 0x25D JUMP JUMPDEST PUSH1 0x1F ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND SWAP2 SWAP1 SWAP2 ADD PUSH1 0x40 ADD SWAP3 SWAP2 POP POP JUMP INVALID COINBASE PUSH5 0x6472657373 GASPRICE KECCAK256 PUSH13 0x6F772D6C6576656C2064656C65 PUSH8 0x6174652063616C6C KECCAK256 PUSH7 0x61696C6564A264 PUSH10 0x706673582212201E3C93 BASEFEE 0xED PUSH14 0xD2F363E89451207BD8DF182BC878 0xDC DUP1 0xD4 PUSH18 0x66301A510C8801E964736F6C634300080A00 CALLER CALLDATASIZE ADDMOD SWAP5 LOG1 EXTCODESIZE LOG1 LOG3 0x21 MOD PUSH8 0xC828492DB98DCA3E KECCAK256 PUSH23 0xCC3735A920A3CA505D382BBC416464726573733A206C6F PUSH24 0x2D6C6576656C2064656C65676174652063616C6C20666169 PUSH13 0x65640000000000000000000000 ',
			sourceMap:
				'552:830:2:-:0;;;945:217;;;;;;;;;;;;;;;;;;:::i;:::-;1050:54;1103:1;1058:41;1050:54;:::i;:::-;-1:-1:-1;;;;;;;;;;;1018:87:2;1011:95;;;;:::i;:::-;1116:39;1134:6;1142:5;1149;1116:17;:39::i;:::-;945:217;;552:830;;2188:295:3;2326:29;2337:17;2326:10;:29::i;:::-;2383:1;2369:4;:11;:15;:28;;;;2388:9;2369:28;2365:112;;;2413:53;2442:17;2461:4;2413:28;;;;;:53;;:::i;:::-;;2365:112;2188:295;;;:::o;1902:152::-;1968:37;1987:17;1968:18;:37::i;:::-;2020:27;;-1:-1:-1;;;;;2020:27:3;;;;;;;;1902:152;:::o;6575:198:12:-;6658:12;6689:77;6710:6;6718:4;6689:77;;;;;;;;;;;;;;;;;:20;:77::i;:::-;6682:84;6575:198;-1:-1:-1;;;6575:198:12:o;1537:259:3:-;1618:37;1637:17;1618:18;;;;;:37;;:::i;:::-;1610:95;;;;-1:-1:-1;;;1610:95:3;;2025:2:16;1610:95:3;;;2007:21:16;2064:2;2044:18;;;2037:30;2103:34;2083:18;;;2076:62;-1:-1:-1;;;2154:18:16;;;2147:43;2207:19;;1610:95:3;;;;;;;;;1772:17;1715:48;-1:-1:-1;;;;;;;;;;;1742:20:3;;1715:26;;;;;:48;;:::i;:::-;:74;;-1:-1:-1;;;;;;1715:74:3;-1:-1:-1;;;;;1715:74:3;;;;;;;;;;-1:-1:-1;1537:259:3:o;6959:387:12:-;7100:12;-1:-1:-1;;;;;1470:19:12;;;7124:69;;;;-1:-1:-1;;;7124:69:12;;2439:2:16;7124:69:12;;;2421:21:16;2478:2;2458:18;;;2451:30;2517:34;2497:18;;;2490:62;-1:-1:-1;;;2568:18:16;;;2561:36;2614:19;;7124:69:12;2237:402:16;7124:69:12;7205:12;7219:23;7246:6;-1:-1:-1;;;;;7246:19:12;7266:4;7246:25;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;7204:67:12;;-1:-1:-1;7204:67:12;-1:-1:-1;7288:51:12;7204:67;;7326:12;7288:16;:51::i;:::-;7281:58;6959:387;-1:-1:-1;;;;;;6959:387:12:o;1180:320::-;-1:-1:-1;;;;;1470:19:12;;:23;;;1180:320::o;1599:147:14:-;1726:4;1599:147::o;7566:692:12:-;7712:12;7740:7;7736:516;;;-1:-1:-1;7770:10:12;7763:17;;7736:516;7881:17;;:21;7877:365;;8075:10;8069:17;8135:15;8122:10;8118:2;8114:19;8107:44;7877:365;8214:12;8207:20;;-1:-1:-1;;;8207:20:12;;;;;;;;:::i;14:127:16:-;75:10;70:3;66:20;63:1;56:31;106:4;103:1;96:15;130:4;127:1;120:15;146:258;218:1;228:113;242:6;239:1;236:13;228:113;;;318:11;;;312:18;299:11;;;292:39;264:2;257:10;228:113;;;359:6;356:1;353:13;350:48;;;-1:-1:-1;;394:1:16;376:16;;369:27;146:258::o;409:1050::-;497:6;505;558:2;546:9;537:7;533:23;529:32;526:52;;;574:1;571;564:12;526:52;600:16;;-1:-1:-1;;;;;645:31:16;;635:42;;625:70;;691:1;688;681:12;625:70;763:2;748:18;;742:25;714:5;;-1:-1:-1;;;;;;816:14:16;;;813:34;;;843:1;840;833:12;813:34;881:6;870:9;866:22;856:32;;926:7;919:4;915:2;911:13;907:27;897:55;;948:1;945;938:12;897:55;977:2;971:9;999:2;995;992:10;989:36;;;1005:18;;:::i;:::-;1080:2;1074:9;1048:2;1134:13;;-1:-1:-1;;1130:22:16;;;1154:2;1126:31;1122:40;1110:53;;;1178:18;;;1198:22;;;1175:46;1172:72;;;1224:18;;:::i;:::-;1264:10;1260:2;1253:22;1299:2;1291:6;1284:18;1339:7;1334:2;1329;1325;1321:11;1317:20;1314:33;1311:53;;;1360:1;1357;1350:12;1311:53;1373:55;1425:2;1420;1412:6;1408:15;1403:2;1399;1395:11;1373:55;:::i;:::-;1447:6;1437:16;;;;;;;409:1050;;;;;:::o;1464:222::-;1504:4;1532:1;1529;1526:8;1523:131;;;1576:10;1571:3;1567:20;1564:1;1557:31;1611:4;1608:1;1601:15;1639:4;1636:1;1629:15;1523:131;-1:-1:-1;1671:9:16;;1464:222::o;1691:127::-;1752:10;1747:3;1743:20;1740:1;1733:31;1783:4;1780:1;1773:15;1807:4;1804:1;1797:15;2644:274;2773:3;2811:6;2805:13;2827:53;2873:6;2868:3;2861:4;2853:6;2849:17;2827:53;:::i;:::-;2896:16;;;;;2644:274;-1:-1:-1;;2644:274:16:o;2923:383::-;3072:2;3061:9;3054:21;3035:4;3104:6;3098:13;3147:6;3142:2;3131:9;3127:18;3120:34;3163:66;3222:6;3217:2;3206:9;3202:18;3197:2;3189:6;3185:15;3163:66;:::i;:::-;3290:2;3269:15;-1:-1:-1;;3265:29:16;3250:45;;;;3297:2;3246:54;;2923:383;-1:-1:-1;;2923:383:16:o;:::-;552:830:2;;;;;;',
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
				'@_beforeFallback_537': {
					entryPoint: null,
					id: 537,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_delegate_497': {
					entryPoint: 185,
					id: 497,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@_fallback_516': {
					entryPoint: 23,
					id: 516,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@_getImplementation_200': {
					entryPoint: null,
					id: 200,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@_implementation_167': {
					entryPoint: 116,
					id: 167,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@functionDelegateCall_1437': {
					entryPoint: 41,
					id: 1437,
					parameterSlots: 2,
					returnSlots: 1,
				},
				'@functionDelegateCall_1472': {
					entryPoint: 221,
					id: 1472,
					parameterSlots: 3,
					returnSlots: 1,
				},
				'@getAddressSlot_1552': {
					entryPoint: 113,
					id: 1552,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@isContract_1227': {
					entryPoint: 85,
					id: 1227,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@verifyCallResult_1503': {
					entryPoint: 522,
					id: 1503,
					parameterSlots: 3,
					returnSlots: 1,
				},
				abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed: {
					entryPoint: 653,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed: {
					entryPoint: 681,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed:
					{
						entryPoint: null,
						id: null,
						parameterSlots: 1,
						returnSlots: 1,
					},
				copy_memory_to_memory: {
					entryPoint: 605,
					id: null,
					parameterSlots: 3,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:1407:16',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:16',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '188:228:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '205:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '216:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '198:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '198:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '198:21:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '239:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '250:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '235:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '235:18:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '255:2:16',
														type: '',
														value: '38',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '228:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '228:30:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '228:30:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '278:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '289:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '274:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '274:18:16',
													},
													{
														hexValue: '416464726573733a2064656c65676174652063616c6c20746f206e6f6e2d636f',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '294:34:16',
														type: '',
														value: 'Address: delegate call to non-co',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '267:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '267:62:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '267:62:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '349:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '360:2:16',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '345:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '345:18:16',
													},
													{
														hexValue: '6e7472616374',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '365:8:16',
														type: '',
														value: 'ntract',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '338:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '338:36:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '338:36:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '383:27:16',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '395:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '406:3:16',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '391:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '391:19:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '383:4:16',
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
										src: '165:9:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '179:4:16',
										type: '',
									},
								],
								src: '14:402:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '474:205:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '484:10:16',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '493:1:16',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '488:1:16',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '553:63:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '578:3:16',
																		},
																		{
																			name: 'i',
																			nodeType: 'YulIdentifier',
																			src: '583:1:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '574:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '574:11:16',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'src',
																					nodeType: 'YulIdentifier',
																					src: '597:3:16',
																				},
																				{
																					name: 'i',
																					nodeType: 'YulIdentifier',
																					src: '602:1:16',
																				},
																			],
																			functionName: {
																				name: 'add',
																				nodeType: 'YulIdentifier',
																				src: '593:3:16',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '593:11:16',
																		},
																	],
																	functionName: {
																		name: 'mload',
																		nodeType: 'YulIdentifier',
																		src: '587:5:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '587:18:16',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '567:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '567:39:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '567:39:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '514:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '517:6:16',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '511:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '511:13:16',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '525:19:16',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '527:15:16',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '536:1:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '539:2:16',
																	type: '',
																	value: '32',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '532:3:16',
															},
															nodeType: 'YulFunctionCall',
															src: '532:10:16',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '527:1:16',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '507:3:16',
												statements: [],
											},
											src: '503:113:16',
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '642:31:16',
												statements: [
													{
														expression: {
															arguments: [
																{
																	arguments: [
																		{
																			name: 'dst',
																			nodeType: 'YulIdentifier',
																			src: '655:3:16',
																		},
																		{
																			name: 'length',
																			nodeType: 'YulIdentifier',
																			src: '660:6:16',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '651:3:16',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '651:16:16',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '669:1:16',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '644:6:16',
															},
															nodeType: 'YulFunctionCall',
															src: '644:27:16',
														},
														nodeType: 'YulExpressionStatement',
														src: '644:27:16',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '631:1:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '634:6:16',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '628:2:16',
												},
												nodeType: 'YulFunctionCall',
												src: '628:13:16',
											},
											nodeType: 'YulIf',
											src: '625:48:16',
										},
									],
								},
								name: 'copy_memory_to_memory',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'src',
										nodeType: 'YulTypedName',
										src: '452:3:16',
										type: '',
									},
									{
										name: 'dst',
										nodeType: 'YulTypedName',
										src: '457:3:16',
										type: '',
									},
									{
										name: 'length',
										nodeType: 'YulTypedName',
										src: '462:6:16',
										type: '',
									},
								],
								src: '421:258:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '821:137:16',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '831:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '851:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '845:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '845:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '835:6:16',
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
																src: '893:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '901:4:16',
																type: '',
																value: '0x20',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '889:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '889:17:16',
													},
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '908:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '913:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '867:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '867:53:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '867:53:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '929:23:16',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '940:3:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '945:6:16',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '936:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '936:16:16',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '929:3:16',
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
										src: '797:3:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '802:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '813:3:16',
										type: '',
									},
								],
								src: '684:274:16',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1084:321:16',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1101:9:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1112:2:16',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1094:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1094:21:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1094:21:16',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1124:27:16',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '1144:6:16',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1138:5:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1138:13:16',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1128:6:16',
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
																src: '1171:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1182:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1167:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1167:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1187:6:16',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1160:6:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1160:34:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1160:34:16',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '1229:6:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1237:2:16',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1225:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1225:15:16',
													},
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1246:9:16',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '1257:2:16',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1242:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1242:18:16',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1262:6:16',
													},
												],
												functionName: {
													name: 'copy_memory_to_memory',
													nodeType: 'YulIdentifier',
													src: '1203:21:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1203:66:16',
											},
											nodeType: 'YulExpressionStatement',
											src: '1203:66:16',
										},
										{
											nodeType: 'YulAssignment',
											src: '1278:121:16',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1294:9:16',
															},
															{
																arguments: [
																	{
																		arguments: [
																			{
																				name: 'length',
																				nodeType: 'YulIdentifier',
																				src: '1313:6:16',
																			},
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '1321:2:16',
																				type: '',
																				value: '31',
																			},
																		],
																		functionName: {
																			name: 'add',
																			nodeType: 'YulIdentifier',
																			src: '1309:3:16',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '1309:15:16',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1326:66:16',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '1305:3:16',
																},
																nodeType: 'YulFunctionCall',
																src: '1305:88:16',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1290:3:16',
														},
														nodeType: 'YulFunctionCall',
														src: '1290:104:16',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1396:2:16',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1286:3:16',
												},
												nodeType: 'YulFunctionCall',
												src: '1286:113:16',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1278:4:16',
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
										src: '1053:9:16',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1064:6:16',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1075:4:16',
										type: '',
									},
								],
								src: '963:442:16',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_encode_tuple_t_stringliteral_b94ded0918034cf8f896e19fa3cfdef1188cd569c577264a3622e49152f88520__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 38)\n        mstore(add(headStart, 64), "Address: delegate call to non-co")\n        mstore(add(headStart, 96), "ntract")\n        tail := add(headStart, 128)\n    }\n    function copy_memory_to_memory(src, dst, length)\n    {\n        let i := 0\n        for { } lt(i, length) { i := add(i, 32) }\n        {\n            mstore(add(dst, i), mload(add(src, i)))\n        }\n        if gt(i, length) { mstore(add(dst, length), 0) }\n    }\n    function abi_encode_tuple_packed_t_bytes_memory_ptr__to_t_bytes_memory_ptr__nonPadded_inplace_fromStack_reversed(pos, value0) -> end\n    {\n        let length := mload(value0)\n        copy_memory_to_memory(add(value0, 0x20), pos, length)\n        end := add(pos, length)\n    }\n    function abi_encode_tuple_t_string_memory_ptr__to_t_string_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        mstore(headStart, 32)\n        let length := mload(value0)\n        mstore(add(headStart, 32), length)\n        copy_memory_to_memory(add(value0, 32), add(headStart, 64), length)\n        tail := add(add(headStart, and(add(length, 31), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0)), 64)\n    }\n}',
					id: 16,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLDATASIZE PUSH2 0x13 JUMPI PUSH2 0x11 PUSH2 0x17 JUMP JUMPDEST STOP JUMPDEST PUSH2 0x11 JUMPDEST PUSH2 0x27 PUSH2 0x22 PUSH2 0x74 JUMP JUMPDEST PUSH2 0xB9 JUMP JUMPDEST JUMP JUMPDEST PUSH1 0x60 PUSH2 0x4E DUP4 DUP4 PUSH1 0x40 MLOAD DUP1 PUSH1 0x60 ADD PUSH1 0x40 MSTORE DUP1 PUSH1 0x27 DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x2FB PUSH1 0x27 SWAP2 CODECOPY PUSH2 0xDD JUMP JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND EXTCODESIZE ISZERO ISZERO SWAP1 JUMP JUMPDEST SWAP1 JUMP JUMPDEST PUSH1 0x0 PUSH2 0xB4 PUSH32 0x360894A13BA1A3210667C828492DB98DCA3E2076CC3735A920A3CA505D382BBC SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST CALLDATASIZE PUSH1 0x0 DUP1 CALLDATACOPY PUSH1 0x0 DUP1 CALLDATASIZE PUSH1 0x0 DUP5 GAS DELEGATECALL RETURNDATASIZE PUSH1 0x0 DUP1 RETURNDATACOPY DUP1 DUP1 ISZERO PUSH2 0xD8 JUMPI RETURNDATASIZE PUSH1 0x0 RETURN JUMPDEST RETURNDATASIZE PUSH1 0x0 REVERT JUMPDEST PUSH1 0x60 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 AND EXTCODESIZE PUSH2 0x188 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x26 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x416464726573733A2064656C65676174652063616C6C20746F206E6F6E2D636F PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6E74726163740000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST PUSH1 0x0 DUP1 DUP6 PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP6 PUSH1 0x40 MLOAD PUSH2 0x1B0 SWAP2 SWAP1 PUSH2 0x28D JUMP JUMPDEST PUSH1 0x0 PUSH1 0x40 MLOAD DUP1 DUP4 SUB DUP2 DUP6 GAS DELEGATECALL SWAP2 POP POP RETURNDATASIZE DUP1 PUSH1 0x0 DUP2 EQ PUSH2 0x1EB JUMPI PUSH1 0x40 MLOAD SWAP2 POP PUSH1 0x1F NOT PUSH1 0x3F RETURNDATASIZE ADD AND DUP3 ADD PUSH1 0x40 MSTORE RETURNDATASIZE DUP3 MSTORE RETURNDATASIZE PUSH1 0x0 PUSH1 0x20 DUP5 ADD RETURNDATACOPY PUSH2 0x1F0 JUMP JUMPDEST PUSH1 0x60 SWAP2 POP JUMPDEST POP SWAP2 POP SWAP2 POP PUSH2 0x200 DUP3 DUP3 DUP7 PUSH2 0x20A JUMP JUMPDEST SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x60 DUP4 ISZERO PUSH2 0x219 JUMPI POP DUP2 PUSH2 0x4E JUMP JUMPDEST DUP3 MLOAD ISZERO PUSH2 0x229 JUMPI DUP3 MLOAD DUP1 DUP5 PUSH1 0x20 ADD REVERT JUMPDEST DUP2 PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x4 ADD PUSH2 0x17F SWAP2 SWAP1 PUSH2 0x2A9 JUMP JUMPDEST PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x278 JUMPI DUP2 DUP2 ADD MLOAD DUP4 DUP3 ADD MSTORE PUSH1 0x20 ADD PUSH2 0x260 JUMP JUMPDEST DUP4 DUP2 GT ISZERO PUSH2 0x287 JUMPI PUSH1 0x0 DUP5 DUP5 ADD MSTORE JUMPDEST POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP3 MLOAD PUSH2 0x29F DUP2 DUP5 PUSH1 0x20 DUP8 ADD PUSH2 0x25D JUMP JUMPDEST SWAP2 SWAP1 SWAP2 ADD SWAP3 SWAP2 POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 DUP3 MLOAD DUP1 PUSH1 0x20 DUP5 ADD MSTORE PUSH2 0x2C8 DUP2 PUSH1 0x40 DUP6 ADD PUSH1 0x20 DUP8 ADD PUSH2 0x25D JUMP JUMPDEST PUSH1 0x1F ADD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 AND SWAP2 SWAP1 SWAP2 ADD PUSH1 0x40 ADD SWAP3 SWAP2 POP POP JUMP INVALID COINBASE PUSH5 0x6472657373 GASPRICE KECCAK256 PUSH13 0x6F772D6C6576656C2064656C65 PUSH8 0x6174652063616C6C KECCAK256 PUSH7 0x61696C6564A264 PUSH10 0x706673582212201E3C93 BASEFEE 0xED PUSH14 0xD2F363E89451207BD8DF182BC878 0xDC DUP1 0xD4 PUSH18 0x66301A510C8801E964736F6C634300080A00 CALLER ',
			sourceMap:
				'552:830:2:-:0;;;;;;2903:11:4;:9;:11::i;:::-;552:830:2;;2680:11:4;2327:110;2402:28;2412:17;:15;:17::i;:::-;2402:9;:28::i;:::-;2327:110::o;6575:198:12:-;6658:12;6689:77;6710:6;6718:4;6689:77;;;;;;;;;;;;;;;;;:20;:77::i;:::-;6682:84;6575:198;-1:-1:-1;;;6575:198:12:o;1180:320::-;1470:19;;;:23;;;1180:320::o;1599:147:14:-;1726:4;1599:147::o;1240:140:2:-;1307:12;1338:35;1035:66:3;1385:54;;;;1306:140;1338:35:2;1331:42;;1240:140;:::o;953:895:4:-;1291:14;1288:1;1285;1272:34;1505:1;1502;1486:14;1483:1;1467:14;1460:5;1447:60;1581:16;1578:1;1575;1560:38;1619:6;1686:66;;;;1801:16;1798:1;1791:27;1686:66;1721:16;1718:1;1711:27;6959:387:12;7100:12;1470:19;;;;7124:69;;;;;;;216:2:16;7124:69:12;;;198:21:16;255:2;235:18;;;228:30;294:34;274:18;;;267:62;365:8;345:18;;;338:36;391:19;;7124:69:12;;;;;;;;;7205:12;7219:23;7246:6;:19;;7266:4;7246:25;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7204:67;;;;7288:51;7305:7;7314:10;7326:12;7288:16;:51::i;:::-;7281:58;6959:387;-1:-1:-1;;;;;;6959:387:12:o;7566:692::-;7712:12;7740:7;7736:516;;;-1:-1:-1;7770:10:12;7763:17;;7736:516;7881:17;;:21;7877:365;;8075:10;8069:17;8135:15;8122:10;8118:2;8114:19;8107:44;7877:365;8214:12;8207:20;;;;;;;;;;;:::i;421:258:16:-;493:1;503:113;517:6;514:1;511:13;503:113;;;593:11;;;587:18;574:11;;;567:39;539:2;532:10;503:113;;;634:6;631:1;628:13;625:48;;;669:1;660:6;655:3;651:16;644:27;625:48;;421:258;;;:::o;684:274::-;813:3;851:6;845:13;867:53;913:6;908:3;901:4;893:6;889:17;867:53;:::i;:::-;936:16;;;;;684:274;-1:-1:-1;;684:274:16:o;963:442::-;1112:2;1101:9;1094:21;1075:4;1144:6;1138:13;1187:6;1182:2;1171:9;1167:18;1160:34;1203:66;1262:6;1257:2;1246:9;1242:18;1237:2;1229:6;1225:15;1203:66;:::i;:::-;1321:2;1309:15;1326:66;1305:88;1290:104;;;;1396:2;1286:113;;963:442;-1:-1:-1;;963:442:16:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '171000',
				executionCost: 'infinite',
				totalCost: 'infinite',
			},
			external: {
				'': 'infinite',
			},
			internal: {
				'_implementation()': '2144',
			},
		},
		methodIdentifiers: {},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"_logic","type":"address"},{"internalType":"bytes","name":"_data","type":"bytes"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"previousAdmin","type":"address"},{"indexed":false,"internalType":"address","name":"newAdmin","type":"address"}],"name":"AdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beacon","type":"address"}],"name":"BeaconUpgraded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"implementation","type":"address"}],"name":"Upgraded","type":"event"},{"stateMutability":"payable","type":"fallback"},{"stateMutability":"payable","type":"receive"}],"devdoc":{"details":"This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an implementation address that can be changed. This address is stored in storage in the location specified by https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn\'t conflict with the storage layout of the implementation behind the proxy.","kind":"dev","methods":{"constructor":{"details":"Initializes the upgradeable proxy with an initial implementation specified by `_logic`. If `_data` is nonempty, it\'s used as data in a delegate call to `_logic`. This will typically be an encoded function call, and allows initializating the storage of the proxy like a Solidity constructor."}},"version":1},"userdoc":{"kind":"user","methods":{},"version":1}},"settings":{"compilationTarget":{"solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol":"ERC1967Proxy"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/openzeppelin/interfaces/draft-IERC1822.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (interfaces/draft-IERC1822.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev ERC1822: Universal Upgradeable Proxy Standard (UUPS) documents a method for upgradeability through a simplified\\n * proxy whose upgrades are fully controlled by the current implementation.\\n */\\ninterface IERC1822Proxiable {\\n    /**\\n     * @dev Returns the storage slot that the proxiable contract assumes is being used to store the implementation\\n     * address.\\n     *\\n     * IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks\\n     * bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this\\n     * function revert if invoked through a proxy.\\n     */\\n    function proxiableUUID() external view returns (bytes32);\\n}\\n","keccak256":"0x93b4e21c931252739a1ec13ea31d3d35a5c068be3163ccab83e4d70c40355f03","license":"MIT"},"solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/ERC1967/ERC1967Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\nimport \\"../Proxy.sol\\";\\nimport \\"./ERC1967Upgrade.sol\\";\\n\\n/**\\n * @dev This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an\\n * implementation address that can be changed. This address is stored in storage in the location specified by\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn\'t conflict with the storage layout of the\\n * implementation behind the proxy.\\n */\\ncontract ERC1967Proxy is Proxy, ERC1967Upgrade {\\n    /**\\n     * @dev Initializes the upgradeable proxy with an initial implementation specified by `_logic`.\\n     *\\n     * If `_data` is nonempty, it\'s used as data in a delegate call to `_logic`. This will typically be an encoded\\n     * function call, and allows initializating the storage of the proxy like a Solidity constructor.\\n     */\\n    constructor(address _logic, bytes memory _data) payable {\\n        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256(\\"eip1967.proxy.implementation\\")) - 1));\\n        _upgradeToAndCall(_logic, _data, false);\\n    }\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _implementation() internal view virtual override returns (address impl) {\\n        return ERC1967Upgrade._getImplementation();\\n    }\\n}\\n","keccak256":"0x6309f9f39dc6f4f45a24f296543867aa358e32946cd6b2874627a996d606b3a0","license":"MIT"},"solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Upgrade.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/ERC1967/ERC1967Upgrade.sol)\\n\\npragma solidity ^0.8.2;\\n\\nimport \\"../beacon/IBeacon.sol\\";\\nimport \\"../../interfaces/draft-IERC1822.sol\\";\\nimport \\"../../utils/Address.sol\\";\\nimport \\"../../utils/StorageSlot.sol\\";\\n\\n/**\\n * @dev This abstract contract provides getters and event emitting update functions for\\n * https://eips.ethereum.org/EIPS/eip-1967[EIP1967] slots.\\n *\\n * _Available since v4.1._\\n *\\n * @custom:oz-upgrades-unsafe-allow delegatecall\\n */\\nabstract contract ERC1967Upgrade {\\n    // This is the keccak-256 hash of \\"eip1967.proxy.rollback\\" subtracted by 1\\n    bytes32 private constant _ROLLBACK_SLOT = 0x4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd9143;\\n\\n    /**\\n     * @dev Storage slot with the address of the current implementation.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.implementation\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n\\n    /**\\n     * @dev Emitted when the implementation is upgraded.\\n     */\\n    event Upgraded(address indexed implementation);\\n\\n    /**\\n     * @dev Returns the current implementation address.\\n     */\\n    function _getImplementation() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 implementation slot.\\n     */\\n    function _setImplementation(address newImplementation) private {\\n        require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeTo(address newImplementation) internal {\\n        _setImplementation(newImplementation);\\n        emit Upgraded(newImplementation);\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCall(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _upgradeTo(newImplementation);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(newImplementation, data);\\n        }\\n    }\\n\\n    /**\\n     * @dev Perform implementation upgrade with security checks for UUPS proxies, and additional setup call.\\n     *\\n     * Emits an {Upgraded} event.\\n     */\\n    function _upgradeToAndCallUUPS(\\n        address newImplementation,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        // Upgrades from old implementations will perform a rollback test. This test requires the new\\n        // implementation to upgrade back to the old, non-ERC1822 compliant, implementation. Removing\\n        // this special case will break upgrade paths from old UUPS implementation to new ones.\\n        if (StorageSlot.getBooleanSlot(_ROLLBACK_SLOT).value) {\\n            _setImplementation(newImplementation);\\n        } else {\\n            try IERC1822Proxiable(newImplementation).proxiableUUID() returns (bytes32 slot) {\\n                require(slot == _IMPLEMENTATION_SLOT, \\"ERC1967Upgrade: unsupported proxiableUUID\\");\\n            } catch {\\n                revert(\\"ERC1967Upgrade: new implementation is not UUPS\\");\\n            }\\n            _upgradeToAndCall(newImplementation, data, forceCall);\\n        }\\n    }\\n\\n    /**\\n     * @dev Storage slot with the admin of the contract.\\n     * This is the keccak-256 hash of \\"eip1967.proxy.admin\\" subtracted by 1, and is\\n     * validated in the constructor.\\n     */\\n    bytes32 internal constant _ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;\\n\\n    /**\\n     * @dev Emitted when the admin account has changed.\\n     */\\n    event AdminChanged(address previousAdmin, address newAdmin);\\n\\n    /**\\n     * @dev Returns the current admin.\\n     */\\n    function _getAdmin() internal view virtual returns (address) {\\n        return StorageSlot.getAddressSlot(_ADMIN_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new address in the EIP1967 admin slot.\\n     */\\n    function _setAdmin(address newAdmin) private {\\n        require(newAdmin != address(0), \\"ERC1967: new admin is the zero address\\");\\n        StorageSlot.getAddressSlot(_ADMIN_SLOT).value = newAdmin;\\n    }\\n\\n    /**\\n     * @dev Changes the admin of the proxy.\\n     *\\n     * Emits an {AdminChanged} event.\\n     */\\n    function _changeAdmin(address newAdmin) internal {\\n        emit AdminChanged(_getAdmin(), newAdmin);\\n        _setAdmin(newAdmin);\\n    }\\n\\n    /**\\n     * @dev The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.\\n     * This is bytes32(uint256(keccak256(\'eip1967.proxy.beacon\')) - 1)) and is validated in the constructor.\\n     */\\n    bytes32 internal constant _BEACON_SLOT = 0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50;\\n\\n    /**\\n     * @dev Emitted when the beacon is upgraded.\\n     */\\n    event BeaconUpgraded(address indexed beacon);\\n\\n    /**\\n     * @dev Returns the current beacon.\\n     */\\n    function _getBeacon() internal view returns (address) {\\n        return StorageSlot.getAddressSlot(_BEACON_SLOT).value;\\n    }\\n\\n    /**\\n     * @dev Stores a new beacon in the EIP1967 beacon slot.\\n     */\\n    function _setBeacon(address newBeacon) private {\\n        require(Address.isContract(newBeacon), \\"ERC1967: new beacon is not a contract\\");\\n        require(Address.isContract(IBeacon(newBeacon).implementation()), \\"ERC1967: beacon implementation is not a contract\\");\\n        StorageSlot.getAddressSlot(_BEACON_SLOT).value = newBeacon;\\n    }\\n\\n    /**\\n     * @dev Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does\\n     * not upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that).\\n     *\\n     * Emits a {BeaconUpgraded} event.\\n     */\\n    function _upgradeBeaconToAndCall(\\n        address newBeacon,\\n        bytes memory data,\\n        bool forceCall\\n    ) internal {\\n        _setBeacon(newBeacon);\\n        emit BeaconUpgraded(newBeacon);\\n        if (data.length > 0 || forceCall) {\\n            Address.functionDelegateCall(IBeacon(newBeacon).implementation(), data);\\n        }\\n    }\\n}\\n","keccak256":"0x17668652127feebed0ce8d9431ef95ccc8c4292f03e3b8cf06c6ca16af396633","license":"MIT"},"solc_0.8/openzeppelin/proxy/Proxy.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (proxy/Proxy.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This abstract contract provides a fallback function that delegates all calls to another contract using the EVM\\n * instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to\\n * be specified by overriding the virtual {_implementation} function.\\n *\\n * Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a\\n * different contract through the {_delegate} function.\\n *\\n * The success and return data of the delegated call will be returned back to the caller of the proxy.\\n */\\nabstract contract Proxy {\\n    /**\\n     * @dev Delegates the current call to `implementation`.\\n     *\\n     * This function does not return to its internal call site, it will return directly to the external caller.\\n     */\\n    function _delegate(address implementation) internal virtual {\\n        assembly {\\n            // Copy msg.data. We take full control of memory in this inline assembly\\n            // block because it will not return to Solidity code. We overwrite the\\n            // Solidity scratch pad at memory position 0.\\n            calldatacopy(0, 0, calldatasize())\\n\\n            // Call the implementation.\\n            // out and outsize are 0 because we don\'t know the size yet.\\n            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)\\n\\n            // Copy the returned data.\\n            returndatacopy(0, 0, returndatasize())\\n\\n            switch result\\n            // delegatecall returns 0 on error.\\n            case 0 {\\n                revert(0, returndatasize())\\n            }\\n            default {\\n                return(0, returndatasize())\\n            }\\n        }\\n    }\\n\\n    /**\\n     * @dev This is a virtual function that should be overriden so it returns the address to which the fallback function\\n     * and {_fallback} should delegate.\\n     */\\n    function _implementation() internal view virtual returns (address);\\n\\n    /**\\n     * @dev Delegates the current call to the address returned by `_implementation()`.\\n     *\\n     * This function does not return to its internall call site, it will return directly to the external caller.\\n     */\\n    function _fallback() internal virtual {\\n        _beforeFallback();\\n        _delegate(_implementation());\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other\\n     * function in the contract matches the call data.\\n     */\\n    fallback() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data\\n     * is empty.\\n     */\\n    receive() external payable virtual {\\n        _fallback();\\n    }\\n\\n    /**\\n     * @dev Hook that is called before falling back to the implementation. Can happen as part of a manual `_fallback`\\n     * call, or as part of the Solidity `fallback` or `receive` functions.\\n     *\\n     * If overriden should call `super._beforeFallback()`.\\n     */\\n    function _beforeFallback() internal virtual {}\\n}\\n","keccak256":"0xd5d1fd16e9faff7fcb3a52e02a8d49156f42a38a03f07b5f1810c21c2149a8ab","license":"MIT"},"solc_0.8/openzeppelin/proxy/beacon/IBeacon.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (proxy/beacon/IBeacon.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev This is the interface that {BeaconProxy} expects of its beacon.\\n */\\ninterface IBeacon {\\n    /**\\n     * @dev Must return an address that can be used as a delegate call target.\\n     *\\n     * {BeaconProxy} will check that this address is a contract.\\n     */\\n    function implementation() external view returns (address);\\n}\\n","keccak256":"0xd50a3421ac379ccb1be435fa646d66a65c986b4924f0849839f08692f39dde61","license":"MIT"},"solc_0.8/openzeppelin/utils/Address.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts (last updated v4.5.0-rc.0) (utils/Address.sol)\\n\\npragma solidity ^0.8.1;\\n\\n/**\\n * @dev Collection of functions related to the address type\\n */\\nlibrary Address {\\n    /**\\n     * @dev Returns true if `account` is a contract.\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * It is unsafe to assume that an address for which this function returns\\n     * false is an externally-owned account (EOA) and not a contract.\\n     *\\n     * Among others, `isContract` will return false for the following\\n     * types of addresses:\\n     *\\n     *  - an externally-owned account\\n     *  - a contract in construction\\n     *  - an address where a contract will be created\\n     *  - an address where a contract lived, but was destroyed\\n     * ====\\n     *\\n     * [IMPORTANT]\\n     * ====\\n     * You shouldn\'t rely on `isContract` to protect against flash loan attacks!\\n     *\\n     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets\\n     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract\\n     * constructor.\\n     * ====\\n     */\\n    function isContract(address account) internal view returns (bool) {\\n        // This method relies on extcodesize/address.code.length, which returns 0\\n        // for contracts in construction, since the code is only stored at the end\\n        // of the constructor execution.\\n\\n        return account.code.length > 0;\\n    }\\n\\n    /**\\n     * @dev Replacement for Solidity\'s `transfer`: sends `amount` wei to\\n     * `recipient`, forwarding all available gas and reverting on errors.\\n     *\\n     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost\\n     * of certain opcodes, possibly making contracts go over the 2300 gas limit\\n     * imposed by `transfer`, making them unable to receive funds via\\n     * `transfer`. {sendValue} removes this limitation.\\n     *\\n     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].\\n     *\\n     * IMPORTANT: because control is transferred to `recipient`, care must be\\n     * taken to not create reentrancy vulnerabilities. Consider using\\n     * {ReentrancyGuard} or the\\n     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].\\n     */\\n    function sendValue(address payable recipient, uint256 amount) internal {\\n        require(address(this).balance >= amount, \\"Address: insufficient balance\\");\\n\\n        (bool success, ) = recipient.call{value: amount}(\\"\\");\\n        require(success, \\"Address: unable to send value, recipient may have reverted\\");\\n    }\\n\\n    /**\\n     * @dev Performs a Solidity function call using a low level `call`. A\\n     * plain `call` is an unsafe replacement for a function call: use this\\n     * function instead.\\n     *\\n     * If `target` reverts with a revert reason, it is bubbled up by this\\n     * function (like regular Solidity function calls).\\n     *\\n     * Returns the raw returned data. To convert to the expected return value,\\n     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].\\n     *\\n     * Requirements:\\n     *\\n     * - `target` must be a contract.\\n     * - calling `target` with `data` must not revert.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionCall(target, data, \\"Address: low-level call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with\\n     * `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, 0, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but also transferring `value` wei to `target`.\\n     *\\n     * Requirements:\\n     *\\n     * - the calling contract must have an ETH balance of at least `value`.\\n     * - the called Solidity function must be `payable`.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value\\n    ) internal returns (bytes memory) {\\n        return functionCallWithValue(target, data, value, \\"Address: low-level call with value failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but\\n     * with `errorMessage` as a fallback revert reason when `target` reverts.\\n     *\\n     * _Available since v3.1._\\n     */\\n    function functionCallWithValue(\\n        address target,\\n        bytes memory data,\\n        uint256 value,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(address(this).balance >= value, \\"Address: insufficient balance for call\\");\\n        require(isContract(target), \\"Address: call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.call{value: value}(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {\\n        return functionStaticCall(target, data, \\"Address: low-level static call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a static call.\\n     *\\n     * _Available since v3.3._\\n     */\\n    function functionStaticCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal view returns (bytes memory) {\\n        require(isContract(target), \\"Address: static call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.staticcall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {\\n        return functionDelegateCall(target, data, \\"Address: low-level delegate call failed\\");\\n    }\\n\\n    /**\\n     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],\\n     * but performing a delegate call.\\n     *\\n     * _Available since v3.4._\\n     */\\n    function functionDelegateCall(\\n        address target,\\n        bytes memory data,\\n        string memory errorMessage\\n    ) internal returns (bytes memory) {\\n        require(isContract(target), \\"Address: delegate call to non-contract\\");\\n\\n        (bool success, bytes memory returndata) = target.delegatecall(data);\\n        return verifyCallResult(success, returndata, errorMessage);\\n    }\\n\\n    /**\\n     * @dev Tool to verifies that a low level call was successful, and revert if it wasn\'t, either by bubbling the\\n     * revert reason using the provided one.\\n     *\\n     * _Available since v4.3._\\n     */\\n    function verifyCallResult(\\n        bool success,\\n        bytes memory returndata,\\n        string memory errorMessage\\n    ) internal pure returns (bytes memory) {\\n        if (success) {\\n            return returndata;\\n        } else {\\n            // Look for revert reason and bubble it up if present\\n            if (returndata.length > 0) {\\n                // The easiest way to bubble the revert reason is using memory via assembly\\n\\n                assembly {\\n                    let returndata_size := mload(returndata)\\n                    revert(add(32, returndata), returndata_size)\\n                }\\n            } else {\\n                revert(errorMessage);\\n            }\\n        }\\n    }\\n}\\n","keccak256":"0x3777e696b62134e6177440dbe6e6601c0c156a443f57167194b67e75527439de","license":"MIT"},"solc_0.8/openzeppelin/utils/StorageSlot.sol":{"content":"// SPDX-License-Identifier: MIT\\n// OpenZeppelin Contracts v4.4.1 (utils/StorageSlot.sol)\\n\\npragma solidity ^0.8.0;\\n\\n/**\\n * @dev Library for reading and writing primitive types to specific storage slots.\\n *\\n * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.\\n * This library helps with reading and writing to such slots without the need for inline assembly.\\n *\\n * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.\\n *\\n * Example usage to set ERC1967 implementation slot:\\n * ```\\n * contract ERC1967 {\\n *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;\\n *\\n *     function _getImplementation() internal view returns (address) {\\n *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;\\n *     }\\n *\\n *     function _setImplementation(address newImplementation) internal {\\n *         require(Address.isContract(newImplementation), \\"ERC1967: new implementation is not a contract\\");\\n *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;\\n *     }\\n * }\\n * ```\\n *\\n * _Available since v4.1 for `address`, `bool`, `bytes32`, and `uint256`._\\n */\\nlibrary StorageSlot {\\n    struct AddressSlot {\\n        address value;\\n    }\\n\\n    struct BooleanSlot {\\n        bool value;\\n    }\\n\\n    struct Bytes32Slot {\\n        bytes32 value;\\n    }\\n\\n    struct Uint256Slot {\\n        uint256 value;\\n    }\\n\\n    /**\\n     * @dev Returns an `AddressSlot` with member `value` located at `slot`.\\n     */\\n    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `BooleanSlot` with member `value` located at `slot`.\\n     */\\n    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Bytes32Slot` with member `value` located at `slot`.\\n     */\\n    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n\\n    /**\\n     * @dev Returns an `Uint256Slot` with member `value` located at `slot`.\\n     */\\n    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {\\n        assembly {\\n            r.slot := slot\\n        }\\n    }\\n}\\n","keccak256":"0xfe1b7a9aa2a530a9e705b220e26cd584e2fbdc9602a3a1066032b12816b46aca","license":"MIT"}},"version":1}',
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
