/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 909:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const fs = __nccwpck_require__(896);
const path = __nccwpck_require__(928);
const util = __nccwpck_require__(952);
const SqliteError = __nccwpck_require__(483);

let DEFAULT_ADDON;

function Database(filenameGiven, options) {
	if (new.target == null) {
		return new Database(filenameGiven, options);
	}

	// Apply defaults
	let buffer;
	if (Buffer.isBuffer(filenameGiven)) {
		buffer = filenameGiven;
		filenameGiven = ':memory:';
	}
	if (filenameGiven == null) filenameGiven = '';
	if (options == null) options = {};

	// Validate arguments
	if (typeof filenameGiven !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	if ('readOnly' in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
	if ('memory' in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');

	// Interpret options
	const filename = filenameGiven.trim();
	const anonymous = filename === '' || filename === ':memory:';
	const readonly = util.getBooleanOption(options, 'readonly');
	const fileMustExist = util.getBooleanOption(options, 'fileMustExist');
	const timeout = 'timeout' in options ? options.timeout : 5000;
	const verbose = 'verbose' in options ? options.verbose : null;
	const nativeBinding = 'nativeBinding' in options ? options.nativeBinding : null;

	// Validate interpreted options
	if (readonly && anonymous && !buffer) throw new TypeError('In-memory/temporary databases cannot be readonly');
	if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
	if (timeout > 0x7fffffff) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
	if (verbose != null && typeof verbose !== 'function') throw new TypeError('Expected the "verbose" option to be a function');
	if (nativeBinding != null && typeof nativeBinding !== 'string' && typeof nativeBinding !== 'object') throw new TypeError('Expected the "nativeBinding" option to be a string or addon object');

	// Load the native addon
	let addon;
	if (nativeBinding == null) {
		addon = DEFAULT_ADDON || (DEFAULT_ADDON = require(__nccwpck_require__.ab + "build/Release/better_sqlite3.node"));
	} else if (typeof nativeBinding === 'string') {
		// See <https://webpack.js.org/api/module-variables/#__non_webpack_require__-webpack-specific>
		const requireFunc = typeof require === 'function' ? eval("require") : require;
		addon = requireFunc(path.resolve(nativeBinding).replace(/(\.node)?$/, '.node'));
	} else {
		// See <https://github.com/WiseLibs/better-sqlite3/issues/972>
		addon = nativeBinding;
	}

	if (!addon.isInitialized) {
		addon.setErrorConstructor(SqliteError);
		addon.isInitialized = true;
	}

	// Make sure the specified directory exists
	if (!anonymous && !filename.startsWith('file:') && !fs.existsSync(path.dirname(filename))) {
		throw new TypeError('Cannot open database because the directory does not exist');
	}

	Object.defineProperties(this, {
		[util.cppdb]: { value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null) },
		...wrappers.getters,
	});
}

const wrappers = __nccwpck_require__(463);
Database.prototype.prepare = wrappers.prepare;
Database.prototype.transaction = __nccwpck_require__(695);
Database.prototype.pragma = __nccwpck_require__(127);
Database.prototype.backup = __nccwpck_require__(17);
Database.prototype.serialize = __nccwpck_require__(161);
Database.prototype.function = __nccwpck_require__(943);
Database.prototype.aggregate = __nccwpck_require__(96);
Database.prototype.table = __nccwpck_require__(355);
Database.prototype.loadExtension = wrappers.loadExtension;
Database.prototype.exec = wrappers.exec;
Database.prototype.close = wrappers.close;
Database.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
Database.prototype.unsafeMode = wrappers.unsafeMode;
Database.prototype[util.inspect] = __nccwpck_require__(595);

module.exports = Database;


/***/ }),

/***/ 918:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

module.exports = __nccwpck_require__(909);
module.exports.SqliteError = __nccwpck_require__(483);


/***/ }),

/***/ 96:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const { getBooleanOption, cppdb } = __nccwpck_require__(952);

