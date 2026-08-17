# latest-samemajor

`latest-samemajor` reports available dependency updates that remain within the
major version currently declared in a `package.json` file.

## Requirements

Node.js 18 or later.

## Install

Run without installing it globally:

```sh
npx @nickdeakin/latest-samemajor
```

Or install it globally:

```sh
npm install --global @nickdeakin/latest-samemajor
```

## Usage

From a project directory, run:

```sh
latest-samemajor
```

To check another package manifest, pass its path:

```sh
latest-samemajor path/to/package.json
```

The command checks `dependencies` and `devDependencies` packages for to see the latest versions of the same major

## License

ISC