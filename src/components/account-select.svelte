<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$/components/ui/popover'
	import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '$/components/ui/command'
	import { Button } from '$/components/ui/button'
	import { initEIP6963, providersStore } from '$/lib/eip6963'
	import type { EIP1193Provider, EIP6963ProviderDetail } from '$/lib/eip6963'
	import { cn } from '$/lib/utils'
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down'

	let { provider = $bindable(null), class: className }: { provider?: EIP1193Provider | null; class?: string } = $props()

	let open = $state(false)
	let selected = $state<EIP6963ProviderDetail | null>(null)
	let search = $state('')

	$effect(() => {
		initEIP6963()
	})

	$effect(() => {
		if (selected) provider = selected.provider
		else provider = null
	})
	$effect(() => {
		if (provider == null && selected != null) selected = null
	})

	function select(detail: EIP6963ProviderDetail) {
		selected = detail
		open = false
	}

	const providers = $derived($providersStore)
	const filtered = $derived(
		search.trim() === ''
			? providers
			: providers.filter((p) =>
					p.info.name.toLowerCase().includes(search.toLowerCase().trim()),
				),
	)
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				role="combobox"
				aria-expanded={open}
				aria-label="Wallet"
				class={cn('w-auto min-w-[8rem] justify-between', className)}
			>
				{#if selected}
					<span class="flex items-center gap-2 truncate">
						<img
							alt=""
							class="size-5 shrink-0 rounded-full"
							src={selected.info.icon}
						/>
						<span class="truncate">{selected.info.name}</span>
					</span>
				{:else}
					<span class="text-muted-foreground">Select wallet</span>
				{/if}
				<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-[200px] p-0" align="start">
		<Command bind:value={search}>
			<CommandInput placeholder="Search wallet..." />
			<CommandList>
				<CommandEmpty>No wallet found.</CommandEmpty>
				<CommandGroup>
					{#each filtered as detail (detail.info.uuid)}
						<CommandItem
							value={detail.info.name}
							onSelect={() => select(detail)}
						>
							<img
								alt=""
								class="mr-2 size-5 shrink-0 rounded-full"
								src={detail.info.icon}
							/>
							<span class="truncate">{detail.info.name}</span>
						</CommandItem>
					{/each}
				</CommandGroup>
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>
