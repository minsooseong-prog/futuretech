/* i18n.js — 언어 설정. 새 언어를 추가하려면 LANGS 에 코드를 넣고
   UI 객체와 SAY 테이블의 배열에 같은 순서로 항목을 추가하면 된다. */

export const LANGS = ['ko', 'en', 'ja'];
export const LANG_NAMES = { ko: '한국어', en: 'English', ja: '日本語' };

/* ───────────────────────── UI 문자열 ───────────────────────── */
const UI = {
  title:        ['졸라맨 놀이터', 'Stickman Playground', 'ぼうにんげん広場'],
  menu:         ['메인 메뉴', 'Main Menu', 'メインメニュー'],
  board:        ['게시판', 'Board', '掲示板'],
  settings:     ['설정', 'Settings', '設定'],
  codex:        ['상호작용 도감', 'Interaction Codex', 'ずかん'],
  close:        ['닫기', 'Close', '閉じる'],
  save:         ['저장', 'Save', '保存'],
  cancel:       ['취소', 'Cancel', 'キャンセル'],
  reset:        ['초기화', 'Reset', 'リセット'],
  delete:       ['삭제', 'Delete', '削除'],

  welcome:      ['살아 있는 졸라맨과 노는 곳', 'A place to play with a living stickman', '生きているぼうにんげんと遊ぶ場所'],
  howto:        ['어떻게 노나요?', 'How to play', '遊び方'],
  howto1:       ['졸라맨을 클릭하거나 잡아서 던져 보세요.', 'Click the stickman, or grab and throw him.', 'クリックしたり、つかんで投げてみよう。'],
  howto2:       ['빈 곳에서 마우스를 끌면 선택 박스가 만들어집니다.', 'Drag on empty space to draw a selection box.', '空白をドラッグすると選択ボックスができます。'],
  howto3:       ['화면 아무 곳에서나 우클릭하면 명령 메뉴가 열립니다.', 'Right-click anywhere to open the command menu.', '右クリックでコマンドメニューが開きます。'],
  howto4:       ['가만히 두면 혼자 걸어다니며 살아갑니다.', 'Leave him alone and he lives his own life.', '放っておくと自分で歩き回ります。'],
  howto5:       ['키보드: 방향키 이동 / Space 점프 / D 춤 / S 앉기 / Z 자기', 'Keys: Arrows move / Space jump / D dance / S sit / Z sleep', 'キー: 矢印=移動 / Space=ジャンプ / D=ダンス / S=座る / Z=寝る'],
  stats:        ['통계', 'Stats', '統計'],
  statInteract: ['발견한 상호작용', 'Interactions found', '見つけた反応'],
  statTotal:    ['전체', 'total', '全部'],
  statSteps:    ['걸은 걸음', 'Steps walked', '歩いた歩数'],
  statThrows:   ['던져진 횟수', 'Times thrown', '投げられた回数'],
  statTime:     ['함께한 시간', 'Time together', '一緒にいた時間'],

  boardNew:     ['새 글 쓰기', 'New post', '新規投稿'],
  boardName:    ['이름', 'Name', '名前'],
  boardText:    ['내용', 'Message', '本文'],
  boardPost:    ['등록', 'Post', '投稿'],
  boardEmpty:   ['아직 글이 없어요. 첫 글을 남겨 보세요!', 'No posts yet. Be the first!', 'まだ投稿がありません。'],
  boardSaved:   ['이 게시판은 이 브라우저에만 저장됩니다.', 'Posts are saved in this browser only.', 'このブラウザにのみ保存されます。'],
  anon:         ['이름없음', 'Anonymous', 'ななし'],

  setLang:      ['언어', 'Language', '言語'],
  setColor:     ['캐릭터 색상', 'Character color', 'キャラの色'],
  setColorPick: ['직접 고르기', 'Custom color', '自分で選ぶ'],
  setRainbow:   ['무지개 모드(색이 계속 변함)', 'Rainbow mode', 'レインボーモード'],
  setBg:        ['배경', 'Background', '背景'],
  setBgUpload:  ['이미지 올리기', 'Upload image', '画像をアップロード'],
  setBgFit:     ['맞춤 방식', 'Fit mode', '表示方法'],
  setBgCover:   ['꽉 채우기', 'Cover', '全体を覆う'],
  setBgContain: ['전체 보기', 'Contain', '全体を表示'],
  setBgTile:    ['타일', 'Tile', 'タイル'],
  setBgDim:     ['배경 어둡게', 'Background dim', '背景を暗く'],
  setBgClear:   ['배경 지우기', 'Clear background', '背景を消す'],
  setSize:      ['캐릭터 크기', 'Character size', 'キャラのサイズ'],
  setSpeed:     ['움직임 속도', 'Motion speed', '動きの速さ'],
  setAuto:      ['혼자 살아가기(자율 행동)', 'Autonomous life', '自律行動'],
  setPhysics:   ['물리(잡기·던지기)', 'Physics (grab & throw)', '物理（つかむ・投げる）'],
  setTalk:      ['말하기', 'Talking', 'しゃべる'],
  setTextSize:  ['글자 크기', 'Text size', '文字サイズ'],
  setGround:    ['바닥 높이', 'Ground height', '地面の高さ'],
  setTrail:     ['잔상 효과', 'Motion trail', '残像'],
  setSounds:    ['효과음(비프)', 'Blip sounds', '効果音'],
  setResetAll:  ['모든 설정·기록 초기화', 'Reset everything', 'すべて初期化'],
  setResetAsk:  ['정말 모두 초기화할까요?', 'Reset everything?', '本当に初期化しますか？'],

  codexHint:    ['찾아낸 상호작용은 색이 켜집니다.', 'Discovered interactions light up.', '見つけた反応は色がつきます。'],
  codexAll:     ['전체', 'All', 'すべて'],

  catBody:      ['몸 만지기', 'Touch', 'さわる'],
  catDrag:      ['잡고 끌기', 'Drag', 'ドラッグ'],
  catGesture:   ['커서 제스처', 'Cursor gestures', 'カーソル操作'],
  catBox:       ['선택 박스', 'Selection box', '選択ボックス'],
  catMenu:      ['우클릭 명령', 'Right-click', '右クリック'],
  catKey:       ['키보드', 'Keyboard', 'キーボード'],
  catSystem:    ['환경 변화', 'Environment', '環境'],
  catAuto:      ['혼자 하는 행동', 'On his own', 'ひとりで'],

  ctxTitle:     ['졸라맨에게 시키기', 'Tell him to…', '命令する'],
  ctxCome:      ['여기로 와', 'Come here', 'ここに来て'],
  ctxLook:      ['날 봐', 'Look at me', 'こっち見て'],
  ctxFollow:    ['따라다니기 켜기/끄기', 'Toggle follow', 'ついてくる'],
  boxTitle:     ['박스 안 명령', 'Box command', 'ボックス命令'],
};

