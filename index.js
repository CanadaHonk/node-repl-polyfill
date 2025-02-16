import process from 'node:process';
import { inspect } from 'node:util';
import { Interface } from 'node:readline';

const writer = obj => inspect(obj, writer.options);
writer.options = { ...inspect.defaultOptions, showProxy: true };

class REPLServer extends Interface {
  // todo: you can use multiple arguments too (prompt, source, eval_, useGlobal, ignoreUndefined, replMode) but legacy/undocumented
  constructor(options) {
    if (typeof options === 'string') {
      options = { prompt: options };
    }

    options ??= {};
    options = { ...options };

    options.input ??= process.stdin;
    options.output ??= process.stdout;

    super({
      input: options.input,
      output: options.output,
      completer: options.completer,
      terminal: options.terminal ?? options.output.isTTY,
      historySize: options.historySize,
      prompt: options.prompt ?? '> '
    });

    this.input = options.input ?? process.stdin;
    this.output = options.output ?? process.stdout;
    this.terminal = options.terminal ?? this.output.isTTY;
    this.useColors = options.useColors ?? (this.terminal && (this.output.getColorDepth?.() ?? 24) > 2);

    // unused default eval options
    this.useGlobal = options.useGlobal ?? false; // unused
    this.replMode = options.replMode ?? REPL_MODE_SLOPPY; // unused
    this.breakEvalOnSigint = options.breakEvalOnSigint ?? false; // unused

    this.preview = options.preview ?? (options.eval == null); // unused

    this.ignoreUndefined = options.ignoreUndefined ?? false;

    this.writer = options.writer;
    if (!this.writer) {
      this.writer = writer;
      this.writer.options.colors = this.useColors;
    }

    // our default eval function is intentionally basic as this polyfill is primarily
    // designed for custom evals.
    // this should probably use some node:vm thing
    // this does not support top-level await
    this.eval = options.eval ?? (async code => await eval(code));

    this.commands = new Map(Object.entries({
      exit: () => process.exit()
      // todo: more default commands
    }));

    this.on('close', () => {
      this.emit('exit');
    });

    let lastSigint = false;
    this.on('SIGINT', () => {
      this.clearLine();

      if (lastSigint) {
        this.close();
        lastSigint = false;
        return;
      }

      this.output.write('(To exit, press Ctrl+C again or Ctrl+D or type .exit)\n');

      lastSigint = true;

      this.displayPrompt();
    });

    this.on('line', cmd => {
      const done = (function (err, ret) {
        // todo: remember cmd

        if (!err &&
          arguments.length === 2 && // ret was specified at all
          (!this.ignoreUndefined || ret !== undefined) // respect ignoreUndefined option
        ) {
          this.output.write(this.writer(ret) + '\n');
        } else if (err) {
          this.output.write(this.writer(err) + '\n');
        }

        this.displayPrompt();
      }).bind(this);

      cmd ??= '';
      lastSigint = false;

      const trimmed = cmd.trim();
      if (trimmed &&
        trimmed[0] === '.' && trimmed[1] !== '.' && // ".foobar"
        isNaN(trimmed) // not a number like ".10"
      ) {
        let space = trimmed.indexOf(' ');
        if (space == -1) space = trimmed.length;
        const command = trimmed.slice(1, space);
        if (this.commands.has(command)) {
          this.commands.get(command)(trimmed.slice(space + 1));
          return done();
        }

        this.output.write('Invalid REPL keyword\n');
        return done();
      }

      try {
        this.eval(cmd, {}, 'repl.js', done).catch(err => done(err));
      } catch (err) {
        done(err);
      }
    });

    this.displayPrompt();
  }

  clearBufferedCommand() {
    // editor mode is not implemented, so buffered commands do not exist
  }

  displayPrompt(preserveCursor) {
    this.prompt(preserveCursor);
  }

  defineCommand(keyword, cmd) {
    // todo
  }

  setupHistory(historyPath, callback) {
    // todo
  }
}

const start = (...args) => new REPLServer(...args);

const REPL_MODE_SLOPPY = Symbol.for('node-repl-polyfill-sloppy');
const REPL_MODE_STRICT = Symbol.for('node-repl-polyfill-strict');

export default {
  REPLServer,
  start,
  writer,
  REPL_MODE_SLOPPY,
  REPL_MODE_STRICT
};
