import subprocess
import re

try:
    old_content = subprocess.check_output(['git', 'show', 'HEAD:dictionary.js']).decode('utf-8')
    with open('dictionary.js', 'r', encoding='utf-8') as f:
        new_content = f.read()

    def get_words(content):
        return set(re.findall(r'"([^"]+)":', content))

    def get_kanji(words):
        kanji = set()
        for word in words:
            for char in word:
                if '\u4e00' <= char <= '\u9fff':
                    kanji.add(char)
        return kanji

    old_words = get_words(old_content)
    new_words = get_words(new_content)

    old_kanji = get_kanji(old_words)
    new_kanji = get_kanji(new_words)

    removed_kanji = old_kanji - new_kanji
    removed_words = old_words - new_words

    print(f"削除された漢字の総数: {len(removed_kanji)}")
    print("削除された漢字一覧:")
    print("".join(sorted(list(removed_kanji))))
    print(f"\n削除された熟語の総数: {len(removed_words)}")
    
except Exception as e:
    print(f"Error: {e}")
