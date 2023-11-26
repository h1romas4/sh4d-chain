# Pattern Chainer for Roland SH-4d

![](https://github.com/h1romas4/sh4d-chain/workflows/Build/badge.svg)

This is a simple sequencer to chain play patterns on the Roland SH-4d.
It operates based on the MIDI clock of SH-4d on a web browser.

## Usage

### Web Browser

Requires a Chromium-based browser such as Microsoft Edge for Web MIDI API.
(I have checked the security policy to make sure it works with Firefox)

### SH-4d Settings

- SYSTEM SETTINGS - TEMPO/SYNC - Sync Out - USB
- SYSTEM SETTINGS - MIDI - Ctrl Ch - 16

### Link to application

[https://h1romas4.github.io/sh4d-chain/](https://h1romas4.github.io/sh4d-chain/)

[![](https://github.com/h1romas4/sh4d-chain/raw/main/assets/images/sh4d-chain-01.png)](https://h1romas4.github.io/sh4d-chain/)

[![](https://github.com/h1romas4/sh4d-chain/raw/main/assets/images/sh4d-chain-02.png)](https://h1romas4.github.io/sh4d-chain/)

## Demo

[https://twitter.com/h1romas4/status/1728675955554848963](https://twitter.com/h1romas4/status/1728675955554848963)

## Develop

```
git clone https://github.com/h1romas4/sh4d-chain
cd sh4d-chain
npm install
npm run dev
```
## License

MIT License
