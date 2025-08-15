#!/usr/bin/env python3
"""
Test script for Lowheads scraper - tests with a few sample brands
"""

from lowheads_scraper import LowheadsScraper
import json

def test_scraper():
    """Test the scraper with a few sample brands"""
    scraper = LowheadsScraper()
    
    # Test with a few sample brands
    test_brands = ["5MOREDAYS", "629", "A STONECOLD STUDIOS PRODUCTION"]
    
    print("Testing Lowheads scraper with sample brands...")
    print("=" * 50)
    
    for brand in test_brands:
        print(f"\nTesting brand: {brand}")
        products = scraper.scrape_brand_products(brand)
        
        if products:
            print(f"✓ Found {len(products)} products")
            # Show first product details
            if products:
                first_product = products[0]
                print(f"  Sample product: {first_product.get('name', 'N/A')}")
                print(f"  Price: {first_product.get('price', 'N/A')}")
                print(f"  Image: {first_product.get('image', 'N/A')[:50]}...")
        else:
            print("✗ No products found")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    test_scraper()
