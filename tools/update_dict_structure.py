import re

input_file = 'dictionary.js'
output_file = 'dictionary.js'

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract dictionaryData entries
entries = re.findall(r'"([^"]+)":\s*"([^"]+)"', content)

# Convert to new structure
js_output = "const dictionaryData = {\n"
for word, reading in sorted(entries):
    js_output += f'    "{word}": {{ reading: "{reading}", meaning: "" }},\n'
js_output += "};\n\n"
js_output += "const dictionary = new Set(Object.keys(dictionaryData));\n\n"
js_output += "const uniqueKanjiList = [...new Set(Object.keys(dictionaryData).join(''))].filter(char => /[\\u4E00-\\u9FFF]/.test(char));\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_output)

print(f"Converted {len(entries)} words to the new structure.")
