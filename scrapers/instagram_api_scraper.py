#!/usr/bin/env python3
"""
Instagram API Scraper
Downloads images and videos from Instagram accounts using Instagram's GraphQL API
"""

import requests
import json
import os
import time
import re
import random
from urllib.parse import urlparse
import urllib.request
import logging

class InstagramAPIScraper:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.instagram.com/',
            'Origin': 'https://www.instagram.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Requested-With': 'XMLHttpRequest'
        })
        self.output_dir = output_dir
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('instagram_api_scraper.log'),
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
    
    def get_user_id(self, username):
        """Get user ID from username using Instagram's API"""
        try:
            # First, get the profile page to extract user ID
            profile_url = f"https://www.instagram.com/{username}/"
            response = self.session.get(profile_url, timeout=15)
            response.raise_for_status()
            
            # Look for user ID in the page source
            user_id_match = re.search(r'"user_id":"(\d+)"', response.text)
            if user_id_match:
                return user_id_match.group(1)
            
            # Alternative method: look for profile page data
            profile_data_match = re.search(r'"profilePage":\[{"user":(.*?)}', response.text)
            if profile_data_match:
                profile_data = json.loads(profile_data_match.group(1))
                return str(profile_data.get('id', ''))
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting user ID for {username}: {e}")
            return None
    
    def get_profile_data(self, username):
        """Get profile data using Instagram's API"""
        try:
            user_id = self.get_user_id(username)
            if not user_id:
                self.logger.warning(f"Could not get user ID for {username}")
                return None
            
            # Use Instagram's GraphQL API
            api_url = "https://www.instagram.com/graphql/query/"
            
            variables = {
                "user_id": user_id,
                "include_chaining": False,
                "include_reel": True,
                "include_suggested_users": False,
                "include_logged_out_extras": False,
                "include_highlight_reels": False,
                "include_related_profiles": False
            }
            
            params = {
                "query_hash": "e769aa130647d2354c40ea6a439bfc08",
                "variables": json.dumps(variables)
            }
            
            response = self.session.get(api_url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and 'user' in data['data']:
                user_data = data['data']['user']
                
                profile_data = {
                    'username': username,
                    'user_id': user_id,
                    'full_name': user_data.get('full_name', ''),
                    'biography': user_data.get('biography', ''),
                    'profile_pic_url': user_data.get('profile_pic_url', ''),
                    'profile_pic_url_hd': user_data.get('profile_pic_url_hd', ''),
                    'followers_count': user_data.get('edge_followed_by', {}).get('count', 0),
                    'following_count': user_data.get('edge_follow', {}).get('count', 0),
                    'posts_count': user_data.get('edge_owner_to_timeline_media', {}).get('count', 0),
                    'is_private': user_data.get('is_private', False),
                    'is_verified': user_data.get('is_verified', False)
                }
                
                return profile_data
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting profile data for {username}: {e}")
            return None
    
    def get_user_posts(self, username, max_posts=12):
        """Get user posts using Instagram's API"""
        try:
            user_id = self.get_user_id(username)
            if not user_id:
                return []
            
            # Use Instagram's GraphQL API for posts
            api_url = "https://www.instagram.com/graphql/query/"
            
            variables = {
                "id": user_id,
                "first": max_posts,
                "after": None
            }
            
            params = {
                "query_hash": "003056d32c2554def87228bc3fd9668a",
                "variables": json.dumps(variables)
            }
            
            response = self.session.get(api_url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            posts_data = []
            
            if 'data' in data and 'user' in data['data']:
                user_data = data['data']['user']
                posts = user_data.get('edge_owner_to_timeline_media', {}).get('edges', [])
                
                for post in posts:
                    post_node = post['node']
                    
                    post_data = {
                        'id': post_node.get('id', ''),
                        'shortcode': post_node.get('shortcode', ''),
                        'caption': '',
                        'media_urls': [],
                        'is_video': post_node.get('is_video', False),
                        'likes_count': post_node.get('edge_liked_by', {}).get('count', 0),
                        'comments_count': post_node.get('edge_media_to_comment', {}).get('count', 0),
                        'timestamp': post_node.get('taken_at_timestamp', 0)
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
                        
                        # Get additional images for carousel posts
                        if post_node.get('edge_sidecar_to_children', {}).get('edges'):
                            for edge in post_node['edge_sidecar_to_children']['edges']:
                                child = edge['node']
                                if child.get('is_video'):
                                    if child.get('video_url'):
                                        post_data['media_urls'].append({
                                            'type': 'video',
                                            'url': child['video_url']
                                        })
                                else:
                                    if child.get('display_url'):
                                        post_data['media_urls'].append({
                                            'type': 'image',
                                            'url': child['display_url']
                                        })
                    
                    posts_data.append(post_data)
            
            return posts_data
            
        except Exception as e:
            self.logger.error(f"Error getting posts for {username}: {e}")
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
                if profile_data.get('profile_pic_url_hd'):
                    profile_pic_path = os.path.join(brand_folder, f"{username}_profile_hd.jpg")
                    self.download_media(profile_data['profile_pic_url_hd'], profile_pic_path)
                elif profile_data.get('profile_pic_url'):
                    profile_pic_path = os.path.join(brand_folder, f"{username}_profile.jpg")
                    self.download_media(profile_data['profile_pic_url'], profile_pic_path)
                
                # Save profile data
                profile_file = os.path.join(brand_folder, 'profile_data.json')
                with open(profile_file, 'w', encoding='utf-8') as f:
                    json.dump(profile_data, f, indent=2)
            
            # Get posts data
            posts_data = self.get_user_posts(username, max_posts=12)
            
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
        self.logger.info("Starting Instagram API Scraper...")
        
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
    """Main function to run the Instagram API scraper"""
    scraper = InstagramAPIScraper()
    
    # Test with just a few brands first
    scraper.run(max_brands=3)

if __name__ == "__main__":
    main()
