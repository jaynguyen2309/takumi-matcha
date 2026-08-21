# Takumi Ceremonial Matcha Soft Serve — landing page

A single-page, dependency-free landing page for the Rubicone® Signature Takumi
Ceremonial Matcha Soft Serve Mix (Majors Group).

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The whole page. Semantic sections, one per message block from the brochures. |
| `styles.css` | All styling. Mobile-first, fluid type/spacing, no framework. |
| `script.js` | Progressive enhancement only: mobile nav, scroll reveal, active nav link, footer year. |
| `assets/` | Photography and logos extracted from the supplied brochure PDFs. |
| `serve.py` | Optional local static server (`python3 serve.py 8765`). |

## Viewing it

Open `index.html` directly, or serve it:

```bash
python3 serve.py 8765
```

## Content source

Copy, product data and photography come from the three supplied decks
(`Matcha Soft Serve.pdf`, `Your paragraph text.pdf` and its A4-landscape
variant). Product facts used on the page:

- 1.5kg net weight, yields approx. 5L finished mix
- 1 bag + 3.5L cold water; rest 4–6 hours, best overnight
- Store in a cool, dry place
- Ceremonial grade, first-harvest tencha from Kagoshima, Japan
- Recipe developed with Rubicone (Italy), manufactured in Australia
- Contact: 1800 625 677 · info@majorsgroup.au · majorsgroup.au

The early bird offer section (`#offer`) is **not** from the decks — it states
15% off a first order, with deliberately generic terms ("while stocks last").
Add real dates, eligibility or a promo code before publishing.

The decks' "social media appeal" panel and the standard-vs-ceremonial price
comparison were both dropped at the client's request.

Typos present in the source artwork ("CREMONIAL", "INSPRATION", "possiblity",
"SOCIAL MEDIAL APPEAL", "competivie") have been corrected here.

## Lead capture

Both forms — `#order`'s "Stay in the loop" and the first-visit promo modal — post
to a Google Sheet through an Apps Script web app. `google-apps-script.gs` in this
repo is the server side.

Google side, once:

1. Create a spreadsheet. Rename the first tab **Leads** and give it this header row:
   `Timestamp | Source | Name | Email | Phone | Reason | Consent | Page`
2. In that sheet: **Extensions → Apps Script**. Delete the stub, paste
   `google-apps-script.gs`, save.
3. Set `NOTIFY_EMAIL` if you want an email per lead. `SHARED_TOKEN` must match
   `LEAD_TOKEN` in `script.js`.
4. **Deploy → New deployment → Web app**, with:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** (required — visitors are not signed in)
5. Authorise when prompted (**Advanced → Go to project → Allow**). The warning is
   because the script is unverified and yours; it needs Sheets and, if you set
   `NOTIFY_EMAIL`, Gmail send.
6. Copy the deployment's `/exec` URL into `LEAD_ENDPOINT` at the top of
   `script.js`.

While `LEAD_ENDPOINT` is empty the forms fall back to their `mailto:` action, so
the page keeps working before the endpoint exists.

Editing the script later needs **Deploy → Manage deployments → edit → New
version**; saving alone does not update the live URL.

Consent is a required, unticked checkbox and the collection notice sits next to
it, per Privacy Act APP 5 and the Spam Act's consent requirement. Both consent
labels link to majorsgroup.com.au/web-site-terms-of-use/.

## Responsive behaviour

Fluid `clamp()` type and spacing scale continuously, so there are no dead zones
between breakpoints. The named breakpoints that change *layout* are:

| Width | Change |
| --- | --- |
| `< 620px` | Serving gallery 2-up; journey and benefits single column |
| `620px` | Gallery 3-up; journey 2-up with the third card spanning the row |
| `760px` | "Why ceremonial" points pair up into two columns |
| `780px` | Decorative cutout art appears (hidden on small screens) |
| `820px` | Statement and offer bands split into two columns |
| `860px` | Hero becomes two columns (copy left, product right) |
| `880px` | Journey 3-up; mixing steps and pack shot side-by-side |
| `900px` | Desktop nav replaces the hamburger; order section two columns |
| `1000px` | Serving gallery 5-up in a single row |

Benefit cards and the spec table use `auto-fit` grids, so they reflow at any
width without a breakpoint.

## Notes for editing

- Colours, type scale and spacing are CSS custom properties in `:root`.
- **The floating hero product is intentional — keep it.** It is the `float-y`
  keyframe animation on `.hero__product`; a 7s vertical drift of 11px.
- Scroll-reveal styles are scoped to `.js`, added by an inline script in
  `<head>` — with JS off, all content renders normally rather than staying
  invisible.
- Both Majors Group logos (header and footer) link out to majorsgroup.au. The
  header logo and the "Takumi Matcha" wordmark next to it are two separate
  links, since anchors cannot nest — the wordmark returns to the top of page.
- The offer band reuses `.statement` with a `.statement--promo` modifier, on the
  slightly lighter `--forest-mid` green so the three green bands stay distinct.
- `prefers-reduced-motion: reduce` disables the float animation, reveals and
  transitions — that is an explicit OS-level user request, so the float is
  suppressed only for people who have asked for less motion.
- A print stylesheet flattens the dark sections for paper.
- Body copy is Jost, display type is Playfair Display, both from Google Fonts
  with local serif/sans fallbacks. To go fully offline, self-host the two
  families and drop the `fonts.googleapis.com` links.
- Alpha-channel images (`hero-softserve`, `pack`, `powder`, leaves, whisk,
  logo) are WebP; flat photography is progressive JPEG. Total `assets/` weight
  is about 1.4MB.