/* ───────────────────────── 캐릭터 대사 ─────────────────────────
   [ [한국어…], [English…], [日本語…] ] — 배열 중 하나를 무작위로 고른다. */
const SAY = {
  greet:        [['안녕!', '어, 왔구나!'], ['Hi there!', 'Oh, hey!'], ['やあ！', 'きたね！']],
  hello_again:  [['또 만났네', '반가워 또!'], ['We meet again', 'Hey again!'], ['また会ったね', 'またね！']],

  click_head:   [['머리는 좀…', '어지러워'], ['Not the head…', 'Dizzy!'], ['あたまはちょっと', 'めまいが']],
  click_face:   [['눈 찔렸어!', '앗 따가워'], ['My eye!', 'Ouch!'], ['目が！', 'いたっ']],
  click_chest:  [['심장 뛴다', '두근두근'], ['Heart beat', 'Thump thump'], ['ドキドキ', 'しんぞうが']],
  click_belly:  [['간지러워', '배는 만지지 마'], ['That tickles', 'Not the belly'], ['くすぐったい', 'おなかはやめて']],
  click_shoulder:[['왜 불러?', '어깨 결려'], ['You called?', 'Stiff shoulder'], ['よんだ？', 'かたこり']],
  click_elbow:  [['팔꿈치야', '접히는 데야'], ['That is my elbow', 'It bends there'], ['ひじだよ', 'まがるとこ']],
  click_hand:   [['악수?', '하이파이브!'], ['Handshake?', 'High five!'], ['あくしゅ？', 'ハイタッチ！']],
  click_knee:   [['무릎 반사!', '툭!'], ['Knee reflex!', 'Kick!'], ['ひざカックン', 'ぴくっ']],
  click_foot:   [['발 간지러', '거기 약해'], ['My foot!', 'Too ticklish'], ['あしがくすぐったい', 'よわいとこ']],
  click_pelvis: [['어이', '거긴 좀…'], ['Hey now', 'Careful there'], ['おいおい', 'そこはちょっと']],

  drag_head:    [['목 늘어나!', '으악 놔줘'], ['My neck!', 'Let go!'], ['くびがのびる', 'はなして']],
  drag_body:    [['날아간다~', '들렸다!'], ['Flying~', 'Lifted!'], ['とんでる～', 'もちあげられた']],
  drag_arm:     [['팔 빠져!', '아파아파'], ['My arm!', 'Ow ow ow'], ['うでがぬける', 'いたい']],
  drag_leg:     [['거꾸로다!', '피가 쏠려'], ['Upside down!', 'Blood rush'], ['さかさま！', 'あたまに血が']],
  drag_hand:    [['손 잡아줘서 고마워', '같이 갈까?'], ['Thanks for the hand', 'Shall we go?'], ['手をつないだ', 'いっしょに行く？']],
  drag_foot:    [['발목 잡혔다', '놔줘!'], ['Got my ankle', 'Let go!'], ['あしくびが', 'はなして！']],
  drop_soft:    [['살았다', '착지 성공'], ['Safe', 'Nice landing'], ['たすかった', 'ちゃくち']],
  drop_hard:    [['아야!', '허리야…'], ['Ouch!', 'My back…'], ['いたっ！', 'こしが…']],
  thrown:       [['우와아아', '난다!'], ['Whoaaa', 'I can fly!'], ['うわああ', 'とぶー！']],
  dizzy:        [['별이 보여…', '핑그르르'], ['I see stars…', 'Spinning…'], ['ほしがみえる', 'ぐるぐる']],
  recover:      [['다시 일어섰다', '괜찮아 괜찮아'], ['Back up', 'I am fine'], ['たちあがった', 'だいじょうぶ']],

  dbl_head:     [['똑똑똑', '누구세요?'], ['Knock knock', 'Who is it?'], ['コンコン', 'だれ？']],
  dbl_chest:    [['두 번이나?', '왜 그래!'], ['Twice?!', 'What!'], ['にかいも？', 'なんで！']],
  dbl_hand:     [['짝! 하이파이브', '통했다!'], ['High five!', 'Nice!'], ['ハイタッチ！', 'いいね！']],
  dbl_foot:     [['발차기 나간다', '차버릴 거야'], ['Here comes a kick', 'I will kick'], ['キックいくよ', 'けるぞ']],

  tickle:       [['크크크', '하지 마 크크'], ['Hehehe', 'Stop it hehe'], ['くくく', 'やめてー']],
  poke:         [['콕?', '왜 찔러'], ['Poke?', 'Why poke me'], ['つついた？', 'なんで']],
  poke_many:    [['그만 좀!', '진짜 화낸다'], ['Enough!', 'I will get mad'], ['やめてよ！', 'おこるよ']],
  shake_cursor: [['정신없어!', '진정해!'], ['So shaky!', 'Calm down!'], ['めまぐるしい', 'おちついて']],
  circle_cw:    [['빙글빙글', '따라 돌래'], ['Round and round', 'I will follow'], ['ぐるぐる', 'まわる']],
  circle_ccw:   [['반대로 돈다', '어지러워!'], ['Other way!', 'Dizzy!'], ['ぎゃくむき', 'めがまわる']],
  fast_cursor:  [['빠르다!', '못 따라가'], ['So fast!', 'Cannot keep up'], ['はやい！', 'ついていけない']],
  slow_cursor:  [['조심조심…', '살금살금'], ['Slowly…', 'Sneaky'], ['そーっと', 'こっそり']],
  hover_head:   [['머리 위에 뭐 있어?', '내려와'], ['Something above me?', 'Come down'], ['あたまのうえ？', 'おりてきて']],
  hover_feet:   [['발밑이야', '밟지 마'], ['Down there', 'Do not step'], ['あしもと', 'ふまないで']],
  flick:        [['휙!', '바람 분다'], ['Whoosh!', 'Windy'], ['ひゅっ！', 'かぜが']],
  zigzag:       [['지그재그?', '눈 아파'], ['Zigzag?', 'My eyes'], ['ジグザグ？', 'めがいたい']],
  cursor_left:  [['어디 갔어…', '돌아와'], ['Where did you go…', 'Come back'], ['どこいったの', 'もどってきて']],
  cursor_back:  [['돌아왔다!', '기다렸어'], ['You are back!', 'I waited'], ['もどってきた！', 'まってた']],
  cursor_idle:  [['자니?', '거기서 뭐해'], ['Asleep?', 'What are you doing'], ['ねてる？', 'なにしてるの']],

  box_small:    [['좁아!', '갇혔다'], ['Too tight!', 'Trapped'], ['せまい！', 'とじこめられた']],
  box_big:      [['방이 생겼다', '넓다!'], ['A room!', 'Spacious'], ['へやができた', 'ひろい！']],
  box_catch:    [['잡혔다!', '선택됐어'], ['Caught!', 'Selected'], ['つかまった', 'えらばれた']],
  box_empty:    [['거기 아무도 없는데', '뭐 잡았어?'], ['Nothing there', 'Catch anything?'], ['なにもないよ', 'なにとれた？']],
  box_shake:    [['상자가 흔들려!', '멀미나'], ['The box is shaking!', 'Motion sick'], ['はこがゆれる', 'よいそう']],

  menu_wave:    [['안녕하세요!', '반갑습니다'], ['Hello!', 'Nice to see you'], ['こんにちは！', 'よろしく']],
  menu_dance:   [['춤춘다!', '리듬 탄다'], ['Dancing!', 'Feel the beat'], ['おどる！', 'リズムだ']],
  menu_sit:     [['좀 쉬자', '앉을게'], ['Let me rest', 'Sitting down'], ['やすもう', 'すわるね']],
  menu_lie:     [['눕는 게 최고', '편하다'], ['Lying down is best', 'So comfy'], ['ねるのがさいこう', 'らくちん']],
  menu_sleep:   [['쿨쿨…', '잘 자'], ['Zzz…', 'Good night'], ['スヤスヤ', 'おやすみ']],
  menu_jump:    [['점프!', '높이!'], ['Jump!', 'Higher!'], ['ジャンプ！', 'たかく！']],
  menu_flip:    [['백덤블링!', '봤어?'], ['Backflip!', 'Did you see?'], ['バク転！', 'みた？']],
  menu_pushup:  [['하나 둘…', '근육 만든다'], ['One, two…', 'Getting strong'], ['いち、に…', 'きんにく']],
  menu_situp:   [['복근 만든다', '으윽'], ['Core day', 'Ugh'], ['ふっきん', 'うぐぐ']],
  menu_stretch: [['시원하다', '쭈욱'], ['So good', 'Streeetch'], ['きもちいい', 'のびー']],
  menu_meditate:[['무념무상…', '고요하다'], ['Empty mind…', 'Peaceful'], ['むねんむそう', 'しずか']],
  menu_think:   [['음…', '생각 중'], ['Hmm…', 'Thinking'], ['うーん', 'かんがえちゅう']],
  menu_laugh:   [['하하하!', '웃겨!'], ['Hahaha!', 'So funny!'], ['ははは！', 'おもしろい']],
  menu_cry:     [['흑흑…', '슬퍼'], ['Sniff…', 'So sad'], ['ぐすん', 'かなしい']],
  menu_angry:   [['화났어!', '으아앙'], ['I am mad!', 'Grr'], ['おこった！', 'ぐぬぬ']],
  menu_surprise:[['헉!', '깜짝이야'], ['Gasp!', 'You scared me'], ['えっ！', 'びっくり']],
  menu_scared:  [['무서워…', '저리 가'], ['Scary…', 'Go away'], ['こわい…', 'あっちいって']],
  menu_selfie:  [['치즈~', '한 장 찍자'], ['Cheese~', 'One photo'], ['チーズ～', 'いちまい']],
  menu_run:     [['달린다!', '전속력!'], ['Running!', 'Full speed!'], ['はしる！', 'ぜんそくりょく']],
  menu_walk:    [['산책 좀', '천천히'], ['A little walk', 'Nice and slow'], ['さんぽ', 'ゆっくり']],
  menu_handstand:[['물구나무!', '세상이 거꾸로'], ['Handstand!', 'World upside down'], ['さかだち！', 'せかいがぎゃく']],
  menu_spin:    [['빙그르르!', '돈다 돌아'], ['Spinning!', 'Round I go'], ['くるくる！', 'まわるよ']],
  menu_clap:    [['짝짝짝!', '멋져!'], ['Clap clap!', 'Bravo!'], ['ぱちぱち', 'すごい！']],
  menu_yawn:    [['하암…', '졸려'], ['Yaaawn…', 'Sleepy'], ['ふぁぁ', 'ねむい']],
  menu_sneeze:  [['에취!', '먼지가…'], ['Achoo!', 'Dusty…'], ['ハクション！', 'ほこりが']],
  menu_shiver:  [['추워!', '덜덜덜'], ['So cold!', 'Brrr'], ['さむい！', 'ぶるぶる']],
  menu_bow:     [['감사합니다', '잘 부탁해요'], ['Thank you', 'Please take care'], ['ありがとう', 'よろしく']],
  menu_point:   [['저기 봐!', '저쪽이야'], ['Look there!', 'That way'], ['あっちみて', 'そっちだよ']],
  menu_kick:    [['얍!', '발차기!'], ['Hyah!', 'Kick!'], ['やっ！', 'キック！']],
  menu_cheer:   [['만세!', '해냈다!'], ['Hooray!', 'We did it!'], ['ばんざい！', 'やった！']],
  menu_shrug:   [['글쎄…', '난 몰라'], ['Who knows…', 'Not my thing'], ['さあ…', 'しらない']],
  menu_wall:    [['벽이 있네', '보이지 않는 벽'], ['A wall here', 'Invisible wall'], ['かべがある', 'みえないかべ']],
  menu_moon:    [['문워크!', '미끄러진다'], ['Moonwalk!', 'Sliding'], ['ムーンウォーク', 'すべる']],

  key_jump:     [['위로!', '얍!'], ['Up we go!', 'Hup!'], ['うえへ！', 'えいっ']],
  key_run:      [['달려!', '더 빨리'], ['Run!', 'Faster'], ['はしれ！', 'もっとはやく']],
  key_left:     [['왼쪽으로', '이쪽?'], ['To the left', 'This way?'], ['ひだりへ', 'こっち？']],
  key_right:    [['오른쪽으로', '저쪽!'], ['To the right', 'That way!'], ['みぎへ', 'あっち！']],
  key_hi:       [['키보드도 되네!', '오 편하다'], ['Keyboard works too!', 'Handy'], ['キーボードもいける', 'べんり']],

  sys_resize:   [['세상이 변했다!', '창이 커졌어?'], ['The world changed!', 'Window resized?'], ['せかいがかわった', 'まどがかわった？']],
  sys_hidden:   [['어디 가…', '기다릴게'], ['Where are you going…', 'I will wait'], ['どこいくの', 'まってる']],
  sys_visible:  [['돌아왔구나!', '보고 싶었어'], ['You came back!', 'Missed you'], ['もどってきた！', 'あいたかった']],
  sys_night:    [['밤이네', '별 보러 갈까'], ['It is night', 'Star gazing?'], ['よるだね', 'ほしをみよう']],
  sys_bg:       [['배경이 바뀌었다!', '여기 어디야?'], ['New background!', 'Where is this?'], ['はいけいがかわった', 'ここどこ？']],
  sys_color:    [['새 옷 어때?', '색이 바뀌었어!'], ['Like my new color?', 'I changed color!'], ['あたらしいいろ', 'いろがかわった']],
  sys_lang:     [['이제 이 말로 할게', '언어 바꿨어'], ['I will speak this now', 'Language changed'], ['このことばではなすね', 'げんごをかえた']],
  sys_first:    [['처음 왔구나! 환영해', '반가워, 여긴 내 화면이야'], ['First time! Welcome', 'Hi, this is my screen'], ['はじめまして！', 'ようこそ']],
  sys_return:   [['또 왔네, 반가워', '기다리고 있었어'], ['You came back!', 'I was waiting'], ['またきたね', 'まってたよ']],
  sys_idle_long:[['심심해…', '나 여기 있는데'], ['So bored…', 'I am still here'], ['ひまだな', 'ここにいるよ']],
  sys_post:     [['글 잘 봤어!', '고마워 :)'], ['Nice post!', 'Thanks :)'], ['よんだよ！', 'ありがとう']],
  sys_scroll:   [['어지러워!', '휠 그만'], ['Dizzy!', 'Stop scrolling'], ['めがまわる', 'スクロールやめて']],
  sys_reset:    [['다 지웠네…', '처음부터 다시'], ['All gone…', 'Starting over'], ['ぜんぶきえた', 'さいしょから']],

  auto_wander:  [['어디 가볼까', '산책 중'], ['Where to go', 'Just walking'], ['どこいこう', 'さんぽちゅう']],
  auto_sit:     [['잠깐 앉을게', '다리 아파'], ['I will sit a bit', 'Tired legs'], ['ちょっとすわる', 'あしがつかれた']],
  auto_sleep:   [['졸려…', '조금만 잘게'], ['Sleepy…', 'Just a nap'], ['ねむい', 'ちょっとねる']],
  auto_wake:    [['잘 잤다!', '음냐…'], ['Good nap!', 'Mmm…'], ['よくねた！', 'ふぁ…']],
  auto_look:    [['저게 뭐지?', '음?'], ['What is that?', 'Hm?'], ['あれなに？', 'ん？']],
  auto_stretch: [['으으 시원해', '몸 좀 풀자'], ['Ahh nice', 'Loosen up'], ['ううきもちいい', 'ほぐそう']],
  auto_yawn:    [['하아암', '피곤해'], ['Yaawn', 'Tired'], ['ふぁぁ', 'つかれた']],
  auto_dance:   [['혼자 춤춰야지', '흥이 난다'], ['Dancing solo', 'Feeling it'], ['ひとりでおどる', 'のってきた']],
  auto_ponder:  [['난 왜 여기 있을까', '음…'], ['Why am I here', 'Hmm…'], ['なんでここに', 'うーん']],
  auto_count:   [['하나, 둘, 셋…', '몇 걸음이지'], ['One, two, three…', 'How many steps'], ['いち、に、さん', 'なんぽ？']],
  auto_sing:    [['라라라~', '흠흠흠♪'], ['La la la~', 'Hmm hmm♪'], ['ららら～', 'ふんふん♪']],
  auto_bored:   [['할 게 없다', '누구 없나'], ['Nothing to do', 'Anyone there'], ['やることない', 'だれかいない？']],
  auto_happy:   [['오늘 기분 좋다', '좋은 날이야'], ['Feeling good today', 'Nice day'], ['きぶんいい', 'いいひだ']],
  auto_climb:   [['올라가 볼까', '여기 밟을 수 있네'], ['Let me climb', 'I can stand here'], ['のぼってみよう', 'ここにのれる']],
  auto_jumpfun: [['이유 없이 점프', '폴짝'], ['Jumping for no reason', 'Hop'], ['いみなくジャンプ', 'ぴょん']],
  auto_pebble:  [['돌멩이 차기', '툭'], ['Kicking a pebble', 'Tok'], ['いしをける', 'こつん']],
  auto_greet_cursor:[['거기 있었네', '안녕 커서'], ['There you are', 'Hi cursor'], ['そこにいたのか', 'やあカーソル']],
  auto_explore: [['탐험 간다', '저기 가보자'], ['Exploring', 'Over there'], ['たんけん', 'あっちいこう']],
  auto_selfcheck:[['내 몸 멀쩡한가', '팔 다리 확인'], ['Am I okay', 'Checking limbs'], ['からだだいじょうぶ？', 'てあしチェック']],
  follow_on:    [['따라갈게!', '어디든 가자'], ['I will follow!', 'Anywhere'], ['ついていく！', 'どこでも']],
  follow_off:   [['알겠어, 여기 있을게', '자유다!'], ['Okay, I will stay', 'Free!'], ['ここにいるね', 'じゆうだ']],
  come:         [['가는 중!', '기다려'], ['On my way!', 'Wait up'], ['いまいく！', 'まって']],
};

/* ── 구현 ── */
let current = 'ko';
export function setLang(code) { current = LANGS.includes(code) ? code : 'ko'; }
export function getLang() { return current; }

const idx = () => Math.max(0, LANGS.indexOf(current));

/** UI 문자열 */
export function t(key) {
  const row = UI[key];
  if (!row) return key;
  return row[idx()] ?? row[0];
}

/** 캐릭터 대사(무작위) */
export function say(key) {
  const row = SAY[key];
  if (!row) return '';
  const arr = row[idx()] ?? row[0];
  return arr[(Math.random() * arr.length) | 0];
}

export function hasSay(key) { return !!SAY[key]; }
export const SAY_KEYS = Object.keys(SAY);
