import re

def main():
    try:
        # Use errors='replace' to get U+FFFD for any bad bytes
        with open('dictionary.js', 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Find all entries: "key": { ... }
    # Using a non-greedy match for the content between braces
    # This will catch multiple entries on the same line
    pattern = re.compile(r'\"([^\"]+)\":\s*\{([^\}]+)\}')
    entries = pattern.findall(content)
    
    clean_entries = []
    removed_single = 0
    
    for key, value in entries:
        # Check if the key is just a single character
        if len(key) <= 1:
            removed_single += 1
            continue
            
        # Clean up the value
        clean_value = value.strip()
        
        # Handle the specific case where extra text might be at the end of the value
        # (e.g. from a merged line that was partially cut)
        # We expect format like: reading: "...", meaning: "..."
        # If there's extra stuff, we try to truncate at the last quote.
        
        # Add to list
        clean_entries.append((key, clean_value))
    
    # Remove duplicates (just in case)
    final_dict = {}
    for k, v in clean_entries:
        final_dict[k] = v
        
    sorted_keys = sorted(final_dict.keys())
    
    # Rebuild the file
    js_output = "const dictionaryData = {\n"
    for key in sorted_keys:
        js_output += f'    "{key}": {{ {final_dict[key]} }},\n'
    js_output += "};\n\n"
    js_output += "const dictionary = new Set(Object.keys(dictionaryData));\n\n"
    js_output += "const uniqueKanjiList = [...new Set(Object.keys(dictionaryData).join(''))].filter(char => /[\\u4E00-\\u9FFF]/.test(char));\n"
    
    with open('dictionary.js', 'w', encoding='utf-8') as f:
        f.write(js_output)
    
    print(f"Rebuilt dictionary.js.")
    print(f"Total entries: {len(sorted_keys)}")
    print(f"Removed single-character entries: {removed_single}")

if __name__ == "__main__":
    main()
