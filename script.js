/*
 *                _       _      _     
 *  ___  ___ _ __(_)_ __ | |_   (_)___ 
 * / __|/ __| '__| | '_ \| __|  | / __|
 * \__ \ (__| |  | | |_) | |_ _ | \__ \
 * |___/\___|_|  |_| .__/ \__(_)/ |___/
 *                 |_|        |__/     
 * 
 * 
 */

// word list borrowed from
// https://quizlet.com/16743273/top-200-gre-vocabulary-words-flash-cards/
const ENABLE_AUDIOAPI = true
const ENABLE_SHEETAPI = true
// const ENABLE_AUDIOAPI = false
// const ENABLE_SHEETAPI = false
const NWORKING_WORDS = 20
const TIER_WEIGHTS = [4, 3, 2, 1]
const TOTAL_WEIGHT = TIER_WEIGHTS.reduce((x,y) => x+y, 0)

console.log('script start')
const SHEETID = 'REDACTED'
const SHEETAPI = 'REDACTED' + SHEETID
const SHARESHEETURL = 'REDACTED' + SHEETID 
  + '/edit?usp=sharing'


// views
// -----------------------------------------------------
// html elements to control
// top bar
const edit_word_list_button = document.getElementById('edit-button')
const finish_early_button = document.getElementById('finish-button')
const top_div = document.getElementById('topdiv')

// view divs
const welcome_div = document.getElementById('welcome')
const flashcard_div = document.getElementById('flashcard-div')
const edit_div = document.getElementById('edit-div')
const flashcard_bottom = document.getElementById('flashcard-bottom')

// flashcard div
const cardback_div = document.getElementById('cardback')
const cardfront_speak = document.getElementById('cardfront-speak')
const cardfront_progress = document.getElementById('progress')
const cardfront_fam = document.getElementById('familiarity')
const cardfront_word = document.getElementById('cardfront-word')
const fam_buttons = ['preserve', '1', '2', '3', 'batch'].map(
  (x) => document.getElementById('fam-' + x))
const def_controller_center = document.getElementById('def-controller-center')
const fam_controller_center = document.getElementById('fam-controller-center')
const show_def_button = document.getElementById('show-def-button')
const BLINK_MS = 100

// edit div
const edit_link_button = document.getElementById('edit-link')
const edit_done_button = document.getElementById('edit-done')

// welcome div
const flashcard_button = document.getElementById('flashcard-button')

// show/hide two sets of controller bars in flashcard mode
function show_def_controller() {
  def_controller_center.style.display = 'grid'
  fam_controller_center.style.display = 'none'
}
function show_fam_controller() {
  def_controller_center.style.display = 'none'
  fam_controller_center.style.display = 'grid'
}

// @param but: an HTML button element to blink
function blink_fam_button(but, after) {
  but.style.backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--d-bg')
  setTimeout(() => { 
    but.style.backgroundColor = 'transparent'; 
    after() 
  }, BLINK_MS)
}

// @param fam: a string
function set_keepas_familiarity(fam) {
  const node = fam_buttons[0].firstElementChild.firstElementChild
  node.innerText = fam
}

// @param s: text to say
// credit to https://stackoverflow.com/questions/35002003/
//           how-to-use-google-translate-tts-with-the-new-v2-api
function tts(s) {
  console.log('play ' + s)
  let audio = new Audio();
  audio.src = 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/' + 
    s + '--_us_1.mp3'
  audio.play();
}

let current_view
// @param viewname: the view to switch to
function switchview(viewname) {
  if (viewname == 'flashcard') {

    edit_word_list_button.style.display = 'none'
    welcome_div.style.display = 'none'
    edit_div.style.display = 'none'
    flashcard_div.style.display = 'block'
    flashcard_bottom.style.display = 'block'
    finish_early_button.style.display = 'block'

  } 
  else if (viewname == 'welcome') {

    edit_word_list_button.style.display = 'block'
    welcome_div.style.display = 'block'
    edit_div.style.display = 'none'
    flashcard_div.style.display = 'none'
    flashcard_bottom.style.display = 'none'
    finish_early_button.style.display = 'none'

  }
  else if (viewname == 'edit') {

    edit_word_list_button.style.display = 'none'
    welcome_div.style.display = 'none'
    edit_div.style.display = 'block'
    flashcard_div.style.display = 'none'
    flashcard_bottom.style.display = 'none'
    finish_early_button.style.display = 'none'
    
  }

  current_view = viewname
}

// perform css animation
function show_cardback(word) {
  cardback_div.classList = []
  cardback_div.innerText = word.value
}
function hide_cardback() {
  cardback_div.classList = ['cardback-in']
}

// @param word: word to show
// @param nworking: number of words in current working batch
function set_cardfront(word, nworking) {
  cardfront_progress.innerText = nworking + ' Left'
  cardfront_word.innerText = word.key
  cardfront_fam.innerText = fam_num_to_str(word.fam)
}

