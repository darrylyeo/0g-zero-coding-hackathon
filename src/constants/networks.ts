export enum Network {
	OgTestnet = 'OgTestnet',
	OgMainnet = 'OgMainnet',
}

export const networks = [
	{
		type: Network.OgTestnet,
		chainId: 16602,
		name: '0G Testnet',
		nativeCurrency: { symbol: 'OG', name: 'OG', decimals: 18 },
		explorerUrl: 'https://chainscan-galileo.0g.ai',
	},
	{
		type: Network.OgMainnet,
		chainId: 16661,
		name: '0G Mainnet',
		nativeCurrency: { symbol: 'OG', name: 'OG', decimals: 18 },
		explorerUrl: 'https://chainscan.0g.ai',
	},
] as const

export const networkByChainId = Object.fromEntries(
	networks.map((n) => [n.chainId, n]),
) as Record<number, (typeof networks)[number]>

export const ogTestnet = networks.find((n) => n.type === Network.OgTestnet)!
