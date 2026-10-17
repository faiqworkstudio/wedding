/*
 * ───────────────────────────────────────────────────────────────
 *  Everything personal lives in this file.
 *  Change the words and dates and the whole piece rewrites itself.
 *  No need to touch any other file unless you want to.
 * ───────────────────────────────────────────────────────────────
 */

export const CONFIG = {
  // Her name is the one the stars spell out at the very end.
  her: 'Amara',
  you: 'Faiq',

  // ISO dates (YYYY-MM-DD). `met` drives the "days" counter,
  // `wedding` drives the final countdown (or "day N of forever" once it passes).
  met: '2021-03-14',
  wedding: '2026-12-12',

  // Optional: path to your song (e.g. 'assets/our-song.mp3').
  // Leave null and a small music-box melody is played live in the browser.
  song: null,

  gate: {
    kicker: 'for you, and only you',
    title: 'I made you something',
    hint: 'headphones on · tap anywhere to begin',
  },

  opening: [
    'There are about eight billion people on this planet.',
    'Somehow, one thread found its way from me to you.',
  ],

  chapters: [
    {
      number: 'I',
      title: 'The first time',
      meta: 'March 14 · a café that smelled of cardamom',
      body:
        'You laughed at something I didn\'t mean to be funny, and I spent the rest of the night trying to make it happen again. I didn\'t know yet. My heart did.',
      // Optional photo shown as a little print. e.g. 'assets/first.jpg'
      photo: null,
    },
    {
      number: 'II',
      title: 'The moment I knew',
      meta: 'a Tuesday, of all days',
      body:
        'Nothing dramatic. You were reading, pushing your hair behind your ear, and I realised every future I could picture had you standing somewhere in it.',
      photo: null,
    },
  ],

  smallThings: {
    title: 'Small things I would never want to live without',
    items: [
      'the way you say my name when you\'re half asleep',
      'cold feet, warm hands',
      'how you hum while you cook and deny it',
      'your terrible, wonderful puns',
      'the face you make right before you laugh',
      'that you always save me the last bite',
    ],
  },

  numbers: {
    title: 'Us, counted',
    // {days} is replaced live with the number of days since `met`.
    lines: [
      { value: '{days}', label: 'days since you first said hello' },
      { value: '1', label: 'person I want to annoy for the rest of my life' },
      { value: '∞', label: 'more I am not ready to stop counting' },
    ],
  },

  vows: {
    title: 'What I promise you',
    lines: [
      'I promise to choose you, on the easy days and especially on the hard ones.',
      'To listen even when I think I already know.',
      'To keep making you laugh, on purpose this time.',
      'To be your home wherever we end up.',
    ],
  },

  knot: {
    prompt: 'Hold here, with me',
    hint: 'press and hold to tie the knot',
    after: 'and just like that,',
  },

  // A longer letter, revealed from the envelope at the very end.
  // Use blank lines between paragraphs.
  letter: `My love,

I wanted to give you something that couldn't be bought, so I built it, one line at a time, the same way we've built everything.

Every animation in here took longer than it should have, because I kept stopping to think about you.

I can't wait to marry you.

Always yours,`,
};
