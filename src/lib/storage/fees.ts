import {
	calculatePrice,
	getMarketContract,
	FixedPriceFlow__factory,
} from '@0glabs/0g-ts-sdk'
import {
	BrowserProvider,
	type Contract,
	type ContractRunner,
	type Signer,
	formatEther,
} from 'ethers'

export type FeeInfo = {
	storageFee: string
	estimatedGas: string
	totalFee: string
	rawStorageFee: bigint
	rawGasFee: bigint
	rawTotalFee: bigint
	isLoading?: boolean
}

declare global {
	interface Window {
		ethereum?: unknown
	}
}

export async function getProvider(): Promise<
	[BrowserProvider | null, Error | null]
> {
	try {
		if (typeof window === 'undefined' || !window.ethereum) {
			return [null, new Error('No Ethereum provider found')]
		}
		return [
			new BrowserProvider(window.ethereum as import('ethers').Eip1193Provider),
			null,
		]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}

export async function getSigner(
	provider: BrowserProvider,
): Promise<[Signer | null, Error | null]> {
	try {
		const signer = await provider.getSigner()
		return [signer, null]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}

export function getFlowContract(flowAddress: string, signer: Signer): Contract {
	return FixedPriceFlow__factory.connect(
		flowAddress,
		signer as Parameters<typeof FixedPriceFlow__factory.connect>[1],
	) as unknown as Contract
}

export async function calculateFees(
	submission: unknown,
	flowContract: Contract,
	provider: BrowserProvider,
): Promise<[FeeInfo | null, Error | null]> {
	try {
		const marketAddr = await flowContract.market()
		const market = getMarketContract(
			marketAddr as string,
			provider as unknown as ContractRunner,
		)
		const pricePerSector = await market.pricePerSector()
		const storageFee = calculatePrice(
			submission as Parameters<typeof calculatePrice>[0],
			pricePerSector as Parameters<typeof calculatePrice>[1],
		) as bigint
		const feeData = await provider.getFeeData()
		const gasPrice = feeData.gasPrice ?? BigInt(0)
		let gasEstimate: bigint
		try {
			gasEstimate = await flowContract.submit.estimateGas(submission, {
				value: storageFee,
			})
		} catch {
			gasEstimate = BigInt(500000)
		}
		const estimatedGasFee = gasEstimate * gasPrice
		const totalFee = storageFee + estimatedGasFee
		return [
			{
				storageFee: formatEther(storageFee),
				estimatedGas: formatEther(estimatedGasFee),
				totalFee: formatEther(totalFee),
				rawStorageFee: storageFee,
				rawGasFee: estimatedGasFee,
				rawTotalFee: totalFee,
				isLoading: false,
			},
			null,
		]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}
