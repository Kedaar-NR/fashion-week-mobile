# Lowheads Scrapers

I filled this folder with scrapers for extracting data from the Lowheads website (and all the IGs of those brands)

## Main Scrapers

### `lowheads_scraper.py` - **MAIN SCRAPER**
**Complete Lowheads Brand Data Scraper**

**What it does:**
- Scrapes all 150+ brands from lowheads.com
- Handles both direct brand collections and vendor search pages
- Extracts complete product data: names, prices, descriptions, variants
- Downloads all product images and videos
- Creates organized folder structure: `downloads/[BRAND]/[PRODUCT]/`
- Generates comprehensive data sheets (JSON + CSV)

**Features:**
- Extracts brand metadata (location, shipping time, website)
- Downloads listing images and product images
- Creates organized folder structure
- Handles pagination and rate limiting
- Parallel processing option
- Comprehensive error handling

**Usage:**
```bash
# Test with single brand
python3 test_lowheads.py

# Run complete scrape of all brands
python3 lowheads_scraper.py
```

**Output:**
- `lowheads_complete_data.json` - Complete dataset
- `lowheads_products.csv` - Spreadsheet with all data and media links
- `downloads/` folder - All images organized by brand/product

## Test Scripts

### `test_lowheads.py` - **MAIN TEST SCRIPT**
Tests the main scraper with BANISHEDUSA brand to verify functionality.

## Other Scrapers

### `pieces_scraper/` - Pieces Scraper
Contains the pieces scraper functionality.

### `Old Lowheads/` - Legacy Files
Contains old versions and test files that are no longer needed.

## Folder Structure

```
scrapers/
├── lowheads_scraper.py          # MAIN SCRAPER
├── test_lowheads.py             # MAIN TEST SCRIPT
├── README.md                    # This file
├── pieces_scraper/              # Pieces scraper
├── Old Lowheads/                # Legacy files
├── brand_bios.csv               # Brand data
├── brand_bios.xlsx              # Brand data
└── igdescriptionscraper.py      # Instagram scraper
```

## Download Structure

The scraper creates this folder structure:
```
downloads/
└── [BRAND_NAME]/
    ├── [PRODUCT_NAME_1]/
    │   ├── listing_image.jpg
    │   ├── image_1.jpg
    │   ├── image_2.jpg
    │   └── video_1.mp4
    └── [PRODUCT_NAME_2]/
        ├── listing_image.jpg
        └── image_1.jpg
```

## CSV Data Sheet

The scraper generates a comprehensive CSV with:
- Brand name, product name, prices
- Product URLs and descriptions
- All image URLs (listing + product images)
- Local file paths for downloaded media
- Brand metadata (location, shipping time, website)
- Product variants and timestamps

## Setup

1. Install dependencies:
```bash
cd ..
python3 -m venv scrapers_env
source scrapers_env/bin/activate
pip install requests beautifulsoup4
```

2. Run the scraper:
```bash
cd scrapers
python3 lowheads_scraper.py
```
