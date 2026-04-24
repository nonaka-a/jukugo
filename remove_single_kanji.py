import re

def main():
    input_file = 'dictionary.js'
    output_file = 'dictionary.js'
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file: {e}")
        return
    
    new_lines = []
    removed_count = 0
    
    # 1文字のキーを持つ行を判定する正規表現
    # 例: "一": { reading: "...", meaning: "..." },
    single_char_pattern = re.compile(r'^\s*"[^"]":\s*\{.*\},?\s*$')

    for line in lines:
        # 1文字のエントリにマッチした場合はスキップ
        if single_char_pattern.match(line):
            removed_count += 1
            continue
        new_lines.append(line)
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Successfully removed {removed_count} single-character entries.")
    except Exception as e:
        print(f"Error writing file: {e}")

if __name__ == "__main__":
    main()
