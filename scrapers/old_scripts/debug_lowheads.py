#!/usr/bin/env python3
"""
Debug script for Lowheads scraper
"""

import requests
from bs4 import BeautifulSoup
import re

def debug_brand_page(brand_name: str):
    """Debug a specific brand page"""
    base_url = "https://lowheads.com"
    
    # Test the vendor search URL
    url = f"{base_url}/collections/vendors?q={brand_name}"
    print(f"Testing URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Check page title
            title = soup.title.string if soup.title else "No title"
            print(f"Page title: {title}")
            
            # Look for product containers
            print("\nLooking for product containers...")
            
            # Method 1: Direct class search
            containers = soup.find_all('div', class_=lambda x: x and 'type-product-grid-item' in x)
            print(f"Method 1 - Direct class search: Found {len(containers)} containers")
            
            # Method 2: Regex search
            containers2 = soup.find_all('div', {'class': re.compile(r'type-product-grid-item', re.I)})
            print(f"Method 2 - Regex search: Found {len(containers2)} containers")
            
            # Method 3: Any div with product in class
            containers3 = soup.find_all('div', class_=lambda x: x and 'product' in str(x).lower())
            print(f"Method 3 - Any product class: Found {len(containers3)} containers")
            
            # Show first container details if found
            if containers:
                print(f"\nFirst container classes: {containers[0].get('class', [])}")
                
                # Look for product name
                text_elements = containers[0].find_all(['span', 'div', 'p'], string=True)
                print(f"Text elements found: {len(text_elements)}")
                for i, elem in enumerate(text_elements[:5]):
                    text = elem.get_text(strip=True)
                    print(f"  {i+1}. '{text}'")
                
                # Look for images
                images = containers[0].find_all('img')
                print(f"Images found: {len(images)}")
                for i, img in enumerate(images[:3]):
                    src = img.get('src') or img.get('data-src') or img.get('data-srcset')
                    print(f"  {i+1}. {src}")
                
                # Look for links
                links = containers[0].find_all('a', href=True)
                print(f"Links found: {len(links)}")
                for i, link in enumerate(links[:3]):
                    print(f"  {i+1}. {link.get('href')}")
            
        else:
            print(f"Failed to load page: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_brand_page("BANISHEDUSA")
