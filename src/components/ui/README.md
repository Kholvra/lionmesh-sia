# Shared UI

These components are presentational. They do not import cycle modules, Supabase, or core services.

## Data table

Use a client-owned parent for `DataTable`; callbacks cannot cross from a Server Component into a Client Component. Pass only the current page rows, `page`, `totalItems`, and callbacks that request the next page or sort order. The table caps rendering at 25 rows and leaves fetching and sorting to the parent.

Every column needs a stable `id` and header. Add `sortValue` only when the column can be ordered. The table shows 25 rows per page, five loading rows, and `Belum ada data.` for an empty result.

## Forms

Compose `Form`, `FormField`, and `Input`. A required field is blocked when empty; the field displays `{Label} wajib diisi.` and receives focus. Once valid, the form continues through its `onSubmit` or native `action`.

## Status badge

Pass the status definitions owned by the calling module. The badge renders only a matching value and label. An unknown value is hidden and sent to `onInvalidStatus`; in development, it is also reported to the console when no callback is provided.

## Confirmation dialog

Keep `open` controlled by the client parent. The confirmation callback runs only after the user selects the confirm action. Cancel and Escape close without running it. The native modal dialog traps focus and restores it when closed.
