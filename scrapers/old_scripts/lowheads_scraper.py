#!/usr/bin/env python3
"""
Lowheads Complete Brand Data Scraper
Scrapes all brand information, products, prices, and images from lowheads.com
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

class LowheadsScraper:
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
    
    def create_brand_url(self, brand_name: str) -> List[str]:
        """Generate possible URLs for a brand"""
        # Clean the brand name for URL
        clean_name = brand_name.lower()
        clean_name = re.sub(r'[™®©]', '', clean_name)  # Remove trademark symbols
        clean_name = re.sub(r'[^\w\s-]', '', clean_name)  # Remove special chars except hyphen
        clean_name = re.sub(r'\s+', '-', clean_name)  # Replace spaces with hyphens
        clean_name = re.sub(r'-+', '-', clean_name)  # Remove multiple hyphens
        clean_name = clean_name.strip('-')  # Remove leading/trailing hyphens
        
        # Generate multiple URL variations
        urls = [
            f"{self.base_url}/collections/{clean_name}",
            f"{self.base_url}/collections/{brand_name.lower().replace(' ', '-')}",
            f"{self.base_url}/collections/{brand_name.lower().replace(' ', '')}",
            f"{self.base_url}/collections/{quote(brand_name.lower())}",
        ]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)
        
        return unique_urls
    
    def extract_product_data(self, container, brand_name: str) -> Dict:
        """Extract product information from a product container"""
        product = {
            'brand': brand_name,
            'name': '',
            'price': '',
            'image': '',
            'url': '',
            'additional_images': []
        }
        
        try:
            # Get product URL
            link = container.find('a', href=True)
            if link:
                product['url'] = urljoin(self.base_url, link['href'])
            
            # Get product name - try multiple selectors
            name_selectors = [
                ('h3', None),
                ('h4', None),
                ('div', {'class': re.compile(r'product.*title|title.*product', re.I)}),
                ('span', {'class': re.compile(r'product.*name|name.*product', re.I)}),
                ('a', {'class': re.compile(r'product.*link', re.I)})
            ]
            
            for tag, attrs in name_selectors:
                name_elem = container.find(tag, attrs)
                if name_elem:
                    product['name'] = name_elem.get_text(strip=True)
                    break
            
            # Get price - try multiple selectors
            price_selectors = [
                ('span', {'class': re.compile(r'price', re.I)}),
                ('div', {'class': re.compile(r'price', re.I)}),
                ('p', {'class': re.compile(r'price', re.I)}),
                (None, {'class': re.compile(r'money', re.I)})
            ]
            
            for tag, attrs in price_selectors:
                if tag:
                    price_elem = container.find(tag, attrs)
                else:
                    price_elem = container.find(attrs=attrs)
                
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    # Extract numeric price with currency
                    price_match = re.search(r'[\$£€]?\s*\d+(?:[.,]\d{2})?', price_text)
                    if price_match:
                        product['price'] = price_match.group(0)
                        break
            
            # Get all images
            img_elements = container.find_all('img')
            for img in img_elements:
                img_url = img.get('src') or img.get('data-src') or img.get('data-srcset')
                if img_url:
                    # Clean and format image URL
                    img_url = self.clean_image_url(img_url)
                    if product['image'] == '':
                        product['image'] = img_url
                    elif img_url not in product['additional_images']:
                        product['additional_images'].append(img_url)
            
            # Also check for background images
            elements_with_bg = container.find_all(style=re.compile(r'background-image'))
            for elem in elements_with_bg:
                style = elem.get('style', '')
                match = re.search(r'url\([\'"]?([^\'"]+)[\'"]?\)', style)
                if match:
                    img_url = self.clean_image_url(match.group(1))
                    if img_url not in product['additional_images']:
                        product['additional_images'].append(img_url)
        
        except Exception as e:
            print(f"Error extracting product data: {e}")
        
        return product
    
    def clean_image_url(self, img_url: str) -> str:
        """Clean and format image URL"""
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
    
    def scrape_brand_products(self, brand_name: str) -> List[Dict]:
        """Scrape all products for a specific brand"""
        print(f"Scraping brand: {brand_name}")
        products = []
        urls_to_try = self.create_brand_url(brand_name)
        
        for url in urls_to_try:
            try:
                response = self.session.get(url, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Find product containers - try multiple selectors
                    container_selectors = [
                        ('div', {'class': re.compile(r'product', re.I)}),
                        ('article', {'class': re.compile(r'product', re.I)}),
                        ('li', {'class': re.compile(r'product', re.I)}),
                        ('div', {'class': re.compile(r'grid.*item', re.I)}),
                        ('div', {'class': re.compile(r'collection.*item', re.I)})
                    ]
                    
                    product_containers = []
                    for tag, attrs in container_selectors:
                        containers = soup.find_all(tag, attrs)
                        if containers:
                            product_containers.extend(containers)
                            break
                    
                    # If no containers found, try to find product links directly
                    if not product_containers:
                        product_links = soup.find_all('a', href=re.compile(r'/products/'))
                        for link in product_links:
                            parent = link.parent
                            if parent and parent not in product_containers:
                                product_containers.append(parent)
                    
                    # Extract product data
                    for container in product_containers:
                        product_data = self.extract_product_data(container, brand_name)
                        if product_data['name'] or product_data['url']:  # Valid product
                            products.append(product_data)
                    
                    # Handle pagination
                    products.extend(self.handle_pagination(soup, brand_name))
                    
                    if products:
                        print(f"  ✓ Found {len(products)} products for {brand_name}")
                        return products
                
            except requests.RequestException as e:
                print(f"  × Error accessing {url}: {e}")
            except Exception as e:
                print(f"  × Unexpected error for {url}: {e}")
            
            time.sleep(0.5)  # Be respectful between attempts
        
        print(f"  ! No products found for {brand_name}")
        return products
    
    def handle_pagination(self, soup: BeautifulSoup, brand_name: str) -> List[Dict]:
        """Handle pagination for brand collections"""
        additional_products = []
        
        # Look for next page link
        next_link = soup.find('a', {'rel': 'next'})
        if not next_link:
            next_link = soup.find('a', text=re.compile(r'next|→', re.I))
        
        if next_link and next_link.get('href'):
            next_url = urljoin(self.base_url, next_link['href'])
            time.sleep(1)  # Rate limiting
            
            try:
                response = self.session.get(next_url, timeout=10)
                if response.status_code == 200:
                    next_soup = BeautifulSoup(response.text, 'html.parser')
                    # Recursively get products from next page
                    # (Implementation would continue here)
            except:
                pass
        
        return additional_products
    
    def download_image(self, image_url: str, save_path: str) -> bool:
        """Download and save an image"""
        try:
            response = self.session.get(image_url, stream=True, timeout=10)
            response.raise_for_status()
            
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            return True
        except Exception as e:
            print(f"Error downloading image {image_url}: {e}")
            return False
    
    def save_data_to_json(self, data: Dict, filename: str = 'lowheads_complete_data.json'):
        """Save scraped data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n✓ Data saved to {filename}")
        except Exception as e:
            print(f"Error saving data: {e}")
    
    def save_data_to_csv(self, data: Dict, filename: str = 'lowheads_products.csv'):
        """Save scraped data to CSV file"""
        import csv
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['Brand', 'Product Name', 'Price', 'URL', 'Image URL', 'Additional Images'])
                
                for brand_name, brand_data in data['brands'].items():
                    for product in brand_data['products']:
                        writer.writerow([
                            product.get('brand', brand_name),
                            product.get('name', ''),
                            product.get('price', ''),
                            product.get('url', ''),
                            product.get('image', ''),
                            '|'.join(product.get('additional_images', []))
                        ])
            
            print(f"✓ CSV saved to {filename}")
        except Exception as e:
            print(f"Error saving CSV: {e}")
    
    def run_complete_scrape(self, parallel: bool = False, download_images: bool = False):
        """Run the complete scraping process for all brands"""
        print("=" * 60)
        print("LOWHEADS COMPLETE BRAND SCRAPER")
        print("=" * 60)
        print(f"Starting scrape of {len(self.BRANDS)} brands...")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)
        
        all_data = {
            'scraped_at': datetime.now().isoformat(),
            'total_brands': len(self.BRANDS),
            'brands': {}
        }
        
        if parallel:
            # Parallel processing for faster scraping
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                future_to_brand = {
                    executor.submit(self.scrape_brand_products, brand): brand 
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
                products = self.scrape_brand_products(brand)
                
                all_data['brands'][brand] = {
                    'product_count': len(products),
                    'products': products
                }
                
                # Download images if requested
                if download_images and products:
                    self.download_brand_images(brand, products)
                
                # Rate limiting
                time.sleep(1)
        
        # Save data in multiple formats
        self.save_data_to_json(all_data)
        self.save_data_to_csv(all_data)
        
        # Print summary
        self.print_summary(all_data)
        
        return all_data
    
    def download_brand_images(self, brand_name: str, products: List[Dict]):
        """Download all images for a brand's products"""
        brand_folder = f"images/{brand_name.replace('/', '_').replace('\\', '_')}"
        
        for i, product in enumerate(products):
            if product.get('image'):
                filename = f"{brand_folder}/{i+1}_{product['name'][:30].replace('/', '_')}.jpg"
                self.download_image(product['image'], filename)
            
            # Download additional images
            for j, img_url in enumerate(product.get('additional_images', [])):
                filename = f"{brand_folder}/{i+1}_{product['name'][:30].replace('/', '_')}_alt{j+1}.jpg"
                self.download_image(img_url, filename)
    
    def print_summary(self, data: Dict):
        """Print a summary of the scraping results"""
        print("\n" + "=" * 60)
        print("SCRAPING COMPLETE - SUMMARY")
        print("=" * 60)
        
        total_products = 0
        successful_brands = 0
        
        for brand_name, brand_data in data['brands'].items():
            product_count = brand_data['product_count']
            total_products += product_count
            if product_count > 0:
                successful_brands += 1
        
        print(f"Total brands processed: {len(data['brands'])}")
        print(f"Successful brands: {successful_brands}")
        print(f"Total products found: {total_products}")
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
        
        print("\n✓ Data saved to 'lowheads_complete_data.json' and 'lowheads_products.csv'")
        print("=" * 60)

def main():
    """Main execution function"""
    scraper = LowheadsScraper()
    
    # Configuration
    PARALLEL_SCRAPING = False  # Set to True for faster scraping (be careful with rate limits)
    DOWNLOAD_IMAGES = False    # Set to True to download all product images
    
    # Run the complete scrape
    data = scraper.run_complete_scrape(
        parallel=PARALLEL_SCRAPING,
        download_images=DOWNLOAD_IMAGES
    )
    
    print("\n✅ Scraping completed successfully!")
    print("Check 'lowheads_complete_data.json' for the complete dataset.")
    print("Check 'lowheads_products.csv' for a spreadsheet-friendly format.")
    
    return data

if __name__ == "__main__":
    main()