module.exports = function defineAggregate(name, options) {
	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object' || options === null) throw new TypeError('Expected second argument to be an options object');
	if (!name) throw new TypeError('User-defined function name cannot be an empty string');

	// Interpret options
	const start = 'start' in options ? options.start : null;
	const step = getFunctionOption(options, 'step', true);
	const inverse = getFunctionOption(options, 'inverse', false);
	const result = getFunctionOption(options, 'result', false);
	const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
	const deterministic = getBooleanOption(options, 'deterministic');
	const directOnly = getBooleanOption(options, 'directOnly');
	const varargs = getBooleanOption(options, 'varargs');
	let argCount = -1;

	// Determine argument count
	if (!varargs) {
		argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
		if (argCount > 0) argCount -= 1;
		if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
	}

	this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
	return this;
};

const getFunctionOption = (options, key, required) => {
	const value = key in options ? options[key] : null;
	if (typeof value === 'function') return value;
	if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
	if (required) throw new TypeError(`Missing required option "${key}"`);
	return null;
};

const getLength = ({ length }) => {
	if (Number.isInteger(length) && length >= 0) return length;
	throw new TypeError('Expected function.length to be a positive integer');
};


/***/ }),

/***/ 17:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const fs = __nccwpck_require__(896);
const path = __nccwpck_require__(928);
const { promisify } = __nccwpck_require__(23);
const { cppdb } = __nccwpck_require__(952);
const fsAccess = promisify(fs.access);

module.exports = async function backup(filename, options) {
	if (options == null) options = {};

	// Validate arguments
	if (typeof filename !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');

	// Interpret options
	filename = filename.trim();
	const attachedName = 'attached' in options ? options.attached : 'main';
	const handler = 'progress' in options ? options.progress : null;

	// Validate interpreted options
	if (!filename) throw new TypeError('Backup filename cannot be an empty string');
	if (filename === ':memory:') throw new TypeError('Invalid backup filename ":memory:"');
	if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
	if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
	if (handler != null && typeof handler !== 'function') throw new TypeError('Expected the "progress" option to be a function');

	// Make sure the specified directory exists
	await fsAccess(path.dirname(filename)).catch(() => {
		throw new TypeError('Cannot save backup because the directory does not exist');
	});

	const isNewFile = await fsAccess(filename).then(() => false, () => true);
	return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
};

const runBackup = (backup, handler) => {
	let rate = 0;
	let useDefault = true;

	return new Promise((resolve, reject) => {
		setImmediate(function step() {
			try {
				const progress = backup.transfer(rate);
				if (!progress.remainingPages) {
					backup.close();
					resolve(progress);
					return;
				}
				if (useDefault) {
					useDefault = false;
					rate = 100;
				}
				if (handler) {
					const ret = handler(progress);
					if (ret !== undefined) {
						if (typeof ret === 'number' && ret === ret) rate = Math.max(0, Math.min(0x7fffffff, Math.round(ret)));
						else throw new TypeError('Expected progress callback to return a number or undefined');
					}
				}
				setImmediate(step);
			} catch (err) {
				backup.close();
				reject(err);
			}
		});
	});
};


/***/ }),

/***/ 943:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const { getBooleanOption, cppdb } = __nccwpck_require__(952);

module.exports = function defineFunction(name, options, fn) {
	// Apply defaults
	if (options == null) options = {};
	if (typeof options === 'function') { fn = options; options = {}; }

	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof fn !== 'function') throw new TypeError('Expected last argument to be a function');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	if (!name) throw new TypeError('User-defined function name cannot be an empty string');

	// Interpret options
	const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
	const deterministic = getBooleanOption(options, 'deterministic');
	const directOnly = getBooleanOption(options, 'directOnly');
	const varargs = getBooleanOption(options, 'varargs');
	let argCount = -1;

	// Determine argument count
	if (!varargs) {
		argCount = fn.length;
		if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError('Expected function.length to be a positive integer');
		if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
	}

	this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
	return this;
};


/***/ }),

/***/ 595:
/***/ ((module) => {

"use strict";

const DatabaseInspection = function Database() {};

module.exports = function inspect(depth, opts) {
	return Object.assign(new DatabaseInspection(), this);
};



/***/ }),

/***/ 127:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const { getBooleanOption, cppdb } = __nccwpck_require__(952);

module.exports = function pragma(source, options) {
	if (options == null) options = {};
	if (typeof source !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	const simple = getBooleanOption(options, 'simple');

	const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true);
	return simple ? stmt.pluck().get() : stmt.all();
};


