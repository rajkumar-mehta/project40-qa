# Route 4T — Production Build v2.45

Production-style release prepared from the approved v2.44 baseline.

- Real calendar/date gating ON
- Sequential EXIT progression ON
- Future EXITs hidden until unlock
- EXIT 40 unlocks 2026-11-06 at 12:01 AM device-local time
- SHOW HINT removed
- Test/debug/reset/simulated-date UI not present
- Mobile QR hidden; gift/video button remains primary
- Approved sticky scoreboard and mobile layout preserved
- Cross-browser/light-dark compatibility hardening preserved
- HONK press animation preserved with transparent artwork background to eliminate white flash

Known content placeholders retained by design: EXIT 25, 26, 36 and 40 currently have no video URL and display the existing coming-soon behavior until links are supplied.


## v2.46 PROD patch
- Isolated artwork update: curved road visible in the Route 4T title graphic on Welcome and Home.
- HONK implementation unchanged from v2.45.
- Production gameplay/date/sequence behavior unchanged.


## v2.47 QA — Trusted Time + Formspree Quota
- Future EXIT unlocks no longer trust the phone's manually editable date/time.
- Route4T syncs the same-origin server Date header and advances it with performance.now().
- Offline/time-check failure is fail-closed; the last verified instant is frozen and future exits stay locked.
- Already completed EXIT results are grandfathered, preserving Mika's existing scoreboard/progress.
- Formspree now sends only one final notification per EXIT: SOLVED or WHITE FLAG.
- Legacy queued OPEN/ANSWER notifications are discarded.
- No visual, HONK, scoreboard, sticky, puzzle, answer, or progress-storage-format changes.


## v2.48 QA — future content update
- Based directly on approved v2.47 PROD.
- EXIT 0 and EXIT 1 preserved exactly.
- EXIT 2–40 content synchronized from YT URL(4).xlsx.
- Updated future puzzle questions, accepted answers, photo mappings, sender metadata and YouTube URLs.
- TBD videos remain unavailable rather than being treated as URLs.
- No change to saved-game keys/format, scoreboard logic, trusted server time, Formspree final-only notification behavior, sequence gating, HONK, sticky UI, or EXIT styling.


## v2.49 QA — Formspree subject labeling
- Formspree frequency is unchanged: one final notification per completed EXIT.
- QA subjects begin with [QA].
- PROD subjects begin with [PROD] automatically after promotion.
- No gameplay, scoring, progress-storage, trusted-time, sequence, HONK, sticky UI, puzzle, or visual changes.
- QA CNAME is qa.route4t.com.
