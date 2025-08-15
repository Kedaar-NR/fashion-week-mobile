#!/usr/bin/env python3
"""
Test Instagram Content Scraper
Tests the Instagram content scraper with a few brands to verify functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from instagram_content_scraper import InstagramContentScraper
import json

def test_instagram_content_scraper():
    """Test the Instagram content scraper with a few brands"""
    
    print("Testing Instagram content scraper with 3 brands...")
    print("=" * 50)
    
    # Load verified accounts
    with open('instagram_verification_results.json', 'r') as f:
        all_accounts = json.load(f)
    
    # Get first 3 public accounts
    test_accounts = [acc for acc in all_accounts if acc['status'] == 'public'][:3]
    
    scraper = InstagramContentScraper()
    
    # Override the verified accounts for testing
    scraper.verified_accounts = test_accounts
    
    # Test individual brand scraping
    for i, account in enumerate(test_accounts, 1):
        print(f"\n[{i}/{len(test_accounts)}] Testing: {account['original_brand']} (@{account['handle']})")
        try:
            result = scraper.scrape_brand_instagram(account)
            print(f"✓ Success: {result['brand']}")
            print(f"  - Images: {result.get('total_images', 0)}")
            print(f"  - Videos: {result.get('total_videos', 0)}")
        except Exception as e:
            print(f"✗ Failed: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("Check the brand folders in 'downloads/' for Instagram content.")

if __name__ == "__main__":
    test_instagram_content_scraper()
