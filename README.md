# latest-semver

`latest-semver` reports available dependency updates that remain within the
major version currently declared in a `package.json` file.

## Requirements

Node.js 18 or later.

## Install

Run without installing it globally:

```sh
npx latest-semver
```

Or install it globally:

```sh
npm install --global latest-semver
```

## Usage

From a project directory, run:

```sh
latest-semver
```

To check another package manifest, pass its path:

```sh
latest-semver path/to/package.json
```

The command checks `dependencies` and `devDependencies`, skipping Git, URL,
file, wildcard, and otherwise non-semver specifications.

## License

ISC