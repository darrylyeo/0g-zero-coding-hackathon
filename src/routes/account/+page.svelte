<script lang="ts">
	import { ethers } from 'ethers'
	import { createBrokerFromProvider } from '$/lib/broker-client'
	import AccountSelect from '$/components/account-select.svelte'
	import { models, modelByAddress } from '$/constants/models'
	import { ogMinGasPrice, ogTestnet } from '$/constants/networks'

	// Types/constants
	type LedgerRow = { user: string; availableBalance: string; totalBalance: string; additionalInfo: string }
	type DetailRow = { ledgerInfo: string[]; infers: [string, string, string][]; fines: [string, string, string][] | null }
	type AccountDetail = { ledger: LedgerRow; detail: DetailRow }

	const explorerBase = ogTestnet.explorerUrl
	function explorerAddress(address: string) {
		return `${explorerBase}/address/${address}`
	}

	function serializeBigInts<T>(x: T): T {
		if (x === null || x === undefined) return x
		if (typeof x === 'bigint') return String(x) as T
		if (Array.isArray(x)) return x.map(serializeBigInts) as T
		if (typeof x === 'object') {
			const out: Record<string, unknown> = {}
			for (const k of Object.keys(x as object))
				out[k] = serializeBigInts((x as Record<string, unknown>)[k])
			return out as T
		}
		return x
	}

	// State
	let provider = $state<import('$lib/eip6963').EIP1193Provider | null>(null)
	let detail = $state<AccountDetail | null>(null)
	let error = $state<string | null>(null)
	let busy = $state<string | null>(null)
	let addAmount = $state('5')
	let transferProvider = $state(models[0].contract.address)
	let transferAmount = $state('1')

	async function load(p: import('$lib/eip6963').EIP1193Provider) {
		error = null
		try {
			const broker = await createBrokerFromProvider(p)
			if (!broker) {
				error = 'Switch to 0G Galileo testnet in your wallet'
				detail = null
				return
			}
			const [ledger, rawDetail] = await Promise.all([
				broker.ledger.getLedger(),
				broker.ledger.ledger.getLedgerWithDetail(),
			])
			detail = {
				ledger: serializeBigInts(ledger) as LedgerRow,
				detail: serializeBigInts(rawDetail) as DetailRow,
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
			detail = null
		}
	}

	$effect(() => {
		const p = provider
		if (!p) {
			detail = null
			error = null
			return
		}
		let cancelled = false
		load(p).then(() => {
			if (cancelled) detail = null
		})
		return () => {
			cancelled = true
		}
	})

	async function doAddLedger() {
		const amount = Number(addAmount)
		if (!Number.isFinite(amount) || amount < 3 || !provider) return
		busy = 'add'
		error = null
		try {
			const broker = await createBrokerFromProvider(provider)
			if (!broker) throw new Error('Switch to 0G Galileo testnet')
			await broker.ledger.addLedger(amount, ogMinGasPrice)
			await load(provider)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			busy = null
		}
	}

	async function doTransfer() {
		const amount = Number(transferAmount)
		if (!Number.isFinite(amount) || amount < 1 || !transferProvider || !provider) return
		busy = 'transfer'
		error = null
		try {
			const broker = await createBrokerFromProvider(provider)
			if (!broker) throw new Error('Switch to 0G Galileo testnet')
			await broker.ledger.transferFund(
				transferProvider,
				'inference',
				ethers.parseEther(amount.toString()),
				ogMinGasPrice,
			)
			await load(provider)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			busy = null
		}
	}

	async function doAcknowledge(providerAddress: string) {
		if (!provider) return
		busy = `ack-${providerAddress}`
		error = null
		try {
			const broker = await createBrokerFromProvider(provider)
			if (!broker) throw new Error('Switch to 0G Galileo testnet')
			await broker.inference.acknowledgeProviderSigner(providerAddress)
			await load(provider)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			busy = null
		}
	}

	async function doWithdraw() {
		if (!provider) return
		busy = 'withdraw'
		error = null
		try {
			const broker = await createBrokerFromProvider(provider)
			if (!broker) throw new Error('Switch to 0G Galileo testnet')
			await broker.ledger.retrieveFund('inference', ogMinGasPrice)
			await load(provider)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			busy = null
		}
	}

	function weiToOg(wei: string) {
		const n = Number(wei) / 1e18
		return Number.isFinite(n) ? n.toFixed(4) : wei
	}
</script>

<svelte:head>
	<title>Account · 0GUI</title>
</svelte:head>

<main class="flex min-h-0 flex-1 flex-col overflow-hidden">
	<header class="shrink-0 border-b border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
		<div class="mx-auto flex max-w-3xl items-center justify-between gap-4">
			<h1 class="text-base font-semibold">Account</h1>
			<AccountSelect bind:provider />
		</div>
	</header>

	<section class="min-h-0 flex-1 overflow-y-auto" aria-label="Ledger and balances">
		<div class="mx-auto max-w-3xl px-6 py-8">
			{#if error}
				<div class="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{error}
				</div>
			{/if}

			{#if detail}
				{@const ledger = detail.ledger}
				{@const infers = detail.detail?.infers ?? []}
				<div class="space-y-8">
					<section>
						<h2 class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Your ledger</h2>
						<p class="mb-2 text-xs text-muted-foreground">Pooled balance; transfer to a model to use it in chat.</p>
						<dl class="grid gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4 text-sm shadow-sm">
							<div class="flex justify-between gap-4">
								<dt class="text-muted-foreground">Address</dt>
								<dd class="font-mono text-xs">
									<a
										href={explorerAddress(ledger.user)}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary underline underline-offset-2 hover:opacity-80"
									>
										{ledger.user.slice(0, 10)}…{ledger.user.slice(-8)}
									</a>
								</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="text-muted-foreground">Available</dt>
								<dd class="tabular-nums font-medium">{weiToOg(ledger.availableBalance)} 0G</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="text-muted-foreground">Total</dt>
								<dd class="tabular-nums">{weiToOg(ledger.totalBalance)} 0G</dd>
							</div>
						</dl>
					</section>

					<section>
						<h2 class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Funds per model</h2>
						<p class="mb-2 text-xs text-muted-foreground">0G available for each model when you chat.</p>
						<div class="overflow-hidden rounded-xl border border-border shadow-sm">
							<table class="w-full table-auto border-collapse text-sm">
								<thead>
									<tr class="border-b border-border bg-muted/40 text-left text-muted-foreground">
										<th class="px-4 py-3 font-medium">Model</th>
										<th class="px-4 py-3 text-right font-medium">Available (0G)</th>
										<th class="w-24 px-4 py-3"></th>
									</tr>
								</thead>
								<tbody>
									{#each infers as row}
										{@const [providerAddress, bal0, bal1] = row}
										{@const model = modelByAddress[providerAddress]}
										{@const og = weiToOg(bal0)}
										<tr class="border-b border-border/60 transition-colors hover:bg-muted/20 last:border-b-0">
											<td class="px-4 py-3">
												<a
													href={explorerAddress(providerAddress)}
													target="_blank"
													rel="noopener noreferrer"
													class="text-primary underline underline-offset-2 hover:opacity-80"
												>
													{model?.name ?? providerAddress.slice(0, 10)}…
												</a>
											</td>
											<td class="px-4 py-3 text-right tabular-nums">{og}</td>
											<td class="px-4 py-3">
												<button
													type="button"
													class="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
													disabled={busy != null}
													onclick={() => doAcknowledge(providerAddress)}
												>
													Acknowledge
												</button>
											</td>
										</tr>
									{:else}
										<tr>
											<td colspan="3" class="px-4 py-8 text-center text-muted-foreground">
												No funds for any model yet. Transfer 0G below.
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</section>

					<section>
						<h2 class="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</h2>
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<div class="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
								<label for="add-amount" class="text-sm font-medium">Add to ledger</label>
								<p class="text-xs text-muted-foreground">Min 3 0G. Funds your ledger.</p>
								<div class="mt-auto flex flex-wrap items-center gap-2">
									<input
										id="add-amount"
										type="number"
										min="3"
										step="1"
										class="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
										bind:value={addAmount}
									/>
									<button
										type="button"
										class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
										disabled={busy != null}
										onclick={doAddLedger}
									>
										{busy === 'add' ? '…' : 'Add'}
									</button>
								</div>
							</div>
							<div class="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
								<label for="transfer-provider" class="text-sm font-medium">Transfer to model</label>
								<p class="text-xs text-muted-foreground">Send 0G so this model has funds when you chat.</p>
								<div class="mt-auto flex flex-wrap items-center gap-2">
									<select
										id="transfer-provider"
										class="min-w-[11rem] rounded-lg border border-input bg-background px-3 py-2 text-sm"
										bind:value={transferProvider}
									>
										{#each models as m}
											<option value={m.contract.address}>{m.name}</option>
										{/each}
									</select>
									<input
										type="number"
										min="1"
										step="0.1"
										class="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm"
										bind:value={transferAmount}
									/>
									<span class="text-xs text-muted-foreground">0G</span>
									<button
										type="button"
										class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
										disabled={busy != null}
										onclick={doTransfer}
									>
										{busy === 'transfer' ? '…' : 'Transfer'}
									</button>
								</div>
							</div>
							<div class="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
								<span class="text-sm font-medium">Withdraw</span>
								<p class="text-xs text-muted-foreground">Return provider balances to the ledger.</p>
								<div class="mt-auto">
									<button
										type="button"
										class="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/60 disabled:opacity-50 sm:w-auto"
										disabled={busy != null || infers.length === 0}
										onclick={doWithdraw}
									>
										{busy === 'withdraw' ? '…' : 'Withdraw to ledger'}
									</button>
								</div>
							</div>
						</div>
					</section>

					<p class="text-xs leading-relaxed text-muted-foreground">
						Ledger = your pool. Transfer 0G to a model so that model has funds when you chat.
					</p>
				</div>
			{:else if !provider}
				<p class="text-muted-foreground">Connect a wallet to view and manage your ledger.</p>
			{:else if !error}
				<p class="text-muted-foreground">Loading account…</p>
			{/if}

			{#if error && !detail}
				<section class="rounded-xl border border-border bg-card p-6 shadow-sm">
					<h2 class="mb-2 text-sm font-medium">Create ledger</h2>
					<p class="mb-4 text-xs text-muted-foreground">Add at least 3 0G to create your ledger.</p>
					<div class="flex flex-wrap items-center gap-3">
						<input
							id="add-amount-init"
							type="number"
							min="3"
							step="1"
							class="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm"
							bind:value={addAmount}
						/>
						<span class="text-xs text-muted-foreground">0G</span>
						<button
							type="button"
							class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
							disabled={busy != null}
							onclick={doAddLedger}
						>
							{busy === 'add' ? '…' : 'Add ledger'}
						</button>
					</div>
				</section>
			{/if}
		</div>
	</section>
</main>
