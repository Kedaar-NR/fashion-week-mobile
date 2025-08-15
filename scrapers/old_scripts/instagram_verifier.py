#!/usr/bin/env python3
"""
Instagram Account Verifier
Checks which lowheads brands have Instagram accounts
"""

import requests
import time
import json
from urllib.parse import urlparse
import re

class InstagramVerifier:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.0; AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        # Lowheads brands
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
    
    def convert_brand_to_instagram_handle(self, brand: str) -> str:
        """Convert brand name to Instagram handle"""
        clean_name = brand.lower()
        clean_name = re.sub(r'[™®©]', '', clean_name)  # Remove trademark symbols
        clean_name = re.sub(r'[^\w\s-]', '', clean_name)  # Remove special chars except hyphen
        clean_name = re.sub(r'\s+', '', clean_name)  # Remove spaces
        clean_name = re.sub(r'-+', '', clean_name)  # Remove hyphens
        clean_name = clean_name.strip()
        return clean_name
    
    def check_instagram_account(self, handle: str) -> dict:
        """Check if an Instagram account exists"""
        url = f"https://www.instagram.com/{handle}/"
        
        try:
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                # Check if it's a real account or just a generic page
                if "Sorry, this page isn't available." in response.text:
                    return {
                        'handle': handle,
                        'exists': False,
                        'status': 'not_found'
                    }
                elif "This Account is Private" in response.text:
                    return {
                        'handle': handle,
                        'exists': True,
                        'status': 'private'
                    }
                else:
                    return {
                        'handle': handle,
                        'exists': True,
                        'status': 'public'
                    }
            elif response.status_code == 404:
                return {
                    'handle': handle,
                    'exists': False,
                    'status': 'not_found'
                }
            else:
                return {
                    'handle': handle,
                    'exists': False,
                    'status': f'error_{response.status_code}'
                }
                
        except Exception as e:
            return {
                'handle': handle,
                'exists': False,
                'status': f'error_{str(e)}'
            }
    
    def verify_all_brands(self):
        """Verify all lowheads brands"""
        results = []
        
        print(f"Verifying {len(self.lowheads_brands)} brands...")
        print("=" * 60)
        
        for i, brand in enumerate(self.lowheads_brands, 1):
            handle = self.convert_brand_to_instagram_handle(brand)
            
            if not handle:
                continue
                
            print(f"[{i}/{len(self.lowheads_brands)}] Checking: {brand} -> @{handle}")
            
            result = self.check_instagram_account(handle)
            result['original_brand'] = brand
            results.append(result)
            
            # Print result
            if result['exists']:
                print(f"  ✓ Found: {result['status']}")
            else:
                print(f"  ✗ Not found: {result['status']}")
            
            # Rate limiting
            time.sleep(1)
        
        # Save results
        with open('instagram_verification_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        # Print summary
        self.print_summary(results)
        
        return results
    
    def print_summary(self, results):
        """Print summary of verification results"""
        print("\n" + "=" * 60)
        print("VERIFICATION SUMMARY")
        print("=" * 60)
        
        total = len(results)
        found = len([r for r in results if r['exists']])
        public = len([r for r in results if r['status'] == 'public'])
        private = len([r for r in results if r['status'] == 'private'])
        not_found = len([r for r in results if r['status'] == 'not_found'])
        
        print(f"Total brands checked: {total}")
        print(f"Instagram accounts found: {found}")
        print(f"Public accounts: {public}")
        print(f"Private accounts: {private}")
        print(f"Not found: {not_found}")
        print(f"Success rate: {found/total*100:.1f}%")
        
        print("\nPublic Instagram accounts:")
        for result in results:
            if result['status'] == 'public':
                print(f"  - @{result['handle']} ({result['original_brand']})")
        
        print(f"\nResults saved to 'instagram_verification_results.json'")
        print("=" * 60)

def main():
    verifier = InstagramVerifier()
    results = verifier.verify_all_brands()
    return results

if __name__ == "__main__":
    main()
