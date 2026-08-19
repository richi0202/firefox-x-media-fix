# Changelog

## 1.0.1 - 2026-08-19

- Expanded the workaround to cover X video/media carousel layouts that do not expose a `pbs.twimg.com/media` background image.
- Changed detection to target collapsed `ScrollSnap-List` presentation wrappers containing X media.
- Reproduced the issue independently on Firefox 115.39.0esr 64-bit on Windows 10 using a clean test profile.
- Verified that the three reproduction URLs reported in issue #2 are repaired by the updated userscript, including slideshow/carousel navigation.
- Reduced repeated scanning overhead by removing the full-document `querySelectorAll("*")` plus `getComputedStyle()` media search used in 1.0.0.
- Kept the repair conditional on the same collapsed-width geometry so normal-width media wrappers are left unchanged.

## 1.0.0 - 2026-08-14

- Initial public workaround for the Firefox/X media-width collapse.
- Added conditional geometry detection so normal-width media is left untouched.
- Added MutationObserver support for dynamically loaded X posts.
- Added technical investigation and reproduction notes.
- Linked canonical WebCompat report #231657.
- Successfully validated the packaged userscript against the affected reproduction in Firefox.
