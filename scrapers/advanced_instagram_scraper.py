#!/usr/bin/env python3
"""
Advanced Instagram Content Scraper
Downloads images, videos, and stories from Instagram accounts using multiple techniques
"""

import requests
import json
import os
import time
import re
import random
from urllib.parse import urlparse, parse_qs
from bs4 import BeautifulSoup
import urllib.request
import logging
import base64
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import undetected_chromedriver as uc

class AdvancedInstagramScraper:
    def __init__(self, output_dir="downloads/instagram_data"):
        self.output_dir = output_dir
        self.setup_logging()
        self.setup_driver()
        
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('advanced_instagram_scraper.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def setup_driver(self):
        """Setup undetected Chrome driver"""
        try:
            options = uc.ChromeOptions()
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            
            self.driver = uc.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.logger.info("Chrome driver setup successful")
            
        except Exception as e:
            self.logger.error(f"Failed to setup Chrome driver: {e}")
            self.driver = None
    
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
    
    def login_to_instagram(self, username=None, password=None):
        """Login to Instagram (optional)"""
        if not username or not password:
            self.logger.info("No credentials provided, proceeding without login")
            return True
        
        try:
            self.driver.get("https://www.instagram.com/accounts/login/")
            time.sleep(3)
            
            # Find and fill username
            username_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            username_field.send_keys(username)
            
            # Find and fill password
            password_field = self.driver.find_element(By.NAME, "password")
            password_field.send_keys(password)
            
            # Click login button
            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            login_button.click()
            
            time.sleep(5)
            self.logger.info("Login successful")
            return True
            
        except Exception as e:
            self.logger.error(f"Login failed: {e}")
            return False
    
    def get_profile_data(self, username):
        """Get profile data using Selenium"""
        try:
            profile_url = f"https://www.instagram.com/{username}/"
            self.driver.get(profile_url)
            time.sleep(random.uniform(3, 5))
            
            # Get profile picture
            try:
                profile_pic = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//img[@alt='profile picture']"))
                )
                profile_pic_url = profile_pic.get_attribute('src')
            except:
                profile_pic_url = None
            
            # Get bio and other info
            try:
                bio_element = self.driver.find_element(By.XPATH, "//div[@data-testid='user-bio']")
                bio = bio_element.text
            except:
                bio = ""
            
            # Get follower count
            try:
                followers_element = self.driver.find_element(By.XPATH, "//a[contains(@href, '/followers/')]//span")
                followers = followers_element.text
            except:
                followers = "0"
            
            return {
                'username': username,
                'profile_pic_url': profile_pic_url,
                'bio': bio,
                'followers': followers
            }
            
        except Exception as e:
            self.logger.error(f"Error getting profile data for {username}: {e}")
            return None
    
    def get_posts_data(self, username, max_posts=20):
        """Get posts data using Selenium"""
        try:
            profile_url = f"https://www.instagram.com/{username}/"
            self.driver.get(profile_url)
            time.sleep(random.uniform(3, 5))
            
            posts_data = []
            
            # Scroll to load more posts
            for i in range(3):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(random.uniform(2, 4))
            
            # Find post links
            post_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/p/')]")
            
            for i, link in enumerate(post_links[:max_posts]):
                try:
                    post_url = link.get_attribute('href')
                    self.logger.info(f"Processing post {i+1}: {post_url}")
                    
                    post_data = self.get_single_post_data(post_url)
                    if post_data:
                        posts_data.append(post_data)
                    
                    time.sleep(random.uniform(1, 3))
                    
                except Exception as e:
                    self.logger.error(f"Error processing post {i+1}: {e}")
                    continue
            
            return posts_data
            
        except Exception as e:
            self.logger.error(f"Error getting posts data for {username}: {e}")
            return []
    
    def get_single_post_data(self, post_url):
        """Get data from a single post"""
        try:
            self.driver.get(post_url)
            time.sleep(random.uniform(2, 4))
            
            post_data = {
                'url': post_url,
                'media_urls': [],
                'caption': '',
                'likes': '0',
                'comments': '0'
            }
            
            # Get media URLs
            try:
                # Look for images
                images = self.driver.find_elements(By.XPATH, "//img[@alt='Photo by']")
                for img in images:
                    src = img.get_attribute('src')
                    if src and 'instagram' in src:
                        post_data['media_urls'].append({
                            'type': 'image',
                            'url': src
                        })
                
                # Look for videos
                videos = self.driver.find_elements(By.XPATH, "//video")
                for video in videos:
                    src = video.get_attribute('src')
                    if src:
                        post_data['media_urls'].append({
                            'type': 'video',
                            'url': src
                        })
                
            except Exception as e:
                self.logger.error(f"Error getting media URLs: {e}")
            
            # Get caption
            try:
                caption_element = self.driver.find_element(By.XPATH, "//div[@data-testid='post-caption']")
                post_data['caption'] = caption_element.text
            except:
                pass
            
            # Get likes count
            try:
                likes_element = self.driver.find_element(By.XPATH, "//section//span[contains(text(), 'like')]")
                post_data['likes'] = likes_element.text.split()[0]
            except:
                pass
            
            return post_data
            
        except Exception as e:
            self.logger.error(f"Error getting single post data: {e}")
            return None
    
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
            
            # Get posts data
            posts_data = self.get_posts_data(username, max_posts=15)
            
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
        self.logger.info("Starting Advanced Instagram Content Scraper...")
        
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
            time.sleep(random.uniform(5, 10))
        
        self.logger.info(f"\nCompleted! Successfully scraped {successful_scrapes} out of {len(brands)} brands")
        self.logger.info(f"Check the '{self.output_dir}' folder for downloaded content.")
        
        # Clean up
        if self.driver:
            self.driver.quit()

def main():
    """Main function to run the advanced Instagram scraper"""
    scraper = AdvancedInstagramScraper()
    
    # Test with just a few brands first
    scraper.run(max_brands=3)

if __name__ == "__main__":
    main()
