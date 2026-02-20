import { Indexer, type Blob as ZgBlob } from '@0glabs/0g-ts-sdk'
import type { Signer } from 'ethers'

export type UploadResult = { txHash: string; rootHash: string }

export async function uploadToStorage(
	blob: ZgBlob,
	storageRpc: string,
	l1Rpc: string,
	signer: Signer,
): Promise<[UploadResult | null, Error | null]> {
	try {
		const indexer = new Indexer(storageRpc)
		const [result, err] = await indexer.upload(blob, l1Rpc, signer, {
			taskSize: 10,
			expectedReplica: 1,
			finalityRequired: true,
			tags: '0x',
			skipTx: false,
			fee: BigInt(0),
		})
		if (err !== null) return [null, err]
		return [result, null]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}
