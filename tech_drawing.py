#!/usr/bin/env python3
"""
Create a technical drawing style image from a photo.

This script emphasizes edges and produces a clean, high‑contrast, black‑on‑white
result suitable for documentation or as a base for vectorization. It also offers
an optional, dependency‑free SVG export built from detected contours.

Usage example:
  python tech_drawing.py --input input.jpg --output drawing.png --svg drawing.svg

Only OpenCV is required (opencv‑python). No GUI is needed; works headless.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Tuple

import cv2
import numpy as np


def read_image_color(image_path: Path) -> np.ndarray:
    """Read an image in BGR color space and validate that it loaded."""
    image_bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise FileNotFoundError(f"Failed to read image: {image_path}")
    return image_bgr


def maybe_resize(image: np.ndarray, max_dimension: int | None) -> np.ndarray:
    """Resize keeping aspect ratio so that max(height, width) <= max_dimension."""
    if not max_dimension:
        return image
    height, width = image.shape[:2]
    current_max = max(height, width)
    if current_max <= max_dimension:
        return image
    scale = max_dimension / float(current_max)
    new_size = (int(round(width * scale)), int(round(height * scale)))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def create_technical_drawing(
    image_bgr: np.ndarray,
    line_strength_px: int = 2,
    canny_low: int = 40,
    canny_high: int = 120,
    adaptive_block_size: int = 21,
    adaptive_c: int = 2,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Convert an input BGR image to a high‑contrast binary drawing and an edge map.

    Returns a tuple of (binary_drawing_8u, edges_8u), both single‑channel images
    with white background and black lines (0 is line, 255 is background).
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # Edge‑preserving smoothing to reduce noise while keeping boundaries.
    filtered = cv2.bilateralFilter(gray, d=7, sigmaColor=50, sigmaSpace=50)

    # Binary adaptive threshold to get a clean background and preserve labels.
    adaptive_block_size = max(3, adaptive_block_size | 1)  # ensure odd >= 3
    binary = cv2.adaptiveThreshold(
        filtered,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        adaptive_block_size,
        adaptive_c,
    )

    # Robust edges using Canny; then thicken slightly for print‑ready lines.
    edges = cv2.Canny(filtered, canny_low, canny_high, L2gradient=True)
    if line_strength_px > 1:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (line_strength_px, line_strength_px))
        edges = cv2.dilate(edges, kernel, iterations=1)

    # Combine edges with thresholded background for a crisp drawing.
    inverted_edges = cv2.bitwise_not(edges)
    combined = cv2.bitwise_and(binary, inverted_edges)

    # Denoise small speckles without eroding lines.
    combined = cv2.fastNlMeansDenoising(combined, None, h=15, templateWindowSize=7, searchWindowSize=21)

    # Ensure black lines on white background format.
    drawing = combined
    return drawing, edges


def save_png(image_gray: np.ndarray, output_path: Path) -> None:
    """Save single‑channel grayscale as PNG, ensuring parent directories exist."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    success = cv2.imwrite(str(output_path), image_gray)
    if not success:
        raise RuntimeError(f"Failed to write output image: {output_path}")


def contours_to_svg(
    binary_white_bg_black_lines: np.ndarray,
    svg_path: Path,
    stroke_width: float = 1.0,
    simplify_ratio: float = 0.01,
    stroke_color: str = "#000",
) -> None:
    """
    Export contours of the binary drawing to a simple SVG file.

    The input must be a single‑channel image with white background (255) and
    black lines (0). The writer uses OpenCV contours and polyline approximations
    to keep the SVG compact and dependency‑free.
    """
    height, width = binary_white_bg_black_lines.shape[:2]

    # Contours expect white shapes on black; invert to treat lines as shapes.
    # Use RETR_LIST to get all polylines without hierarchy constraints.
    inverted = cv2.bitwise_not(binary_white_bg_black_lines)
    contours, _ = cv2.findContours(inverted, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

    svg_path.parent.mkdir(parents=True, exist_ok=True)
    with svg_path.open("w", encoding="utf-8") as f:
        f.write(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" fill="none" stroke="{stroke_color}" '
            f'stroke-width="{stroke_width}">\n'
        )
        for contour in contours:
            if contour.shape[0] < 2:
                continue
            epsilon = simplify_ratio * cv2.arcLength(contour, closed=False)
            approx = cv2.approxPolyDP(contour, epsilon, closed=False)
            if approx.shape[0] < 2:
                continue
            points = approx.reshape(-1, 2)
            d = [f"M {points[0,0]} {points[0,1]}"]
            for x, y in points[1:]:
                d.append(f"L {x} {y}")
            f.write(f"  <path d=\"{' '.join(d)}\"/>\n")
        f.write("</svg>\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert a photo to a technical drawing.")
    parser.add_argument("--input", required=True, type=Path, help="Path to input image")
    parser.add_argument("--output", required=True, type=Path, help="Path to output PNG drawing")
    parser.add_argument("--svg", type=Path, default=None, help="Optional path to output SVG")
    parser.add_argument("--max-dim", type=int, default=1600, help="Resize so max side <= this value (0 to disable)")
    parser.add_argument("--line-width", type=int, default=2, help="Line strengthening in pixels for raster output")
    parser.add_argument("--stroke-width", type=float, default=1.0, help="Stroke width used in SVG export")
    parser.add_argument("--simplify", type=float, default=0.01, help="Polyline simplification ratio for SVG (0-0.1)")
    parser.add_argument("--canny-low", type=int, default=40, help="Canny lower threshold")
    parser.add_argument("--canny-high", type=int, default=120, help="Canny upper threshold")
    parser.add_argument("--adaptive-block", type=int, default=21, help="Adaptive threshold block size (odd >= 3)")
    parser.add_argument("--adaptive-c", type=int, default=2, help="Adaptive threshold constant")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    image_bgr = read_image_color(args.input)
    image_bgr = maybe_resize(image_bgr, None if args.max_dim == 0 else args.max_dim)

    drawing, edges = create_technical_drawing(
        image_bgr=image_bgr,
        line_strength_px=args.line_width,
        canny_low=args.canny_low,
        canny_high=args.canny_high,
        adaptive_block_size=args.adaptive_block,
        adaptive_c=args.adaptive_c,
    )

    save_png(drawing, args.output)

    if args.svg is not None:
        contours_to_svg(
            binary_white_bg_black_lines=drawing,
            svg_path=args.svg,
            stroke_width=args.stroke_width,
            simplify_ratio=args.simplify,
        )


if __name__ == "__main__":
    main()

