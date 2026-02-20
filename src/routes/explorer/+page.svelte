<script lang="ts">
	import { eq } from '@tanstack/db'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
	import { networks } from '$/constants/networks'
	import { models } from '$/constants/models'
	import {
		explorerPreferencesCollection,
		upsertExplorerPreferences,
	} from '$/lib/db/explorer-preferences'
	import {
		txExplanationId,
		txExplanationsCollection,
		upsertTxExplanation,
	} from '$/lib/db/tx-explanations'
	import {
		createExplorerClient,
		serializeTxForExplain,
	} from '$/lib/explorer-client'
	import AccountSelect from '$/components/account-select.svelte'
	import { Button } from '$/components/ui/button'
	import * as Collapsible from '$/components/ui/collapsible'
	import type { Block, Transaction } from 'viem'

	// Types/constants
	const BLOCK_COUNT = 10
	const FINISH_PREFIX = '9:0g_finish:'
	const providerAddress = models[0].contract.address

	// Context
	const prefsQuery = useLiveQuery((q) =>
		q
			.from({ p: explorerPreferencesCollection })
			.where(({ p }) => eq(p.id, 'default')),
	)
	const prefs = $derived(prefsQuery.data[0])
	const chainId = $derived(prefs?.chainId ?? networks[0].chainId)

	const explanationsQuery = useLiveQuery((q) =>
		q.from({ e: txExplanationsCollection }),
	)
	const explanationByKey = $derived(
		Object.fromEntries(
			explanationsQuery.data.map((e) => [e.id, e.explanation]),
		),
	)

	// State
	let provider = $state<import('$lib/eip6963').EIP1193Provider | null>(null)
	let blocks = $state<Block<bigint, true, 'latest'>[]>([])
	let latestBlockNumber = $state<bigint | null>(null)
	let streamingTxKey = $state<string | null>(null)
	let streamingText = $state('')
	let unwatch: (() => void) | null = null
	let client: ReturnType<typeof createExplorerClient> | null = null

	function setChainId(value: number) {
		upsertExplorerPreferences({ chainId: value })
	}

	async function fetchBlock(
		client: ReturnType<typeof createExplorerClient>,
		num: bigint,
	) {
		const block = await client.getBlock({
			blockNumber: num,
			includeTransactions: true,
		})
		return block as Block<bigint, true, 'latest'>
	}

	function parseStreamLine(line: string): string | null {
		const match = line.match(/^0:(.*)$/)
		if (!match) return null
		try {
			const parsed = JSON.parse(match[1]) as unknown
			if (Array.isArray(parsed) && parsed[0] === 'text' && typeof parsed[1] === 'string')
				return parsed[1]
		} catch {
			// ignore
		}
		return null
	}

	async function explainTx(
		tx: Transaction<bigint, number, boolean>,
		txChainId: number,
	) {
		const key = txExplanationId(txChainId, tx.hash)
		if (explanationByKey[key]) return
		streamingTxKey = key
		streamingText = ''
		try {
			const txPayload = serializeTxForExplain(tx)
			const res = await fetch('/explorer/explain/stream', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tx: txPayload, providerAddress }),
			})
			if (!res.body) throw new Error('No body')
			const reader = res.body.getReader()
			const dec = new TextDecoder()
			let buffer = ''
			let fullText = ''
			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				buffer += dec.decode(value, { stream: true })
				const lines = buffer.split('\n')
				buffer = lines.pop() ?? ''
				for (const line of lines) {
					if (line.startsWith(FINISH_PREFIX)) continue
					const text = parseStreamLine(line)
					if (text) {
						fullText += text
						streamingText = fullText
					}
				}
			}
			for (const line of buffer.split('\n')) {
				if (line.startsWith(FINISH_PREFIX)) continue
				const text = parseStreamLine(line)
				if (text) fullText += text
			}
			streamingText = fullText
			upsertTxExplanation({
				chainId: txChainId,
				txHash: tx.hash,
				explanation: fullText,
			})
		} catch (e) {
			streamingText =
				(e instanceof Error ? e.message : String(e))
		} finally {
			streamingTxKey = null
		}
	}

	function getExplanation(key: string): string | undefined {
		return explanationByKey[key]
	}

	$effect(() => {
		const cid = chainId
		if (unwatch) {
			unwatch()
			unwatch = null
		}
		client = null
		try {
			client = createExplorerClient(cid)
		} catch {
			return
		}
		const c = client
		unwatch = c.watchBlockNumber({
			emitOnBegin: true,
			pollingInterval: 4_000,
			onBlockNumber(num) {
				latestBlockNumber = num
				fetchBlock(c, num).then((block) => {
					blocks = [block, ...blocks].slice(0, BLOCK_COUNT)
				})
			},
		})
		return () => {
			if (unwatch) unwatch()
		}
	})

