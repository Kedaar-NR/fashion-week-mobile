# #!/usr/bin/env python3

# import requests
# import pandas as pd
# import time
# import re
# from typing import List, Dict, Optional
# from bs4 import BeautifulSoup
# import json

# BRANDS = [
#     "2001odysey",
#     "22kilogram",
#     "aliasonline.us",
#     "allure.newyork",
#     "alreadywritten",
#     "angel333online",
#     "ArtificialFever",
#     "astonecoldstudiosproduction",
#     "attachmentsonline",
#     "awaitedmilitia",
#     "badson.us",
#     "berlinc.co",
#     "blanksbythirteen",
#     "bomiworks",
#     "brotherlylove",
#     "byjeshal",
#     "bykodyphillips",
#     "california.arts",
#     "chinatowncountryclub",
#     "chxmicalover",
#     "concrete_orchids",
#     "corporateworld",
#     "cozy.worldwidee",
#     "cyvist",
#     "deadatlantic",
#     "demiknj",
#     "derschutze_clo",
#     "ditch",
#     "drolandmiller",
#     "emestudios_",
#     "emptyspaces",
#     "eraworldwideclub",
#     "eternal_artwear",
#     "eternalloveworld",
#     "fine.culture",
#     "fnkstudios",
#     "forcesunseen",
#     "forevakaash",
#     "fortytwoco",
#     "fourfour.jpg",
#     "friedrice_nyc",
#     "haveyoudiedbefore",
#     "__heavencanwait__",
#     "heavenonearthstudios",
#     "hidden.season",
#     "hypedept.co",
#     "iconaclub",
#     "idle____time",
#     "ihp.ihp.ihp",
#     "insain.worldwide",
#     "kinejkt",
#     "kontend__",
#     "kyonijr",
#     "lantiki_official",
#     "lildenimjean",
#     "liquidlagoon",
#     "maharishi",
#     "menacelosangeles",
#     "misanthropestudios",
#     "Mutimer.co",
#     "nihil.ny",
#     "nomaintenance",
#     "oedemaa",
#     "omneeworld",
#     "outlw.usa",
#     "paradoxeparis",
#     "pdf.channel",
#     "peaceandwar89",
#     "personalfears",
#     "poolhousenewyork",
#     "profitminded.clo",
#     "qbsay",
#     "rangercartel",
#     "rdvstudios",
#     "roypubliclabel",
#     "saeminium",
#     "sensorydept",
#     "septemberseventhstudios",
#     "shineluxurystudios",
#     "shmuie",
#     "sixshooter.us",
#     "slovakiandreams",
#     "somar.us",
#     "srrysora",
#     "ssstufff.official",
#     "stolenarts_",
#     "sundae.school",
#     "thegvgallery",
#     "throneroomx",
#     "vega9602k",
#     "vengeance_studios",
#     "vicinity_de",
#     "winterhouse__",
#     "youngchickenpox",
# ]

# class InstagramScraper:
#     def __init__(self):
#         self.session = requests.Session()
#         self.session.headers.update({
#             'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
#             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
#             'Accept-Language': 'en-US,en;q=0.5',
#             'Accept-Encoding': 'gzip, deflate',
#             'Connection': 'keep-alive',
#             'Upgrade-Insecure-Requests': '1',
#         })
    
#     def get_instagram_description(self, brand: str) -> Optional[str]:
#         """
#         Scrape Instagram description/bio for a brand
#         """
#         url = f"https://www.instagram.com/{brand}/"
        
#         try:
#             response = self.session.get(url, timeout=15)
#             response.raise_for_status()
            
#             soup = BeautifulSoup(response.text, 'html.parser')
            
#             # Try to find the biography
#             bio = self._extract_bio_from_html(soup)
            
#             if bio and bio.strip():
#                 return bio.strip()
            
#             # Fallback: look for any text that might be the bio
#             page_text = response.text
            
#             # Look for common Instagram bio patterns in the raw HTML
#             bio_indicators = [
#                 f'"{brand}"',
#                 '"full_name"',
#                 '"biography"'
#             ]
            
#             # Try regex patterns for bio extraction
#             patterns = [
#                 r'"biography":"([^"]*)"',
#                 r'biography&quot;:&quot;([^&]*?)&quot;',
#                 r'"bio":"([^"]*)"',
#                 r'fullName":"([^"]*)"'
#             ]
            
#             for pattern in patterns:
#                 matches = re.findall(pattern, page_text)
#                 if matches:
#                     for match in matches:
#                         if match and match.strip() and len(match) > 1:
#                             # Clean up the match
#                             bio = match.replace('\\n', '\n').replace('\\t', ' ')
#                             bio = bio.encode().decode('unicode_escape')
#                             return bio.strip()
            
#             # Last resort: check if profile exists but has no bio
#             if 'instagram.com' in response.url and response.status_code == 200:
#                 if any(indicator in page_text for indicator in ['"is_private"', '"username"', '"profile_pic_url"']):
#                     return "No bio set"
#                 else:
#                     return "Profile not found"
            
#             return "No description found"
            
#         except requests.RequestException as e:
#             print(f"Network error fetching {brand}: {e}")
#             return "Network error"
#         except Exception as e:
#             print(f"Error parsing {brand}: {e}")
#             return "Parsing error"
    
