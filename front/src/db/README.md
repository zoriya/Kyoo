# Local db (TanStack DB)

The front keeps a local, queryable copy of what it displays. Screens write
plain live queries against collections (`shows`, `entries`, `seasons`...);
the collection turns a query it can't answer locally into the right http
request, and keeps every entity as a single row so an update coming from a
mutation, a websocket event or another screen is visible everywhere at once,
including inside relations (`serie.nextEntry`).

```
useLiveQuery / useLiveInfiniteQuery / <Live> / <InfiniteList>
        │ where / orderBy / limit                ▲ rows
        ▼                                        │
  kyooCollection ── loadSubset ──► route + filter/sort/query/after ──► api
        ▲                                                             │
        └──────────── normalize (nested relations → own collection) ◄─┘
        ▲
  websocket "event" (events.ts): invalidate / delete / patch rows
```

## Files

| file | role |
| --- | --- |
| `kyoo.ts` | `kyooCollection(config)`: one call describes a resource (routes, server keys, normalization, mutations) and yields a lazily filled, persisted collection |
| `odata.ts` | live query `where`/`orderBy` ⇄ kyoo `filter`/`sort`/`query`; `parseFilter` turns a user typed filter into a `where` |
| `shows.ts`, `entries.ts`, `seasons.ts` | one file per resource: row type, server keys, routes, normalization, mutations, query helpers |
| `downloads.ts` | local-only, persisted collection (the pattern for client side fields) |
| `events.ts` / `events-listener.tsx` | apply websocket change events |
| `client.ts` / `provider.tsx` | one `DbClient` per account, token/lang read live |
| `errors.ts` | map a failed load to the retryable error the error boundary renders |
| `sqlite.native.ts` | expo-sqlite persistence on android/ios (web is memory only) |

## Querying

```tsx
// a show, with its entries joined back
<Live query={(q) => showQuery(q, "serie", slug)} Render={...} Loader={...} />

// a paginated list: `.orderBy()` is required, the window is handled for you
<InfiniteList
	query={(q) =>
		q.from({ s: shows })
			.where(({ s }) => inArray("action", s.genres))
			.orderBy(({ s }) => randomOrder(s.id))
	}
	pageSize={10}
	...
/>

// anything else: plain TanStack DB
const { data } = useLiveQuery((q) =>
	q.from({ e: entries }).where(({ e }) => eq(e.showSlug, slug)).orderBy(({ e }) => e.order),
);
```

What the api receives is derived from the query:

| query | request |
| --- | --- |
| `eq(s.kind, "serie")`, `eq(s.slug, x)` | `GET /api/series/x?with=...` (detail route) |
| `eq(s.collectionSlug, x)` | `GET /api/collections/x/shows` |
| `inArray("action", s.genres)`, `gte(s.rating.tmdb, 50)` | `filter=genres has action and rating:tmdb ge 50` |
| `ilike(s.name, "%abyss%")` | `query=abyss` |
| `orderBy(s.name, "desc")` | `sort=-name` |
| `orderBy(randomOrder(s.id))` | `sort=random:seed` (a seeded rotation of the uuid order locally) |
| `not(isNull(e.availableSince))` | `filter=isAvailable eq true` |
| `orderBy(e.availableSince, "desc")` | `GET /api/news` |
| `orderBy(e.progress.playedDate, "desc")` | `GET /api/profiles/me/history` |
| a second page | the `next` url of the previous page (keyset cursor) |
| `eq(s.id, x)`, a join key | nothing: served from local rows |

`studios has x` and `staff has x` filter joined tables the rows don't carry
(`serverOnly` fields): they are sent to the api as is and are true locally.

## Mutating

Edit the row; the collection's `onUpdate`/`onDelete` forwards to the api and
pulls the authoritative row back. Nothing to invalidate.

```ts
client.collection(shows).update(id, (d) => {
	if (d.kind !== "collection") d.watchStatus = watchStatusOf(d, "completed");
});
client.collection(entries).update(id, (d) => {
	d.progress = { ...d.progress, percent: 100, playedDate: new Date() };
});
client.collection(shows).delete(id);
```

## Adding a resource

```ts
export const studios = kyooCollection<Studio, StudioRow>({
	id: "studios",
	item: Studio, // zod parser of one api item
	getKey: (x) => x.id,
	fields: { name: "name", slug: "slug" }, // server key -> local path
	routes: [
		{ path: "/api/studios/:id", single: true, bind: { id: ["slug", "id"] } },
		{ path: "/api/studios" },
	],
	normalize: (studio) => studio,
	indexes: [(x) => x.name],
});
```

Client-only fields never go on a synced row (a re-fetch would erase them):
add a side collection keyed by the synced id (`downloads.ts`) and join it.

## Limits

- TanStack DB only lazy-loads more pages for an `orderBy` on a plain field:
  random rows are windowed once (`pageSize`), scrolling them further shows
  what is local.
- Server-side search (`query`) is approximated locally by `ilike(name)`:
  fuzzy matches on aliases are fetched but not shown offline.
- A failed load rejects `loadSubset`: the live query turns `isError` while its
  local rows keep rendering (offline browsing), `Live`/`InfiniteList` only throw
  to the error boundary when there is nothing to show. Retrying opens a fresh
  live query.
- Rows deleted server side stay local until a `shows delete` event arrives.
- The events registry in the api is in-process (single replica).

## Tests

`bun test src/db` runs the translation, pagination, normalization, mutation
and event handling against a mocked `fetch`.
