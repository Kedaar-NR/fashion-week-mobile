#!/usr/bin/env python3
"""
Debug script to see what images are on product pages
"""

import requests
from bs4 import BeautifulSoup
import re

def debug_product_images():
    """Debug image extraction from product page"""
    url = "https://lowheads.com/products/extreme-clothing-zip-up-hoodie"
    
    print(f"Debugging product page: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            print(f"\nPage title: {soup.title.string if soup.title else 'No title'}")
            
            # Find all images
            all_images = soup.find_all('img')
            print(f"\nTotal images found: {len(all_images)}")
            
            # Show all image sources
            for i, img in enumerate(all_images[:10], 1):
                src = img.get('src')
                data_src = img.get('data-src')
                data_srcset = img.get('data-srcset')
                alt = img.get('alt', 'No alt')
                classes = img.get('class', [])
                
                print(f"\nImage {i}:")
                print(f"  src: {src}")
                print(f"  data-src: {data_src}")
                print(f"  data-srcset: {data_srcset}")
                print(f"  alt: {alt}")
                print(f"  classes: {classes}")
                
                # Check if it's a product image
                if src and 'cdn.shopify.com' in src and 'logo' not in src.lower():
                    print(f"  ✓ Potential product image: {src}")
            
            # Look for background images
            print(f"\nLooking for background images...")
            bg_elements = soup.find_all(style=re.compile(r'background-image'))
            print(f"Found {len(bg_elements)} elements with background images")
            
            for i, elem in enumerate(bg_elements[:5], 1):
                style = elem.get('style', '')
                print(f"\nBackground {i}: {style[:100]}...")
            
            # Look for data attributes
            print(f"\nLooking for data attributes...")
            data_elements = soup.find_all(attrs=re.compile(r'data-.*'))
            print(f"Found {len(data_elements)} elements with data attributes")
            
            for elem in data_elements[:5]:
                attrs = {k: v for k, v in elem.attrs.items() if k.startswith('data-')}
                if attrs:
                    print(f"  {attrs}")
            
        else:
            print(f"Failed to load page: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_product_images()
