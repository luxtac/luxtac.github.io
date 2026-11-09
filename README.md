# LuxTac website

Project page for LuxTac, an optical taxel array from the Purdue MARS Lab. Dark theme, black and gray with white text. The only colour is the sensor's own rainbow, used as thin strips.

## Preview locally

Serve the site over HTTP. Opening `index.html` directly will not reliably load the images and animations, so do not double-click it inside the ZIP.

1. Download the repository ZIP from GitHub and extract it fully.
2. From the extracted folder, run:
   `python3 -m http.server 0 --bind 127.0.0.1`
   (On Windows, use `python` or `py` instead of `python3` if needed.)
3. Open the address it prints, e.g. `http://127.0.0.1:54321/`.

To stop the server, press Ctrl+C in the terminal.

## Files

- `index.html` — the whole page (styles and scripts are embedded).
- `assets/` — paper figures, photos, and white placeholder images for visuals still to come.

## Pushing

Pushes go through the GitHub web upload route, replacing `index.html` and adding files under `assets/` as needed. The repo is private and GitHub Pages is off until Prince makes it live.
