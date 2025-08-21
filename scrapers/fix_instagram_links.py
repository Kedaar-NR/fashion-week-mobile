#!/usr/bin/env python3
"""
Fix Instagram Links Script
Updates the brands-list.md file with correct Instagram links
"""

import re

def fix_instagram_links():
    # Read the current brands list
    with open('downloads/brands-list.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Define the fixes needed
    fixes = {
        'BAGJIO': 'https://www.instagram.com/bagjio_/?hl=en',
        'BANISHEDUSA': 'https://www.instagram.com/banishedusa/?hl=en',
        'CHEATIN SNAKES WORLDWIDE': 'https://www.instagram.com/cheatinsnakes/?hl=en',
        'HAVEYOUDIEDBEFORE': 'https://www.instagram.com/haveyoudiedbefore/',
        'HEAVROLET': 'https://www.instagram.com/heavrolet/?hl=en',
        'HUBANE': 'https://www.instagram.com/hubane_/',
        'IDIEDLASTNIGHT': 'https://www.instagram.com/idiedlastnightt/?hl=en',
        'JACKJOHNJR': 'https://www.instagram.com/jackjohnjr/?hl=en',
        'JAXON JET': 'https://www.instagram.com/jaxonjet7/',
        'LOSE RELIGION': 'https://www.instagram.com/lostreligionofficial/?hl=en',
        'LUXENBURG': 'https://www.instagram.com/luxenburg___________/?hl=en',
        'MILES FRANKLIN': 'https://www.instagram.com/milesfrankl1n/',
        'WORSHIP': 'https://www.instagram.com/worship95/',
        'YAMI MIYAZAKI': 'https://www.instagram.com/yami.miyazaki/?hl=en'
    }
    
    # Apply fixes
    for brand, new_url in fixes.items():
        # Find the line with the brand
        pattern = rf'- \*\*{re.escape(brand)}\*\* - \[Instagram\]\([^)]+\)'
        replacement = f'- **{brand}** - [Instagram]({new_url})'
        
        # Also handle cases where it says "No official Instagram link found"
        no_link_pattern = rf'- \*\*{re.escape(brand)}\*\* - No official Instagram link found'
        no_link_replacement = f'- **{brand}** - [Instagram]({new_url})'
        
        # Apply the replacement
        content = re.sub(pattern, replacement, content)
        content = re.sub(no_link_pattern, no_link_replacement, content)
        
        # Handle "No specific Instagram link found"
        no_specific_pattern = rf'- \*\*{re.escape(brand)}\*\* - No specific Instagram link found for this brand'
        no_specific_replacement = f'- **{brand}** - [Instagram]({new_url})'
        content = re.sub(no_specific_pattern, no_specific_replacement, content)
    
    # Write the updated content back
    with open('downloads/brands-list.md', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Updated Instagram links for problematic brands!")

if __name__ == "__main__":
    fix_instagram_links()