#     def _extract_bio_from_html(self, soup) -> Optional[str]:
#         """
#         Extract biography from HTML using various methods
#         """
#         # Method 1: Look for JSON data in script tags (most reliable)
#         scripts = soup.find_all('script')
#         for script in scripts:
#             if script.string and '"biography"' in script.string:
#                 try:
#                     # Look for biography in JSON structure
#                     text = script.string
#                     if '"biography":"' in text:
#                         start = text.find('"biography":"') + len('"biography":"')
#                         end = text.find('"', start)
#                         bio = text[start:end]
#                         if bio and bio != "":
#                             # Decode unicode escapes
#                             bio = bio.encode().decode('unicode_escape')
#                             return bio
#                 except:
#                     continue
        
#         # Method 2: Look for window._sharedData
#         for script in scripts:
#             if script.string and 'window._sharedData' in script.string:
#                 try:
#                     json_str = script.string.split('window._sharedData = ')[1].split(';</script>')[0]
#                     data = json.loads(json_str)
                    
#                     if 'entry_data' in data and 'ProfilePage' in data['entry_data']:
#                         profile_data = data['entry_data']['ProfilePage'][0]
#                         if 'graphql' in profile_data and 'user' in profile_data['graphql']:
#                             user_data = profile_data['graphql']['user']
#                             if 'biography' in user_data:
#                                 return user_data['biography']
#                 except:
#                     continue
        
#         # Method 3: Look for specific patterns in HTML
#         # Search for bio text patterns
#         bio_patterns = [
#             r'"biography":"([^"]*)"',
#             r'biography&quot;:&quot;([^&]*?)&quot;',
#             r'"bio":"([^"]*)"'
#         ]
        
#         page_text = str(soup)
#         for pattern in bio_patterns:
#             matches = re.findall(pattern, page_text)
#             if matches:
#                 bio = matches[0]
#                 if bio and bio != "":
#                     # Decode unicode escapes and HTML entities
#                     bio = bio.encode().decode('unicode_escape')
#                     bio = bio.replace('\\n', '\n').replace('\\t', '\t')
#                     return bio
        
#         # Method 4: Look for meta description and parse it
#         meta_tags = [
#             soup.find('meta', {'property': 'og:description'}),
#             soup.find('meta', {'name': 'description'}),
#         ]
        
#         for meta in meta_tags:
#             if meta and meta.get('content'):
#                 content = meta['content']
#                 # Instagram meta format: "See photos and videos from Brand (@brand)"
#                 # Or: "X Followers, Y Following, Z Posts - Bio text"
#                 if ' - ' in content:
#                     parts = content.split(' - ')
#                     if len(parts) > 1:
#                         bio = parts[-1].strip()
#                         if bio and not bio.startswith('See '):
#                             return bio
#                 elif 'Followers' in content and 'Following' in content:
#                     # Try to extract from follower format
#                     if '"' in content:
#                         parts = content.split('"')
#                         for part in parts:
#                             if part.strip() and not any(word in part for word in ['Followers', 'Following', 'Posts', 'See']):
#                                 return part.strip()
        
#         return None
    
#     def scrape_all_brands(self) -> List[Dict[str, str]]:
#         """
#         Scrape all brands and return results
#         """
#         results = []
        
#         for i, brand in enumerate(BRANDS, 1):
#             print(f"[{i}/{len(BRANDS)}] Scraping @{brand}...")
            
#             description = self.get_instagram_description(brand)
            
#             results.append({
#                 'Brand': brand,
#                 'Instagram Handle': f"@{brand}",
#                 'Instagram URL': f"https://www.instagram.com/{brand}/",
#                 'Description': description
#             })
            
#             # Rate limiting
#             time.sleep(2)
        
#         return results
    
#     def save_to_csv(self, results: List[Dict[str, str]], filename: str = "instagram_brands.csv"):
#         """
#         Save results to CSV file
#         """
#         df = pd.DataFrame(results)
#         df.to_csv(filename, index=False)
#         print(f"Results saved to {filename}")
#         return df
    
#     def save_to_excel(self, results: List[Dict[str, str]], filename: str = "instagram_brands.xlsx"):
#         """
#         Save results to Excel file
#         """
#         df = pd.DataFrame(results)
#         with pd.ExcelWriter(filename, engine='openpyxl') as writer:
#             df.to_excel(writer, sheet_name='Instagram Brands', index=False)
            
#             # Auto-adjust column widths
#             worksheet = writer.sheets['Instagram Brands']
#             for column in worksheet.columns:
#                 max_length = 0
#                 column_letter = column[0].column_letter
#                 for cell in column:
#                     try:
#                         if len(str(cell.value)) > max_length:
#                             max_length = len(str(cell.value))
#                     except:
#                         pass
#                 adjusted_width = min(max_length + 2, 50)
#                 worksheet.column_dimensions[column_letter].width = adjusted_width
        
#         print(f"Results saved to {filename}")
#         return df

# def main():
#     scraper = InstagramScraper()
    
#     print(f"Starting Instagram scraping for {len(BRANDS)} brands...")
#     print("This may take several minutes due to rate limiting...")
    
#     results = scraper.scrape_all_brands()
    
#     # Save results
#     df = scraper.save_to_csv(results)
#     scraper.save_to_excel(results)
    
#     # Display summary
#     print(f"\nScraping complete!")
#     print(f"Total brands: {len(results)}")
#     print(f"Successful descriptions: {len([r for r in results if r['Description'] not in ['Error fetching', 'Error parsing', 'No description found']])}")
    
#     # Display first few results
#     print("\nFirst 10 results:")
#     print(df.head(10).to_string(index=False))
    
#     return results

# if __name__ == "__main__":
#     main()