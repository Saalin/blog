---
date: "2023-12-18"
title: "Building own Static Site Generator"
---

# Building own Static Site Generator

Welcome at my very own blog site. There are plenty of decent static site generators available, such as Jekyll or Hugo, but many developers suffers from [not invented here syndrome](https://en.wikipedia.org/wiki/Not_invented_here), so do I. Therefore, I decided to create simple script on my own. Sources are avaiable at [GitHub](https://github.com/Saalin/blog).

## Stack

It wouldn't be surprising if, as .NET developer, I took .NET stack for this project, yet I decided to write this in NodeJS. The reason is simple - there are many more good web libraries avaibale in NPM than on Nuget. In .NET I would have to write many things from the scratch and I wanted to create MVP as fast as possible. As a deployment stack I chose Netlify, works out-of-the-box, the deployment process is handled by Netlify. The site is secured by CloudFlare, also maling to this domain is handled by CF that is redirecting e-mails to my personal mailbox.

## Current functionalities

* support for Markdown in posts and pages
* support for LaTeX ([Katex.js](https://katex.org/))
* syntax highliting ([Prism.js](https://prismjs.com/))
* `favicon.png`, `robots.txt`
* `sitemap.xml`
* comments (with [utteranc.es](https://utteranc.es/))

## Plans for future

It's not generic, I won't recommend using it anywhere else. The only things that are missing for my use case is multi-language support (as I want to write some things in Polish) and tags support. Probably it will mean code refactor in the meantime, now it's rather big ball of mud than properly written piece of code (even though with about 160 lines of code it's easy to understand). Also, I probably need to look a bit at SSO related things.