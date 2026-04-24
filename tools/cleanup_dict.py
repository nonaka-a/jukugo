import re
import json

input_file = 'dictionary.js'
output_file = 'dictionary.js'

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract dictionaryData object content
# We need to find the dictionaryData = { ... } part
match = re.search(r'const dictionaryData = (\{.*?\});', content, re.DOTALL)
if not match:
    print("Could not find dictionaryData")
    exit(1)

dict_str = match.group(1)
# It's not strict JSON, so we use a safe evaluator or regex
# Let's use regex to build a dict
entries = re.findall(r'"([^"]+)":\s*"([^"]+)"', dict_str)
dict_data = {k: v for k, v in entries}

def get_kanji_counts(current_dict):
    counts = {}
    for word in current_dict.keys():
        for char in word:
            if '\u4e00' <= char <= '\u9fff':
                counts[char] = counts.get(char, 0) + 1
    return counts

while True:
    kanji_counts = get_kanji_counts(dict_data)
    rare_kanji = {k for k, v in kanji_counts.items() if v == 1}
    
    if not rare_kanji:
        break
    
    words_to_remove = []
    for word in dict_data.keys():
        for char in word:
            if char in rare_kanji:
                words_to_remove.append(word)
                break
    
    if not words_to_remove:
        break
        
    print(f"Removing {len(words_to_remove)} words due to rare kanji: {', '.join(words_to_remove[:5])}...")
    for w in words_to_remove:
        del dict_data[w]

# Rebuild dictionary.js
js_output = "const dictionaryData = {\n"
for word, reading in sorted(dict_data.items()):
    js_output += f'    "{word}": "{reading}",\n'
js_output += "};\n\n"
js_output += "const dictionary = new Set(Object.keys(dictionaryData));\n\n"
js_output += "const uniqueKanjiList = [...new Set(Object.keys(dictionaryData).join(''))].filter(char => /[\\u4E00-\\u9FFF]/.test(char));\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_output)

print(f"Cleanup complete. New dictionary size: {len(dict_data)}")
