# Server Capacity, Status Effects, and Public Information

## What will change

- Replace the separate “Created today” and “Remaining” rows on each server with one wide capacity bar. The fill grows as accounts are created and reaches 100% when the server is full.
- Upgrade the Online indicator with expanding water-like ripples and add a matching animated Wi-Fi signal directly beneath it.
- Add an admin section for Telegram and WhatsApp contact details. Changes will update the public footer immediately in the same browser.
- Add an admin-managed announcements section where notices can be created, edited, shown/hidden, and deleted.
- Show active announcements to users on the home page in a clear, compact section.

## Interaction details

- The capacity bar shows both created and remaining account counts, with full and offline states clearly distinguished.
- Motion pauses automatically for visitors who prefer reduced motion.
- Telegram accepts a username or link; WhatsApp accepts a phone number or link and is converted into a usable contact link.
- Announcements contain a title and message, with controls for visibility, editing, and deletion.

## Technical details

- Keep these customizable settings in browser storage, matching the restored server configuration approach so they continue working on Vercel without Lovable Cloud access.
- Synchronize open pages through browser events so footer contacts and announcements refresh after an admin save.
- Reuse existing design tokens and Button components, then verify desktop/mobile layouts and current build diagnostics.