#!/usr/bin/env python3
"""
Full Instagram Scraper
Downloads Instagram content for ALL brands
"""

import requests
import json
import os
import time
import re
from urllib.parse import urlparse
import urllib.request
import logging
import random

class FullInstagramScraper:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Instagram 219.0.0.12.117 Android',
            'Accept': '*/*',
            'Accept-Language': 'en-US',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        self.output_dir = output_dir
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def extract_username(self, instagram_url):
        path = urlparse(instagram_url).path
        username = path.strip('/')
        return username if username and not username.startswith('p/') else None
    
    def get_user_info(self, username):
        try:
            url = f"https://i.instagram.com/api/v1/users/web_profile_info/?username={username}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('data', {}).get('user', {})
                
                return {
                    'username': username,
                    'full_name': user.get('full_name', ''),
                    'biography': user.get('biography', ''),
                    'profile_pic_url': user.get('profile_pic_url', ''),
                    'profile_pic_url_hd': user.get('profile_pic_url_hd', ''),
                    'followers': user.get('edge_followed_by', {}).get('count', 0),
                    'posts_count': user.get('edge_owner_to_timeline_media', {}).get('count', 0),
                    'is_private': user.get('is_private', False)
                }
            
            return None
        except Exception as e:
            self.logger.error(f"Error getting user info for {username}: {e}")
            return None
    
    def get_user_posts(self, username, max_posts=6):
        try:
            url = f"https://i.instagram.com/api/v1/feed/user/{username}/username/?count={max_posts}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                posts = data.get('items', [])
                
                posts_data = []
                for post in posts:
                    post_data = {
                        'id': post.get('id', ''),
                        'caption': post.get('caption', {}).get('text', ''),
                        'media_urls': [],
                        'likes': post.get('like_count', 0),
                        'comments': post.get('comment_count', 0)
                    }
                    
                    # Get media URLs
                    if post.get('media_type') == 2:  # Video
                        if post.get('video_versions'):
                            post_data['media_urls'].append({
                                'type': 'video',
                                'url': post['video_versions'][0]['url']
                            })
                    else:  # Image
                        if post.get('image_versions2', {}).get('candidates'):
                            post_data['media_urls'].append({
                                'type': 'image',
                                'url': post['image_versions2']['candidates'][0]['url']
                            })
                    
                    # Handle carousel posts
                    if post.get('carousel_media'):
                        for carousel_item in post['carousel_media']:
                            if carousel_item.get('media_type') == 2:  # Video
                                if carousel_item.get('video_versions'):
                                    post_data['media_urls'].append({
                                        'type': 'video',
                                        'url': carousel_item['video_versions'][0]['url']
                                    })
                            else:  # Image
                                if carousel_item.get('image_versions2', {}).get('candidates'):
                                    post_data['media_urls'].append({
                                        'type': 'image',
                                        'url': carousel_item['image_versions2']['candidates'][0]['url']
                                    })
                    
                    posts_data.append(post_data)
                
                return posts_data
            
            return []
        except Exception as e:
            self.logger.error(f"Error getting posts for {username}: {e}")
            return []
    
    def download_media(self, url, filepath):
        try:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            urllib.request.urlretrieve(url, filepath)
            self.logger.info(f"Downloaded: {filepath}")
            return True
        except Exception as e:
            self.logger.error(f"Error downloading {url}: {e}")
            return False
    
    def scrape_brand(self, brand_name, instagram_url):
        try:
            username = self.extract_username(instagram_url)
            if not username:
                return False
            
            brand_folder = os.path.join(self.output_dir, brand_name)
            os.makedirs(brand_folder, exist_ok=True)
            
            self.logger.info(f"Processing {brand_name} (@{username})")
            
            # Get user info
            user_info = self.get_user_info(username)
            if user_info:
                # Download profile picture
                if user_info.get('profile_pic_url_hd'):
                    profile_path = os.path.join(brand_folder, f"{username}_profile_hd.jpg")
                    self.download_media(user_info['profile_pic_url_hd'], profile_path)
                elif user_info.get('profile_pic_url'):
                    profile_path = os.path.join(brand_folder, f"{username}_profile.jpg")
                    self.download_media(user_info['profile_pic_url'], profile_path)
                
                # Save user info
                with open(os.path.join(brand_folder, 'user_info.json'), 'w') as f:
                    json.dump(user_info, f, indent=2)
            
            # Get posts
            posts = self.get_user_posts(username, max_posts=6)
            
            # Download post media
            downloaded_count = 0
            for i, post in enumerate(posts):
                post_folder = os.path.join(brand_folder, f"post_{i+1}")
                os.makedirs(post_folder, exist_ok=True)
                
                # Save post data
                with open(os.path.join(post_folder, 'post_data.json'), 'w') as f:
                    json.dump(post, f, indent=2)
                
                # Download media
                for j, media in enumerate(post.get('media_urls', [])):
                    if media['type'] == 'image':
                        filename = f"image_{j+1}.jpg"
                    else:
                        filename = f"video_{j+1}.mp4"
                    
                    filepath = os.path.join(post_folder, filename)
                    if self.download_media(media['url'], filepath):
                        downloaded_count += 1
                
                time.sleep(1)
            
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
        self.logger.info("Starting Full Instagram Scraper...")
        
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
            
            if self.scrape_brand(brand_name, instagram_url):
                successful_scrapes += 1
            
            # Be respectful with delays between brands
            time.sleep(random.uniform(3, 6))
        
        self.logger.info(f"\nCompleted! Successfully scraped {successful_scrapes} out of {len(brands)} brands")
        self.logger.info(f"Check the '{self.output_dir}' folder for downloaded content.")

def main():
    scraper = FullInstagramScraper()
    
    # Run for all brands (or limit for testing)
    scraper.run(max_brands=None)  # Set to a number to limit

if __name__ == "__main__":
    main()
