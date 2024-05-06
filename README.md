# node-repl-polyfill
Simple `node:repl` polyfill for other JS runtimes.

**This polyfill does not aim to have full parity** but provide a basic library for people wanting to use the basics of `node:repl`. **The default eval function is intentionally terrible, as it is expected you are bringing your own.** With these limitations, it should act like a "drop-in" replacement for `node:repl` by just importing this package instead of `node:repl`. This package does no detection for native support of `node:repl`, so does not try to use a native implementation at all.

---

## Recommended import

You can use the following import as to use `node:repl` if supported by the runtime being used:

```js
let repl;
try {
  // try importing node:repl
  repl = await import('node:repl');

  // check it is not just a mock with REPLServer prototype
  if (repl.REPLServer.prototype.defineCommand == null)
    throw 'mock node:repl detected';
} catch {
  // it failed, import the polyfill
  repl = (await import('node-repl-polyfill')).default;
}
```

---

## Runtime requirements

This polyfill relies on the runtime supporting:
- `node:process` (`stdin`, `stdout`)
- `node:util` (`inspect`)
- `node:readline` (`Interface`)

Runtimes tested:
- Node (20.12.0)
- Deno (1.42.2)
- Bun (1.1.5)