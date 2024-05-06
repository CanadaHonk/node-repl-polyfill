# node-repl-polyfill
Simple `node:repl` polyfill for other JS runtimes.

This polyfill does not aim to have full parity or a matching API to `node:repl`, but provide a basic library for people wanting to use the basics of `node:repl`. The default eval function is intentionally terrible, as it is expected you already have your own. With these limitations, it should act like a "drop-in" replacement for `node:repl` by just importing this package instead of `node:repl`. This package does no detection for native support of `node:repl`, so does not try to use a native implementation at all.