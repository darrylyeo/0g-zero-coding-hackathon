# Spec 002: 0G Storage Manager Interface

**Data layer**: See [Spec 000](000-tanstack-db-local-persistence.md). Optional use of local collections for storage preferences (last-used network, last download root hash); upsert on user action for persistence across sessions.

## Scope

- Storage manager UI at `/storage` (SvelteKit route `routes/storage`) for uploading and downloading files on 0G Storage testnet (Galileo).
- **SDK**: `@0glabs/0g-ts-sdk` (browser: `Blob` from `File`, `MerkleTree`, `Indexer`; fee/contract: `calculatePrice`, `getMarketContract`, `FixedPriceFlow__factory`). Peer dependency `ethers` for provider/signer and flow contract calls. In browser use SDK `Blob` (not `ZgFile.fromFilePath`); optional `/browser` entry or polyfills if needed.
- **Upload flow**: (1) Build blob from selected file → `blob.merkleTree()` → `tree.rootHash()`; (2) `blob.createSubmission('0x')` for flow contract; (3) Fee: `flowContract.market()` → `getMarketContract` → `pricePerSector`, `calculatePrice(submission, pricePerSector)` = storage fee; estimate gas for `flowContract.submit(submission, { value: storageFee })`; total = storage + gas (A0GI); (4) `flowContract.submit(submission, { value: rawTotalFee })` then `indexer.upload(blob, l1Rpc, signer, options)` (e.g. `taskSize: 10`, `expectedReplica: 1`, `skipTx: false`). On success show tx hash (link to chain explorer) and root hash (copyable).
- **Download**: Indexer HTTP API `GET {storageRpc}/file?root={rootHash}` returns file bytes or JSON error (e.g. `code: 101` = file not found); alternatively `Indexer.download(rootHash, path, withProof)`. Trigger browser download (e.g. blob + anchor or `downloadBlobAsFile`-style); optional Merkle proof verification.
- **Network modes**: Standard and Turbo; each has `flowAddress`, `storageRpc` (indexer endpoint), `explorerUrl`, `l1Rpc`. Config in `src/constants` with enum + `as const` array + lookup (e.g. `StorageNetwork`, `STORAGE_NETWORKS`). Contract addresses may change—use [testnet overview](https://docs.0g.ai/developer-hub/testnet/testnet-overview) or env (e.g. testnet Flow `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` per docs; starter kit uses different fallbacks).
- **Wallet**: Connect/disconnect; use connected wallet as signer for flow `submit` and indexer upload. WalletConnect project ID or similar in env if using WalletConnect.

## Non-goals

- Mainnet or non-testnet 0G Storage.
- In-app ledger/wallet setup UI beyond connect button; faucet/setup documented or env only.
- Persistent catalog of user uploads (DB or 0G-stored manifest); UI is session/input driven.
- Multi-file or folder upload in a single tx; one file per upload flow.
- 0G-KV or key-value storage; file blob only.
- Full storage explorer UI in-app; deep links to Storage Scan / Chain Scan only.

## Acceptance criteria

- [ ] User can open `/storage` and see upload and download sections (e.g. cards or panels).
- [ ] Upload: user selects a file; app shows fee estimate (storage + gas, A0GI); user confirms and submits; on success, UI shows tx hash (link to chain explorer) and root hash (copyable).
- [ ] Download: user enters root hash (and optional file name); app fetches via indexer (`/file?root=...` or `Indexer.download`); invalid/missing root (e.g. API code 101) shows clear error; successful response triggers browser download.
- [ ] Network toggle switches between Standard and Turbo; all requests use the selected network config (flow, indexer RPC, L1 RPC, explorer).
- [ ] Wallet connect/disconnect works; upload is disabled or prompts connect when wallet not connected.
- [ ] Network and flow/contract constants live in `src/constants` with enum + `as const` array + lookup (e.g. `StorageNetwork`, `STORAGE_NETWORKS`, flow address, storage RPC, explorer URL, L1 RPC).
- [ ] Fee calculation uses `FixedPriceFlow` + market `pricePerSector` and `calculatePrice`; upload uses `flowContract.submit` with correct value then `indexer.upload` per 0G Storage protocol.
- [ ] `.env.example` documents required vars (e.g. L1 RPC, flow address, indexer RPC, WalletConnect project ID if used).
- [ ] (Optional) Use Spec 000 storage preferences collection for last-used network and last download root hash; upsert on change; UI reads from collection.

## Todos

- [ ] Add `@0glabs/0g-ts-sdk` and `ethers`; align with [0g-storage-web-starter-kit](https://github.com/0gfoundation/0g-storage-web-starter-kit) patterns (blob, fees, network, uploader, downloader).
- [ ] (Optional) Add “Copy root hash” and “Open in Storage Scan” after upload.
- [ ] (Optional) Persist last-used network and last download root hash via Spec 000 storage preferences collection.

## Sources

- [0G Storage SDK (docs)](https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk) — TS/Go SDK, Blob/Indexer, browser usage, install `@0glabs/0g-ts-sdk` + `ethers`
- [0G Testnet overview](https://docs.0g.ai/developer-hub/testnet/testnet-overview) — Galileo chain ID 16602, RPC, faucet, **contract addresses** (Flow, Reward, Mine), block explorer
- [0g-storage-web-starter-kit](https://github.com/0gfoundation/0g-storage-web-starter-kit) — Next.js upload/download, lib/0g (blob, fees, network, uploader, downloader), wagmi + SDK
- [0g-ts-sdk](https://github.com/0gfoundation/0g-ts-sdk) — Blob, Indexer, FixedPriceFlow, browser `/browser` entry, Vite polyfills
- [0g-storage-ts-starter-kit](https://github.com/0gfoundation/0g-storage-ts-starter-kit) — Express/CLI reference
- [Builder Hub](https://build.0g.ai/) / [Documentation index](https://build.0g.ai/documentation/)
- [Storage Scan (testnet)](https://storagescan-galileo.0g.ai/)
- [Chain Scan (testnet)](https://chainscan-galileo.0g.ai/)
- [0G testnet faucet](https://faucet.0g.ai/)
- [Develop 0G skill](.cursor/skills/develop-0g/SKILL.md) and [reference](.cursor/skills/develop-0g/reference.md)
- [Spec 000: TanStack DB local persistence](000-tanstack-db-local-persistence.md)
