# Firefox X Media Fix

Temporary userscript workaround and technical investigation for an X/Twitter media layout bug in Firefox where some image wrappers collapse to almost zero width and the post shows a black/empty media area.

**Reported, reproduced, reduced, and documented by [@richi0202](https://github.com/richi0202).**

Upstream WebCompat report: [webcompat/web-bugs#231657](https://github.com/webcompat/web-bugs/issues/231657)

## What this fixes

On some X image posts in Firefox, the image resource itself loads and decodes successfully, but an inner flex/media wrapper collapses to almost zero width. The post keeps its height, so the media area looks black or empty.

Observed on the affected reproduction:

```text
598.33px parent
  -> 1.95px child
  -> 0.283px media descendants
```

On a working comparison post in the same Firefox installation, the equivalent media branch stays around 442–444px wide.

The tested workaround restores the collapsed wrapper to the available width. The image then appears immediately without changing or reloading the media URL.

## Reproduction

Affected post:

https://x.com/TheOmniLiberal/status/2085153460966633725

Working comparison:

https://x.com/Awk20000/status/2088009701476995124

Test environment used for the original investigation:

- Windows 10
- Firefox 153.0.4
- Brave/Chromium renders the affected post normally
- Reproduced in a fresh Firefox profile

## Install the workaround

This script is designed for Tampermonkey or Violentmonkey.

1. Install Tampermonkey or Violentmonkey in Firefox.
2. Open [`firefox-x-media-fix.user.js`](./firefox-x-media-fix.user.js).
3. Use your userscript manager's install/create-script flow and paste the file contents.
4. Save the script and reload X.

The script only runs on `x.com` / `twitter.com`, only activates in Firefox, and only changes a media wrapper when all of these conditions are met:

- it belongs to an X media branch containing a `pbs.twimg.com/media` background image;
- the candidate wrapper is under 10px wide;
- its parent is over 100px wide;
- the wrapper is tall enough to look like actual media rather than a tiny UI element.

Normal media that already has a valid width is left alone.

## Why this is not a blanket CSS override

A global rule such as `width: 100% !important` on X media containers could break legitimate layouts. This userscript instead detects the same geometry failure found during the investigation and repairs only the collapsed branch.

It also listens for X's dynamically inserted content, so newly loaded posts can be repaired while scrolling.

## Investigation summary

The original debugging ruled out several common causes:

- direct `pbs.twimg.com/media` URLs render normally in Firefox;
- the media elements report non-zero `naturalWidth` / `naturalHeight`;
- X creates the correct `background-image` URL;
- changing z-index, opacity, or visibility does not solve the failure;
- the same affected post works in Brave/Chromium;
- a fresh Firefox profile still reproduces it.

The decisive test was forcing the collapsed wrapper to:

```css
width: 100% !important;
min-width: 100% !important;
flex-basis: 100% !important;
```

The image appeared immediately.

See [INVESTIGATION.md](./INVESTIGATION.md) for the full technical notes.

## Status

This is a user-side workaround, not a Firefox or X patch. If Mozilla or X fixes the underlying layout problem, this project can be retired.

Follow the upstream report for triage and resolution:

[webcompat/web-bugs#231657](https://github.com/webcompat/web-bugs/issues/231657)

## Contributing

If you can reproduce the bug on another Firefox version, operating system, or X media layout, please open an issue with:

- Firefox version
- operating system
- affected X post URL (safe/public examples preferred)
- whether Chromium/Brave works
- whether the userscript fixes it

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Credit

Initial report, reproduction, DOM comparison, width-collapse reduction, and workaround validation: **[@richi0202](https://github.com/richi0202)**.

## License

MIT. See [LICENSE](./LICENSE).
