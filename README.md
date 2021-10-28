# 204 Final Project - Vocabulary Builder

## Overview

This is a flashcard application that helps the user to memorize vocabulary. The vocabulary is organized into 4 tiers of **familiarity**: `familiar`, `meh`, `unfamiliar`, and `new`. The flashcard mode is the main feature and it will extract least recently visited (LRU) words from each familiarity tier every time the user wants to memorize words. 

## Usage

Upon entering the app, the user will be greeted with a **welcome** screen that displays the number of words in each familiarity tier. 

Below everything is a `Start Memorize`  button, which upon clicking will enter the flashcard mode. In this mode, a **batch** of 20 words will be extracted from all familiarity tiers in total, with a fixed distribution: 

- 40% from `New`

- 30% from `Unfamiliar`

- 20% from `Meh`

- 10% from `Familiar` 

Words that are least recently visited will be more likely to be included in the **batch**.

The flashcard mode thus aims at memorizing all words in this **batch** of words. The flashcard mode works as a **loop**, with each **iteration** randomly choosing one word from the batch. The user will be prompted with the word itself but not its meaning, which the user should try to recall. The user can then press `space` (or click a button) to show the meaning in order to verify if she/he is correct. Then the user can decide a couple of things:

- Change the word’s familiarity tier (press `1`, `2`, or `3`) 
- Keep the word’s familiarity tier (press `space`)
- Remove the word from the batch (press `x`)

The aforementioned **loop** will stop when the batch is empty (i.e. all words are removed). Note: marking a word as familiar doesn't remove the word from the batch so it will appear again in the memorization mode.

The user can at any time finish this batch before the batch is cleared by clicking `Finish Early` button in the upper right corner.

## Edit Word List

The default word list is a top 200 GRE word list. The word list can be appended/modified/replaced by directly editing the backend Google Sheet by clicking the `Edit Word List` button in the welcome page. 

People might wonder why the app does not support editing the word list within the app itself. The reason is that our app aims at *focusing on one thing and doing one thing well*, and that thing is the **flashcard mode**. Editing the word list is very well backed up by Google Sheet, which is a specialized sheet editing software that supports many powerful features such as csv import and export, which is useful in importing externel word lists and use migration.

## API used

### Google Sheet API

We use a Google Sheet to store the word list. Each word is its own row. For each word, we store its *meaning*, *familiarity tier*, and a last-used *timestamp*. **AJAX calls are used when updating each word’s familiarity tier and timestamp.**

### Google OAuth2 API

We use a Google service account to read/modify our backend Google Sheet in *javascript*, where Google OAuth2 API is needed for authentication of our account. One of our scripts `auth.js` encapsulates all authentication features and only exports one function `get_access_token` which is needed in reading/modifying the Google Sheet. 

Note that `auth.js` is a *generated* file. The Google OAuth2 API requires `RSA-SHA256` signing, and we didn’t found any reliable RSA-SHA256 algorithms in browser javascript. However, there is a `node.js` module called `crypto` that supports RSA-SHA256. Hence we have to use this `node.js` module in browser javascript. This would not be possible by default, but there is a program called `browserify` that translates `node.js` modules into pure javascript that can be run in the browser. 

All in all, `auth.js` is compiled by `browserify`. The original code before the compilation is called `tmp.js` which we have included in the repo as well.

### Gstatic

This is Google’s content delivery service which we use to extract pronunciations’ of English words.

## Team

| Name       | WUSTL ID |
| ---------- | -------- |
| York Liu   | yorkliu  |
| Sherry Shi | shi.yu   |

