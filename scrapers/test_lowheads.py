#!/usr/bin/env python3
"""
Simple test script for the main Lowheads scraper
Tests with BANISHEDUSA brand
"""

from lowheads_scraper import LowheadsCompleteScraper

def test_main_scraper():
    """Test the main scraper with BANISHEDUSA"""
    scraper = LowheadsCompleteScraper()
    
    print("Testing Main Lowheads Scraper with BANISHEDUSA...")
    print("=" * 60)
    
    # Test with BANISHEDUSA
    brand_name = "BANISHEDUSA"
    products = scraper.scrape_brand_products(brand_name, download_media=True)
    
    if products:
        print(f"\n✓ Found {len(products)} products for {brand_name}")
        
        # Show summary for each product
        for i, product in enumerate(products, 1):
            print(f"\nProduct {i}: {product.get('name', 'N/A')}")
            print(f"  Price: {product.get('price', 'N/A')}")
            print(f"  Images: {len(product.get('images', []))}")
            print(f"  Local Images: {len(product.get('images_local', []))}")
            print(f"  Brand Location: {product.get('brand_metadata', {}).get('location', 'N/A')}")
            print(f"  Brand Website: {product.get('brand_metadata', {}).get('website', 'N/A')}")
    else:
        print("✗ No products found")
    
    print("\n" + "=" * 60)
    print("Test completed!")

if __name__ == "__main__":
    test_main_scraper()
