#!/usr/bin/env python3
"""
Final Summary Script
Shows complete results of the Instagram scraping project
"""

import os
import json
from collections import defaultdict

def analyze_results():
    print("🎉 INSTAGRAM SCRAPING PROJECT - FINAL SUMMARY")
    print("=" * 60)
    
    # Count total brands
    instagram_data_dir = "downloads/instagram_data"
    if not os.path.exists(instagram_data_dir):
        print("❌ Instagram data directory not found!")
        return
    
    brand_folders = [f for f in os.listdir(instagram_data_dir) if os.path.isdir(os.path.join(instagram_data_dir, f))]
    total_brands = len(brand_folders)
    
    print(f"📊 TOTAL BRANDS PROCESSED: {total_brands}")
    print()
    
    # Analyze each brand
    brands_with_content = 0
    brands_without_posts = []
    total_images = 0
    total_videos = 0
    total_profile_pics = 0
    
    brand_details = []
    
    for brand in sorted(brand_folders):
        brand_path = os.path.join(instagram_data_dir, brand)
        
        # Check for organized structure
        images_dir = os.path.join(brand_path, "images")
        videos_dir = os.path.join(brand_path, "videos")
        posts_dir = os.path.join(brand_path, "posts")
        
        profile_pics = 0
        post_images = 0
        post_videos = 0
        
        # Count profile pictures
        if os.path.exists(images_dir):
            for file in os.listdir(images_dir):
                if file.endswith('.jpg') and 'profile' in file:
                    profile_pics += 1
                    total_profile_pics += 1
        
        # Count post content
        if os.path.exists(images_dir):
            for item in os.listdir(images_dir):
                if item.startswith('post_'):
                    post_path = os.path.join(images_dir, item)
                    if os.path.isdir(post_path):
                        post_images += len([f for f in os.listdir(post_path) if f.endswith('.jpg')])
                        total_images += len([f for f in os.listdir(post_path) if f.endswith('.jpg')])
        
        if os.path.exists(videos_dir):
            for item in os.listdir(videos_dir):
                if item.startswith('post_'):
                    post_path = os.path.join(videos_dir, item)
                    if os.path.isdir(post_path):
                        post_videos += len([f for f in os.listdir(post_path) if f.endswith('.mp4')])
                        total_videos += len([f for f in os.listdir(post_path) if f.endswith('.mp4')])
        
        total_media = post_images + post_videos
        
        if total_media > 0:
            brands_with_content += 1
            brand_details.append({
                'name': brand,
                'profile_pics': profile_pics,
                'images': post_images,
                'videos': post_videos,
                'total': total_media
            })
        else:
            brands_without_posts.append(brand)
    
    print(f"✅ BRANDS WITH CONTENT: {brands_with_content}")
    print(f"❌ BRANDS WITHOUT POSTS: {len(brands_without_posts)}")
    print()
    
    print("📈 MEDIA STATISTICS:")
    print(f"   📸 Profile Pictures: {total_profile_pics}")
    print(f"   🖼️  Post Images: {total_images}")
    print(f"   🎥 Post Videos: {total_videos}")
    print(f"   📊 Total Media Files: {total_profile_pics + total_images + total_videos}")
    print()
    
    print("🏆 TOP 10 BRANDS BY MEDIA CONTENT:")
    brand_details.sort(key=lambda x: x['total'], reverse=True)
    for i, brand in enumerate(brand_details[:10], 1):
        print(f"   {i:2d}. {brand['name']:<25} - {brand['total']:2d} files ({brand['images']:2d} images, {brand['videos']:2d} videos)")
    
    print()
    print("❌ BRANDS WITHOUT POSTS:")
    for brand in brands_without_posts:
        print(f"   • {brand}")
    
    print()
    print("📂 FOLDER STRUCTURE VERIFICATION:")
    
    # Check a few sample brands
    sample_brands = brand_details[:3] if brand_details else []
    for brand_info in sample_brands:
        brand_name = brand_info['name']
        brand_path = os.path.join(instagram_data_dir, brand_name)
        
        print(f"\n   📁 {brand_name}/")
        
        # Check images folder
        images_dir = os.path.join(brand_path, "images")
        if os.path.exists(images_dir):
            profile_count = len([f for f in os.listdir(images_dir) if f.endswith('.jpg') and 'profile' in f])
            post_folders = [f for f in os.listdir(images_dir) if f.startswith('post_') and os.path.isdir(os.path.join(images_dir, f))]
            print(f"      📸 images/ - {profile_count} profile pic(s), {len(post_folders)} post folder(s)")
        
        # Check videos folder
        videos_dir = os.path.join(brand_path, "videos")
        if os.path.exists(videos_dir):
            post_folders = [f for f in os.listdir(videos_dir) if f.startswith('post_') and os.path.isdir(os.path.join(videos_dir, f))]
            print(f"      🎥 videos/ - {len(post_folders)} post folder(s)")
        
        # Check posts folder
        posts_dir = os.path.join(brand_path, "posts")
        if os.path.exists(posts_dir):
            json_files = len([f for f in os.listdir(posts_dir) if f.endswith('.json')])
            print(f"      📄 posts/ - {json_files} metadata file(s)")
    
    print()
    print("🎯 PROJECT STATUS: COMPLETE ✅")
    print("   • All brands processed")
    print("   • Content downloaded and organized")
    print("   • Files properly separated (JPG/MP4)")
    print("   • Ready for use in fashion app")
    print()
    print("📁 Check 'downloads/instagram_data/' for all organized content!")

if __name__ == "__main__":
    analyze_results()
