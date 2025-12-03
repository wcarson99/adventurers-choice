#!/usr/bin/env python3
"""
Image Background Removal Script

Removes background color from PNG images, replacing it with transparency.
Supports auto-detection of background color or manual specification.
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is not installed.")
    print("Please run: bash scripts/setup-venv.sh")
    sys.exit(1)


def parse_color(color_str: str) -> Tuple[int, int, int]:
    """
    Parse color string in various formats to RGB tuple.
    
    Supports:
    - Hex: #RRGGBB or RRGGBB
    - RGB tuple: (R,G,B)
    - Space-separated: R G B
    """
    color_str = color_str.strip()
    
    # Try hex format
    if color_str.startswith('#'):
        color_str = color_str[1:]
    if len(color_str) == 6 and all(c in '0123456789ABCDEFabcdef' for c in color_str):
        r = int(color_str[0:2], 16)
        g = int(color_str[2:4], 16)
        b = int(color_str[4:6], 16)
        return (r, g, b)
    
    # Try RGB tuple format (R,G,B)
    if color_str.startswith('(') and color_str.endswith(')'):
        parts = color_str[1:-1].split(',')
        if len(parts) == 3:
            return tuple(int(p.strip()) for p in parts)
    
    # Try space-separated format R G B
    parts = color_str.split()
    if len(parts) == 3:
        return tuple(int(p) for p in parts)
    
    raise ValueError(f"Invalid color format: {color_str}. Use hex (#RRGGBB), tuple (R,G,B), or space-separated (R G B)")


def detect_background_color(image: Image.Image) -> Tuple[int, int, int]:
    """
    Auto-detect background color using corner and edge pixel analysis.
    
    Strategy:
    1. Check four corner pixels - if 3+ corners match, use that color
    2. If corners don't match, sample edge pixels and use most common color
    """
    width, height = image.size
    
    # Convert to RGB for consistent color handling
    rgb_image = image.convert('RGB')
    
    # Get corner pixels
    corners = [
        rgb_image.getpixel((0, 0)),  # Top-left
        rgb_image.getpixel((width - 1, 0)),  # Top-right
        rgb_image.getpixel((0, height - 1)),  # Bottom-left
        rgb_image.getpixel((width - 1, height - 1)),  # Bottom-right
    ]
    
    # Count corner matches
    from collections import Counter
    corner_counts = Counter(corners)
    most_common_corner, count = corner_counts.most_common(1)[0]
    
    # If 3+ corners match, use that color
    if count >= 3:
        return most_common_corner
    
    # Otherwise, sample edge pixels
    edge_pixels = []
    
    # Top and bottom edges
    for x in range(width):
        edge_pixels.append(rgb_image.getpixel((x, 0)))
        edge_pixels.append(rgb_image.getpixel((x, height - 1)))
    
    # Left and right edges
    for y in range(height):
        edge_pixels.append(rgb_image.getpixel((0, y)))
        edge_pixels.append(rgb_image.getpixel((width - 1, y)))
    
    # Return most common edge color
    edge_counts = Counter(edge_pixels)
    return edge_counts.most_common(1)[0][0]


def remove_background(
    image: Image.Image,
    bg_color: Tuple[int, int, int],
    tolerance: int = 10
) -> Image.Image:
    """
    Remove background color from image, replacing with transparency.
    Uses per-channel tolerance for color matching.
    
    Args:
        image: Input image
        bg_color: Background color to remove (R, G, B)
        tolerance: Maximum difference per channel (default: 10)
    """
    # Convert to RGBA if not already
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Create new image data
    data = image.getdata()
    new_data = []
    
    bg_r, bg_g, bg_b = bg_color
    
    for pixel in data:
        r, g, b = pixel[:3]
        
        # Per-channel tolerance: check if each channel is within tolerance
        if (abs(r - bg_r) <= tolerance and 
            abs(g - bg_g) <= tolerance and 
            abs(b - bg_b) <= tolerance):
            # Make transparent
            new_data.append((0, 0, 0, 0))
        else:
            # Keep original pixel
            new_data.append(pixel)
    
    # Create new image with modified data
    new_image = Image.new('RGBA', image.size)
    new_image.putdata(new_data)
    
    return new_image


def process_image(
    input_path: Path,
    output_path: Path,
    bg_color: Optional[Tuple[int, int, int]],
    tolerance: int = 10
) -> None:
    """Process a single image file."""
    try:
        # Load image
        image = Image.open(input_path)
        
        # Determine background color
        if bg_color is None:
            detected_color = detect_background_color(image)
            print(f"  {input_path.name}: Auto-detected background color: RGB{detected_color} (tolerance: ±{tolerance})")
            bg_color = detected_color
        else:
            print(f"  {input_path.name}: Using specified background color: RGB{bg_color} (tolerance: ±{tolerance})")
        
        # Remove background
        processed_image = remove_background(image, bg_color, tolerance)
        
        # Save processed image
        output_path.parent.mkdir(parents=True, exist_ok=True)
        processed_image.save(output_path, 'PNG')
        
        print(f"  ✓ Processed: {output_path}")
        
    except Exception as e:
        print(f"  ✗ Error processing {input_path}: {e}")


def find_png_files(directory: Path) -> list[Path]:
    """Recursively find all PNG files in directory."""
    png_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.png'):
                png_files.append(Path(root) / file)
    return sorted(png_files)


def main():
    parser = argparse.ArgumentParser(
        description='Remove background color from PNG images, making it transparent.'
    )
    parser.add_argument(
        '--input',
        type=str,
        required=True,
        help='Input directory containing images to process'
    )
    parser.add_argument(
        '--output',
        type=str,
        required=True,
        help='Output directory where processed images will be saved'
    )
    parser.add_argument(
        '--color',
        type=str,
        default=None,
        help='Background color to remove (hex: #RRGGBB, tuple: (R,G,B), or space-separated: R G B). If not provided, auto-detect.'
    )
    parser.add_argument(
        '--tolerance',
        type=int,
        default=10,
        help='Color matching tolerance per channel (default: 10). Each R, G, B channel can differ by up to this value.'
    )
    
    args = parser.parse_args()
    
    # Validate input directory
    input_dir = Path(args.input)
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {input_dir}")
        sys.exit(1)
    if not input_dir.is_dir():
        print(f"Error: Input path is not a directory: {input_dir}")
        sys.exit(1)
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Parse color if provided
    bg_color = None
    if args.color:
        try:
            bg_color = parse_color(args.color)
            print(f"Using specified background color: RGB{bg_color}")
        except ValueError as e:
            print(f"Error: {e}")
            sys.exit(1)
    else:
        print("Auto-detecting background color for each image...")
    
    # Validate tolerance
    tolerance = args.tolerance
    if tolerance < 0:
        print("Error: Tolerance must be non-negative")
        sys.exit(1)
    
    print(f"Using color matching tolerance: ±{tolerance} per channel\n")
    
    # Find all PNG files
    png_files = find_png_files(input_dir)
    
    if not png_files:
        print(f"No PNG files found in {input_dir}")
        sys.exit(0)
    
    print(f"Found {len(png_files)} PNG file(s) to process\n")
    
    # Process each image
    for input_path in png_files:
        # Calculate relative path from input directory
        try:
            relative_path = input_path.relative_to(input_dir)
        except ValueError:
            # If relative path calculation fails, use filename
            relative_path = Path(input_path.name)
        
        output_path = output_dir / relative_path
        process_image(input_path, output_path, bg_color, tolerance)
    
    print(f"\n✓ Processing complete! Processed {len(png_files)} image(s).")


if __name__ == '__main__':
    main()

