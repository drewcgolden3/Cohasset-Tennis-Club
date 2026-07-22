# Cohasset Tennis Club — Website

A static, multi-page marketing site for the Cohasset Tennis Club (21 Cedar St, Cohasset, MA).
Plain HTML/CSS/JS — no build step. Every page shares `styles.css` + `script.js`.

## Pages
| File | Purpose |
|------|---------|
| `index.html` | Home |
| `adult-tennis.html` | Adult programs |
| `junior-tennis.html` | Junior program + sessions |
| `coaches.html` | Staff bios |
| `membership.html` | Membership tiers & pricing |
| `our-story.html` | Club history |
| `contact.html` | Contact info + map |
| `schedule.html` | **Interactive weekly schedule** (Google Sheets–backed) |
| `junior-registration.html` | Junior registration form |
| `adult-request.html` | Private lesson request form |

## Brand
- **Palette:** deep navy `#1C4459` · sunny yellow `#F6C733` · brand teal `#1F6E80` · clean sea-glass grounds. Tokens live at the top of `styles.css` (`:root`).
- **Type:** Fraunces (display serif) + DM Sans (UI/body).
- **Logo:** `images/logo.png` (background removed). Swap this file to update the nav logo everywhere.

## Forms → Google Forms
Both forms are native, on-brand HTML that POST straight to the club's existing Google Forms
(the `formResponse` endpoint + the real `entry.####` field IDs), so responses still land in the
same Google Sheet as before. Logic is in `ctc-forms.js`. No backend or server needed.
- Junior: form ID `1FAIpQLScpSjD2SMQ2cfwDk0hf7MAH5AfVfUynvrNGRprPGFj4X7WFkQ`
- Adult lesson request: form ID `1FAIpQLSfvOhTanZroWHjKVuu-47PI0XAY9adbipGMZblw_LG9videmA`

## Schedule → Google Sheets (optional live backend)
`schedule.html` ships with the current weekly clinics baked in, so it works immediately.
To drive it from a Google Sheet instead:
1. Make a sheet with a header row: `Day, Time, Program, Duration, Coach, Court, Book`
   (only Day / Time / Program are required; Duration is in minutes).
2. **File → Share → Publish to web → (this sheet) → CSV.**
3. Paste that CSV URL into `CONFIG.sheetCsvUrl` near the top of the `<script>` in `schedule.html`.
The board reads it live, highlights what's on **now / up next** for the current day, and falls
back to the built-in week if the sheet is ever unavailable.
- To enable online booking, set `CONFIG.bookingUrl`; otherwise every button is a "Call to book" phone link.

## Local preview
Any static server, e.g. `python3 -m http.server` from this folder.
