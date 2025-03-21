export default {
	contractName: 'DiamondLoupeFacetWithoutSupportsInterface',
	sourceName: 'solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol',
	abi: [
		{
			inputs: [
				{
					internalType: 'bytes4',
					name: '_functionSelector',
					type: 'bytes4',
				},
			],
			name: 'facetAddress',
			outputs: [
				{
					internalType: 'address',
					name: 'facetAddress_',
					type: 'address',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'facetAddresses',
			outputs: [
				{
					internalType: 'address[]',
					name: 'facetAddresses_',
					type: 'address[]',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [
				{
					internalType: 'address',
					name: '_facet',
					type: 'address',
				},
			],
			name: 'facetFunctionSelectors',
			outputs: [
				{
					internalType: 'bytes4[]',
					name: 'facetFunctionSelectors_',
					type: 'bytes4[]',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
		{
			inputs: [],
			name: 'facets',
			outputs: [
				{
					components: [
						{
							internalType: 'address',
							name: 'facetAddress',
							type: 'address',
						},
						{
							internalType: 'bytes4[]',
							name: 'functionSelectors',
							type: 'bytes4[]',
						},
					],
					internalType: 'struct IDiamondLoupe.Facet[]',
					name: 'facets_',
					type: 'tuple[]',
				},
			],
			stateMutability: 'view',
			type: 'function',
		},
	],
	bytecode:
		'0x608060405234801561001057600080fd5b506107c3806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806352ef6b2c146100515780637a0ed6271461006f578063adfca15e14610084578063cdffacc6146100a4575b600080fd5b610059610140565b60405161006691906104de565b60405180910390f35b6100776101d2565b6040516100669190610595565b61009761009236600461063d565b6103de565b604051610066919061067a565b61011b6100b236600461068d565b7fffffffff000000000000000000000000000000000000000000000000000000001660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c602052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610066565b606060007fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c600281018054604080516020808402820181019092528281529394508301828280156101c757602002820191906000526020600020905b815473ffffffffffffffffffffffffffffffffffffffff16815260019091019060200180831161019c575b505050505091505090565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131e546060907fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c908067ffffffffffffffff811115610232576102326106cf565b60405190808252806020026020018201604052801561027857816020015b6040805180820190915260008152606060208201528152602001906001900390816102505790505b50925060005b818110156103d857600083600201828154811061029d5761029d6106fe565b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050808583815181106102dd576102dd6106fe565b60209081029190910181015173ffffffffffffffffffffffffffffffffffffffff928316905290821660009081526001860182526040908190208054825181850281018501909352808352919290919083018282801561039e57602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168152602001906004019060208260030104928301926001038202915080841161034b5790505b50505050508583815181106103b5576103b56106fe565b6020026020010151602001819052505080806103d09061072d565b91505061027e565b50505090565b73ffffffffffffffffffffffffffffffffffffffff811660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131d602090815260409182902080548351818402810184019094528084526060937fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c93909291908301828280156104d157602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168152602001906004019060208260030104928301926001038202915080841161047e5790505b5050505050915050919050565b6020808252825182820181905260009190848201906040850190845b8181101561052c57835173ffffffffffffffffffffffffffffffffffffffff16835292840192918401916001016104fa565b50909695505050505050565b600081518084526020808501945080840160005b8381101561058a5781517fffffffff00000000000000000000000000000000000000000000000000000000168752958201959082019060010161054c565b509495945050505050565b60006020808301818452808551808352604092508286019150828160051b87010184880160005b8381101561062f578883037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc00185528151805173ffffffffffffffffffffffffffffffffffffffff16845287015187840187905261061c87850182610538565b95880195935050908601906001016105bc565b509098975050505050505050565b60006020828403121561064f57600080fd5b813573ffffffffffffffffffffffffffffffffffffffff8116811461067357600080fd5b9392505050565b6020815260006106736020830184610538565b60006020828403121561069f57600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461067357600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415610786577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b506001019056fea2646970667358221220cb986091e36c99b33615a659f908bbdf81cdc170b39858195b82d45b2e733a5e64736f6c634300080a0033',
	deployedBytecode:
		'0x608060405234801561001057600080fd5b506004361061004c5760003560e01c806352ef6b2c146100515780637a0ed6271461006f578063adfca15e14610084578063cdffacc6146100a4575b600080fd5b610059610140565b60405161006691906104de565b60405180910390f35b6100776101d2565b6040516100669190610595565b61009761009236600461063d565b6103de565b604051610066919061067a565b61011b6100b236600461068d565b7fffffffff000000000000000000000000000000000000000000000000000000001660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c602052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610066565b606060007fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c600281018054604080516020808402820181019092528281529394508301828280156101c757602002820191906000526020600020905b815473ffffffffffffffffffffffffffffffffffffffff16815260019091019060200180831161019c575b505050505091505090565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131e546060907fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c908067ffffffffffffffff811115610232576102326106cf565b60405190808252806020026020018201604052801561027857816020015b6040805180820190915260008152606060208201528152602001906001900390816102505790505b50925060005b818110156103d857600083600201828154811061029d5761029d6106fe565b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050808583815181106102dd576102dd6106fe565b60209081029190910181015173ffffffffffffffffffffffffffffffffffffffff928316905290821660009081526001860182526040908190208054825181850281018501909352808352919290919083018282801561039e57602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168152602001906004019060208260030104928301926001038202915080841161034b5790505b50505050508583815181106103b5576103b56106fe565b6020026020010151602001819052505080806103d09061072d565b91505061027e565b50505090565b73ffffffffffffffffffffffffffffffffffffffff811660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131d602090815260409182902080548351818402810184019094528084526060937fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c93909291908301828280156104d157602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19168152602001906004019060208260030104928301926001038202915080841161047e5790505b5050505050915050919050565b6020808252825182820181905260009190848201906040850190845b8181101561052c57835173ffffffffffffffffffffffffffffffffffffffff16835292840192918401916001016104fa565b50909695505050505050565b600081518084526020808501945080840160005b8381101561058a5781517fffffffff00000000000000000000000000000000000000000000000000000000168752958201959082019060010161054c565b509495945050505050565b60006020808301818452808551808352604092508286019150828160051b87010184880160005b8381101561062f578883037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc00185528151805173ffffffffffffffffffffffffffffffffffffffff16845287015187840187905261061c87850182610538565b95880195935050908601906001016105bc565b509098975050505050505050565b60006020828403121561064f57600080fd5b813573ffffffffffffffffffffffffffffffffffffffff8116811461067357600080fd5b9392505050565b6020815260006106736020830184610538565b60006020828403121561069f57600080fd5b81357fffffffff000000000000000000000000000000000000000000000000000000008116811461067357600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415610786577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b506001019056fea2646970667358221220cb986091e36c99b33615a659f908bbdf81cdc170b39858195b82d45b2e733a5e64736f6c634300080a0033',
	linkReferences: {},
	deployedLinkReferences: {},
	devdoc: {
		kind: 'dev',
		methods: {
			'facetAddress(bytes4)': {
				details: 'If facet is not found return address(0).',
				params: {
					_functionSelector: 'The function selector.',
				},
				returns: {
					facetAddress_: 'The facet address.',
				},
			},
			'facetAddresses()': {
				returns: {
					facetAddresses_: 'facetAddresses_',
				},
			},
			'facetFunctionSelectors(address)': {
				params: {
					_facet: 'The facet address.',
				},
				returns: {
					facetFunctionSelectors_: 'facetFunctionSelectors_',
				},
			},
			'facets()': {
				returns: {
					facets_: 'Facet',
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
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x7C3 DUP1 PUSH2 0x20 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x4C JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x52EF6B2C EQ PUSH2 0x51 JUMPI DUP1 PUSH4 0x7A0ED627 EQ PUSH2 0x6F JUMPI DUP1 PUSH4 0xADFCA15E EQ PUSH2 0x84 JUMPI DUP1 PUSH4 0xCDFFACC6 EQ PUSH2 0xA4 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x59 PUSH2 0x140 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0x66 SWAP2 SWAP1 PUSH2 0x4DE JUMP JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST PUSH2 0x77 PUSH2 0x1D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0x66 SWAP2 SWAP1 PUSH2 0x595 JUMP JUMPDEST PUSH2 0x97 PUSH2 0x92 CALLDATASIZE PUSH1 0x4 PUSH2 0x63D JUMP JUMPDEST PUSH2 0x3DE JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0x66 SWAP2 SWAP1 PUSH2 0x67A JUMP JUMPDEST PUSH2 0x11B PUSH2 0xB2 CALLDATASIZE PUSH1 0x4 PUSH2 0x68D JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x20 MSTORE PUSH1 0x40 SWAP1 KECCAK256 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x66 JUMP JUMPDEST PUSH1 0x60 PUSH1 0x0 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x2 DUP2 ADD DUP1 SLOAD PUSH1 0x40 DUP1 MLOAD PUSH1 0x20 DUP1 DUP5 MUL DUP3 ADD DUP2 ADD SWAP1 SWAP3 MSTORE DUP3 DUP2 MSTORE SWAP4 SWAP5 POP DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x1C7 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 JUMPDEST DUP2 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 MSTORE PUSH1 0x1 SWAP1 SWAP2 ADD SWAP1 PUSH1 0x20 ADD DUP1 DUP4 GT PUSH2 0x19C JUMPI JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP1 JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131E SLOAD PUSH1 0x60 SWAP1 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP1 DUP1 PUSH8 0xFFFFFFFFFFFFFFFF DUP2 GT ISZERO PUSH2 0x232 JUMPI PUSH2 0x232 PUSH2 0x6CF JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 DUP1 DUP3 MSTORE DUP1 PUSH1 0x20 MUL PUSH1 0x20 ADD DUP3 ADD PUSH1 0x40 MSTORE DUP1 ISZERO PUSH2 0x278 JUMPI DUP2 PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 DUP1 MLOAD DUP1 DUP3 ADD SWAP1 SWAP2 MSTORE PUSH1 0x0 DUP2 MSTORE PUSH1 0x60 PUSH1 0x20 DUP3 ADD MSTORE DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x1 SWAP1 SUB SWAP1 DUP2 PUSH2 0x250 JUMPI SWAP1 POP JUMPDEST POP SWAP3 POP PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x3D8 JUMPI PUSH1 0x0 DUP4 PUSH1 0x2 ADD DUP3 DUP2 SLOAD DUP2 LT PUSH2 0x29D JUMPI PUSH2 0x29D PUSH2 0x6FE JUMP JUMPDEST SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 ADD PUSH1 0x0 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 POP DUP1 DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x2DD JUMPI PUSH2 0x2DD PUSH2 0x6FE JUMP JUMPDEST PUSH1 0x20 SWAP1 DUP2 MUL SWAP2 SWAP1 SWAP2 ADD DUP2 ADD MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP3 DUP4 AND SWAP1 MSTORE SWAP1 DUP3 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH1 0x1 DUP7 ADD DUP3 MSTORE PUSH1 0x40 SWAP1 DUP2 SWAP1 KECCAK256 DUP1 SLOAD DUP3 MLOAD DUP2 DUP6 MUL DUP2 ADD DUP6 ADD SWAP1 SWAP4 MSTORE DUP1 DUP4 MSTORE SWAP2 SWAP3 SWAP1 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x39E JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x34B JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x3B5 JUMPI PUSH2 0x3B5 PUSH2 0x6FE JUMP JUMPDEST PUSH1 0x20 MUL PUSH1 0x20 ADD ADD MLOAD PUSH1 0x20 ADD DUP2 SWAP1 MSTORE POP POP DUP1 DUP1 PUSH2 0x3D0 SWAP1 PUSH2 0x72D JUMP JUMPDEST SWAP2 POP POP PUSH2 0x27E JUMP JUMPDEST POP POP POP SWAP1 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131D PUSH1 0x20 SWAP1 DUP2 MSTORE PUSH1 0x40 SWAP2 DUP3 SWAP1 KECCAK256 DUP1 SLOAD DUP4 MLOAD DUP2 DUP5 MUL DUP2 ADD DUP5 ADD SWAP1 SWAP5 MSTORE DUP1 DUP5 MSTORE PUSH1 0x60 SWAP4 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP4 SWAP1 SWAP3 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x4D1 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x47E JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x20 DUP1 DUP3 MSTORE DUP3 MLOAD DUP3 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x0 SWAP2 SWAP1 DUP5 DUP3 ADD SWAP1 PUSH1 0x40 DUP6 ADD SWAP1 DUP5 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x52C JUMPI DUP4 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 MSTORE SWAP3 DUP5 ADD SWAP3 SWAP2 DUP5 ADD SWAP2 PUSH1 0x1 ADD PUSH2 0x4FA JUMP JUMPDEST POP SWAP1 SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD DUP1 DUP5 MSTORE PUSH1 0x20 DUP1 DUP6 ADD SWAP5 POP DUP1 DUP5 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x58A JUMPI DUP2 MLOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP8 MSTORE SWAP6 DUP3 ADD SWAP6 SWAP1 DUP3 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x54C JUMP JUMPDEST POP SWAP5 SWAP6 SWAP5 POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP1 DUP4 ADD DUP2 DUP5 MSTORE DUP1 DUP6 MLOAD DUP1 DUP4 MSTORE PUSH1 0x40 SWAP3 POP DUP3 DUP7 ADD SWAP2 POP DUP3 DUP2 PUSH1 0x5 SHL DUP8 ADD ADD DUP5 DUP9 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x62F JUMPI DUP9 DUP4 SUB PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC0 ADD DUP6 MSTORE DUP2 MLOAD DUP1 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP5 MSTORE DUP8 ADD MLOAD DUP8 DUP5 ADD DUP8 SWAP1 MSTORE PUSH2 0x61C DUP8 DUP6 ADD DUP3 PUSH2 0x538 JUMP JUMPDEST SWAP6 DUP9 ADD SWAP6 SWAP4 POP POP SWAP1 DUP7 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x5BC JUMP JUMPDEST POP SWAP1 SWAP9 SWAP8 POP POP POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x64F JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x673 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 PUSH2 0x673 PUSH1 0x20 DUP4 ADD DUP5 PUSH2 0x538 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x69F JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x673 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x32 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 EQ ISZERO PUSH2 0x786 JUMPI PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP PUSH1 0x1 ADD SWAP1 JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xCB SWAP9 PUSH1 0x91 0xE3 PUSH13 0x99B33615A659F908BBDF81CDC1 PUSH17 0xB39858195B82D45B2E733A5E64736F6C63 NUMBER STOP ADDMOD EXP STOP CALLER ',
			sourceMap: '481:2239:4:-:0;;;;;;;;;;;;;;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@diamondStorage_809': {
					entryPoint: null,
					id: 809,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@facetAddress_519': {
					entryPoint: null,
					id: 519,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@facetAddresses_492': {
					entryPoint: 320,
					id: 492,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@facetFunctionSelectors_469': {
					entryPoint: 990,
					id: 469,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@facets_441': {
					entryPoint: 466,
					id: 441,
					parameterSlots: 0,
					returnSlots: 1,
				},
				abi_decode_tuple_t_address: {
					entryPoint: 1597,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_bytes4: {
					entryPoint: 1677,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_array_bytes4_dyn: {
					entryPoint: 1336,
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
				abi_encode_tuple_t_array$_t_address_$dyn_memory_ptr__to_t_array$_t_address_$dyn_memory_ptr__fromStack_reversed:
					{
						entryPoint: 1246,
						id: null,
						parameterSlots: 2,
						returnSlots: 1,
					},
				abi_encode_tuple_t_array$_t_bytes4_$dyn_memory_ptr__to_t_array$_t_bytes4_$dyn_memory_ptr__fromStack_reversed: {
					entryPoint: 1658,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__to_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__fromStack_reversed:
					{
						entryPoint: 1429,
						id: null,
						parameterSlots: 2,
						returnSlots: 1,
					},
				increment_t_uint256: {
					entryPoint: 1837,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				panic_error_0x32: {
					entryPoint: 1790,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
				panic_error_0x41: {
					entryPoint: 1743,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:4230:12',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:12',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '165:530:12',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '175:12:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '185:2:12',
												type: '',
												value: '32',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '179:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '196:32:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '214:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '225:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '210:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '210:18:12',
											},
											variables: [
												{
													name: 'tail_1',
													nodeType: 'YulTypedName',
													src: '200:6:12',
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
														src: '244:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '255:2:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '237:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '237:21:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '237:21:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '267:17:12',
											value: {
												name: 'tail_1',
												nodeType: 'YulIdentifier',
												src: '278:6:12',
											},
											variables: [
												{
													name: 'pos',
													nodeType: 'YulTypedName',
													src: '271:3:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '293:27:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '313:6:12',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '307:5:12',
												},
												nodeType: 'YulFunctionCall',
												src: '307:13:12',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '297:6:12',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'tail_1',
														nodeType: 'YulIdentifier',
														src: '336:6:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '344:6:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '329:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '329:22:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '329:22:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '360:25:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '371:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '382:2:12',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '367:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '367:18:12',
											},
											variableNames: [
												{
													name: 'pos',
													nodeType: 'YulIdentifier',
													src: '360:3:12',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '394:29:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '412:6:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '420:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '408:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '408:15:12',
											},
											variables: [
												{
													name: 'srcPtr',
													nodeType: 'YulTypedName',
													src: '398:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '432:10:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '441:1:12',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '436:1:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '500:169:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '521:3:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'srcPtr',
																					nodeType: 'YulIdentifier',
																					src: '536:6:12',
																				},
																			],
																			functionName: {
																				name: 'mload',
																				nodeType: 'YulIdentifier',
																				src: '530:5:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '530:13:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '545:42:12',
																			type: '',
																			value: '0xffffffffffffffffffffffffffffffffffffffff',
																		},
																	],
																	functionName: {
																		name: 'and',
																		nodeType: 'YulIdentifier',
																		src: '526:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '526:62:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '514:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '514:75:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '514:75:12',
													},
													{
														nodeType: 'YulAssignment',
														src: '602:19:12',
														value: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '613:3:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '618:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '609:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '609:12:12',
														},
														variableNames: [
															{
																name: 'pos',
																nodeType: 'YulIdentifier',
																src: '602:3:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '634:25:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '648:6:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '656:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '644:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '644:15:12',
														},
														variableNames: [
															{
																name: 'srcPtr',
																nodeType: 'YulIdentifier',
																src: '634:6:12',
															},
														],
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '462:1:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '465:6:12',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '459:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '459:13:12',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '473:18:12',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '475:14:12',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '484:1:12',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '487:1:12',
																	type: '',
																	value: '1',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '480:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '480:9:12',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '475:1:12',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '455:3:12',
												statements: [],
											},
											src: '451:218:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '678:11:12',
											value: {
												name: 'pos',
												nodeType: 'YulIdentifier',
												src: '686:3:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '678:4:12',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_array$_t_address_$dyn_memory_ptr__to_t_array$_t_address_$dyn_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '134:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '145:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '156:4:12',
										type: '',
									},
								],
								src: '14:681:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '760:447:12',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '770:26:12',
											value: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '790:5:12',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '784:5:12',
												},
												nodeType: 'YulFunctionCall',
												src: '784:12:12',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '774:6:12',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '812:3:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '817:6:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '805:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '805:19:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '805:19:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '833:14:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '843:4:12',
												type: '',
												value: '0x20',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '837:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '856:19:12',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '867:3:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '872:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '863:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '863:12:12',
											},
											variableNames: [
												{
													name: 'pos',
													nodeType: 'YulIdentifier',
													src: '856:3:12',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '884:28:12',
											value: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '902:5:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '909:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '898:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '898:14:12',
											},
											variables: [
												{
													name: 'srcPtr',
													nodeType: 'YulTypedName',
													src: '888:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '921:10:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '930:1:12',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '925:1:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '989:193:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '1010:3:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'srcPtr',
																					nodeType: 'YulIdentifier',
																					src: '1025:6:12',
																				},
																			],
																			functionName: {
																				name: 'mload',
																				nodeType: 'YulIdentifier',
																				src: '1019:5:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '1019:13:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1034:66:12',
																			type: '',
																			value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																		},
																	],
																	functionName: {
																		name: 'and',
																		nodeType: 'YulIdentifier',
																		src: '1015:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '1015:86:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1003:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1003:99:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1003:99:12',
													},
													{
														nodeType: 'YulAssignment',
														src: '1115:19:12',
														value: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '1126:3:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '1131:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1122:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1122:12:12',
														},
														variableNames: [
															{
																name: 'pos',
																nodeType: 'YulIdentifier',
																src: '1115:3:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '1147:25:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '1161:6:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '1169:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1157:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1157:15:12',
														},
														variableNames: [
															{
																name: 'srcPtr',
																nodeType: 'YulIdentifier',
																src: '1147:6:12',
															},
														],
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '951:1:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '954:6:12',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '948:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '948:13:12',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '962:18:12',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '964:14:12',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '973:1:12',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '976:1:12',
																	type: '',
																	value: '1',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '969:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '969:9:12',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '964:1:12',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '944:3:12',
												statements: [],
											},
											src: '940:242:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '1191:10:12',
											value: {
												name: 'pos',
												nodeType: 'YulIdentifier',
												src: '1198:3:12',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '1191:3:12',
												},
											],
										},
									],
								},
								name: 'abi_encode_array_bytes4_dyn',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'value',
										nodeType: 'YulTypedName',
										src: '737:5:12',
										type: '',
									},
									{
										name: 'pos',
										nodeType: 'YulTypedName',
										src: '744:3:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '752:3:12',
										type: '',
									},
								],
								src: '700:507:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1407:944:12',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '1417:12:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1427:2:12',
												type: '',
												value: '32',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1421:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1438:32:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1456:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1467:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1452:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1452:18:12',
											},
											variables: [
												{
													name: 'tail_1',
													nodeType: 'YulTypedName',
													src: '1442:6:12',
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
														src: '1486:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1497:2:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1479:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1479:21:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '1479:21:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1509:17:12',
											value: {
												name: 'tail_1',
												nodeType: 'YulIdentifier',
												src: '1520:6:12',
											},
											variables: [
												{
													name: 'pos',
													nodeType: 'YulTypedName',
													src: '1513:3:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1535:27:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '1555:6:12',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1549:5:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1549:13:12',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1539:6:12',
													type: '',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'tail_1',
														nodeType: 'YulIdentifier',
														src: '1578:6:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1586:6:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1571:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1571:22:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '1571:22:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1602:12:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1612:2:12',
												type: '',
												value: '64',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '1606:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1623:25:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1634:9:12',
													},
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1645:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1630:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1630:18:12',
											},
											variableNames: [
												{
													name: 'pos',
													nodeType: 'YulIdentifier',
													src: '1623:3:12',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1657:53:12',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '1679:9:12',
															},
															{
																arguments: [
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '1694:1:12',
																		type: '',
																		value: '5',
																	},
																	{
																		name: 'length',
																		nodeType: 'YulIdentifier',
																		src: '1697:6:12',
																	},
																],
																functionName: {
																	name: 'shl',
																	nodeType: 'YulIdentifier',
																	src: '1690:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '1690:14:12',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '1675:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '1675:30:12',
													},
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '1707:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1671:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1671:39:12',
											},
											variables: [
												{
													name: 'tail_2',
													nodeType: 'YulTypedName',
													src: '1661:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1719:29:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '1737:6:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1745:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1733:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1733:15:12',
											},
											variables: [
												{
													name: 'srcPtr',
													nodeType: 'YulTypedName',
													src: '1723:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1757:10:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1766:1:12',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '1761:1:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1825:497:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '1846:3:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'tail_2',
																					nodeType: 'YulIdentifier',
																					src: '1859:6:12',
																				},
																				{
																					name: 'headStart',
																					nodeType: 'YulIdentifier',
																					src: '1867:9:12',
																				},
																			],
																			functionName: {
																				name: 'sub',
																				nodeType: 'YulIdentifier',
																				src: '1855:3:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '1855:22:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1879:66:12',
																			type: '',
																			value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '1851:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '1851:95:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1839:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1839:108:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1839:108:12',
													},
													{
														nodeType: 'YulVariableDeclaration',
														src: '1960:23:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '1976:6:12',
																},
															],
															functionName: {
																name: 'mload',
																nodeType: 'YulIdentifier',
																src: '1970:5:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1970:13:12',
														},
														variables: [
															{
																name: '_3',
																nodeType: 'YulTypedName',
																src: '1964:2:12',
																type: '',
															},
														],
													},
													{
														expression: {
															arguments: [
																{
																	name: 'tail_2',
																	nodeType: 'YulIdentifier',
																	src: '2003:6:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: '_3',
																					nodeType: 'YulIdentifier',
																					src: '2021:2:12',
																				},
																			],
																			functionName: {
																				name: 'mload',
																				nodeType: 'YulIdentifier',
																				src: '2015:5:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '2015:9:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '2026:42:12',
																			type: '',
																			value: '0xffffffffffffffffffffffffffffffffffffffff',
																		},
																	],
																	functionName: {
																		name: 'and',
																		nodeType: 'YulIdentifier',
																		src: '2011:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2011:58:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1996:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1996:74:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1996:74:12',
													},
													{
														nodeType: 'YulVariableDeclaration',
														src: '2083:38:12',
														value: {
															arguments: [
																{
																	arguments: [
																		{
																			name: '_3',
																			nodeType: 'YulIdentifier',
																			src: '2113:2:12',
																		},
																		{
																			name: '_1',
																			nodeType: 'YulIdentifier',
																			src: '2117:2:12',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2109:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2109:11:12',
																},
															],
															functionName: {
																name: 'mload',
																nodeType: 'YulIdentifier',
																src: '2103:5:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2103:18:12',
														},
														variables: [
															{
																name: 'memberValue0',
																nodeType: 'YulTypedName',
																src: '2087:12:12',
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
																			name: 'tail_2',
																			nodeType: 'YulIdentifier',
																			src: '2145:6:12',
																		},
																		{
																			name: '_1',
																			nodeType: 'YulIdentifier',
																			src: '2153:2:12',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2141:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2141:15:12',
																},
																{
																	name: '_2',
																	nodeType: 'YulIdentifier',
																	src: '2158:2:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2134:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2134:27:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '2134:27:12',
													},
													{
														nodeType: 'YulAssignment',
														src: '2174:68:12',
														value: {
															arguments: [
																{
																	name: 'memberValue0',
																	nodeType: 'YulIdentifier',
																	src: '2212:12:12',
																},
																{
																	arguments: [
																		{
																			name: 'tail_2',
																			nodeType: 'YulIdentifier',
																			src: '2230:6:12',
																		},
																		{
																			name: '_2',
																			nodeType: 'YulIdentifier',
																			src: '2238:2:12',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2226:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2226:15:12',
																},
															],
															functionName: {
																name: 'abi_encode_array_bytes4_dyn',
																nodeType: 'YulIdentifier',
																src: '2184:27:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2184:58:12',
														},
														variableNames: [
															{
																name: 'tail_2',
																nodeType: 'YulIdentifier',
																src: '2174:6:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '2255:25:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '2269:6:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '2277:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2265:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2265:15:12',
														},
														variableNames: [
															{
																name: 'srcPtr',
																nodeType: 'YulIdentifier',
																src: '2255:6:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '2293:19:12',
														value: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '2304:3:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '2309:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2300:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2300:12:12',
														},
														variableNames: [
															{
																name: 'pos',
																nodeType: 'YulIdentifier',
																src: '2293:3:12',
															},
														],
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'i',
														nodeType: 'YulIdentifier',
														src: '1787:1:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1790:6:12',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '1784:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1784:13:12',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '1798:18:12',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '1800:14:12',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '1809:1:12',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1812:1:12',
																	type: '',
																	value: '1',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1805:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1805:9:12',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '1800:1:12',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '1780:3:12',
												statements: [],
											},
											src: '1776:546:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '2331:14:12',
											value: {
												name: 'tail_2',
												nodeType: 'YulIdentifier',
												src: '2339:6:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2331:4:12',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__to_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '1376:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1387:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1398:4:12',
										type: '',
									},
								],
								src: '1212:1139:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2426:239:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '2472:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2481:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2484:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2474:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2474:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '2474:12:12',
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
																src: '2447:7:12',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2456:9:12',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '2443:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '2443:23:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2468:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '2439:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2439:32:12',
											},
											nodeType: 'YulIf',
											src: '2436:52:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2497:36:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2523:9:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '2510:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2510:23:12',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '2501:5:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2619:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2628:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2631:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '2621:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2621:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '2621:12:12',
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
																src: '2555:5:12',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '2566:5:12',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '2573:42:12',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '2562:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '2562:54:12',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '2552:2:12',
														},
														nodeType: 'YulFunctionCall',
														src: '2552:65:12',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '2545:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2545:73:12',
											},
											nodeType: 'YulIf',
											src: '2542:93:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '2644:15:12',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '2654:5:12',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '2644:6:12',
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
										src: '2392:9:12',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2403:7:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2415:6:12',
										type: '',
									},
								],
								src: '2356:309:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2819:109:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2836:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2847:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2829:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2829:21:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '2829:21:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '2859:63:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2895:6:12',
													},
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2907:9:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '2918:2:12',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2903:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '2903:18:12',
													},
												],
												functionName: {
													name: 'abi_encode_array_bytes4_dyn',
													nodeType: 'YulIdentifier',
													src: '2867:27:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2867:55:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2859:4:12',
												},
											],
										},
									],
								},
								name: 'abi_encode_tuple_t_array$_t_bytes4_$dyn_memory_ptr__to_t_array$_t_bytes4_$dyn_memory_ptr__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '2788:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2799:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '2810:4:12',
										type: '',
									},
								],
								src: '2670:258:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3002:263:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '3048:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3057:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3060:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '3050:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '3050:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '3050:12:12',
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
																src: '3023:7:12',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3032:9:12',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '3019:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '3019:23:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3044:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '3015:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3015:32:12',
											},
											nodeType: 'YulIf',
											src: '3012:52:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3073:36:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3099:9:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '3086:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3086:23:12',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '3077:5:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '3219:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3228:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3231:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '3221:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '3221:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '3221:12:12',
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
																src: '3131:5:12',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '3142:5:12',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '3149:66:12',
																		type: '',
																		value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '3138:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '3138:78:12',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '3128:2:12',
														},
														nodeType: 'YulFunctionCall',
														src: '3128:89:12',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '3121:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3121:97:12',
											},
											nodeType: 'YulIf',
											src: '3118:117:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '3244:15:12',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '3254:5:12',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '3244:6:12',
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
										src: '2968:9:12',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2979:7:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2991:6:12',
										type: '',
									},
								],
								src: '2933:332:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3371:125:12',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '3381:26:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3393:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3404:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3389:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3389:18:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3381:4:12',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3423:9:12',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '3438:6:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3446:42:12',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '3434:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '3434:55:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3416:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3416:74:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3416:74:12',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '3340:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3351:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '3362:4:12',
										type: '',
									},
								],
								src: '3270:226:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3533:152:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3550:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3553:77:12',
														type: '',
														value: '35408467139433450592217433187231851964531694900788300625387963629091585785856',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3543:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3543:88:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3543:88:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3647:1:12',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3650:4:12',
														type: '',
														value: '0x41',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3640:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3640:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3640:15:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3671:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3674:4:12',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '3664:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3664:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3664:15:12',
										},
									],
								},
								name: 'panic_error_0x41',
								nodeType: 'YulFunctionDefinition',
								src: '3501:184:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3722:152:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3739:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3742:77:12',
														type: '',
														value: '35408467139433450592217433187231851964531694900788300625387963629091585785856',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3732:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3732:88:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3732:88:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3836:1:12',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3839:4:12',
														type: '',
														value: '0x32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3829:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3829:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3829:15:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3860:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3863:4:12',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '3853:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3853:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3853:15:12',
										},
									],
								},
								name: 'panic_error_0x32',
								nodeType: 'YulFunctionDefinition',
								src: '3690:184:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3926:302:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '4025:168:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4046:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4049:77:12',
																	type: '',
																	value:
																		'35408467139433450592217433187231851964531694900788300625387963629091585785856',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '4039:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '4039:88:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '4039:88:12',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4147:1:12',
																	type: '',
																	value: '4',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4150:4:12',
																	type: '',
																	value: '0x11',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '4140:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '4140:15:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '4140:15:12',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4175:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4178:4:12',
																	type: '',
																	value: '0x24',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '4168:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '4168:15:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '4168:15:12',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '3942:5:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3949:66:12',
														type: '',
														value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
													},
												],
												functionName: {
													name: 'eq',
													nodeType: 'YulIdentifier',
													src: '3939:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3939:77:12',
											},
											nodeType: 'YulIf',
											src: '3936:257:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '4202:20:12',
											value: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '4213:5:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4220:1:12',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '4209:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '4209:13:12',
											},
											variableNames: [
												{
													name: 'ret',
													nodeType: 'YulIdentifier',
													src: '4202:3:12',
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
										src: '3908:5:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'ret',
										nodeType: 'YulTypedName',
										src: '3918:3:12',
										type: '',
									},
								],
								src: '3879:349:12',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_encode_tuple_t_array$_t_address_$dyn_memory_ptr__to_t_array$_t_address_$dyn_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        let _1 := 32\n        let tail_1 := add(headStart, _1)\n        mstore(headStart, _1)\n        let pos := tail_1\n        let length := mload(value0)\n        mstore(tail_1, length)\n        pos := add(headStart, 64)\n        let srcPtr := add(value0, _1)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 1) }\n        {\n            mstore(pos, and(mload(srcPtr), 0xffffffffffffffffffffffffffffffffffffffff))\n            pos := add(pos, _1)\n            srcPtr := add(srcPtr, _1)\n        }\n        tail := pos\n    }\n    function abi_encode_array_bytes4_dyn(value, pos) -> end\n    {\n        let length := mload(value)\n        mstore(pos, length)\n        let _1 := 0x20\n        pos := add(pos, _1)\n        let srcPtr := add(value, _1)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 1) }\n        {\n            mstore(pos, and(mload(srcPtr), 0xffffffff00000000000000000000000000000000000000000000000000000000))\n            pos := add(pos, _1)\n            srcPtr := add(srcPtr, _1)\n        }\n        end := pos\n    }\n    function abi_encode_tuple_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__to_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        let _1 := 32\n        let tail_1 := add(headStart, _1)\n        mstore(headStart, _1)\n        let pos := tail_1\n        let length := mload(value0)\n        mstore(tail_1, length)\n        let _2 := 64\n        pos := add(headStart, _2)\n        let tail_2 := add(add(headStart, shl(5, length)), _2)\n        let srcPtr := add(value0, _1)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 1) }\n        {\n            mstore(pos, add(sub(tail_2, headStart), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0))\n            let _3 := mload(srcPtr)\n            mstore(tail_2, and(mload(_3), 0xffffffffffffffffffffffffffffffffffffffff))\n            let memberValue0 := mload(add(_3, _1))\n            mstore(add(tail_2, _1), _2)\n            tail_2 := abi_encode_array_bytes4_dyn(memberValue0, add(tail_2, _2))\n            srcPtr := add(srcPtr, _1)\n            pos := add(pos, _1)\n        }\n        tail := tail_2\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_array$_t_bytes4_$dyn_memory_ptr__to_t_array$_t_bytes4_$dyn_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        mstore(headStart, 32)\n        tail := abi_encode_array_bytes4_dyn(value0, add(headStart, 32))\n    }\n    function abi_decode_tuple_t_bytes4(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffff00000000000000000000000000000000000000000000000000000000))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function panic_error_0x41()\n    {\n        mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n        mstore(4, 0x41)\n        revert(0, 0x24)\n    }\n    function panic_error_0x32()\n    {\n        mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n        mstore(4, 0x32)\n        revert(0, 0x24)\n    }\n    function increment_t_uint256(value) -> ret\n    {\n        if eq(value, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)\n        {\n            mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n            mstore(4, 0x11)\n            revert(0, 0x24)\n        }\n        ret := add(value, 1)\n    }\n}',
					id: 12,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x4C JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x52EF6B2C EQ PUSH2 0x51 JUMPI DUP1 PUSH4 0x7A0ED627 EQ PUSH2 0x6F JUMPI DUP1 PUSH4 0xADFCA15E EQ PUSH2 0x84 JUMPI DUP1 PUSH4 0xCDFFACC6 EQ PUSH2 0xA4 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0x59 PUSH2 0x140 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0x66 SWAP2 SWAP1 PUSH2 0x4DE JUMP JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST PUSH2 0x77 PUSH2 0x1D2 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0x66 SWAP2 SWAP1 PUSH2 0x595 JUMP JUMPDEST PUSH2 0x97 PUSH2 0x92 CALLDATASIZE PUSH1 0x4 PUSH2 0x63D JUMP JUMPDEST PUSH2 0x3DE JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0x66 SWAP2 SWAP1 PUSH2 0x67A JUMP JUMPDEST PUSH2 0x11B PUSH2 0xB2 CALLDATASIZE PUSH1 0x4 PUSH2 0x68D JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x20 MSTORE PUSH1 0x40 SWAP1 KECCAK256 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0x66 JUMP JUMPDEST PUSH1 0x60 PUSH1 0x0 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x2 DUP2 ADD DUP1 SLOAD PUSH1 0x40 DUP1 MLOAD PUSH1 0x20 DUP1 DUP5 MUL DUP3 ADD DUP2 ADD SWAP1 SWAP3 MSTORE DUP3 DUP2 MSTORE SWAP4 SWAP5 POP DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x1C7 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 JUMPDEST DUP2 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 MSTORE PUSH1 0x1 SWAP1 SWAP2 ADD SWAP1 PUSH1 0x20 ADD DUP1 DUP4 GT PUSH2 0x19C JUMPI JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP1 JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131E SLOAD PUSH1 0x60 SWAP1 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP1 DUP1 PUSH8 0xFFFFFFFFFFFFFFFF DUP2 GT ISZERO PUSH2 0x232 JUMPI PUSH2 0x232 PUSH2 0x6CF JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 DUP1 DUP3 MSTORE DUP1 PUSH1 0x20 MUL PUSH1 0x20 ADD DUP3 ADD PUSH1 0x40 MSTORE DUP1 ISZERO PUSH2 0x278 JUMPI DUP2 PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 DUP1 MLOAD DUP1 DUP3 ADD SWAP1 SWAP2 MSTORE PUSH1 0x0 DUP2 MSTORE PUSH1 0x60 PUSH1 0x20 DUP3 ADD MSTORE DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x1 SWAP1 SUB SWAP1 DUP2 PUSH2 0x250 JUMPI SWAP1 POP JUMPDEST POP SWAP3 POP PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x3D8 JUMPI PUSH1 0x0 DUP4 PUSH1 0x2 ADD DUP3 DUP2 SLOAD DUP2 LT PUSH2 0x29D JUMPI PUSH2 0x29D PUSH2 0x6FE JUMP JUMPDEST SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 ADD PUSH1 0x0 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 POP DUP1 DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x2DD JUMPI PUSH2 0x2DD PUSH2 0x6FE JUMP JUMPDEST PUSH1 0x20 SWAP1 DUP2 MUL SWAP2 SWAP1 SWAP2 ADD DUP2 ADD MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP3 DUP4 AND SWAP1 MSTORE SWAP1 DUP3 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH1 0x1 DUP7 ADD DUP3 MSTORE PUSH1 0x40 SWAP1 DUP2 SWAP1 KECCAK256 DUP1 SLOAD DUP3 MLOAD DUP2 DUP6 MUL DUP2 ADD DUP6 ADD SWAP1 SWAP4 MSTORE DUP1 DUP4 MSTORE SWAP2 SWAP3 SWAP1 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x39E JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x34B JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x3B5 JUMPI PUSH2 0x3B5 PUSH2 0x6FE JUMP JUMPDEST PUSH1 0x20 MUL PUSH1 0x20 ADD ADD MLOAD PUSH1 0x20 ADD DUP2 SWAP1 MSTORE POP POP DUP1 DUP1 PUSH2 0x3D0 SWAP1 PUSH2 0x72D JUMP JUMPDEST SWAP2 POP POP PUSH2 0x27E JUMP JUMPDEST POP POP POP SWAP1 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131D PUSH1 0x20 SWAP1 DUP2 MSTORE PUSH1 0x40 SWAP2 DUP3 SWAP1 KECCAK256 DUP1 SLOAD DUP4 MLOAD DUP2 DUP5 MUL DUP2 ADD DUP5 ADD SWAP1 SWAP5 MSTORE DUP1 DUP5 MSTORE PUSH1 0x60 SWAP4 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP4 SWAP1 SWAP3 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x4D1 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x47E JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x20 DUP1 DUP3 MSTORE DUP3 MLOAD DUP3 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x0 SWAP2 SWAP1 DUP5 DUP3 ADD SWAP1 PUSH1 0x40 DUP6 ADD SWAP1 DUP5 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x52C JUMPI DUP4 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 MSTORE SWAP3 DUP5 ADD SWAP3 SWAP2 DUP5 ADD SWAP2 PUSH1 0x1 ADD PUSH2 0x4FA JUMP JUMPDEST POP SWAP1 SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD DUP1 DUP5 MSTORE PUSH1 0x20 DUP1 DUP6 ADD SWAP5 POP DUP1 DUP5 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x58A JUMPI DUP2 MLOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP8 MSTORE SWAP6 DUP3 ADD SWAP6 SWAP1 DUP3 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x54C JUMP JUMPDEST POP SWAP5 SWAP6 SWAP5 POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP1 DUP4 ADD DUP2 DUP5 MSTORE DUP1 DUP6 MLOAD DUP1 DUP4 MSTORE PUSH1 0x40 SWAP3 POP DUP3 DUP7 ADD SWAP2 POP DUP3 DUP2 PUSH1 0x5 SHL DUP8 ADD ADD DUP5 DUP9 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x62F JUMPI DUP9 DUP4 SUB PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC0 ADD DUP6 MSTORE DUP2 MLOAD DUP1 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP5 MSTORE DUP8 ADD MLOAD DUP8 DUP5 ADD DUP8 SWAP1 MSTORE PUSH2 0x61C DUP8 DUP6 ADD DUP3 PUSH2 0x538 JUMP JUMPDEST SWAP6 DUP9 ADD SWAP6 SWAP4 POP POP SWAP1 DUP7 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x5BC JUMP JUMPDEST POP SWAP1 SWAP9 SWAP8 POP POP POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x64F JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x673 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 PUSH2 0x673 PUSH1 0x20 DUP4 ADD DUP5 PUSH2 0x538 JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x69F JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x673 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x32 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 EQ ISZERO PUSH2 0x786 JUMPI PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP PUSH1 0x1 ADD SWAP1 JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xCB SWAP9 PUSH1 0x91 0xE3 PUSH13 0x99B33615A659F908BBDF81CDC1 PUSH17 0xB39858195B82D45B2E733A5E64736F6C63 NUMBER STOP ADDMOD EXP STOP CALLER ',
			sourceMap:
				'481:2239:4:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1995:220;;;:::i;:::-;;;;;;;:::i;:::-;;;;;;;;924:523;;;:::i;:::-;;;;;;;:::i;1603:291::-;;;;;;:::i;:::-;;:::i;:::-;;;;;;;:::i;2445:273::-;;;;;;:::i;:::-;2650:48;;2525:21;2650:48;;;492:45:11;2650:48:4;;;;;:61;;;;2445:273;;;;3446:42:12;3434:55;;;3416:74;;3404:2;3389:18;2445:273:4;3270:226:12;1995:220:4;2053:32;2097:36;492:45:11;2191:17:4;;;2173:35;;;;;;;;;;;;;;;;;;;2097:66;;-1:-1:-1;2173:35:4;;2191:17;2173:35;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2087:128;1995:220;:::o;924:523::-;1104:17;:24;974:22;;492:45:11;;1104:24:4;1148:22;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;;;;;;;;;;;;;;;;1148:22:4;;;;;;;;;;;;;;;;1138:32;;1185:9;1180:261;1200:9;1196:1;:13;1180:261;;;1230:21;1254:2;:17;;1272:1;1254:20;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;1230:44;;1314:13;1288:7;1296:1;1288:10;;;;;;;;:::i;:::-;;;;;;;;;;;;:39;;;;;;1372:40;;;1288:23;1372:40;;;:25;;;:40;;;;;;;1341:89;;;;;;;;;;;;;;;;;;;1372:40;;1341:89;;;1372:40;1341:89;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:7;1349:1;1341:10;;;;;;;;:::i;:::-;;;;;;;:28;;:89;;;;1216:225;1211:3;;;;;:::i;:::-;;;;1180:261;;;;998:449;;924:523;:::o;1603:291::-;1836:33;;;1734:36;1836:33;;;:25;:33;;;;;;;;;1810:77;;;;;;;;;;;;;;;;;1683:39;;492:45:11;;1810:77:4;;1836:33;1810:77;;;1836:33;1810:77;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1724:170;1603:291;;;:::o;14:681:12:-;185:2;237:21;;;307:13;;210:18;;;329:22;;;156:4;;185:2;408:15;;;;382:2;367:18;;;156:4;451:218;465:6;462:1;459:13;451:218;;;530:13;;545:42;526:62;514:75;;644:15;;;;609:12;;;;487:1;480:9;451:218;;;-1:-1:-1;686:3:12;;14:681;-1:-1:-1;;;;;;14:681:12:o;700:507::-;752:3;790:5;784:12;817:6;812:3;805:19;843:4;872:2;867:3;863:12;856:19;;909:2;902:5;898:14;930:1;940:242;954:6;951:1;948:13;940:242;;;1019:13;;1034:66;1015:86;1003:99;;1122:12;;;;1157:15;;;;976:1;969:9;940:242;;;-1:-1:-1;1198:3:12;;700:507;-1:-1:-1;;;;;700:507:12:o;1212:1139::-;1398:4;1427:2;1467;1456:9;1452:18;1497:2;1486:9;1479:21;1520:6;1555;1549:13;1586:6;1578;1571:22;1612:2;1602:12;;1645:2;1634:9;1630:18;1623:25;;1707:2;1697:6;1694:1;1690:14;1679:9;1675:30;1671:39;1745:2;1737:6;1733:15;1766:1;1776:546;1790:6;1787:1;1784:13;1776:546;;;1855:22;;;1879:66;1851:95;1839:108;;1970:13;;2015:9;;2026:42;2011:58;1996:74;;2109:11;;2103:18;2141:15;;;2134:27;;;2184:58;2226:15;;;2103:18;2184:58;:::i;:::-;2300:12;;;;2174:68;-1:-1:-1;;2265:15:12;;;;1812:1;1805:9;1776:546;;;-1:-1:-1;2339:6:12;;1212:1139;-1:-1:-1;;;;;;;;1212:1139:12:o;2356:309::-;2415:6;2468:2;2456:9;2447:7;2443:23;2439:32;2436:52;;;2484:1;2481;2474:12;2436:52;2523:9;2510:23;2573:42;2566:5;2562:54;2555:5;2552:65;2542:93;;2631:1;2628;2621:12;2542:93;2654:5;2356:309;-1:-1:-1;;;2356:309:12:o;2670:258::-;2847:2;2836:9;2829:21;2810:4;2867:55;2918:2;2907:9;2903:18;2895:6;2867:55;:::i;2933:332::-;2991:6;3044:2;3032:9;3023:7;3019:23;3015:32;3012:52;;;3060:1;3057;3050:12;3012:52;3099:9;3086:23;3149:66;3142:5;3138:78;3131:5;3128:89;3118:117;;3231:1;3228;3221:12;3501:184;3553:77;3550:1;3543:88;3650:4;3647:1;3640:15;3674:4;3671:1;3664:15;3690:184;3742:77;3739:1;3732:88;3839:4;3836:1;3829:15;3863:4;3860:1;3853:15;3879:349;3918:3;3949:66;3942:5;3939:77;3936:257;;;4049:77;4046:1;4039:88;4150:4;4147:1;4140:15;4178:4;4175:1;4168:15;3936:257;-1:-1:-1;4220:1:12;4209:13;;3879:349::o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '397400',
				executionCost: '436',
				totalCost: '397836',
			},
			external: {
				'facetAddress(bytes4)': '2537',
				'facetAddresses()': 'infinite',
				'facetFunctionSelectors(address)': 'infinite',
				'facets()': 'infinite',
			},
		},
		methodIdentifiers: {
			'facetAddress(bytes4)': 'cdffacc6',
			'facetAddresses()': '52ef6b2c',
			'facetFunctionSelectors(address)': 'adfca15e',
			'facets()': '7a0ed627',
		},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"bytes4","name":"_functionSelector","type":"bytes4"}],"name":"facetAddress","outputs":[{"internalType":"address","name":"facetAddress_","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"facetAddresses","outputs":[{"internalType":"address[]","name":"facetAddresses_","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_facet","type":"address"}],"name":"facetFunctionSelectors","outputs":[{"internalType":"bytes4[]","name":"facetFunctionSelectors_","type":"bytes4[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"facets","outputs":[{"components":[{"internalType":"address","name":"facetAddress","type":"address"},{"internalType":"bytes4[]","name":"functionSelectors","type":"bytes4[]"}],"internalType":"struct IDiamondLoupe.Facet[]","name":"facets_","type":"tuple[]"}],"stateMutability":"view","type":"function"}],"devdoc":{"kind":"dev","methods":{"facetAddress(bytes4)":{"details":"If facet is not found return address(0).","params":{"_functionSelector":"The function selector."},"returns":{"facetAddress_":"The facet address."}},"facetAddresses()":{"returns":{"facetAddresses_":"facetAddresses_"}},"facetFunctionSelectors(address)":{"params":{"_facet":"The facet address."},"returns":{"facetFunctionSelectors_":"facetFunctionSelectors_"}},"facets()":{"returns":{"facets_":"Facet"}}},"version":1},"userdoc":{"kind":"user","methods":{"facetAddress(bytes4)":{"notice":"Gets the facet that supports the given selector."},"facetAddresses()":{"notice":"Get all the facet addresses used by a diamond."},"facetFunctionSelectors(address)":{"notice":"Gets all the function selectors provided by a facet."},"facets()":{"notice":"Gets all facets and their selectors."}},"version":1}},"settings":{"compilationTarget":{"solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol":"DiamondLoupeFacetWithoutSupportsInterface"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IDiamondLoupe} from \\"../interfaces/IDiamondLoupe.sol\\";\\n\\ncontract DiamondLoupeFacetWithoutSupportsInterface is IDiamondLoupe {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external view override returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view override returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view override returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n}\\n","keccak256":"0x5332a757bc4ad695e81685f1e838a7c7b2127e7aae8c510546126393be4036aa","license":"MIT"},"solc_0.8/diamond/interfaces/IDiamondCut.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\ninterface IDiamondCut {\\n    enum FacetCutAction {Add, Replace, Remove}\\n    // Add=0, Replace=1, Remove=2\\n\\n    struct FacetCut {\\n        address facetAddress;\\n        FacetCutAction action;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external;\\n\\n    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);\\n}\\n","keccak256":"0xc00c16bfa30a3fa5f3dc684f7f8ba62c259962b25f647d9588739458989717fc","license":"MIT"},"solc_0.8/diamond/interfaces/IDiamondLoupe.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\n// A loupe is a small magnifying glass used to look at diamonds.\\n// These functions look at diamonds\\ninterface IDiamondLoupe {\\n    /// These functions are expected to be called frequently\\n    /// by tools.\\n\\n    struct Facet {\\n        address facetAddress;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Gets all facet addresses and their four byte function selectors.\\n    /// @return facets_ Facet\\n    function facets() external view returns (Facet[] memory facets_);\\n\\n    /// @notice Gets all the function selectors supported by a specific facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory facetFunctionSelectors_);\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view returns (address[] memory facetAddresses_);\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_);\\n}\\n","keccak256":"0x10884024af2c0f7deca0fac4ddf84e76da5dba35b6e02fabeac8ea54c1a5c6f7","license":"MIT"},"solc_0.8/diamond/libraries/LibDiamond.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\n\\nlibrary LibDiamond {\\n    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256(\\"diamond.standard.diamond.storage\\");\\n\\n    struct FacetAddressAndPosition {\\n        address facetAddress;\\n        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array\\n    }\\n\\n    struct FacetFunctionSelectors {\\n        bytes4[] functionSelectors;\\n        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array\\n    }\\n\\n    struct DiamondStorage {\\n        // maps function selector to the facet address and\\n        // the position of the selector in the facetFunctionSelectors.selectors array\\n        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;\\n        // maps facet addresses to function selectors\\n        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;\\n        // facet addresses\\n        address[] facetAddresses;\\n        // Used to query if a contract implements an interface.\\n        // Used to implement ERC-165.\\n        mapping(bytes4 => bool) supportedInterfaces;\\n        // owner of the contract\\n        address contractOwner;\\n    }\\n\\n    function diamondStorage() internal pure returns (DiamondStorage storage ds) {\\n        bytes32 position = DIAMOND_STORAGE_POSITION;\\n        assembly {\\n            ds.slot := position\\n        }\\n    }\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    function setContractOwner(address _newOwner) internal {\\n        DiamondStorage storage ds = diamondStorage();\\n        address previousOwner = ds.contractOwner;\\n        ds.contractOwner = _newOwner;\\n        emit OwnershipTransferred(previousOwner, _newOwner);\\n    }\\n\\n    function contractOwner() internal view returns (address contractOwner_) {\\n        contractOwner_ = diamondStorage().contractOwner;\\n    }\\n\\n    function enforceIsContractOwner() internal view {\\n        require(msg.sender == diamondStorage().contractOwner, \\"LibDiamond: Must be contract owner\\");\\n    }\\n\\n    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);\\n\\n    // Internal function version of diamondCut\\n    function diamondCut(\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        address _init,\\n        bytes memory _calldata\\n    ) internal {\\n        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {\\n            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;\\n            if (action == IDiamondCut.FacetCutAction.Add) {\\n                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Replace) {\\n                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Remove) {\\n                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else {\\n                revert(\\"LibDiamondCut: Incorrect FacetCutAction\\");\\n            }\\n        }\\n        emit DiamondCut(_diamondCut, _init, _calldata);\\n        initializeDiamondCut(_init, _calldata);\\n    }\\n\\n    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);            \\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress == address(0), \\"LibDiamondCut: Can\'t add function that already exists\\");\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);\\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress != _facetAddress, \\"LibDiamondCut: Can\'t replace function with same function\\");\\n            removeFunction(ds, oldFacetAddress, selector);\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        // if function does not exist then do nothing and return\\n        require(_facetAddress == address(0), \\"LibDiamondCut: Remove facet address must be address(0)\\");\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            removeFunction(ds, oldFacetAddress, selector);\\n        }\\n    }\\n\\n    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {\\n        enforceHasContractCode(_facetAddress, \\"LibDiamondCut: New facet has no code\\");\\n        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;\\n        ds.facetAddresses.push(_facetAddress);\\n    }    \\n\\n\\n    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {\\n        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);\\n        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;\\n    }\\n\\n    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Can\'t remove function that doesn\'t exist\\");\\n        // an immutable function is a function defined directly in a diamond\\n        require(_facetAddress != address(this), \\"LibDiamondCut: Can\'t remove immutable function\\");\\n        // replace selector with last selector, then delete last selector\\n        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;\\n        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;\\n        // if not the same then replace _selector with lastSelector\\n        if (selectorPosition != lastSelectorPosition) {\\n            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];\\n            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;\\n            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);\\n        }\\n        // delete the last selector\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();\\n        delete ds.selectorToFacetAndPosition[_selector];\\n\\n        // if no more selectors for facet address then delete the facet address\\n        if (lastSelectorPosition == 0) {\\n            // replace facet address with last facet address and delete last facet address\\n            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;\\n            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n            if (facetAddressPosition != lastFacetAddressPosition) {\\n                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];\\n                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;\\n                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;\\n            }\\n            ds.facetAddresses.pop();\\n            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n        }\\n    }\\n\\n    function initializeDiamondCut(address _init, bytes memory _calldata) internal {\\n        if (_init == address(0)) {\\n            require(_calldata.length == 0, \\"LibDiamondCut: _init is address(0) but_calldata is not empty\\");\\n        } else {\\n            require(_calldata.length > 0, \\"LibDiamondCut: _calldata is empty but _init is not address(0)\\");\\n            if (_init != address(this)) {\\n                enforceHasContractCode(_init, \\"LibDiamondCut: _init address has no code\\");\\n            }\\n            (bool success, bytes memory error) = _init.delegatecall(_calldata);\\n            if (!success) {\\n                if (error.length > 0) {\\n                    // bubble up the error\\n                    revert(string(error));\\n                } else {\\n                    revert(\\"LibDiamondCut: _init function reverted\\");\\n                }\\n            }\\n        }\\n    }\\n\\n    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {\\n        uint256 contractSize;\\n        assembly {\\n            contractSize := extcodesize(_contract)\\n        }\\n        require(contractSize > 0, _errorMessage);\\n    }\\n}\\n","keccak256":"0x2205345e83eb86f5281f159a9215a096cb6d404782619f9b8e9d7a4a46c32a37","license":"MIT"}},"version":1}',
	storageLayout: {
		storage: [],
		types: null,
	},
	userdoc: {
		kind: 'user',
		methods: {
			'facetAddress(bytes4)': {
				notice: 'Gets the facet that supports the given selector.',
			},
			'facetAddresses()': {
				notice: 'Get all the facet addresses used by a diamond.',
			},
			'facetFunctionSelectors(address)': {
				notice: 'Gets all the function selectors provided by a facet.',
			},
			'facets()': {
				notice: 'Gets all facets and their selectors.',
			},
		},
		version: 1,
	},
	solcInput:
		'{\n  "language": "Solidity",\n  "sources": {\n    "solc_0.8/diamond/Diamond.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n*\\n* Implementation of a diamond.\\n/******************************************************************************/\\n\\nimport {LibDiamond} from \\"./libraries/LibDiamond.sol\\";\\nimport {IDiamondCut} from \\"./interfaces/IDiamondCut.sol\\";\\n\\ncontract Diamond {\\n    struct Initialization {\\n        address initContract;\\n        bytes initData;\\n    }\\n\\n    /// @notice This construct a diamond contract\\n    /// @param _contractOwner the owner of the contract. With default DiamondCutFacet, this is the sole address allowed to make further cuts.\\n    /// @param _diamondCut the list of facet to add\\n    /// @param _initializations the list of initialization pair to execute. This allow to setup a contract with multiple level of independent initialization.\\n    constructor(\\n        address _contractOwner,\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        Initialization[] memory _initializations\\n    ) payable {\\n        if (_contractOwner != address(0)) {\\n            LibDiamond.setContractOwner(_contractOwner);\\n        }\\n\\n        LibDiamond.diamondCut(_diamondCut, address(0), \\"\\");\\n\\n        for (uint256 i = 0; i < _initializations.length; i++) {\\n            LibDiamond.initializeDiamondCut(_initializations[i].initContract, _initializations[i].initData);\\n        }\\n    }\\n\\n    // Find facet for function that is called and execute the\\n    // function if a facet is found and return any value.\\n    fallback() external payable {\\n        LibDiamond.DiamondStorage storage ds;\\n        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;\\n        // get diamond storage\\n        assembly {\\n            ds.slot := position\\n        }\\n        // get facet from function selector\\n        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;\\n        require(facet != address(0), \\"Diamond: Function does not exist\\");\\n        // Execute external function from facet using delegatecall and return any value.\\n        assembly {\\n            // copy function selector and any arguments\\n            calldatacopy(0, 0, calldatasize())\\n            // execute function call using the facet\\n            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)\\n            // get any return value\\n            returndatacopy(0, 0, returndatasize())\\n            // return any return value or error back to the caller\\n            switch result\\n            case 0 {\\n                revert(0, returndatasize())\\n            }\\n            default {\\n                return(0, returndatasize())\\n            }\\n        }\\n    }\\n\\n    receive() external payable {}\\n}\\n"\n    },\n    "solc_0.8/diamond/libraries/LibDiamond.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\n\\nlibrary LibDiamond {\\n    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256(\\"diamond.standard.diamond.storage\\");\\n\\n    struct FacetAddressAndPosition {\\n        address facetAddress;\\n        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array\\n    }\\n\\n    struct FacetFunctionSelectors {\\n        bytes4[] functionSelectors;\\n        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array\\n    }\\n\\n    struct DiamondStorage {\\n        // maps function selector to the facet address and\\n        // the position of the selector in the facetFunctionSelectors.selectors array\\n        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;\\n        // maps facet addresses to function selectors\\n        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;\\n        // facet addresses\\n        address[] facetAddresses;\\n        // Used to query if a contract implements an interface.\\n        // Used to implement ERC-165.\\n        mapping(bytes4 => bool) supportedInterfaces;\\n        // owner of the contract\\n        address contractOwner;\\n    }\\n\\n    function diamondStorage() internal pure returns (DiamondStorage storage ds) {\\n        bytes32 position = DIAMOND_STORAGE_POSITION;\\n        assembly {\\n            ds.slot := position\\n        }\\n    }\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    function setContractOwner(address _newOwner) internal {\\n        DiamondStorage storage ds = diamondStorage();\\n        address previousOwner = ds.contractOwner;\\n        ds.contractOwner = _newOwner;\\n        emit OwnershipTransferred(previousOwner, _newOwner);\\n    }\\n\\n    function contractOwner() internal view returns (address contractOwner_) {\\n        contractOwner_ = diamondStorage().contractOwner;\\n    }\\n\\n    function enforceIsContractOwner() internal view {\\n        require(msg.sender == diamondStorage().contractOwner, \\"LibDiamond: Must be contract owner\\");\\n    }\\n\\n    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);\\n\\n    // Internal function version of diamondCut\\n    function diamondCut(\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        address _init,\\n        bytes memory _calldata\\n    ) internal {\\n        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {\\n            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;\\n            if (action == IDiamondCut.FacetCutAction.Add) {\\n                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Replace) {\\n                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Remove) {\\n                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else {\\n                revert(\\"LibDiamondCut: Incorrect FacetCutAction\\");\\n            }\\n        }\\n        emit DiamondCut(_diamondCut, _init, _calldata);\\n        initializeDiamondCut(_init, _calldata);\\n    }\\n\\n    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);            \\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress == address(0), \\"LibDiamondCut: Can\'t add function that already exists\\");\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);\\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress != _facetAddress, \\"LibDiamondCut: Can\'t replace function with same function\\");\\n            removeFunction(ds, oldFacetAddress, selector);\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        // if function does not exist then do nothing and return\\n        require(_facetAddress == address(0), \\"LibDiamondCut: Remove facet address must be address(0)\\");\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            removeFunction(ds, oldFacetAddress, selector);\\n        }\\n    }\\n\\n    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {\\n        enforceHasContractCode(_facetAddress, \\"LibDiamondCut: New facet has no code\\");\\n        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;\\n        ds.facetAddresses.push(_facetAddress);\\n    }    \\n\\n\\n    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {\\n        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);\\n        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;\\n    }\\n\\n    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Can\'t remove function that doesn\'t exist\\");\\n        // an immutable function is a function defined directly in a diamond\\n        require(_facetAddress != address(this), \\"LibDiamondCut: Can\'t remove immutable function\\");\\n        // replace selector with last selector, then delete last selector\\n        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;\\n        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;\\n        // if not the same then replace _selector with lastSelector\\n        if (selectorPosition != lastSelectorPosition) {\\n            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];\\n            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;\\n            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);\\n        }\\n        // delete the last selector\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();\\n        delete ds.selectorToFacetAndPosition[_selector];\\n\\n        // if no more selectors for facet address then delete the facet address\\n        if (lastSelectorPosition == 0) {\\n            // replace facet address with last facet address and delete last facet address\\n            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;\\n            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n            if (facetAddressPosition != lastFacetAddressPosition) {\\n                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];\\n                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;\\n                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;\\n            }\\n            ds.facetAddresses.pop();\\n            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n        }\\n    }\\n\\n    function initializeDiamondCut(address _init, bytes memory _calldata) internal {\\n        if (_init == address(0)) {\\n            require(_calldata.length == 0, \\"LibDiamondCut: _init is address(0) but_calldata is not empty\\");\\n        } else {\\n            require(_calldata.length > 0, \\"LibDiamondCut: _calldata is empty but _init is not address(0)\\");\\n            if (_init != address(this)) {\\n                enforceHasContractCode(_init, \\"LibDiamondCut: _init address has no code\\");\\n            }\\n            (bool success, bytes memory error) = _init.delegatecall(_calldata);\\n            if (!success) {\\n                if (error.length > 0) {\\n                    // bubble up the error\\n                    revert(string(error));\\n                } else {\\n                    revert(\\"LibDiamondCut: _init function reverted\\");\\n                }\\n            }\\n        }\\n    }\\n\\n    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {\\n        uint256 contractSize;\\n        assembly {\\n            contractSize := extcodesize(_contract)\\n        }\\n        require(contractSize > 0, _errorMessage);\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IDiamondCut.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\ninterface IDiamondCut {\\n    enum FacetCutAction {Add, Replace, Remove}\\n    // Add=0, Replace=1, Remove=2\\n\\n    struct FacetCut {\\n        address facetAddress;\\n        FacetCutAction action;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external;\\n\\n    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondCutFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\nimport { LibDiamond } from \\"../libraries/LibDiamond.sol\\";\\n\\ncontract DiamondCutFacet is IDiamondCut {\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external override {\\n        LibDiamond.enforceIsContractOwner();\\n        LibDiamond.diamondCut(_diamondCut, _init, _calldata);\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/UsingDiamondOwner.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport \\"./libraries/LibDiamond.sol\\";\\n\\ncontract UsingDiamondOwner {\\n    modifier onlyOwner() {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        require(msg.sender == ds.contractOwner, \\"Only owner is allowed to perform this action\\");\\n        _;\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/initializers/DiamondERC165Init.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IERC165} from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondERC165Init {\\n    /// @notice set or unset ERC165 using DiamondStorage.supportedInterfaces\\n    /// @param interfaceIds list of interface id to set as supported\\n    /// @param interfaceIdsToRemove list of interface id to unset as supported.\\n    /// Technically, you can remove support of ERC165 by having the IERC165 id itself being part of that array.\\n    function setERC165(bytes4[] calldata interfaceIds, bytes4[] calldata interfaceIdsToRemove) external {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n\\n        ds.supportedInterfaces[type(IERC165).interfaceId] = true;\\n\\n        for (uint256 i = 0; i < interfaceIds.length; i++) {\\n            ds.supportedInterfaces[interfaceIds[i]] = true;\\n        }\\n\\n        for (uint256 i = 0; i < interfaceIdsToRemove.length; i++) {\\n            ds.supportedInterfaces[interfaceIdsToRemove[i]] = false;\\n        }\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IERC165.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\ninterface IERC165 {\\n    /// @notice Query if a contract implements an interface\\n    /// @param interfaceId The interface identifier, as specified in ERC-165\\n    /// @dev Interface identification is specified in ERC-165. This function\\n    ///  uses less than 30,000 gas.\\n    /// @return `true` if the contract implements `interfaceID` and\\n    ///  `interfaceID` is not 0xffffffff, `false` otherwise\\n    function supportsInterface(bytes4 interfaceId) external view returns (bool);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondLoupeFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport { LibDiamond } from  \\"../libraries/LibDiamond.sol\\";\\nimport { IDiamondLoupe } from \\"../interfaces/IDiamondLoupe.sol\\";\\nimport { IERC165 } from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondLoupeFacet is IDiamondLoupe, IERC165 {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external override view returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external override view returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external override view returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external override view returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n\\n    // This implements ERC-165.\\n    function supportsInterface(bytes4 _interfaceId) external override view returns (bool) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        return ds.supportedInterfaces[_interfaceId];\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IDiamondLoupe.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\n// A loupe is a small magnifying glass used to look at diamonds.\\n// These functions look at diamonds\\ninterface IDiamondLoupe {\\n    /// These functions are expected to be called frequently\\n    /// by tools.\\n\\n    struct Facet {\\n        address facetAddress;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Gets all facet addresses and their four byte function selectors.\\n    /// @return facets_ Facet\\n    function facets() external view returns (Facet[] memory facets_);\\n\\n    /// @notice Gets all the function selectors supported by a specific facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory facetFunctionSelectors_);\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view returns (address[] memory facetAddresses_);\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_);\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport {LibDiamond} from \\"../libraries/LibDiamond.sol\\";\\nimport {IDiamondLoupe} from \\"../interfaces/IDiamondLoupe.sol\\";\\n\\ncontract DiamondLoupeFacetWithoutSupportsInterface is IDiamondLoupe {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external view override returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view override returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view override returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/facets/OwnershipFacet.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\nimport { LibDiamond } from \\"../libraries/LibDiamond.sol\\";\\nimport { IERC173 } from \\"../interfaces/IERC173.sol\\";\\n\\ncontract OwnershipFacet is IERC173 {\\n    function transferOwnership(address _newOwner) external override {\\n        LibDiamond.enforceIsContractOwner();\\n        LibDiamond.setContractOwner(_newOwner);\\n    }\\n\\n    function owner() external override view returns (address owner_) {\\n        owner_ = LibDiamond.contractOwner();\\n    }\\n}\\n"\n    },\n    "solc_0.8/diamond/interfaces/IERC173.sol": {\n      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/// @title ERC-173 Contract Ownership Standard\\n///  Note: the ERC-165 identifier for this interface is 0x7f5828d0\\n/* is ERC165 */\\ninterface IERC173 {\\n    /// @dev This emits when ownership of a contract changes.\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    /// @notice Get the address of the owner\\n    /// @return owner_ The address of the owner.\\n    function owner() external view returns (address owner_);\\n\\n    /// @notice Set the address of the new owner of the contract\\n    /// @dev Set _newOwner to address(0) to renounce any ownership.\\n    /// @param _newOwner The address of the new owner of the contract\\n    function transferOwnership(address _newOwner) external;\\n}\\n"\n    }\n  },\n  "settings": {\n    "optimizer": {\n      "enabled": true,\n      "runs": 999999\n    },\n    "outputSelection": {\n      "*": {\n        "*": [\n          "abi",\n          "evm.bytecode",\n          "evm.deployedBytecode",\n          "evm.methodIdentifiers",\n          "metadata",\n          "devdoc",\n          "userdoc",\n          "storageLayout",\n          "evm.gasEstimates"\n        ],\n        "": [\n          "ast"\n        ]\n      }\n    },\n    "metadata": {\n      "useLiteralContent": true\n    }\n  }\n}',
	solcInputHash: '3fe12e823553336a8d0f950a5a792ac9',
} as const;
