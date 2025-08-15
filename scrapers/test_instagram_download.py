#!/usr/bin/env python3
"""
Test Instagram Downloader
Tests the Instagram downloader with a few brands to verify functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from download_instagram_content import InstagramDownloader

def test_instagram_download():
    """Test the Instagram downloader with a few brands"""
    
    print("Testing Instagram downloader with 3 brands...")
    print("=" * 60)
    
    # Create downloader instance
    downloader = InstagramDownloader()
    
    # Test with just a few brands first
    test_brands = [
        "DEMIKNJ",  # The brand you mentioned you were on
        "A STONECOLD STUDIOS PRODUCTION",  # The one with lots of content
        "DESCENDANT"  # Another brand to test
    ]
    
    # Override the brands list for testing
    downloader.lowheads_brands = test_brands
    downloader.results['total_brands'] = len(test_brands)
    
    # Test individual brand downloading
    for i, brand in enumerate(test_brands, 1):
        print(f"\n[{i}/{len(test_brands)}] Testing: {brand}")
        try:
            result = downloader.download_brand_instagram_content(brand)
            print(f"✓ Success: {result['brand']}")
            print(f"  - Instagram Handle: @{result['instagram_handle']}")
            print(f"  - Success: {result['success']}")
            
            if result['error']:
                print(f"  - Error: {result['error']}")
            
            if result['command_used']:
                print(f"  - Command: {result['command_used']}")
                
        except Exception as e:
            print(f"✗ Failed: {e}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("Check the brand folders in 'downloads/' for Instagram content.")

if __name__ == "__main__":
    test_instagram_download()
