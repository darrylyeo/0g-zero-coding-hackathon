<script lang="ts">
	import type { Block, Transaction } from 'viem'

	let { data } = $props()

	const blockNumParam = $derived(data?.blockNum ?? '')
	const chainId = $derived(data?.chainId ?? 0)
	const block = $derived(data?.block as Block<bigint, true, 'latest'> | null | undefined)
	const error = $derived(data?.error as string | null | undefined)
</script>

<svelte:head>
	<title>Block {blockNumParam} · Explorer · 0GUI</title>
</svelte:head>

<main class="mx-auto max-w-3xl p-4">
	<nav class="mb-4 text-sm">
		<a href="/explorer" class="text-primary hover:underline">Explorer</a>
		<span class="text-muted-foreground"> / Block {blockNumParam}</span>
	</nav>
	{#if error}
		<p class="text-destructive">{error}</p>
	{:else if block}
		{@const txList = block.transactions as Transaction<bigint, number, boolean>[]}
		<h1 class="text-xl font-semibold">Block {block.number?.toString()}</h1>
		<dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
			<dt class="text-muted-foreground">Hash</dt>
			<dd class="font-mono text-xs break-all">{block.hash ?? '—'}</dd>
			<dt class="text-muted-foreground">Timestamp</dt>
			<dd>{block.timestamp != null ? new Date(Number(block.timestamp) * 1000).toISOString() : '—'}</dd>
			<dt class="text-muted-foreground">Gas used</dt>
			<dd>{block.gasUsed?.toString() ?? '—'}</dd>
			<dt class="text-muted-foreground">Size</dt>
			<dd>{block.size?.toString() ?? '—'}</dd>
		</dl>
		<h2 class="mt-6 text-lg font-medium">Transactions ({txList.length})</h2>
		<ul class="mt-2 flex flex-col gap-2">
			{#each txList as tx (tx.hash)}
				<li>
					<a
						href="/explorer/tx/{tx.hash}?chainId={chainId}"
						class="block rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm text-primary hover:underline"
					>
						{tx.hash}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-muted-foreground">Loading block…</p>
	{/if}
</main>
