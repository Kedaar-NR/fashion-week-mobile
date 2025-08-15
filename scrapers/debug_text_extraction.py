#!/usr/bin/env python3
"""
Debug script to see what text content is available on the product page
"""

import requests
from bs4 import BeautifulSoup
import re

def debug_text_extraction():
    """Debug text extraction from product page"""
    url = "https://lowheads.com/products/extreme-clothing-zip-up-hoodie"
    
    print(f"Debugging text extraction from: {url}")
    print("=" * 80)
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            print(f"Page title: {soup.title.string if soup.title else 'No title'}")
            
            # Look for brand metadata patterns
            print(f"\n🔍 LOOKING FOR BRAND METADATA:")
            print("Searching for patterns like 'This Brand Is From', 'Ships Within', etc.")
            
            # Search for specific text patterns
            page_text = soup.get_text()
            
            # Look for brand location
            location_patterns = [
                r'This Brand Is From[^.]*',
                r'From[^.]*[Cc]ity[^.]*',
                r'[Nn]ew [Yy]ork[^.]*',
                r'Location[^.]*',
            ]
            
            for pattern in location_patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                if matches:
                    print(f"  Location pattern '{pattern}': {matches[:3]}")
            
            # Look for shipping info
            shipping_patterns = [
                r'[Ss]hips [Ww]ithin[^.]*',
                r'[Ss]hipping[^.]*',
                r'[Dd]ays[^.]*',
                r'[Ww]eek[^.]*',
            ]
            
            for pattern in shipping_patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                if matches:
                    print(f"  Shipping pattern '{pattern}': {matches[:3]}")
            
            # Look for brand website
            website_patterns = [
                r'banishedusa\.com',
                r'[Ww]ebsite[^.]*',
                r'About This Brand[^.]*',
            ]
            
            for pattern in website_patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                if matches:
                    print(f"  Website pattern '{pattern}': {matches[:3]}")
            
            # Look for product description
            print(f"\n📝 LOOKING FOR PRODUCT DESCRIPTION:")
            desc_patterns = [
                r'[Hh]eavyweight[^.]*',
                r'[Ff]rench [Tt]erry[^.]*',
                r'[Aa]cid [Ww]ash[^.]*',
                r'[Ee]mbroidered[^.]*',
                r'[Dd]rawstrings[^.]*',
                r'[Pp]rint on[^.]*',
                r'[Cc]ropped[^.]*',
                r'[Oo]versized[^.]*',
                r'[Mm]odel is[^.]*',
            ]
            
            for pattern in desc_patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                if matches:
                    print(f"  Description pattern '{pattern}': {matches[:3]}")
            
            # Look for price
            print(f"\n💰 LOOKING FOR PRICE:")
            price_patterns = [
                r'\$\d+',
                r'[\$£€]\s*\d+(?:[.,]\d{2})?',
                r'[Pp]rice[^.]*',
            ]
            
            for pattern in price_patterns:
                matches = re.findall(pattern, page_text, re.IGNORECASE)
                if matches:
                    print(f"  Price pattern '{pattern}': {matches[:5]}")
            
            # Show all text content (first 2000 chars)
            print(f"\n📄 ALL TEXT CONTENT (first 2000 chars):")
            print("-" * 40)
            print(page_text[:2000])
            print("-" * 40)
            
        else:
            print(f"Failed to load page: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_text_extraction()
