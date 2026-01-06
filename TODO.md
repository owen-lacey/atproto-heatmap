## Tasks

### 1. [ ] Mermaid diagram describing the flow
**Difficulty:** Easy  
**Spec:** Create a docs/architecture.md file with a Mermaid diagram showing the user flow from "Browse" button click → handle lookup → background function trigger → Supabase data storage → profile page render.

---

### 2. [ ] Not found page redirect to home
**Difficulty:** Easy  
**Spec:** Modify `app/profile/[handle]/not-found.tsx` to redirect to "/" with the invalid handle as a query param (`?handle=xyz`) to prepopulate the input field.

---

### 3. [ ] Reset/regenerate button
**Difficulty:** Medium  
**Spec:** Add context menu to profile page (`[handle]/page.tsx`) with "Reset Data" option that deletes user's cached data from Supabase, then redirects to home page with handle prepopulated to trigger fresh hydration.

---

### 4. [ ] Delta updates
**Difficulty:** Medium-Hard  
**Spec:** On profile page load, check Supabase `updated_at` timestamp. If older than today, invoke background function with date range (`updated_at` → now) to fetch only new records. Use record key-based deduplication to prevent duplicates. Update `updated_at` on completion.

---

### 5. [ ] Fix profile page flicker
**Difficulty:** Easy-Medium  
**Spec:** Profile page shows avatar → loading spinner → avatar+heatmap sequence. Use React Suspense boundaries or loading states to prevent remounting of avatar component during data fetch.

---

### 6. [ ] Privacy disclosure
**Difficulty:** Easy  
**Privacy considerations:**
- **GDPR/CCPA:** Users have right to know what data is stored and request deletion
- **Data stored:** DID, handle, post records (URI, timestamp, collection type), aggregated counts
- **Retention:** Indefinite unless user requests deletion
  
**Spec:** Add privacy notice to home page footer and profile page. Include: what data is collected, how it's used, how to request deletion (link to reset button). Consider adding `/privacy` page with full disclosure.

---

### 7. [ ] Search indexing opt-out check
**Difficulty:** Medium-Hard  
**Research findings:** ATProto has `!no-unauthenticated` label that users can self-apply to opt out of unauthenticated access. This is the standard for search engine/indexing opt-out.

**Spec:** 
1. Check user's profile for `!no-unauthenticated` label before data collection
2. If present, show modal: "This user has opted out of public indexing. View anyway?" with Yes/No buttons
3. If No: redirect to home. If Yes: proceed with standard flow
4. Use ATProto OAuth for authentication when implementing override feature
5. Check label via `app.bsky.actor.getProfile` API call

---

### 8. [ ] OG image enhancement
**Difficulty:** Easy-Medium  
**Spec:** Enhance `app/api/og/route.tsx` to generate dynamic OG images. Use @vercel/og with:
- User's avatar (top)
- Handle text
- Miniature heatmap visualization (show last 12 months)
- Site branding
Size: 1200x630px. Cache images by handle.

---

### 9. [ ] Logo/favicon (blocked)
**Difficulty:** Easy  
**Spec:** Once logo SVG is ready:
1. Add to `public/logo.svg`
2. Generate favicon sizes (16x16, 32x32, 180x180) using Sharp/ImageMagick
3. Update `app/layout.tsx` metadata with icon paths
4. Add logo to homepage header
5. Use SVG with `currentColor` for theme compatibility