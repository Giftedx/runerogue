"""OSRS Wiki Parser Module

This module provides tools for fetching and parsing data from the Old School RuneScape Wiki.
It includes functions and classes for retrieving item information, parsing infoboxes,
and extracting structured data from wiki pages.

The module supports:
- Fetching wiki pages for items, NPCs, and other game entities
- Parsing infoboxes to extract structured data
- Extracting combat stats, equipment requirements, and other game-specific information
- Error handling and logging for robust operation

Typical usage:
    ```python
    # Fetch data for an item
    wiki_data = fetch_wiki_data("Dragon scimitar")
    
    # Parse HTML content
    parser = OSRSWikiParser(html_content)
    item_data = parser.parse_item_infobox()
    ```

This module is a core component of the RuneRogue economy system, providing
accurate game data for item pricing, combat calculations, and game mechanics.
"""

import requests
import json
from bs4 import BeautifulSoup, Tag, NavigableString
from typing import Dict, Any, Optional, cast, List, Union
import logging
from bs4.element import PageElement, ResultSet

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OSRS_WIKI_BASE_URL = "https://oldschool.runescape.wiki/w/"

def fetch_wiki_data(query: str) -> str:
    """
    A robust tool for fetching data from the OSRS Wiki.
    
    Args:
        query: The item, NPC, or topic to search for.
        
    Returns:
        A string containing the extracted data or an error message.
    """
    logger.info(f"Fetching data for: {query}")
    
    # Sanitize query for URL
    url_query = query.replace(' ', '_')
    url = f"{OSRS_WIKI_BASE_URL}{url_query}"
    
    try:
        # Set a user agent to avoid being blocked
        headers = {
            'User-Agent': 'RuneRogue/1.0 (https://github.com/Giftedx/runerogue; contact@example.com)'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()  # Raise HTTP errors
        
        # Check if we got a valid HTML response
        if 'text/html' not in response.headers.get('content-type', ''):
            return f"Unexpected content type: {response.headers.get('content-type')}"
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try to find the main infobox, which is common on item/NPC pages
        infobox = soup.find('table', class_='infobox')
        if infobox and isinstance(infobox, Tag):
            # Extract structured data from infobox
            data: Dict[str, Any] = {}
            rows: ResultSet[Any] = infobox.find_all('tr')
            
            for row in rows:
                if not isinstance(row, Tag):
                    continue
                    
                header = row.find('th')
                data_cell = row.find('td')
                
                if isinstance(header, Tag) and isinstance(data_cell, Tag):
                    key = header.get_text(strip=True).lower().replace(' ', '_')
                    value = data_cell.get_text(' | ', strip=True)
                    data[key] = value
            
            if data:
                return json.dumps(data, indent=2)
        
        # Fallback: Get the first few paragraphs of content
        content_div = soup.find('div', id='mw-content-text')
        if content_div and isinstance(content_div, Tag):
            paragraphs = content_div.find_all('p', recursive=False, limit=3)
            if paragraphs:
                content_parts: List[str] = []
                for p in paragraphs:
                    if isinstance(p, Tag) and hasattr(p, 'get_text') and callable(p.get_text):
                        content_parts.append(p.get_text(strip=True))
                if content_parts:
                    return json.dumps({"content": '\n\n'.join(content_parts)})
        
        # Extract the first paragraph as a fallback
        first_paragraph = soup.find('p')
        if first_paragraph and hasattr(first_paragraph, 'get_text') and callable(first_paragraph.get_text):
            try:
                paragraph_text = first_paragraph.get_text(strip=True)
                title = 'No title found'
                if soup and hasattr(soup, 'title') and soup.title and hasattr(soup.title, 'string') and soup.title.string:
                    title = soup.title.string
                
                return json.dumps({
                    'title': title,
                    'content': paragraph_text
                }, indent=2)
            except Exception as e:
                logger.error(f"Error extracting text: {e}")
        
        # Final fallback if no content could be extracted
        return json.dumps({
            'title': 'No title found',
            'content': f"Could not extract content for '{query}'"
        }, indent=2)
        
    except requests.exceptions.HTTPError as http_err:
        status_code = http_err.response.status_code if hasattr(http_err, 'response') else 'unknown'
        logger.error(f"HTTP {status_code} error for '{query}': {http_err}")
        return f"HTTP {status_code} error: {str(http_err)}"
        
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Request error for '{query}': {req_err}")
        return f"Network error: {str(req_err)}"
        
    except Exception as e:
        logger.exception(f"Unexpected error processing '{query}'")
        return f"An unexpected error occurred: {str(e)}"

from bs4 import BeautifulSoup, Tag # Import Tag
from typing import Dict, Any, Optional, cast # Import cast

class OSRSWikiParser:
    """Parser for Old School RuneScape Wiki HTML content.
    
    This class provides methods to parse HTML content from the OSRS Wiki and extract
    structured data about items, NPCs, and other game entities. It handles complex
    parsing of infoboxes, combat stats, equipment requirements, and other game-specific
    information.
    
    The parser is designed to be robust against HTML structure changes and includes
    debugging capabilities for troubleshooting parsing issues.
    
    Attributes:
        _raw_html_content (str): The raw HTML content being parsed
        soup (BeautifulSoup): Parsed BeautifulSoup object for HTML traversal
    """
    
    def __init__(self, html_content: str):
        """Initialize the parser with HTML content.
        
        Args:
            html_content: Raw HTML content from the OSRS Wiki
        """
        self._raw_html_content = html_content # Store raw HTML content
        self.soup = BeautifulSoup(html_content, 'html.parser')

    def save_html_for_debug(self, html_content: str, filename: str = 'debug_osrs_page.html') -> None:
        """Saves the raw HTML content to a file for debugging.
        
        Args:
            html_content: The HTML content to save
            filename: The filename to save to
        """
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)

    def parse_item_infobox(self) -> Dict[str, Any]:
        """Parse the item infobox from the HTML content.
        
        Returns:
            A dictionary containing the parsed item data
        """
        self.save_html_for_debug(self._raw_html_content)  # Save HTML for debugging
        item_data: Dict[str, Any] = {}
        infobox = self.soup.find('table', class_='infobox-item')
        if not isinstance(infobox, Tag):
            return item_data

        # Extract general properties
        rows = infobox.find_all('tr')
        for row in rows:
            if not isinstance(row, Tag):
                continue
                
            header = row.find('th')
            data = row.find('td')
            
            if isinstance(header, Tag) and isinstance(data, Tag):
                key = header.get_text(strip=True).replace(' ', '_').lower()
                value = data.get_text(strip=True)
                item_data[key] = value
        
        # Extract combat bonuses
        item_data['combat_bonuses'] = {}
        combat_bonus_table = self.soup.find('table', class_='infobox-bonuses')
        
        if isinstance(combat_bonus_table, Tag):
            print("Debug: Combat bonus table found.")
            combat_bonuses: Dict[str, str] = {}
            
            # Find all infobox-subheader elements within the combat bonus table
            subheaders = combat_bonus_table.find_all('th', class_='infobox-subheader')

            for header in subheaders:
                if not isinstance(header, Tag):
                    continue
                    
                header_text = header.get_text(strip=True)
                if 'Attack bonuses' in header_text:
                    print("Debug: Attack bonuses header found.")
                    # Get the parent tr of the header
                    parent_row = header.find_parent('tr')
                    if isinstance(parent_row, Tag):
                        # Find all data cells in this row
                        data_cells = parent_row.find_all('td')
                        if data_cells and len(data_cells) > 1:
                            # Assuming the first cell is the label, second is the value
                            bonus_name = data_cells[0].get_text(strip=True).lower()
                            bonus_value = data_cells[1].get_text(strip=True)
                            combat_bonuses[bonus_name] = bonus_value
            
            if combat_bonuses:  # Only add if we found any bonuses
                item_data['combat_bonuses'] = combat_bonuses
            item_data['combat_bonuses'] = combat_bonuses
        else:
            print("Debug: Combat bonus table NOT found.")

        # Extract equipment requirements
        item_data['requirements'] = {}
        found_requirements_header = False
        for th_tag in infobox.find_all('th'): # type: ignore
            if th_tag.get_text(strip=True) == 'Equipment requirements':
                print("Debug: 'Equipment requirements' header found.")
                found_requirements_header = True
                req_td: Optional[Tag] = th_tag.find_next_sibling('td') # type: ignore
                if req_td:
                    print(f"Debug: Requirements TD found: {req_td}")
                    req_list: Optional[Tag] = req_td.find('ul') # type: ignore
                    if req_list:
                        print(f"Debug: Requirements UL found: {req_list}")
                        for li in req_list.find_all('li'): # type: ignore
                            text = li.get_text(strip=True)
                            parts = text.split(' ', 1)
                            if len(parts) == 2 and parts[0].isdigit():
                                level = int(parts[0])
                                skill = parts[1].lower().replace(' ', '_')
                                item_data['requirements'][skill] = level
                    else:
                        print("Debug: Requirements UL NOT found.")
                else:
                    print("Debug: Requirements TD NOT found.")
                break
        if not found_requirements_header:
            print("Debug: 'Equipment requirements' header NOT found in infobox.") # Found requirements, no need to continue searching th tags

        # Extract attack speed
        item_data['attack_speed'] = None
        combat_styles_table: Optional[Tag] = self.soup.find('table', class_='wikitable combat-styles') # type: ignore
        if combat_styles_table:
            print("Debug: Combat styles table found.")
            # Find the header for 'Attack speed'
            attack_speed_header = combat_styles_table.find('th', string=lambda text: text and 'Attack speed' in text) # type: ignore
            if attack_speed_header:
                print("Debug: Attack speed header found.")
                # The attack speed value is in the <td> that is a sibling of the <th>'s parent <tr>
                # and has rowspan. We need to find the correct td by its position relative to the header.
                # In the Dragon Scimitar HTML, it's the 5th <th> in the header row, and the corresponding
                # <td> in the first data row has the rowspan.
                header_row = attack_speed_header.find_parent('tr') # type: ignore
                if header_row:
                    # Find the index of the 'Attack speed' header and calculate the corresponding td index
                    headers = header_row.find_all('th') # type: ignore
                    header_index = -1
                    td_target_index = -1
                    current_td_offset = 0

                    for i, th in enumerate(headers):
                        if 'Attack speed' in th.get_text(strip=True):
                            header_index = i
                            td_target_index = current_td_offset
                            break
                        
                        if isinstance(th, Tag):
                            colspan_str = th.get('colspan')
                            if colspan_str and isinstance(colspan_str, str) and colspan_str.isdigit():
                                current_td_offset += int(colspan_str)
                            else:
                                current_td_offset += 1
                        else:
                            current_td_offset += 1 # Treat non-Tag elements as single column

                    if td_target_index != -1:
                        # Get the first data row (after the header row)
                        first_data_row = header_row.find_next_sibling('tr') # type: ignore
                        if first_data_row:
                            cells = first_data_row.find_all('td') # type: ignore
                            # The attack speed cell is at the calculated td_target_index
                            if len(cells) > td_target_index:
                                attack_speed_cell = cells[td_target_index]
                                item_data['attack_speed'] = attack_speed_cell.get_text(strip=True)
                                print(f"Debug: Attack speed extracted: {item_data['attack_speed']}")
                            else:
                                print("Debug: Attack speed cell NOT found in data row.")
                        else:
                            print("Debug: First data row NOT found.")
                    else:
                        print("Debug: Attack speed header index NOT found.")
                else:
                    print("Debug: Header row for combat styles NOT found.")
            else:
                print("Debug: Attack speed header NOT found.")
        else:
            print("Debug: Combat styles table NOT found.")

        return item_data

    def parse_dragon_scimitar(self) -> Dict[str, Any]:
        """Parse Dragon Scimitar specific data from the wiki page.
        
        This is a specialized parser for the Dragon Scimitar item, which uses the
        general infobox parser and then adds specific overrides or extractions
        for this particular item.
        
        Returns:
            A dictionary containing parsed data for the Dragon Scimitar
        """
        data = self.parse_item_infobox()
        
        # Safely extract the item name with proper type checking
        infobox_header = self.soup.find('th', class_='infobox-header')
        if infobox_header and isinstance(infobox_header, Tag):
            data['item_name'] = infobox_header.get_text(strip=True)
        else:
            data['item_name'] = 'Unknown'
            
        return data

