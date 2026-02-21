export function spawn(): ReturnType<typeof import('child_process')['spawn']> {
	throw new Error('child_process is not available in browser')
}
