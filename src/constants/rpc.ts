import { Network, networks } from '$/constants/networks'

export const rpcEndpoints = [
	{
		chainId: networks.find((n) => n.type === Network.OgTestnet)!.chainId,
		url: 'https://evmrpc-testnet.0g.ai',
	},
	{
		chainId: networks.find((n) => n.type === Network.OgMainnet)!.chainId,
		url: 'https://evmrpc.0g.ai',
	},
] as const

export const rpcEndpointsByChainId = Map.groupBy(rpcEndpoints, (e) => e.chainId)