/***/ }),

/***/ 161:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const { cppdb } = __nccwpck_require__(952);

module.exports = function serialize(options) {
	if (options == null) options = {};

	// Validate arguments
	if (typeof options !== 'object') throw new TypeError('Expected first argument to be an options object');

	// Interpret and validate options
	const attachedName = 'attached' in options ? options.attached : 'main';
	if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
	if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');

	return this[cppdb].serialize(attachedName);
};


/***/ }),

/***/ 355:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const { cppdb } = __nccwpck_require__(952);

module.exports = function defineTable(name, factory) {
	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (!name) throw new TypeError('Virtual table module name cannot be an empty string');

	// Determine whether the module is eponymous-only or not
	let eponymous = false;
	if (typeof factory === 'object' && factory !== null) {
		eponymous = true;
		factory = defer(parseTableDefinition(factory, 'used', name));
	} else {
		if (typeof factory !== 'function') throw new TypeError('Expected second argument to be a function or a table definition object');
		factory = wrapFactory(factory);
	}

	this[cppdb].table(factory, name, eponymous);
	return this;
};

function wrapFactory(factory) {
	return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
		const thisObject = {
			module: moduleName,
			database: databaseName,
			table: tableName,
		};

		// Generate a new table definition by invoking the factory
		const def = apply.call(factory, thisObject, args);
		if (typeof def !== 'object' || def === null) {
			throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
		}

		return parseTableDefinition(def, 'returned', moduleName);
	};
}

function parseTableDefinition(def, verb, moduleName) {
	// Validate required properties
	if (!hasOwnProperty.call(def, 'rows')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
	}
	if (!hasOwnProperty.call(def, 'columns')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
	}

	// Validate "rows" property
	const rows = def.rows;
	if (typeof rows !== 'function' || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
	}

	// Validate "columns" property
	let columns = def.columns;
	if (!Array.isArray(columns) || !(columns = [...columns]).every(x => typeof x === 'string')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
	}
	if (columns.length !== new Set(columns).size) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
	}
	if (!columns.length) {
		throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
	}

	// Validate "parameters" property
	let parameters;
	if (hasOwnProperty.call(def, 'parameters')) {
		parameters = def.parameters;
		if (!Array.isArray(parameters) || !(parameters = [...parameters]).every(x => typeof x === 'string')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
		}
	} else {
		parameters = inferParameters(rows);
	}
	if (parameters.length !== new Set(parameters).size) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
	}
	if (parameters.length > 32) {
		throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
	}
	for (const parameter of parameters) {
		if (columns.includes(parameter)) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
		}
	}

	// Validate "safeIntegers" option
	let safeIntegers = 2;
	if (hasOwnProperty.call(def, 'safeIntegers')) {
		const bool = def.safeIntegers;
		if (typeof bool !== 'boolean') {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
		}
		safeIntegers = +bool;
	}

	// Validate "directOnly" option
	let directOnly = false;
	if (hasOwnProperty.call(def, 'directOnly')) {
		directOnly = def.directOnly;
		if (typeof directOnly !== 'boolean') {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
		}
	}

	// Generate SQL for the virtual table definition
	const columnDefinitions = [
		...parameters.map(identifier).map(str => `${str} HIDDEN`),
		...columns.map(identifier),
	];
	return [
		`CREATE TABLE x(${columnDefinitions.join(', ')});`,
		wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName),
		parameters,
		safeIntegers,
		directOnly,
	];
}

function wrapGenerator(generator, columnMap, moduleName) {
	return function* virtualTable(...args) {
		/*
			We must defensively clone any buffers in the arguments, because
			otherwise the generator could mutate one of them, which would cause
			us to return incorrect values for hidden columns, potentially
			corrupting the database.
		 */
		const output = args.map(x => Buffer.isBuffer(x) ? Buffer.from(x) : x);
		for (let i = 0; i < columnMap.size; ++i) {
			output.push(null); // Fill with nulls to prevent gaps in array (v8 optimization)
		}
		for (const row of generator(...args)) {
			if (Array.isArray(row)) {
				extractRowArray(row, output, columnMap.size, moduleName);
				yield output;
			} else if (typeof row === 'object' && row !== null) {
				extractRowObject(row, output, columnMap, moduleName);
				yield output;
			} else {
				throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
			}
		}
	};
}

