<script lang="ts">
	import { Collapsible as CollapsiblePrimitive } from 'bits-ui'
	import { cn } from '$/lib/utils'

	let {
		class: className,
		...restProps
	}: CollapsiblePrimitive.RootProps = $props()
</script>

<CollapsiblePrimitive.Root
	data-slot="collapsible"
	class={cn('', className)}
	{...restProps}
/>
