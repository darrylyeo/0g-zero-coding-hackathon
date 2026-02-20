import { Blob as ZgBlob } from '@0glabs/0g-ts-sdk'
import type { MerkleTree } from '@0glabs/0g-ts-sdk'

export function createBlob(file: File): ZgBlob {
	return new ZgBlob(file)
}

export async function generateMerkleTree(
	blob: ZgBlob,
): Promise<[MerkleTree | null, Error | null]> {
	try {
		const [tree, treeErr] = await blob.merkleTree()
		if (treeErr !== null || !tree) {
			return [null, treeErr ?? new Error('Unknown error generating Merkle tree')]
		}
		return [tree, null]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}

export function getRootHash(tree: MerkleTree): [string | null, Error | null] {
	try {
		const hash = tree.rootHash()
		if (!hash) return [null, new Error('Failed to get root hash')]
		return [hash, null]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}

export async function createSubmission(
	blob: ZgBlob,
): Promise<[unknown | null, Error | null]> {
	try {
		const [submission, submissionErr] = await blob.createSubmission('0x')
		if (submissionErr !== null || submission === null) {
			return [null, submissionErr ?? new Error('Unknown error creating submission')]
		}
		return [submission, null]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}
