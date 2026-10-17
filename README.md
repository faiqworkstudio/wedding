# For you

A small, hand-built love letter for the web: one red thread, two lights, and the story between them.

As she scrolls, a red thread grows from your light to hers, draws a heart at the moment you knew,
and pulls the two of you closer chapter by chapter. Each light has its own heartbeat. Through the
vows the two heartbeats are coupled (Kuramoto-style) until they beat in sync. At the end she
presses and holds to **tie the knot**: the thread becomes a real trefoil knot, flares, then unravels
into thousands of stars that write her name. Then the countdown to the wedding, and a sealed letter.

The music is a little music box composed in code and played live with the Web Audio API
(I–iii–vi–IV in F). No audio file needed, though you can drop in your own song.

## Two versions

| URL | Version |
| --- | --- |
| `/` | **The red thread**: a red thread of fate, a heart, a trefoil knot, a music box |
| `/islamic` | **The Islamic version**: same craft, rebuilt around a nikah |

The Islamic version opens with the Bismillah and the decree written fifty thousand years before creation
(Sahih Muslim 2653). The golden thread draws a mihrab arch around Ar-Rum 30:21, and Al-Baqarah 2:187
("they are a garment for you…") follows later. At the end she holds three times for *Qubool hai*,
which ties the thread into an eight-pointed star drawn as one unbroken line. The star then dissolves into
her name in Urdu script (آفرین), followed by the Prophet's ﷺ dua for the newly married, the countdown
to the nikah and the letter. Instead of instruments, a soft "night air" ambience plays; you can add a
nasheed or recitation via `song`, or set `sound: 'none'`.

## Make it yours

Everything personal is in **`js/config.js`** (and **`islamic/config.js`** for the Islamic version): names, the day you met, the wedding date, the chapters,
the small things, the vows, the letter. Edit the words and the page rewrites itself.

- `photo: 'assets/first.jpg'` on a chapter adds a small tilted print (put the images in `assets/`).
- `song: 'assets/our-song.mp3'` replaces the music box with your song.
- Add or remove chapters freely. The heart forms on the second chapter (or the first if there's only one).

## Run it

It's static files and needs no build step. Serve the folder (ES modules don't load from `file://`):

```sh
python3 -m http.server 8000
# open http://localhost:8000          (red thread)
# open http://localhost:8000/islamic  (Islamic version)
```

Three.js is vendored in `vendor/three` so it runs offline, at the venue or wherever you show it.
To publish, push to GitHub Pages / Netlify / Vercel as a static site.

Add `?debug` to the URL to get `window.scene` in the console for tuning.

## Files

```
index.html        structure
css/style.css     typography, grain, layout, the hold button, envelope and letter
js/config.js      ← your words (red thread version)
islamic/          the Islamic version: index.html, islamic.css, config.js ← its words
js/main.js        boot(config, theme): content, scroll → story, hold-to-tie, countdown, letter
js/scene.js       Three.js: themes, the thread, the two heartbeats, heart/arch, knot/star, her name in stars
js/music.js       Web Audio music box, or soft ambience
```

Tips for the moment: phone in portrait, sound on, brightness up, lights low.
