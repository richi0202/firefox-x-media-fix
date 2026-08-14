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
- the branch contains an X media background URL;
- the candidate element is less than 10px wide;
- the parent is more than 100px wide;
- the candidate has substantial media-like height.

This is intended to match the geometry observed in the bug while leaving normal X media alone.

## Current interpretation

The evidence supports a Firefox/X web-compatibility layout failure involving X's media/flex wrapper structure. The investigation does not by itself prove whether the underlying defect belongs to Gecko layout behavior, X's CSS/component logic, or an interaction between the two.
