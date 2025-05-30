export default {
	contractName: 'OwnershipFacet',
	sourceName: 'solc_0.8/diamond/facets/OwnershipFacet.sol',
	abi: [
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
			inputs: [],
			name: 'owner',
			outputs: [
				{
					internalType: 'address',
					name: 'owner_',
					type: 'address',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'address',
					name: '_newOwner',
					type: 'address',
				},
			],
			name: 'transferOwnership',
			outputs: [],
			stateMutability: 'nonpayable',
			type: 'function',
		},
	],
	bytecode:
		'0x608060405234801561001057600080fd5b506102d6806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f2fde38b1461006c575b600080fd5b610043610081565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61007f61007a366004610263565b6100c6565b005b60006100c17fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c13205473ffffffffffffffffffffffffffffffffffffffff1690565b905090565b6100ce6100da565b6100d7816101a9565b50565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c6004015473ffffffffffffffffffffffffffffffffffffffff1633146101a7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201527f6572000000000000000000000000000000000000000000000000000000000000606482015260840160405180910390fd5b565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c132080547fffffffffffffffffffffffff0000000000000000000000000000000000000000811673ffffffffffffffffffffffffffffffffffffffff8481169182179093556040517fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b60006020828403121561027557600080fd5b813573ffffffffffffffffffffffffffffffffffffffff8116811461029957600080fd5b939250505056fea2646970667358221220a9616a828975b8bb9adebff6bc35d6f8701d77d91b887d4901827bd22fe268c664736f6c634300080a0033',
	deployedBytecode:
		'0x608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f2fde38b1461006c575b600080fd5b610043610081565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61007f61007a366004610263565b6100c6565b005b60006100c17fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c13205473ffffffffffffffffffffffffffffffffffffffff1690565b905090565b6100ce6100da565b6100d7816101a9565b50565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c6004015473ffffffffffffffffffffffffffffffffffffffff1633146101a7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201527f6572000000000000000000000000000000000000000000000000000000000000606482015260840160405180910390fd5b565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c132080547fffffffffffffffffffffffff0000000000000000000000000000000000000000811673ffffffffffffffffffffffffffffffffffffffff8481169182179093556040517fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b60006020828403121561027557600080fd5b813573ffffffffffffffffffffffffffffffffffffffff8116811461029957600080fd5b939250505056fea2646970667358221220a9616a828975b8bb9adebff6bc35d6f8701d77d91b887d4901827bd22fe268c664736f6c634300080a0033',
	linkReferences: {},
	deployedLinkReferences: {},
	devdoc: {
		kind: 'dev',
		methods: {
			'owner()': {
				returns: {
					owner_: 'The address of the owner.',
				},
			},
			'transferOwnership(address)': {
				details: 'Set _newOwner to address(0) to renounce any ownership.',
				params: {
					_newOwner: 'The address of the new owner of the contract',
				},
			},
		},
		version: 1,
	},
	evm: {
		bytecode: {
			functionDebugData: {},
			generatedSources: [],
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x2D6 DUP1 PUSH2 0x20 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x36 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x3B JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x6C JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x43 PUSH2 0x81 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST PUSH2 0x7F PUSH2 0x7A CALLDATASIZE PUSH1 0x4 PUSH2 0x263 JUMP JUMPDEST PUSH2 0xC6 JUMP JUMPDEST STOP JUMPDEST PUSH1 0x0 PUSH2 0xC1 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C1320 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH2 0xCE PUSH2 0xDA JUMP JUMPDEST PUSH2 0xD7 DUP2 PUSH2 0x1A9 JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x4 ADD SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x1A7 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x22 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4C69624469616D6F6E643A204D75737420626520636F6E7472616374206F776E PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6572000000000000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C1320 DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000 DUP2 AND PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 DUP2 AND SWAP2 DUP3 OR SWAP1 SWAP4 SSTORE PUSH1 0x40 MLOAD PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP4 SWAP1 SWAP3 AND SWAP2 DUP3 SWAP1 PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 SWAP1 PUSH1 0x0 SWAP1 LOG3 POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x275 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x299 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xA9 PUSH2 0x6A82 DUP10 PUSH22 0xB8BB9ADEBFF6BC35D6F8701D77D91B887D4901827BD2 0x2F 0xE2 PUSH9 0xC664736F6C63430008 EXP STOP CALLER ',
			sourceMap: '169:330:5:-:0;;;;;;;;;;;;;;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@contractOwner_855': {
					entryPoint: null,
					id: 855,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@diamondStorage_809': {
					entryPoint: null,
					id: 809,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@enforceIsContractOwner_869': {
					entryPoint: 218,
					id: 869,
					parameterSlots: 0,
					returnSlots: 0,
				},
				'@owner_559': {
					entryPoint: 129,
					id: 559,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@setContractOwner_843': {
					entryPoint: 425,
					id: 843,
					parameterSlots: 1,
					returnSlots: 0,
				},
				'@transferOwnership_546': {
					entryPoint: 198,
					id: 546,
					parameterSlots: 1,
					returnSlots: 0,
				},
				abi_decode_tuple_t_address: {
					entryPoint: 611,
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
				abi_encode_tuple_t_stringliteral_0d4ae41009c51fd276653a54d7793c24f266ddc8c56ce21f8be5e2c6595ab3ac__to_t_string_memory_ptr__fromStack_reversed:
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
						src: '0:959:12',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:12',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '115:125:12',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '125:26:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '137:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '148:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '133:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '133:18:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '125:4:12',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '167:9:12',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '182:6:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '190:42:12',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '178:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '178:55:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '160:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '160:74:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '160:74:12',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '84:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '95:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '106:4:12',
										type: '',
									},
								],
								src: '14:226:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '315:239:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '361:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '370:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '373:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '363:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '363:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '363:12:12',
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
																src: '336:7:12',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '345:9:12',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '332:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '332:23:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '357:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '328:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '328:32:12',
											},
											nodeType: 'YulIf',
											src: '325:52:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '386:36:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '412:9:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '399:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '399:23:12',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '390:5:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '508:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '517:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '520:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '510:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '510:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '510:12:12',
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
																src: '444:5:12',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '455:5:12',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '462:42:12',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '451:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '451:54:12',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '441:2:12',
														},
														nodeType: 'YulFunctionCall',
														src: '441:65:12',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '434:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '434:73:12',
											},
											nodeType: 'YulIf',
											src: '431:93:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '533:15:12',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '543:5:12',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '533:6:12',
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
										src: '281:9:12',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '292:7:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '304:6:12',
										type: '',
									},
								],
								src: '245:309:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '733:224:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '750:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '761:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '743:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '743:21:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '743:21:12',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '784:9:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '795:2:12',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '780:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '780:18:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '800:2:12',
														type: '',
														value: '34',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '773:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '773:30:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '773:30:12',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '823:9:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '834:2:12',
																type: '',
																value: '64',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '819:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '819:18:12',
													},
													{
														hexValue: '4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '839:34:12',
														type: '',
														value: 'LibDiamond: Must be contract own',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '812:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '812:62:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '812:62:12',
										},
										{
											expression: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '894:9:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '905:2:12',
																type: '',
																value: '96',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '890:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '890:18:12',
													},
													{
														hexValue: '6572',
														kind: 'string',
														nodeType: 'YulLiteral',
														src: '910:4:12',
														type: '',
														value: 'er',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '883:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '883:32:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '883:32:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '924:27:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '936:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '947:3:12',
														type: '',
														value: '128',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '932:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '932:19:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '924:4:12',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_stringliteral_0d4ae41009c51fd276653a54d7793c24f266ddc8c56ce21f8be5e2c6595ab3ac__to_t_string_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '710:9:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '724:4:12',
										type: '',
									},
								],
								src: '559:398:12',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_stringliteral_0d4ae41009c51fd276653a54d7793c24f266ddc8c56ce21f8be5e2c6595ab3ac__to_t_string_memory_ptr__fromStack_reversed(headStart) -> tail\n    {\n        mstore(headStart, 32)\n        mstore(add(headStart, 32), 34)\n        mstore(add(headStart, 64), "LibDiamond: Must be contract own")\n        mstore(add(headStart, 96), "er")\n        tail := add(headStart, 128)\n    }\n}',
					id: 12,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x36 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x8DA5CB5B EQ PUSH2 0x3B JUMPI DUP1 PUSH4 0xF2FDE38B EQ PUSH2 0x6C JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x43 PUSH2 0x81 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST PUSH2 0x7F PUSH2 0x7A CALLDATASIZE PUSH1 0x4 PUSH2 0x263 JUMP JUMPDEST PUSH2 0xC6 JUMP JUMPDEST STOP JUMPDEST PUSH1 0x0 PUSH2 0xC1 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C1320 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST SWAP1 POP SWAP1 JUMP JUMPDEST PUSH2 0xCE PUSH2 0xDA JUMP JUMPDEST PUSH2 0xD7 DUP2 PUSH2 0x1A9 JUMP JUMPDEST POP JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x4 ADD SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND CALLER EQ PUSH2 0x1A7 JUMPI PUSH1 0x40 MLOAD PUSH32 0x8C379A000000000000000000000000000000000000000000000000000000000 DUP2 MSTORE PUSH1 0x20 PUSH1 0x4 DUP3 ADD MSTORE PUSH1 0x22 PUSH1 0x24 DUP3 ADD MSTORE PUSH32 0x4C69624469616D6F6E643A204D75737420626520636F6E7472616374206F776E PUSH1 0x44 DUP3 ADD MSTORE PUSH32 0x6572000000000000000000000000000000000000000000000000000000000000 PUSH1 0x64 DUP3 ADD MSTORE PUSH1 0x84 ADD PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 REVERT JUMPDEST JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C1320 DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000 DUP2 AND PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP5 DUP2 AND SWAP2 DUP3 OR SWAP1 SWAP4 SSTORE PUSH1 0x40 MLOAD PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP4 SWAP1 SWAP3 AND SWAP2 DUP3 SWAP1 PUSH32 0x8BE0079C531659141344CD1FD0A4F28419497F9722A3DAAFE3B4186F6B6457E0 SWAP1 PUSH1 0x0 SWAP1 LOG3 POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x275 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x299 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xA9 PUSH2 0x6A82 DUP10 PUSH22 0xB8BB9ADEBFF6BC35D6F8701D77D91B887D4901827BD2 0x2F 0xE2 PUSH9 0xC664736F6C63430008 EXP STOP CALLER ',
			sourceMap:
				'169:330:5:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;380:117;;;:::i;:::-;;;190:42:12;178:55;;;160:74;;148:2;133:18;380:117:5;;;;;;;210:164;;;;;;:::i;:::-;;:::i;:::-;;380:117;429:14;464:26;2220:30:11;;;;;2121:136;464:26:5;455:35;;380:117;:::o;210:164::-;284:35;:33;:35::i;:::-;329:38;357:9;329:27;:38::i;:::-;210:164;:::o;2263:156:11:-;492:45;2343:30;;;;;2329:10;:44;2321:91;;;;;;;761:2:12;2321:91:11;;;743:21:12;800:2;780:18;;;773:30;839:34;819:18;;;812:62;910:4;890:18;;;883:32;932:19;;2321:91:11;;;;;;;;2263:156::o;1851:264::-;1993:16;;;2019:28;;;1993:16;2019:28;;;;;;;;;2062:46;;492:45;;1993:16;;;;;;2062:46;;1915:25;;2062:46;1905:210;;1851:264;:::o;245:309:12:-;304:6;357:2;345:9;336:7;332:23;328:32;325:52;;;373:1;370;363:12;325:52;412:9;399:23;462:42;455:5;451:54;444:5;441:65;431:93;;520:1;517;510:12;431:93;543:5;245:309;-1:-1:-1;;;245:309:12:o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '145200',
				executionCost: '190',
				totalCost: '145390',
			},
			external: {
				'owner()': '2311',
				'transferOwnership(address)': '28232',
			},
		},
		methodIdentifiers: {
			'owner()': '8da5cb5b',
			'transferOwnership(address)': 'f2fde38b',
		},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"owner_","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}],"devdoc":{"kind":"dev","methods":{"owner()":{"returns":{"owner_":"The address of the owner."}},"transferOwnership(address)":{"details":"Set _newOwner to address(0) to renounce any ownership.","params":{"_newOwner":"The address of the new owner of the contract"}}},"version":1},"userdoc":{"kind":"user","methods":{"owner()":{"notice":"Get the address of the owner"},"transferOwnership(address)":{"notice":"Set the address of the new owner of the contract"}},"version":1}},"settings":{"compilationTarget":{"solc_0.8/diamond/facets/OwnershipFacet.sol":"OwnershipFacet"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/diamond/facets/OwnershipFacet.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport { LibDiamond } from \\"../libraries/LibDiamond.sol\\";\\nimport { IERC173 } from \\"../interfaces/IERC173.sol\\";\\n\\ncontract OwnershipFacet is IERC173 {\\n    function transferOwnership(address _newOwner) external override {\\n        LibDiamond.enforceIsContractOwner();\\n        LibDiamond.setContractOwner(_newOwner);\\n    }\\n\\n    function owner() external override view returns (address owner_) {\\n        owner_ = LibDiamond.contractOwner();\\n    }\\n}\\n","keccak256":"0x6502a171801d68e68de6c5a2b879d5e12a3a1539cdc568c2bfcc268fbdf6c5a9","license":"MIT"},"solc_0.8/diamond/interfaces/IDiamondCut.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\ninterface IDiamondCut {\\n    enum FacetCutAction {Add, Replace, Remove}\\n    // Add=0, Replace=1, Remove=2\\n\\n    struct FacetCut {\\n        address facetAddress;\\n        FacetCutAction action;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external;\\n\\n    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);\\n}\\n","keccak256":"0xc00c16bfa30a3fa5f3dc684f7f8ba62c259962b25f647d9588739458989717fc","license":"MIT"},"solc_0.8/diamond/interfaces/IERC173.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/// @title ERC-173 Contract Ownership Standard\\n///  Note: the ERC-165 identifier for this interface is 0x7f5828d0\\n/* is ERC165 */\\ninterface IERC173 {\\n    /// @dev This emits when ownership of a contract changes.\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    /// @notice Get the address of the owner\\n    /// @return owner_ The address of the owner.\\n    function owner() external view returns (address owner_);\\n\\n    /// @notice Set the address of the new owner of the contract\\n    /// @dev Set _newOwner to address(0) to renounce any ownership.\\n    /// @param _newOwner The address of the new owner of the contract\\n    function transferOwnership(address _newOwner) external;\\n}\\n","keccak256":"0x001e07b0fbc894300b939d496ffb005abe398b5bc609802d319b8cdeafe5d36b","license":"MIT"},"solc_0.8/diamond/libraries/LibDiamond.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\n\\nlibrary LibDiamond {\\n    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256(\\"diamond.standard.diamond.storage\\");\\n\\n    struct FacetAddressAndPosition {\\n        address facetAddress;\\n        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array\\n    }\\n\\n    struct FacetFunctionSelectors {\\n        bytes4[] functionSelectors;\\n        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array\\n    }\\n\\n    struct DiamondStorage {\\n        // maps function selector to the facet address and\\n        // the position of the selector in the facetFunctionSelectors.selectors array\\n        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;\\n        // maps facet addresses to function selectors\\n        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;\\n        // facet addresses\\n        address[] facetAddresses;\\n        // Used to query if a contract implements an interface.\\n        // Used to implement ERC-165.\\n        mapping(bytes4 => bool) supportedInterfaces;\\n        // owner of the contract\\n        address contractOwner;\\n    }\\n\\n    function diamondStorage() internal pure returns (DiamondStorage storage ds) {\\n        bytes32 position = DIAMOND_STORAGE_POSITION;\\n        assembly {\\n            ds.slot := position\\n        }\\n    }\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    function setContractOwner(address _newOwner) internal {\\n        DiamondStorage storage ds = diamondStorage();\\n        address previousOwner = ds.contractOwner;\\n        ds.contractOwner = _newOwner;\\n        emit OwnershipTransferred(previousOwner, _newOwner);\\n    }\\n\\n    function contractOwner() internal view returns (address contractOwner_) {\\n        contractOwner_ = diamondStorage().contractOwner;\\n    }\\n\\n    function enforceIsContractOwner() internal view {\\n        require(msg.sender == diamondStorage().contractOwner, \\"LibDiamond: Must be contract owner\\");\\n    }\\n\\n    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);\\n\\n    // Internal function version of diamondCut\\n    function diamondCut(\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        address _init,\\n        bytes memory _calldata\\n    ) internal {\\n        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {\\n            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;\\n            if (action == IDiamondCut.FacetCutAction.Add) {\\n                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Replace) {\\n                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Remove) {\\n                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else {\\n                revert(\\"LibDiamondCut: Incorrect FacetCutAction\\");\\n            }\\n        }\\n        emit DiamondCut(_diamondCut, _init, _calldata);\\n        initializeDiamondCut(_init, _calldata);\\n    }\\n\\n    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);            \\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress == address(0), \\"LibDiamondCut: Can\'t add function that already exists\\");\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);\\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress != _facetAddress, \\"LibDiamondCut: Can\'t replace function with same function\\");\\n            removeFunction(ds, oldFacetAddress, selector);\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        // if function does not exist then do nothing and return\\n        require(_facetAddress == address(0), \\"LibDiamondCut: Remove facet address must be address(0)\\");\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            removeFunction(ds, oldFacetAddress, selector);\\n        }\\n    }\\n\\n    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {\\n        enforceHasContractCode(_facetAddress, \\"LibDiamondCut: New facet has no code\\");\\n        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;\\n        ds.facetAddresses.push(_facetAddress);\\n    }    \\n\\n\\n    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {\\n        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);\\n        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;\\n    }\\n\\n    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Can\'t remove function that doesn\'t exist\\");\\n        // an immutable function is a function defined directly in a diamond\\n        require(_facetAddress != address(this), \\"LibDiamondCut: Can\'t remove immutable function\\");\\n        // replace selector with last selector, then delete last selector\\n        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;\\n        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;\\n        // if not the same then replace _selector with lastSelector\\n        if (selectorPosition != lastSelectorPosition) {\\n            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];\\n            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;\\n            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);\\n        }\\n        // delete the last selector\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();\\n        delete ds.selectorToFacetAndPosition[_selector];\\n\\n        // if no more selectors for facet address then delete the facet address\\n        if (lastSelectorPosition == 0) {\\n            // replace facet address with last facet address and delete last facet address\\n            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;\\n            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n            if (facetAddressPosition != lastFacetAddressPosition) {\\n                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];\\n                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;\\n                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;\\n            }\\n            ds.facetAddresses.pop();\\n            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n        }\\n    }\\n\\n    function initializeDiamondCut(address _init, bytes memory _calldata) internal {\\n        if (_init == address(0)) {\\n            require(_calldata.length == 0, \\"LibDiamondCut: _init is address(0) but_calldata is not empty\\");\\n        } else {\\n            require(_calldata.length > 0, \\"LibDiamondCut: _calldata is empty but _init is not address(0)\\");\\n            if (_init != address(this)) {\\n                enforceHasContractCode(_init, \\"LibDiamondCut: _init address has no code\\");\\n            }\\n            (bool success, bytes memory error) = _init.delegatecall(_calldata);\\n            if (!success) {\\n                if (error.length > 0) {\\n                    // bubble up the error\\n                    revert(string(error));\\n                } else {\\n                    revert(\\"LibDiamondCut: _init function reverted\\");\\n                }\\n            }\\n        }\\n    }\\n\\n    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {\\n        uint256 contractSize;\\n        assembly {\\n            contractSize := extcodesize(_contract)\\n        }\\n        require(contractSize > 0, _errorMessage);\\n    }\\n}\\n","keccak256":"0x2205345e83eb86f5281f159a9215a096cb6d404782619f9b8e9d7a4a46c32a37","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {
			'owner()': {
				notice: 'Get the address of the owner',
			},
			'transferOwnership(address)': {
				notice: 'Set the address of the new owner of the contract',
			},
		},
		version: 1,
	},
	solcInput:
		'{\n  "language": "Solidity",\n  "sources": {\n    "solc_0.8/diamond/Diamond.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n*\\n* Implementation of a diamond.\\n/******************************************************************************/\\n\\nimport {LibDiamond} from \\"./libraries/LibDiamond.sol\\";\\nimport {IDiamondCut} from \\"./interfaces/IDiamondCut.sol\\";\\n\\ncontract Diamond {\\n    struct Initialization {\\n        address initContract;\\n        bytes initData;\\n    }\\n\\n    /// @notice This construct a diamond contract\\n    /// @param _contractOwner the owner of the contract. With default DiamondCutFacet, this is the sole address allowed to make further cuts.\\n    /// @param _diamondCut the list of facet to add\\n    /// @param _initializations the list of initialization pair to execute. This allow to setup a contract with multiple level of independent initialization.\\n    constructor(\\n        address _contractOwner,\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        Initialization[] memory _initializations\\n    ) payable {\\n        if (_contractOwner != address(0)) {\\n            LibDiamond.setContractOwner(_contractOwner);\\n        }\\n\\n        LibDiamond.diamondCut(_diamondCut, address(0), \\"\\");\\n\\n        for (uint256 i = 0; i < _initializations.length; i++) {\\n            LibDiamond.initializeDiamondCut(_initializations[i].initContract, _initializations[i].initData);\\n        }\\n    }\\n\\n    // Find facet for function that is called and execute the\\n    // function if a facet is found and return any value.\\n    fallback() external payable {\\n        LibDiamond.DiamondStorage storage ds;\\n        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;\\n        // get diamond storage\\n        assembly {\\n            ds.slot := position\\n        }\\n        // get facet from function selector\\n        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;\\n        require(facet != address(0), \\"Diamond: Function does not exist\\");\\n        // Execute external function from facet using delegatecall and return any value.\\n        assembly {\\n            // copy function selector and any arguments\\n            calldatacopy(0, 0, calldatasize())\\n            // execute function call using the facet\\n            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)\\n            // get any return value\\n            returndatacopy(0, 0, returndatasize())\\n            // return any return value or error back to the caller\\n            switch result\\n            case 0 {\\n                revert(0, returndatasize())\\n            }\\n            default {\\n                return(0, returndatasize())\\n            }\\n        }\\n    }\\n\\n    receive() external payable {}\\n}\\n"\n    },\n    "solc_0.8/diamond/libraries/LibDiamond.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\n\\nlibrary LibDiamond {\\n    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256(\\"diamond.standard.diamond.storage\\");\\n\\n    struct FacetAddressAndPosition {\\n        address facetAddress;\\n        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array\\n    }\\n\\n    struct FacetFunctionSelectors {\\n        bytes4[] functionSelectors;\\n        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array\\n    }\\n\\n    struct DiamondStorage {\\n        // maps function selector to the facet address and\\n        // the position of the selector in the facetFunctionSelectors.selectors array\\n        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;\\n        // maps facet addresses to function selectors\\n        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;\\n        // facet addresses\\n        address[] facetAddresses;\\n        // Used to query if a contract implements an interface.\\n        // Used to implement ERC-165.\\n        mapping(bytes4 => bool) supportedInterfaces;\\n        // owner of the contract\\n        address contractOwner;\\n    }\\n\\n    function diamondStorage() internal pure returns (DiamondStorage storage ds) {\\n        bytes32 position = DIAMOND_STORAGE_POSITION;\\n        assembly {\\n            ds.slot := position\\n        }\\n    }\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    function setContractOwner(address _newOwner) internal {\\n        DiamondStorage storage ds = diamondStorage();\\n        address previousOwner = ds.contractOwner;\\n        ds.contractOwner = _newOwner;\\n        emit OwnershipTransferred(previousOwner, _newOwner);\\n    }\\n\\n    function contractOwner() internal view returns (address contractOwner_) {\\n        contractOwner_ = diamondStorage().contractOwner;\\n    }\\n\\n    function enforceIsContractOwner() internal view {\\n        require(msg.sender == diamondStorage().contractOwner, \\"LibDiamond: Must be contract owner\\");\\n    }\\n\\n    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);\\n\\n    // Internal function version of diamondCut\\n    function diamondCut(\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        address _init,\\n        bytes memory _calldata\\n    ) internal {\\n        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {\\n            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;\\n            if (action == IDiamondCut.FacetCutAction.Add) {\\n                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Replace) {\\n                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Remove) {\\n                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else {\\n                revert(\\"LibDiamondCut: Incorrect FacetCutAction\\");\\n            }\\n        }\\n        emit DiamondCut(_diamondCut, _init, _calldata);\\n        initializeDiamondCut(_init, _calldata);\\n    }\\n\\n    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);            \\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress == address(0), \\"LibDiamondCut: Can\'t add function that already exists\\");\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);\\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress != _facetAddress, \\"LibDiamondCut: Can\'t replace function with same function\\");\\n            removeFunction(ds, oldFacetAddress, selector);\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        // if function does not exist then do nothing and return\\n        require(_facetAddress == address(0), \\"LibDiamondCut: Remove facet address must be address(0)\\");\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            removeFunction(ds, oldFacetAddress, selector);\\n        }\\n    }\\n\\n    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {\\n        enforceHasContractCode(_facetAddress, \\"LibDiamondCut: New facet has no code\\");\\n        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;\\n        ds.facetAddresses.push(_facetAddress);\\n    }    \\n\\n\\n    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {\\n        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);\\n        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;\\n    }\\n\\n    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Can\'t remove function that doesn\'t exist\\");\\n        // an immutable function is a function defined directly in a diamond\\n        require(_facetAddress != address(this), \\"LibDiamondCut: Can\'t remove immutable function\\");\\n        // replace selector with last selector, then delete last selector\\n        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;\\n        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;\\n        // if not the same then replace _selector with lastSelector\\n        if (selectorPosition != lastSelectorPosition) {\\n            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];\\n            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;\\n            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);\\n        }\\n        // delete the last selector\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();\\n        delete ds.selectorToFacetAndPosition[_selector];\\n\\n        // if no more selectors for facet address then delete the facet address\\n        if (lastSelectorPosition == 0) {\\n            // replace facet address with last facet address and delete last facet address\\n            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;\\n            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n            if (facetAddressPosition != lastFacetAddressPosition) {\\n                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];\\n                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;\\n                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;\\n            }\\n            ds.facetAddresses.pop();\\n            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n        }\\n    }\\n\\n    function initializeDiamondCut(address _init, bytes memory _calldata) internal {\\n        if (_init == address(0)) {\\n            require(_calldata.length == 0, \\"LibDiamondCut: _init is address(0) but_calldata is not empty\\");\\n        } else {\\n            require(_calldata.length > 0, \\"LibDiamondCut: _calldata is empty but _init is not address(0)\\");\\n            if (_init != address(this)) {\\n                enforceHasContractCode(_init, \\"LibDiamondCut: _init address has no code\\");\\n            }\\n            (bool success, bytes memory error) = _init.delegatecall(_calldata);\\n            if (!success) {\\n                if (error.length > 0) {\\n                    // bubble up the error\\n                    revert(string(error));\\n                } else {\\n                    revert(\\"LibDiamondCut: _init function reverted\\");\\n                }\\n            }\\n        }\\n    }\\n\\n    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {\\n        uint256 contractSize;\\n        assembly {\\n            contractSize := extcodesize(_contract)\\n        }\\n        require(contractSize > 0, _errorMessage);\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IDiamondCut.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\ninterface IDiamondCut {\\n    enum FacetCutAction {Add, Replace, Remove}\\n    // Add=0, Replace=1, Remove=2\\n\\n    struct FacetCut {\\n        address facetAddress;\\n        FacetCutAction action;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external;\\n\\n    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondCutFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\nimport { LibDiamond } from \\"../libraries/LibDiamond.sol\\";\\n\\ncontract DiamondCutFacet is IDiamondCut {\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external override {\\n        LibDiamond.enforceIsContractOwner();\\n        LibDiamond.diamondCut(_diamondCut, _init, _calldata);\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/UsingDiamondOwner.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./libraries/LibDiamond.sol\\";\\n\\ncontract UsingDiamondOwner {\\n    modifier onlyOwner() {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        require(msg.sender == ds.contractOwner, \\"Only owner is allowed to perform this action\\");\\n        _;\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/initializers/DiamondERC165Init.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IERC165} from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondERC165Init {\\n    /// @notice set or unset ERC165 using DiamondStorage.supportedInterfaces\\n    /// @param interfaceIds list of interface id to set as supported\\n    /// @param interfaceIdsToRemove list of interface id to unset as supported.\\n    /// Technically, you can remove support of ERC165 by having the IERC165 id itself being part of that array.\\n    function setERC165(bytes4[] calldata interfaceIds, bytes4[] calldata interfaceIdsToRemove) external {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n\\n        ds.supportedInterfaces[type(IERC165).interfaceId] = true;\\n\\n        for (uint256 i = 0; i < interfaceIds.length; i++) {\\n            ds.supportedInterfaces[interfaceIds[i]] = true;\\n        }\\n\\n        for (uint256 i = 0; i < interfaceIdsToRemove.length; i++) {\\n            ds.supportedInterfaces[interfaceIdsToRemove[i]] = false;\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IERC165.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\ninterface IERC165 {\\n    /// @notice Query if a contract implements an interface\\n    /// @param interfaceId The interface identifier, as specified in ERC-165\\n    /// @dev Interface identification is specified in ERC-165. This function\\n    ///  uses less than 30,000 gas.\\n    /// @return `true` if the contract implements `interfaceID` and\\n    ///  `interfaceID` is not 0xffffffff, `false` otherwise\\n    function supportsInterface(bytes4 interfaceId) external view returns (bool);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondLoupeFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport { LibDiamond } from  \\"../libraries/LibDiamond.sol\\";\\nimport { IDiamondLoupe } from \\"../interfaces/IDiamondLoupe.sol\\";\\nimport { IERC165 } from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondLoupeFacet is IDiamondLoupe, IERC165 {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external override view returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external override view returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external override view returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external override view returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n\\n    // This implements ERC-165.\\n    function supportsInterface(bytes4 _interfaceId) external override view returns (bool) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        return ds.supportedInterfaces[_interfaceId];\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IDiamondLoupe.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\n// A loupe is a small magnifying glass used to look at diamonds.\\n// These functions look at diamonds\\ninterface IDiamondLoupe {\\n    /// These functions are expected to be called frequently\\n    /// by tools.\\n\\n    struct Facet {\\n        address facetAddress;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Gets all facet addresses and their four byte function selectors.\\n    /// @return facets_ Facet\\n    function facets() external view returns (Facet[] memory facets_);\\n\\n    /// @notice Gets all the function selectors supported by a specific facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory facetFunctionSelectors_);\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view returns (address[] memory facetAddresses_);\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IDiamondLoupe} from \\"../interfaces/IDiamondLoupe.sol\\";\\n\\ncontract DiamondLoupeFacetWithoutSupportsInterface is IDiamondLoupe {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external view override returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view override returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view override returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/OwnershipFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport { LibDiamond } from \\"../libraries/LibDiamond.sol\\";\\nimport { IERC173 } from \\"../interfaces/IERC173.sol\\";\\n\\ncontract OwnershipFacet is IERC173 {\\n    function transferOwnership(address _newOwner) external override {\\n        LibDiamond.enforceIsContractOwner();\\n        LibDiamond.setContractOwner(_newOwner);\\n    }\\n\\n    function owner() external override view returns (address owner_) {\\n        owner_ = LibDiamond.contractOwner();\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IERC173.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/// @title ERC-173 Contract Ownership Standard\\n///  Note: the ERC-165 identifier for this interface is 0x7f5828d0\\n/* is ERC165 */\\ninterface IERC173 {\\n    /// @dev This emits when ownership of a contract changes.\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    /// @notice Get the address of the owner\\n    /// @return owner_ The address of the owner.\\n    function owner() external view returns (address owner_);\\n\\n    /// @notice Set the address of the new owner of the contract\\n    /// @dev Set _newOwner to address(0) to renounce any ownership.\\n    /// @param _newOwner The address of the new owner of the contract\\n    function transferOwnership(address _newOwner) external;\\n}\\n"\n    }\n  },\n  "settings": {\n    "optimizer": {\n      "enabled": true,\n      "runs": 999999\n    },\n    "outputSelection": {\n      "*": {\n        "*": [\n          "abi",\n          "evm.bytecode",\n          "evm.deployedBytecode",\n          "evm.methodIdentifiers",\n          "metadata",\n          "devdoc",\n          "userdoc",\n          "storageLayout",\n          "evm.gasEstimates"\n        ],\n        "": [\n          "ast"\n        ]\n      }\n    },\n    "metadata": {\n      "useLiteralContent": true\n    }\n  }\n}',
	solcInputHash: '3fe12e823553336a8d0f950a5a792ac9',
} as const;
