export const rpcEndpoints = [
	{ chainId: 16602, url: 'https://evmrpc-testnet.0g.ai' },
	{ chainId: 16661, url: 'https://evmrpc.0g.ai' },
] as const

export const rpcEndpointsByChainId = Map.groupBy(rpcEndpoints, (e) => e.chainId)