</script>

<svelte:head>
	<title>Block Explorer · 0GUI</title>
</svelte:head>

<main class="mx-auto flex max-w-3xl flex-col gap-4 p-4">
	<header class="flex flex-wrap items-center gap-3">
		<h1 class="text-xl font-semibold">Block Explorer</h1>
		<AccountSelect bind:provider />
		<select
			class="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
			value={chainId}
			onchange={(e) => setChainId(Number((e.target as HTMLSelectElement).value))}
			aria-label="Network"
		>
			{#each networks as net}
				<option value={net.chainId}>{net.name}</option>
			{/each}
		</select>
		{#if latestBlockNumber !== null}
			<span class="text-sm text-muted-foreground">
				Latest block: {latestBlockNumber.toString()}
			</span>
		{/if}
	</header>

	<ul class="flex flex-col gap-2">
		{#each blocks as block (block.hash ?? block.number?.toString() ?? '')}
			{@const txList = block.transactions as Transaction<bigint, number, boolean>[]}
			<li>
				<Collapsible.Root class="rounded-lg border border-border">
					<Collapsible.Trigger class="w-full px-3 py-2 text-left">
						<span class="font-medium">Block {block.number?.toString() ?? '—'}</span>
						<span class="ms-2 text-muted-foreground">
							{block.hash ? `${block.hash.slice(0, 10)}…` : ''}
							· {txList.length} txs
						</span>
						<ChevronDownIcon class="ms-2 inline-block size-4 transition-transform" />
					</Collapsible.Trigger>
					<Collapsible.Content class="px-3 pb-3 pt-0">
						<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
							<dt class="text-muted-foreground">Hash</dt>
							<dd class="font-mono text-xs">{block.hash ?? '—'}</dd>
							<dt class="text-muted-foreground">Timestamp</dt>
							<dd>{block.timestamp != null ? new Date(Number(block.timestamp) * 1000).toISOString() : '—'}</dd>
							<dt class="text-muted-foreground">Gas used</dt>
							<dd>{block.gasUsed?.toString() ?? '—'}</dd>
							<dt class="text-muted-foreground">Size</dt>
							<dd>{block.size?.toString() ?? '—'}</dd>
						</dl>
						<ul class="mt-3 flex flex-col gap-2">
							{#each txList as tx (tx.hash)}
								<li>
									<Collapsible.Root class="rounded-md border border-border bg-muted/30">
										<Collapsible.Trigger class="w-full px-3 py-2 text-left text-sm">
											<span class="font-mono">{tx.hash.slice(0, 18)}…</span>
											<ChevronDownIcon class="ms-2 inline-block size-4" />
										</Collapsible.Trigger>
										<Collapsible.Content class="px-3 pb-3 pt-0">
											<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
												<dt class="text-muted-foreground">Hash</dt>
												<dd class="font-mono text-xs break-all">{tx.hash}</dd>
												<dt class="text-muted-foreground">From</dt>
												<dd class="font-mono text-xs break-all">{tx.from}</dd>
												<dt class="text-muted-foreground">To</dt>
												<dd class="font-mono text-xs break-all">{tx.to ?? '—'}</dd>
												<dt class="text-muted-foreground">Value</dt>
												<dd>{tx.value?.toString() ?? '0'}</dd>
												<dt class="text-muted-foreground">Gas</dt>
												<dd>{tx.gas?.toString() ?? '—'}</dd>
											</dl>
											{@const key = txExplanationId(chainId, tx.hash)}
											{@const cached = getExplanation(key)}
											{@const isStreaming = streamingTxKey === key}
											<div class="mt-2">
												{#if cached}
													<p class="rounded bg-muted/50 p-2 text-sm">{cached}</p>
												{:else if isStreaming}
													<p class="rounded bg-muted/50 p-2 text-sm whitespace-pre-wrap">{streamingText || '…'}</p>
												{:else}
													<Button
														variant="outline"
														size="sm"
														onclick={() => explainTx(tx, chainId)}
													>
														Explain
													</Button>
												{/if}
											</div>
										</Collapsible.Content>
									</Collapsible.Root>
								</li>
							{/each}
						</ul>
					</Collapsible.Content>
				</Collapsible.Root>
			</li>
		{/each}
	</ul>
</main>