function extractRowArray(row, output, columnCount, moduleName) {
	if (row.length !== columnCount) {
		throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
	}
	const offset = output.length - columnCount;
	for (let i = 0; i < columnCount; ++i) {
		output[i + offset] = row[i];
	}
}

function extractRowObject(row, output, columnMap, moduleName) {
	let count = 0;
	for (const key of Object.keys(row)) {
		const index = columnMap.get(key);
		if (index === undefined) {
			throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
		}
		output[index] = row[key];
		count += 1;
	}
	if (count !== columnMap.size) {
		throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
	}
}

function inferParameters({ length }) {
	if (!Number.isInteger(length) || length < 0) {
		throw new TypeError('Expected function.length to be a positive integer');
	}
	const params = [];
	for (let i = 0; i < length; ++i) {
		params.push(`$${i + 1}`);
	}
	return params;
}

const { hasOwnProperty } = Object.prototype;
const { apply } = Function.prototype;
const GeneratorFunctionPrototype = Object.getPrototypeOf(function*(){});
const identifier = str => `"${str.replace(/"/g, '""')}"`;
const defer = x => () => x;


/***/ }),

/***/ 695:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const { cppdb } = __nccwpck_require__(952);
const controllers = new WeakMap();

module.exports = function transaction(fn) {
	if (typeof fn !== 'function') throw new TypeError('Expected first argument to be a function');

	const db = this[cppdb];
	const controller = getController(db, this);
	const { apply } = Function.prototype;

	// Each version of the transaction function has these same properties
	const properties = {
		default: { value: wrapTransaction(apply, fn, db, controller.default) },
		deferred: { value: wrapTransaction(apply, fn, db, controller.deferred) },
		immediate: { value: wrapTransaction(apply, fn, db, controller.immediate) },
		exclusive: { value: wrapTransaction(apply, fn, db, controller.exclusive) },
		database: { value: this, enumerable: true },
	};

	Object.defineProperties(properties.default.value, properties);
	Object.defineProperties(properties.deferred.value, properties);
	Object.defineProperties(properties.immediate.value, properties);
	Object.defineProperties(properties.exclusive.value, properties);

	// Return the default version of the transaction function
	return properties.default.value;
};

// Return the database's cached transaction controller, or create a new one
const getController = (db, self) => {
	let controller = controllers.get(db);
	if (!controller) {
		const shared = {
			commit: db.prepare('COMMIT', self, false),
			rollback: db.prepare('ROLLBACK', self, false),
			savepoint: db.prepare('SAVEPOINT `\t_bs3.\t`', self, false),
			release: db.prepare('RELEASE `\t_bs3.\t`', self, false),
			rollbackTo: db.prepare('ROLLBACK TO `\t_bs3.\t`', self, false),
		};
		controllers.set(db, controller = {
			default: Object.assign({ begin: db.prepare('BEGIN', self, false) }, shared),
			deferred: Object.assign({ begin: db.prepare('BEGIN DEFERRED', self, false) }, shared),
			immediate: Object.assign({ begin: db.prepare('BEGIN IMMEDIATE', self, false) }, shared),
			exclusive: Object.assign({ begin: db.prepare('BEGIN EXCLUSIVE', self, false) }, shared),
		});
	}
	return controller;
};

// Return a new transaction function by wrapping the given function
const wrapTransaction = (apply, fn, db, { begin, commit, rollback, savepoint, release, rollbackTo }) => function sqliteTransaction() {
	let before, after, undo;
	if (db.inTransaction) {
		before = savepoint;
		after = release;
		undo = rollbackTo;
	} else {
		before = begin;
		after = commit;
		undo = rollback;
	}
	before.run();
	try {
		const result = apply.call(fn, this, arguments);
		if (result && typeof result.then === 'function') {
			throw new TypeError('Transaction function cannot return a promise');
		}
		after.run();
		return result;
	} catch (ex) {
		if (db.inTransaction) {
			undo.run();
			if (undo !== rollback) after.run();
		}
		throw ex;
	}
};


