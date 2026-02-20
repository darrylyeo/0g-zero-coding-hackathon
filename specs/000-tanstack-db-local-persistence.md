# Spec 000: TanStack DB Local Persistence and Caching

## Scope

- **Source of truth**: UI reads from TanStack DB collections backed by **local persistence** (LocalStorage). All displayed state comes from these collections.
- **Caching**: When API/remote results are received (e.g. `listTestnetServices`, `getAccountInfo`), **upsert** them into the relevant collection so subsequent reads are local-first; re-fetch and upsert when stale or on demand.
- **User input**: User actions that change displayed state (e.g. sending a message, selecting model, selecting agents, storage network) **upsert** into the relevant collection so the UI stays in sync and state persists across sessions where desired.
- **Stack**: TanStack DB (`@tanstack/db`, `@tanstack/svelte-db`), **LocalStorage collections** via `localStorageCollectionOptions` (or sessionStorage where appropriate). Schemas via **StandardSchema** (e.g. Zod). Svelte UI binds with `useLiveQuery` from `@tanstack/svelte-db`.
- **Placement**: Collections and schemas live in `$lib/db` (or similar); feature routes (e.g. `/chat`, `/storage`, `/agents`) use these collections and perform upserts when calling remotes/APIs or handling user input.

## Non-goals

- Server-side persistence or sync of these collections.
- TanStack Query Collection as the primary source (we use LocalStorage-first; API results are written into local collections via upsert, not the other way around).
- Cross-device or multi-user sync.

## Collections (reference)

Specs that use the local DB layer reference the following. Exact schema fields are defined in implementation; keys and purpose are specified here.

| Collection (logical) | Key | Purpose | Used by |
|----------------------|-----|---------|---------|
| **Chat messages** | e.g. `id` (local or server) | User and assistant messages; upsert on send and on stream completion. | Spec 001, 003 |
| **Chat preferences** | e.g. `id: 'default'` | Selected model (provider address), selected context agent ids. Upsert on user change. | Spec 001, 003 |
| **Testnet services cache** | e.g. `address` or list key | Cached result of `listTestnetServices()`; upsert when remote returns. | Spec 001 |
| **Account info cache** | e.g. wallet/address | Cached `getAccountInfo` result; upsert when remote returns. | Spec 001 |
| **Storage preferences** | e.g. `id: 'default'` | Last-used network, last download root hash. Upsert on user action. | Spec 002 |

New collections may be added in this spec when new features require them.

## Upsert and read pattern

- **Read**: Components use `useLiveQuery` over the relevant collection(s); no direct fetch-for-render—fetch is used to populate/refresh the collection.
- **After API/remote**: When a remote or API returns data, map it to the collection’s shape and call `collection.insert()` or `collection.update()` (or a small upsert helper: get by key, then insert or update). Optionally evict or refresh on TTL or explicit “refresh” action.
- **After user input**: On actions that change UI state (e.g. model selected, message sent), upsert into the appropriate collection so the next read from the collection reflects the change and, where applicable, state persists.

## Acceptance criteria

- [x] TanStack DB and Svelte adapter installed; LocalStorage collection(s) created with `getKey`, `storageKey`, `id`, and optional `schema`.
- [x] At least one feature (e.g. chat per Spec 001) uses a local collection as source of truth: UI binds via `useLiveQuery`, and API results and user inputs are upserted into the collection.
- [x] Specs 001, 002, 003 reference this spec (000) where they use the local DB layer.

## Todos

- [x] Add `@tanstack/db` and `@tanstack/svelte-db` (and any LocalStorage collection package per TanStack DB docs); add Zod if used for schemas.
- [x] Define in `$lib/db` the chat preferences collection (id, storageKey, getKey); chat messages and testnet/account caches optional for later.
- [ ] (Optional) Add storage preferences collection and use in Spec 002 for last network and last root hash.

## Sources

- [TanStack DB Overview](https://tanstack.com/db/latest/docs/overview)
- [LocalStorage Collection](https://tanstack.com/db/latest/docs/collections/local-storage-collection)
- [TanStack DB Schemas](https://tanstack.com/db/latest/docs/guides/schemas)
- [TanStack DB Svelte Adapter](https://tanstack.com/db/latest/docs/framework/svelte/overview)
- [StandardSchema](https://standardschema.dev/)
