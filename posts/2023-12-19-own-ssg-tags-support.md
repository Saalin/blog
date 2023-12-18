---
date: "2023-12-19"
title: "Adding tags support"
tags: ['programming', 'nodejs']
---

# Adding tags support to SSG

As mentioned in the previous post, one of the features that I find useful in blogs are tags. I wanted to add support for them as soon as possible, so doing it overnight seemed to be a good idea. Added features: tags page with all of the tags, each tag has its own page with list of post that are tagged with it and each post has tags info below. 

Despite that the feature works (at least is seems so), it had been developed quickly and doesn't lack of bad things: I copy-pasted one of the templates to speed up development and I added one inline CSS to template instead of modyfing SCSS source file. The source code also gives an impression that it won't be that easy to provide multiple language versions, especially if I want them to be part of URI (such as `saalin.dev/en/posts/some-post.html`). Now I'm not even sure if I really need it - maybe I should write only in English or other language should be added as separate webpage with own subdomain?