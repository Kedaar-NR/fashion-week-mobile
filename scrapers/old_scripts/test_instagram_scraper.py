#!/usr/bin/env python3
"""
Test Instagram Scraper
Tests the Instagram scraper with a few brands to verify functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from instagram_api_scraper import InstagramAPIScraper
import logging

def test_instagram_scraper():
    """Test the Instagram scraper with a few brands"""
    
    # Test with just a few lowheads brands first
    test_brands = [
        "https://instagram.com/5moredays",
        "https://instagram.com/629", 
        "https://instagram.com/astonecoldstudiosproduction"
    ]
    
    print("Testing Instagram scraper with 3 brands...")
    print("=" * 50)
    
    scraper = InstagramAPIScraper()
    
    # Override the brand URLs for testing
    scraper.brand_urls = test_brands
    
    # Test individual brand scraping
    for i, url in enumerate(test_brands, 1):
        print(f"\n[{i}/{len(test_brands)}] Testing: {url}")
        try:
            result = scraper.scrape_brand_instagram(url)
            print(f"✓ Success: {result['brand']}")
            print(f"  - Posts: {result.get('total_posts', 0)}")
            print(f"  - Images: {result.get('total_images', 0)}")
            print(f"  - Videos: {result.get('total_videos', 0)}")
        except Exception as e:
            print(f"✗ Failed: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("Check the 'instagram_content/' folder for downloaded content.")

if __name__ == "__main__":
    test_instagram_scraper()
