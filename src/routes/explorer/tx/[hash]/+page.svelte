<script lang="ts">
	import type { Transaction } from 'viem'

	let { data } = $props()

	const tx = $derived(data?.tx as Transaction<bigint, number, boolean> | null | undefined)
	const hash = $derived(data?.hash ?? '')
	const chainId = $derived(data?.chainId ?? 0)
	const error = $derived(data?.error as string | null | undefined)
</script>

<svelte:head>
	<title>Tx {hash.slice(0, 18)}… · Explorer · 0GUI</title>
</svelte:head>

<main class="mx-auto max-w-3xl p-4">
	<nav class="mb-4 text-sm">
		<a href="/explorer" class="text-primary hover:underline">Explorer</a>
		<span class="text-muted-foreground"> / Transaction</span>
	</nav>
	{#if error}
		<p class="text-destructive">{error}</p>
	{:else if tx}
		<h1 class="text-xl font-semibold">Transaction</h1>
		<dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
			<dt class="text-muted-foreground">Hash</dt>
			<dd class="font-mono text-xs break-all">{tx.hash}</dd>
			<dt class="text-muted-foreground">Block</dt>
			<dd>
				{#if tx.blockNumber != null}
					<a
						href="/explorer/block/{tx.blockNumber}?chainId={chainId}"
						class="text-primary hover:underline"
					>
						{tx.blockNumber.toString()}
					</a>
				{:else}
					—
				{/if}
			</dd>
			<dt class="text-muted-foreground">From</dt>
			<dd class="font-mono text-xs break-all">
				<a href="/explorer/address/{tx.from}?chainId={chainId}" class="text-primary hover:underline">{tx.from}</a>
			</dd>
			<dt class="text-muted-foreground">To</dt>
			<dd class="font-mono text-xs break-all">
				{#if tx.to}
					<a href="/explorer/address/{tx.to}?chainId={chainId}" class="text-primary hover:underline">{tx.to}</a>
				{:else}
					—
				{/if}
			</dd>
			<dt class="text-muted-foreground">Value</dt>
			<dd>{tx.value?.toString() ?? '0'}</dd>
			<dt class="text-muted-foreground">Gas</dt>
			<dd>{tx.gas?.toString() ?? '—'}</dd>
			<dt class="text-muted-foreground">Gas price</dt>
			<dd>{tx.gasPrice?.toString() ?? '—'}</dd>
		</dl>
	{:else}
		<p class="text-muted-foreground">Loading transaction…</p>
	{/if}
</main>
