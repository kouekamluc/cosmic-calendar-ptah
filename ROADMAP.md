# Ptah Kamgou Calendar — Feature Outline & Monetisation

_Written 2026-11-05 from a read of the code in `app/` (Expo SDK 58, React Native 0.88) and the PDF generator in `v3/`._

## 1. What exists today

| Area | Status | Where |
|---|---|---|
| Calendar engine (13 × 28 days, Leap Day, Renewal Day, era = Gregorian + 511, infinite years) | Done | `src/engine.ts` |
| Today screen (day, year wheel, progress, moon, month card, upcoming holidays, personal events) | Done | `TodayScreen` |
| Month grid with swipe | Done | `MonthScreen` |
| Year overview (13 months) | Done | `YearScreen` |
| Converter Gregorian ⇄ Ptah Kamgou | Done | `ConvertScreen` |
| Personal events (none / repeat by PK date / repeat by Gregorian date), stored on-device | Done | `events.ts`, `EventsScreen` |
| Moon phases (Meeus algorithm, CET) | Done | `engine.ts` |
| Holidays: Italy + Cameroon (fixed, Easter-based, Eid via Umm al-Qura table) | Done | `engine.ts`, `islamicTable.ts` |
| Printable PDF calendars (illustrated, per year) | Done, separate Python tool | `v3/ptah_kamgou_calendar.py` |
| Android APK build via EAS | Done | `build_apk.ps1`, `eas.json` |

Fully offline, no backend, no accounts. That suits low connectivity and means near-zero running cost.

## 2. Gaps worth closing (the features, in suggested order)

Each is a separate unit of work. **Decision (2026-11-05): English only for now; focus on making the app functional.**

Done so far in this pass: event editing, delete confirmation, local reminders (08:00 on the day, set per event), backup/restore of events (export as text, paste to import), converter input validation (years 100–9999, whole numbers only), leap-day repeat bug fix (events could show "passed" up to 4 years early), safer event storage (no overwrite before load, corrupt data ignored).

1. ~~French language~~ — postponed.
2. ~~Reminders / notifications~~ — done (local, offline). Needs a real device or APK to test; not yet verified on a phone.
3. **Home-screen widget** — shows today's PK date. Calendar apps live or die on this. Needs a development build, not Expo Go.
4. **Share a date card** — render today's date or a converted date as an image for WhatsApp. This is the main free-growth channel in Cameroon.
5. **Holiday packs** — country selector instead of the hard-coded IT + CM. Add FR, NG, GH, SN, CI, US and others. Also fix the hard-coded `St Francis` and Eid estimation caveats.
6. **Event upgrades** — time of day, end date, categories, edit (currently add and delete only), search, birthdays with age.
7. **Backup / export** — export events as a file, import `.ics`, export to the system calendar. Required before charging anyone for anything, because people won't pay for data they can lose.
8. **Cultural content** — meaning or theme per month, day or week; the Vernuary month; Renewal Day ritual. This is the product's actual differentiator, but the content has to come from you.
9. **Print / PDF from inside the app** — bring `v3` generation into the product (server-side or pre-generated yearly files).
10. **Sync across devices** (optional, last) — needs a backend and accounts. Skip until there is demand.

Housekeeping before any of this: no tests exist for the engine (the leap-year and era-boundary logic should have them), no lint or typecheck run is recorded, and `README.md` still describes an older setup.

## 3. Monetisation — honest assessment

**Constraints from your situation:** low connectivity, a user base that mostly cannot pay by card, no money for ads or servers, and a niche calendar system that most people don't know. A generic calendar app cannot compete with Google Calendar, so revenue has to come from what is unique: the Ptah Kamgou system, its design, and its community.

| Model | Fit | Notes |
|---|---|---|
| **Printed wall calendars / desk calendars** | **Strongest** | Printed calendars are a huge gift culture in Cameroon (banks, churches, shops, schools hand them out every January). You already have an illustrated PDF generator. Sell to individuals and to organisations that want a branded edition. No app store needed. |
| **PDF calendar sales** (yearly) | Strong | Digital product, near-zero cost. Sell via Mobile Money (MTN MoMo / Orange Money) and in Europe via Stripe or PayPal link. |
| **One-time "Pro" unlock** (widget, themes, multiple country packs, backup) | Good | Better than subscription for this market. Price low (about 1,000–2,000 FCFA / €2–3). The catch: Google Play billing is unreliable in Cameroon, so Pro may need to be sold outside the store (direct APK + Mobile Money code). |
| **Diaspora sales** (Italy, France, Belgium, UK, US) | Good | Same product, 10× the price tolerance. Cameroonian and pan-African communities abroad buy cultural items. |
| **Branded / white-label calendar for organisations** | Good | Churches, associations, small companies pay for their own events and holidays preloaded. A service, not just a product. |
| **Cultural content subscription** (daily meaning, month themes) | Medium | Works only if the content is genuinely good and updated; high ongoing effort. |
| **Ads** | Weak | Tiny CPMs in the target market, and ads would break the calm design. Not recommended. |
| **Donations / "support the project"** | Weak but free | Add a link; do not rely on it. |
| **Subscription** | Weak | Hard to collect recurring payment where most users lack cards. |

**Suggested path**

1. Ship the free app with French (feature 1), reminders (2) and sharing (4). Free and widely shared builds an audience.
2. Sell the **printed + PDF 2538 calendar** first. It needs no new code and is the quickest revenue; the v3 generator already exists. This fits your plan to start after April 2027 — the 2538 year begins 20 March 2027.
3. Add a one-time Pro unlock (widget, holiday packs, backup) once there are real users to ask.
4. Offer branded editions to organisations once you have a printed sample to show.

**Realistic expectation:** this will not be a large business on its own. It is a good low-cost, low-risk product that can reach modest recurring income through print and organisation work, and it works as a showcase for KKEVO Labs.

## 4. Decisions needed from you

- Is French the first language to add?
- Is the target audience mainly Cameroon, the diaspora, or the wider "Aquarian / Kemetic" community? This changes pricing and holiday packs.
- Do you want to sell printed calendars (needs a printer contact) or stay digital-only at first?
- Is the cultural meaning of each month something you will write, or should the app stay purely a calendar?
