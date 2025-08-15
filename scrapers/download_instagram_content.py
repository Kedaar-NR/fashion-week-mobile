#!/usr/bin/env python3
"""
Download Instagram Content using Instaloader CLI
Downloads all Instagram content (photos, videos, stories) from lowheads brands
Uses the Instaloader command line tool for maximum reliability
"""

import subprocess
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
        logging.FileHandler('instagram_download.log'),
        logging.StreamHandler()
    ]
)

class InstagramDownloader:
    def __init__(self):
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
    
    def download_brand_instagram_content(self, brand_name: str, use_login: bool = False, username: str = None) -> dict:
        """Download all Instagram content for a specific brand using Instaloader CLI"""
        handle = self.convert_brand_to_instagram_handle(brand_name)
        
        logging.info(f"Processing brand: {brand_name} -> @{handle}")
        
        result = {
            'brand': brand_name,
            'instagram_handle': handle,
            'success': False,
            'error': None,
            'command_used': '',
            'output': ''
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
            # Build Instaloader command according to official documentation
            cmd = ['instaloader']
            
            # Add login if requested (this is crucial for getting real content)
            if use_login and username:
                cmd.extend(['--login', username])
                logging.info(f"Using login: {username}")
            else:
                logging.warning("No login provided - may get limited/cached content")
            
            # Add all the content options
            cmd.extend([
                '--stories',      # Download stories
                '--highlights',   # Download highlights
                '--tagged',       # Download tagged posts
                '--reels',        # Download reels
                '--fast-update',  # Skip already downloaded content
                '--dirname-pattern', ig_folder,  # Set download directory
                '--filename-pattern', '{date_utc:%Y%m%d}_{shortcode}'  # Set filename pattern
            ])
            
            # Add the Instagram handle
            cmd.append(handle)
            
            result['command_used'] = ' '.join(cmd)
            
            logging.info(f"Running command: {result['command_used']}")
            
            # Run the command
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout for authenticated requests
            )
            
            result['output'] = process.stdout + process.stderr
            
            if process.returncode == 0:
                result['success'] = True
                logging.info(f"Successfully downloaded content for @{handle}")
            else:
                # Check if it's just a warning about login
                if "Login required" in result['output'] or "Login is required" in result['output']:
                    result['error'] = 'Login required for full content access'
                    logging.warning(f"Login required for @{handle} - limited content available")
                else:
                    result['error'] = f"Command failed with return code {process.returncode}"
                    logging.warning(f"Failed to download content for @{handle}: {result['error']}")
                    logging.warning(f"Output: {result['output']}")
            
        except subprocess.TimeoutExpired:
            result['error'] = 'Command timed out after 10 minutes'
            logging.error(f"Timeout downloading content for @{handle}")
        except Exception as e:
            result['error'] = str(e)
            logging.error(f"Error processing @{handle}: {e}")
        
        return result
    
    def run_complete_download(self, use_login: bool = False, username: str = None) -> dict:
        """Run the complete Instagram download process for all lowheads brands"""
        logging.info("Starting Instagram content download with Instaloader CLI...")
        logging.info(f"Processing {len(self.lowheads_brands)} brands")
        if use_login:
            logging.info(f"Using login: {username}")
        else:
            logging.warning("No login provided - will get limited content")
        
        for i, brand in enumerate(self.lowheads_brands, 1):
            logging.info(f"[{i}/{len(self.lowheads_brands)}] Processing: {brand}")
            
            result = self.download_brand_instagram_content(brand, use_login, username)
            self.results['brands'][brand] = result
            
            # Add delay between brands to avoid rate limiting
            time.sleep(10)  # Increased delay for better rate limiting
        
        # Save results
        self.save_results()
        
        # Print summary
        self.print_summary()
        
        return self.results
    
    def save_results(self):
        """Save download results to files"""
        # Save as JSON
        json_file = 'instagram_download_results.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_file = 'instagram_download_results.csv'
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Brand', 'Instagram Handle', 'Success', 'Command Used', 'Error', 'Output'])
            
            for brand_data in self.results['brands'].values():
                writer.writerow([
                    brand_data['brand'],
                    brand_data['instagram_handle'],
                    brand_data['success'],
                    brand_data['command_used'],
                    brand_data.get('error', ''),
                    brand_data.get('output', '')[:500]  # Truncate long output
                ])
        
        logging.info(f"Results saved to {json_file} and {csv_file}")
    
    def print_summary(self):
        """Print a summary of the download results"""
        print("\n" + "=" * 60)
        print("INSTAGRAM DOWNLOAD COMPLETE - SUMMARY")
        print("=" * 60)
        
        successful_brands = 0
        failed_brands = 0
        login_required_brands = 0
        
        for brand_data in self.results['brands'].values():
            if brand_data['success']:
                successful_brands += 1
            elif "Login required" in brand_data.get('error', ''):
                login_required_brands += 1
            else:
                failed_brands += 1
        
        print(f"Total brands processed: {len(self.results['brands'])}")
        print(f"Successful downloads: {successful_brands}")
        print(f"Login required: {login_required_brands}")
        print(f"Failed downloads: {failed_brands}")
        print(f"Success rate: {successful_brands/len(self.results['brands'])*100:.1f}%")
        
        # Show failed brands
        if failed_brands > 0:
            print("\nFailed brands:")
            for brand_data in self.results['brands'].values():
                if not brand_data['success'] and "Login required" not in brand_data.get('error', ''):
                    print(f"  - {brand_data['brand']} (@{brand_data['instagram_handle']}): {brand_data.get('error', 'Unknown error')}")
        
        # Show login required brands
        if login_required_brands > 0:
            print(f"\nBrands requiring login for full content:")
            for brand_data in self.results['brands'].values():
                if "Login required" in brand_data.get('error', ''):
                    print(f"  - {brand_data['brand']} (@{brand_data['instagram_handle']})")
        
        print(f"\nContent saved to brand folders in 'downloads/' directory")
        print("=" * 60)

def main():
    """Main execution function"""
    downloader = InstagramDownloader()
    
    # Configuration - IMPORTANT: Set these for best results
    USE_LOGIN = True  # Set to True to use authentication
    USERNAME = 'Kedaar-NR'  # Your Instagram username
    
    print("Instagram Content Downloader using Instaloader CLI")
    print("=" * 60)
    print(f"Processing {len(downloader.lowheads_brands)} brands")
    
    if USE_LOGIN:
        print(f"Using login: {USERNAME}")
        print("This will download full content including posts, stories, etc.")
    else:
        print("Using public access (no login)")
        print("WARNING: This may get limited/cached content")
        print("For best results, set USE_LOGIN = True and provide your Instagram username")
    
    print("=" * 60)
    
    # Run the complete download
    results = downloader.run_complete_download(USE_LOGIN, USERNAME)
    
    print("\nInstagram content download completed!")
    print("Check the brand folders in 'downloads/' for Instagram content.")
    print("Check 'instagram_download_results.json' for detailed results.")
    
    return results

if __name__ == "__main__":
    main()