/***/ }),

/***/ 463:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

const { cppdb } = __nccwpck_require__(952);

exports.prepare = function prepare(sql) {
	return this[cppdb].prepare(sql, this, false);
};

exports.exec = function exec(sql) {
	this[cppdb].exec(sql);
	return this;
};

exports.close = function close() {
	this[cppdb].close();
	return this;
};

exports.loadExtension = function loadExtension(...args) {
	this[cppdb].loadExtension(...args);
	return this;
};

exports.defaultSafeIntegers = function defaultSafeIntegers(...args) {
	this[cppdb].defaultSafeIntegers(...args);
	return this;
};

exports.unsafeMode = function unsafeMode(...args) {
	this[cppdb].unsafeMode(...args);
	return this;
};

exports.getters = {
	name: {
		get: function name() { return this[cppdb].name; },
		enumerable: true,
	},
	open: {
		get: function open() { return this[cppdb].open; },
		enumerable: true,
	},
	inTransaction: {
		get: function inTransaction() { return this[cppdb].inTransaction; },
		enumerable: true,
	},
	readonly: {
		get: function readonly() { return this[cppdb].readonly; },
		enumerable: true,
	},
	memory: {
		get: function memory() { return this[cppdb].memory; },
		enumerable: true,
	},
};


/***/ }),

/***/ 483:
/***/ ((module) => {

"use strict";

const descriptor = { value: 'SqliteError', writable: true, enumerable: false, configurable: true };

function SqliteError(message, code) {
	if (new.target !== SqliteError) {
		return new SqliteError(message, code);
	}
	if (typeof code !== 'string') {
		throw new TypeError('Expected second argument to be a string');
	}
	Error.call(this, message);
	descriptor.value = '' + message;
	Object.defineProperty(this, 'message', descriptor);
	Error.captureStackTrace(this, SqliteError);
	this.code = code;
}
Object.setPrototypeOf(SqliteError, Error);
Object.setPrototypeOf(SqliteError.prototype, Error.prototype);
Object.defineProperty(SqliteError.prototype, 'name', descriptor);
module.exports = SqliteError;


/***/ }),

/***/ 952:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.getBooleanOption = (options, key) => {
	let value = false;
	if (key in options && typeof (value = options[key]) !== 'boolean') {
		throw new TypeError(`Expected the "${key}" option to be a boolean`);
	}
	return value;
};

exports.cppdb = Symbol();
exports.inspect = Symbol.for('nodejs.util.inspect.custom');


/***/ }),

/***/ 874:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __nccwpck_require__) => {

(function () {
  (__nccwpck_require__(889).config)(
    Object.assign(
      {},
      __nccwpck_require__(990),
      __nccwpck_require__(531)(process.argv)
    )
  )
})()


/***/ }),

/***/ 531:
/***/ ((module) => {

const re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/

module.exports = function optionMatcher (args) {
  const options = args.reduce(function (acc, cur) {
    const matches = cur.match(re)
    if (matches) {
      acc[matches[1]] = matches[2]
    }
    return acc
  }, {})

  if (!('quiet' in options)) {
    options.quiet = 'true'
  }

  return options
}


/***/ }),

/***/ 990:
/***/ ((module) => {

// ../config.js accepts options via environment variables
const options = {}

if (process.env.DOTENV_CONFIG_ENCODING != null) {
  options.encoding = process.env.DOTENV_CONFIG_ENCODING
}

if (process.env.DOTENV_CONFIG_PATH != null) {
  options.path = process.env.DOTENV_CONFIG_PATH
}

if (process.env.DOTENV_CONFIG_QUIET != null) {
  options.quiet = process.env.DOTENV_CONFIG_QUIET
}

if (process.env.DOTENV_CONFIG_DEBUG != null) {
  options.debug = process.env.DOTENV_CONFIG_DEBUG
}

if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
  options.override = process.env.DOTENV_CONFIG_OVERRIDE
}

if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
  options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY
}

module.exports = options


/***/ }),

/***/ 889:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(896)
const path = __nccwpck_require__(928)
const os = __nccwpck_require__(857)
const crypto = __nccwpck_require__(982)

