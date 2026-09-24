# Happy Birthday Kudu ♡

A complete, static birthday journey made for Meera, from Vishnu. It includes the supplied photographs, 28 sequential experiences, local progress saving, a discreet sound/menu control, and a final family surprise. Her age and the total activity count are never displayed in the journey.

## Open the website

The hosted preview is private to your account. It does not automatically grant Meera or anyone else access. Keep using the private preview until you choose how to share it.

To preview on your computer, open a terminal inside this folder and run:

```sh
python -m http.server 8000 --directory public
```

Then open http://localhost:8000. You can also open `public/index.html` directly, although serving it locally gives more consistent browser storage behaviour.

## Change your photos and words

- Website entry: `public/index.html`
- Colours, layout and animations: `public/css/style.css`
- Photograph assignments, captions, letter and short messages: `public/js/content.js`
- Games and the final birthday letter: `public/js/app.js`
- Photographs: `public/assets/images/`
- Optional music: `public/assets/audio/`

Replace a photograph with your own JPG using its existing filename. Alternatively, change its `src` in `content.js`. Update its `alt` description and caption, too. Existing photos were resized for mobile use, kept in their original proportions, and stripped of embedded metadata; faces were not retouched. Full photo views use contain sizing, so people are not cropped out. The small circular music label is decorative; its complete photograph also appears elsewhere.

The family captions are deliberately neutral: the supplied photos do not identify which relatives belong to which side. Adjust these captions if you want names or family labels. The memory timeline uses broad story headings, not invented dates or a claimed chronology of the photographs.

The main photo settings are:

| File          | Use                                 |
| ------------- | ----------------------------------- |
| memory-01.jpg | Family memory                       |
| memory-02.jpg | Romantic photograph / heart reunion |
| memory-03.jpg | Outdoor memory / coconut tree       |
| memory-04.jpg | Nursing tribute                     |
| memory-05.jpg | Celebration memory / timeline       |
| memory-06.jpg | Memory wheel portrait               |
| memory-07.jpg | Family memory                       |
| memory-08.jpg | Find Kudu portrait                  |
| memory-09.jpg | Sadhya memory                       |
| memory-10.jpg | Balloon surprise                    |
| memory-11.jpg | Opening, puzzle and closing         |
| memory-12.jpg | Shared journey memory               |
| memory-13.jpg | Scratch card                        |
| memory-14.jpg | Hidden hearts / music               |

## Add your own song or voice recording

No commercial music is included. Put a recording you own or have permission to use at `public/assets/audio/our-song.mp3`. In `content.js`, change:

```js
music: '',
```

to:

```js
music: 'assets/audio/our-song.mp3',
```

The music screen then enables play, pause and seeking. It remains completable without music. Optional bells and chimes are created locally in the browser and start only after you turn sound on. No microphone is requested; candles support press-and-hold and a single-tap alternative.

## Progress and replay

Completion and the current experience are saved using browser LocalStorage under `kudu-journey-v1`. They stay on that device/browser, not across different phones. An unfinished mini-game starts fresh after a reload, but earlier completed experiences remain unlocked. Clearing browser data clears the journey. Back navigation preserves completed experiences. Use the discreet menu to restart; it asks before resetting.

## Optional free Google Firebase Hosting

This project is ready for classic Firebase Hosting; it needs no database, server, paid API or Firebase SDK. Keep the project on the Spark plan and within its no-cost quotas. The current private preview has not been published to Firebase.

**Visibility matters:** standard static Firebase Hosting serves the website and photos publicly. An unguessable link and `noindex` do not make it private. Only take the deployment step when you are ready to make this version public. The supplied code does not add authentication.

On a computer:

1. Create a project in the [Firebase console](https://console.firebase.google.com/). Choose the Spark plan; Google Analytics is unnecessary for this website.
2. Install Node.js if needed, then install the CLI:
   ```sh
   npm install -g firebase-tools
   ```
3. Open a terminal in this folder and sign in:
   ```sh
   firebase login
   ```
4. Connect hosting:
   ```sh
   firebase init hosting
   ```
   Select your project. Choose `public` as the public directory, answer **No** to single-page rewrites (this website uses one file and no URL routing), and **No** to overwriting `index.html`. Do not set up automatic GitHub deployment. Keep the supplied `firebase.json` headers if the CLI offers to replace configuration.
5. When you have decided to publish publicly:
   ```sh
   firebase deploy --only hosting
   ```
   The CLI prints your `web.app` address. After later edits, run the same deployment command again.

Google's official [Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart) documents setup and deployment. Its [Hosting quotas guide](https://firebase.google.com/docs/hosting/usage-quotas-pricing) explains the no-cost allowance and Spark behaviour when usage exceeds it. Check these pages for current limits.

## Privacy and compatibility

The app uses no analytics, advertising, remote fonts, third-party scripts, cookies or external image services. Assets are served from the same website. The app stores only local journey progress and sound preference. Hosting providers still perform their normal delivery and access functions. The private host may require account sign-in independently of this static code.

The website requests search engines not to index it. This is an indexing preference, not an access control.

Designed for Android Chrome, iPhone Safari and desktop browsers. Games support touch and keyboard/tap alternatives, have gentle hints, and respect reduced-motion preferences. The final Junior chapter is revealed only at the end of the ordinary visitor journey. As with any static website, its source code and bundled assets contain the full story.
