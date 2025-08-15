#!/usr/bin/env python3
"""
Test script for Complete Lowheads scraper - tests with BANISHEDUSA
"""

from lowheads_complete_scraper import LowheadsCompleteScraper

def test_banishedusa():
    """Test the complete scraper with BANISHEDUSA"""
    scraper = LowheadsCompleteScraper()
    
    print("Testing Complete Lowheads scraper with BANISHEDUSA...")
    print("=" * 60)
    
    # Test with BANISHEDUSA
    brand_name = "BANISHEDUSA"
    products = scraper.scrape_brand_products(brand_name, download_media=True)
    
    if products:
        print(f"\n✓ Found {len(products)} products for {brand_name}")
        
        # Show details for each product
        for i, product in enumerate(products, 1):
            print(f"\nProduct {i}:")
            print(f"  Name: {product.get('name', 'N/A')}")
            print(f"  Detailed Name: {product.get('detailed_name', 'N/A')}")
            print(f"  Brand: {product.get('brand', 'N/A')}")
            print(f"  Price: {product.get('price', 'N/A')}")
            print(f"  Detailed Price: {product.get('detailed_price', 'N/A')}")
            print(f"  URL: {product.get('product_url', 'N/A')}")
            print(f"  Listing Image: {product.get('listing_image', 'N/A')}")
            print(f"  Listing Image Local: {product.get('listing_image_local', 'N/A')}")
            print(f"  Product Images: {len(product.get('images', []))}")
            print(f"  Product Images Local: {len(product.get('images_local', []))}")
            print(f"  Product Videos: {len(product.get('videos', []))}")
            print(f"  Product Videos Local: {len(product.get('videos_local', []))}")
            print(f"  Description: {product.get('description', 'N/A')[:100]}...")
            print(f"  Variants: {product.get('variants', [])}")
            
            # Show image URLs
            if product.get('images'):
                print(f"  Image URLs:")
                for j, img_url in enumerate(product['images'][:3], 1):
                    print(f"    {j}. {img_url}")
                if len(product['images']) > 3:
                    print(f"    ... and {len(product['images']) - 3} more")
    else:
        print("✗ No products found")
    
    print("\n" + "=" * 60)
    print("Test completed!")

if __name__ == "__main__":
    test_banishedusa()
