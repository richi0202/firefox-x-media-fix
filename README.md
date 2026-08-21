# Firefox X Media Fix

Temporary userscript workaround and technical investigation for an X/Twitter media layout bug in Firefox where some image or video carousel wrappers collapse to almost zero width and the post shows a black/empty media area.

**Independent WebCompat report, reproduction, investigation, width-collapse diagnosis, and userscript workaround by me, [@richi0202](https://github.com/richi0202).**

## Upstream tracking

- Independent WebCompat report: [webcompat/web-bugs#231657](https://github.com/webcompat/web-bugs/issues/231657), opened by me and later moved to Mozilla Bugzilla
- Earlier Gecko/X report: [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502), filed by Alice0775 with a separate `min-width: auto` workaround
- Mozilla WebCompat report created from my WebCompat report: [Bug 2063532](https://bugzilla.mozilla.org/show_bug.cgi?id=2063532)

## Current status

As of 2026-08-19:

- X deployed a site-side mitigation for the affected layout on 2026-08-14.
- Mozilla resolved the underlying Gecko flexbox bug, [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502), as **FIXED** for Firefox 156. The engine fix is **Make stretched cross-size computation earlier so it affects percentages.**
- Mozilla marked Firefox 154, Firefox 155, ESR 115, ESR 140, and ESR 153 as `wontfix` for this bug, so the engine fix is not currently planned for backport to those branches.
- The original logged-in X reproduction from [Bug 2063532](https://bugzilla.mozilla.org/show_bug.cgi?id=2063532) has been verified working in the latest Nightly.
- [Issue #2](https://github.com/richi0202/firefox-x-media-fix/issues/2) reported additional failures on Firefox 115.39.0esr on Windows 7. I independently reproduced the same media-width collapse using Firefox 115.39.0esr 64-bit on Windows 10 in a clean test profile, showing that Windows 7 is not required to reproduce the failure. Version 1.0.1 repairs all three reported reproduction URLs in my Windows 10 testing.

## Investigation timeline

- **2026-08-14:** I independently opened [WebCompat #231657](https://github.com/webcompat/web-bugs/issues/231657) after reproducing the failure in Firefox and a fresh Firefox profile while the same post rendered normally in Chromium. An earlier Bugzilla report, [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502), had been filed by Alice0775 about 1 hour 49 minutes earlier with a separate `min-width: auto` workaround.
- During my WebCompat investigation, I independently narrowed the visible failure to an inner media/flex branch collapsing from a roughly 598px-wide parent to about 1.95px and eventually about 0.283px wide while retaining its height.
- I confirmed that the media resource itself was loading correctly, then found that forcing the collapsed wrapper to `width: 100%`, `min-width: 100%`, and `flex-basis: 100%` made the image appear immediately without reloading the media resource. That finding became the basis of this userscript.
- WebCompat reproduced my logged-in case in Firefox Release and Nightly, but not Chrome, and moved the report to [Bug 2063532](https://bugzilla.mozilla.org/show_bug.cgi?id=2063532).
- Mozilla contributors reduced the page to standalone testcases. [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502) became the platform bug for the underlying `aspect-ratio`, percentage sizing, `min-width: 0`, and nested flexbox behavior.
- I later tested the userscript against the separate `rabbit_wealth` reproduction from Bug 2063502. It restored both the images and slideshow despite using a different repair approach from Alice0775's `min-width: auto` workaround.
- Mozilla layout developers concluded the reduced behavior is a Gecko bug. The first landing was backed out after test failures, then the corrected fix landed in mozilla-central and Bug 2063502 was resolved **FIXED** for Firefox 156. Older release and ESR branches were marked `wontfix`. X separately deployed its site-side mitigation on 2026-08-14.
- **2026-08-19:** Issue #2 exposed another affected X media layout on Firefox 115.39.0esr. I reproduced the failures independently on Windows 10 using the same Firefox version and a clean test profile. One video case collapsed from an approximately 598px-wide `ScrollSnap-List` parent to a roughly 2px-wide presentation wrapper, matching the same general width-collapse failure but without the `pbs.twimg.com/media` background structure used by the original v1.0.0 detector.
- I expanded the userscript to detect collapsed X carousel presentation wrappers containing image or video media directly. The updated version repaired all three issue #2 reproductions, including slideshow navigation, while avoiding the full-document computed-style scan used by v1.0.0.

## What this fixes

On some X image or video posts in Firefox, the media resource itself can be available while an inner flex/media wrapper collapses to almost zero width. The post keeps its height, so the media area looks black or empty.

Observed on the original affected reproduction from my WebCompat report:

```text
598.33px parent
  -> 1.95px child
  -> 0.283px media descendants
```

On a working comparison post in the same Firefox installation, the equivalent media branch stays around 442 to 444px wide.

A later Firefox 115.39.0esr video reproduction from issue #2 showed the same general geometry failure with an approximately 598px-wide `ScrollSnap-List` parent and a roughly 2px-wide presentation wrapper.

The tested workaround restores the collapsed wrapper to the available width. The media then appears without requiring the collapsed branch to remain near-zero width.

## Validated cases

I verified the userscript against more than one real-world X layout:

1. My WebCompat #231657 reproduction:
   https://x.com/TheOmniLiberal/status/2085153460966633725

   The missing media became visible immediately after the collapsed wrapper was repaired.

2. Separate reproduction from Bug 2063502:
   https://x.com/rabbit_wealth/status/2087660744238383185

   The images displayed normally and the slideshow worked as expected with the userscript enabled.

3. Firefox 115.39.0esr cases from issue #2:

   https://x.com/Maks_NAFO_FELLA/status/2090119570988187677

   https://x.com/Maks_NAFO_FELLA/status/2090090578989973950

   https://x.com/Maks_NAFO_FELLA/status/2090030688581898595

   I reproduced the media failure while logged into X using Firefox 115.39.0esr 64-bit on Windows 10 in a clean test profile. Version 1.0.1 repaired all three cases. Image/slideshow navigation also continued working during repeated testing.

The earlier cases use the same general width-collapse failure, but my workaround is different from the `min-width: auto` CSS workaround documented in Bug 2063502. My script detects the media branch after it has collapsed and repairs that branch only.

## Reproduction

Original affected post from my WebCompat report:

https://x.com/TheOmniLiberal/status/2085153460966633725

Working comparison:

https://x.com/Awk20000/status/2088009701476995124

Test environment used for my original investigation:

- Windows 10
- Firefox 153.0.4
- Brave/Chromium renders the affected post normally
- Reproduced in a fresh Firefox profile

Additional version 1.0.1 validation environment:

- Windows 10 19044
- Firefox 115.39.0esr 64-bit
- Clean dedicated Firefox profile
- Logged into X
- No `user.js` preference overrides

## Install the workaround

This script is designed for Tampermonkey or Violentmonkey.

1. Install Tampermonkey or Violentmonkey in Firefox.
2. Open [`firefox-x-media-fix.user.js`](./firefox-x-media-fix.user.js).
3. Use your userscript manager's install/create-script flow and paste the file contents.
4. Save the script and reload X.

The script only runs on `x.com` / `twitter.com`, only activates in Firefox, and only changes a media wrapper when all of these conditions are met:

- it is an X `ScrollSnap-List` presentation wrapper containing image or video media;
- the wrapper is under 10px wide;
- its parent is over 100px wide;
- the wrapper is tall enough to look like actual media rather than a tiny UI element.

Normal media that already has a valid width is left alone.

## uBlock Origin alternative (community-provided, untested)

In [issue #4](https://github.com/richi0202/firefox-x-media-fix/issues/4), [@dev31337](https://github.com/dev31337) contributed the following uBlock Origin filter and reported that it completely fixes the problem on Firefox 115.39 ESR on Windows 7:

```text
x.com,twitter.com##div[data-testid="ScrollSnap-List"] > div[role="presentation"]:has([data-testid="tweetPhoto"], video, img):style(width: 100% !important; min-width: 100% !important; flex-basis: 100% !important;)
```

This filter has **not been independently tested by me** and is not maintained as part of the userscript. It is included here as a community-provided alternative for users who prefer uBlock Origin instead of a userscript manager.

There is an important behavioral difference between this filter and the userscript. The uBlock Origin rule applies the `width: 100%`, `min-width: 100%`, and `flex-basis: 100%` override whenever that matching X media structure is present. The userscript is more selective: it first checks whether the media wrapper has actually collapsed, whether its parent has a usable width, and whether the wrapper has enough height to look like real media before applying the repair.

Because the uBlock Origin rule does not perform those geometry checks, it is broader and could potentially affect legitimate X media layouts that the userscript would leave unchanged. X DOM changes could also cause the filter to stop matching or behave differently in the future.

## Why this is not a blanket CSS override

A global rule such as `width: 100% !important` on X media containers could break legitimate layouts. This userscript instead detects the same geometry failure I found during the investigation and repairs only the collapsed X carousel presentation wrapper.

It also listens for X's dynamically inserted content, so newly loaded posts can be repaired while scrolling.

## Investigation summary

My original debugging ruled out several common causes:

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

The Firefox 115 ESR follow-up showed that not every affected X layout exposes the same `pbs.twimg.com/media` background structure. Version 1.0.1 therefore detects the collapsed carousel presentation wrapper directly while retaining the same geometry checks.

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

I independently filed the WebCompat report, reproduced the real-world failure, compared the DOM/layout behavior, measured the width collapse, and built the reusable userscript workaround documented in this repository.

The earlier Bugzilla report and `min-width: auto` workaround were filed by **Alice0775** in [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502). Mozilla/WebCompat contributors later produced reduced standalone testcases, connected the failure to the underlying Gecko flexbox behavior, and landed the browser-engine fix for Firefox 156. See [Bug 2063532](https://bugzilla.mozilla.org/show_bug.cgi?id=2063532) and [Bug 2063502](https://bugzilla.mozilla.org/show_bug.cgi?id=2063502) for the upstream investigation and contributor history.

The untested uBlock Origin alternative documented above was contributed by [@dev31337](https://github.com/dev31337) in [issue #4](https://github.com/richi0202/firefox-x-media-fix/issues/4).

## License

MIT. See [LICENSE](./LICENSE).
