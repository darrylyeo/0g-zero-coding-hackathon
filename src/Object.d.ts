interface ObjectConstructor {
	keys<T extends Record<PropertyKey, unknown>>(obj: T): (keyof T)[]

	values<T extends Record<PropertyKey, unknown>>(obj: T): T[keyof T][]

	entries<T extends Record<PropertyKey, unknown>>(
		obj: T,
	): { [K in keyof T]: [K, T[K]] }[keyof T][]

	fromEntries<K extends PropertyKey, V>(
		entries: ReadonlyArray<readonly [K, V]>,
	): Record<K, V>
}
