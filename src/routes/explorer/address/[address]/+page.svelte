<script lang="ts">
	let { data } = $props()

	const address = $derived(data?.address ?? '')
	const balance = $derived(data?.balance as bigint | null | undefined)
	const nonce = $derived(data?.nonce as number | null | undefined)
	const chainId = $derived(data?.chainId ?? 0)
	const error = $derived(data?.error as string | null | undefined)
</script>

<svelte:head>
	<title>Address {address.slice(0, 10)}… · Explorer · 0GUI</title>
</svelte:head>

<main class="mx-auto max-w-3xl p-4">
	<nav class="mb-4 text-sm">
		<a href="/explorer" class="text-primary hover:underline">Explorer</a>
		<span class="text-muted-foreground"> / Address</span>
	</nav>
	{#if error}
		<p class="text-destructive">{error}</p>
	{:else}
		<h1 class="text-xl font-semibold">Address</h1>
		<dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
			<dt class="text-muted-foreground">Address</dt>
			<dd class="font-mono text-xs break-all">{address}</dd>
			<dt class="text-muted-foreground">Balance</dt>
			<dd>{balance != null ? balance.toString() : '—'} wei</dd>
			<dt class="text-muted-foreground">Nonce</dt>
			<dd>{nonce != null ? nonce : '—'}</dd>
		</dl>
	{/if}
</main>
