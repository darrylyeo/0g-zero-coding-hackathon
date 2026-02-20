export enum Network {
	OgTestnet = 'OgTestnet',
	OgMainnet = 'OgMainnet',
}

export const networks = [
	{ type: Network.OgTestnet, chainId: 16602, name: '0G Testnet' },
	{ type: Network.OgMainnet, chainId: 16661, name: '0G Mainnet' },
] as const

export const networkByChainId = Object.fromEntries(
	networks.map((n) => [n.chainId, n]),
) as Record<number, (typeof networks)[number]>
