# Firefox X Media Fix

Temporary userscript workaround and technical investigation for an X/Twitter media layout bug in Firefox where some image wrappers collapse to almost zero width and the post shows a black/empty media area.

**Original WebCompat report, reproduction, investigation, and width-collapse diagnosis by [@richi0202](https://github.com/richi0202).**

## Upstream tracking

- Original report: [webcompat/web-bugs#231657](https://github.com/webcompat/web-bugs/issues/231657), opened by [@richi0202](https://github.com/richi0202) and later moved to Mozilla Bugzilla
- Mozilla WebCompat report: [Bug 2063532](https://bugzilla.mozilla.org/show_bug.cgi?id=2063532)
- Underlying Gecko flexbox bug: [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502)

## Current status

As of 2026-08-15:

- X deployed a site-side mitigation for the affected layout on 2026-08-14.
- Mozilla is still tracking the underlying Firefox/Gecko behavior separately in [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502), under **Core :: Layout: Flexbox**.
- Mozilla has a reviewed Gecko patch attached to that still-open bug: **Make stretched cross-size computation earlier so it affects percentages.**
- The userscript in this repository remains a user-side fallback and a record of the original real-world investigation. It is not a Firefox or X patch.

## Investigation timeline

- **2026-08-14:** [@richi0202](https://github.com/richi0202) opened [WebCompat #231657](https://github.com/webcompat/web-bugs/issues/231657) after reproducing the failure in Firefox and a fresh Firefox profile while the same post rendered normally in Chromium.
- During that investigation, the media resource itself was confirmed to load correctly. The visible failure was narrowed to an inner media/flex branch collapsing from a roughly 598px-wide parent to about 1.95px and eventually about 0.283px wide while retaining its height.
- Forcing the collapsed wrapper to `width: 100%`, `min-width: 100%`, and `flex-basis: 100%` made the image appear immediately without reloading the media resource. That finding became the basis of this userscript.
- WebCompat reproduced the logged-in issue in Firefox Release and Nightly, but not Chrome, and moved the report to [Bug 2063532](https://bugzilla.mozilla.org/show_bug.cgi?id=2063532).
- Mozilla contributors reduced the page to standalone testcases. [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502) became the platform bug for the underlying `aspect-ratio`, percentage sizing, `min-width: 0`, and nested flexbox behavior.
- The workaround in this repository was also tested against the separate `rabbit_wealth` reproduction from Bug 2063502. It restored the images and slideshow even though it takes a different approach from the `min-width: auto` workaround reported there.
- Mozilla layout developers concluded the reduced behavior is a Gecko bug and began work on an engine-level fix. X separately deployed a site-side mitigation on 2026-08-14.

## What this fixes

On some X image posts in Firefox, the image resource itself loads and decodes successfully, but an inner flex/media wrapper collapses to almost zero width. The post keeps its height, so the media area looks black or empty.

Observed on the original affected reproduction:

```text
598.33px parent
  -> 1.95px child
  -> 0.283px media descendants
```

On a working comparison post in the same Firefox installation, the equivalent media branch stays around 442 to 444px wide.

The tested workaround restores the collapsed wrapper to the available width. The image then appears immediately without changing or reloading the media URL.

## Validated cases

The userscript was verified against more than one real-world X layout:

1. Original reproduction from WebCompat #231657:
   https://x.com/TheOmniLiberal/status/2085153460966633725

   The missing media became visible immediately after the collapsed wrapper was repaired.

2. Separate reproduction from Bug 2063502:
   https://x.com/rabbit_wealth/status/2087660744238383185

   The images displayed normally and the slideshow worked as expected with the userscript enabled.

This second case uses the same general width-collapse failure but the workaround here is different from the `min-width: auto` CSS workaround documented in Bug 2063502. This script detects the media branch after it has collapsed and repairs that branch only.

## Reproduction

Original affected post:

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

- direct `pbs.twimg.com/media/...` URLs render normally in Firefox;
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

## Contributing

If you can reproduce the underlying bug on another Firefox version, operating system, or media/flex layout, please open an issue with:

- Firefox version
- operating system
- affected URL or standalone testcase
- whether Chromium behaves differently
- whether the userscript fixes it

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Credit

Original WebCompat report, real-world reproduction, DOM comparison, width-collapse diagnosis and measurements, and user-side workaround: **[@richi0202](https://github.com/richi0202)**.

Mozilla/WebCompat contributors subsequently produced reduced standalone testcases, connected the failure to the underlying Gecko flexbox behavior, and are working on the browser-engine fix. See [Bug 2063532](https://bugzilla.mozilla.org/show_bug.cgi?id=2063532) and [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502) for the upstream investigation and contributor history.

## License

MIT. See [LICENSE](./LICENSE).
