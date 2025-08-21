# Instagram Scraper for Fashion Brands

This repository contains scripts to scrape Instagram content from fashion brands and organize the downloaded media files.

## 📁 Current Folder Structure

```
scrapers/
├── downloads/
│   ├── shop_content/          # Original brand folders with shop content
│   ├── instagram_data/        # Instagram scraped content (organized)
│   └── brands-list.md         # Complete list of brands with Instagram links
```

## 🎯 What Was Accomplished

### ✅ Successfully Completed:
1. **Brand Discovery**: Found and catalogued 174+ fashion brands
2. **Instagram Link Collection**: Gathered Instagram links for 165+ brands
3. **Content Download**: Downloaded Instagram content for 164 brands
4. **Content Organization**: Organized all brands with proper folder structure

### 📊 Current Statistics:
- **Total Brands**: 174
- **Brands with Instagram Links**: 165
- **Brands with Downloaded Content**: 164
- **Success Rate**: 94.3%

## 📂 Instagram Data Organization

Each brand folder in `instagram_data/` now follows this structure:
```
BrandName/
├── images/
│   ├── username_profile_hd.jpg    # Profile picture
│   ├── post_1/                    # Images from post 1
│   │   ├── image_1.jpg
│   │   ├── image_2.jpg
│   │   └── ...
│   ├── post_2/                    # Images from post 2
│   └── ...
├── videos/
│   ├── post_1/                    # Videos from post 1
│   │   ├── video_1.mp4
│   │   └── ...
│   ├── post_2/                    # Videos from post 2
│   └── ...
├── posts/                         # Post metadata
│   ├── post_1_data.json
│   ├── post_2_data.json
│   └── ...
├── user_info.json                 # Brand profile information
└── brand_info.json               # Additional brand data
```

## 🔧 Scripts Overview

### 1. **instagram_link_finder.py** ✅
- **Purpose**: Automatically finds Instagram links for brands via Google search
- **Status**: Working
- **Runner**: `run_instagram_finder.sh`

### 2. **full_instagram_scraper.py** ✅
- **Purpose**: Downloads Instagram content for ALL brands
- **Status**: Working (164/174 brands successful)
- **Runner**: `run_full_scraper.sh`

### 3. **organize_all_brands.py** ✅
- **Purpose**: Organizes all downloaded content into proper folder structure
- **Status**: Working
- **Features**: Separates JPG and MP4 files, organizes by post

### 4. **fix_instagram_links.py** ✅
- **Purpose**: Updates brands-list.md with correct Instagram links
- **Status**: Working

## 🚫 Brands Without Posts (10 brands)

The following brands have profile pictures but no downloadable posts (likely private accounts or no recent posts):

1. **BAGJIO** - @bagjio_
2. **BANISHEDUSA** - @banishedusa  
3. **CHEATIN SNAKES WORLDWIDE** - @cheatinsnakes
4. **HAVEYOUDIEDBEFORE** - @haveyoudiedbefore
5. **HEAVROLET** - @heavrolet
6. **HUBANE** - @hubane_
7. **IDIEDLASTNIGHT** - @idiedlastnightt
8. **JACKJOHNJR** - @jackjohnjr
9. **JAXON JET** - @jaxonjet7
10. **MILES FRANKLIN** - @milesfrankl1n

## 🎉 Successfully Working Brands (Examples)

Brands with full content including images and videos:
- **LOSE RELIGION** - 12 media files (1 video, 11 images)
- **LUXENBURG** - 30 media files (all images)
- **WORSHIP** - 13 media files (3 videos, 10 images)
- **YAMI MIYAZAKI** - 21 media files (1 video, 20 images)

## 🛠️ Installation & Setup

1. **Create Virtual Environment**:
   ```bash
   python3 -m venv instagram_finder_env
   source instagram_finder_env/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements_instagram_finder.txt
   ```

3. **Run Scripts**:
   ```bash
   # Download all Instagram content
   ./run_full_scraper.sh
   
   # Organize all content
   python organize_all_brands.py
   ```

## 📋 Requirements

- Python 3.7+
- requests
- beautifulsoup4
- lxml

## ⚠️ Important Notes

1. **Instagram Restrictions**: Instagram has strict anti-scraping measures. The scraper uses mobile API endpoints to bypass some restrictions.

2. **Rate Limiting**: The scraper includes delays between requests to avoid being blocked.

3. **Private Accounts**: Some brands may have private Instagram accounts, making content inaccessible.

4. **Content Availability**: Not all brands have recent posts or public content available.

## 🔍 Troubleshooting

### Common Issues:
1. **"Error getting posts"**: Usually means the account is private or has no recent posts
2. **"Error downloading"**: Network issues or temporary Instagram restrictions
3. **Empty folders**: Brand may not have public content

### Solutions:
- Wait and retry later
- Check if the Instagram account is public
- Verify the Instagram username is correct

## 📈 Results Summary

- **Total Media Files Downloaded**: 2,000+ images and videos
- **Profile Pictures**: 164 HD profile pictures
- **Post Content**: 6 recent posts per brand (when available)
- **Organization**: All content properly separated by type (JPG/MP4) and post

## 🎯 Next Steps

The Instagram scraping project is now complete with:
- ✅ All brands catalogued
- ✅ Instagram links collected
- ✅ Content downloaded
- ✅ Files organized properly
- ✅ Documentation updated

The `instagram_data` folder now contains a comprehensive collection of fashion brand Instagram content, properly organized and ready for use.
