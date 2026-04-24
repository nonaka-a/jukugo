import pykakasi
import re

kks = pykakasi.kakasi()

input_file = 'dictionary.js'
output_file = 'dictionary.js'

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

words = re.findall(r'"([^"]+)"', content)
words = list(dict.fromkeys(words))

dictionary_data = {}
for word in words:
    result = kks.convert(word)
    reading = "".join([item['hira'] for item in result])
    dictionary_data[word] = reading

js_output = "const dictionaryData = {\n"
for word, reading in dictionary_data.items():
    js_output += f'    "{word}": "{reading}",\n'
js_output += "};\n\n"
js_output += "const dictionary = new Set(Object.keys(dictionaryData));\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_output)

print("Converted", len(dictionary_data), "words.")
