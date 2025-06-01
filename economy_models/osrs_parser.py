from bs4 import BeautifulSoup, Tag # Import Tag
from typing import Dict, Any, Optional, cast # Import cast

class OSRSWikiParser:
    def __init__(self, html_content: str):
        self._raw_html_content = html_content # Store raw HTML content
        self.soup = BeautifulSoup(html_content, 'html.parser')

    def save_html_for_debug(self, html_content: str, filename: str = 'debug_osrs_page.html'):
        """Saves the raw HTML content to a file for debugging."""
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)

    def parse_item_infobox(self) -> Dict[str, Any]:
        self.save_html_for_debug(self._raw_html_content) # Save HTML for debugging
        item_data = {}
        infobox: Optional[Tag] = self.soup.find('table', class_='infobox-item') # type: ignore

        if not infobox:
            print("Debug: Main infobox not found.")
            return item_data
        else:
            print("Debug: Main infobox found.")

        # Extract general properties
        for row in infobox.find_all('tr'): # type: ignore
            header: Optional[Tag] = row.find('th') # type: ignore
            data: Optional[Tag] = row.find('td') # type: ignore
            if header and data:
                key = header.get_text(strip=True).replace(' ', '_').lower()
                value = data.get_text(strip=True)
                item_data[key] = value
        
        # Extract combat bonuses
        item_data['combat_bonuses'] = {}
        combat_bonus_table: Optional[Tag] = self.soup.find('table', class_='infobox-bonuses') # type: ignore
        if combat_bonus_table:
            print("Debug: Combat bonus table found.")
            combat_bonuses = {}
            # Find all infobox-subheader elements within the combat bonus table
            subheaders = combat_bonus_table.find_all('th', class_='infobox-subheader') # type: ignore

            for header in subheaders:
                header_text = header.get_text(strip=True)
                if 'Attack bonuses' in header_text:
                    print("Debug: Attack bonuses header found.")
                    # Get the parent tr of the header
                    header_parent_row = header.find_parent('tr') # type: ignore
                    if header_parent_row:
                        # Navigate past padding and icons rows to the values row
                        padding_row = header_parent_row.find_next_sibling('tr') # type: ignore
                        if padding_row:
                            icons_row = padding_row.find_next_sibling('tr') # type: ignore
                            if icons_row:
                                values_row = icons_row.find_next_sibling('tr') # type: ignore
                                if values_row:
                                    print(f"Debug: Attack values row found: {values_row}")
                                    cells = values_row.find_all('td') # type: ignore
                                    bonus_values = [cell.get_text(strip=True) for cell in cells]
                                    combat_bonuses.update({
                                        'attack_stab': bonus_values[0] if len(bonus_values) > 0 else '',
                                        'attack_slash': bonus_values[1] if len(bonus_values) > 1 else '',
                                        'attack_crush': bonus_values[2] if len(bonus_values) > 2 else '',
                                        'attack_magic': bonus_values[3] if len(bonus_values) > 3 else '',
                                        'attack_ranged': bonus_values[4] if len(bonus_values) > 4 else ''
                                    })
                                else:
                                    print("Debug: Attack values row NOT found.")
                            else:
                                print("Debug: Attack icons row NOT found.")
                        else:
                            print("Debug: Attack padding row NOT found.")
                    else:
                        print("Debug: Attack header parent row NOT found.")
                elif 'Defence bonuses' in header_text:
                    print("Debug: Defence bonuses header found.")
                    header_parent_row = header.find_parent('tr') # type: ignore
                    if header_parent_row:
                        padding_row = header_parent_row.find_next_sibling('tr') # type: ignore
                        if padding_row:
                            icons_row = padding_row.find_next_sibling('tr') # type: ignore
                            if icons_row:
                                values_row = icons_row.find_next_sibling('tr') # type: ignore
                                if values_row:
                                    print(f"Debug: Defence values row found: {values_row}")
                                    cells = values_row.find_all('td') # type: ignore
                                    bonus_values = [cell.get_text(strip=True) for cell in cells]
                                    combat_bonuses.update({
                                        'defence_stab': bonus_values[0] if len(bonus_values) > 0 else '',
                                        'defence_slash': bonus_values[1] if len(bonus_values) > 1 else '',
                                        'defence_crush': bonus_values[2] if len(bonus_values) > 2 else '',
                                        'defence_magic': bonus_values[3] if len(bonus_values) > 3 else '',
                                        'defence_ranged': bonus_values[4] if len(bonus_values) > 4 else ''
                                    })
                                else:
                                    print("Debug: Defence values row NOT found.")
                            else:
                                print("Debug: Defence icons row NOT found.")
                        else:
                            print("Debug: Defence padding row NOT found.")
                    else:
                        print("Debug: Defence header parent row NOT found.")
                elif 'Other bonuses' in header_text:
                    print("Debug: Other bonuses header found.")
                    header_parent_row = header.find_parent('tr') # type: ignore
                    if header_parent_row:
                        padding_row = header_parent_row.find_next_sibling('tr') # type: ignore
                        if padding_row:
                            icons_row = padding_row.find_next_sibling('tr') # type: ignore
                            if icons_row:
                                values_row = icons_row.find_next_sibling('tr') # type: ignore
                                if values_row:
                                    print(f"Debug: Other values row found: {values_row}")
                                    cells = values_row.find_all('td') # type: ignore
                                    bonus_values = [cell.get_text(strip=True) for cell in cells]
                                    combat_bonuses.update({
                                        'melee_strength': bonus_values[0] if len(bonus_values) > 0 else '',
                                        'ranged_strength': bonus_values[1] if len(bonus_values) > 1 else '',
                                        'magic_damage': bonus_values[2] if len(bonus_values) > 2 else '',
                                        'prayer': bonus_values[3] if len(bonus_values) > 3 else ''
                                    })
                                else:
                                    print("Debug: Other values row NOT found.")
                            else:
                                print("Debug: Other icons row NOT found.")
                        else:
                            print("Debug: Other padding row NOT found.")
                    else:
                        print("Debug: Other header parent row NOT found.")
            item_data['combat_bonuses'] = combat_bonuses
        else:
            print("Debug: Combat bonus table NOT found.")

        # Extract equipment requirements
        item_data['requirements'] = []
        found_requirements_header = False
        for th_tag in infobox.find_all('th'): # type: ignore
            if th_tag.get_text(strip=True) == 'Equipment requirements':
                print("Debug: 'Equipment requirements' header found.")
                found_requirements_header = True
                # Look for the next <tr> element that contains the requirements <td>
                req_tr: Optional[Tag] = th_tag.find_parent('tr') # type: ignore
                if req_tr:
                    next_tr: Optional[Tag] = req_tr.find_next_sibling('tr') # type: ignore
                    if next_tr:
                        req_td: Optional[Tag] = next_tr.find('td') # type: ignore
                        if req_td:
                            print(f"Debug: Requirements TD found: {req_td}")
                            req_list: Optional[Tag] = req_td.find('ul') # type: ignore
                            if req_list:
                                print(f"Debug: Requirements UL found: {req_list}")
                                for li in req_list.find_all('li'): # type: ignore
                                    text = li.get_text(separator=' ', strip=True)
                                    # Extract the requirement text (e.g., "70 Defence")
                                    parts = text.split(' ', 1)
                                    if len(parts) == 2 and parts[0].isdigit():
                                        requirement = f"{parts[0]} {parts[1]}"
                                        item_data['requirements'].append(requirement)
                            else:
                                print("Debug: Requirements UL NOT found.")
                        else:
                            print("Debug: Requirements TD NOT found in next TR.")
                    else:
                        print("Debug: Next TR after requirements header NOT found.")
                else:
                    print("Debug: Requirements TR NOT found.")
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
        # This is a specific example for Dragon Scimitar, using the general parser
        # and then potentially adding specific overrides or extractions.
        data = self.parse_item_infobox()
        data['item_name'] = self.soup.find('th', class_='infobox-header').get_text(strip=True) if self.soup.find('th', class_='infobox-header') else 'Unknown'
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
