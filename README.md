# termshare

## Introduction

Share terminal sessions over HTTP.

## Installing

```
git clone https://github.com/tdammers/termshare
cd termshare
stack install
```

## Basic usage

Start a terminal session with GNU `script` and run it into a session file:

```
script --flush --append session
```

Then, in another terminal, tail that file into termshare:

```
tail -f session | PORT=12345 termshare
```

Now open `http://localhost:12345` in your browser. Anything that happens in the
first terminal appears in your browser.
