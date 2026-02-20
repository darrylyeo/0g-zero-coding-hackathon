<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from 'bits-ui'
	import { cn } from '$/lib/utils'

	let {
		class: className,
		...restProps
	}: CollapsiblePrimitive.TriggerProps = $props()
</script>

<CollapsiblePrimitive.Trigger
	data-slot="collapsible-trigger"
	class={cn(
		'flex flex-1 items-center justify-between rounded-md py-2 font-medium transition-colors hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180',
		className,
	)}
	{...restProps}
/>
