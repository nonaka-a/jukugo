import re
import json

# 小学校5年生・6年生の漢字リスト（代表的なもの）
# 実際にはもっと多いですが、現在の辞書にある漢字から抽出します。
grade5 = set("圧囲移因永営衛易益液演応往桜恩可仮価河過賀解格確額刊幹慣眼基寄規技義逆久旧居許境均禁句群軍郡険券憲検権絹厳源己呼誤后孝構皇講混査再災妻採際在財罪雑酸賛支志枝師資飼示似識質舎謝授修術述準序招承証条状常情織職制性政勢精製税説絶舌銭宣専泉洗染燃祖素総綿奏窓創装層操蔵臓存尊退態団断竹築張提程適敵統銅導徳独任燃能破犯判版比肥非備鼻評貧布婦富武復複仏粉編弁保墓報豊防貿暴務夢迷綿輸余預容略留領倫")
grade6 = set("亜尉異遺域宇映延沿我灰拡閣革閣割株干巻看簡危机揮貴疑吸供胸郷勤筋系敬慶劇激穴絹権憲険顕験元原厳源呼誤後孝公構皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦署諸除将傷障城蒸針仁垂推寸聖誠宣専泉洗染善奏窓創装層操蔵臓存尊宅担探誕段暖値宙忠著庁頂潮賃痛展討党糖届難乳認納脳派拝背肺俳班晩否批秘非肥費備鼻評描貧補模預勇幼羊養欲翌乱卵覧裏律略柳流留倫累麗論")

with open('dictionary.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 熟語を抽出
words = re.findall(r'"([^"]+)":', content)

# 漢字ごとの出現回数をカウント
kanji_counts = {}
kanji_to_words = {}

for word in words:
    for char in word:
        if '\u4e00' <= char <= '\u9fff':
            kanji_counts[char] = kanji_counts.get(char, 0) + 1
            if char not in kanji_to_words:
                kanji_to_words[char] = []
            kanji_to_words[char].append(word)

# 5・6年生の漢字で、出現回数が2回以下のものを抽出
rare_kanji = []
for char, count in kanji_counts.items():
    grade = ""
    if char in grade5:
        grade = "5年生"
    elif char in grade6:
        grade = "6年生"
    
    if grade and count <= 2:
        rare_kanji.append({
            "kanji": char,
            "grade": grade,
            "count": count,
            "words": kanji_to_words[char]
        })

# 結果を表示
print(f"Total words in dictionary: {len(words)}")
print(f"Found {len(rare_kanji)} rare kanji (count <= 2) from Grade 5/6.")
for item in sorted(rare_kanji, key=lambda x: x['count']):
    print(f"[{item['grade']}] {item['kanji']} ({item['count']}回): {', '.join(item['words'])}")
