# Investigation notes

This document records the technical observations behind the workaround in this repository.

## Canonical report

WebCompat: https://github.com/webcompat/web-bugs/issues/231657

Reporter and investigator: [@richi0202](https://github.com/richi0202)

## Reproduction URLs

Affected:

https://x.com/TheOmniLiberal/status/2085153460966633725

Working comparison:

https://x.com/Awk20000/status/2088009701476995124

## Environment used during the original investigation

- Windows 10
- Firefox 153.0.4
- Brave/Chromium renders the affected post normally
- Reproduced in a fresh Firefox profile

## What was ruled out

The issue was initially investigated as a possible network/content-blocking failure. That did not explain the final symptom.

The following were verified during debugging:

- direct `pbs.twimg.com/media/...` image URLs render normally in Firefox;
- X media `<img>` elements reported `complete: true` with non-zero `naturalWidth` / `naturalHeight`;
- the visible media branch had the correct CSS `background-image` URL;
- opacity and visibility were normal on the visible background-media element;
- changing z-index did not make the image appear;
- forced-colors/high-contrast mode was not active;
- the same post works in Brave/Chromium;
- a fresh Firefox profile still reproduced the problem.

A separate EasyPrivacy/uBlock rule was found blocking an X `viewer_context.json` request and was bypassed with a narrow exception during testing, but restoring that request did not fix the black-media symptom.

## Working layout

In the working comparison post, the inner media branch retained a usable width. Representative values from the captured computed-layout dump were approximately:

```text
media layer: 443.93px
parent:      443.93px
ancestor:    442.27px
outer media: 443.93px
```

No near-zero-width collapse was present.

## Broken layout

In the affected post, the captured layout showed:

```text
level 7 parent:      598.33px
level 6 child:         1.95px
level 5 child:         1.95px
levels 4 -> 0:         0.283px
```

The inner media element still had a height of about 383px, explaining why a large media area remained visible even though the image-painting branch had effectively no width.

The transition element had classes including:

```text
css-g5y9jx r-14tvyh0 r-cpa5s6
```

Its parent was approximately:

```text
width: 598.33px
display: flex
flex: 1 1 auto
overflow-x: auto
overflow-y: hidden
```

## Decisive test

The following temporary console logic located an element that was under 10px wide while its parent was over 100px wide and forced the collapsed wrapper to fill its parent:

```js
(() => {
  const media = [...document.querySelectorAll('*')]
    .find(e => getComputedStyle(e).backgroundImage.includes('pbs.twimg.com/media'));

  let e = media;

  while (e?.parentElement) {
    const width = e.getBoundingClientRect().width;
    const parentWidth = e.parentElement.getBoundingClientRect().width;

    if (width < 10 && parentWidth > 100) {
      e.style.setProperty('width', '100%', 'important');
      e.style.setProperty('min-width', '100%', 'important');
      e.style.setProperty('flex-basis', '100%', 'important');
      break;
    }

    e = e.parentElement;
  }
})();
```

The previously black image appeared immediately without changing the image URL or reloading the media resource.

That established the width-collapse as the proximate cause of the visible failure.

## Why the userscript is conditional

A blanket X CSS override could disturb legitimate image and carousel layouts. The userscript therefore only applies the width repair when:

- Firefox is the current browser;
- the candidate is an X `ScrollSnap-List` presentation wrapper containing image or video media;
- the candidate element is less than 10px wide;
- the parent is more than 100px wide;
- the candidate has substantial media-like height.

This is intended to match the geometry observed in the bug while leaving normal X media alone.

## Firefox 115 ESR follow-up

Issue #2 provided three additional X posts that remained affected on Firefox 115.39.0esr.

I reproduced the failures independently using:

- Windows 10 19044
- Firefox 115.39.0esr 64-bit
- a clean dedicated Firefox profile
- a logged-in X session
- no `user.js` preference overrides

The three reported reproduction URLs were:

https://x.com/Maks_NAFO_FELLA/status/2090119570988187677

https://x.com/Maks_NAFO_FELLA/status/2090090578989973950

https://x.com/Maks_NAFO_FELLA/status/2090030688581898595

One affected video reproduction did not contain either a `pbs.twimg.com/media` background element or a matching `<img>` element, so version 1.0.0 did not detect it.

Inspecting the collapsed carousel showed approximately:

```text
collapsed presentation wrapper: 2px
parent presentation branch:     2px
ScrollSnap-List parent:        598px
media height:                  ~500px
```

The affected branch was a direct presentation child of X's `ScrollSnap-List` and contained video media.

This showed that the geometry failure was still present, but the original userscript's media-discovery method was too specific to image-background layouts.

Version 1.0.1 therefore targets X media carousel presentation wrappers directly and only repairs them when the same collapsed-width geometry is present.

The revised userscript repaired all three issue #2 reproduction URLs in Firefox 115.39.0esr on Windows 10, including repeated image/slideshow navigation. The two previously documented real-world reproductions were also retested successfully before the 1.0.1 release.

## Current interpretation

The evidence supports a Firefox/X web-compatibility layout failure involving X's media/flex wrapper structure. Mozilla's reduced testcases and subsequent layout investigation connected the failure to a Gecko flexbox sizing bug, which was fixed for Firefox 156. X separately deployed a site-side mitigation, but affected older Firefox branches can still encounter layouts that reproduce the underlying width-collapse behavior.
