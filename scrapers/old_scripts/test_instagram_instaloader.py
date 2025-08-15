#!/usr/bin/env python3
"""
Test Instagram Instaloader Scraper
Tests the Instagram scraper with a few brands to verify functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from instagram_instaloader_scraper import InstagramInstaloaderScraper

def test_instagram_instaloader():
    """Test the Instagram Instaloader scraper with a few brands"""
    
    print("Testing Instagram Instaloader scraper with 3 brands...")
    print("=" * 60)
    
    # Create scraper instance
    scraper = InstagramInstaloaderScraper()
    
    # Test with just a few brands first
    test_brands = [
        "DEMIKNJ",  # The brand you mentioned you were on
        "A STONECOLD STUDIOS PRODUCTION",  # The one with lots of content
        "DESCENDANT"  # Another brand to test
    ]
    
    # Override the brands list for testing
    scraper.lowheads_brands = test_brands
    scraper.results['total_brands'] = len(test_brands)
    
    # Test individual brand scraping
    for i, brand in enumerate(test_brands, 1):
        print(f"\n[{i}/{len(test_brands)}] Testing: {brand}")
        try:
            result = scraper.download_brand_instagram_content(brand)
            print(f"✓ Success: {result['brand']}")
            print(f"  - Instagram Handle: @{result['instagram_handle']}")
            print(f"  - Posts: {result['posts_downloaded']}")
            print(f"  - Stories: {result['stories_downloaded']}")
            print(f"  - Highlights: {result['highlights_downloaded']}")
            print(f"  - Profile Pic: {'Yes' if result['profile_pic_downloaded'] else 'No'}")
            
            if result['error']:
                print(f"  - Error: {result['error']}")
                
        except Exception as e:
            print(f"✗ Failed: {e}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("Check the brand folders in 'downloads/' for Instagram content.")

if __name__ == "__main__":
    test_instagram_instaloader()