// Array of tips to display randomly
const TIPS = [
  '◈ encrypted .env [www.dotenvx.com]',
  '◈ secrets for agents [www.dotenvx.com]',
  '⌁ auth for agents [www.vestauth.com]',
  '⌘ custom filepath { path: \'/custom/path/.env\' }',
  '⌘ enable debugging { debug: true }',
  '⌘ override existing { override: true }',
  '⌘ suppress logs { quiet: true }',
  '⌘ multiple files { path: [\'.env.local\', \'.env\'] }'
]

// Get a random tip from the tips array
function _getRandomTip () {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

function supportsAnsi () {
  return process.stdout.isTTY // && process.env.TERM !== 'dumb'
}

function dim (text) {
  return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text
}

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// Parse src into an Object
function parse (src) {
  const obj = {}

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]

    // Default undefined or null to empty string
    let value = (match[2] || '')

    // Remove whitespace
    value = value.trim()

    // Check if double quoted
    const maybeQuote = value[0]

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }

    // Add to object
    obj[key] = value
  }

  return obj
}

function _parseVault (options) {
  options = options || {}

  const vaultPath = _vaultPath(options)
  options.path = vaultPath // parse .env.vault
  const result = DotenvModule.configDotenv(options)
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
    err.code = 'MISSING_DATA'
    throw err
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',')
  const length = keys.length

  let decrypted
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim()

      // Get instructions for decrypt
      const attrs = _instructions(result, key)

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key)

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted)
}

function _warn (message) {
  console.error(`⚠ ${message}`)
}

function _debug (message) {
  console.log(`┆ ${message}`)
}

function _log (message) {
  console.log(`◇ ${message}`)
}

function _dotenvKey (options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  // fallback to empty string
  return ''
}

function _instructions (result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }

    throw error
  }

  // Get decrypt key
  const key = uri.password
  if (!key) {
    const err = new Error('INVALID_DOTENV_KEY: Missing key part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    const err = new Error('INVALID_DOTENV_KEY: Missing environment part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`)
    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'
    throw err
  }

  return { ciphertext, key }
}

function _vaultPath (options) {
  let possibleVaultPath = null

  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault')
  }

  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath
  }

  return null
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configVault (options) {
  const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || (options && options.debug))
  const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (debug || !quiet) {
    _log('loading env from encrypted .env.vault')
  }

  const parsed = DotenvModule._parseVault(options)

  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  DotenvModule.populate(processEnv, parsed, options)

  return { parsed }
}

function configDotenv (options) {
  const dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }
  let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug))
  let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (options && options.encoding) {
    encoding = options.encoding
  } else {
    if (debug) {
      _debug('no encoding is specified (UTF-8 is used by default)')
    }
  }

  let optionPaths = [dotenvPath] // default, look for .env
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)]
    } else {
      optionPaths = [] // reset default
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath))
      }
    }
  }

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError
  const parsedAll = {}
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }))

      DotenvModule.populate(parsedAll, parsed, options)
    } catch (e) {
      if (debug) {
        _debug(`failed to load ${path} ${e.message}`)
      }
      lastError = e
    }
  }

  const populated = DotenvModule.populate(processEnv, parsedAll, options)

  // handle user settings DOTENV_CONFIG_ options inside .env file(s)
  debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug)
  quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet)

  if (debug || !quiet) {
    const keysCount = Object.keys(populated).length
    const shortPaths = []
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath)
        shortPaths.push(relative)
      } catch (e) {
        if (debug) {
          _debug(`failed to load ${filePath} ${e.message}`)
        }
        lastError = e
      }
    }

    _log(`injected env (${keysCount}) from ${shortPaths.join(',')} ${dim(`// tip: ${_getRandomTip()}`)}`)
  }

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options)
  }

  const vaultPath = _vaultPath(options)

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`)

    return DotenvModule.configDotenv(options)
  }

  return DotenvModule._configVault(options)
}

