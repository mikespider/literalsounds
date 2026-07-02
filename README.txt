LITERAL SOUNDS LABS — PLUGIN WEBSITE
====================================

WHAT IS INCLUDED
- index.html                         Complete responsive website
- favicon.svg                       Browser icon
- assets/                           Optimised plugin artwork
- downloads/                        Put the plugin ZIP files here

EXPECTED DOWNLOAD FILENAMES
- PhiTreeMobiusSynth.zip
- EarthMagneticFieldFX.zip
- HeisenKaon.zip
- ImageSonicFlux.zip
- PhiDelayNetwork.zip
- MorseCodeRhythmizer.zip

You can change any filename, Payhip URL, description, feature or video URL in the
PLUGINS array near the bottom of index.html.

VIDEO PLACEHOLDERS
Each plugin has a `video: ""` field. Paste a YouTube video URL between the quotes
to replace the placeholder with a privacy-enhanced YouTube embed.

GOOGLE FORMS EMAIL GATE
The page uses the same Google Forms endpoint and email field ID as the supplied
old EMF FX page:
- Form endpoint ends in /formResponse
- Email field: entry.2054451267

The form is sent with fetch(..., mode: "no-cors"). After submission, a localStorage
flag remembers that downloads are unlocked on that browser. Only the unlock flag
is stored locally; the email itself is not stored in localStorage.

UPLOAD
Upload index.html, favicon.svg, the assets folder and the downloads folder to the
same website directory. Keep the folder names unchanged unless you also update
the paths in index.html.
