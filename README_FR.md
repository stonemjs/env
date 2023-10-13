# StoneJS: Env

![npm](https://img.shields.io/npm/l/@stone-js/env)
![npm](https://img.shields.io/npm/v/@stone-js/env)
![npm](https://img.shields.io/npm/dm/@stone-js/env)
![Maintenance](https://img.shields.io/maintenance/yes/2023)

Fluent and simple API to deal with .env file and env variables in node.js

## Table of Contents

* [Installation](#installation)

## Installation

The env module can be installed with both `npm` and `yarn`.

```sh
# Install with NPM
$ npm i @stone-js/env

# Install with yarn
$ yarn add @stone-js/env
```

## Brainstorming
Pour eviter d'exposer certaines variables il faut aussi les placer dans `.env.public`
En gros on aura deux fichiers dotenv au sein du projet:
1. `.env` contenant toutes les variables publiques et privées
2. `.env.public` contenant une replique mais sans valeur de toutes les variables pouvant etre exposées dans les applications frontend.

NB: This module requires a webpack module for frontend env variables