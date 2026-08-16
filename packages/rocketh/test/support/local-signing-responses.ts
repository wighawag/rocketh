/**
 * The RPC methods rocketh calls to PREPARE a locally-signed transaction.
 *
 * A `signerOnly` account (what the `privateKey` protocol and hardware/HSM protocols return)
 * signs without the node, so rocketh fills `nonce`, `gas` and the fees itself before handing the
 * transaction over. Any test that broadcasts from such an account has to answer these three.
 *
 * It lives HERE, in `rocketh`'s own test folder, rather than in `@rocketh/test-utils` where a
 * shared fixture would normally go: `@rocketh/test-utils` depends on `rocketh`, so importing it
 * from these tests closes a cycle in the nx project graph. Several suites in this package say so
 * in their own headers, which is why they hand-roll small provider stubs at all. Sharing the
 * block within the package gets the deduplication without the cycle.
 *
 * `eth_feeHistory` returns one reward entry PER REQUESTED PERCENTILE, which is what the JSON-RPC
 * spec requires and what rocketh's estimator indexes. A single entry per block makes it read
 * `undefined` and fail as "Cannot mix BigInt and other types", a long way from the cause.
 */
export const LOCAL_SIGNING_RPC_RESPONSES: Record<string, () => unknown> = {
	eth_getTransactionCount: () => '0x0',
	eth_estimateGas: () => '0x5208',
	eth_feeHistory: () => ({
		oldestBlock: '0x1',
		baseFeePerGas: ['0x1', '0x1'],
		gasUsedRatio: [0.5],
		reward: [['0x1', '0x1', '0x1']],
	}),
};