# Example Usage (for testing purposes)
if __name__ == '__main__':
    # This HTML content would come from scraper.py's fetch method
    # For demonstration, using a placeholder. In reality, you'd pass the actual HTML.
    sample_html = """
    <div class="mw-parser-output">
        <table class="infobox no-parenthesis-style infobox-item">
            <tbody>
                <tr><th colspan="20" class="infobox-header">Dragon scimitar</th></tr>
                <tr><th colspan="7">Released</th><td colspan="13">29 March 2005 (Update)</td></tr>
                <tr><th colspan="7">Members</th><td colspan="13">Yes</td></tr>
                <tr><th colspan="7">Quest item</th><td colspan="13">No</td></tr>
                <tr><th colspan="7">Tradeable</th><td colspan="13">Yes</td></tr>
                <tr><th colspan="7">Equipable</th><td colspan="13">Yes</td></tr>
                <tr><th colspan="7">Stackable</th><td colspan="13">No</td></tr>
                <tr><th colspan="7">Noteable</th><td colspan="13">Yes</td></tr>
                <tr><th colspan="20" class="infobox-subheader">Combat bonuses</th></tr>
                <tr><td colspan="20" class="infobox-padding">
                    <table class="infobox-bonus-table">
                        <tbody>
                            <tr><th>Attack</th><td>+67</td></tr>
                            <tr><th>Strength</th><td>+66</td></tr>
                        </tbody>
                    </table>
                </td></tr>
                <tr><th colspan="20" class="infobox-subheader">Equipment requirements</th></tr>
                <tr><td colspan="20" class="infobox-padding">
                    <ul>
                        <li>60 <a href="/wiki/Attack" title="Attack">Attack</a></li>
                    </ul>
                </td></tr>
            </tbody>
        </table>
    </div>
    """

    parser = OSRSWikiParser(sample_html)
    parsed_data = parser.parse_dragon_scimitar()
    import json
    print(json.dumps(parsed_data, indent=2))
