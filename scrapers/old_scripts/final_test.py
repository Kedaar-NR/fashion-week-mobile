#!/usr/bin/env python3
"""
Final test to identify the issue with the scraper
"""

import requests
from bs4 import BeautifulSoup
from lowheads_complete_scraper import LowheadsCompleteScraper

def final_test():
    """Test with exact same approach as debug script"""
    brand_name = "BANISHEDUSA"
    url = f"https://lowheads.com/collections/vendors?q={brand_name}"
    
    print(f"Testing URL: {url}")
    
    # Test 1: Direct requests (like debug script)
    print("\n=== TEST 1: Direct requests ===")
    response1 = requests.get(url, timeout=10)
    print(f"Status: {response1.status_code}")
    
    soup1 = BeautifulSoup(response1.text, 'html.parser')
    containers1 = soup1.find_all('div', class_=lambda x: x and 'type-product-grid-item' in x)
    print(f"Containers found: {len(containers1)}")
    
    # Test 2: Scraper session
    print("\n=== TEST 2: Scraper session ===")
    scraper = LowheadsCompleteScraper()
    response2 = scraper.session.get(url, timeout=10)
    print(f"Status: {response2.status_code}")
    
    soup2 = BeautifulSoup(response2.text, 'html.parser')
    containers2 = soup2.find_all('div', class_=lambda x: x and 'type-product-grid-item' in x)
    print(f"Containers found: {len(containers2)}")
    
    # Test 3: Use scraper method but with direct requests
    print("\n=== TEST 3: Use scraper method with direct requests ===")
    if containers1:
        print("Using containers from direct requests...")
        products = []
        for container in containers1:
            listing_data = scraper.extract_product_listing_data(container, brand_name)
            if listing_data['listing_data_complete']:
                print(f"  Found product: {listing_data['name']} - {listing_data['product_url']}")
                # Scrape detailed product page
                detailed_product = scraper.scrape_product_page(
                    listing_data['product_url'], 
                    brand_name, 
                    listing_data
                )
                products.append(detailed_product)
        
        print(f"Total products found: {len(products)}")
        
        if products:
            print("\nFirst product details:")
            product = products[0]
            print(f"  Name: {product.get('name', 'N/A')}")
            print(f"  Detailed Name: {product.get('detailed_name', 'N/A')}")
            print(f"  Price: {product.get('price', 'N/A')}")
            print(f"  Images: {len(product.get('images', []))}")
            print(f"  Videos: {len(product.get('videos', []))}")

if __name__ == "__main__":
    final_test()