function decrypt (encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex')
  let ciphertext = Buffer.from(encrypted, 'base64')

  const nonce = ciphertext.subarray(0, 12)
  const authTag = ciphertext.subarray(-16)
  ciphertext = ciphertext.subarray(12, -16)

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    aesgcm.setAuthTag(authTag)
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError
    const invalidKeyLength = error.message === 'Invalid key length'
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'

    if (isRange || invalidKeyLength) {
      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    } else if (decryptionFailed) {
      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY')
      err.code = 'DECRYPTION_FAILED'
      throw err
    } else {
      throw error
    }
  }
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)
  const populated = {}

  if (typeof parsed !== 'object') {
    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
    err.code = 'OBJECT_REQUIRED'
    throw err
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key]
        populated[key] = parsed[key]
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`)
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`)
        }
      }
    } else {
      processEnv[key] = parsed[key]
      populated[key] = parsed[key]
    }
  }

  return populated
}

const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
}

module.exports.configDotenv = DotenvModule.configDotenv
module.exports._configVault = DotenvModule._configVault
module.exports._parseVault = DotenvModule._parseVault
module.exports.config = DotenvModule.config
module.exports.decrypt = DotenvModule.decrypt
module.exports.parse = DotenvModule.parse
module.exports.populate = DotenvModule.populate

module.exports = DotenvModule


/***/ }),

/***/ 512:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * macOS-only: extracts and decrypts X/Twitter cookies from Chrome,
 * writes them to cookies.json for use by the Docker container.
 *
 * Run on the host before starting Docker, and daily to keep fresh.
 */
__nccwpck_require__(874);
const better_sqlite3_1 = __importDefault(__nccwpck_require__(918));
const child_process_1 = __nccwpck_require__(317);
const crypto = __importStar(__nccwpck_require__(982));
const path = __importStar(__nccwpck_require__(928));
const fs = __importStar(__nccwpck_require__(896));
function findRoot(dir) {
    if (fs.existsSync(path.join(dir, ".env.example")))
        return dir;
    const parent = path.dirname(dir);
    return parent !== dir ? findRoot(parent) : dir;
}
const ROOT = findRoot(__dirname);
const COOKIES_DB = process.env.COOKIES_DB
    ?? path.join(process.env.HOME, "Library/Application Support/Google/Chrome/Default/Cookies");
function exportCookies() {
    const password = (0, child_process_1.execSync)("security find-generic-password -wa 'Chrome'", {
        stdio: ["pipe", "pipe", "ignore"],
    }).toString().trim();
    const key = crypto.pbkdf2Sync(password, "saltysalt", 1003, 16, "sha1");
    const iv = Buffer.alloc(16, 0x20);
    function decrypt(buf) {
        if (!buf || buf.length < 4)
            return "";
        if (buf.slice(0, 3).toString() !== "v10")
            return buf.toString("utf8");
        try {
            const d = crypto.createDecipheriv("aes-128-cbc", key, iv);
            const decrypted = Buffer.concat([d.update(buf.slice(3)), d.final()]);
            const text = decrypted.slice(32).toString("utf8");
            return text || decrypted.toString("utf8");
        }
        catch {
            return "";
        }
    }
    const tmp = "/tmp/_chrome_cookies_export.db";
    fs.copyFileSync(COOKIES_DB, tmp);
    const db = new better_sqlite3_1.default(tmp, { readonly: true });
    const rows = db.prepare(`
    SELECT name, encrypted_value, host_key, path, is_secure, is_httponly, samesite
    FROM cookies
    WHERE host_key LIKE '%.x.com' OR host_key = 'x.com'
       OR host_key LIKE '%.twitter.com' OR host_key = 'twitter.com'
  `).all();
    db.close();
    const sameSiteMap = {
        "-1": "None", 0: "None", 1: "Lax", 2: "Strict",
    };
    const cookies = rows
        .map(r => ({
        name: r.name,
        value: decrypt(r.encrypted_value),
        domain: r.host_key,
        path: r.path || "/",
        httpOnly: Boolean(r.is_httponly),
        secure: Boolean(r.is_secure),
        sameSite: sameSiteMap[r.samesite] ?? "None",
    }))
        .filter(c => c.value && c.name);
    const out = path.join(ROOT, "cookies.json");
    fs.writeFileSync(out, JSON.stringify(cookies, null, 2));
    console.log(`Exported ${cookies.length} cookies → ${out}`);
}
exportCookies();


/***/ }),

/***/ 317:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 982:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 857:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 23:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(512);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;