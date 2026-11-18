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

## Branches

- `beta`: work here. Everyone with write access can push to it.
- `main`: the live site at https://luxtac.github.io. Only Prince can push or merge to it; open a pull request from `beta` when a change is ready.

To preview `beta`: `git checkout beta`, then serve the folder as above. The board carousel and the 3D viewer need the page served over HTTP; from a `file://` address the cards only show as a plain row.

## Files

- `index.html`: the page.
- `assets/style.css`, `assets/boards.js`: styles; board carousel, 3D viewer and downloads.
- `assets/boards/`, `assets/models/`: board card images and 3D models (GLB) for the viewer.
- `assets/downloads/`: the zip files each card's Download button serves.
- `assets/`: paper figures, photos and logos.