// misc utils
// -----------------------------------------------------

// @param fam: familiarity tier (0..3)
// @return a string representation
function fam_num_to_str(fam) {
  if (fam == 0) return 'New'
  if (fam == 1) return 'Unfamiliar'
  if (fam == 2) return 'Meh'
  if (fam == 3) return 'Familiar'
}

function char_to_keycode(c) {
  const x = c.charCodeAt(0)
  return x > 90 ? x - 32 : x
}

let lastrand = -1
// @param return pseudo randomly in [0..x)
// gaurantee not to be the same as the last one
function randint(x) {
  const t = Math.floor(Math.random() * x)
  const ret = t == lastrand ? ((t+1) % x) : t
  lastrand = ret
  return ret
}


// sheet api
// -----------------------------------------------------
function open_share_sheet_link() {
  window.open(SHARESHEETURL)
}

let ACCESSTOKEN = -1
// @param p1: upperleft point. A1 notation
// @param p2: lowerright point. A1 notation
// @param values: a matrix to update the cells within the matrix 
//                p1 to p2
function edit_sheet_cells(p1, p2, values) {
  if (!ENABLE_SHEETAPI) return
  const range = `Sheet1!${p1}:${p2}`
  fetch(SHEETAPI + `/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'put',
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESSTOKEN}`,
    },
    body: JSON.stringify({
      'range': range,
      'majorDimension': 'ROWS',
      'values': values
    })
  })
  .then((response) => {
    if (response.status !== 200) {
      console.log("[edit_sheet_cell] API Error! Code: " + response.status)
      return
    }
  })
}

// when used with await, returns a json table that contains entire sheet
// no formatting is performed
async function get_entire_sheet() {
  if (!ENABLE_SHEETAPI) return
  const res = await fetch(SHEETAPI + '/values/Sheet1', {
    method: 'get',
    headers: {
      Authorization: `Bearer ${ACCESSTOKEN}`,
    }
  })
  .then((response) => {
    if (response.status !== 200) {
      console.log("[get] API Error! Code: " + response.status)
      return
    }
    return response.json()
  })
  return res
}


// main
// everything that interacts with google sheet api should be put here
// -----------------------------------------------------
let words
const get_access_token = window.get_access_token // import from auth.js
// @param pull_words: whether to retrieve words from google sheet
// @param reparse: whether to parse again
async function main({pull_words, reparse}) {
  if (ACCESSTOKEN == -1 && ENABLE_SHEETAPI) {
    ACCESSTOKEN = await get_access_token()
    console.log(ACCESSTOKEN)
  }

  if (pull_words) {
    console.log('pull words')
    const words_raw = ENABLE_SHEETAPI ? await get_entire_sheet() : {
      "range":"Sheet1!A1:Z1001",
      "majorDimension":"ROWS",
      "values":[
        [ "Word", "Meaning", "Familiarity", "Timestamp (last used)" ],
        [ "familiar", "记得住的", "3" ],
        [ "meh", "还可以的", "2", "3" ],
        [ "unfamiliar", "记不住的", "1", "123123" ],
        [ "new", "新的" ],
        [ "plastic", "able to be molded, altered, bent", "0" ],
        [ "paragon", "a model of excellence or perfection", "0" ],
        [ "discern", "to perceive, to recognize", "3" ],
        [ "paradox", "a contradiction or dilemma" ],
        [ "stolid", "unemotional, lacking sensitivity" ],
        [ "monotony", "lack of variation" ],
        [ "permeate", "to penetrate", '0', '-1' ],
        [ "guile", "deceit or trickery", '0', '-2' ],
        [ "gregarious", "outgoing, sociable" ]
      ]
    }
    words = parse_words_raw(words_raw['values'])
  }
  else if (reparse) {
    console.log('reparse words')
    const all_words = [].concat(words[0], words[1], words[2], words[3])
    words = [0, 1, 2, 3].map(t => {
      let wordt = all_words.filter(w => w.fam == t)
      wordt.sort(word_cmp)
      return wordt
    })
  }

  update_welcome_stats()
  switchview('welcome')

  console.log('main done')
}

// @param raw: the json returned by the get_entire_sheet API
// @return a two dim array A[][], where A [i = 0..3 ] is the sorted list
//   of words of familiarity level i
//   each word is an object {
//     key, value, fam(0..3), 
//     timestamp(last used, UNIX format)
//     sheetrow(the row in the google sheet)
//   }
function parse_words_raw(raw) {
  let ret = [[], [], [], []]
  
  // filter by each familiarity tier
  for (i = 1 /* skip title row*/; i < raw.length; i++) {
    const key = raw[i][0]
    const value = raw[i][1]
    const fam = ((f) => {
      if (f == '0') return 0
      else if (f == '1') return 1
      else if (f == '2') return 2
      else if (f == '3') return 3
      else return 0 // defaults to new for invalid fam 
    })(raw[i][2])
    const timestamp = parseInt(raw[i][3]) || 0  // defaults to the oldest

    ret[fam].push({
      key: key,
      value: value,
      fam: fam,
      timestamp: timestamp,
      sheetrow: i+1, /* google sheet is 1 indexed */
    })
  }

  for (i = 0; i < 4; i++) {
    ret[i].sort(word_cmp)
  }

  console.log('words_raw = ', JSON.stringify(raw))
  console.log('words = ', ret)
  return ret
}

