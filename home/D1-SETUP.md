# KUCIRLINK — D1 Setup

1. Cloudflare Dashboard → Storage & databases → D1 SQL Database → Create database → `kucirlink-db`.
2. Copy the database ID and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.jsonc`.
3. Initialize the **remote** database using a terminal authenticated to the same Cloudflare account:
   `npx wrangler d1 execute kucirlink-db --remote --file=./schema.sql`
   Alternatively, paste the statements from `schema.sql` into the D1 database Console in Cloudflare Dashboard.
4. Upload the entire updated project to the existing GitHub repository, commit and deploy. Worker name in this bundle is `shortlink`; change it to the existing Worker name if needed.
5. Under Worker → Settings → Variables and Secrets, verify `ADMIN_PASSWORD` and `SESSION_SECRET` are present for this Worker.
6. Open the Worker workers.dev URL, then `/admin` and create a test link.

**Important:** D1 is a NEW empty database. Old KV links are NOT automatically migrated. Export old KV links first if you want to retain them. Existing Durable Object counters also belong to the original Cloudflare account; counters will not follow to a different account automatically.

Binding `DB` must match the code. Binding `CLICK_COUNTER` remains for click stats. The project uses a 5,000-row admin listing cap for now; use pagination if your data exceeds this.
