# Pattern Chainer for Roland SH-4d

![](https://github.com/h1romas4/sh4d-chain/workflows/Build/badge.svg)

This is a simple sequencer to chain play patterns on the Roland SH-4d.
Connect the pattern and treat it as a song mode.

It works based on the MIDI clock of SH-4d on a web browser, and It can work with other rhythm boxes by setting Program Change MSB/LSB.

## Usage

### Web Browser

- Chromium-based browser such as Microsoft Edge.
- Firfox

The "Install this site as an application" feature of Microsoft Edge is useful.

Safari does not work because it does not support Web MIDI API.
Also, some web browsers running on Linux Snap may not work due to permissions.

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

**Local**

```
git clone https://github.com/h1romas4/sh4d-chain
cd sh4d-chain
npm install
npm run dev
```

**Deploy**

```
# "--base" for GitHub Pages context path
# This is not necessary when deployed as root.
npm run build -- --base=/sh4d-chain
# ls -laF dist/
```

## License

MIT License
