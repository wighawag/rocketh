export default {
	contractName: 'DiamondERC165Init',
	sourceName: 'solc_0.8/diamond/initializers/DiamondERC165Init.sol',
	abi: [
		{
			inputs: [
				{
					internalType: 'bytes4[]',
					name: 'interfaceIds',
					type: 'bytes4[]',
				},
				{
					internalType: 'bytes4[]',
					name: 'interfaceIdsToRemove',
					type: 'bytes4[]',
				},
			],
			name: 'setERC165',
			outputs: [],
			stateMutability: 'nonpayable',
			type: 'function',
		},
	],
	bytecode:
		'0x608060405234801561001057600080fd5b5061041e806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c80632a84809114610030575b600080fd5b61004361003e3660046102a4565b610045565b005b7f01ffc9a70000000000000000000000000000000000000000000000000000000060009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131f6020527f699d9daa71b280d05a152715774afa0a81a312594b2d731d6b0b2552b7d6f69f80547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660011790557fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c905b848110156101a457600182600301600088888581811061011e5761011e610310565b9050602002016020810190610133919061033f565b7fffffffff00000000000000000000000000000000000000000000000000000000168152602081019190915260400160002080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00169115159190911790558061019c81610388565b9150506100fc565b5060005b828110156102505760008260030160008686858181106101ca576101ca610310565b90506020020160208101906101df919061033f565b7fffffffff00000000000000000000000000000000000000000000000000000000168152602081019190915260400160002080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00169115159190911790558061024881610388565b9150506101a8565b505050505050565b60008083601f84011261026a57600080fd5b50813567ffffffffffffffff81111561028257600080fd5b6020830191508360208260051b850101111561029d57600080fd5b9250929050565b600080600080604085870312156102ba57600080fd5b843567ffffffffffffffff808211156102d257600080fd5b6102de88838901610258565b909650945060208701359150808211156102f757600080fd5b5061030487828801610258565b95989497509550505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60006020828403121561035157600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461038157600080fd5b9392505050565b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156103e1577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b506001019056fea264697066735822122089ec289e8a22b626b334a083bad15a54a94f6bb0677c64dd693ce4bbd20ff34664736f6c634300080a0033',
	deployedBytecode:
		'0x608060405234801561001057600080fd5b506004361061002b5760003560e01c80632a84809114610030575b600080fd5b61004361003e3660046102a4565b610045565b005b7f01ffc9a70000000000000000000000000000000000000000000000000000000060009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131f6020527f699d9daa71b280d05a152715774afa0a81a312594b2d731d6b0b2552b7d6f69f80547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660011790557fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c905b848110156101a457600182600301600088888581811061011e5761011e610310565b9050602002016020810190610133919061033f565b7fffffffff00000000000000000000000000000000000000000000000000000000168152602081019190915260400160002080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00169115159190911790558061019c81610388565b9150506100fc565b5060005b828110156102505760008260030160008686858181106101ca576101ca610310565b90506020020160208101906101df919061033f565b7fffffffff00000000000000000000000000000000000000000000000000000000168152602081019190915260400160002080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00169115159190911790558061024881610388565b9150506101a8565b505050505050565b60008083601f84011261026a57600080fd5b50813567ffffffffffffffff81111561028257600080fd5b6020830191508360208260051b850101111561029d57600080fd5b9250929050565b600080600080604085870312156102ba57600080fd5b843567ffffffffffffffff808211156102d257600080fd5b6102de88838901610258565b909650945060208701359150808211156102f757600080fd5b5061030487828801610258565b95989497509550505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60006020828403121561035157600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461038157600080fd5b9392505050565b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156103e1577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b506001019056fea264697066735822122089ec289e8a22b626b334a083bad15a54a94f6bb0677c64dd693ce4bbd20ff34664736f6c634300080a0033',
	linkReferences: {},
	deployedLinkReferences: {},
	devdoc: {
		kind: 'dev',
		methods: {
			'setERC165(bytes4[],bytes4[])': {
				params: {
					interfaceIds: 'list of interface id to set as supported',
					interfaceIdsToRemove:
						'list of interface id to unset as supported. Technically, you can remove support of ERC165 by having the IERC165 id itself being part of that array.',
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
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x41E DUP1 PUSH2 0x20 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x2B JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x2A848091 EQ PUSH2 0x30 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x43 PUSH2 0x3E CALLDATASIZE PUSH1 0x4 PUSH2 0x2A4 JUMP JUMPDEST PUSH2 0x45 JUMP JUMPDEST STOP JUMPDEST PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131F PUSH1 0x20 MSTORE PUSH32 0x699D9DAA71B280D05A152715774AFA0A81A312594B2D731D6B0B2552B7D6F69F DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00 AND PUSH1 0x1 OR SWAP1 SSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP1 JUMPDEST DUP5 DUP2 LT ISZERO PUSH2 0x1A4 JUMPI PUSH1 0x1 DUP3 PUSH1 0x3 ADD PUSH1 0x0 DUP9 DUP9 DUP6 DUP2 DUP2 LT PUSH2 0x11E JUMPI PUSH2 0x11E PUSH2 0x310 JUMP JUMPDEST SWAP1 POP PUSH1 0x20 MUL ADD PUSH1 0x20 DUP2 ADD SWAP1 PUSH2 0x133 SWAP2 SWAP1 PUSH2 0x33F JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP2 MSTORE PUSH1 0x20 DUP2 ADD SWAP2 SWAP1 SWAP2 MSTORE PUSH1 0x40 ADD PUSH1 0x0 KECCAK256 DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00 AND SWAP2 ISZERO ISZERO SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE DUP1 PUSH2 0x19C DUP2 PUSH2 0x388 JUMP JUMPDEST SWAP2 POP POP PUSH2 0xFC JUMP JUMPDEST POP PUSH1 0x0 JUMPDEST DUP3 DUP2 LT ISZERO PUSH2 0x250 JUMPI PUSH1 0x0 DUP3 PUSH1 0x3 ADD PUSH1 0x0 DUP7 DUP7 DUP6 DUP2 DUP2 LT PUSH2 0x1CA JUMPI PUSH2 0x1CA PUSH2 0x310 JUMP JUMPDEST SWAP1 POP PUSH1 0x20 MUL ADD PUSH1 0x20 DUP2 ADD SWAP1 PUSH2 0x1DF SWAP2 SWAP1 PUSH2 0x33F JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP2 MSTORE PUSH1 0x20 DUP2 ADD SWAP2 SWAP1 SWAP2 MSTORE PUSH1 0x40 ADD PUSH1 0x0 KECCAK256 DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00 AND SWAP2 ISZERO ISZERO SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE DUP1 PUSH2 0x248 DUP2 PUSH2 0x388 JUMP JUMPDEST SWAP2 POP POP PUSH2 0x1A8 JUMP JUMPDEST POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP1 DUP4 PUSH1 0x1F DUP5 ADD SLT PUSH2 0x26A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP DUP2 CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP2 GT ISZERO PUSH2 0x282 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP2 POP DUP4 PUSH1 0x20 DUP3 PUSH1 0x5 SHL DUP6 ADD ADD GT ISZERO PUSH2 0x29D JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP3 POP SWAP3 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 DUP1 PUSH1 0x40 DUP6 DUP8 SUB SLT ISZERO PUSH2 0x2BA JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP5 CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x2D2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x2DE DUP9 DUP4 DUP10 ADD PUSH2 0x258 JUMP JUMPDEST SWAP1 SWAP7 POP SWAP5 POP PUSH1 0x20 DUP8 ADD CALLDATALOAD SWAP2 POP DUP1 DUP3 GT ISZERO PUSH2 0x2F7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x304 DUP8 DUP3 DUP9 ADD PUSH2 0x258 JUMP JUMPDEST SWAP6 SWAP9 SWAP5 SWAP8 POP SWAP6 POP POP POP POP JUMP JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x32 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x351 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x381 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 EQ ISZERO PUSH2 0x3E1 JUMPI PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP PUSH1 0x1 ADD SWAP1 JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 DUP10 0xEC 0x28 SWAP15 DUP11 0x22 0xB6 0x26 0xB3 CALLVALUE LOG0 DUP4 0xBA 0xD1 GAS SLOAD 0xA9 0x4F PUSH12 0xB0677C64DD693CE4BBD20FF3 CHAINID PUSH5 0x736F6C6343 STOP ADDMOD EXP STOP CALLER ',
			sourceMap: '165:902:6:-:0;;;;;;;;;;;;;;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@diamondStorage_809': {
					entryPoint: null,
					id: 809,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@setERC165_643': {
					entryPoint: 69,
					id: 643,
					parameterSlots: 4,
					returnSlots: 0,
				},
				abi_decode_array_bytes4_dyn_calldata: {
					entryPoint: 600,
					id: null,
					parameterSlots: 2,
					returnSlots: 2,
				},
				abi_decode_tuple_t_array$_t_bytes4_$dyn_calldata_ptrt_array$_t_bytes4_$dyn_calldata_ptr: {
					entryPoint: 676,
					id: null,
					parameterSlots: 2,
					returnSlots: 4,
				},
				abi_decode_tuple_t_bytes4: {
					entryPoint: 831,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				increment_t_uint256: {
					entryPoint: 904,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				panic_error_0x32: {
					entryPoint: 784,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:2036:12',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:12',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '97:283:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '146:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '155:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '158:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '148:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '148:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '148:12:12',
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
																		name: 'offset',
																		nodeType: 'YulIdentifier',
																		src: '125:6:12',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '133:4:12',
																		type: '',
																		value: '0x1f',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '121:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '121:17:12',
															},
															{
																name: 'end',
																nodeType: 'YulIdentifier',
																src: '140:3:12',
															},
														],
														functionName: {
															name: 'slt',
															nodeType: 'YulIdentifier',
															src: '117:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '117:27:12',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '110:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '110:35:12',
											},
											nodeType: 'YulIf',
											src: '107:55:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '171:30:12',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '194:6:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '181:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '181:20:12',
											},
											variableNames: [
												{
													name: 'length',
													nodeType: 'YulIdentifier',
													src: '171:6:12',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '244:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '253:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '256:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '246:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '246:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '246:12:12',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '216:6:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '224:18:12',
														type: '',
														value: '0xffffffffffffffff',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '213:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '213:30:12',
											},
											nodeType: 'YulIf',
											src: '210:50:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '269:29:12',
											value: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '285:6:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '293:4:12',
														type: '',
														value: '0x20',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '281:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '281:17:12',
											},
											variableNames: [
												{
													name: 'arrayPos',
													nodeType: 'YulIdentifier',
													src: '269:8:12',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '358:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '367:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '370:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '360:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '360:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '360:12:12',
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
																		name: 'offset',
																		nodeType: 'YulIdentifier',
																		src: '321:6:12',
																	},
																	{
																		arguments: [
																			{
																				kind: 'number',
																				nodeType: 'YulLiteral',
																				src: '333:1:12',
																				type: '',
																				value: '5',
																			},
																			{
																				name: 'length',
																				nodeType: 'YulIdentifier',
																				src: '336:6:12',
																			},
																		],
																		functionName: {
																			name: 'shl',
																			nodeType: 'YulIdentifier',
																			src: '329:3:12',
																		},
																		nodeType: 'YulFunctionCall',
																		src: '329:14:12',
																	},
																],
																functionName: {
																	name: 'add',
																	nodeType: 'YulIdentifier',
																	src: '317:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '317:27:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '346:4:12',
																type: '',
																value: '0x20',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '313:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '313:38:12',
													},
													{
														name: 'end',
														nodeType: 'YulIdentifier',
														src: '353:3:12',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '310:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '310:47:12',
											},
											nodeType: 'YulIf',
											src: '307:67:12',
										},
									],
								},
								name: 'abi_decode_array_bytes4_dyn_calldata',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'offset',
										nodeType: 'YulTypedName',
										src: '60:6:12',
										type: '',
									},
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '68:3:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'arrayPos',
										nodeType: 'YulTypedName',
										src: '76:8:12',
										type: '',
									},
									{
										name: 'length',
										nodeType: 'YulTypedName',
										src: '86:6:12',
										type: '',
									},
								],
								src: '14:366:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '540:614:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '586:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '595:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '598:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '588:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '588:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '588:12:12',
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
																src: '561:7:12',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '570:9:12',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '557:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '557:23:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '582:2:12',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '553:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '553:32:12',
											},
											nodeType: 'YulIf',
											src: '550:52:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '611:37:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '638:9:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '625:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '625:23:12',
											},
											variables: [
												{
													name: 'offset',
													nodeType: 'YulTypedName',
													src: '615:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '657:28:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '667:18:12',
												type: '',
												value: '0xffffffffffffffff',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '661:2:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '712:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '721:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '724:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '714:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '714:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '714:12:12',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset',
														nodeType: 'YulIdentifier',
														src: '700:6:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '708:2:12',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '697:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '697:14:12',
											},
											nodeType: 'YulIf',
											src: '694:34:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '737:95:12',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '804:9:12',
															},
															{
																name: 'offset',
																nodeType: 'YulIdentifier',
																src: '815:6:12',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '800:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '800:22:12',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '824:7:12',
													},
												],
												functionName: {
													name: 'abi_decode_array_bytes4_dyn_calldata',
													nodeType: 'YulIdentifier',
													src: '763:36:12',
												},
												nodeType: 'YulFunctionCall',
												src: '763:69:12',
											},
											variables: [
												{
													name: 'value0_1',
													nodeType: 'YulTypedName',
													src: '741:8:12',
													type: '',
												},
												{
													name: 'value1_1',
													nodeType: 'YulTypedName',
													src: '751:8:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '841:18:12',
											value: {
												name: 'value0_1',
												nodeType: 'YulIdentifier',
												src: '851:8:12',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '841:6:12',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '868:18:12',
											value: {
												name: 'value1_1',
												nodeType: 'YulIdentifier',
												src: '878:8:12',
											},
											variableNames: [
												{
													name: 'value1',
													nodeType: 'YulIdentifier',
													src: '868:6:12',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '895:48:12',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '928:9:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '939:2:12',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '924:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '924:18:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '911:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '911:32:12',
											},
											variables: [
												{
													name: 'offset_1',
													nodeType: 'YulTypedName',
													src: '899:8:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '972:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '981:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '984:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '974:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '974:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '974:12:12',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'offset_1',
														nodeType: 'YulIdentifier',
														src: '958:8:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '968:2:12',
													},
												],
												functionName: {
													name: 'gt',
													nodeType: 'YulIdentifier',
													src: '955:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '955:16:12',
											},
											nodeType: 'YulIf',
											src: '952:36:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '997:97:12',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1064:9:12',
															},
															{
																name: 'offset_1',
																nodeType: 'YulIdentifier',
																src: '1075:8:12',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1060:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '1060:24:12',
													},
													{
														name: 'dataEnd',
														nodeType: 'YulIdentifier',
														src: '1086:7:12',
													},
												],
												functionName: {
													name: 'abi_decode_array_bytes4_dyn_calldata',
													nodeType: 'YulIdentifier',
													src: '1023:36:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1023:71:12',
											},
											variables: [
												{
													name: 'value2_1',
													nodeType: 'YulTypedName',
													src: '1001:8:12',
													type: '',
												},
												{
													name: 'value3_1',
													nodeType: 'YulTypedName',
													src: '1011:8:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1103:18:12',
											value: {
												name: 'value2_1',
												nodeType: 'YulIdentifier',
												src: '1113:8:12',
											},
											variableNames: [
												{
													name: 'value2',
													nodeType: 'YulIdentifier',
													src: '1103:6:12',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1130:18:12',
											value: {
												name: 'value3_1',
												nodeType: 'YulIdentifier',
												src: '1140:8:12',
											},
											variableNames: [
												{
													name: 'value3',
													nodeType: 'YulIdentifier',
													src: '1130:6:12',
												},
											],
										},
									],
								},
								name: 'abi_decode_tuple_t_array$_t_bytes4_$dyn_calldata_ptrt_array$_t_bytes4_$dyn_calldata_ptr',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '482:9:12',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '493:7:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '505:6:12',
										type: '',
									},
									{
										name: 'value1',
										nodeType: 'YulTypedName',
										src: '513:6:12',
										type: '',
									},
									{
										name: 'value2',
										nodeType: 'YulTypedName',
										src: '521:6:12',
										type: '',
									},
									{
										name: 'value3',
										nodeType: 'YulTypedName',
										src: '529:6:12',
										type: '',
									},
								],
								src: '385:769:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1191:152:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1208:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1211:77:12',
														type: '',
														value: '35408467139433450592217433187231851964531694900788300625387963629091585785856',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1201:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1201:88:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '1201:88:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1305:1:12',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1308:4:12',
														type: '',
														value: '0x32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1298:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1298:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '1298:15:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1329:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1332:4:12',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '1322:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1322:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '1322:15:12',
										},
									],
								},
								name: 'panic_error_0x32',
								nodeType: 'YulFunctionDefinition',
								src: '1159:184:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1417:263:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1463:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1472:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1475:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1465:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1465:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1465:12:12',
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
																src: '1438:7:12',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1447:9:12',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '1434:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '1434:23:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1459:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '1430:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1430:32:12',
											},
											nodeType: 'YulIf',
											src: '1427:52:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1488:36:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1514:9:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '1501:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1501:23:12',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '1492:5:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1634:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1643:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1646:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1636:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1636:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1636:12:12',
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
																src: '1546:5:12',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '1557:5:12',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1564:66:12',
																		type: '',
																		value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '1553:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '1553:78:12',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '1543:2:12',
														},
														nodeType: 'YulFunctionCall',
														src: '1543:89:12',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '1536:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1536:97:12',
											},
											nodeType: 'YulIf',
											src: '1533:117:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '1659:15:12',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '1669:5:12',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '1659:6:12',
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
										src: '1383:9:12',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '1394:7:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1406:6:12',
										type: '',
									},
								],
								src: '1348:332:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1732:302:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '1831:168:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1852:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1855:77:12',
																	type: '',
																	value:
																		'35408467139433450592217433187231851964531694900788300625387963629091585785856',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1845:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1845:88:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1845:88:12',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1953:1:12',
																	type: '',
																	value: '4',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1956:4:12',
																	type: '',
																	value: '0x11',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1946:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1946:15:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1946:15:12',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1981:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1984:4:12',
																	type: '',
																	value: '0x24',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '1974:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1974:15:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1974:15:12',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '1748:5:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '1755:66:12',
														type: '',
														value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
													},
												],
												functionName: {
													name: 'eq',
													nodeType: 'YulIdentifier',
													src: '1745:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1745:77:12',
											},
											nodeType: 'YulIf',
											src: '1742:257:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '2008:20:12',
											value: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '2019:5:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2026:1:12',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2015:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2015:13:12',
											},
											variableNames: [
												{
													name: 'ret',
													nodeType: 'YulIdentifier',
													src: '2008:3:12',
												},
											],
										},
									],
								},
								name: 'increment_t_uint256',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '1714:5:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'ret',
										nodeType: 'YulTypedName',
										src: '1724:3:12',
										type: '',
									},
								],
								src: '1685:349:12',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_array_bytes4_dyn_calldata(offset, end) -> arrayPos, length\n    {\n        if iszero(slt(add(offset, 0x1f), end)) { revert(0, 0) }\n        length := calldataload(offset)\n        if gt(length, 0xffffffffffffffff) { revert(0, 0) }\n        arrayPos := add(offset, 0x20)\n        if gt(add(add(offset, shl(5, length)), 0x20), end) { revert(0, 0) }\n    }\n    function abi_decode_tuple_t_array$_t_bytes4_$dyn_calldata_ptrt_array$_t_bytes4_$dyn_calldata_ptr(headStart, dataEnd) -> value0, value1, value2, value3\n    {\n        if slt(sub(dataEnd, headStart), 64) { revert(0, 0) }\n        let offset := calldataload(headStart)\n        let _1 := 0xffffffffffffffff\n        if gt(offset, _1) { revert(0, 0) }\n        let value0_1, value1_1 := abi_decode_array_bytes4_dyn_calldata(add(headStart, offset), dataEnd)\n        value0 := value0_1\n        value1 := value1_1\n        let offset_1 := calldataload(add(headStart, 32))\n        if gt(offset_1, _1) { revert(0, 0) }\n        let value2_1, value3_1 := abi_decode_array_bytes4_dyn_calldata(add(headStart, offset_1), dataEnd)\n        value2 := value2_1\n        value3 := value3_1\n    }\n    function panic_error_0x32()\n    {\n        mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n        mstore(4, 0x32)\n        revert(0, 0x24)\n    }\n    function abi_decode_tuple_t_bytes4(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffff00000000000000000000000000000000000000000000000000000000))) { revert(0, 0) }\n        value0 := value\n    }\n    function increment_t_uint256(value) -> ret\n    {\n        if eq(value, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)\n        {\n            mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n            mstore(4, 0x11)\n            revert(0, 0x24)\n        }\n        ret := add(value, 1)\n    }\n}',
					id: 12,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x2B JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x2A848091 EQ PUSH2 0x30 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x43 PUSH2 0x3E CALLDATASIZE PUSH1 0x4 PUSH2 0x2A4 JUMP JUMPDEST PUSH2 0x45 JUMP JUMPDEST STOP JUMPDEST PUSH32 0x1FFC9A700000000000000000000000000000000000000000000000000000000 PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131F PUSH1 0x20 MSTORE PUSH32 0x699D9DAA71B280D05A152715774AFA0A81A312594B2D731D6B0B2552B7D6F69F DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00 AND PUSH1 0x1 OR SWAP1 SSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP1 JUMPDEST DUP5 DUP2 LT ISZERO PUSH2 0x1A4 JUMPI PUSH1 0x1 DUP3 PUSH1 0x3 ADD PUSH1 0x0 DUP9 DUP9 DUP6 DUP2 DUP2 LT PUSH2 0x11E JUMPI PUSH2 0x11E PUSH2 0x310 JUMP JUMPDEST SWAP1 POP PUSH1 0x20 MUL ADD PUSH1 0x20 DUP2 ADD SWAP1 PUSH2 0x133 SWAP2 SWAP1 PUSH2 0x33F JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP2 MSTORE PUSH1 0x20 DUP2 ADD SWAP2 SWAP1 SWAP2 MSTORE PUSH1 0x40 ADD PUSH1 0x0 KECCAK256 DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00 AND SWAP2 ISZERO ISZERO SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE DUP1 PUSH2 0x19C DUP2 PUSH2 0x388 JUMP JUMPDEST SWAP2 POP POP PUSH2 0xFC JUMP JUMPDEST POP PUSH1 0x0 JUMPDEST DUP3 DUP2 LT ISZERO PUSH2 0x250 JUMPI PUSH1 0x0 DUP3 PUSH1 0x3 ADD PUSH1 0x0 DUP7 DUP7 DUP6 DUP2 DUP2 LT PUSH2 0x1CA JUMPI PUSH2 0x1CA PUSH2 0x310 JUMP JUMPDEST SWAP1 POP PUSH1 0x20 MUL ADD PUSH1 0x20 DUP2 ADD SWAP1 PUSH2 0x1DF SWAP2 SWAP1 PUSH2 0x33F JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP2 MSTORE PUSH1 0x20 DUP2 ADD SWAP2 SWAP1 SWAP2 MSTORE PUSH1 0x40 ADD PUSH1 0x0 KECCAK256 DUP1 SLOAD PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00 AND SWAP2 ISZERO ISZERO SWAP2 SWAP1 SWAP2 OR SWAP1 SSTORE DUP1 PUSH2 0x248 DUP2 PUSH2 0x388 JUMP JUMPDEST SWAP2 POP POP PUSH2 0x1A8 JUMP JUMPDEST POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP1 DUP4 PUSH1 0x1F DUP5 ADD SLT PUSH2 0x26A JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP DUP2 CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP2 GT ISZERO PUSH2 0x282 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP4 ADD SWAP2 POP DUP4 PUSH1 0x20 DUP3 PUSH1 0x5 SHL DUP6 ADD ADD GT ISZERO PUSH2 0x29D JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP3 POP SWAP3 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 DUP1 PUSH1 0x0 DUP1 PUSH1 0x40 DUP6 DUP8 SUB SLT ISZERO PUSH2 0x2BA JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP5 CALLDATALOAD PUSH8 0xFFFFFFFFFFFFFFFF DUP1 DUP3 GT ISZERO PUSH2 0x2D2 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x2DE DUP9 DUP4 DUP10 ADD PUSH2 0x258 JUMP JUMPDEST SWAP1 SWAP7 POP SWAP5 POP PUSH1 0x20 DUP8 ADD CALLDATALOAD SWAP2 POP DUP1 DUP3 GT ISZERO PUSH2 0x2F7 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x304 DUP8 DUP3 DUP9 ADD PUSH2 0x258 JUMP JUMPDEST SWAP6 SWAP9 SWAP5 SWAP8 POP SWAP6 POP POP POP POP JUMP JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x32 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x351 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x381 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 EQ ISZERO PUSH2 0x3E1 JUMPI PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP PUSH1 0x1 ADD SWAP1 JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 DUP10 0xEC 0x28 SWAP15 DUP11 0x22 0xB6 0x26 0xB3 CALLVALUE LOG0 DUP4 0xBA 0xD1 GAS SLOAD 0xA9 0x4F PUSH12 0xB0677C64DD693CE4BBD20FF3 CHAINID PUSH5 0x736F6C6343 STOP ADDMOD EXP STOP CALLER ',
			sourceMap:
				'165:902:6:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;536:529;;;;;;:::i;:::-;;:::i;:::-;;;746:25;646:36;723:49;;;:22;:49;;;:56;;;;775:4;723:56;;;492:45:11;;790:121:6;810:23;;;790:121;;;896:4;854:2;:22;;:39;877:12;;890:1;877:15;;;;;;;:::i;:::-;;;;;;;;;;;;;;:::i;:::-;854:39;;;;;;;;;;;;;-1:-1:-1;854:39:6;:46;;;;;;;;;;;;;835:3;;;;:::i;:::-;;;;790:121;;;;926:9;921:138;941:31;;;921:138;;;1043:5;993:2;:22;;:47;1016:20;;1037:1;1016:23;;;;;;;:::i;:::-;;;;;;;;;;;;;;:::i;:::-;993:47;;;;;;;;;;;;;-1:-1:-1;993:47:6;:55;;;;;;;;;;;;;974:3;;;;:::i;:::-;;;;921:138;;;;636:429;536:529;;;;:::o;14:366:12:-;76:8;86:6;140:3;133:4;125:6;121:17;117:27;107:55;;158:1;155;148:12;107:55;-1:-1:-1;181:20:12;;224:18;213:30;;210:50;;;256:1;253;246:12;210:50;293:4;285:6;281:17;269:29;;353:3;346:4;336:6;333:1;329:14;321:6;317:27;313:38;310:47;307:67;;;370:1;367;360:12;307:67;14:366;;;;;:::o;385:769::-;505:6;513;521;529;582:2;570:9;561:7;557:23;553:32;550:52;;;598:1;595;588:12;550:52;638:9;625:23;667:18;708:2;700:6;697:14;694:34;;;724:1;721;714:12;694:34;763:69;824:7;815:6;804:9;800:22;763:69;:::i;:::-;851:8;;-1:-1:-1;737:95:12;-1:-1:-1;939:2:12;924:18;;911:32;;-1:-1:-1;955:16:12;;;952:36;;;984:1;981;974:12;952:36;;1023:71;1086:7;1075:8;1064:9;1060:24;1023:71;:::i;:::-;385:769;;;;-1:-1:-1;1113:8:12;-1:-1:-1;;;;385:769:12:o;1159:184::-;1211:77;1208:1;1201:88;1308:4;1305:1;1298:15;1332:4;1329:1;1322:15;1348:332;1406:6;1459:2;1447:9;1438:7;1434:23;1430:32;1427:52;;;1475:1;1472;1465:12;1427:52;1514:9;1501:23;1564:66;1557:5;1553:78;1546:5;1543:89;1533:117;;1646:1;1643;1636:12;1533:117;1669:5;1348:332;-1:-1:-1;;;1348:332:12:o;1685:349::-;1724:3;1755:66;1748:5;1745:77;1742:257;;;1855:77;1852:1;1845:88;1956:4;1953:1;1946:15;1984:4;1981:1;1974:15;1742:257;-1:-1:-1;2026:1:12;2015:13;;1685:349::o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '210800',
				executionCost: '251',
				totalCost: '211051',
			},
			external: {
				'setERC165(bytes4[],bytes4[])': 'infinite',
			},
		},
		methodIdentifiers: {
			'setERC165(bytes4[],bytes4[])': '2a848091',
		},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"bytes4[]","name":"interfaceIds","type":"bytes4[]"},{"internalType":"bytes4[]","name":"interfaceIdsToRemove","type":"bytes4[]"}],"name":"setERC165","outputs":[],"stateMutability":"nonpayable","type":"function"}],"devdoc":{"kind":"dev","methods":{"setERC165(bytes4[],bytes4[])":{"params":{"interfaceIds":"list of interface id to set as supported","interfaceIdsToRemove":"list of interface id to unset as supported. Technically, you can remove support of ERC165 by having the IERC165 id itself being part of that array."}}},"version":1},"userdoc":{"kind":"user","methods":{"setERC165(bytes4[],bytes4[])":{"notice":"set or unset ERC165 using DiamondStorage.supportedInterfaces"}},"version":1}},"settings":{"compilationTarget":{"solc_0.8/diamond/initializers/DiamondERC165Init.sol":"DiamondERC165Init"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/diamond/initializers/DiamondERC165Init.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IERC165} from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondERC165Init {\\n    /// @notice set or unset ERC165 using DiamondStorage.supportedInterfaces\\n    /// @param interfaceIds list of interface id to set as supported\\n    /// @param interfaceIdsToRemove list of interface id to unset as supported.\\n    /// Technically, you can remove support of ERC165 by having the IERC165 id itself being part of that array.\\n    function setERC165(bytes4[] calldata interfaceIds, bytes4[] calldata interfaceIdsToRemove) external {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n\\n        ds.supportedInterfaces[type(IERC165).interfaceId] = true;\\n\\n        for (uint256 i = 0; i < interfaceIds.length; i++) {\\n            ds.supportedInterfaces[interfaceIds[i]] = true;\\n        }\\n\\n        for (uint256 i = 0; i < interfaceIdsToRemove.length; i++) {\\n            ds.supportedInterfaces[interfaceIdsToRemove[i]] = false;\\n        }\\n    }\\n}\\n","keccak256":"0x71a7a882fb6ee26dbfd70ec75d230f6336d2dd05db7e480168aadb53f216ae4b","license":"MIT"},"solc_0.8/diamond/interfaces/IDiamondCut.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\ninterface IDiamondCut {\\n    enum FacetCutAction {Add, Replace, Remove}\\n    // Add=0, Replace=1, Remove=2\\n\\n    struct FacetCut {\\n        address facetAddress;\\n        FacetCutAction action;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external;\\n\\n    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);\\n}\\n","keccak256":"0xc00c16bfa30a3fa5f3dc684f7f8ba62c259962b25f647d9588739458989717fc","license":"MIT"},"solc_0.8/diamond/interfaces/IERC165.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\ninterface IERC165 {\\n    /// @notice Query if a contract implements an interface\\n    /// @param interfaceId The interface identifier, as specified in ERC-165\\n    /// @dev Interface identification is specified in ERC-165. This function\\n    ///  uses less than 30,000 gas.\\n    /// @return `true` if the contract implements `interfaceID` and\\n    ///  `interfaceID` is not 0xffffffff, `false` otherwise\\n    function supportsInterface(bytes4 interfaceId) external view returns (bool);\\n}\\n","keccak256":"0x7541f7408d0f74162bc4664d5e012427f2ceaab2abadca0353269ef15ee03d8b","license":"MIT"},"solc_0.8/diamond/libraries/LibDiamond.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\n\\nlibrary LibDiamond {\\n    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256(\\"diamond.standard.diamond.storage\\");\\n\\n    struct FacetAddressAndPosition {\\n        address facetAddress;\\n        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array\\n    }\\n\\n    struct FacetFunctionSelectors {\\n        bytes4[] functionSelectors;\\n        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array\\n    }\\n\\n    struct DiamondStorage {\\n        // maps function selector to the facet address and\\n        // the position of the selector in the facetFunctionSelectors.selectors array\\n        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;\\n        // maps facet addresses to function selectors\\n        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;\\n        // facet addresses\\n        address[] facetAddresses;\\n        // Used to query if a contract implements an interface.\\n        // Used to implement ERC-165.\\n        mapping(bytes4 => bool) supportedInterfaces;\\n        // owner of the contract\\n        address contractOwner;\\n    }\\n\\n    function diamondStorage() internal pure returns (DiamondStorage storage ds) {\\n        bytes32 position = DIAMOND_STORAGE_POSITION;\\n        assembly {\\n            ds.slot := position\\n        }\\n    }\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    function setContractOwner(address _newOwner) internal {\\n        DiamondStorage storage ds = diamondStorage();\\n        address previousOwner = ds.contractOwner;\\n        ds.contractOwner = _newOwner;\\n        emit OwnershipTransferred(previousOwner, _newOwner);\\n    }\\n\\n    function contractOwner() internal view returns (address contractOwner_) {\\n        contractOwner_ = diamondStorage().contractOwner;\\n    }\\n\\n    function enforceIsContractOwner() internal view {\\n        require(msg.sender == diamondStorage().contractOwner, \\"LibDiamond: Must be contract owner\\");\\n    }\\n\\n    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);\\n\\n    // Internal function version of diamondCut\\n    function diamondCut(\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        address _init,\\n        bytes memory _calldata\\n    ) internal {\\n        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {\\n            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;\\n            if (action == IDiamondCut.FacetCutAction.Add) {\\n                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Replace) {\\n                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Remove) {\\n                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else {\\n                revert(\\"LibDiamondCut: Incorrect FacetCutAction\\");\\n            }\\n        }\\n        emit DiamondCut(_diamondCut, _init, _calldata);\\n        initializeDiamondCut(_init, _calldata);\\n    }\\n\\n    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);            \\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress == address(0), \\"LibDiamondCut: Can\'t add function that already exists\\");\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);\\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress != _facetAddress, \\"LibDiamondCut: Can\'t replace function with same function\\");\\n            removeFunction(ds, oldFacetAddress, selector);\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        // if function does not exist then do nothing and return\\n        require(_facetAddress == address(0), \\"LibDiamondCut: Remove facet address must be address(0)\\");\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            removeFunction(ds, oldFacetAddress, selector);\\n        }\\n    }\\n\\n    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {\\n        enforceHasContractCode(_facetAddress, \\"LibDiamondCut: New facet has no code\\");\\n        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;\\n        ds.facetAddresses.push(_facetAddress);\\n    }    \\n\\n\\n    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {\\n        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);\\n        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;\\n    }\\n\\n    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Can\'t remove function that doesn\'t exist\\");\\n        // an immutable function is a function defined directly in a diamond\\n        require(_facetAddress != address(this), \\"LibDiamondCut: Can\'t remove immutable function\\");\\n        // replace selector with last selector, then delete last selector\\n        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;\\n        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;\\n        // if not the same then replace _selector with lastSelector\\n        if (selectorPosition != lastSelectorPosition) {\\n            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];\\n            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;\\n            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);\\n        }\\n        // delete the last selector\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();\\n        delete ds.selectorToFacetAndPosition[_selector];\\n\\n        // if no more selectors for facet address then delete the facet address\\n        if (lastSelectorPosition == 0) {\\n            // replace facet address with last facet address and delete last facet address\\n            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;\\n            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n            if (facetAddressPosition != lastFacetAddressPosition) {\\n                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];\\n                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;\\n                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;\\n            }\\n            ds.facetAddresses.pop();\\n            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n        }\\n    }\\n\\n    function initializeDiamondCut(address _init, bytes memory _calldata) internal {\\n        if (_init == address(0)) {\\n            require(_calldata.length == 0, \\"LibDiamondCut: _init is address(0) but_calldata is not empty\\");\\n        } else {\\n            require(_calldata.length > 0, \\"LibDiamondCut: _calldata is empty but _init is not address(0)\\");\\n            if (_init != address(this)) {\\n                enforceHasContractCode(_init, \\"LibDiamondCut: _init address has no code\\");\\n            }\\n            (bool success, bytes memory error) = _init.delegatecall(_calldata);\\n            if (!success) {\\n                if (error.length > 0) {\\n                    // bubble up the error\\n                    revert(string(error));\\n                } else {\\n                    revert(\\"LibDiamondCut: _init function reverted\\");\\n                }\\n            }\\n        }\\n    }\\n\\n    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {\\n        uint256 contractSize;\\n        assembly {\\n            contractSize := extcodesize(_contract)\\n        }\\n        require(contractSize > 0, _errorMessage);\\n    }\\n}\\n","keccak256":"0x2205345e83eb86f5281f159a9215a096cb6d404782619f9b8e9d7a4a46c32a37","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {
			'setERC165(bytes4[],bytes4[])': {
				notice: 'set or unset ERC165 using DiamondStorage.supportedInterfaces',
			},
		},
		version: 1,
	},
	solcInput:
		'{\n  "language": "Solidity",\n  "sources": {\n    "solc_0.8/diamond/Diamond.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n*\\n* Implementation of a diamond.\\n/******************************************************************************/\\n\\nimport {LibDiamond} from \\"./libraries/LibDiamond.sol\\";\\nimport {IDiamondCut} from \\"./interfaces/IDiamondCut.sol\\";\\n\\ncontract Diamond {\\n    struct Initialization {\\n        address initContract;\\n        bytes initData;\\n    }\\n\\n    /// @notice This construct a diamond contract\\n    /// @param _contractOwner the owner of the contract. With default DiamondCutFacet, this is the sole address allowed to make further cuts.\\n    /// @param _diamondCut the list of facet to add\\n    /// @param _initializations the list of initialization pair to execute. This allow to setup a contract with multiple level of independent initialization.\\n    constructor(\\n        address _contractOwner,\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        Initialization[] memory _initializations\\n    ) payable {\\n        if (_contractOwner != address(0)) {\\n            LibDiamond.setContractOwner(_contractOwner);\\n        }\\n\\n        LibDiamond.diamondCut(_diamondCut, address(0), \\"\\");\\n\\n        for (uint256 i = 0; i < _initializations.length; i++) {\\n            LibDiamond.initializeDiamondCut(_initializations[i].initContract, _initializations[i].initData);\\n        }\\n    }\\n\\n    // Find facet for function that is called and execute the\\n    // function if a facet is found and return any value.\\n    fallback() external payable {\\n        LibDiamond.DiamondStorage storage ds;\\n        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;\\n        // get diamond storage\\n        assembly {\\n            ds.slot := position\\n        }\\n        // get facet from function selector\\n        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;\\n        require(facet != address(0), \\"Diamond: Function does not exist\\");\\n        // Execute external function from facet using delegatecall and return any value.\\n        assembly {\\n            // copy function selector and any arguments\\n            calldatacopy(0, 0, calldatasize())\\n            // execute function call using the facet\\n            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)\\n            // get any return value\\n            returndatacopy(0, 0, returndatasize())\\n            // return any return value or error back to the caller\\n            switch result\\n            case 0 {\\n                revert(0, returndatasize())\\n            }\\n            default {\\n                return(0, returndatasize())\\n            }\\n        }\\n    }\\n\\n    receive() external payable {}\\n}\\n"\n    },\n    "solc_0.8/diamond/libraries/LibDiamond.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\n\\nlibrary LibDiamond {\\n    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256(\\"diamond.standard.diamond.storage\\");\\n\\n    struct FacetAddressAndPosition {\\n        address facetAddress;\\n        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array\\n    }\\n\\n    struct FacetFunctionSelectors {\\n        bytes4[] functionSelectors;\\n        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array\\n    }\\n\\n    struct DiamondStorage {\\n        // maps function selector to the facet address and\\n        // the position of the selector in the facetFunctionSelectors.selectors array\\n        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;\\n        // maps facet addresses to function selectors\\n        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;\\n        // facet addresses\\n        address[] facetAddresses;\\n        // Used to query if a contract implements an interface.\\n        // Used to implement ERC-165.\\n        mapping(bytes4 => bool) supportedInterfaces;\\n        // owner of the contract\\n        address contractOwner;\\n    }\\n\\n    function diamondStorage() internal pure returns (DiamondStorage storage ds) {\\n        bytes32 position = DIAMOND_STORAGE_POSITION;\\n        assembly {\\n            ds.slot := position\\n        }\\n    }\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    function setContractOwner(address _newOwner) internal {\\n        DiamondStorage storage ds = diamondStorage();\\n        address previousOwner = ds.contractOwner;\\n        ds.contractOwner = _newOwner;\\n        emit OwnershipTransferred(previousOwner, _newOwner);\\n    }\\n\\n    function contractOwner() internal view returns (address contractOwner_) {\\n        contractOwner_ = diamondStorage().contractOwner;\\n    }\\n\\n    function enforceIsContractOwner() internal view {\\n        require(msg.sender == diamondStorage().contractOwner, \\"LibDiamond: Must be contract owner\\");\\n    }\\n\\n    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);\\n\\n    // Internal function version of diamondCut\\n    function diamondCut(\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        address _init,\\n        bytes memory _calldata\\n    ) internal {\\n        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {\\n            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;\\n            if (action == IDiamondCut.FacetCutAction.Add) {\\n                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Replace) {\\n                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Remove) {\\n                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else {\\n                revert(\\"LibDiamondCut: Incorrect FacetCutAction\\");\\n            }\\n        }\\n        emit DiamondCut(_diamondCut, _init, _calldata);\\n        initializeDiamondCut(_init, _calldata);\\n    }\\n\\n    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);            \\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress == address(0), \\"LibDiamondCut: Can\'t add function that already exists\\");\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);\\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress != _facetAddress, \\"LibDiamondCut: Can\'t replace function with same function\\");\\n            removeFunction(ds, oldFacetAddress, selector);\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        // if function does not exist then do nothing and return\\n        require(_facetAddress == address(0), \\"LibDiamondCut: Remove facet address must be address(0)\\");\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            removeFunction(ds, oldFacetAddress, selector);\\n        }\\n    }\\n\\n    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {\\n        enforceHasContractCode(_facetAddress, \\"LibDiamondCut: New facet has no code\\");\\n        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;\\n        ds.facetAddresses.push(_facetAddress);\\n    }    \\n\\n\\n    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {\\n        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);\\n        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;\\n    }\\n\\n    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Can\'t remove function that doesn\'t exist\\");\\n        // an immutable function is a function defined directly in a diamond\\n        require(_facetAddress != address(this), \\"LibDiamondCut: Can\'t remove immutable function\\");\\n        // replace selector with last selector, then delete last selector\\n        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;\\n        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;\\n        // if not the same then replace _selector with lastSelector\\n        if (selectorPosition != lastSelectorPosition) {\\n            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];\\n            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;\\n            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);\\n        }\\n        // delete the last selector\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();\\n        delete ds.selectorToFacetAndPosition[_selector];\\n\\n        // if no more selectors for facet address then delete the facet address\\n        if (lastSelectorPosition == 0) {\\n            // replace facet address with last facet address and delete last facet address\\n            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;\\n            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n            if (facetAddressPosition != lastFacetAddressPosition) {\\n                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];\\n                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;\\n                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;\\n            }\\n            ds.facetAddresses.pop();\\n            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n        }\\n    }\\n\\n    function initializeDiamondCut(address _init, bytes memory _calldata) internal {\\n        if (_init == address(0)) {\\n            require(_calldata.length == 0, \\"LibDiamondCut: _init is address(0) but_calldata is not empty\\");\\n        } else {\\n            require(_calldata.length > 0, \\"LibDiamondCut: _calldata is empty but _init is not address(0)\\");\\n            if (_init != address(this)) {\\n                enforceHasContractCode(_init, \\"LibDiamondCut: _init address has no code\\");\\n            }\\n            (bool success, bytes memory error) = _init.delegatecall(_calldata);\\n            if (!success) {\\n                if (error.length > 0) {\\n                    // bubble up the error\\n                    revert(string(error));\\n                } else {\\n                    revert(\\"LibDiamondCut: _init function reverted\\");\\n                }\\n            }\\n        }\\n    }\\n\\n    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {\\n        uint256 contractSize;\\n        assembly {\\n            contractSize := extcodesize(_contract)\\n        }\\n        require(contractSize > 0, _errorMessage);\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IDiamondCut.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\ninterface IDiamondCut {\\n    enum FacetCutAction {Add, Replace, Remove}\\n    // Add=0, Replace=1, Remove=2\\n\\n    struct FacetCut {\\n        address facetAddress;\\n        FacetCutAction action;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external;\\n\\n    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondCutFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\nimport { LibDiamond } from \\"../libraries/LibDiamond.sol\\";\\n\\ncontract DiamondCutFacet is IDiamondCut {\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external override {\\n        LibDiamond.enforceIsContractOwner();\\n        LibDiamond.diamondCut(_diamondCut, _init, _calldata);\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/UsingDiamondOwner.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./libraries/LibDiamond.sol\\";\\n\\ncontract UsingDiamondOwner {\\n    modifier onlyOwner() {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        require(msg.sender == ds.contractOwner, \\"Only owner is allowed to perform this action\\");\\n        _;\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/initializers/DiamondERC165Init.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IERC165} from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondERC165Init {\\n    /// @notice set or unset ERC165 using DiamondStorage.supportedInterfaces\\n    /// @param interfaceIds list of interface id to set as supported\\n    /// @param interfaceIdsToRemove list of interface id to unset as supported.\\n    /// Technically, you can remove support of ERC165 by having the IERC165 id itself being part of that array.\\n    function setERC165(bytes4[] calldata interfaceIds, bytes4[] calldata interfaceIdsToRemove) external {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n\\n        ds.supportedInterfaces[type(IERC165).interfaceId] = true;\\n\\n        for (uint256 i = 0; i < interfaceIds.length; i++) {\\n            ds.supportedInterfaces[interfaceIds[i]] = true;\\n        }\\n\\n        for (uint256 i = 0; i < interfaceIdsToRemove.length; i++) {\\n            ds.supportedInterfaces[interfaceIdsToRemove[i]] = false;\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IERC165.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\ninterface IERC165 {\\n    /// @notice Query if a contract implements an interface\\n    /// @param interfaceId The interface identifier, as specified in ERC-165\\n    /// @dev Interface identification is specified in ERC-165. This function\\n    ///  uses less than 30,000 gas.\\n    /// @return `true` if the contract implements `interfaceID` and\\n    ///  `interfaceID` is not 0xffffffff, `false` otherwise\\n    function supportsInterface(bytes4 interfaceId) external view returns (bool);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondLoupeFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport { LibDiamond } from  \\"../libraries/LibDiamond.sol\\";\\nimport { IDiamondLoupe } from \\"../interfaces/IDiamondLoupe.sol\\";\\nimport { IERC165 } from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondLoupeFacet is IDiamondLoupe, IERC165 {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external override view returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external override view returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external override view returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external override view returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n\\n    // This implements ERC-165.\\n    function supportsInterface(bytes4 _interfaceId) external override view returns (bool) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        return ds.supportedInterfaces[_interfaceId];\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IDiamondLoupe.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\n// A loupe is a small magnifying glass used to look at diamonds.\\n// These functions look at diamonds\\ninterface IDiamondLoupe {\\n    /// These functions are expected to be called frequently\\n    /// by tools.\\n\\n    struct Facet {\\n        address facetAddress;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Gets all facet addresses and their four byte function selectors.\\n    /// @return facets_ Facet\\n    function facets() external view returns (Facet[] memory facets_);\\n\\n    /// @notice Gets all the function selectors supported by a specific facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory facetFunctionSelectors_);\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view returns (address[] memory facetAddresses_);\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IDiamondLoupe} from \\"../interfaces/IDiamondLoupe.sol\\";\\n\\ncontract DiamondLoupeFacetWithoutSupportsInterface is IDiamondLoupe {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external view override returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view override returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view override returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/OwnershipFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport { LibDiamond } from \\"../libraries/LibDiamond.sol\\";\\nimport { IERC173 } from \\"../interfaces/IERC173.sol\\";\\n\\ncontract OwnershipFacet is IERC173 {\\n    function transferOwnership(address _newOwner) external override {\\n        LibDiamond.enforceIsContractOwner();\\n        LibDiamond.setContractOwner(_newOwner);\\n    }\\n\\n    function owner() external override view returns (address owner_) {\\n        owner_ = LibDiamond.contractOwner();\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IERC173.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/// @title ERC-173 Contract Ownership Standard\\n///  Note: the ERC-165 identifier for this interface is 0x7f5828d0\\n/* is ERC165 */\\ninterface IERC173 {\\n    /// @dev This emits when ownership of a contract changes.\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    /// @notice Get the address of the owner\\n    /// @return owner_ The address of the owner.\\n    function owner() external view returns (address owner_);\\n\\n    /// @notice Set the address of the new owner of the contract\\n    /// @dev Set _newOwner to address(0) to renounce any ownership.\\n    /// @param _newOwner The address of the new owner of the contract\\n    function transferOwnership(address _newOwner) external;\\n}\\n"\n    }\n  },\n  "settings": {\n    "optimizer": {\n      "enabled": true,\n      "runs": 999999\n    },\n    "outputSelection": {\n      "*": {\n        "*": [\n          "abi",\n          "evm.bytecode",\n          "evm.deployedBytecode",\n          "evm.methodIdentifiers",\n          "metadata",\n          "devdoc",\n          "userdoc",\n          "storageLayout",\n          "evm.gasEstimates"\n        ],\n        "": [\n          "ast"\n        ]\n      }\n    },\n    "metadata": {\n      "useLiteralContent": true\n    }\n  }\n}',
	solcInputHash: '3fe12e823553336a8d0f950a5a792ac9',
} as const;
