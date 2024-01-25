---
date: "2024-01-25"
title: "Problems with CH340 drivers on Windows 11"
tags: ['programming', 'embedded', 'arduino', 'esp8266']
---

# Problems with CH340 drivers on Windows 11

Recently I wanted to refresh my knowledge about embedded systems and do some "Hello worlds" for the board that I own, and I own two:
    - Cytron Maker Uno (which is basiclly Arduino Uno clone)
    - some (ESP8266 Board)[https://botland.store/esp8266-wifi-modules/8241-esp8266-wifi-module-nodemcu-v3-5904422300630.html]
  
As far as I remember everything worked great on Windows 10 (plug & play), but although I had no problems with Uno, ESP8266 board had problems with connection via serial port. Looking for solution it turned out there is some problem with CH340 drivers and after installing (these ones)[https://sparks.gogo.co.nz/ch340.html] I could connect to ESP8266 and upload some code. Unfortunately, shortly after that I noticed that now Uno can't be connected.

# Recommended solution

If you want to work with both (and probably many others) boards at the same time, just use Linux. Everything works out of the box on my Lubuntu 23.10 that I installed for purpuse of working with mentioned boards in the future. I'm too tired with fighting with Windows and on Linux I have native `avr-gcc` support.