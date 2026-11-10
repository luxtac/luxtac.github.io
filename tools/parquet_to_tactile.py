#!/usr/bin/env python3
"""Turn LuxTac rollout parquet files into tactile heatmap frames and web videos.

Each rollout trial (LeRobot v3 layout) holds one row per camera frame with
`observation.luxtac`: 16 floats in [0, 1], one per taxel of the 4x4 array
(row-major). For each trial this script:

  1. writes one PNG per frame: the 4x4 reading as a Blues heatmap
     (fixed 0..1 scale, same Blues scale as the live viewer),
  2. encodes those frames into an H.264 heatmap video at the rollout fps,
  3. overlays the heatmap as an inset on the trial's front-camera video and
     writes a browser-safe H.264 mp4 (the camera videos are AV1).

Usage:
  python tools/parquet_to_tactile.py --data ~/Downloads/data --out build/tactile \
      --site-assets assets \
      rollout_peg_luxtac_V1:0 rollout_peg_vision_V1:2 ...

Each trial argument is <rollout folder>:<trial number>. Needs numpy, pandas,
pyarrow, matplotlib and ffmpeg on PATH.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from matplotlib import colormaps

GRID = 4
CELL = 60            # px per taxel in the PNG frames (240x240 frames)
INSET = 144          # px size of the inset on the 640x480 camera video
MARGIN = 14          # px from the bottom-left corner of the camera video
BORDER = 2           # px frame around the inset
LUT = (colormaps["Blues"](np.linspace(0, 1, 256))[:, :3] * 255).astype(np.uint8)


def trial_dir(data: Path, rollout: str, n: int) -> Path:
    for name in (f"trial_{n:04d}", f"trial_{n:05d}"):
        p = data / rollout / name
        if p.is_dir():
            return p
    sys.exit(f"missing trial: {rollout} {n}")


def heat_frame(values: np.ndarray) -> np.ndarray:
    v = np.clip(values.reshape(GRID, GRID), 0.0, 1.0)
    rgb = LUT[(v * 255).round().astype(int)]
    return np.kron(rgb, np.ones((CELL, CELL, 1), dtype=np.uint8))


def write_png(path: Path, img: np.ndarray) -> None:
    import matplotlib.image as mpimg
    mpimg.imsave(path, img)


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def convert(data: Path, out: Path, site_assets: Path | None, rollout: str, n: int) -> dict:
    src = trial_dir(data, rollout, n)
    fps = json.loads((src / "meta/info.json").read_text())["fps"]
    df = pd.read_parquet(src / "data/chunk-000/file-000.parquet")
    lux = np.stack(df["observation.luxtac"].to_numpy()).astype(np.float32)

    stem = f"{rollout}_t{n}"
    frames = out / "frames" / stem
    if frames.exists():
        shutil.rmtree(frames)
    frames.mkdir(parents=True)
    for i, row in enumerate(lux):
        write_png(frames / f"{i:05d}.png", heat_frame(row))

    heat_mp4 = out / f"{stem}_heatmap.mp4"
    run(["ffmpeg", "-y", "-v", "error", "-framerate", str(fps), "-i", str(frames / "%05d.png"),
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", str(heat_mp4)])

    result = {"trial": stem, "frames": len(lux), "max": float(lux.max()), "heatmap": str(heat_mp4)}
    if site_assets is not None:
        cam = src / "videos/observation.images.front/chunk-000/file-000.mp4"
        site_mp4 = site_assets / f"tactile-{rollout.removeprefix('rollout_').lower()}-t{n}.mp4"
        size = INSET - 2 * BORDER
        graph = (
            f"[1:v]scale={size}:{size}:flags=neighbor,"
            f"pad={INSET}:{INSET}:{BORDER}:{BORDER}:color=0x2a2a2e[h];"
            f"[0:v][h]overlay={MARGIN}:H-h-{MARGIN}:shortest=1,format=yuv420p"
        )
        run(["ffmpeg", "-y", "-v", "error", "-i", str(cam), "-i", str(heat_mp4),
             "-filter_complex", graph, "-c:v", "libx264", "-profile:v", "high",
             "-crf", "23", "-preset", "slow", "-an", "-movflags", "+faststart", str(site_mp4)])
        result["site_video"] = str(site_mp4)
    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", type=Path, required=True, help="folder holding the rollout_* folders")
    ap.add_argument("--out", type=Path, required=True, help="where PNG frames and heatmap videos go")
    ap.add_argument("--site-assets", type=Path, help="if set, also write camera+inset videos here")
    ap.add_argument("trials", nargs="+", help="<rollout folder>:<trial number>")
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    for t in a.trials:
        rollout, n = t.rsplit(":", 1)
        r = convert(a.data.expanduser(), a.out, a.site_assets, rollout, int(n))
        print(f"{r['trial']}: {r['frames']} frames, peak {r['max']:.2f} -> {r.get('site_video', r['heatmap'])}")


if __name__ == "__main__":
    main()
