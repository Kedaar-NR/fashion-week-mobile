#!/usr/bin/env python3

"""
Extract Shop Content Brands Script

This script scans the scrapers/downloads/shop_content directory and creates
a dictionary mapping original brand names to their sanitized versions.
Uses the same sanitization logic as the Supabase migration script.

The output is saved to scripts/shop_content_brands.txt
"""

import os
import re
import unicodedata
from pathlib import Path
from typing import Dict, List

def sanitize_key_component(component: str) -> str:
    """Sanitize a string component for use in Supabase Storage keys.
    
    This function matches the exact sanitization used in migrate_to_supabase_storage.py
    
    Removes accents, replaces spaces with underscores, and only allows
    safe characters: letters, numbers, dashes, underscores, dots.
    """
    # Normalize unicode and remove accents
    component = unicodedata.normalize('NFKD', component).encode('ASCII', 'ignore').decode()
    # Replace spaces with underscores
    component = component.replace(" ", "_")
    # Allow only safe characters: letters, numbers, dashes, underscores, dots
    component = re.sub(r"[^A-Za-z0-9._-]", "", component)
    return component

def scan_shop_content_brands() -> Dict[str, str]:
    """
    Scan the shop_content directory and return a dictionary mapping
    sanitized brand names to their original versions.
    
    Returns:
        Dict[str, str]: {sanitized_name: original_name}
    """
    # Get the project directory (parent of scripts)
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    shop_content_dir = project_dir / 'scrapers' / 'downloads' / 'shop_content'
    
    print(f"📂 Scanning shop content directory: {shop_content_dir}")
    
    if not shop_content_dir.exists():
        print(f"❌ Shop content directory not found: {shop_content_dir}")
        return {}
    
    if not shop_content_dir.is_dir():
        print(f"❌ Path is not a directory: {shop_content_dir}")
        return {}
    
    brand_mapping = {}
    total_folders = 0
    processed_folders = 0
    
    # Get all items in the shop_content directory
    try:
        items = list(shop_content_dir.iterdir())
        total_folders = len([item for item in items if item.is_dir()])
        print(f"📊 Found {total_folders} potential brand folders")
        
        for item in items:
            if item.is_dir():
                original_name = item.name
                sanitized_name = sanitize_key_component(original_name)
                
                brand_mapping[sanitized_name] = original_name
                processed_folders += 1
                
                # Show progress for every 10 folders or if names are different
                if processed_folders % 10 == 0 or original_name != sanitized_name:
                    print(f"  📁 [{processed_folders}/{total_folders}] {original_name}")
                    if original_name != sanitized_name:
                        print(f"    🧼 Sanitized: {original_name} → {sanitized_name}")
        
        print(f"✅ Successfully processed {processed_folders} brand folders")
        
    except PermissionError as e:
        print(f"❌ Permission error accessing directory: {e}")
        return {}
    except Exception as e:
        print(f"❌ Error scanning directory: {e}")
        return {}
    
    return brand_mapping

def create_brand_dictionary_output(brand_mapping: Dict[str, str]) -> str:
    """
    Create a formatted string representation of the brand dictionary.
    
    Args:
        brand_mapping: Dictionary of sanitized to original brand names
        
    Returns:
        str: Formatted dictionary string
    """
    if not brand_mapping:
        return "# No brands found\n{}"
    
    lines = [
        "# Shop Content Brands Dictionary",
        "# Generated from scrapers/downloads/shop_content folder structure",
        "# Format: {sanitized_name: original_name}",
        "",
        "shop_content_brands = {"
    ]
    
    # Sort brands alphabetically for consistent output
    sorted_brands = sorted(brand_mapping.items())
    
    for i, (sanitized, original) in enumerate(sorted_brands):
        # Add comma except for last item
        comma = "," if i < len(sorted_brands) - 1 else ""
        
        # Format with proper indentation and quotes
        if original == sanitized:
            lines.append(f'    "{sanitized}": "{original}"{comma}')
        else:
            lines.append(f'    "{sanitized}": "{original}"{comma}  # Original: {original}')
    
    lines.append("}")
    lines.append("")
    
    # Add summary statistics
    total_brands = len(brand_mapping)
    sanitized_brands = len([k for k, v in brand_mapping.items() if k != v])
    
    lines.extend([
        f"# Summary:",
        f"# Total brands: {total_brands}",
        f"# Brands requiring sanitization: {sanitized_brands}",
        f"# Brands with no changes: {total_brands - sanitized_brands}"
    ])
    
    return "\n".join(lines)

def save_brand_dictionary(content: str, output_file: Path) -> bool:
    """
    Save the brand dictionary content to a file.
    
    Args:
        content: The formatted dictionary content
        output_file: Path to save the file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"💾 Successfully saved brand dictionary to: {output_file}")
        print(f"📄 File size: {output_file.stat().st_size} bytes")
        return True
        
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return False

def main():
    """Main function to orchestrate the brand extraction process."""
    print("🚀 Starting shop content brand extraction...")
    print("=" * 60)
    
    # Scan for brands
    brand_mapping = scan_shop_content_brands()
    
    if not brand_mapping:
        print("❌ No brands found. Exiting.")
        return
    
    # Create output content
    print("\n📝 Creating dictionary output...")
    content = create_brand_dictionary_output(brand_mapping)
    
    # Save to file
    script_dir = Path(__file__).parent
    output_file = script_dir / 'shop_content_brands.txt'
    
    print(f"\n💾 Saving to: {output_file}")
    
    success = save_brand_dictionary(content, output_file)
    
    if success:
        print("\n✅ Brand extraction completed successfully!")
        print(f"📋 Found {len(brand_mapping)} brands")
        print(f"📄 Output saved to: {output_file}")
        
        # Show a few examples
        if brand_mapping:
            print("\n📋 Sample entries:")
            sample_items = list(brand_mapping.items())[:5]
            for sanitized, original in sample_items:
                if original == sanitized:
                    print(f"  • {sanitized}")
                else:
                    print(f"  • {sanitized} ← {original}")
            
            if len(brand_mapping) > 5:
                print(f"  ... and {len(brand_mapping) - 5} more")
    else:
        print("\n❌ Brand extraction failed!")

if __name__ == "__main__":
    main()
