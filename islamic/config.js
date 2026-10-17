/*
 * ───────────────────────────────────────────────────────────────
 *  The Islamic version. Everything personal lives in this file.
 *  Same engine as the main page: a golden thread, two lights,
 *  a mihrab arch, and an eight-pointed star tied with three "Qubool hai".
 * ───────────────────────────────────────────────────────────────
 */

export const CONFIG = {
  her: 'Afreen',
  you: 'Faiq',
  // What the stars write at the end: her name in Urdu / Persian script.
  starName: 'آفرین',

  met: '2021-03-14',
  wedding: '2026-12-12',
  until: 'until our nikah',

  // 'ambient' is a soft night air with no instruments.
  // Put a nasheed or recitation in assets/ and set `song` to play that instead,
  // or set sound: 'none' for silence.
  sound: 'ambient',
  song: null,

  gate: {
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    kicker: 'for you, and only you',
    title: 'I made you something',
    hint: 'headphones on · tap anywhere to begin',
  },

  opening: [
    'Fifty thousand years before the heavens and the earth, it was already written.',
    'That one day, my path would lead to you.',
  ],
  openingCite: 'the decree, Sahih Muslim 2653',

  chapters: [
    {
      number: '١',
      title: 'The first time',
      meta: 'March 14 · a day that seemed ordinary',
      body:
        'I didn\'t know yet that the person in front of me was the answer to a dua I had been making for years. Allah knew.',
      photo: null,
    },
    {
      number: '٢',
      title: 'The dua I made',
      meta: 'a quiet night, after Isha',
      body:
        'I asked Allah for someone who would bring me closer to Him. Someone kind. Someone who would feel like home. I didn\'t know I was describing you.',
      photo: null,
    },
  ],

  // The thread draws a mihrab arch while this verse is on screen.
  verses: [
    {
      arabic:
        'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً',
      english:
        'And of His signs is that He created for you, from yourselves, mates that you may find tranquillity in them; and He placed between you affection and mercy.',
      ref: 'Surah Ar-Rum · 30:21',
    },
    {
      arabic: 'هُنَّ لِبَاسٌ لَّكُمْ وَأَنتُمْ لِبَاسٌ لَّهُنَّ',
      english:
        'They are a garment for you, and you are a garment for them. A garment covers, protects, comforts and beautifies. That is what I want to be for you.',
      ref: 'Surah Al-Baqarah · 2:187',
    },
  ],

  smallThings: {
    title: 'Small things I thank Allah for',
    items: [
      'the way you say my name when you\'re half asleep',
      'your quiet "ameen" after every dua',
      'how you hum while you cook and deny it',
      'your terrible, wonderful puns',
      'the face you make right before you laugh',
      'that you always save me the last bite',
    ],
  },

  numbers: {
    title: 'Us, counted',
    lines: [
      { value: '{days}', label: 'days since you first said salaam' },
      { value: '1', label: 'person I want to walk into Jannah with' },
      { value: '∞', label: 'duas I will keep making for you' },
    ],
  },

  vows: {
    title: 'My promises to you, before Allah',
    lines: [
      'I promise to honour you, and to be gentle with your heart.',
      'To pray beside you, and to pray for you when you are not beside me.',
      'To be patient on the hard days and grateful on the easy ones.',
      'To hold your hand all the way to Jannah, in sha Allah.',
    ],
  },

  knot: {
    times: 3,
    prompt: 'Qubool hai',
    steps: ['Qubool hai', 'Qubool hai', 'Qubool hai'],
    hint: 'press and hold · three times',
    after: 'Alhamdulillah,',
  },

  dua: {
    arabic: 'بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
    english: 'May Allah bless you both, send blessings upon you, and bring you together in goodness.',
    ref: 'the Prophet\'s ﷺ dua for the newly married',
  },

  letter: `Assalamu alaikum, my love,

I wanted to give you something that couldn't be bought, so I built it, one line at a time, the same way we will build our home.

Every part of this took longer than it should have, because I kept stopping to make dua for us.

I can't wait to complete half my deen with you.

Yours, in this life and the next, in sha Allah,`,
};
