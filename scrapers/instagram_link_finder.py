#!/usr/bin/env python3
"""
Instagram Link Finder Agent
Automatically finds Instagram links for brands by searching Google
"""

import requests
import re
import time
import json
from urllib.parse import quote_plus
from bs4 import BeautifulSoup
import os

class InstagramLinkFinder:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.instagram_pattern = r'https?://(?:www\.)?instagram\.com/[a-zA-Z0-9._-]+/?'
        
    def search_google(self, query):
        """Search Google for a query and return the HTML response"""
        try:
            # URL encode the query
            encoded_query = quote_plus(query)
            url = f"https://www.google.com/search?q={encoded_query}"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            return response.text
        except Exception as e:
            print(f"Error searching Google for '{query}': {e}")
            return None
    
    def extract_instagram_links(self, html_content):
        """Extract Instagram links from HTML content"""
        if not html_content:
            return []
        
        # Find all Instagram links
        instagram_links = re.findall(self.instagram_pattern, html_content)
        
        # Remove duplicates and clean up
        unique_links = list(set(instagram_links))
        cleaned_links = []
        
        for link in unique_links:
            # Remove any trailing parameters
            clean_link = link.split('?')[0].split('#')[0]
            if clean_link.endswith('/'):
                clean_link = clean_link[:-1]
            cleaned_links.append(clean_link)
        
        return cleaned_links
    
    def find_instagram_link(self, brand_name):
        """Find Instagram link for a specific brand"""
        print(f"Searching for Instagram link for: {brand_name}")
        
        # Try different search queries
        search_queries = [
            f'"{brand_name}" instagram',
            f'{brand_name} ig',
            f'{brand_name} instagram official',
            f'{brand_name} @instagram'
        ]
        
        for query in search_queries:
            print(f"  Trying query: {query}")
            html_content = self.search_google(query)
            
            if html_content:
                instagram_links = self.extract_instagram_links(html_content)
                
                if instagram_links:
                    # Return the first Instagram link found
                    print(f"  Found Instagram link: {instagram_links[0]}")
                    return instagram_links[0]
            
            # Be respectful with delays between requests
            time.sleep(2)
        
        print(f"  No Instagram link found for {brand_name}")
        return None
    
    def update_markdown_file(self, file_path, brand_links):
        """Update the markdown file with found Instagram links"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace placeholder links with actual links
            for brand, link in brand_links.items():
                if link:
                    placeholder = f'**{brand}** - [Instagram](INSERT_LINK_HERE)'
                    replacement = f'**{brand}** - [Instagram]({link})'
                    content = content.replace(placeholder, replacement)
                else:
                    placeholder = f'**{brand}** - [Instagram](INSERT_LINK_HERE)'
                    replacement = f'**{brand}** - No official Instagram link found'
                    content = content.replace(placeholder, replacement)
            
            # Write updated content back to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Updated {file_path} with {len(brand_links)} brand links")
            
        except Exception as e:
            print(f"Error updating markdown file: {e}")
    
    def extract_brands_from_markdown(self, file_path):
        """Extract brands that need Instagram links from the markdown file"""
        brands = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all lines with INSERT_LINK_HERE
            lines = content.split('\n')
            for line in lines:
                if 'INSERT_LINK_HERE' in line:
                    # Extract brand name from the line
                    match = re.search(r'\*\*(.*?)\*\*', line)
                    if match:
                        brand_name = match.group(1)
                        brands.append(brand_name)
            
            return brands
            
        except Exception as e:
            print(f"Error extracting brands from markdown: {e}")
            return []
    
    def run(self, markdown_file_path):
        """Main method to find Instagram links for all brands"""
        print("Starting Instagram Link Finder Agent...")
        print(f"Reading brands from: {markdown_file_path}")
        
        # Extract brands that need links
        brands = self.extract_brands_from_markdown(markdown_file_path)
        
        if not brands:
            print("No brands found that need Instagram links!")
            return
        
        print(f"Found {len(brands)} brands that need Instagram links")
        
        # Find Instagram links for each brand
        brand_links = {}
        for i, brand in enumerate(brands, 1):
            print(f"\n[{i}/{len(brands)}] Processing: {brand}")
            
            link = self.find_instagram_link(brand)
            brand_links[brand] = link
            
            # Update the file after each successful find
            if link:
                self.update_markdown_file(markdown_file_path, {brand: link})
            
            # Be respectful with delays
            time.sleep(3)
        
        print(f"\nCompleted! Found Instagram links for {len([l for l in brand_links.values() if l])} out of {len(brands)} brands")
        
        # Save results to a JSON file for reference
        results_file = markdown_file_path.replace('.md', '_instagram_results.json')
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(brand_links, f, indent=2)
        
        print(f"Results saved to: {results_file}")

def main():
    """Main function to run the Instagram Link Finder"""
    # Path to the brands markdown file
    markdown_file = "downloads/brands-list.md"
    
    # Check if file exists
    if not os.path.exists(markdown_file):
        print(f"Error: {markdown_file} not found!")
        return
    
    # Create and run the finder
    finder = InstagramLinkFinder()
    finder.run(markdown_file)

if __name__ == "__main__":
    main()
