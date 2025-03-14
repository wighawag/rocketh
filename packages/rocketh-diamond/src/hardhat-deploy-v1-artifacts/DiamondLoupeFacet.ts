export default {
	contractName: 'DiamondLoupeFacet',
	sourceName: 'solc_0.8/diamond/facets/DiamondLoupeFacet.sol',
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
		{
			inputs: [
				{
					internalType: 'bytes4',
					name: '_interfaceId',
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
	],
	bytecode:
		'0x608060405234801561001057600080fd5b5061084e806100206000396000f3fe608060405234801561001057600080fd5b50600436106100675760003560e01c80637a0ed627116100505780637a0ed627146100fa578063adfca15e1461010f578063cdffacc61461012f57600080fd5b806301ffc9a71461006c57806352ef6b2c146100e5575b600080fd5b6100d061007a366004610569565b7fffffffff000000000000000000000000000000000000000000000000000000001660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131f602052604090205460ff1690565b60405190151581526020015b60405180910390f35b6100ed6101cb565b6040516100dc91906105b2565b61010261025d565b6040516100dc9190610669565b61012261011d366004610711565b610469565b6040516100dc9190610747565b6101a661013d366004610569565b7fffffffff000000000000000000000000000000000000000000000000000000001660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c602052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020016100dc565b606060007fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c6002810180546040805160208084028201810190925282815293945083018282801561025257602002820191906000526020600020905b815473ffffffffffffffffffffffffffffffffffffffff168152600190910190602001808311610227575b505050505091505090565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131e546060907fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c908067ffffffffffffffff8111156102bd576102bd61075a565b60405190808252806020026020018201604052801561030357816020015b6040805180820190915260008152606060208201528152602001906001900390816102db5790505b50925060005b8181101561046357600083600201828154811061032857610328610789565b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508085838151811061036857610368610789565b60209081029190910181015173ffffffffffffffffffffffffffffffffffffffff928316905290821660009081526001860182526040908190208054825181850281018501909352808352919290919083018282801561042957602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190600401906020826003010492830192600103820291508084116103d65790505b505050505085838151811061044057610440610789565b60200260200101516020018190525050808061045b906107b8565b915050610309565b50505090565b73ffffffffffffffffffffffffffffffffffffffff811660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131d602090815260409182902080548351818402810184019094528084526060937fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092919083018282801561055c57602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190600401906020826003010492830192600103820291508084116105095790505b5050505050915050919050565b60006020828403121561057b57600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146105ab57600080fd5b9392505050565b6020808252825182820181905260009190848201906040850190845b8181101561060057835173ffffffffffffffffffffffffffffffffffffffff16835292840192918401916001016105ce565b50909695505050505050565b600081518084526020808501945080840160005b8381101561065e5781517fffffffff000000000000000000000000000000000000000000000000000000001687529582019590820190600101610620565b509495945050505050565b60006020808301818452808551808352604092508286019150828160051b87010184880160005b83811015610703578883037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc00185528151805173ffffffffffffffffffffffffffffffffffffffff1684528701518784018790526106f08785018261060c565b9588019593505090860190600101610690565b509098975050505050505050565b60006020828403121561072357600080fd5b813573ffffffffffffffffffffffffffffffffffffffff811681146105ab57600080fd5b6020815260006105ab602083018461060c565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415610811577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b506001019056fea2646970667358221220d2f6c23b0c64effd7424eb9da8e13cc0a62fab9990643ce1a7bc54f830cc768464736f6c634300080a0033',
	deployedBytecode:
		'0x608060405234801561001057600080fd5b50600436106100675760003560e01c80637a0ed627116100505780637a0ed627146100fa578063adfca15e1461010f578063cdffacc61461012f57600080fd5b806301ffc9a71461006c57806352ef6b2c146100e5575b600080fd5b6100d061007a366004610569565b7fffffffff000000000000000000000000000000000000000000000000000000001660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131f602052604090205460ff1690565b60405190151581526020015b60405180910390f35b6100ed6101cb565b6040516100dc91906105b2565b61010261025d565b6040516100dc9190610669565b61012261011d366004610711565b610469565b6040516100dc9190610747565b6101a661013d366004610569565b7fffffffff000000000000000000000000000000000000000000000000000000001660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c602052604090205473ffffffffffffffffffffffffffffffffffffffff1690565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020016100dc565b606060007fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c6002810180546040805160208084028201810190925282815293945083018282801561025257602002820191906000526020600020905b815473ffffffffffffffffffffffffffffffffffffffff168152600190910190602001808311610227575b505050505091505090565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131e546060907fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c908067ffffffffffffffff8111156102bd576102bd61075a565b60405190808252806020026020018201604052801561030357816020015b6040805180820190915260008152606060208201528152602001906001900390816102db5790505b50925060005b8181101561046357600083600201828154811061032857610328610789565b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508085838151811061036857610368610789565b60209081029190910181015173ffffffffffffffffffffffffffffffffffffffff928316905290821660009081526001860182526040908190208054825181850281018501909352808352919290919083018282801561042957602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190600401906020826003010492830192600103820291508084116103d65790505b505050505085838151811061044057610440610789565b60200260200101516020018190525050808061045b906107b8565b915050610309565b50505090565b73ffffffffffffffffffffffffffffffffffffffff811660009081527fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131d602090815260409182902080548351818402810184019094528084526060937fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092919083018282801561055c57602002820191906000526020600020906000905b82829054906101000a900460e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190600401906020826003010492830192600103820291508084116105095790505b5050505050915050919050565b60006020828403121561057b57600080fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146105ab57600080fd5b9392505050565b6020808252825182820181905260009190848201906040850190845b8181101561060057835173ffffffffffffffffffffffffffffffffffffffff16835292840192918401916001016105ce565b50909695505050505050565b600081518084526020808501945080840160005b8381101561065e5781517fffffffff000000000000000000000000000000000000000000000000000000001687529582019590820190600101610620565b509495945050505050565b60006020808301818452808551808352604092508286019150828160051b87010184880160005b83811015610703578883037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc00185528151805173ffffffffffffffffffffffffffffffffffffffff1684528701518784018790526106f08785018261060c565b9588019593505090860190600101610690565b509098975050505050505050565b60006020828403121561072357600080fd5b813573ffffffffffffffffffffffffffffffffffffffff811681146105ab57600080fd5b6020815260006105ab602083018461060c565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415610811577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b506001019056fea2646970667358221220d2f6c23b0c64effd7424eb9da8e13cc0a62fab9990643ce1a7bc54f830cc768464736f6c634300080a0033',
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
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH2 0x84E DUP1 PUSH2 0x20 PUSH1 0x0 CODECOPY PUSH1 0x0 RETURN INVALID PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x67 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x7A0ED627 GT PUSH2 0x50 JUMPI DUP1 PUSH4 0x7A0ED627 EQ PUSH2 0xFA JUMPI DUP1 PUSH4 0xADFCA15E EQ PUSH2 0x10F JUMPI DUP1 PUSH4 0xCDFFACC6 EQ PUSH2 0x12F JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0x6C JUMPI DUP1 PUSH4 0x52EF6B2C EQ PUSH2 0xE5 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0xD0 PUSH2 0x7A CALLDATASIZE PUSH1 0x4 PUSH2 0x569 JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131F PUSH1 0x20 MSTORE PUSH1 0x40 SWAP1 KECCAK256 SLOAD PUSH1 0xFF AND SWAP1 JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST PUSH2 0xED PUSH2 0x1CB JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0xDC SWAP2 SWAP1 PUSH2 0x5B2 JUMP JUMPDEST PUSH2 0x102 PUSH2 0x25D JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0xDC SWAP2 SWAP1 PUSH2 0x669 JUMP JUMPDEST PUSH2 0x122 PUSH2 0x11D CALLDATASIZE PUSH1 0x4 PUSH2 0x711 JUMP JUMPDEST PUSH2 0x469 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0xDC SWAP2 SWAP1 PUSH2 0x747 JUMP JUMPDEST PUSH2 0x1A6 PUSH2 0x13D CALLDATASIZE PUSH1 0x4 PUSH2 0x569 JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x20 MSTORE PUSH1 0x40 SWAP1 KECCAK256 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0xDC JUMP JUMPDEST PUSH1 0x60 PUSH1 0x0 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x2 DUP2 ADD DUP1 SLOAD PUSH1 0x40 DUP1 MLOAD PUSH1 0x20 DUP1 DUP5 MUL DUP3 ADD DUP2 ADD SWAP1 SWAP3 MSTORE DUP3 DUP2 MSTORE SWAP4 SWAP5 POP DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x252 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 JUMPDEST DUP2 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 MSTORE PUSH1 0x1 SWAP1 SWAP2 ADD SWAP1 PUSH1 0x20 ADD DUP1 DUP4 GT PUSH2 0x227 JUMPI JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP1 JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131E SLOAD PUSH1 0x60 SWAP1 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP1 DUP1 PUSH8 0xFFFFFFFFFFFFFFFF DUP2 GT ISZERO PUSH2 0x2BD JUMPI PUSH2 0x2BD PUSH2 0x75A JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 DUP1 DUP3 MSTORE DUP1 PUSH1 0x20 MUL PUSH1 0x20 ADD DUP3 ADD PUSH1 0x40 MSTORE DUP1 ISZERO PUSH2 0x303 JUMPI DUP2 PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 DUP1 MLOAD DUP1 DUP3 ADD SWAP1 SWAP2 MSTORE PUSH1 0x0 DUP2 MSTORE PUSH1 0x60 PUSH1 0x20 DUP3 ADD MSTORE DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x1 SWAP1 SUB SWAP1 DUP2 PUSH2 0x2DB JUMPI SWAP1 POP JUMPDEST POP SWAP3 POP PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x463 JUMPI PUSH1 0x0 DUP4 PUSH1 0x2 ADD DUP3 DUP2 SLOAD DUP2 LT PUSH2 0x328 JUMPI PUSH2 0x328 PUSH2 0x789 JUMP JUMPDEST SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 ADD PUSH1 0x0 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 POP DUP1 DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x368 JUMPI PUSH2 0x368 PUSH2 0x789 JUMP JUMPDEST PUSH1 0x20 SWAP1 DUP2 MUL SWAP2 SWAP1 SWAP2 ADD DUP2 ADD MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP3 DUP4 AND SWAP1 MSTORE SWAP1 DUP3 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH1 0x1 DUP7 ADD DUP3 MSTORE PUSH1 0x40 SWAP1 DUP2 SWAP1 KECCAK256 DUP1 SLOAD DUP3 MLOAD DUP2 DUP6 MUL DUP2 ADD DUP6 ADD SWAP1 SWAP4 MSTORE DUP1 DUP4 MSTORE SWAP2 SWAP3 SWAP1 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x429 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x3D6 JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x440 JUMPI PUSH2 0x440 PUSH2 0x789 JUMP JUMPDEST PUSH1 0x20 MUL PUSH1 0x20 ADD ADD MLOAD PUSH1 0x20 ADD DUP2 SWAP1 MSTORE POP POP DUP1 DUP1 PUSH2 0x45B SWAP1 PUSH2 0x7B8 JUMP JUMPDEST SWAP2 POP POP PUSH2 0x309 JUMP JUMPDEST POP POP POP SWAP1 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131D PUSH1 0x20 SWAP1 DUP2 MSTORE PUSH1 0x40 SWAP2 DUP3 SWAP1 KECCAK256 DUP1 SLOAD DUP4 MLOAD DUP2 DUP5 MUL DUP2 ADD DUP5 ADD SWAP1 SWAP5 MSTORE DUP1 DUP5 MSTORE PUSH1 0x60 SWAP4 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP4 SWAP1 SWAP3 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x55C JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x509 JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x57B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x5AB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x20 DUP1 DUP3 MSTORE DUP3 MLOAD DUP3 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x0 SWAP2 SWAP1 DUP5 DUP3 ADD SWAP1 PUSH1 0x40 DUP6 ADD SWAP1 DUP5 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x600 JUMPI DUP4 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 MSTORE SWAP3 DUP5 ADD SWAP3 SWAP2 DUP5 ADD SWAP2 PUSH1 0x1 ADD PUSH2 0x5CE JUMP JUMPDEST POP SWAP1 SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD DUP1 DUP5 MSTORE PUSH1 0x20 DUP1 DUP6 ADD SWAP5 POP DUP1 DUP5 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x65E JUMPI DUP2 MLOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP8 MSTORE SWAP6 DUP3 ADD SWAP6 SWAP1 DUP3 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x620 JUMP JUMPDEST POP SWAP5 SWAP6 SWAP5 POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP1 DUP4 ADD DUP2 DUP5 MSTORE DUP1 DUP6 MLOAD DUP1 DUP4 MSTORE PUSH1 0x40 SWAP3 POP DUP3 DUP7 ADD SWAP2 POP DUP3 DUP2 PUSH1 0x5 SHL DUP8 ADD ADD DUP5 DUP9 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x703 JUMPI DUP9 DUP4 SUB PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC0 ADD DUP6 MSTORE DUP2 MLOAD DUP1 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP5 MSTORE DUP8 ADD MLOAD DUP8 DUP5 ADD DUP8 SWAP1 MSTORE PUSH2 0x6F0 DUP8 DUP6 ADD DUP3 PUSH2 0x60C JUMP JUMPDEST SWAP6 DUP9 ADD SWAP6 SWAP4 POP POP SWAP1 DUP7 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x690 JUMP JUMPDEST POP SWAP1 SWAP9 SWAP8 POP POP POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x723 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x5AB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 PUSH2 0x5AB PUSH1 0x20 DUP4 ADD DUP5 PUSH2 0x60C JUMP JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x32 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 EQ ISZERO PUSH2 0x811 JUMPI PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP PUSH1 0x1 ADD SWAP1 JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xD2 0xF6 0xC2 EXTCODESIZE 0xC PUSH5 0xEFFD7424EB SWAP14 0xA8 0xE1 EXTCODECOPY 0xC0 0xA6 0x2F 0xAB SWAP10 SWAP1 PUSH5 0x3CE1A7BC54 0xF8 ADDRESS 0xCC PUSH23 0x8464736F6C634300080A00330000000000000000000000 ',
			sourceMap: '539:2484:3:-:0;;;;;;;;;;;;;;;;;;;',
		},
		deployedBytecode: {
			functionDebugData: {
				'@diamondStorage_809': {
					entryPoint: null,
					id: 809,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@facetAddress_339': {
					entryPoint: null,
					id: 339,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@facetAddresses_312': {
					entryPoint: 459,
					id: 312,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@facetFunctionSelectors_289': {
					entryPoint: 1129,
					id: 289,
					parameterSlots: 1,
					returnSlots: 1,
				},
				'@facets_261': {
					entryPoint: 605,
					id: 261,
					parameterSlots: 0,
					returnSlots: 1,
				},
				'@supportsInterface_362': {
					entryPoint: null,
					id: 362,
					parameterSlots: 1,
					returnSlots: 1,
				},
				abi_decode_tuple_t_address: {
					entryPoint: 1809,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_decode_tuple_t_bytes4: {
					entryPoint: 1385,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_array_bytes4_dyn: {
					entryPoint: 1548,
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
						entryPoint: 1458,
						id: null,
						parameterSlots: 2,
						returnSlots: 1,
					},
				abi_encode_tuple_t_array$_t_bytes4_$dyn_memory_ptr__to_t_array$_t_bytes4_$dyn_memory_ptr__fromStack_reversed: {
					entryPoint: 1863,
					id: null,
					parameterSlots: 2,
					returnSlots: 1,
				},
				abi_encode_tuple_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__to_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__fromStack_reversed:
					{
						entryPoint: 1641,
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
				increment_t_uint256: {
					entryPoint: 1976,
					id: null,
					parameterSlots: 1,
					returnSlots: 1,
				},
				panic_error_0x32: {
					entryPoint: 1929,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
				panic_error_0x41: {
					entryPoint: 1882,
					id: null,
					parameterSlots: 0,
					returnSlots: 0,
				},
			},
			generatedSources: [
				{
					ast: {
						nodeType: 'YulBlock',
						src: '0:4422:12',
						statements: [
							{
								nodeType: 'YulBlock',
								src: '6:3:12',
								statements: [],
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '83:263:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '129:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '138:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '141:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '131:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '131:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '131:12:12',
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
																src: '104:7:12',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '113:9:12',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '100:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '100:23:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '125:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '96:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '96:32:12',
											},
											nodeType: 'YulIf',
											src: '93:52:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '154:36:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '180:9:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '167:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '167:23:12',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '158:5:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '300:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '309:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '312:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '302:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '302:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '302:12:12',
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
																src: '212:5:12',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '223:5:12',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '230:66:12',
																		type: '',
																		value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '219:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '219:78:12',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '209:2:12',
														},
														nodeType: 'YulFunctionCall',
														src: '209:89:12',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '202:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '202:97:12',
											},
											nodeType: 'YulIf',
											src: '199:117:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '325:15:12',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '335:5:12',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '325:6:12',
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
										src: '49:9:12',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '60:7:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '72:6:12',
										type: '',
									},
								],
								src: '14:332:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '446:92:12',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '456:26:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '468:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '479:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '464:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '464:18:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '456:4:12',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '498:9:12',
													},
													{
														arguments: [
															{
																arguments: [
																	{
																		name: 'value0',
																		nodeType: 'YulIdentifier',
																		src: '523:6:12',
																	},
																],
																functionName: {
																	name: 'iszero',
																	nodeType: 'YulIdentifier',
																	src: '516:6:12',
																},
																nodeType: 'YulFunctionCall',
																src: '516:14:12',
															},
														],
														functionName: {
															name: 'iszero',
															nodeType: 'YulIdentifier',
															src: '509:6:12',
														},
														nodeType: 'YulFunctionCall',
														src: '509:22:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '491:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '491:41:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '491:41:12',
										},
									],
								},
								name: 'abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '415:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '426:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '437:4:12',
										type: '',
									},
								],
								src: '351:187:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '694:530:12',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '704:12:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '714:2:12',
												type: '',
												value: '32',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '708:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '725:32:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '743:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '754:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '739:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '739:18:12',
											},
											variables: [
												{
													name: 'tail_1',
													nodeType: 'YulTypedName',
													src: '729:6:12',
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
														src: '773:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '784:2:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '766:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '766:21:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '766:21:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '796:17:12',
											value: {
												name: 'tail_1',
												nodeType: 'YulIdentifier',
												src: '807:6:12',
											},
											variables: [
												{
													name: 'pos',
													nodeType: 'YulTypedName',
													src: '800:3:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '822:27:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '842:6:12',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '836:5:12',
												},
												nodeType: 'YulFunctionCall',
												src: '836:13:12',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '826:6:12',
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
														src: '865:6:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '873:6:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '858:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '858:22:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '858:22:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '889:25:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '900:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '911:2:12',
														type: '',
														value: '64',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '896:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '896:18:12',
											},
											variableNames: [
												{
													name: 'pos',
													nodeType: 'YulIdentifier',
													src: '889:3:12',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '923:29:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '941:6:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '949:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '937:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '937:15:12',
											},
											variables: [
												{
													name: 'srcPtr',
													nodeType: 'YulTypedName',
													src: '927:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '961:10:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '970:1:12',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '965:1:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1029:169:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '1050:3:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'srcPtr',
																					nodeType: 'YulIdentifier',
																					src: '1065:6:12',
																				},
																			],
																			functionName: {
																				name: 'mload',
																				nodeType: 'YulIdentifier',
																				src: '1059:5:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '1059:13:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1074:42:12',
																			type: '',
																			value: '0xffffffffffffffffffffffffffffffffffffffff',
																		},
																	],
																	functionName: {
																		name: 'and',
																		nodeType: 'YulIdentifier',
																		src: '1055:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '1055:62:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1043:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1043:75:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1043:75:12',
													},
													{
														nodeType: 'YulAssignment',
														src: '1131:19:12',
														value: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '1142:3:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '1147:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1138:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1138:12:12',
														},
														variableNames: [
															{
																name: 'pos',
																nodeType: 'YulIdentifier',
																src: '1131:3:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '1163:25:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '1177:6:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '1185:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1173:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1173:15:12',
														},
														variableNames: [
															{
																name: 'srcPtr',
																nodeType: 'YulIdentifier',
																src: '1163:6:12',
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
														src: '991:1:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '994:6:12',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '988:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '988:13:12',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '1002:18:12',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '1004:14:12',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '1013:1:12',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1016:1:12',
																	type: '',
																	value: '1',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1009:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1009:9:12',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '1004:1:12',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '984:3:12',
												statements: [],
											},
											src: '980:218:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '1207:11:12',
											value: {
												name: 'pos',
												nodeType: 'YulIdentifier',
												src: '1215:3:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '1207:4:12',
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
										src: '663:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '674:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '685:4:12',
										type: '',
									},
								],
								src: '543:681:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1289:447:12',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '1299:26:12',
											value: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '1319:5:12',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '1313:5:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1313:12:12',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '1303:6:12',
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
														src: '1341:3:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1346:6:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '1334:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1334:19:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '1334:19:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1362:14:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1372:4:12',
												type: '',
												value: '0x20',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1366:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '1385:19:12',
											value: {
												arguments: [
													{
														name: 'pos',
														nodeType: 'YulIdentifier',
														src: '1396:3:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1401:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1392:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1392:12:12',
											},
											variableNames: [
												{
													name: 'pos',
													nodeType: 'YulIdentifier',
													src: '1385:3:12',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1413:28:12',
											value: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '1431:5:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1438:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1427:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1427:14:12',
											},
											variables: [
												{
													name: 'srcPtr',
													nodeType: 'YulTypedName',
													src: '1417:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1450:10:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1459:1:12',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '1454:1:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '1518:193:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '1539:3:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'srcPtr',
																					nodeType: 'YulIdentifier',
																					src: '1554:6:12',
																				},
																			],
																			functionName: {
																				name: 'mload',
																				nodeType: 'YulIdentifier',
																				src: '1548:5:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '1548:13:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '1563:66:12',
																			type: '',
																			value: '0xffffffff00000000000000000000000000000000000000000000000000000000',
																		},
																	],
																	functionName: {
																		name: 'and',
																		nodeType: 'YulIdentifier',
																		src: '1544:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '1544:86:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '1532:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1532:99:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '1532:99:12',
													},
													{
														nodeType: 'YulAssignment',
														src: '1644:19:12',
														value: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '1655:3:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '1660:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1651:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1651:12:12',
														},
														variableNames: [
															{
																name: 'pos',
																nodeType: 'YulIdentifier',
																src: '1644:3:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '1676:25:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '1690:6:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '1698:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1686:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1686:15:12',
														},
														variableNames: [
															{
																name: 'srcPtr',
																nodeType: 'YulIdentifier',
																src: '1676:6:12',
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
														src: '1480:1:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '1483:6:12',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '1477:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1477:13:12',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '1491:18:12',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '1493:14:12',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '1502:1:12',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '1505:1:12',
																	type: '',
																	value: '1',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '1498:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '1498:9:12',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '1493:1:12',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '1473:3:12',
												statements: [],
											},
											src: '1469:242:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '1720:10:12',
											value: {
												name: 'pos',
												nodeType: 'YulIdentifier',
												src: '1727:3:12',
											},
											variableNames: [
												{
													name: 'end',
													nodeType: 'YulIdentifier',
													src: '1720:3:12',
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
										src: '1266:5:12',
										type: '',
									},
									{
										name: 'pos',
										nodeType: 'YulTypedName',
										src: '1273:3:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'end',
										nodeType: 'YulTypedName',
										src: '1281:3:12',
										type: '',
									},
								],
								src: '1229:507:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '1936:944:12',
									statements: [
										{
											nodeType: 'YulVariableDeclaration',
											src: '1946:12:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '1956:2:12',
												type: '',
												value: '32',
											},
											variables: [
												{
													name: '_1',
													nodeType: 'YulTypedName',
													src: '1950:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '1967:32:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '1985:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '1996:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '1981:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '1981:18:12',
											},
											variables: [
												{
													name: 'tail_1',
													nodeType: 'YulTypedName',
													src: '1971:6:12',
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
														src: '2015:9:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '2026:2:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2008:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2008:21:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '2008:21:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2038:17:12',
											value: {
												name: 'tail_1',
												nodeType: 'YulIdentifier',
												src: '2049:6:12',
											},
											variables: [
												{
													name: 'pos',
													nodeType: 'YulTypedName',
													src: '2042:3:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2064:27:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2084:6:12',
													},
												],
												functionName: {
													name: 'mload',
													nodeType: 'YulIdentifier',
													src: '2078:5:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2078:13:12',
											},
											variables: [
												{
													name: 'length',
													nodeType: 'YulTypedName',
													src: '2068:6:12',
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
														src: '2107:6:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2115:6:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '2100:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2100:22:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '2100:22:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2131:12:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '2141:2:12',
												type: '',
												value: '64',
											},
											variables: [
												{
													name: '_2',
													nodeType: 'YulTypedName',
													src: '2135:2:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulAssignment',
											src: '2152:25:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '2163:9:12',
													},
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '2174:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2159:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2159:18:12',
											},
											variableNames: [
												{
													name: 'pos',
													nodeType: 'YulIdentifier',
													src: '2152:3:12',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2186:53:12',
											value: {
												arguments: [
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2208:9:12',
															},
															{
																arguments: [
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '2223:1:12',
																		type: '',
																		value: '5',
																	},
																	{
																		name: 'length',
																		nodeType: 'YulIdentifier',
																		src: '2226:6:12',
																	},
																],
																functionName: {
																	name: 'shl',
																	nodeType: 'YulIdentifier',
																	src: '2219:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '2219:14:12',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '2204:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '2204:30:12',
													},
													{
														name: '_2',
														nodeType: 'YulIdentifier',
														src: '2236:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2200:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2200:39:12',
											},
											variables: [
												{
													name: 'tail_2',
													nodeType: 'YulTypedName',
													src: '2190:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2248:29:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '2266:6:12',
													},
													{
														name: '_1',
														nodeType: 'YulIdentifier',
														src: '2274:2:12',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '2262:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2262:15:12',
											},
											variables: [
												{
													name: 'srcPtr',
													nodeType: 'YulTypedName',
													src: '2252:6:12',
													type: '',
												},
											],
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '2286:10:12',
											value: {
												kind: 'number',
												nodeType: 'YulLiteral',
												src: '2295:1:12',
												type: '',
												value: '0',
											},
											variables: [
												{
													name: 'i',
													nodeType: 'YulTypedName',
													src: '2290:1:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '2354:497:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '2375:3:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: 'tail_2',
																					nodeType: 'YulIdentifier',
																					src: '2388:6:12',
																				},
																				{
																					name: 'headStart',
																					nodeType: 'YulIdentifier',
																					src: '2396:9:12',
																				},
																			],
																			functionName: {
																				name: 'sub',
																				nodeType: 'YulIdentifier',
																				src: '2384:3:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '2384:22:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '2408:66:12',
																			type: '',
																			value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2380:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2380:95:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2368:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2368:108:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '2368:108:12',
													},
													{
														nodeType: 'YulVariableDeclaration',
														src: '2489:23:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '2505:6:12',
																},
															],
															functionName: {
																name: 'mload',
																nodeType: 'YulIdentifier',
																src: '2499:5:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2499:13:12',
														},
														variables: [
															{
																name: '_3',
																nodeType: 'YulTypedName',
																src: '2493:2:12',
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
																	src: '2532:6:12',
																},
																{
																	arguments: [
																		{
																			arguments: [
																				{
																					name: '_3',
																					nodeType: 'YulIdentifier',
																					src: '2550:2:12',
																				},
																			],
																			functionName: {
																				name: 'mload',
																				nodeType: 'YulIdentifier',
																				src: '2544:5:12',
																			},
																			nodeType: 'YulFunctionCall',
																			src: '2544:9:12',
																		},
																		{
																			kind: 'number',
																			nodeType: 'YulLiteral',
																			src: '2555:42:12',
																			type: '',
																			value: '0xffffffffffffffffffffffffffffffffffffffff',
																		},
																	],
																	functionName: {
																		name: 'and',
																		nodeType: 'YulIdentifier',
																		src: '2540:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2540:58:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2525:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2525:74:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '2525:74:12',
													},
													{
														nodeType: 'YulVariableDeclaration',
														src: '2612:38:12',
														value: {
															arguments: [
																{
																	arguments: [
																		{
																			name: '_3',
																			nodeType: 'YulIdentifier',
																			src: '2642:2:12',
																		},
																		{
																			name: '_1',
																			nodeType: 'YulIdentifier',
																			src: '2646:2:12',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2638:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2638:11:12',
																},
															],
															functionName: {
																name: 'mload',
																nodeType: 'YulIdentifier',
																src: '2632:5:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2632:18:12',
														},
														variables: [
															{
																name: 'memberValue0',
																nodeType: 'YulTypedName',
																src: '2616:12:12',
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
																			src: '2674:6:12',
																		},
																		{
																			name: '_1',
																			nodeType: 'YulIdentifier',
																			src: '2682:2:12',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2670:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2670:15:12',
																},
																{
																	name: '_2',
																	nodeType: 'YulIdentifier',
																	src: '2687:2:12',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '2663:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2663:27:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '2663:27:12',
													},
													{
														nodeType: 'YulAssignment',
														src: '2703:68:12',
														value: {
															arguments: [
																{
																	name: 'memberValue0',
																	nodeType: 'YulIdentifier',
																	src: '2741:12:12',
																},
																{
																	arguments: [
																		{
																			name: 'tail_2',
																			nodeType: 'YulIdentifier',
																			src: '2759:6:12',
																		},
																		{
																			name: '_2',
																			nodeType: 'YulIdentifier',
																			src: '2767:2:12',
																		},
																	],
																	functionName: {
																		name: 'add',
																		nodeType: 'YulIdentifier',
																		src: '2755:3:12',
																	},
																	nodeType: 'YulFunctionCall',
																	src: '2755:15:12',
																},
															],
															functionName: {
																name: 'abi_encode_array_bytes4_dyn',
																nodeType: 'YulIdentifier',
																src: '2713:27:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2713:58:12',
														},
														variableNames: [
															{
																name: 'tail_2',
																nodeType: 'YulIdentifier',
																src: '2703:6:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '2784:25:12',
														value: {
															arguments: [
																{
																	name: 'srcPtr',
																	nodeType: 'YulIdentifier',
																	src: '2798:6:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '2806:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2794:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2794:15:12',
														},
														variableNames: [
															{
																name: 'srcPtr',
																nodeType: 'YulIdentifier',
																src: '2784:6:12',
															},
														],
													},
													{
														nodeType: 'YulAssignment',
														src: '2822:19:12',
														value: {
															arguments: [
																{
																	name: 'pos',
																	nodeType: 'YulIdentifier',
																	src: '2833:3:12',
																},
																{
																	name: '_1',
																	nodeType: 'YulIdentifier',
																	src: '2838:2:12',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2829:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2829:12:12',
														},
														variableNames: [
															{
																name: 'pos',
																nodeType: 'YulIdentifier',
																src: '2822:3:12',
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
														src: '2316:1:12',
													},
													{
														name: 'length',
														nodeType: 'YulIdentifier',
														src: '2319:6:12',
													},
												],
												functionName: {
													name: 'lt',
													nodeType: 'YulIdentifier',
													src: '2313:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2313:13:12',
											},
											nodeType: 'YulForLoop',
											post: {
												nodeType: 'YulBlock',
												src: '2327:18:12',
												statements: [
													{
														nodeType: 'YulAssignment',
														src: '2329:14:12',
														value: {
															arguments: [
																{
																	name: 'i',
																	nodeType: 'YulIdentifier',
																	src: '2338:1:12',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '2341:1:12',
																	type: '',
																	value: '1',
																},
															],
															functionName: {
																name: 'add',
																nodeType: 'YulIdentifier',
																src: '2334:3:12',
															},
															nodeType: 'YulFunctionCall',
															src: '2334:9:12',
														},
														variableNames: [
															{
																name: 'i',
																nodeType: 'YulIdentifier',
																src: '2329:1:12',
															},
														],
													},
												],
											},
											pre: {
												nodeType: 'YulBlock',
												src: '2309:3:12',
												statements: [],
											},
											src: '2305:546:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '2860:14:12',
											value: {
												name: 'tail_2',
												nodeType: 'YulIdentifier',
												src: '2868:6:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '2860:4:12',
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
										src: '1905:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '1916:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '1927:4:12',
										type: '',
									},
								],
								src: '1741:1139:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '2955:239:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '3001:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3010:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3013:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '3003:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '3003:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '3003:12:12',
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
																src: '2976:7:12',
															},
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '2985:9:12',
															},
														],
														functionName: {
															name: 'sub',
															nodeType: 'YulIdentifier',
															src: '2972:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '2972:23:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '2997:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'slt',
													nodeType: 'YulIdentifier',
													src: '2968:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '2968:32:12',
											},
											nodeType: 'YulIf',
											src: '2965:52:12',
										},
										{
											nodeType: 'YulVariableDeclaration',
											src: '3026:36:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3052:9:12',
													},
												],
												functionName: {
													name: 'calldataload',
													nodeType: 'YulIdentifier',
													src: '3039:12:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3039:23:12',
											},
											variables: [
												{
													name: 'value',
													nodeType: 'YulTypedName',
													src: '3030:5:12',
													type: '',
												},
											],
										},
										{
											body: {
												nodeType: 'YulBlock',
												src: '3148:16:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3157:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '3160:1:12',
																	type: '',
																	value: '0',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '3150:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '3150:12:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '3150:12:12',
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
																src: '3084:5:12',
															},
															{
																arguments: [
																	{
																		name: 'value',
																		nodeType: 'YulIdentifier',
																		src: '3095:5:12',
																	},
																	{
																		kind: 'number',
																		nodeType: 'YulLiteral',
																		src: '3102:42:12',
																		type: '',
																		value: '0xffffffffffffffffffffffffffffffffffffffff',
																	},
																],
																functionName: {
																	name: 'and',
																	nodeType: 'YulIdentifier',
																	src: '3091:3:12',
																},
																nodeType: 'YulFunctionCall',
																src: '3091:54:12',
															},
														],
														functionName: {
															name: 'eq',
															nodeType: 'YulIdentifier',
															src: '3081:2:12',
														},
														nodeType: 'YulFunctionCall',
														src: '3081:65:12',
													},
												],
												functionName: {
													name: 'iszero',
													nodeType: 'YulIdentifier',
													src: '3074:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3074:73:12',
											},
											nodeType: 'YulIf',
											src: '3071:93:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '3173:15:12',
											value: {
												name: 'value',
												nodeType: 'YulIdentifier',
												src: '3183:5:12',
											},
											variableNames: [
												{
													name: 'value0',
													nodeType: 'YulIdentifier',
													src: '3173:6:12',
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
										src: '2921:9:12',
										type: '',
									},
									{
										name: 'dataEnd',
										nodeType: 'YulTypedName',
										src: '2932:7:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '2944:6:12',
										type: '',
									},
								],
								src: '2885:309:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3348:109:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3365:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3376:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3358:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3358:21:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3358:21:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '3388:63:12',
											value: {
												arguments: [
													{
														name: 'value0',
														nodeType: 'YulIdentifier',
														src: '3424:6:12',
													},
													{
														arguments: [
															{
																name: 'headStart',
																nodeType: 'YulIdentifier',
																src: '3436:9:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3447:2:12',
																type: '',
																value: '32',
															},
														],
														functionName: {
															name: 'add',
															nodeType: 'YulIdentifier',
															src: '3432:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '3432:18:12',
													},
												],
												functionName: {
													name: 'abi_encode_array_bytes4_dyn',
													nodeType: 'YulIdentifier',
													src: '3396:27:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3396:55:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3388:4:12',
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
										src: '3317:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3328:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '3339:4:12',
										type: '',
									},
								],
								src: '3199:258:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3563:125:12',
									statements: [
										{
											nodeType: 'YulAssignment',
											src: '3573:26:12',
											value: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3585:9:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3596:2:12',
														type: '',
														value: '32',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '3581:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3581:18:12',
											},
											variableNames: [
												{
													name: 'tail',
													nodeType: 'YulIdentifier',
													src: '3573:4:12',
												},
											],
										},
										{
											expression: {
												arguments: [
													{
														name: 'headStart',
														nodeType: 'YulIdentifier',
														src: '3615:9:12',
													},
													{
														arguments: [
															{
																name: 'value0',
																nodeType: 'YulIdentifier',
																src: '3630:6:12',
															},
															{
																kind: 'number',
																nodeType: 'YulLiteral',
																src: '3638:42:12',
																type: '',
																value: '0xffffffffffffffffffffffffffffffffffffffff',
															},
														],
														functionName: {
															name: 'and',
															nodeType: 'YulIdentifier',
															src: '3626:3:12',
														},
														nodeType: 'YulFunctionCall',
														src: '3626:55:12',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3608:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3608:74:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3608:74:12',
										},
									],
								},
								name: 'abi_encode_tuple_t_address__to_t_address__fromStack_reversed',
								nodeType: 'YulFunctionDefinition',
								parameters: [
									{
										name: 'headStart',
										nodeType: 'YulTypedName',
										src: '3532:9:12',
										type: '',
									},
									{
										name: 'value0',
										nodeType: 'YulTypedName',
										src: '3543:6:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'tail',
										nodeType: 'YulTypedName',
										src: '3554:4:12',
										type: '',
									},
								],
								src: '3462:226:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3725:152:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3742:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3745:77:12',
														type: '',
														value: '35408467139433450592217433187231851964531694900788300625387963629091585785856',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3735:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3735:88:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3735:88:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3839:1:12',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3842:4:12',
														type: '',
														value: '0x41',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3832:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3832:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3832:15:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3863:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3866:4:12',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '3856:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3856:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3856:15:12',
										},
									],
								},
								name: 'panic_error_0x41',
								nodeType: 'YulFunctionDefinition',
								src: '3693:184:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '3914:152:12',
									statements: [
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3931:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '3934:77:12',
														type: '',
														value: '35408467139433450592217433187231851964531694900788300625387963629091585785856',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '3924:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '3924:88:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '3924:88:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4028:1:12',
														type: '',
														value: '4',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4031:4:12',
														type: '',
														value: '0x32',
													},
												],
												functionName: {
													name: 'mstore',
													nodeType: 'YulIdentifier',
													src: '4021:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '4021:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '4021:15:12',
										},
										{
											expression: {
												arguments: [
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4052:1:12',
														type: '',
														value: '0',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4055:4:12',
														type: '',
														value: '0x24',
													},
												],
												functionName: {
													name: 'revert',
													nodeType: 'YulIdentifier',
													src: '4045:6:12',
												},
												nodeType: 'YulFunctionCall',
												src: '4045:15:12',
											},
											nodeType: 'YulExpressionStatement',
											src: '4045:15:12',
										},
									],
								},
								name: 'panic_error_0x32',
								nodeType: 'YulFunctionDefinition',
								src: '3882:184:12',
							},
							{
								body: {
									nodeType: 'YulBlock',
									src: '4118:302:12',
									statements: [
										{
											body: {
												nodeType: 'YulBlock',
												src: '4217:168:12',
												statements: [
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4238:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4241:77:12',
																	type: '',
																	value:
																		'35408467139433450592217433187231851964531694900788300625387963629091585785856',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '4231:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '4231:88:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '4231:88:12',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4339:1:12',
																	type: '',
																	value: '4',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4342:4:12',
																	type: '',
																	value: '0x11',
																},
															],
															functionName: {
																name: 'mstore',
																nodeType: 'YulIdentifier',
																src: '4332:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '4332:15:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '4332:15:12',
													},
													{
														expression: {
															arguments: [
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4367:1:12',
																	type: '',
																	value: '0',
																},
																{
																	kind: 'number',
																	nodeType: 'YulLiteral',
																	src: '4370:4:12',
																	type: '',
																	value: '0x24',
																},
															],
															functionName: {
																name: 'revert',
																nodeType: 'YulIdentifier',
																src: '4360:6:12',
															},
															nodeType: 'YulFunctionCall',
															src: '4360:15:12',
														},
														nodeType: 'YulExpressionStatement',
														src: '4360:15:12',
													},
												],
											},
											condition: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '4134:5:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4141:66:12',
														type: '',
														value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
													},
												],
												functionName: {
													name: 'eq',
													nodeType: 'YulIdentifier',
													src: '4131:2:12',
												},
												nodeType: 'YulFunctionCall',
												src: '4131:77:12',
											},
											nodeType: 'YulIf',
											src: '4128:257:12',
										},
										{
											nodeType: 'YulAssignment',
											src: '4394:20:12',
											value: {
												arguments: [
													{
														name: 'value',
														nodeType: 'YulIdentifier',
														src: '4405:5:12',
													},
													{
														kind: 'number',
														nodeType: 'YulLiteral',
														src: '4412:1:12',
														type: '',
														value: '1',
													},
												],
												functionName: {
													name: 'add',
													nodeType: 'YulIdentifier',
													src: '4401:3:12',
												},
												nodeType: 'YulFunctionCall',
												src: '4401:13:12',
											},
											variableNames: [
												{
													name: 'ret',
													nodeType: 'YulIdentifier',
													src: '4394:3:12',
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
										src: '4100:5:12',
										type: '',
									},
								],
								returnVariables: [
									{
										name: 'ret',
										nodeType: 'YulTypedName',
										src: '4110:3:12',
										type: '',
									},
								],
								src: '4071:349:12',
							},
						],
					},
					contents:
						'{\n    { }\n    function abi_decode_tuple_t_bytes4(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffff00000000000000000000000000000000000000000000000000000000))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_bool__to_t_bool__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, iszero(iszero(value0)))\n    }\n    function abi_encode_tuple_t_array$_t_address_$dyn_memory_ptr__to_t_array$_t_address_$dyn_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        let _1 := 32\n        let tail_1 := add(headStart, _1)\n        mstore(headStart, _1)\n        let pos := tail_1\n        let length := mload(value0)\n        mstore(tail_1, length)\n        pos := add(headStart, 64)\n        let srcPtr := add(value0, _1)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 1) }\n        {\n            mstore(pos, and(mload(srcPtr), 0xffffffffffffffffffffffffffffffffffffffff))\n            pos := add(pos, _1)\n            srcPtr := add(srcPtr, _1)\n        }\n        tail := pos\n    }\n    function abi_encode_array_bytes4_dyn(value, pos) -> end\n    {\n        let length := mload(value)\n        mstore(pos, length)\n        let _1 := 0x20\n        pos := add(pos, _1)\n        let srcPtr := add(value, _1)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 1) }\n        {\n            mstore(pos, and(mload(srcPtr), 0xffffffff00000000000000000000000000000000000000000000000000000000))\n            pos := add(pos, _1)\n            srcPtr := add(srcPtr, _1)\n        }\n        end := pos\n    }\n    function abi_encode_tuple_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__to_t_array$_t_struct$_Facet_$690_memory_ptr_$dyn_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        let _1 := 32\n        let tail_1 := add(headStart, _1)\n        mstore(headStart, _1)\n        let pos := tail_1\n        let length := mload(value0)\n        mstore(tail_1, length)\n        let _2 := 64\n        pos := add(headStart, _2)\n        let tail_2 := add(add(headStart, shl(5, length)), _2)\n        let srcPtr := add(value0, _1)\n        let i := 0\n        for { } lt(i, length) { i := add(i, 1) }\n        {\n            mstore(pos, add(sub(tail_2, headStart), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc0))\n            let _3 := mload(srcPtr)\n            mstore(tail_2, and(mload(_3), 0xffffffffffffffffffffffffffffffffffffffff))\n            let memberValue0 := mload(add(_3, _1))\n            mstore(add(tail_2, _1), _2)\n            tail_2 := abi_encode_array_bytes4_dyn(memberValue0, add(tail_2, _2))\n            srcPtr := add(srcPtr, _1)\n            pos := add(pos, _1)\n        }\n        tail := tail_2\n    }\n    function abi_decode_tuple_t_address(headStart, dataEnd) -> value0\n    {\n        if slt(sub(dataEnd, headStart), 32) { revert(0, 0) }\n        let value := calldataload(headStart)\n        if iszero(eq(value, and(value, 0xffffffffffffffffffffffffffffffffffffffff))) { revert(0, 0) }\n        value0 := value\n    }\n    function abi_encode_tuple_t_array$_t_bytes4_$dyn_memory_ptr__to_t_array$_t_bytes4_$dyn_memory_ptr__fromStack_reversed(headStart, value0) -> tail\n    {\n        mstore(headStart, 32)\n        tail := abi_encode_array_bytes4_dyn(value0, add(headStart, 32))\n    }\n    function abi_encode_tuple_t_address__to_t_address__fromStack_reversed(headStart, value0) -> tail\n    {\n        tail := add(headStart, 32)\n        mstore(headStart, and(value0, 0xffffffffffffffffffffffffffffffffffffffff))\n    }\n    function panic_error_0x41()\n    {\n        mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n        mstore(4, 0x41)\n        revert(0, 0x24)\n    }\n    function panic_error_0x32()\n    {\n        mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n        mstore(4, 0x32)\n        revert(0, 0x24)\n    }\n    function increment_t_uint256(value) -> ret\n    {\n        if eq(value, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)\n        {\n            mstore(0, 35408467139433450592217433187231851964531694900788300625387963629091585785856)\n            mstore(4, 0x11)\n            revert(0, 0x24)\n        }\n        ret := add(value, 1)\n    }\n}',
					id: 12,
					language: 'Yul',
					name: '#utility.yul',
				},
			],
			immutableReferences: {},
			linkReferences: {},
			opcodes:
				'PUSH1 0x80 PUSH1 0x40 MSTORE CALLVALUE DUP1 ISZERO PUSH2 0x10 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST POP PUSH1 0x4 CALLDATASIZE LT PUSH2 0x67 JUMPI PUSH1 0x0 CALLDATALOAD PUSH1 0xE0 SHR DUP1 PUSH4 0x7A0ED627 GT PUSH2 0x50 JUMPI DUP1 PUSH4 0x7A0ED627 EQ PUSH2 0xFA JUMPI DUP1 PUSH4 0xADFCA15E EQ PUSH2 0x10F JUMPI DUP1 PUSH4 0xCDFFACC6 EQ PUSH2 0x12F JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP1 PUSH4 0x1FFC9A7 EQ PUSH2 0x6C JUMPI DUP1 PUSH4 0x52EF6B2C EQ PUSH2 0xE5 JUMPI JUMPDEST PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH2 0xD0 PUSH2 0x7A CALLDATASIZE PUSH1 0x4 PUSH2 0x569 JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131F PUSH1 0x20 MSTORE PUSH1 0x40 SWAP1 KECCAK256 SLOAD PUSH1 0xFF AND SWAP1 JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 ISZERO ISZERO DUP2 MSTORE PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 MLOAD DUP1 SWAP2 SUB SWAP1 RETURN JUMPDEST PUSH2 0xED PUSH2 0x1CB JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0xDC SWAP2 SWAP1 PUSH2 0x5B2 JUMP JUMPDEST PUSH2 0x102 PUSH2 0x25D JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0xDC SWAP2 SWAP1 PUSH2 0x669 JUMP JUMPDEST PUSH2 0x122 PUSH2 0x11D CALLDATASIZE PUSH1 0x4 PUSH2 0x711 JUMP JUMPDEST PUSH2 0x469 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH2 0xDC SWAP2 SWAP1 PUSH2 0x747 JUMP JUMPDEST PUSH2 0x1A6 PUSH2 0x13D CALLDATASIZE PUSH1 0x4 PUSH2 0x569 JUMP JUMPDEST PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x20 MSTORE PUSH1 0x40 SWAP1 KECCAK256 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 JUMP JUMPDEST PUSH1 0x40 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP1 SWAP2 AND DUP2 MSTORE PUSH1 0x20 ADD PUSH2 0xDC JUMP JUMPDEST PUSH1 0x60 PUSH1 0x0 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C PUSH1 0x2 DUP2 ADD DUP1 SLOAD PUSH1 0x40 DUP1 MLOAD PUSH1 0x20 DUP1 DUP5 MUL DUP3 ADD DUP2 ADD SWAP1 SWAP3 MSTORE DUP3 DUP2 MSTORE SWAP4 SWAP5 POP DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x252 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 JUMPDEST DUP2 SLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP2 MSTORE PUSH1 0x1 SWAP1 SWAP2 ADD SWAP1 PUSH1 0x20 ADD DUP1 DUP4 GT PUSH2 0x227 JUMPI JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP1 JUMP JUMPDEST PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131E SLOAD PUSH1 0x60 SWAP1 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP1 DUP1 PUSH8 0xFFFFFFFFFFFFFFFF DUP2 GT ISZERO PUSH2 0x2BD JUMPI PUSH2 0x2BD PUSH2 0x75A JUMP JUMPDEST PUSH1 0x40 MLOAD SWAP1 DUP1 DUP3 MSTORE DUP1 PUSH1 0x20 MUL PUSH1 0x20 ADD DUP3 ADD PUSH1 0x40 MSTORE DUP1 ISZERO PUSH2 0x303 JUMPI DUP2 PUSH1 0x20 ADD JUMPDEST PUSH1 0x40 DUP1 MLOAD DUP1 DUP3 ADD SWAP1 SWAP2 MSTORE PUSH1 0x0 DUP2 MSTORE PUSH1 0x60 PUSH1 0x20 DUP3 ADD MSTORE DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x1 SWAP1 SUB SWAP1 DUP2 PUSH2 0x2DB JUMPI SWAP1 POP JUMPDEST POP SWAP3 POP PUSH1 0x0 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x463 JUMPI PUSH1 0x0 DUP4 PUSH1 0x2 ADD DUP3 DUP2 SLOAD DUP2 LT PUSH2 0x328 JUMPI PUSH2 0x328 PUSH2 0x789 JUMP JUMPDEST SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 ADD PUSH1 0x0 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND SWAP1 POP DUP1 DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x368 JUMPI PUSH2 0x368 PUSH2 0x789 JUMP JUMPDEST PUSH1 0x20 SWAP1 DUP2 MUL SWAP2 SWAP1 SWAP2 ADD DUP2 ADD MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF SWAP3 DUP4 AND SWAP1 MSTORE SWAP1 DUP3 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH1 0x1 DUP7 ADD DUP3 MSTORE PUSH1 0x40 SWAP1 DUP2 SWAP1 KECCAK256 DUP1 SLOAD DUP3 MLOAD DUP2 DUP6 MUL DUP2 ADD DUP6 ADD SWAP1 SWAP4 MSTORE DUP1 DUP4 MSTORE SWAP2 SWAP3 SWAP1 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x429 JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x3D6 JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP DUP6 DUP4 DUP2 MLOAD DUP2 LT PUSH2 0x440 JUMPI PUSH2 0x440 PUSH2 0x789 JUMP JUMPDEST PUSH1 0x20 MUL PUSH1 0x20 ADD ADD MLOAD PUSH1 0x20 ADD DUP2 SWAP1 MSTORE POP POP DUP1 DUP1 PUSH2 0x45B SWAP1 PUSH2 0x7B8 JUMP JUMPDEST SWAP2 POP POP PUSH2 0x309 JUMP JUMPDEST POP POP POP SWAP1 JUMP JUMPDEST PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND PUSH1 0x0 SWAP1 DUP2 MSTORE PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131D PUSH1 0x20 SWAP1 DUP2 MSTORE PUSH1 0x40 SWAP2 DUP3 SWAP1 KECCAK256 DUP1 SLOAD DUP4 MLOAD DUP2 DUP5 MUL DUP2 ADD DUP5 ADD SWAP1 SWAP5 MSTORE DUP1 DUP5 MSTORE PUSH1 0x60 SWAP4 PUSH32 0xC8FCAD8DB84D3CC18B4C41D551EA0EE66DD599CDE068D998E57D5E09332C131C SWAP4 SWAP1 SWAP3 SWAP2 SWAP1 DUP4 ADD DUP3 DUP3 DUP1 ISZERO PUSH2 0x55C JUMPI PUSH1 0x20 MUL DUP3 ADD SWAP2 SWAP1 PUSH1 0x0 MSTORE PUSH1 0x20 PUSH1 0x0 KECCAK256 SWAP1 PUSH1 0x0 SWAP1 JUMPDEST DUP3 DUP3 SWAP1 SLOAD SWAP1 PUSH2 0x100 EXP SWAP1 DIV PUSH1 0xE0 SHL PUSH28 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF NOT AND DUP2 MSTORE PUSH1 0x20 ADD SWAP1 PUSH1 0x4 ADD SWAP1 PUSH1 0x20 DUP3 PUSH1 0x3 ADD DIV SWAP3 DUP4 ADD SWAP3 PUSH1 0x1 SUB DUP3 MUL SWAP2 POP DUP1 DUP5 GT PUSH2 0x509 JUMPI SWAP1 POP JUMPDEST POP POP POP POP POP SWAP2 POP POP SWAP2 SWAP1 POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x57B JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 DUP2 AND DUP2 EQ PUSH2 0x5AB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST SWAP4 SWAP3 POP POP POP JUMP JUMPDEST PUSH1 0x20 DUP1 DUP3 MSTORE DUP3 MLOAD DUP3 DUP3 ADD DUP2 SWAP1 MSTORE PUSH1 0x0 SWAP2 SWAP1 DUP5 DUP3 ADD SWAP1 PUSH1 0x40 DUP6 ADD SWAP1 DUP5 JUMPDEST DUP2 DUP2 LT ISZERO PUSH2 0x600 JUMPI DUP4 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP4 MSTORE SWAP3 DUP5 ADD SWAP3 SWAP2 DUP5 ADD SWAP2 PUSH1 0x1 ADD PUSH2 0x5CE JUMP JUMPDEST POP SWAP1 SWAP7 SWAP6 POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 DUP2 MLOAD DUP1 DUP5 MSTORE PUSH1 0x20 DUP1 DUP6 ADD SWAP5 POP DUP1 DUP5 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x65E JUMPI DUP2 MLOAD PUSH32 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000 AND DUP8 MSTORE SWAP6 DUP3 ADD SWAP6 SWAP1 DUP3 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x620 JUMP JUMPDEST POP SWAP5 SWAP6 SWAP5 POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP1 DUP4 ADD DUP2 DUP5 MSTORE DUP1 DUP6 MLOAD DUP1 DUP4 MSTORE PUSH1 0x40 SWAP3 POP DUP3 DUP7 ADD SWAP2 POP DUP3 DUP2 PUSH1 0x5 SHL DUP8 ADD ADD DUP5 DUP9 ADD PUSH1 0x0 JUMPDEST DUP4 DUP2 LT ISZERO PUSH2 0x703 JUMPI DUP9 DUP4 SUB PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC0 ADD DUP6 MSTORE DUP2 MLOAD DUP1 MLOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF AND DUP5 MSTORE DUP8 ADD MLOAD DUP8 DUP5 ADD DUP8 SWAP1 MSTORE PUSH2 0x6F0 DUP8 DUP6 ADD DUP3 PUSH2 0x60C JUMP JUMPDEST SWAP6 DUP9 ADD SWAP6 SWAP4 POP POP SWAP1 DUP7 ADD SWAP1 PUSH1 0x1 ADD PUSH2 0x690 JUMP JUMPDEST POP SWAP1 SWAP9 SWAP8 POP POP POP POP POP POP POP POP JUMP JUMPDEST PUSH1 0x0 PUSH1 0x20 DUP3 DUP5 SUB SLT ISZERO PUSH2 0x723 JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST DUP2 CALLDATALOAD PUSH20 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP2 AND DUP2 EQ PUSH2 0x5AB JUMPI PUSH1 0x0 DUP1 REVERT JUMPDEST PUSH1 0x20 DUP2 MSTORE PUSH1 0x0 PUSH2 0x5AB PUSH1 0x20 DUP4 ADD DUP5 PUSH2 0x60C JUMP JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x41 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x32 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST PUSH1 0x0 PUSH32 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF DUP3 EQ ISZERO PUSH2 0x811 JUMPI PUSH32 0x4E487B7100000000000000000000000000000000000000000000000000000000 PUSH1 0x0 MSTORE PUSH1 0x11 PUSH1 0x4 MSTORE PUSH1 0x24 PUSH1 0x0 REVERT JUMPDEST POP PUSH1 0x1 ADD SWAP1 JUMP INVALID LOG2 PUSH5 0x6970667358 0x22 SLT KECCAK256 0xD2 0xF6 0xC2 EXTCODESIZE 0xC PUSH5 0xEFFD7424EB SWAP14 0xA8 0xE1 EXTCODECOPY 0xC0 0xA6 0x2F 0xAB SWAP10 SWAP1 PUSH5 0x3CE1A7BC54 0xF8 ADDRESS 0xCC PUSH23 0x8464736F6C634300080A00330000000000000000000000 ',
			sourceMap:
				'539:2484:3:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2799:222;;;;;;:::i;:::-;2978:36;;2879:4;2978:36;;;:22;:36;;;;;;;;;2799:222;;;;516:14:12;;509:22;491:41;;479:2;464:18;2799:222:3;;;;;;;;2038:220;;;:::i;:::-;;;;;;;:::i;967:523::-;;;:::i;:::-;;;;;;;:::i;1646:291::-;;;;;;:::i;:::-;;:::i;:::-;;;;;;;:::i;2488:273::-;;;;;;:::i;:::-;2693:48;;2568:21;2693:48;;;492:45:11;2693:48:3;;;;;:61;;;;2488:273;;;;3638:42:12;3626:55;;;3608:74;;3596:2;3581:18;2488:273:3;3462:226:12;2038:220:3;2096:32;2140:36;492:45:11;2234:17:3;;;2216:35;;;;;;;;;;;;;;;;;;;2140:66;;-1:-1:-1;2216:35:3;;2234:17;2216:35;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2130:128;2038:220;:::o;967:523::-;1147:17;:24;1017:22;;492:45:11;;1147:24:3;1191:22;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;;;;;;;;;;;;;;;;1191:22:3;;;;;;;;;;;;;;;;1181:32;;1228:9;1223:261;1243:9;1239:1;:13;1223:261;;;1273:21;1297:2;:17;;1315:1;1297:20;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;1273:44;;1357:13;1331:7;1339:1;1331:10;;;;;;;;:::i;:::-;;;;;;;;;;;;:39;;;;;;1415:40;;;1331:23;1415:40;;;:25;;;:40;;;;;;;1384:89;;;;;;;;;;;;;;;;;;;1415:40;;1384:89;;;1415:40;1384:89;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:7;1392:1;1384:10;;;;;;;;:::i;:::-;;;;;;;:28;;:89;;;;1259:225;1254:3;;;;;:::i;:::-;;;;1223:261;;;;1041:449;;967:523;:::o;1646:291::-;1879:33;;;1777:36;1879:33;;;:25;:33;;;;;;;;;1853:77;;;;;;;;;;;;;;;;;1726:39;;492:45:11;;1853:77:3;;1879:33;1853:77;;;1879:33;1853:77;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1767:170;1646:291;;;:::o;14:332:12:-;72:6;125:2;113:9;104:7;100:23;96:32;93:52;;;141:1;138;131:12;93:52;180:9;167:23;230:66;223:5;219:78;212:5;209:89;199:117;;312:1;309;302:12;199:117;335:5;14:332;-1:-1:-1;;;14:332:12:o;543:681::-;714:2;766:21;;;836:13;;739:18;;;858:22;;;685:4;;714:2;937:15;;;;911:2;896:18;;;685:4;980:218;994:6;991:1;988:13;980:218;;;1059:13;;1074:42;1055:62;1043:75;;1173:15;;;;1138:12;;;;1016:1;1009:9;980:218;;;-1:-1:-1;1215:3:12;;543:681;-1:-1:-1;;;;;;543:681:12:o;1229:507::-;1281:3;1319:5;1313:12;1346:6;1341:3;1334:19;1372:4;1401:2;1396:3;1392:12;1385:19;;1438:2;1431:5;1427:14;1459:1;1469:242;1483:6;1480:1;1477:13;1469:242;;;1548:13;;1563:66;1544:86;1532:99;;1651:12;;;;1686:15;;;;1505:1;1498:9;1469:242;;;-1:-1:-1;1727:3:12;;1229:507;-1:-1:-1;;;;;1229:507:12:o;1741:1139::-;1927:4;1956:2;1996;1985:9;1981:18;2026:2;2015:9;2008:21;2049:6;2084;2078:13;2115:6;2107;2100:22;2141:2;2131:12;;2174:2;2163:9;2159:18;2152:25;;2236:2;2226:6;2223:1;2219:14;2208:9;2204:30;2200:39;2274:2;2266:6;2262:15;2295:1;2305:546;2319:6;2316:1;2313:13;2305:546;;;2384:22;;;2408:66;2380:95;2368:108;;2499:13;;2544:9;;2555:42;2540:58;2525:74;;2638:11;;2632:18;2670:15;;;2663:27;;;2713:58;2755:15;;;2632:18;2713:58;:::i;:::-;2829:12;;;;2703:68;-1:-1:-1;;2794:15:12;;;;2341:1;2334:9;2305:546;;;-1:-1:-1;2868:6:12;;1741:1139;-1:-1:-1;;;;;;;;1741:1139:12:o;2885:309::-;2944:6;2997:2;2985:9;2976:7;2972:23;2968:32;2965:52;;;3013:1;3010;3003:12;2965:52;3052:9;3039:23;3102:42;3095:5;3091:54;3084:5;3081:65;3071:93;;3160:1;3157;3150:12;3199:258;3376:2;3365:9;3358:21;3339:4;3396:55;3447:2;3436:9;3432:18;3424:6;3396:55;:::i;3693:184::-;3745:77;3742:1;3735:88;3842:4;3839:1;3832:15;3866:4;3863:1;3856:15;3882:184;3934:77;3931:1;3924:88;4031:4;4028:1;4021:15;4055:4;4052:1;4045:15;4071:349;4110:3;4141:66;4134:5;4131:77;4128:257;;;4241:77;4238:1;4231:88;4342:4;4339:1;4332:15;4370:4;4367:1;4360:15;4128:257;-1:-1:-1;4412:1:12;4401:13;;4071:349::o',
		},
		gasEstimates: {
			creation: {
				codeDepositCost: '425200',
				executionCost: '461',
				totalCost: '425661',
			},
			external: {
				'facetAddress(bytes4)': '2537',
				'facetAddresses()': 'infinite',
				'facetFunctionSelectors(address)': 'infinite',
				'facets()': 'infinite',
				'supportsInterface(bytes4)': '2480',
			},
		},
		methodIdentifiers: {
			'facetAddress(bytes4)': 'cdffacc6',
			'facetAddresses()': '52ef6b2c',
			'facetFunctionSelectors(address)': 'adfca15e',
			'facets()': '7a0ed627',
			'supportsInterface(bytes4)': '01ffc9a7',
		},
	},
	metadata:
		'{"compiler":{"version":"0.8.10+commit.fc410830"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"bytes4","name":"_functionSelector","type":"bytes4"}],"name":"facetAddress","outputs":[{"internalType":"address","name":"facetAddress_","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"facetAddresses","outputs":[{"internalType":"address[]","name":"facetAddresses_","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_facet","type":"address"}],"name":"facetFunctionSelectors","outputs":[{"internalType":"bytes4[]","name":"facetFunctionSelectors_","type":"bytes4[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"facets","outputs":[{"components":[{"internalType":"address","name":"facetAddress","type":"address"},{"internalType":"bytes4[]","name":"functionSelectors","type":"bytes4[]"}],"internalType":"struct IDiamondLoupe.Facet[]","name":"facets_","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"_interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}],"devdoc":{"kind":"dev","methods":{"facetAddress(bytes4)":{"details":"If facet is not found return address(0).","params":{"_functionSelector":"The function selector."},"returns":{"facetAddress_":"The facet address."}},"facetAddresses()":{"returns":{"facetAddresses_":"facetAddresses_"}},"facetFunctionSelectors(address)":{"params":{"_facet":"The facet address."},"returns":{"facetFunctionSelectors_":"facetFunctionSelectors_"}},"facets()":{"returns":{"facets_":"Facet"}}},"version":1},"userdoc":{"kind":"user","methods":{"facetAddress(bytes4)":{"notice":"Gets the facet that supports the given selector."},"facetAddresses()":{"notice":"Get all the facet addresses used by a diamond."},"facetFunctionSelectors(address)":{"notice":"Gets all the function selectors provided by a facet."},"facets()":{"notice":"Gets all facets and their selectors."}},"version":1}},"settings":{"compilationTarget":{"solc_0.8/diamond/facets/DiamondLoupeFacet.sol":"DiamondLoupeFacet"},"evmVersion":"london","libraries":{},"metadata":{"bytecodeHash":"ipfs","useLiteralContent":true},"optimizer":{"enabled":true,"runs":999999},"remappings":[]},"sources":{"solc_0.8/diamond/facets/DiamondLoupeFacet.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\nimport { LibDiamond } from  \\"../libraries/LibDiamond.sol\\";\\nimport { IDiamondLoupe } from \\"../interfaces/IDiamondLoupe.sol\\";\\nimport { IERC165 } from \\"../interfaces/IERC165.sol\\";\\n\\ncontract DiamondLoupeFacet is IDiamondLoupe, IERC165 {\\n    // Diamond Loupe Functions\\n    ////////////////////////////////////////////////////////////////////\\n    /// These functions are expected to be called frequently by tools.\\n    //\\n    // struct Facet {\\n    //     address facetAddress;\\n    //     bytes4[] functionSelectors;\\n    // }\\n\\n    /// @notice Gets all facets and their selectors.\\n    /// @return facets_ Facet\\n    function facets() external override view returns (Facet[] memory facets_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        uint256 numFacets = ds.facetAddresses.length;\\n        facets_ = new Facet[](numFacets);\\n        for (uint256 i; i < numFacets; i++) {\\n            address facetAddress_ = ds.facetAddresses[i];\\n            facets_[i].facetAddress = facetAddress_;\\n            facets_[i].functionSelectors = ds.facetFunctionSelectors[facetAddress_].functionSelectors;\\n        }\\n    }\\n\\n    /// @notice Gets all the function selectors provided by a facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external override view returns (bytes4[] memory facetFunctionSelectors_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetFunctionSelectors_ = ds.facetFunctionSelectors[_facet].functionSelectors;\\n    }\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external override view returns (address[] memory facetAddresses_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddresses_ = ds.facetAddresses;\\n    }\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external override view returns (address facetAddress_) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        facetAddress_ = ds.selectorToFacetAndPosition[_functionSelector].facetAddress;\\n    }\\n\\n    // This implements ERC-165.\\n    function supportsInterface(bytes4 _interfaceId) external override view returns (bool) {\\n        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();\\n        return ds.supportedInterfaces[_interfaceId];\\n    }\\n}\\n","keccak256":"0x40116a553fb6b8e25371199648a526d61eefee47ba24f0909b00c7301dec612e","license":"MIT"},"solc_0.8/diamond/interfaces/IDiamondCut.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\ninterface IDiamondCut {\\n    enum FacetCutAction {Add, Replace, Remove}\\n    // Add=0, Replace=1, Remove=2\\n\\n    struct FacetCut {\\n        address facetAddress;\\n        FacetCutAction action;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Add/replace/remove any number of functions and optionally execute\\n    ///         a function with delegatecall\\n    /// @param _diamondCut Contains the facet addresses and function selectors\\n    /// @param _init The address of the contract or facet to execute _calldata\\n    /// @param _calldata A function call, including function selector and arguments\\n    ///                  _calldata is executed with delegatecall on _init\\n    function diamondCut(\\n        FacetCut[] calldata _diamondCut,\\n        address _init,\\n        bytes calldata _calldata\\n    ) external;\\n\\n    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);\\n}\\n","keccak256":"0xc00c16bfa30a3fa5f3dc684f7f8ba62c259962b25f647d9588739458989717fc","license":"MIT"},"solc_0.8/diamond/interfaces/IDiamondLoupe.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\n\\n// A loupe is a small magnifying glass used to look at diamonds.\\n// These functions look at diamonds\\ninterface IDiamondLoupe {\\n    /// These functions are expected to be called frequently\\n    /// by tools.\\n\\n    struct Facet {\\n        address facetAddress;\\n        bytes4[] functionSelectors;\\n    }\\n\\n    /// @notice Gets all facet addresses and their four byte function selectors.\\n    /// @return facets_ Facet\\n    function facets() external view returns (Facet[] memory facets_);\\n\\n    /// @notice Gets all the function selectors supported by a specific facet.\\n    /// @param _facet The facet address.\\n    /// @return facetFunctionSelectors_\\n    function facetFunctionSelectors(address _facet) external view returns (bytes4[] memory facetFunctionSelectors_);\\n\\n    /// @notice Get all the facet addresses used by a diamond.\\n    /// @return facetAddresses_\\n    function facetAddresses() external view returns (address[] memory facetAddresses_);\\n\\n    /// @notice Gets the facet that supports the given selector.\\n    /// @dev If facet is not found return address(0).\\n    /// @param _functionSelector The function selector.\\n    /// @return facetAddress_ The facet address.\\n    function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_);\\n}\\n","keccak256":"0x10884024af2c0f7deca0fac4ddf84e76da5dba35b6e02fabeac8ea54c1a5c6f7","license":"MIT"},"solc_0.8/diamond/interfaces/IERC165.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\ninterface IERC165 {\\n    /// @notice Query if a contract implements an interface\\n    /// @param interfaceId The interface identifier, as specified in ERC-165\\n    /// @dev Interface identification is specified in ERC-165. This function\\n    ///  uses less than 30,000 gas.\\n    /// @return `true` if the contract implements `interfaceID` and\\n    ///  `interfaceID` is not 0xffffffff, `false` otherwise\\n    function supportsInterface(bytes4 interfaceId) external view returns (bool);\\n}\\n","keccak256":"0x7541f7408d0f74162bc4664d5e012427f2ceaab2abadca0353269ef15ee03d8b","license":"MIT"},"solc_0.8/diamond/libraries/LibDiamond.sol":{"content":"// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.0;\\n\\n/******************************************************************************\\\\\\n* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)\\n* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535\\n/******************************************************************************/\\nimport { IDiamondCut } from \\"../interfaces/IDiamondCut.sol\\";\\n\\nlibrary LibDiamond {\\n    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256(\\"diamond.standard.diamond.storage\\");\\n\\n    struct FacetAddressAndPosition {\\n        address facetAddress;\\n        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array\\n    }\\n\\n    struct FacetFunctionSelectors {\\n        bytes4[] functionSelectors;\\n        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array\\n    }\\n\\n    struct DiamondStorage {\\n        // maps function selector to the facet address and\\n        // the position of the selector in the facetFunctionSelectors.selectors array\\n        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;\\n        // maps facet addresses to function selectors\\n        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;\\n        // facet addresses\\n        address[] facetAddresses;\\n        // Used to query if a contract implements an interface.\\n        // Used to implement ERC-165.\\n        mapping(bytes4 => bool) supportedInterfaces;\\n        // owner of the contract\\n        address contractOwner;\\n    }\\n\\n    function diamondStorage() internal pure returns (DiamondStorage storage ds) {\\n        bytes32 position = DIAMOND_STORAGE_POSITION;\\n        assembly {\\n            ds.slot := position\\n        }\\n    }\\n\\n    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);\\n\\n    function setContractOwner(address _newOwner) internal {\\n        DiamondStorage storage ds = diamondStorage();\\n        address previousOwner = ds.contractOwner;\\n        ds.contractOwner = _newOwner;\\n        emit OwnershipTransferred(previousOwner, _newOwner);\\n    }\\n\\n    function contractOwner() internal view returns (address contractOwner_) {\\n        contractOwner_ = diamondStorage().contractOwner;\\n    }\\n\\n    function enforceIsContractOwner() internal view {\\n        require(msg.sender == diamondStorage().contractOwner, \\"LibDiamond: Must be contract owner\\");\\n    }\\n\\n    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);\\n\\n    // Internal function version of diamondCut\\n    function diamondCut(\\n        IDiamondCut.FacetCut[] memory _diamondCut,\\n        address _init,\\n        bytes memory _calldata\\n    ) internal {\\n        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {\\n            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;\\n            if (action == IDiamondCut.FacetCutAction.Add) {\\n                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Replace) {\\n                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else if (action == IDiamondCut.FacetCutAction.Remove) {\\n                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);\\n            } else {\\n                revert(\\"LibDiamondCut: Incorrect FacetCutAction\\");\\n            }\\n        }\\n        emit DiamondCut(_diamondCut, _init, _calldata);\\n        initializeDiamondCut(_init, _calldata);\\n    }\\n\\n    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);            \\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress == address(0), \\"LibDiamondCut: Can\'t add function that already exists\\");\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        require(_facetAddress != address(0), \\"LibDiamondCut: Add facet can\'t be address(0)\\");\\n        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);\\n        // add new facet address if it does not exist\\n        if (selectorPosition == 0) {\\n            addFacet(ds, _facetAddress);\\n        }\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            require(oldFacetAddress != _facetAddress, \\"LibDiamondCut: Can\'t replace function with same function\\");\\n            removeFunction(ds, oldFacetAddress, selector);\\n            addFunction(ds, selector, selectorPosition, _facetAddress);\\n            selectorPosition++;\\n        }\\n    }\\n\\n    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {\\n        require(_functionSelectors.length > 0, \\"LibDiamondCut: No selectors in facet to cut\\");\\n        DiamondStorage storage ds = diamondStorage();\\n        // if function does not exist then do nothing and return\\n        require(_facetAddress == address(0), \\"LibDiamondCut: Remove facet address must be address(0)\\");\\n        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {\\n            bytes4 selector = _functionSelectors[selectorIndex];\\n            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;\\n            removeFunction(ds, oldFacetAddress, selector);\\n        }\\n    }\\n\\n    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {\\n        enforceHasContractCode(_facetAddress, \\"LibDiamondCut: New facet has no code\\");\\n        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;\\n        ds.facetAddresses.push(_facetAddress);\\n    }    \\n\\n\\n    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {\\n        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);\\n        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;\\n    }\\n\\n    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        \\n        require(_facetAddress != address(0), \\"LibDiamondCut: Can\'t remove function that doesn\'t exist\\");\\n        // an immutable function is a function defined directly in a diamond\\n        require(_facetAddress != address(this), \\"LibDiamondCut: Can\'t remove immutable function\\");\\n        // replace selector with last selector, then delete last selector\\n        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;\\n        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;\\n        // if not the same then replace _selector with lastSelector\\n        if (selectorPosition != lastSelectorPosition) {\\n            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];\\n            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;\\n            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);\\n        }\\n        // delete the last selector\\n        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();\\n        delete ds.selectorToFacetAndPosition[_selector];\\n\\n        // if no more selectors for facet address then delete the facet address\\n        if (lastSelectorPosition == 0) {\\n            // replace facet address with last facet address and delete last facet address\\n            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;\\n            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n            if (facetAddressPosition != lastFacetAddressPosition) {\\n                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];\\n                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;\\n                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;\\n            }\\n            ds.facetAddresses.pop();\\n            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;\\n        }\\n    }\\n\\n    function initializeDiamondCut(address _init, bytes memory _calldata) internal {\\n        if (_init == address(0)) {\\n            require(_calldata.length == 0, \\"LibDiamondCut: _init is address(0) but_calldata is not empty\\");\\n        } else {\\n            require(_calldata.length > 0, \\"LibDiamondCut: _calldata is empty but _init is not address(0)\\");\\n            if (_init != address(this)) {\\n                enforceHasContractCode(_init, \\"LibDiamondCut: _init address has no code\\");\\n            }\\n            (bool success, bytes memory error) = _init.delegatecall(_calldata);\\n            if (!success) {\\n                if (error.length > 0) {\\n                    // bubble up the error\\n                    revert(string(error));\\n                } else {\\n                    revert(\\"LibDiamondCut: _init function reverted\\");\\n                }\\n            }\\n        }\\n    }\\n\\n    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {\\n        uint256 contractSize;\\n        assembly {\\n            contractSize := extcodesize(_contract)\\n        }\\n        require(contractSize > 0, _errorMessage);\\n    }\\n}\\n","keccak256":"0x2205345e83eb86f5281f159a9215a096cb6d404782619f9b8e9d7a4a46c32a37","license":"MIT"}},"version":1}',
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
