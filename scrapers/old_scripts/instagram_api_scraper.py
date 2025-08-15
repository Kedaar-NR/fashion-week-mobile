#!/usr/bin/env python3
"""
Enhanced Instagram Brand Content Scraper
Uses Instagram's GraphQL API for better content extraction
Handles authentication, rate limiting, and comprehensive media downloading
"""

import requests
import json
import time
import os
import re
from urllib.parse import urlparse, urljoin
import concurrent.futures
from typing import List, Dict, Optional, Tuple
import random
import logging
from datetime import datetime
import csv
import base64
import hashlib

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('instagram_api_scraper.log'),
        logging.StreamHandler()
    ]
)

class InstagramAPIScraper:
    def __init__(self):
        self.session = requests.Session()
        
        # Instagram API endpoints
        self.base_url = "https://www.instagram.com"
        self.api_url = "https://www.instagram.com/api/v1"
        self.graphql_url = "https://www.instagram.com/graphql/query/"
        
        # Headers that mimic a real browser
        self.headers = {
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
            'sec-ch-ua-platform': '"macOS"',
            'X-Requested-With': 'XMLHttpRequest',
            'X-IG-App-ID': '936619743392459',
            'X-IG-WWW-Claim': '0',
            'X-ASBD-ID': '129477',
            'X-CSRFToken': '',
            'X-Instagram-AJAX': '1'
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
        self.request_delay = 3  # seconds between requests
        self.last_request_time = 0
        
        # Initialize session
        self._init_session()
    
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
    
    def _init_session(self):
        """Initialize the session with proper cookies and tokens"""
        try:
            # First, visit Instagram homepage to get initial cookies
            response = self.session.get(self.base_url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            # Extract CSRF token from the page
            csrf_match = re.search(r'"csrf_token":"([^"]+)"', response.text)
            if csrf_match:
                self.headers['X-CSRFToken'] = csrf_match.group(1)
            
            # Extract additional tokens
            ig_www_claim_match = re.search(r'"ig_www_claim":"([^"]+)"', response.text)
            if ig_www_claim_match:
                self.headers['X-IG-WWW-Claim'] = ig_www_claim_match.group(1)
            
            logging.info("Session initialized successfully")
            
        except Exception as e:
            logging.warning(f"Failed to initialize session: {e}")
    
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
        brand_name = path.split('/')[0] if path else "unknown"
        return brand_name
    
    def get_user_id(self, username: str) -> Optional[str]:
        """Get Instagram user ID from username using the API"""
        try:
            self.rate_limit()
            
            # Use the users/web_profile_info endpoint
            url = f"{self.api_url}/users/web_profile_info/"
            params = {
                'username': username
            }
            
            response = self.session.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            if 'data' in data and 'user' in data['data']:
                return data['data']['user']['id']
            
        except Exception as e:
            logging.error(f"Failed to get user ID for {username}: {e}")
        
        return None
    
    def get_user_posts(self, user_id: str, max_posts: int = 50) -> List[Dict]:
        """Get user posts using Instagram's API"""
        posts = []
        
        try:
            self.rate_limit()
            
            # Use the feed/user/{user_id}/username/{username}/ endpoint
            url = f"{self.api_url}/feed/user/{user_id}/username/{user_id}/"
            params = {
                'count': min(max_posts, 50),  # Instagram limits to 50 per request
                'max_id': '',
                'min_timestamp': '',
                'rank_token': '',
                'ranked_content': 'true'
            }
            
            response = self.session.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'items' in data:
                for item in data['items']:
                    post_data = {
                        'id': item.get('id'),
                        'shortcode': item.get('code'),
                        'caption': item.get('caption', {}).get('text', '') if item.get('caption') else '',
                        'media_type': item.get('media_type'),
                        'images': [],
                        'videos': [],
                        'timestamp': item.get('taken_at_timestamp'),
                        'likes': item.get('like_count', 0),
                        'comments': item.get('comment_count', 0)
                    }
                    
                    # Extract media URLs
                    if item.get('media_type') == 1:  # Single image
                        if 'image_versions2' in item:
                            for version in item['image_versions2']['candidates']:
                                post_data['images'].append(version['url'])
                    elif item.get('media_type') == 2:  # Video
                        if 'video_versions' in item:
                            for version in item['video_versions']:
                                post_data['videos'].append(version['url'])
                        if 'image_versions2' in item:  # Video thumbnail
                            for version in item['image_versions2']['candidates']:
                                post_data['images'].append(version['url'])
                    elif item.get('media_type') == 8:  # Carousel
                        if 'carousel_media' in item:
                            for carousel_item in item['carousel_media']:
                                if carousel_item.get('media_type') == 1:  # Image in carousel
                                    if 'image_versions2' in carousel_item:
                                        for version in carousel_item['image_versions2']['candidates']:
                                            post_data['images'].append(version['url'])
                                elif carousel_item.get('media_type') == 2:  # Video in carousel
                                    if 'video_versions' in carousel_item:
                                        for version in carousel_item['video_versions']:
                                            post_data['videos'].append(version['url'])
                    
                    posts.append(post_data)
            
        except Exception as e:
            logging.error(f"Failed to get posts for user {user_id}: {e}")
        
        return posts
    
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
        
        # Get user ID
        user_id = self.get_user_id(brand_name)
        if not user_id:
            return {
                'brand': brand_name,
                'url': url,
                'success': False,
                'error': 'Failed to get user ID',
                'images': [],
                'videos': []
            }
        
        # Get user posts
        posts = self.get_user_posts(user_id, max_posts=100)
        
        if not posts:
            return {
                'brand': brand_name,
                'url': url,
                'success': False,
                'error': 'No posts found',
                'images': [],
                'videos': []
            }
        
        # Download images and videos
        downloaded_images = []
        downloaded_videos = []
        
        for i, post in enumerate(posts):
            post_dir = os.path.join(ig_dir, f"post_{i+1:03d}")
            os.makedirs(post_dir, exist_ok=True)
            
            # Save post metadata
            metadata_file = os.path.join(post_dir, "metadata.json")
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(post, f, indent=2, ensure_ascii=False)
            
            # Download images
            for j, img_url in enumerate(post['images']):
                file_extension = self._get_file_extension(img_url)
                filename = f"image_{j+1:03d}{file_extension}"
                filepath = os.path.join(post_dir, filename)
                
                if self.download_media(img_url, filepath):
                    downloaded_images.append({
                        'post_id': post['id'],
                        'url': img_url,
                        'filename': filename,
                        'local_path': filepath
                    })
                    logging.info(f"Downloaded image: {filename}")
            
            # Download videos
            for j, video_url in enumerate(post['videos']):
                file_extension = self._get_file_extension(video_url)
                filename = f"video_{j+1:03d}{file_extension}"
                filepath = os.path.join(post_dir, filename)
                
                if self.download_media(video_url, filepath):
                    downloaded_videos.append({
                        'post_id': post['id'],
                        'url': video_url,
                        'filename': filename,
                        'local_path': filepath
                    })
                    logging.info(f"Downloaded video: {filename}")
        
        return {
            'brand': brand_name,
            'url': url,
            'user_id': user_id,
            'success': True,
            'posts': posts,
            'images': downloaded_images,
            'videos': downloaded_videos,
            'total_posts': len(posts),
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
        logging.info("Starting Instagram API scraping process...")
        
        all_data = {
            'scrape_date': datetime.now().isoformat(),
            'total_brands': len(self.brand_urls),
            'brands': {}
        }
        
        if parallel:
            # Parallel processing (limited to 2 workers to avoid rate limiting)
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
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
                time.sleep(random.uniform(2, 5))
        
        # Save results
        self.save_results(all_data)
        
        # Print summary
        self.print_summary(all_data)
        
        return all_data
    
    def save_results(self, data: Dict):
        """Save scraping results to files"""
        # Save as JSON
        json_file = os.path.join(self.base_dir, 'instagram_api_results.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_file = os.path.join(self.base_dir, 'instagram_api_results.csv')
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Brand', 'URL', 'Success', 'Posts', 'Images', 'Videos', 'Error'])
            
            for brand_data in data['brands'].values():
                writer.writerow([
                    brand_data['brand'],
                    brand_data['url'],
                    brand_data['success'],
                    brand_data.get('total_posts', 0),
                    brand_data.get('total_images', 0),
                    brand_data.get('total_videos', 0),
                    brand_data.get('error', '')
                ])
        
        logging.info(f"Results saved to {json_file} and {csv_file}")
    
    def print_summary(self, data: Dict):
        """Print a summary of the scraping results"""
        print("\n" + "=" * 60)
        print("INSTAGRAM API SCRAPING COMPLETE - SUMMARY")
        print("=" * 60)
        
        total_posts = 0
        total_images = 0
        total_videos = 0
        successful_brands = 0
        failed_brands = 0
        
        for brand_data in data['brands'].values():
            if brand_data['success']:
                successful_brands += 1
                total_posts += brand_data.get('total_posts', 0)
                total_images += brand_data.get('total_images', 0)
                total_videos += brand_data.get('total_videos', 0)
            else:
                failed_brands += 1
        
        print(f"Total brands processed: {len(data['brands'])}")
        print(f"Successful brands: {successful_brands}")
        print(f"Failed brands: {failed_brands}")
        print(f"Total posts scraped: {total_posts}")
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
    scraper = InstagramAPIScraper()
    
    # Configuration
    PARALLEL_SCRAPING = False  # Set to True for faster scraping (be careful with rate limits)
    
    # Run the complete scrape
    data = scraper.run_complete_scrape(parallel=PARALLEL_SCRAPING)
    
    print("\nInstagram API scraping completed!")
    print("Check the 'instagram_content/' folder for all downloaded content.")
    print("Check 'instagram_api_results.json' for detailed results.")
    
    return data

if __name__ == "__main__":
    main()
