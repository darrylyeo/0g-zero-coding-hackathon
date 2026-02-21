export const open = () =>
	Promise.reject(new Error('node:fs/promises not available in browser'))
export const writeFile = () =>
	Promise.reject(new Error('node:fs/promises not available in browser'))
export default {}
