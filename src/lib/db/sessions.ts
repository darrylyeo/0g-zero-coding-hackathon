import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/db'

export type StoredMessage = {
	id: string
	role: string
	content: string
	parts?: { type: string; text?: string }[]
}

export type Session = {
	id: string
	createdAt: number
	updatedAt: number
	messages: StoredMessage[]
	queue: string[]
}

type SessionsDoc = {
	id: 'sessions'
	sessions: Record<string, Session>
}

const STORAGE_KEY = '0g-chat-sessions'

export const sessionsCollection = createCollection(
	localStorageCollectionOptions<SessionsDoc>({
		id: 'sessions',
		storageKey: STORAGE_KEY,
		getKey: (item) => item.id,
	}),
)

const DOC_ID = 'sessions' as const

function getDoc(): SessionsDoc {
	if (!sessionsCollection.has(DOC_ID)) {
		sessionsCollection.insert({ id: DOC_ID, sessions: {} })
	}
	return sessionsCollection.get(DOC_ID)!
}

export function getSession(sessionId: string): Session | undefined {
	return getDoc().sessions[sessionId]
}

export function listSessions(): Session[] {
	const doc = getDoc()
	return Object.values(doc.sessions).sort(
		(a, b) => b.updatedAt - a.updatedAt,
	)
}

export function upsertSession(
	sessionId: string,
	update: Partial<Omit<Session, 'id' | 'createdAt'>>,
) {
	getDoc()
	sessionsCollection.update(DOC_ID, (draft) => {
		const existing = draft.sessions[sessionId]
		const now = Date.now()
		if (existing) {
			draft.sessions[sessionId] = {
				...existing,
				...update,
				updatedAt: now,
			}
		} else {
			draft.sessions[sessionId] = {
				id: sessionId,
				createdAt: now,
				updatedAt: now,
				messages: [],
				queue: [],
				...update,
			}
		}
	})
}

export function createSession(sessionId: string): Session {
	getDoc()
	const now = Date.now()
	const session: Session = {
		id: sessionId,
		createdAt: now,
		updatedAt: now,
		messages: [],
		queue: [],
	}
	sessionsCollection.update(DOC_ID, (draft) => {
		draft.sessions[sessionId] = session
	})
	return session
}

export function pushSessionQueue(sessionId: string, text: string) {
	const doc = getDoc()
	let session = doc.sessions[sessionId]
	if (!session) {
		createSession(sessionId)
		session = getDoc().sessions[sessionId]!
	}
	upsertSession(sessionId, { queue: [...session.queue, text] })
}

export function shiftSessionQueue(sessionId: string) {
	const session = getDoc().sessions[sessionId]
	if (!session || session.queue.length === 0) return
	upsertSession(sessionId, { queue: session.queue.slice(1) })
}
