#!/usr/bin/env python3
"""
Simple test using the exact same approach as debug script
"""

from lowheads_scraper_improved import LowheadsImprovedScraper

def simple_test():
    """Test with the exact same approach as debug script"""
    scraper = LowheadsImprovedScraper()
    
    # Test BANISHEDUSA specifically
    brand_name = "BANISHEDUSA"
    url = f"https://lowheads.com/collections/vendors?q={brand_name}"
    
    print(f"Testing URL: {url}")
    
    try:
        response = scraper.session.get(url, timeout=10)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Use the exact same method as debug script
            containers = soup.find_all('div', class_=lambda x: x and 'type-product-grid-item' in x)
            print(f"Found {len(containers)} containers")
            
            if containers:
                # Extract data from first container
                container = containers[0]
                
                # Get text elements
                text_elements = container.find_all(['span', 'div', 'p'], string=True)
                print(f"Text elements: {len(text_elements)}")
                for i, elem in enumerate(text_elements):
                    text = elem.get_text(strip=True)
                    print(f"  {i+1}. '{text}'")
                
                # Get images
                images = container.find_all('img')
                print(f"Images: {len(images)}")
                for i, img in enumerate(images):
                    src = img.get('src') or img.get('data-src') or img.get('data-srcset')
                    print(f"  {i+1}. {src}")
                
                # Get links
                links = container.find_all('a', href=True)
                print(f"Links: {len(links)}")
                for i, link in enumerate(links):
                    print(f"  {i+1}. {link.get('href')}")
                
                # Now try to extract product data using the scraper method
                print("\nTrying scraper extraction method:")
                product_data = scraper.extract_product_data(container, brand_name)
                print(f"Product data: {product_data}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    simple_test()
