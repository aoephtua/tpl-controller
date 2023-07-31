# tpl-controller

[![npm](https://img.shields.io/npm/v/tpl-controller)](https://www.npmjs.com/package/tpl-controller)
![npm](https://img.shields.io/npm/dw/tpl-controller?label=↓)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/aoephtua/tpl-controller/blob/master/LICENSE)

## Installing

Using npm:

    $ npm install tpl-controller

Once the package is installed, you can import the controller:

```javascript
import TplController from 'tpl-controller';
```

## Usage

Create instance of controller class:

```javascript
const tplController = new TplController({ ipAddress, password });
```

### Commands

**turnLed**

```javascript
const { state } = await tplController.turnLed('toggle'); // on, off, toggle
```

**restart**

```javascript
const { state } = await tplController.restart();
```

See [example.mjs](src/example.mjs) to get an insight.

## Compatibility

- TL-WA850RE 7.0
  - 1.0.1 Build 201029
  - 1.0.10 Build 211117

## License

This project is licensed under [MIT](LICENSE).