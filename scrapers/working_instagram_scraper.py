#!/usr/bin/env python3
"""
Working Instagram Content Scraper
Downloads images and videos from Instagram accounts using requests and BeautifulSoup
"""

import requests
import json
import os
import time
import re
import random
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import urllib.request
import logging

class WorkingInstagramScraper:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.session = requests.Session()
        self.session.headers.update({
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
            'Cache-Control': 'max-age=0'
        })
        self.output_dir = output_dir
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('working_instagram_scraper.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def extract_username_from_url(self, instagram_url):
        """Extract username from Instagram URL"""
        try:
            if '/p/' in instagram_url:
                # Post URL, extract username from the path
                path = urlparse(instagram_url).path
                parts = path.split('/')
                if len(parts) > 1:
                    return parts[1]
            elif 'instagram.com/' in instagram_url:
                # Profile URL
                path = urlparse(instagram_url).path
                username = path.strip('/')
                if username and not username.startswith('p/'):
                    return username
            
            return None
        except Exception as e:
            self.logger.error(f"Error extracting username from {instagram_url}: {e}")
            return None
    
    def get_profile_data(self, username):
        """Get profile data using requests"""
        try:
            profile_url = f"https://www.instagram.com/{username}/"
            self.logger.info(f"Fetching profile data for: {username}")
            
            response = self.session.get(profile_url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            profile_data = {
                'username': username,
                'profile_pic_url': None,
                'bio': '',
                'followers': '0',
                'posts_count': '0'
            }
            
            # Look for profile picture in meta tags
            meta_tags = soup.find_all('meta', property='og:image')
            if meta_tags:
                profile_data['profile_pic_url'] = meta_tags[0].get('content')
            
            # Look for bio in meta tags
            meta_description = soup.find('meta', property='og:description')
            if meta_description:
                profile_data['bio'] = meta_description.get('content', '')
            
            # Try to find follower count in script tags
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'window._sharedData = ' in script.string:
                    try:
                        json_str = script.string.replace('window._sharedData = ', '').rstrip(';')
                        data = json.loads(json_str)
                        
                        if 'entry_data' in data and 'ProfilePage' in data['entry_data']:
                            user_data = data['entry_data']['ProfilePage'][0]['graphql']['user']
                            profile_data['followers'] = str(user_data.get('edge_followed_by', {}).get('count', 0))
                            profile_data['posts_count'] = str(user_data.get('edge_owner_to_timeline_media', {}).get('count', 0))
                            break
                    except:
                        continue
            
            return profile_data
            
        except Exception as e:
            self.logger.error(f"Error getting profile data for {username}: {e}")
            return None
    
    def get_recent_posts_data(self, username, max_posts=10):
        """Get recent posts data using requests"""
        try:
            profile_url = f"https://www.instagram.com/{username}/"
            
            response = self.session.get(profile_url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            posts_data = []
            
            # Look for posts data in script tags
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'window._sharedData = ' in script.string:
                    try:
                        json_str = script.string.replace('window._sharedData = ', '').rstrip(';')
                        data = json.loads(json_str)
                        
                        if 'entry_data' in data and 'ProfilePage' in data['entry_data']:
                            user_data = data['entry_data']['ProfilePage'][0]['graphql']['user']
                            posts = user_data.get('edge_owner_to_timeline_media', {}).get('edges', [])
                            
                            for i, post in enumerate(posts[:max_posts]):
                                post_node = post['node']
                                
                                post_data = {
                                    'id': post_node.get('id', ''),
                                    'shortcode': post_node.get('shortcode', ''),
                                    'caption': '',
                                    'media_urls': [],
                                    'is_video': post_node.get('is_video', False),
                                    'likes': str(post_node.get('edge_liked_by', {}).get('count', 0)),
                                    'comments': str(post_node.get('edge_media_to_comment', {}).get('count', 0))
                                }
                                
                                # Get caption
                                if post_node.get('edge_media_to_caption', {}).get('edges'):
                                    post_data['caption'] = post_node['edge_media_to_caption']['edges'][0]['node']['text']
                                
                                # Get media URLs
                                if post_node.get('is_video'):
                                    if post_node.get('video_url'):
                                        post_data['media_urls'].append({
                                            'type': 'video',
                                            'url': post_node['video_url']
                                        })
                                else:
                                    if post_node.get('display_url'):
                                        post_data['media_urls'].append({
                                            'type': 'image',
                                            'url': post_node['display_url']
                                        })
                                
                                posts_data.append(post_data)
                            
                            break
                    except Exception as e:
                        self.logger.error(f"Error parsing posts data: {e}")
                        continue
            
            return posts_data
            
        except Exception as e:
            self.logger.error(f"Error getting posts data for {username}: {e}")
            return []
    
    def download_media(self, url, filepath):
        """Download media file from URL"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Download the file
            urllib.request.urlretrieve(url, filepath)
            self.logger.info(f"Downloaded: {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error downloading {url}: {e}")
            return False
    
    def scrape_brand_instagram(self, brand_name, instagram_url):
        """Scrape Instagram content for a specific brand"""
        try:
            # Extract username from URL
            username = self.extract_username_from_url(instagram_url)
            if not username:
                self.logger.error(f"Could not extract username from URL: {instagram_url}")
                return False
            
            # Create brand folder
            brand_folder = os.path.join(self.output_dir, brand_name)
            images_folder = os.path.join(brand_folder, 'images')
            videos_folder = os.path.join(brand_folder, 'videos')
            posts_folder = os.path.join(brand_folder, 'posts')
            
            os.makedirs(images_folder, exist_ok=True)
            os.makedirs(videos_folder, exist_ok=True)
            os.makedirs(posts_folder, exist_ok=True)
            
            self.logger.info(f"Processing {brand_name} (@{username})")
            
            # Get profile data
            profile_data = self.get_profile_data(username)
            if profile_data:
                # Download profile picture
                if profile_data.get('profile_pic_url'):
                    profile_pic_path = os.path.join(brand_folder, f"{username}_profile.jpg")
                    self.download_media(profile_data['profile_pic_url'], profile_pic_path)
                
                # Save profile data
                profile_file = os.path.join(brand_folder, 'profile_data.json')
                with open(profile_file, 'w', encoding='utf-8') as f:
                    json.dump(profile_data, f, indent=2)
            
            # Get recent posts data
            posts_data = self.get_recent_posts_data(username, max_posts=8)
            
            # Download media from posts
            downloaded_count = 0
            for i, post in enumerate(posts_data):
                try:
                    post_folder = os.path.join(posts_folder, f"post_{i+1}")
                    os.makedirs(post_folder, exist_ok=True)
                    
                    # Save post data
                    post_file = os.path.join(post_folder, 'post_data.json')
                    with open(post_file, 'w', encoding='utf-8') as f:
                        json.dump(post, f, indent=2)
                    
                    # Download media
                    for j, media in enumerate(post.get('media_urls', [])):
                        if media['type'] == 'image':
                            filename = f"image_{j+1}.jpg"
                            filepath = os.path.join(post_folder, filename)
                        else:
                            filename = f"video_{j+1}.mp4"
                            filepath = os.path.join(post_folder, filename)
                        
                        if self.download_media(media['url'], filepath):
                            downloaded_count += 1
                    
                    time.sleep(random.uniform(1, 2))
                    
                except Exception as e:
                    self.logger.error(f"Error processing post {i+1}: {e}")
                    continue
            
            self.logger.info(f"Downloaded {downloaded_count} media files for {brand_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error scraping {brand_name}: {e}")
            return False
    
    def read_brands_list(self, brands_file="downloads/brands-list.md"):
        """Read brands and Instagram links from the markdown file"""
        brands = {}
        
        try:
            with open(brands_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract brand names and Instagram links
            lines = content.split('\n')
            for line in lines:
                if '**' in line and 'Instagram' in line:
                    # Extract brand name
                    brand_match = re.search(r'\*\*(.*?)\*\*', line)
                    if brand_match:
                        brand_name = brand_match.group(1)
                        
                        # Extract Instagram URL
                        url_match = re.search(r'https://www\.instagram\.com/[^\s)]+', line)
                        if url_match:
                            instagram_url = url_match.group(0)
                            brands[brand_name] = instagram_url
                        elif 'No official Instagram link found' in line or 'No specific Instagram link found' in line:
                            brands[brand_name] = None
            
            return brands
            
        except Exception as e:
            self.logger.error(f"Error reading brands file: {e}")
            return {}
    
    def run(self, brands_file="downloads/brands-list.md", max_brands=None):
        """Main method to scrape Instagram content for all brands"""
        self.logger.info("Starting Working Instagram Content Scraper...")
        
        # Read brands list
        brands = self.read_brands_list(brands_file)
        
        if not brands:
            self.logger.error("No brands found in the file!")
            return
        
        self.logger.info(f"Found {len(brands)} brands with Instagram links")
        
        # Limit brands if specified
        if max_brands:
            brands = dict(list(brands.items())[:max_brands])
            self.logger.info(f"Limited to {max_brands} brands for testing")
        
        # Process each brand
        successful_scrapes = 0
        for i, (brand_name, instagram_url) in enumerate(brands.items(), 1):
            if not instagram_url:
                self.logger.info(f"Skipping {brand_name} - no Instagram link")
                continue
            
            self.logger.info(f"\n[{i}/{len(brands)}] Processing: {brand_name}")
            
            if self.scrape_brand_instagram(brand_name, instagram_url):
                successful_scrapes += 1
            
            # Be respectful with delays between brands
            time.sleep(random.uniform(3, 6))
        
        self.logger.info(f"\nCompleted! Successfully scraped {successful_scrapes} out of {len(brands)} brands")
        self.logger.info(f"Check the '{self.output_dir}' folder for downloaded content.")

def main():
    """Main function to run the working Instagram scraper"""
    scraper = WorkingInstagramScraper()
    
    # Test with just a few brands first
    scraper.run(max_brands=3)

if __name__ == "__main__":
    main()
