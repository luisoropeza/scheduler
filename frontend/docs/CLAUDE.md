# Wiki schema

This is a Waqwaq wiki. The source of truth is markdown under `wiki/`, versioned with git.
Raw documents to synthesise pages from live under `raw/`.

## Pages

- One concept per page. The file path under `wiki/` is the slug.
- Begin each page with YAML frontmatter containing a `title`.
- Link between pages with `[[slug]]` or `[[slug|label]]` wikilinks.

## Writing via MCP

- Read with `wiki_list`, `wiki_read`, `wiki_search`, `wiki_graph`.
- Add raw documents with `wiki_ingest`; read them with `wiki_list_raw` and `wiki_read_raw`.
- Create or replace pages with `wiki_write`. Lint runs first; a missing title blocks the write.
- Depending on your access, a write either commits or is queued for review. Check the returned status and the queue with `wiki_list_proposals`.
