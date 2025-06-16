import sys
import os

# Add the parent directory to the Python path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'economy_models')))

from scraper import WebScraper
from osrs_parser import OSRSWikiParser

def test_dragon_scimitar_parsing():
    print("Fetching Dragon scimitar wiki page...")
    scraper = WebScraper()
    # Using the direct OSRS Wiki URL for fetching
    url = "https://oldschool.runescape.wiki/w/Dragon_scimitar"
    html_content = scraper.fetch(url)

    if html_content:
        print("Successfully fetched HTML content. Parsing...")
        parser = OSRSWikiParser(html_content)
        parsed_data = parser.parse_dragon_scimitar()
        import json
        print("Parsed Data:")
        print(json.dumps(parsed_data, indent=2))
    else:
        print("Failed to fetch HTML content for Dragon scimitar.")

if __name__ == '__main__':
    test_dragon_scimitar_parsing()
