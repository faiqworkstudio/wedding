# For you

A small, hand-built love letter for the web: one red thread, two lights, and the story between them.

As she scrolls, a red thread grows from your light to hers, draws a heart at the moment you knew,
and pulls the two of you closer chapter by chapter. Each light has its own heartbeat. Through the
vows the two heartbeats are coupled (Kuramoto-style) until they beat in sync. At the end she
presses and holds to **tie the knot**: the thread becomes a real trefoil knot, flares, then unravels
into thousands of stars that write her name. Then the countdown to the wedding, and a sealed letter.

The music is a little music box composed in code and played live with the Web Audio API
(I–iii–vi–IV in F). No audio file needed, though you can drop in your own song.

## Make it yours

Everything personal is in **`js/config.js`**: names, the day you met, the wedding date, the chapters,
the small things, the vows, the letter. Edit the words and the page rewrites itself.

- `photo: 'assets/first.jpg'` on a chapter adds a small tilted print (put the images in `assets/`).
- `song: 'assets/our-song.mp3'` replaces the music box with your song.
- Add or remove chapters freely. The heart forms on the second chapter (or the first if there's only one).

## Run it

It's static files and needs no build step. Serve the folder (ES modules don't load from `file://`):

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Three.js is vendored in `vendor/three` so it runs offline, at the venue or wherever you show it.
To publish, push to GitHub Pages / Netlify / Vercel as a static site.

Add `?debug` to the URL to get `window.scene` in the console for tuning.

## Files

```
index.html        structure
css/style.css     typography, grain, layout, the hold button, envelope and letter
js/config.js      ← your words
js/main.js        content, scroll → story mapping, hold-to-tie, countdown, letter
js/scene.js       Three.js: the thread, the two heartbeats, the knot, her name in stars
js/music.js       Web Audio music box
```

Tips for the moment: phone in portrait, sound on, brightness up, lights low.
