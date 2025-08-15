#!/usr/bin/env python3
"""
Lowheads Complete Brand Data Scraper
Scrapes all brand information, products, prices, and images from lowheads.com
Handles both vendor search pages and individual product pages
Downloads all images and videos to organized folders
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import os
from urllib.parse import urljoin, urlparse, quote
import re
from datetime import datetime
import concurrent.futures
from typing import List, Dict, Optional
import csv

class LowheadsCompleteScraper:
    def __init__(self, base_url="https://lowheads.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        # Complete list of all brands from the website
        self.BRANDS = [
            "5MOREDAYS", "629", "A STONECOLD STUDIOS PRODUCTION", "ABSTRAITE DESIGN", "ACD™",
            "ACTIVIST PARIS", "AKHIELO", "AKI'S GALLERY", "ALREADY WRITTEN", "AMBERBYSOUL",
            "AMESCENSE", "ANGEL ARCADE", "ANTHONY JAMES", "APRILLAND", "ARRIVAL WORLDWIDE",
            "AYSM", "BAD HABITS LA", "BAGJIO", "BALACLAVAS", "BANISHDIARIES", "BANISHEDUSA",
            "BEANIES", "BEANS", "BELACARTES", "BIRTH OF ROYAL CHILD", "BIZZRAD", "BORIS KRUEGER",
            "BORNTODIE™", "BRAKKA GARMENTS", "BRANDONWVARGAS", "CAMP XTRA", "CASPER", "CBAKAPS",
            "CHALK.PRESS", "CHEATIN SNAKES WORLDWIDE", "CHILLDREN", "CIELOS LOS ANGELES",
            "CORRUPTKID", "COUCOU BEBE", "COWBOY HEARTS", "CRYSTAL RIVER", "CUTS BY LOWHEADS",
            "DAEKER", "DEATH 56 SENTENCE", "DEMIKNJ", "DENIM", "DESCENDANT", "DINGBATS-FONT",
            "DOCTORGARMENTZ", "DOLOR", "DSTRYRWEAR", "E4ENYTHING", "EMERSON STONE",
            "EMOTIONAL DISTRESS", "EMPTY SPACE(S)", "EMPTY SPACES", "EREHWON", "EXCESS",
            "EXISTS PURE", "EYECRAVE", "FACIANE [FÀSH•ON]", "FAIT PAR LUI", "FALSEWORKCLUB",
            "FISHFELON", "FNKSTUDIOS", "FOUNTAIN OF SOUL", "FRAUDULENT", "GBUCK", "GEMINI",
            "GEN 2", "GINKO ULTRA", "GLVSSIC", "GOKYO", "HAVEYOUDIEDBEFORE", "HEAVROLET",
            "HIS CARNAGE", "HLYWRK", "HORN HEROES", "HUBANE", "HWASAN", "IDIEDLASTNIGHT",
            "IN_LOVING_MEMORY", "JACKJOHNJR", "JAKISCHRIST", "JALONISDEAD", "JAXON JET",
            "JOON", "KITOWARES", "KNARE", "KORRUPT", "LE LOSANGE", "LILBASTARDBOY",
            "LONEARCHIVE", "LOSE RELIGION", "LOVE, AMERICA", "LOVEDYLANTHOMAS", "LOVEHARDT",
            "LUCIEN SAGAR", "LUXENBURG", "MANIC DIARIES", "MEKKACHI", "MICU", "MILES FRANKLIN",
            "MIND BOWLING", "MORALE", "NETSU DENIM", "NIK BENTEL STUDIO", "NO.ERRORS",
            "NOCIETY", "NOT1%FLAW", "OBJECT FROM NOTHING", "OMEL'CHUK ATELIER", "OMNEE WORLD",
            "OMOSTUDIOZ", "ONLYTHEBADSTUDIOS", "PANELS BY THOMASJAMES", "PANELS.",
            "PARAPHERNALIA ⁹⁷", "PLA4", "PLAGUEROUND", "PLASTIC STUDIOS", "PO5HBOY",
            "POLO CUTTY", "PRESTON SEVIN", "PRIVATE AFFAIR", "PROHIBITISM", "PSYCHWARD",
            "PUBLIC HOUSING SKATE TEAM", "PUFFERS", "PUPPET THEATER", "PURGATORY", "PYTHIA",
            "RAIMON ESPITALIER", "RAWCKSTAR LIFESTYLE", "REDHEAT", "REVENIGHTS", "RITTEN",
            "ROMANCATCHER", "ROY PUBLIC LABEL", "RSEKAI", "SCAPEGRACE", "SCY BY JULIUS",
            "SHAWZIP", "SHEFF", "SLUMPMAN", "SONGSAMNOUNG", "SOUTH OF HEAVEN", "SPECTRUM THEORY",
            "SQUIGGLES", "STAFF PICKS", "STOLEN ARTS", "STOMACH ?", "SUNNY UNDERGROUND MARKET",
            "SUNSHINE REIGNS", "SWNK-X9", "TATE MARSLAND", "TECNINE GROUP", "THE BLANK TRAVELER",
            "THE CHARTREUSE HUMAN", "THE LAUGHING GEISHA", "THE PEACEFUL PEOPLE", "TRIPPIE GLUCK",
            "TRIPSHIT", "TROUBLE NYC", "UNWARRANTED.ATL", "VACANT WINTER", "VENGEANCE STUDIOS",
            "VISUALS BY JADA", "VOSTRETTI", "VUOTA", "WAVEY WAKARU", "WHELM", "WHYW0ULDULIE",
            "WICKED GLIMMER", "WITHOUT A CAUSE", "WNTD APPAREL", "WOMEN'S", "WORKSOFMADNESS",
            "WORSHIP", "WORSTCASE", "XENON", "YACHTY IN ELIAS", "YAMI MIYAZAKI", "YOURAVGCADET",
            "YOUTH MOVEMENT"
        ]
    
    def create_brand_urls(self, brand_name: str) -> List[str]:
        """Generate possible URLs for a brand - handles both direct collections and vendor search"""
        # Clean the brand name for URL
        clean_name = brand_name.lower()
        clean_name = re.sub(r'[™®©]', '', clean_name)  # Remove trademark symbols
        clean_name = re.sub(r'[^\w\s-]', '', clean_name)  # Remove special chars except hyphen
        clean_name = re.sub(r'\s+', '-', clean_name)  # Replace spaces with hyphens
        clean_name = re.sub(r'-+', '-', clean_name)  # Remove multiple hyphens
        clean_name = clean_name.strip('-')  # Remove leading/trailing hyphens
        
        # Generate multiple URL variations
        urls = [
            # Direct brand collection URLs
            f"{self.base_url}/collections/{clean_name}",
            f"{self.base_url}/collections/{brand_name.lower().replace(' ', '-')}",
            f"{self.base_url}/collections/{brand_name.lower().replace(' ', '')}",
            
            # Vendor search URLs (for brands that use the vendor search system)
            f"{self.base_url}/collections/vendors?q={quote(brand_name)}",
            f"{self.base_url}/collections/vendors?q={quote(clean_name)}",
            f"{self.base_url}/collections/vendors?q={quote(brand_name.upper())}",
        ]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)
        
        return unique_urls
    
    def extract_product_listing_data(self, container, brand_name: str) -> Dict:
        """Extract basic product information from a product listing container"""
        product = {
            'brand': brand_name,
            'name': '',
            'price': '',
            'listing_image': '',
            'product_url': '',
            'listing_data_complete': False
        }
        
        try:
            # Get product URL
            link = container.find('a', href=True)
            if link:
                product['product_url'] = urljoin(self.base_url, link['href'])
            
            # Get product name from text elements
            text_elements = container.find_all(['span', 'div', 'p'], string=True)
            for elem in text_elements:
                text = elem.get_text(strip=True)
                if text and len(text) > 3 and len(text) < 100:  # Reasonable product name length
                    # Skip common non-product text
                    if not any(skip in text.lower() for skip in ['$', 'add to cart', 'sold out', 'quick view', brand_name.lower()]):
                        product['name'] = text
                        break
            
            # Get price
            for elem in text_elements:
                text = elem.get_text(strip=True)
                price_match = re.search(r'[\$£€]?\s*\d+(?:[.,]\d{2})?', text)
                if price_match:
                    product['price'] = price_match.group(0)
                    break
            
            # Get listing image
            img_elements = container.find_all('img')
            for img in img_elements:
                img_url = img.get('src') or img.get('data-src') or img.get('data-srcset')
                if img_url:
                    product['listing_image'] = self.clean_image_url(img_url)
                    break
            
            # Check if we have basic data
            if product['name'] and product['product_url']:
                product['listing_data_complete'] = True
        
        except Exception as e:
            print(f"Error extracting listing data: {e}")
        
        return product
    
    def scrape_product_page(self, product_url: str, brand_name: str, listing_data: Dict) -> Dict:
        """Scrape detailed product information from individual product page"""
        product = listing_data.copy()
        product['detailed_data_complete'] = False
        
        try:
            print(f"    Scraping product page: {product_url}")
            response = requests.get(product_url, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                            # Get detailed product name
            name_selectors = [
                'h1',
                ('h1', {'class': re.compile(r'product.*title', re.I)}),
                ('div', {'class': re.compile(r'product.*title', re.I)}),
            ]
            
            for selector in name_selectors:
                if isinstance(selector, str):
                    name_elem = soup.find(selector)
                else:
                    name_elem = soup.find(*selector)
                
                if name_elem:
                    detailed_name = name_elem.get_text(strip=True)
                    # Filter out cart-related text
                    if detailed_name and 'cart' not in detailed_name.lower() and len(detailed_name) > 3:
                        product['detailed_name'] = detailed_name
                        break
            
            # If no detailed name found, use the listing name
            if not product.get('detailed_name') or 'cart' in product.get('detailed_name', '').lower():
                product['detailed_name'] = product.get('name', 'Unknown Product')
                
                # Get detailed price
                price_selectors = [
                    ('span', {'class': re.compile(r'price', re.I)}),
                    ('div', {'class': re.compile(r'price', re.I)}),
                    ('p', {'class': re.compile(r'price', re.I)}),
                ]
                
                for tag, attrs in price_selectors:
                    price_elem = soup.find(tag, attrs)
                    if price_elem:
                        price_text = price_elem.get_text(strip=True)
                        price_match = re.search(r'[\$£€]?\s*\d+(?:[.,]\d{2})?', price_text)
                        if price_match:
                            product['detailed_price'] = price_match.group(0)
                            break
                
                # Get all product images and videos
                product['images'] = []
                product['videos'] = []
                
                # Find image gallery - improved selectors for Lowheads
                image_selectors = [
                    ('img', {'class': re.compile(r'product.*image', re.I)}),
                    ('img', {'class': re.compile(r'gallery.*image', re.I)}),
                    ('img', {'data-src': True}),
                    ('img', {'src': re.compile(r'cdn\.shopify\.com', re.I)}),
                    # Lowheads specific selectors
                    ('img', {'src': re.compile(r'\.jpg|\.jpeg|\.png|\.webp', re.I)}),
                    ('img', {'data-src': re.compile(r'\.jpg|\.jpeg|\.png|\.webp', re.I)}),
                ]
                
                for tag, attrs in image_selectors:
                    images = soup.find_all(tag, attrs)
                    for img in images:
                        img_url = img.get('src') or img.get('data-src') or img.get('data-srcset')
                        if img_url:
                            clean_url = self.clean_image_url(img_url)
                            # Filter out logo images and small icons
                            if (clean_url not in product['images'] and 
                                'logo' not in clean_url.lower() and
                                'icon' not in clean_url.lower() and
                                len(clean_url) > 20):  # Avoid very short URLs
                                product['images'].append(clean_url)
                
                # If no images found with selectors, try to get all images and filter
                if not product['images']:
                    all_images = soup.find_all('img')
                    for img in all_images:
                        img_url = img.get('src') or img.get('data-src') or img.get('data-srcset')
                        if img_url:
                            clean_url = self.clean_image_url(img_url)
                            # Filter for product images only
                            if (clean_url not in product['images'] and
                                'cdn.shopify.com' in clean_url and
                                'logo' not in clean_url.lower() and
                                'icon' not in clean_url.lower() and
                                len(clean_url) > 20):
                                product['images'].append(clean_url)
                
                # Find videos
                video_selectors = [
                    ('video', {}),
                    ('source', {'type': re.compile(r'video', re.I)}),
                    ('iframe', {'src': re.compile(r'youtube|vimeo', re.I)}),
                ]
                
                for tag, attrs in video_selectors:
                    videos = soup.find_all(tag, attrs)
                    for video in videos:
                        video_url = video.get('src') or video.get('data-src')
                        if video_url:
                            if video_url not in product['videos']:
                                product['videos'].append(video_url)
                
                # Get product description
                desc_selectors = [
                    ('div', {'class': re.compile(r'product.*description', re.I)}),
                    ('div', {'class': re.compile(r'description', re.I)}),
                    ('p', {'class': re.compile(r'description', re.I)}),
                ]
                
                for tag, attrs in desc_selectors:
                    desc_elem = soup.find(tag, attrs)
                    if desc_elem:
                        product['description'] = desc_elem.get_text(strip=True)
                        break
                
                # Get brand metadata (location, shipping, website)
                product['brand_metadata'] = {}
                
                # Look for brand information sections
                brand_info_selectors = [
                    ('div', {'class': re.compile(r'brand.*info', re.I)}),
                    ('div', {'class': re.compile(r'vendor.*info', re.I)}),
                    ('div', {'class': re.compile(r'seller.*info', re.I)}),
                    ('div', {'class': re.compile(r'about.*brand', re.I)}),
                ]
                
                for tag, attrs in brand_info_selectors:
                    brand_elem = soup.find(tag, attrs)
                    if brand_elem:
                        # Extract brand metadata from text
                        brand_text = brand_elem.get_text(strip=True)
                        
                        # Look for location
                        location_match = re.search(r'This Brand Is From - (.+)', brand_text)
                        if location_match:
                            product['brand_metadata']['location'] = location_match.group(1).strip()
                        
                        # Look for shipping info
                        shipping_match = re.search(r'This Brand Ships Within - (.+)', brand_text)
                        if shipping_match:
                            product['brand_metadata']['shipping_time'] = shipping_match.group(1).strip()
                        
                        # Look for website
                        website_match = re.search(r'About This Brand - (.+)', brand_text)
                        if website_match:
                            product['brand_metadata']['website'] = website_match.group(1).strip()
                        
                        break
                
                # If not found in specific sections, search the entire page
                if not product['brand_metadata']:
                    page_text = soup.get_text()
                    
                    # Look for location
                    location_match = re.search(r'This Brand Is From - (.+)', page_text)
                    if location_match:
                        product['brand_metadata']['location'] = location_match.group(1).strip()
                    
                    # Look for shipping info
                    shipping_match = re.search(r'This Brand Ships Within - (.+)', page_text)
                    if shipping_match:
                        product['brand_metadata']['shipping_time'] = shipping_match.group(1).strip()
                    
                    # Look for website
                    website_match = re.search(r'About This Brand - (.+)', page_text)
                    if website_match:
                        product['brand_metadata']['website'] = website_match.group(1).strip()
                
                # Get product variants (sizes, colors, etc.)
                variant_selectors = [
                    ('select', {'name': re.compile(r'variant', re.I)}),
                    ('div', {'class': re.compile(r'variant', re.I)}),
                ]
                
                product['variants'] = []
                for tag, attrs in variant_selectors:
                    variant_elem = soup.find(tag, attrs)
                    if variant_elem:
                        options = variant_elem.find_all('option')
                        for option in options:
                            variant_text = option.get_text(strip=True)
                            if variant_text and variant_text not in ['Select', 'Choose']:
                                product['variants'].append(variant_text)
                
                product['detailed_data_complete'] = True
                print(f"    ✓ Found {len(product['images'])} images and {len(product['videos'])} videos")
            
        except Exception as e:
            print(f"    × Error scraping product page: {e}")
        
        return product
    
    def clean_image_url(self, img_url: str) -> str:
        """Clean and format image URL"""
        # Replace {width} placeholders with actual dimensions
        img_url = re.sub(r'\{width\}', '2048', img_url)
        img_url = re.sub(r'\{height\}', '2048', img_url)
        
        # Remove size constraints
        img_url = re.sub(r'_\d+x\d+', '', img_url)
        img_url = re.sub(r'_\d+x', '', img_url)
        img_url = re.sub(r'\?v=\d+', '', img_url)
        
        # Handle protocol
        if not img_url.startswith('http'):
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            else:
                img_url = urljoin(self.base_url, img_url)
        
        return img_url
    
    def download_media(self, url: str, save_path: str) -> bool:
        """Download and save an image or video"""
        try:
            response = self.session.get(url, stream=True, timeout=15)
            response.raise_for_status()
            
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            return True
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            return False
    
    def scrape_brand_products(self, brand_name: str, download_media: bool = True) -> List[Dict]:
        """Scrape all products for a specific brand"""
        print(f"Scraping brand: {brand_name}")
        products = []
        urls_to_try = self.create_brand_urls(brand_name)
        
        for url in urls_to_try:
            try:
                print(f"  Trying URL: {url}")
                # Use direct requests instead of session to avoid header issues
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find product containers
                    product_containers = []
                    
                    # Method 1: Direct class search for type-product-grid-item
                    containers = soup.find_all('div', class_=lambda x: x and 'type-product-grid-item' in x)
                    if containers:
                        product_containers.extend(containers)
                        print(f"    Found {len(containers)} product containers")
                    
                    # Method 2: If no containers found, try other selectors
                    if not product_containers:
                        container_selectors = [
                            ('div', {'class': re.compile(r'product-grid-item', re.I)}),
                            ('div', {'class': re.compile(r'product', re.I)}),
                            ('article', {'class': re.compile(r'product', re.I)}),
                            ('li', {'class': re.compile(r'product', re.I)}),
                        ]
                        
                        for tag, attrs in container_selectors:
                            containers = soup.find_all(tag, attrs)
                            if containers:
                                product_containers.extend(containers)
                                print(f"    Found {len(containers)} containers with selector: {tag}, {attrs}")
                                break
                    
                    # Extract basic listing data
                    for container in product_containers:
                        listing_data = self.extract_product_listing_data(container, brand_name)
                        if listing_data['listing_data_complete']:
                            # Scrape detailed product page
                            detailed_product = self.scrape_product_page(
                                listing_data['product_url'], 
                                brand_name, 
                                listing_data
                            )
                            products.append(detailed_product)
                    
                    if products:
                        print(f"  ✓ Found {len(products)} products for {brand_name}")
                        
                        # Download media if requested
                        if download_media:
                            self.download_brand_media(brand_name, products)
                        
                        return products
                
            except requests.RequestException as e:
                print(f"  × Error accessing {url}: {e}")
            except Exception as e:
                print(f"  × Unexpected error for {url}: {e}")
            
            time.sleep(0.5)  # Be respectful between attempts
        
        print(f"  ! No products found for {brand_name}")
        return products
    
    def download_brand_media(self, brand_name: str, products: List[Dict]):
        """Download all media for a brand's products"""
        print(f"    Downloading media for {brand_name}...")
        
        # Create brand folder
        brand_folder = f"downloads/{brand_name.replace('/', '_').replace('\\', '_').replace(':', '_')}"
        
        for i, product in enumerate(products):
            # Get clean product name for folder
            product_name = product.get('detailed_name', product.get('name', f'product_{i+1}'))
            # Clean product name for folder path
            clean_product_name = product_name.replace('/', '_').replace('\\', '_').replace(':', '_').replace('?', '_').replace('*', '_').replace('"', '_').replace('<', '_').replace('>', '_').replace('|', '_')
            product_folder = f"{brand_folder}/{clean_product_name}"
            
            print(f"      Creating folder: {product_folder}")
            
            # Download listing image
            if product.get('listing_image'):
                filename = f"{product_folder}/listing_image.jpg"
                if self.download_media(product['listing_image'], filename):
                    product['listing_image_local'] = filename
                    print(f"        Downloaded listing image: {filename}")
            
            # Download product images
            for j, img_url in enumerate(product.get('images', [])):
                filename = f"{product_folder}/image_{j+1}.jpg"
                if self.download_media(img_url, filename):
                    product['images_local'] = product.get('images_local', [])
                    product['images_local'].append(filename)
                    print(f"        Downloaded product image {j+1}: {filename}")
            
            # Download videos
            for j, video_url in enumerate(product.get('videos', [])):
                filename = f"{product_folder}/video_{j+1}.mp4"
                if self.download_media(video_url, filename):
                    product['videos_local'] = product.get('videos_local', [])
                    product['videos_local'].append(filename)
                    print(f"        Downloaded video {j+1}: {filename}")
    
    def save_data_to_json(self, data: Dict, filename: str = 'lowheads_complete_data.json'):
        """Save scraped data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n✓ Data saved to {filename}")
        except Exception as e:
            print(f"Error saving data: {e}")
    
    def save_data_to_csv(self, data: Dict, filename: str = 'lowheads_products.csv'):
        """Save scraped data to CSV file with all media links"""
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'Brand', 'Product Name', 'Detailed Name', 'Price', 'Detailed Price',
                    'Product URL', 'Listing Image URL', 'Listing Image Local',
                    'Product Images URLs', 'Product Images Local',
                    'Product Videos URLs', 'Product Videos Local',
                    'Description', 'Variants', 'Brand Location', 'Brand Shipping Time', 'Brand Website', 'Scraped At'
                ])
                
                for brand_name, brand_data in data['brands'].items():
                    for product in brand_data['products']:
                        writer.writerow([
                            product.get('brand', brand_name),
                            product.get('name', ''),
                            product.get('detailed_name', ''),
                            product.get('price', ''),
                            product.get('detailed_price', ''),
                            product.get('product_url', ''),
                            product.get('listing_image', ''),
                            product.get('listing_image_local', ''),
                            '|'.join(product.get('images', [])),
                            '|'.join(product.get('images_local', [])),
                            '|'.join(product.get('videos', [])),
                            '|'.join(product.get('videos_local', [])),
                            product.get('description', ''),
                            '|'.join(product.get('variants', [])),
                            product.get('brand_metadata', {}).get('location', ''),
                            product.get('brand_metadata', {}).get('shipping_time', ''),
                            product.get('brand_metadata', {}).get('website', ''),
                            data.get('scraped_at', '')
                        ])
            
            print(f"✓ CSV saved to {filename}")
        except Exception as e:
            print(f"Error saving CSV: {e}")
    
    def run_complete_scrape(self, parallel: bool = False, download_media: bool = True):
        """Run the complete scraping process for all brands"""
        print("=" * 60)
        print("LOWHEADS COMPLETE BRAND SCRAPER")
        print("=" * 60)
        print(f"Starting scrape of {len(self.BRANDS)} brands...")
        print(f"Download media: {download_media}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)
        
        all_data = {
            'scraped_at': datetime.now().isoformat(),
            'total_brands': len(self.BRANDS),
            'download_media': download_media,
            'brands': {}
        }
        
        if parallel:
            # Parallel processing for faster scraping
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_to_brand = {
                    executor.submit(self.scrape_brand_products, brand, download_media): brand 
                    for brand in self.BRANDS
                }
                
                for i, future in enumerate(concurrent.futures.as_completed(future_to_brand), 1):
                    brand = future_to_brand[future]
                    try:
                        products = future.result()
                        all_data['brands'][brand] = {
                            'product_count': len(products),
                            'products': products
                        }
                        print(f"[{i}/{len(self.BRANDS)}] Completed: {brand}")
                    except Exception as e:
                        print(f"[{i}/{len(self.BRANDS)}] Failed: {brand} - {e}")
                        all_data['brands'][brand] = {
                            'product_count': 0,
                            'products': [],
                            'error': str(e)
                        }
        else:
            # Sequential processing
            for i, brand in enumerate(self.BRANDS, 1):
                print(f"\n[{i}/{len(self.BRANDS)}] Processing: {brand}")
                products = self.scrape_brand_products(brand, download_media)
                
                all_data['brands'][brand] = {
                    'product_count': len(products),
                    'products': products
                }
                
                # Rate limiting
                time.sleep(1)
        
        # Save data in multiple formats
        self.save_data_to_json(all_data)
        self.save_data_to_csv(all_data)
        
        # Print summary
        self.print_summary(all_data)
        
        return all_data
    
    def print_summary(self, data: Dict):
        """Print a summary of the scraping results"""
        print("\n" + "=" * 60)
        print("SCRAPING COMPLETE - SUMMARY")
        print("=" * 60)
        
        total_products = 0
        successful_brands = 0
        total_images = 0
        total_videos = 0
        
        for brand_name, brand_data in data['brands'].items():
            product_count = brand_data['product_count']
            total_products += product_count
            if product_count > 0:
                successful_brands += 1
            
            # Count media
            for product in brand_data['products']:
                total_images += len(product.get('images', []))
                total_videos += len(product.get('videos', []))
        
        print(f"Total brands processed: {len(data['brands'])}")
        print(f"Successful brands: {successful_brands}")
        print(f"Total products found: {total_products}")
        print(f"Total images found: {total_images}")
        print(f"Total videos found: {total_videos}")
        print(f"Average products per brand: {total_products / len(data['brands']):.1f}")
        
        # Show top brands by product count
        sorted_brands = sorted(
            data['brands'].items(), 
            key=lambda x: x[1]['product_count'], 
            reverse=True
        )[:10]
        
        print("\nTop 10 brands by product count:")
        for brand_name, brand_data in sorted_brands:
            print(f"  - {brand_name}: {brand_data['product_count']} products")
        
        print(f"\n✓ Data saved to 'lowheads_complete_data.json' and 'lowheads_products.csv'")
        if data.get('download_media'):
            print("✓ Media files downloaded to 'downloads/' folder")
        print("=" * 60)

def main():
    """Main execution function"""
    scraper = LowheadsCompleteScraper()
    
    # Configuration
    PARALLEL_SCRAPING = False  # Set to True for faster scraping (be careful with rate limits)
    DOWNLOAD_MEDIA = True      # Set to True to download all product images and videos
    
    # Run the complete scrape
    data = scraper.run_complete_scrape(
        parallel=PARALLEL_SCRAPING,
        download_media=DOWNLOAD_MEDIA
    )
    
    print("\n✅ Scraping completed successfully!")
    print("Check 'lowheads_complete_data.json' for the complete dataset.")
    print("Check 'lowheads_products.csv' for a spreadsheet-friendly format.")
    if DOWNLOAD_MEDIA:
        print("Check 'downloads/' folder for all downloaded media files.")
    
    return data

if __name__ == "__main__":
    main()
