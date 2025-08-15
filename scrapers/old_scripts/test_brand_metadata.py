#!/usr/bin/env python3
"""
Test script to check brand metadata extraction
"""

import requests
from bs4 import BeautifulSoup
import re

def test_brand_metadata():
    """Test brand metadata extraction from product page"""
    url = "https://lowheads.com/products/extreme-clothing-zip-up-hoodie"
    
    print(f"Testing brand metadata extraction from: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Get page text
            page_text = soup.get_text()
            
            print("\nSearching for brand metadata...")
            
            # Look for location
            location_match = re.search(r'This Brand Is From - (.+)', page_text)
            if location_match:
                print(f"✓ Location found: {location_match.group(1).strip()}")
            else:
                print("✗ Location not found")
            
            # Look for shipping info
            shipping_match = re.search(r'This Brand Ships Within - (.+)', page_text)
            if shipping_match:
                print(f"✓ Shipping found: {shipping_match.group(1).strip()}")
            else:
                print("✗ Shipping not found")
            
            # Look for website
            website_match = re.search(r'About This Brand - (.+)', page_text)
            if website_match:
                print(f"✓ Website found: {website_match.group(1).strip()}")
            else:
                print("✗ Website not found")
            
            # Also check for images
            print("\nSearching for product images...")
            images = soup.find_all('img')
            product_images = []
            
            for img in images:
                img_url = img.get('src') or img.get('data-src') or img.get('data-srcset')
                if img_url and 'cdn.shopify.com' in img_url and 'logo' not in img_url.lower():
                    product_images.append(img_url)
            
            print(f"Found {len(product_images)} potential product images")
            for i, img_url in enumerate(product_images[:5], 1):
                print(f"  {i}. {img_url}")
            
        else:
            print(f"Failed to load page: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_brand_metadata()
