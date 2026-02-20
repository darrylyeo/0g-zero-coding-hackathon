<script lang="ts">
	import {
		StorageNetwork,
		STORAGE_NETWORKS,
		getStorageNetworkConfig,
	} from '$/constants/storage-networks'
	import {
		createBlob,
		generateMerkleTree,
		getRootHash,
		createSubmission,
	} from '$/lib/storage/blob'
	import {
		getProvider,
		getSigner,
		getFlowContract,
		calculateFees,
		type FeeInfo,
	} from '$/lib/storage/fees'
	import { uploadToStorage, type UploadResult } from '$/lib/storage/uploader'
	import {
		downloadByRootHash,
		downloadBlobAsFile,
	} from '$/lib/storage/downloader'
	import { Button } from '$/components/ui/button'

	let network = $state<StorageNetwork>(StorageNetwork.Turbo)
	let walletAddress = $state<string | null>(null)
	let connecting = $state(false)
	let connectError = $state<string | null>(null)

	let selectedFile = $state<File | null>(null)
	let feeInfo = $state<FeeInfo | null>(null)
	let feeError = $state<string | null>(null)
	let uploading = $state(false)
	let uploadResult = $state<UploadResult | null>(null)
	let uploadError = $state<string | null>(null)

	let downloadRootHash = $state('')
	let downloadFileName = $state('')
	let downloading = $state(false)
	let downloadError = $state<string | null>(null)

	const networkConfig = $derived(getStorageNetworkConfig(network))

	async function connectWallet() {
		connecting = true
		connectError = null
		try {
			const [provider, provErr] = await getProvider()
			if (provErr ?? !provider) {
				connectError = provErr?.message ?? 'No provider'
				return
			}
			const [signer, signErr] = await getSigner(provider)
			if (signErr ?? !signer) {
				connectError = signErr?.message ?? 'No signer'
				return
			}
			const addr = await (signer as { getAddress: () => Promise<string> }).getAddress()
			walletAddress = addr
		} finally {
			connecting = false
		}
	}

	function disconnectWallet() {
		walletAddress = null
		connectError = null
		feeInfo = null
		feeError = null
		uploadResult = null
		uploadError = null
	}

	async function onFileSelect(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		selectedFile = file ?? null
		feeInfo = null
		feeError = null
		uploadResult = null
		uploadError = null
		if (!file || !walletAddress) return
		try {
			const [provider] = await getProvider()
			if (!provider) return
			const [signer] = await getSigner(provider)
			if (!signer) return
			const blob = createBlob(file)
			const [tree, treeErr] = await generateMerkleTree(blob)
			if (treeErr ?? !tree) {
				feeError = treeErr?.message ?? 'Merkle tree failed'
				return
			}
			const [submission, subErr] = await createSubmission(blob)
			if (subErr ?? !submission) {
				feeError = subErr?.message ?? 'Submission failed'
				return
			}
			const flowContract = getFlowContract(
				networkConfig.flowAddress,
				signer,
			)
			const [info, feeErr] = await calculateFees(
				submission,
				flowContract,
				provider,
			)
			if (feeErr) {
				feeError = feeErr.message
				return
			}
			feeInfo = info
		} catch (err) {
			feeError = err instanceof Error ? err.message : String(err)
		}
	}

	async function upload() {
		if (!selectedFile || !walletAddress) return
		uploading = true
		uploadError = null
		try {
			const [provider] = await getProvider()
			if (!provider) {
				uploadError = 'Wallet not connected'
				return
			}
			const [signer] = await getSigner(provider)
			if (!signer) {
				uploadError = 'No signer'
				return
			}
			const blob = createBlob(selectedFile)
			const [result, err] = await uploadToStorage(
				blob,
				networkConfig.storageRpc,
				networkConfig.l1Rpc,
				signer,
			)
			if (err) {
				uploadError = err.message
				return
			}
			uploadResult = result
		} finally {
			uploading = false
		}
	}

	async function download() {
		const root = downloadRootHash.trim()
		if (!root) {
			downloadError = 'Enter a root hash'
			return
		}
		downloading = true
		downloadError = null
		try {
			const [data, err] = await downloadByRootHash(root, networkConfig.storageRpc)
			if (err) {
				downloadError = err.message
				return
			}
			if (!data) return
			const name =
				downloadFileName.trim() || `download-${root.slice(0, 10)}.bin`
			downloadBlobAsFile(data, name)
		} finally {
			downloading = false
		}
	}

	function copyRootHash() {
		if (!uploadResult?.rootHash) return
		navigator.clipboard.writeText(uploadResult.rootHash)
	}
