#!/usr/bin/env python3
"""
Instagram Scraper using Instaloader
Downloads ALL Instagram content (photos, videos, stories) from lowheads brands
Saves content in IG folders within existing brand folders
"""

import instaloader
import os
import json
import time
import logging
from datetime import datetime
import csv
import re

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('instagram_instaloader_scraper.log'),
        logging.StreamHandler()
    ]
)

class InstagramInstaloaderScraper:
    def __init__(self):
        # Initialize Instaloader
        self.L = instaloader.Instaloader(
            download_pictures=True,
            download_videos=True,
            download_video_thumbnails=True,
            download_geotags=False,
            download_comments=False,
            save_metadata=True,
            compress_json=False,
            dirname_pattern='{target}',
            filename_pattern='{date_utc:%Y%m%d}_{shortcode}',
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        # Rate limiting
        self.request_delay = 2  # seconds between requests
        
        # Load lowheads brands from the scraper
        self.lowheads_brands = self.load_lowheads_brands()
        
        # Track results
        self.results = {
            'scrape_date': datetime.now().isoformat(),
            'total_brands': len(self.lowheads_brands),
            'brands': {}
        }
    
    def load_lowheads_brands(self):
        """Load the brands list from lowheads_scraper.py"""
        # Import the brands list from lowheads scraper
        try:
            from lowheads_scraper import LowheadsCompleteScraper
            scraper = LowheadsCompleteScraper()
            return scraper.BRANDS
        except ImportError:
            # Fallback: hardcoded brands list
            return [
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
    
    def convert_brand_to_instagram_handle(self, brand: str) -> str:
        """Convert brand name to Instagram handle"""
        clean_name = brand.lower()
        clean_name = re.sub(r'[™®©]', '', clean_name)  # Remove trademark symbols
        clean_name = re.sub(r'[^\w\s-]', '', clean_name)  # Remove special chars except hyphen
        clean_name = re.sub(r'\s+', '', clean_name)  # Remove spaces
        clean_name = re.sub(r'-+', '', clean_name)  # Remove hyphens
        clean_name = clean_name.strip()
        return clean_name
    
    def check_instagram_account_exists(self, handle: str) -> bool:
        """Check if an Instagram account exists"""
        try:
            profile = instaloader.Profile.from_username(self.L.context, handle)
            return profile is not None
        except instaloader.exceptions.ProfileNotExistsException:
            return False
        except Exception as e:
            logging.warning(f"Error checking account {handle}: {e}")
            return False
    
    def download_brand_instagram_content(self, brand_name: str) -> dict:
        """Download all Instagram content for a specific brand"""
        handle = self.convert_brand_to_instagram_handle(brand_name)
        
        logging.info(f"Processing brand: {brand_name} -> @{handle}")
        
        result = {
            'brand': brand_name,
            'instagram_handle': handle,
            'success': False,
            'error': None,
            'posts_downloaded': 0,
            'stories_downloaded': 0,
            'highlights_downloaded': 0,
            'profile_pic_downloaded': False
        }
        
        # Check if brand folder exists in downloads
        brand_folder = os.path.join('downloads', brand_name)
        if not os.path.exists(brand_folder):
            result['error'] = 'Brand folder not found'
            logging.warning(f"Brand folder not found: {brand_folder}")
            return result
        
        # Create IG subfolder in the brand folder
        ig_folder = os.path.join(brand_folder, 'IG')
        os.makedirs(ig_folder, exist_ok=True)
        
        try:
            # Check if Instagram account exists
            if not self.check_instagram_account_exists(handle):
                result['error'] = 'Instagram account not found'
                logging.warning(f"Instagram account not found: @{handle}")
                return result
            
            # Get profile
            profile = instaloader.Profile.from_username(self.L.context, handle)
            
            # Set download directory to the IG folder
            original_dirname_pattern = self.L.dirname_pattern
            self.L.dirname_pattern = ig_folder
            
            # Download profile picture
            try:
                self.L.download_profilepic(profile)
                result['profile_pic_downloaded'] = True
                logging.info(f"Downloaded profile picture for @{handle}")
            except Exception as e:
                logging.warning(f"Failed to download profile picture for @{handle}: {e}")
            
            # Download posts (photos and videos)
            try:
                posts = profile.get_posts()
                post_count = 0
                
                for post in posts:
                    try:
                        self.L.download_post(post, target=ig_folder)
                        post_count += 1
                        logging.info(f"Downloaded post {post_count} for @{handle}")
                        
                        # Rate limiting
                        time.sleep(self.request_delay)
                        
                    except Exception as e:
                        logging.warning(f"Failed to download post for @{handle}: {e}")
                        continue
                
                result['posts_downloaded'] = post_count
                logging.info(f"Downloaded {post_count} posts for @{handle}")
                
            except Exception as e:
                logging.error(f"Failed to download posts for @{handle}: {e}")
            
            # Download stories (if available)
            try:
                stories = profile.get_stories()
                story_count = 0
                
                for story in stories:
                    try:
                        self.L.download_storyitem(story, target=ig_folder)
                        story_count += 1
                        logging.info(f"Downloaded story {story_count} for @{handle}")
                        
                        # Rate limiting
                        time.sleep(self.request_delay)
                        
                    except Exception as e:
                        logging.warning(f"Failed to download story for @{handle}: {e}")
                        continue
                
                result['stories_downloaded'] = story_count
                logging.info(f"Downloaded {story_count} stories for @{handle}")
                
            except Exception as e:
                logging.warning(f"Failed to download stories for @{handle}: {e}")
            
            # Download highlights (if available)
            try:
                highlights = profile.get_highlights()
                highlight_count = 0
                
                for highlight in highlights:
                    try:
                        for item in highlight:
                            self.L.download_storyitem(item, target=ig_folder)
                            highlight_count += 1
                            logging.info(f"Downloaded highlight {highlight_count} for @{handle}")
                            
                            # Rate limiting
                            time.sleep(self.request_delay)
                            
                    except Exception as e:
                        logging.warning(f"Failed to download highlight for @{handle}: {e}")
                        continue
                
                result['highlights_downloaded'] = highlight_count
                logging.info(f"Downloaded {highlight_count} highlights for @{handle}")
                
            except Exception as e:
                logging.warning(f"Failed to download highlights for @{handle}: {e}")
            
            # Restore original dirname pattern
            self.L.dirname_pattern = original_dirname_pattern
            
            result['success'] = True
            logging.info(f"Successfully processed @{handle}")
            
        except Exception as e:
            result['error'] = str(e)
            logging.error(f"Error processing @{handle}: {e}")
        
        return result
    
    def run_complete_scrape(self) -> dict:
        """Run the complete Instagram scraping process for all lowheads brands"""
        logging.info("Starting Instagram content scraping with Instaloader...")
        logging.info(f"Processing {len(self.lowheads_brands)} brands")
        
        for i, brand in enumerate(self.lowheads_brands, 1):
            logging.info(f"[{i}/{len(self.lowheads_brands)}] Processing: {brand}")
            
            result = self.download_brand_instagram_content(brand)
            self.results['brands'][brand] = result
            
            # Add delay between brands
            time.sleep(3)
        
        # Save results
        self.save_results()
        
        # Print summary
        self.print_summary()
        
        return self.results
    
    def save_results(self):
        """Save scraping results to files"""
        # Save as JSON
        json_file = 'instagram_instaloader_results.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_file = 'instagram_instaloader_results.csv'
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Brand', 'Instagram Handle', 'Success', 'Posts', 'Stories', 'Highlights', 'Profile Pic', 'Error'])
            
            for brand_data in self.results['brands'].values():
                writer.writerow([
                    brand_data['brand'],
                    brand_data['instagram_handle'],
                    brand_data['success'],
                    brand_data['posts_downloaded'],
                    brand_data['stories_downloaded'],
                    brand_data['highlights_downloaded'],
                    brand_data['profile_pic_downloaded'],
                    brand_data.get('error', '')
                ])
        
        logging.info(f"Results saved to {json_file} and {csv_file}")
    
    def print_summary(self):
        """Print a summary of the scraping results"""
        print("\n" + "=" * 60)
        print("INSTAGRAM INSTALOADER SCRAPING COMPLETE - SUMMARY")
        print("=" * 60)
        
        total_posts = 0
        total_stories = 0
        total_highlights = 0
        successful_brands = 0
        failed_brands = 0
        
        for brand_data in self.results['brands'].values():
            if brand_data['success']:
                successful_brands += 1
                total_posts += brand_data['posts_downloaded']
                total_stories += brand_data['stories_downloaded']
                total_highlights += brand_data['highlights_downloaded']
            else:
                failed_brands += 1
        
        print(f"Total brands processed: {len(self.results['brands'])}")
        print(f"Successful brands: {successful_brands}")
        print(f"Failed brands: {failed_brands}")
        print(f"Total posts downloaded: {total_posts}")
        print(f"Total stories downloaded: {total_stories}")
        print(f"Total highlights downloaded: {total_highlights}")
        print(f"Success rate: {successful_brands/len(self.results['brands'])*100:.1f}%")
        
        # Show top brands by content count
        sorted_brands = sorted(
            [b for b in self.results['brands'].values() if b['success']],
            key=lambda x: x['posts_downloaded'] + x['stories_downloaded'] + x['highlights_downloaded'],
            reverse=True
        )[:10]
        
        print("\nTop 10 brands by content count:")
        for brand_data in sorted_brands:
            total_content = brand_data['posts_downloaded'] + brand_data['stories_downloaded'] + brand_data['highlights_downloaded']
            print(f"  - {brand_data['brand']} (@{brand_data['instagram_handle']}): {total_content} items ({brand_data['posts_downloaded']} posts, {brand_data['stories_downloaded']} stories, {brand_data['highlights_downloaded']} highlights)")
        
        print(f"\n✓ Content saved to brand folders in 'downloads/' directory")
        print("=" * 60)

def main():
    """Main execution function"""
    scraper = InstagramInstaloaderScraper()
    
    # Run the complete scrape
    results = scraper.run_complete_scrape()
    
    print("\nInstagram content scraping completed!")
    print("Check the brand folders in 'downloads/' for Instagram content.")
    print("Check 'instagram_instaloader_results.json' for detailed results.")
    
    return results

if __name__ == "__main__":
    main()
