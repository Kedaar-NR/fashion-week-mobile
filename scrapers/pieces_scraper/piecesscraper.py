#!/usr/bin/env python3

import requests
import pandas as pd
import time
import re
import json
from typing import List, Dict, Optional, Tuple
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os
from datetime import datetime

class ProductScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
        
    def scrape_website(self, url: str) -> List[Dict]:
        if not url.startswith('http'):
            url = 'https://' + url
            
        print(f"Scraping products from: {url}")
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            products = []
            
            shopify_products = self._scrape_shopify(soup, url)
            if shopify_products:
                products.extend(shopify_products)
            
            woo_products = self._scrape_woocommerce(soup, url)
            if woo_products:
                products.extend(woo_products)
            
            if not products:
                products = self._scrape_generic(soup, url)
            
            if not products:
                products = self._scrape_json_ld(soup, url)
            
            print(f"Found {len(products)} products")
            return products
            
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return []
    
    def _scrape_shopify(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        products = []
        
        product_selectors = [
            '.product-item',
            '.product-card',
            '.grid-product',
            '.product-wrap',
            '.product-container',
            '[data-product-id]',
            '.product'
        ]
        
        for selector in product_selectors:
            product_elements = soup.select(selector)
            if product_elements:
                for element in product_elements:
                    product = self._extract_product_info(element, base_url)
                    if product:
                        products.append(product)
                break
        
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and 'var meta' in script.string and 'product' in script.string:
                try:
                    shopify_data = self._extract_shopify_json(script.string)
                    if shopify_data:
                        products.extend(shopify_data)
                except:
                    continue
        
        return products
    
    def _scrape_woocommerce(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        products = []
        
        woo_selectors = [
            '.woocommerce-product',
            '.product-item',
            '.wc-block-grid__product',
            '.product-small',
            '.product-wrapper'
        ]
        
        for selector in woo_selectors:
            product_elements = soup.select(selector)
            if product_elements:
                for element in product_elements:
                    product = self._extract_product_info(element, base_url)
                    if product:
                        products.append(product)
                break
        
        return products
    
    def _scrape_generic(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        products = []
        
        generic_selectors = [
            '.product',
            '.item',
            '.card',
            '[class*="product"]',
            '[class*="item"]',
            '[data-product]',
            '.grid-item',
            '.collection-item'
        ]
        
        for selector in generic_selectors:
            product_elements = soup.select(selector)
            if len(product_elements) > 2:
                for element in product_elements:
                    product = self._extract_product_info(element, base_url)
                    if product and product.get('name'):
                        products.append(product)
                break
        
        return products
    
    def _scrape_json_ld(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        products = []
        
        json_scripts = soup.find_all('script', {'type': 'application/ld+json'})
        for script in json_scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if data.get('@type') == 'Product':
                        product = self._parse_json_ld_product(data)
                        if product:
                            products.append(product)
                    elif data.get('@type') == 'ItemList':
                        for item in data.get('itemListElement', []):
                            if item.get('@type') == 'Product':
                                product = self._parse_json_ld_product(item)
                                if product:
                                    products.append(product)
            except:
                continue
        
        return products
    
    def _extract_product_info(self, element: BeautifulSoup, base_url: str) -> Optional[Dict]:
        product = {}
        
        name_selectors = [
            'h1', 'h2', 'h3', 'h4',
            '.product-title',
            '.product-name',
            '.title',
            '.name',
            '[class*="title"]',
            '[class*="name"]',
            'a'
        ]
        
        name = self._find_text_by_selectors(element, name_selectors)
        if not name or len(name) < 2:
            return None
        
        product['name'] = name.strip()
        
        price_selectors = [
            '.price',
            '.cost',
            '.amount',
            '[class*="price"]',
            '[class*="cost"]',
            '[data-price]'
        ]
        
        price = self._find_price(element, price_selectors)
        product['price'] = price
        
        image_url = self._find_image(element, base_url)
        product['image_url'] = image_url
        
        availability = self._find_availability(element)
        product['availability'] = availability
        product['in_stock'] = availability.lower() not in ['sold out', 'out of stock', 'unavailable']
        
        product_url = self._find_product_url(element, base_url)
        product['product_url'] = product_url
        
        product['description'] = self._find_description(element)
        product['brand'] = self._extract_brand_from_url(base_url)
        
        return product
    
    def _find_text_by_selectors(self, element: BeautifulSoup, selectors: List[str]) -> Optional[str]:
        for selector in selectors:
            found = element.select_one(selector)
            if found:
                text = found.get_text().strip()
                if text and len(text) > 1:
                    return text
        return None
    
    def _find_price(self, element: BeautifulSoup, selectors: List[str]) -> Optional[str]:
        for selector in selectors:
            price_elem = element.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text().strip()
                price_match = re.search(r'[\$£€¥]?(\d+(?:[.,]\d{2})?)', price_text)
                if price_match:
                    return price_text
        
        text = element.get_text()
        price_patterns = [
            r'\$\d+(?:\.\d{2})?',
            r'£\d+(?:\.\d{2})?',
            r'€\d+(?:\.\d{2})?',
            r'\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP)',
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        
        return None
    
    def _find_image(self, element: BeautifulSoup, base_url: str) -> Optional[str]:
        img_elem = element.select_one('img')
        if img_elem:
            src = img_elem.get('src') or img_elem.get('data-src') or img_elem.get('data-lazy-src')
            if src:
                return urljoin(base_url, src)
        return None
    
    def _find_availability(self, element: BeautifulSoup) -> str:
        availability_selectors = [
            '.availability',
            '.stock',
            '.status',
            '[class*="stock"]',
            '[class*="availability"]'
        ]
        
        for selector in availability_selectors:
            avail_elem = element.select_one(selector)
            if avail_elem:
                return avail_elem.get_text().strip()
        
        text = element.get_text().lower()
        if any(term in text for term in ['sold out', 'out of stock', 'unavailable']):
            return 'Sold Out'
        
        return 'In Stock'
    
    def _find_product_url(self, element: BeautifulSoup, base_url: str) -> Optional[str]:
        link_elem = element.select_one('a')
        if link_elem and link_elem.get('href'):
            return urljoin(base_url, link_elem['href'])
        return None
    
    def _find_description(self, element: BeautifulSoup) -> Optional[str]:
        desc_selectors = [
            '.description',
            '.summary',
            '.excerpt',
            '[class*="description"]'
        ]
        
        return self._find_text_by_selectors(element, desc_selectors)
    
    def _extract_brand_from_url(self, url: str) -> str:
        domain = urlparse(url).netloc
        return domain.replace('www.', '').split('.')[0]
    
    def _extract_shopify_json(self, script_text: str) -> List[Dict]:
        products = []
        return products
    
    def _parse_json_ld_product(self, data: Dict) -> Optional[Dict]:
        product = {}
        
        product['name'] = data.get('name', '')
        
        offers = data.get('offers', {})
        if isinstance(offers, dict):
            product['price'] = offers.get('price', '')
            product['availability'] = offers.get('availability', '').split('/')[-1]
        
        image = data.get('image', '')
        if isinstance(image, list) and image:
            product['image_url'] = image[0]
        elif isinstance(image, str):
            product['image_url'] = image
        
        product['description'] = data.get('description', '')
        
        return product if product.get('name') else None
    
    def save_to_excel(self, products: List[Dict], website_url: str, filename: str = None) -> str:
        # Create brand_data/xlsx directory if it doesn't exist
        xlsx_dir = "brand_data/xlsx"
        os.makedirs(xlsx_dir, exist_ok=True)
        
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            domain = urlparse(website_url).netloc.replace('www.', '').replace('.', '_')
            filename = f"{domain}_products_{timestamp}.xlsx"
        
        # Ensure filename is in the xlsx directory
        if not filename.startswith(xlsx_dir):
            filename = os.path.join(xlsx_dir, filename)
        
        df = pd.DataFrame(products)
        
        column_order = ['name', 'price', 'availability', 'in_stock', 'brand', 'image_url', 'product_url', 'description']
        
        existing_columns = [col for col in column_order if col in df.columns]
        df = df[existing_columns]
        
        sheet_name = urlparse(website_url).netloc.replace('www.', '')[:31]
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            worksheet = writer.sheets[sheet_name]
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        print(f"Products saved to {filename}")
        return filename
    
    def save_to_csv(self, products: List[Dict], website_url: str, filename: str = None) -> str:
        # Create brand_data/csv directory if it doesn't exist
        csv_dir = "brand_data/csv"
        os.makedirs(csv_dir, exist_ok=True)
        
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            domain = urlparse(website_url).netloc.replace('www.', '').replace('.', '_')
            filename = f"{domain}_products_{timestamp}.csv"
        
        # Ensure filename is in the csv directory
        if not filename.startswith(csv_dir):
            filename = os.path.join(csv_dir, filename)
        
        df = pd.DataFrame(products)
        df.to_csv(filename, index=False)
        print(f"Products saved to {filename}")
        return filename

def main():
    scraper = ProductScraper()
    
    while True:
        website = input("\nEnter the website URL (or 'quit' to exit): ").strip()
        
        if website.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if not website:
            print("Please enter a valid URL.")
            continue
        
        products = scraper.scrape_website(website)
        
        if not products:
            print("No products found. The website might use a different structure.")
            continue
        
        print(f"\nFound {len(products)} products:")
        for i, product in enumerate(products[:5], 1):
            print(f"\n{i}. {product.get('name', 'Unknown')}")
            print(f"   Price: {product.get('price', 'N/A')}")
            print(f"   Status: {product.get('availability', 'N/A')}")
            print(f"   In Stock: {product.get('in_stock', 'N/A')}")
        
        if len(products) > 5:
            print(f"\n... and {len(products) - 5} more products")
        
        # Filter out products with empty names and keep only unique product URLs
        seen_urls = set()
        filtered_products = []
        for product in products:
            if product.get('name') not in ['', None] and product.get('product_url') not in seen_urls:
                seen_urls.add(product.get('product_url'))
                filtered_products.append(product)
        products = filtered_products
        excel_file = scraper.save_to_excel(products, website)
        csv_file = scraper.save_to_csv(products, website)
        
        print(f"\nFiles saved:")
        print(f"Excel: {excel_file}")
        print(f"CSV: {csv_file}")
        print(f"Sheet name: {urlparse(website).netloc.replace('www.', '')}")

if __name__ == "__main__":
    main()