</script>

<svelte:head>
	<title>Storage · 0GUI</title>
</svelte:head>

<main class="mx-auto flex max-w-2xl flex-col gap-6 p-4">
	<header class="flex flex-wrap items-center gap-3">
		<h1 class="text-xl font-semibold">0G Storage</h1>
		<div class="flex items-center gap-2">
			<select
				class="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
				bind:value={network}
				aria-label="Network"
			>
				{#each STORAGE_NETWORKS as n}
					<option value={n.type}>{n.name}</option>
				{/each}
			</select>
			{#if walletAddress}
				<span
					class="max-w-32 truncate rounded-md bg-muted px-2 py-1 text-xs"
					title={walletAddress}
				>
					{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
				</span>
				<Button variant="outline" size="sm" onclick={disconnectWallet}>
					Disconnect
				</Button>
			{:else}
				<Button
					variant="default"
					size="sm"
					disabled={connecting}
					onclick={connectWallet}
				>
					{connecting ? 'Connecting…' : 'Connect wallet'}
				</Button>
			{/if}
		</div>
	</header>
	{#if connectError}
		<p class="text-sm text-destructive">{connectError}</p>
	{/if}

	<section class="rounded-lg border border-border p-4">
		<h2 class="mb-3 text-sm font-medium">Upload</h2>
		{#if !walletAddress}
			<p class="text-sm text-muted-foreground">
				Connect a wallet to upload. Use the <a
					href="https://faucet.0g.ai/"
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary underline"
				>testnet faucet</a> for A0GI.
			</p>
		{:else}
			<div class="flex flex-col gap-3">
				<input
					type="file"
					class="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
					accept="*"
					onchange={onFileSelect}
				/>
				{#if feeInfo}
					<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
						<dt class="text-muted-foreground">Storage</dt>
						<dd>{feeInfo.storageFee} A0GI</dd>
						<dt class="text-muted-foreground">Est. gas</dt>
						<dd>{feeInfo.estimatedGas} A0GI</dd>
						<dt class="text-muted-foreground font-medium">Total</dt>
						<dd class="font-medium">{feeInfo.totalFee} A0GI</dd>
					</dl>
					<Button
						disabled={uploading}
						onclick={upload}
					>
						{uploading ? 'Uploading…' : 'Upload'}
					</Button>
				{/if}
				{#if feeError}
					<p class="text-sm text-destructive">{feeError}</p>
				{/if}
				{#if uploadResult}
					<div class="rounded-md bg-muted/50 p-3 text-sm">
						<p class="font-medium">Upload complete</p>
						<p class="mt-1">
							Tx: <a
								href={networkConfig.explorerUrl + uploadResult.txHash}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary underline"
							>{uploadResult.txHash.slice(0, 10)}…</a>
							<button
								type="button"
								class="ms-1 text-primary underline"
								onclick={copyRootHash}
							>Copy root hash</button>
						</p>
						<code class="mt-1 block break-all text-xs">{uploadResult.rootHash}</code>
					</div>
				{/if}
				{#if uploadError}
					<p class="text-sm text-destructive">{uploadError}</p>
				{/if}
			</div>
		{/if}
	</section>

	<section class="rounded-lg border border-border p-4">
		<h2 class="mb-3 text-sm font-medium">Download</h2>
		<div class="flex flex-col gap-3">
			<div>
				<label for="storage-root" class="block text-xs text-muted-foreground">Root hash</label>
				<input
					id="storage-root"
					type="text"
					class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					placeholder="0x…"
					bind:value={downloadRootHash}
				/>
			</div>
			<div>
				<label for="storage-filename" class="block text-xs text-muted-foreground">File name (optional)</label>
				<input
					id="storage-filename"
					type="text"
					class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					placeholder="my-file.bin"
					bind:value={downloadFileName}
				/>
			</div>
			<Button
				variant="outline"
				disabled={downloading || !downloadRootHash.trim()}
				onclick={download}
			>
				{downloading ? 'Downloading…' : 'Download'}
			</Button>
			{#if downloadError}
				<p class="text-sm text-destructive">{downloadError}</p>
			{/if}
		</div>
	</section>

	<p class="text-xs text-muted-foreground">
		<a
			href="https://storagescan-galileo.0g.ai/"
			target="_blank"
			rel="noopener noreferrer"
			class="text-primary underline"
		>Storage Scan</a>
		·
		<a
			href="https://chainscan-galileo.0g.ai/"
			target="_blank"
			rel="noopener noreferrer"
			class="text-primary underline"
		>Chain Scan</a>
	</p>
</main>
