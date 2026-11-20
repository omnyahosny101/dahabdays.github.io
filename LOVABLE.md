# Moving Dahab Days into Lovable

Lovable's GitHub sync works from Lovable outwards: connecting a project makes Lovable create the repository. So the reliable path is:

1. In Lovable, create a new empty project (any prompt, e.g. "Blank React app").
2. Project › GitHub › **Connect** — Lovable creates a repo such as `your-org/dahab-days`.
3. On your computer:
   ```bash
   git clone https://github.com/your-org/dahab-days.git
   cd dahab-days
   git rm -r -q .            # clear Lovable's starter files
   # copy everything from this folder in (except node_modules and dist)
   git add -A && git commit -m "Dahab Days site" && git push
   ```
4. Lovable picks up the push within a minute — the preview now shows Dahab Days. From here the owner edits by chatting, and every change syncs back to GitHub.
5. Connect Supabase inside Lovable (Integrations › Supabase), choose the project you set up in README step 1, and add the two `VITE_SUPABASE_*` values if Lovable asks. Edge functions in `supabase/functions` deploy from Lovable too; add the Paymob secrets in Supabase › Edge Functions › Secrets.

If your Lovable workspace offers **Import** (ZIP or GitHub) on the new-project screen, you can upload this folder as a ZIP instead of steps 1–3.

## Prompts the owner can use later
- "Add a Freediving category with three courses and the same booking flow."
- "On the course cards, show how many places are left for the selected date."
- "Send the guest a WhatsApp/email confirmation with their signed PDF after payment."
- "Add an Arabic version of the whole site with a language switch in the header."
- "Add a staff section to the dashboard where I can assign instructors to bookings."
- "Add discount codes that apply at the Review & pay step."

Keep these files as the single source of truth: prices and programs live in the database (Dashboard › Services), brand colours in `tailwind.config.js`.
