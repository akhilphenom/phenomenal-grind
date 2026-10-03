# Phenomenal Grind data

The application stores its data as ordinary text files:

- `problems/*.md` - one coding problem per Markdown file
- `adhoc-problems/*.md` - one ad-hoc problem per Markdown file
- `notes/*.md` - notes and folders with YAML front matter
- `daily/*.yaml` - one structured daily record per date
- `preferences.yaml` - application preferences

Markdown records use YAML front matter for searchable metadata and marked
Markdown sections for notes, content, rough work, and code. Keep the
`PHENOMENAL-GRIND` section comments intact when editing these files manually;
the file API uses them to identify editable sections.

Run `npm run migrate:data` only when migrating a legacy `data/db.json`.
