#!/usr/bin/env python3
"""
Compare requests between debug script and scraper
"""

import requests
from bs4 import BeautifulSoup
from lowheads_scraper_improved import LowheadsImprovedScraper

def compare_requests():
    """Compare requests between debug script and scraper"""
    brand_name = "BANISHEDUSA"
    url = f"https://lowheads.com/collections/vendors?q={brand_name}"
    
    print("=== DEBUG SCRIPT APPROACH ===")
    # Debug script approach
    response1 = requests.get(url, timeout=10)
    print(f"Status: {response1.status_code}")
    print(f"Content length: {len(response1.text)}")
    
    soup1 = BeautifulSoup(response1.text, 'html.parser')
    containers1 = soup1.find_all('div', class_=lambda x: x and 'type-product-grid-item' in x)
    print(f"Containers found: {len(containers1)}")
    
    print("\n=== SCRAPER APPROACH ===")
    # Scraper approach
    scraper = LowheadsImprovedScraper()
    response2 = scraper.session.get(url, timeout=10)
    print(f"Status: {response2.status_code}")
    print(f"Content length: {len(response2.text)}")
    
    soup2 = BeautifulSoup(response2.text, 'html.parser')
    containers2 = soup2.find_all('div', class_=lambda x: x and 'type-product-grid-item' in x)
    print(f"Containers found: {len(containers2)}")
    
    # Compare headers
    print("\n=== HEADER COMPARISON ===")
    print("Debug script headers:")
    for key, value in response1.request.headers.items():
        print(f"  {key}: {value}")
    
    print("\nScraper headers:")
    for key, value in response2.request.headers.items():
        print(f"  {key}: {value}")
    
    # Check if content is different
    if response1.text != response2.text:
        print("\n=== CONTENT DIFFERENCE ===")
        print("The responses are different!")
        print(f"Debug script has 'type-product-grid-item': {'type-product-grid-item' in response1.text}")
        print(f"Scraper has 'type-product-grid-item': {'type-product-grid-item' in response2.text}")
    else:
        print("\n=== CONTENT COMPARISON ===")
        print("The responses are identical!")

if __name__ == "__main__":
    compare_requests()
