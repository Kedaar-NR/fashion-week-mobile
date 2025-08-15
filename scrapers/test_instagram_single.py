#!/usr/bin/env python3
"""
Test Instagram Downloader with Single Brand
Tests the Instagram downloader with one brand to verify it works properly
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from download_instagram_content import InstagramDownloader

def test_single_brand():
    """Test the Instagram downloader with a single brand"""
    
    print("Testing Instagram downloader with DEMIKNJ...")
    print("=" * 60)
    
    # Create downloader instance
    downloader = InstagramDownloader()
    
    # Test with just DEMIKNJ
    test_brands = ["DEMIKNJ"]
    
    # Override the brands list for testing
    downloader.lowheads_brands = test_brands
    downloader.results['total_brands'] = len(test_brands)
    
    # Test the brand with authentication
    brand = test_brands[0]
    print(f"Testing: {brand}")
    
    try:
        # Use authentication
        result = downloader.download_brand_instagram_content(brand, use_login=True, username='Kedaar-NR')
        print(f"Brand: {result['brand']}")
        print(f"  - Instagram Handle: @{result['instagram_handle']}")
        print(f"  - Success: {result['success']}")
        
        if result['error']:
            print(f"  - Error: {result['error']}")
        
        if result['command_used']:
            print(f"  - Command: {result['command_used']}")
            
        # Check what was downloaded
        ig_folder = f"downloads/{brand}/IG"
        if os.path.exists(ig_folder):
            files = os.listdir(ig_folder)
            print(f"  - Files downloaded: {len(files)}")
            for file in files:
                print(f"    * {file}")
        else:
            print(f"  - No IG folder found: {ig_folder}")
            
    except Exception as e:
        print(f"Failed: {e}")
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("Check the brand folder in 'downloads/' for Instagram content.")

if __name__ == "__main__":
    test_single_brand()
