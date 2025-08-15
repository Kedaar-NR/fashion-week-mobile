#!/usr/bin/env python3
"""
Test script for Improved Lowheads scraper - tests with specific brand examples
"""

from lowheads_scraper_improved import LowheadsImprovedScraper
import json

def test_specific_brands():
    """Test the scraper with the specific brand examples provided"""
    scraper = LowheadsImprovedScraper()
    
    # Test with the specific brands mentioned
    test_brands = ["GOKYO", "IN_LOVING_MEMORY", "BANISHEDUSA"]
    
    print("Testing Improved Lowheads scraper with specific brands...")
    print("=" * 60)
    
    for brand in test_brands:
        print(f"\nTesting brand: {brand}")
        products = scraper.scrape_brand_products(brand)
        
        if products:
            print(f"✓ Found {len(products)} products")
            # Show first product details
            if products:
                first_product = products[0]
                print(f"  Sample product: {first_product.get('name', 'N/A')}")
                print(f"  Brand: {first_product.get('brand', 'N/A')}")
                print(f"  Price: {first_product.get('price', 'N/A')}")
                print(f"  URL: {first_product.get('url', 'N/A')}")
                print(f"  Image: {first_product.get('image', 'N/A')[:80]}...")
                
                # Show additional images if any
                if first_product.get('additional_images'):
                    print(f"  Additional images: {len(first_product['additional_images'])} found")
        else:
            print("✗ No products found")
    
    print("\n" + "=" * 60)
    print("Test completed!")

def test_single_brand_detailed(brand_name: str):
    """Test a single brand with detailed output"""
    scraper = LowheadsImprovedScraper()
    
    print(f"Detailed test for brand: {brand_name}")
    print("=" * 60)
    
    # Generate URLs for this brand
    urls = scraper.create_brand_urls(brand_name)
    print(f"Generated URLs for {brand_name}:")
    for i, url in enumerate(urls, 1):
        print(f"  {i}. {url}")
    
    # Scrape products
    products = scraper.scrape_brand_products(brand_name)
    
    if products:
        print(f"\n✓ Found {len(products)} products")
        for i, product in enumerate(products[:3], 1):  # Show first 3 products
            print(f"\nProduct {i}:")
            print(f"  Name: {product.get('name', 'N/A')}")
            print(f"  Brand: {product.get('brand', 'N/A')}")
            print(f"  Price: {product.get('price', 'N/A')}")
            print(f"  URL: {product.get('url', 'N/A')}")
            print(f"  Image: {product.get('image', 'N/A')}")
            if product.get('additional_images'):
                print(f"  Additional images: {len(product['additional_images'])}")
    else:
        print("✗ No products found")

if __name__ == "__main__":
    # Test with specific brands
    test_specific_brands()
    
    # Uncomment to test a single brand in detail
    # test_single_brand_detailed("BANISHEDUSA")
