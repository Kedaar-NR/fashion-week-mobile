#!/usr/bin/env python3
"""
Test script to check what data is extracted from a specific product page
"""

from lowheads_scraper import LowheadsCompleteScraper

def test_specific_product():
    """Test the specific product page"""
    scraper = LowheadsCompleteScraper()
    
    # Test the specific product URL
    product_url = "https://lowheads.com/products/extreme-clothing-zip-up-hoodie"
    
    print("Testing Specific Product Page...")
    print("=" * 60)
    print(f"URL: {product_url}")
    print("=" * 60)
    
    # Create mock data to test the product page scraping
    brand_name = "BANISHEDUSA"
    listing_data = {
        'name': 'Extreme Clothing Zip-up Hoodie',
        'url': product_url,
        'price': '$85.00'
    }
    
    # Test the product page scraping
    detailed_product = scraper.scrape_product_page(product_url, brand_name, listing_data)
    
    if detailed_product:
        print(f"\n✅ Product Name: {detailed_product.get('detailed_name', 'N/A')}")
        print(f"✅ Price: {detailed_product.get('detailed_price', 'N/A')}")
        print(f"✅ Description: {detailed_product.get('description', 'N/A')}")
        print(f"✅ Variants: {detailed_product.get('variants', 'N/A')}")
        
        # Check brand metadata
        brand_metadata = detailed_product.get('brand_metadata', {})
        print(f"\n🏷️  BRAND METADATA:")
        print(f"   Location: {brand_metadata.get('location', 'N/A')}")
        print(f"   Shipping Time: {brand_metadata.get('shipping_time', 'N/A')}")
        print(f"   Website: {brand_metadata.get('website', 'N/A')}")
        
        # Check images
        images = detailed_product.get('images', [])
        print(f"\n📸 IMAGES ({len(images)} found):")
        for i, img_url in enumerate(images, 1):
            print(f"   {i}. {img_url}")
        
        # Check videos
        videos = detailed_product.get('videos', [])
        print(f"\n🎥 VIDEOS ({len(videos)} found):")
        for i, video_url in enumerate(videos, 1):
            print(f"   {i}. {video_url}")
            
    else:
        print("❌ Failed to scrape product page")
    
    print("\n" + "=" * 60)
    print("Test completed!")

if __name__ == "__main__":
    test_specific_product()
