# Contributing

Thanks for helping test this Firefox/X media-layout issue.

## Useful reports

Please include:

- Firefox version
- operating system
- affected X post URL (safe/public examples preferred)
- whether the same post works in Chromium/Brave
- whether `firefox-x-media-fix.user.js` repairs the post
- a screenshot if possible

If you inspect the DOM, the most useful measurements are the width/height of the media background element and its first several ancestors.

## Please avoid

- uploading HAR files that contain authentication/session cookies
- posting private or explicit media when a safe public reproduction is available
- filing duplicate upstream reports when the existing WebCompat issue already covers the same behavior

Canonical upstream report:

https://github.com/webcompat/web-bugs/issues/231657
