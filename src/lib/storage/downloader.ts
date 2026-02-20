export async function downloadByRootHash(
	rootHash: string,
	storageRpc: string,
): Promise<[ArrayBuffer | null, Error | null]> {
	try {
		if (!rootHash?.trim()) {
			return [null, new Error('Root hash is required')]
		}
		const url = `${storageRpc.replace(/\/$/, '')}/file?root=${encodeURIComponent(rootHash.trim())}`
		const response = await fetch(url)
		const contentType = response.headers.get('content-type')
		const isJson =
			contentType != null && contentType.includes('application/json')
		if (isJson) {
			const json = (await response.json()) as { code?: number; message?: string }
			if (!response.ok || json.code != null) {
				if (json.code === 101) {
					const truncated =
						rootHash.length > 20
							? `${rootHash.slice(0, 10)}...${rootHash.slice(-10)}`
							: rootHash
					return [
						null,
						new Error(
							`File not found: "${truncated}" does not exist in storage or may be on a different network`,
						),
					]
				}
				return [
					null,
					new Error(`Download failed: ${json.message ?? 'Unknown error'}`),
				]
			}
		}
		if (!response.ok) {
			const text = await response.text()
			return [
				null,
				new Error(`Download failed (${response.status}): ${text}`),
			]
		}
		const fileData = await response.arrayBuffer()
		if (!fileData || fileData.byteLength === 0) {
			return [null, new Error('Downloaded file is empty')]
		}
		return [fileData, null]
	} catch (error) {
		return [null, error instanceof Error ? error : new Error(String(error))]
	}
}

export function downloadBlobAsFile(fileData: ArrayBuffer, fileName: string): void {
	if (!fileData || fileData.byteLength === 0) {
		throw new Error('File data is empty')
	}
	const blob = new Blob([new Uint8Array(fileData)])
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = fileName || `download-${Date.now()}.bin`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}