// sort each tier by timestamp
// older/smaller timestamp first
function word_cmp(word1, word2) {
  if (word1.timestamp < word2.timestamp) return -1
  else if (word1.timestamp == word2.timestamp) return 0
  return 1
}

// updates the number of familiar, meh, unfamiliar, new words
// based on the global words[][]
function update_welcome_stats() {
  [0, 1, 2, 3].map((i) => {
    const stat = document.getElementById('stat' + i).firstElementChild
    stat.innerText = words[i].length
  })
}

// edit div interactions
edit_word_list_button.onclick = function() {
  switchview('edit')
  setTimeout(function() {
    if (current_view == 'edit')
      open_share_sheet_link()
  }, 3500)
}
edit_done_button.onclick = function() {
  main({pull_words: true})
};
edit_link_button.onclick = open_share_sheet_link

// flashcard interactions
finish_early_button.onclick = flashcard_deinit
flashcard_button.onclick = flashcard_init
function flashcard_init() {
  switchview('flashcard')

  function get_words_from_tier(i) {
    const howmany = Math.round(TIER_WEIGHTS[i] / TOTAL_WEIGHT * NWORKING_WORDS)
    return words[i].slice(0, howmany) // shallow copy: each word has unique ref
  }
  let working_words = [].concat(
    get_words_from_tier(0),
    get_words_from_tier(1),
    get_words_from_tier(2),
    get_words_from_tier(3)
  )
  console.log('working words = ', working_words)

  function next_word() {
    if (working_words.length == 0) {
      flashcard_deinit()
    }
    else {
      const i = randint(working_words.length)
      const word = working_words[i]

      word.timestamp = Date.now()
      hide_cardback()
      set_cardfront(word, working_words.length)
      show_def_controller()
      function pronounce() {
        if (ENABLE_AUDIOAPI)
          tts(word.key)
      }
      pronounce()
      cardfront_speak.onclick = pronounce

      let has_shown_def = false
      // show definition
      show_def_button.onclick = function() {
        if (!has_shown_def) {
          blink_fam_button(show_def_button, function() {
            show_cardback(word)
            set_keepas_familiarity(fam_num_to_str(word.fam))
            show_fam_controller()
            has_shown_def = true
          })
        }
      }

      // keep familiarity as is
      fam_buttons[0].onclick = function() {
        if (has_shown_def) {
          blink_fam_button(fam_buttons[0], function() {
            // update timestamp only
            edit_sheet_cells('D'+word.sheetrow, 'D'+word.sheetrow, [
              [word.timestamp]
            ])
            next_word()
          })
        }
      }

      // change familiarity
      function hof_fam_onclick(i) {
        return function() {
          if (has_shown_def) {
            blink_fam_button(fam_buttons[i], function() {
              word.fam = i
              // update familiarity and timestamp
              edit_sheet_cells('C'+word.sheetrow, 'D'+word.sheetrow, [
                [i, word.timestamp]
              ])
              next_word()
            })
          }
        }
      }
      for (t = 1; t <= 3; t++) 
        fam_buttons[t].onclick = hof_fam_onclick(t)

      // remove from batch
      fam_buttons[4].onclick = function() {
        if (has_shown_def) {
          blink_fam_button(fam_buttons[4], function() {
            working_words = working_words.filter(w => w.sheetrow != word.sheetrow)
            // update timestamp only
            edit_sheet_cells('D'+word.sheetrow, 'D'+word.sheetrow, [
              [word.timestamp]
            ])
            next_word()
          })
        }
      }

      // bind keys
      document.onkeyup = function(e) {
        if (current_view == 'flashcard') {
          keycode = e.which
          if (keycode == char_to_keycode(' ')) {
            if (has_shown_def) fam_buttons[0].onclick()
            else show_def_button.onclick()
          } 
          else if (keycode == char_to_keycode('1')) {
            fam_buttons[1].onclick()
          }
          else if (keycode == char_to_keycode('2')) {
            fam_buttons[2].onclick()
          }
          else if (keycode == char_to_keycode('3')) {
            fam_buttons[3].onclick()
          }
          else if (keycode == char_to_keycode('x')) {
            fam_buttons[4].onclick()
          }
        }
      }
    }
  }
  next_word()
}
function flashcard_deinit() {
  main({reparse: true})
  document.onkeyup = function(){}
}





main({pull_words: true})
