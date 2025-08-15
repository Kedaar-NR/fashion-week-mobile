#!/usr/bin/env python3
"""
Instagram Brand Content Scraper
Scrapes all images and videos from Instagram brand pages
Handles rate limiting, authentication, and content downloading
"""

import requests
import json
import time
import os
import re
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import concurrent.futures
from typing import List, Dict, Optional, Tuple
import random
import logging
from datetime import datetime
import csv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('instagram_scraper.log'),
        logging.StreamHandler()
    ]
)

class InstagramScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        # Instagram-specific headers
        self.instagram_headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        }
        
        # Lowheads brands converted to Instagram URLs
        self.lowheads_brands = [
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
        
        # Convert lowheads brands to Instagram URLs
        self.brand_urls = self._convert_brands_to_instagram_urls()
        
        # Create base directory for Instagram content
        self.base_dir = "instagram_content"
        os.makedirs(self.base_dir, exist_ok=True)
        
        # Rate limiting
        self.request_delay = 2  # seconds between requests
        self.last_request_time = 0
    
    def _convert_brands_to_instagram_urls(self) -> List[str]:
        """Convert lowheads brand names to Instagram URLs"""
        urls = []
        
        for brand in self.lowheads_brands:
            # Clean the brand name for Instagram URL
            clean_name = brand.lower()
            clean_name = re.sub(r'[™®©]', '', clean_name)  # Remove trademark symbols
            clean_name = re.sub(r'[^\w\s-]', '', clean_name)  # Remove special chars except hyphen
            clean_name = re.sub(r'\s+', '', clean_name)  # Remove spaces (Instagram handles don't have spaces)
            clean_name = re.sub(r'-+', '', clean_name)  # Remove hyphens
            clean_name = clean_name.strip()  # Remove leading/trailing whitespace
            
            # Skip empty names
            if not clean_name:
                continue
            
            # Create Instagram URL
            instagram_url = f"https://instagram.com/{clean_name}"
            urls.append(instagram_url)
        
        return urls
        
    def rate_limit(self):
        """Implement rate limiting to avoid being blocked"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.request_delay:
            sleep_time = self.request_delay - time_since_last
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def extract_brand_name(self, url: str) -> str:
        """Extract brand name from Instagram URL"""
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        # Remove any trailing slashes and get the brand name
        brand_name = path.split('/')[0] if path else "unknown"
        return brand_name
    
    def get_instagram_page_content(self, url: str) -> Optional[str]:
        """Get Instagram page content with proper headers and error handling"""
        try:
            self.rate_limit()
            logging.info(f"Fetching: {url}")
            
            response = self.session.get(url, headers=self.instagram_headers, timeout=30)
            response.raise_for_status()
            
            return response.text
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to fetch {url}: {e}")
            return None
    
    def extract_media_urls(self, html_content: str) -> Tuple[List[str], List[str]]:
        """Extract image and video URLs from Instagram page HTML"""
        images = []
        videos = []
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Method 1: Look for JSON-LD structured data
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict) and 'image' in data:
                        if isinstance(data['image'], list):
                            images.extend(data['image'])
                        elif isinstance(data['image'], str):
                            images.append(data['image'])
                except json.JSONDecodeError:
                    continue
            
            # Method 2: Look for meta tags
            meta_images = soup.find_all('meta', property='og:image')
            for meta in meta_images:
                if meta.get('content'):
                    images.append(meta['content'])
            
            # Method 3: Look for video meta tags
            meta_videos = soup.find_all('meta', property='og:video')
            for meta in meta_videos:
                if meta.get('content'):
                    videos.append(meta['content'])
            
            # Method 4: Look for Instagram-specific data
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'window._sharedData' in script.string:
                    try:
                        # Extract JSON data from the script
                        json_start = script.string.find('{')
                        json_end = script.string.rfind('}') + 1
                        if json_start != -1 and json_end != 0:
                            json_data = script.string[json_start:json_end]
                            data = json.loads(json_data)
                            # Navigate through the data structure to find media
                            self._extract_media_from_shared_data(data, images, videos)
                    except (json.JSONDecodeError, KeyError, TypeError):
                        continue
            
            # Method 5: Look for direct image and video tags
            img_tags = soup.find_all('img')
            for img in img_tags:
                src = img.get('src')
                if src and ('instagram' in src or 'cdninstagram' in src):
                    images.append(src)
            
            video_tags = soup.find_all('video')
            for video in video_tags:
                src = video.get('src')
                if src:
                    videos.append(src)
            
            # Remove duplicates while preserving order
            images = list(dict.fromkeys(images))
            videos = list(dict.fromkeys(videos))
            
            logging.info(f"Found {len(images)} images and {len(videos)} videos")
            
        except Exception as e:
            logging.error(f"Error extracting media URLs: {e}")
        
        return images, videos
    
    def _extract_media_from_shared_data(self, data: Dict, images: List[str], videos: List[str]):
        """Recursively extract media URLs from Instagram's shared data structure"""
        if isinstance(data, dict):
            for key, value in data.items():
                if key in ['display_url', 'src', 'url'] and isinstance(value, str):
                    if 'video' in value or '.mp4' in value:
                        videos.append(value)
                    else:
                        images.append(value)
                elif isinstance(value, (dict, list)):
                    self._extract_media_from_shared_data(value, images, videos)
        elif isinstance(data, list):
            for item in data:
                self._extract_media_from_shared_data(item, images, videos)
    
    def download_media(self, url: str, filepath: str) -> bool:
        """Download a single media file"""
        try:
            self.rate_limit()
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return True
        except Exception as e:
            logging.error(f"Failed to download {url}: {e}")
            return False
    
    def scrape_brand_instagram(self, url: str) -> Dict:
        """Scrape all content from a single Instagram brand page"""
        brand_name = self.extract_brand_name(url)
        logging.info(f"Scraping Instagram for brand: {brand_name}")
        
        # Create brand directory
        brand_dir = os.path.join(self.base_dir, brand_name)
        os.makedirs(brand_dir, exist_ok=True)
        
        # Create IG subdirectory
        ig_dir = os.path.join(brand_dir, "IG")
        os.makedirs(ig_dir, exist_ok=True)
        
        # Get page content
        html_content = self.get_instagram_page_content(url)
        if not html_content:
            return {
                'brand': brand_name,
                'url': url,
                'success': False,
                'error': 'Failed to fetch page content',
                'images': [],
                'videos': []
            }
        
        # Extract media URLs
        images, videos = self.extract_media_urls(html_content)
        
        # Download images
        downloaded_images = []
        for i, img_url in enumerate(images):
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            
            file_extension = self._get_file_extension(img_url)
            filename = f"image_{i+1:03d}{file_extension}"
            filepath = os.path.join(ig_dir, filename)
            
            if self.download_media(img_url, filepath):
                downloaded_images.append({
                    'url': img_url,
                    'filename': filename,
                    'local_path': filepath
                })
                logging.info(f"Downloaded image: {filename}")
        
        # Download videos
        downloaded_videos = []
        for i, video_url in enumerate(videos):
            if video_url.startswith('//'):
                video_url = 'https:' + video_url
            
            file_extension = self._get_file_extension(video_url)
            filename = f"video_{i+1:03d}{file_extension}"
            filepath = os.path.join(ig_dir, filename)
            
            if self.download_media(video_url, filepath):
                downloaded_videos.append({
                    'url': video_url,
                    'filename': filename,
                    'local_path': filepath
                })
                logging.info(f"Downloaded video: {filename}")
        
        return {
            'brand': brand_name,
            'url': url,
            'success': True,
            'images': downloaded_images,
            'videos': downloaded_videos,
            'total_images': len(downloaded_images),
            'total_videos': len(downloaded_videos)
        }
    
    def _get_file_extension(self, url: str) -> str:
        """Extract file extension from URL"""
        parsed = urlparse(url)
        path = parsed.path
        if '.' in path:
            return '.' + path.split('.')[-1].split('?')[0]
        return '.jpg'  # Default to jpg if no extension found
    
    def run_complete_scrape(self, parallel: bool = False) -> Dict:
        """Run the complete Instagram scraping process"""
        logging.info("Starting Instagram scraping process...")
        
        all_data = {
            'scrape_date': datetime.now().isoformat(),
            'total_brands': len(self.brand_urls),
            'brands': {}
        }
        
        if parallel:
            # Parallel processing
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_to_url = {executor.submit(self.scrape_brand_instagram, url): url 
                               for url in self.brand_urls}
                
                for i, future in enumerate(concurrent.futures.as_completed(future_to_url), 1):
                    url = future_to_url[future]
                    try:
                        result = future.result()
                        all_data['brands'][result['brand']] = result
                        logging.info(f"[{i}/{len(self.brand_urls)}] Completed: {result['brand']}")
                    except Exception as e:
                        logging.error(f"Failed to scrape {url}: {e}")
                        brand_name = self.extract_brand_name(url)
                        all_data['brands'][brand_name] = {
                            'brand': brand_name,
                            'url': url,
                            'success': False,
                            'error': str(e),
                            'images': [],
                            'videos': []
                        }
        else:
            # Sequential processing
            for i, url in enumerate(self.brand_urls, 1):
                logging.info(f"[{i}/{len(self.brand_urls)}] Processing: {url}")
                result = self.scrape_brand_instagram(url)
                all_data['brands'][result['brand']] = result
                
                # Add delay between requests
                time.sleep(random.uniform(1, 3))
        
        # Save results
        self.save_results(all_data)
        
        # Print summary
        self.print_summary(all_data)
        
        return all_data
    
    def save_results(self, data: Dict):
        """Save scraping results to files"""
        # Save as JSON
        json_file = os.path.join(self.base_dir, 'instagram_scraping_results.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_file = os.path.join(self.base_dir, 'instagram_scraping_results.csv')
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Brand', 'URL', 'Success', 'Images', 'Videos', 'Error'])
            
            for brand_data in data['brands'].values():
                writer.writerow([
                    brand_data['brand'],
                    brand_data['url'],
                    brand_data['success'],
                    brand_data.get('total_images', 0),
                    brand_data.get('total_videos', 0),
                    brand_data.get('error', '')
                ])
        
        logging.info(f"Results saved to {json_file} and {csv_file}")
    
    def print_summary(self, data: Dict):
        """Print a summary of the scraping results"""
        print("\n" + "=" * 60)
        print("INSTAGRAM SCRAPING COMPLETE - SUMMARY")
        print("=" * 60)
        
        total_images = 0
        total_videos = 0
        successful_brands = 0
        failed_brands = 0
        
        for brand_data in data['brands'].values():
            if brand_data['success']:
                successful_brands += 1
                total_images += brand_data.get('total_images', 0)
                total_videos += brand_data.get('total_videos', 0)
            else:
                failed_brands += 1
        
        print(f"Total brands processed: {len(data['brands'])}")
        print(f"Successful brands: {successful_brands}")
        print(f"Failed brands: {failed_brands}")
        print(f"Total images downloaded: {total_images}")
        print(f"Total videos downloaded: {total_videos}")
        print(f"Success rate: {successful_brands/len(data['brands'])*100:.1f}%")
        
        # Show top brands by content count
        sorted_brands = sorted(
            [b for b in data['brands'].values() if b['success']],
            key=lambda x: x.get('total_images', 0) + x.get('total_videos', 0),
            reverse=True
        )[:10]
        
        print("\nTop 10 brands by content count:")
        for brand_data in sorted_brands:
            total_content = brand_data.get('total_images', 0) + brand_data.get('total_videos', 0)
            print(f"  - {brand_data['brand']}: {total_content} items ({brand_data.get('total_images', 0)} images, {brand_data.get('total_videos', 0)} videos)")
        
        print(f"\n✓ Content saved to '{self.base_dir}/' folder")
        print("=" * 60)

def main():
    """Main execution function"""
    scraper = InstagramScraper()
    
    # Configuration
    PARALLEL_SCRAPING = False  # Set to True for faster scraping (be careful with rate limits)
    
    # Run the complete scrape
    data = scraper.run_complete_scrape(parallel=PARALLEL_SCRAPING)
    
    print("\nInstagram scraping completed!")
    print("Check the 'instagram_content/' folder for all downloaded content.")
    print("Check 'instagram_scraping_results.json' for detailed results.")
    
    return data

if __name__ == "__main__":
    main()
