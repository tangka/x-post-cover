"use strict";
exports.id = 783;
exports.ids = [783];
exports.modules = {

/***/ 8783:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  unpackTar: () => (/* binding */ unpackTar)
});

// UNUSED EXPORTS: packTar, packTarSources

;// CONCATENATED MODULE: ./node_modules/modern-tar/dist/unpacker-CPCEF5CT.js
const unpacker_CPCEF5CT_FILE = "file";
const unpacker_CPCEF5CT_LINK = "link";
const unpacker_CPCEF5CT_SYMLINK = "symlink";
const unpacker_CPCEF5CT_DIRECTORY = "directory";
const TYPEFLAG = {
	file: "0",
	link: "1",
	symlink: "2",
	"character-device": "3",
	"block-device": "4",
	directory: "5",
	fifo: "6",
	"pax-header": "x",
	"pax-global-header": "g",
	"gnu-long-name": "L",
	"gnu-long-link-name": "K"
};
const FLAGTYPE = {
	"0": unpacker_CPCEF5CT_FILE,
	"1": unpacker_CPCEF5CT_LINK,
	"2": unpacker_CPCEF5CT_SYMLINK,
	"3": "character-device",
	"4": "block-device",
	"5": unpacker_CPCEF5CT_DIRECTORY,
	"6": "fifo",
	x: "pax-header",
	g: "pax-global-header",
	L: "gnu-long-name",
	K: "gnu-long-link-name"
};
const ZERO_BLOCK = new Uint8Array(512);
const EMPTY = new Uint8Array(0);
//#endregion
//#region src/tar/encoding.ts
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function writeString(view, offset, size, value) {
	if (value) encoder.encodeInto(value, view.subarray(offset, offset + size));
}
function writeOctal(view, offset, size, value) {
	if (value === void 0) return;
	const octalString = value.toString(8).padStart(size - 1, "0");
	encoder.encodeInto(octalString, view.subarray(offset, offset + size - 1));
}
function readString(view, offset, size) {
	const end = view.indexOf(0, offset);
	const sliceEnd = end === -1 || end > offset + size ? offset + size : end;
	return decoder.decode(view.subarray(offset, sliceEnd));
}
function readOctal(view, offset, size) {
	let value = 0;
	const end = offset + size;
	for (let i = offset; i < end; i++) {
		const charCode = view[i];
		if (charCode === 0) break;
		if (charCode === 32) continue;
		value = value * 8 + (charCode - 48);
	}
	return value;
}
function readNumeric(view, offset, size) {
	if (view[offset] & 128) {
		let result = 0;
		result = view[offset] & 127;
		for (let i = 1; i < size; i++) result = result * 256 + view[offset + i];
		if (!Number.isSafeInteger(result)) throw new Error("TAR number too large");
		return result;
	}
	return readOctal(view, offset, size);
}
//#endregion
//#region src/tar/body.ts
const isBodyless = (header) => header.type === "directory" || header.type === "symlink" || header.type === "link" || header.type === "character-device" || header.type === "block-device" || header.type === "fifo";
async function unpacker_CPCEF5CT_normalizeBody(body) {
	if (body === null || body === void 0) return EMPTY;
	if (body instanceof Uint8Array) return body;
	if (typeof body === "string") return encoder.encode(body);
	if (body instanceof ArrayBuffer) return new Uint8Array(body);
	if (body instanceof Blob) return new Uint8Array(await body.arrayBuffer());
	throw new TypeError("Unsupported content type for entry body.");
}
//#endregion
//#region src/tar/options.ts
const stripPath = (p, n) => {
	const parts = p.split("/").filter(Boolean);
	return n >= parts.length ? "" : parts.slice(n).join("/");
};
function transformHeader(header, options) {
	const { strip, filter, map } = options;
	if (!strip && !filter && !map) return header;
	const h = { ...header };
	if (strip && strip > 0) {
		const newName = stripPath(h.name, strip);
		if (!newName) return null;
		h.name = h.type === "directory" && !newName.endsWith("/") ? `${newName}/` : newName;
		if (h.linkname) {
			const isAbsolute = h.linkname.startsWith("/");
			if (isAbsolute || h.type === "link") {
				const stripped = stripPath(h.linkname, strip);
				h.linkname = isAbsolute ? `/${stripped}` || "/" : stripped;
			}
		}
	}
	if (filter?.(h) === false) return null;
	const result = map ? map(h) : h;
	if (result && (!result.name || !result.name.trim() || result.name === "." || result.name === "/")) return null;
	return result;
}
//#endregion
//#region src/tar/checksum.ts
const CHECKSUM_SPACE = 32;
const ASCII_ZERO = 48;
function validateChecksum(block) {
	const stored = readOctal(block, 148, 8);
	let sum = 0;
	for (let i = 0; i < block.length; i++) if (i >= 148 && i < 156) sum += CHECKSUM_SPACE;
	else sum += block[i];
	return stored === sum;
}
function writeChecksum(block) {
	block.fill(CHECKSUM_SPACE, 148, 156);
	let checksum = 0;
	for (const byte of block) checksum += byte;
	for (let i = 153; i >= 148; i--) {
		block[i] = (checksum & 7) + ASCII_ZERO;
		checksum >>= 3;
	}
	block[154] = 0;
	block[155] = CHECKSUM_SPACE;
}
//#endregion
//#region src/tar/pax.ts
const USTAR_SPLIT_MAX_SIZE = 256;
function generatePax(header) {
	const paxRecords = {};
	if (encoder.encode(header.name).length > 100) {
		if (findUstarSplit(header.name) === null) paxRecords.path = header.name;
	}
	if (header.linkname && encoder.encode(header.linkname).length > 100) paxRecords.linkpath = header.linkname;
	if (header.uname && encoder.encode(header.uname).length > 32) paxRecords.uname = header.uname;
	if (header.gname && encoder.encode(header.gname).length > 32) paxRecords.gname = header.gname;
	if (header.uid != null && header.uid > 2097151) paxRecords.uid = String(header.uid);
	if (header.gid != null && header.gid > 2097151) paxRecords.gid = String(header.gid);
	if (header.size != null && header.size > 8589934591) paxRecords.size = String(header.size);
	if (header.pax) Object.assign(paxRecords, header.pax);
	const paxEntries = Object.entries(paxRecords);
	if (paxEntries.length === 0) return null;
	const paxBody = encoder.encode(paxEntries.map(([key, value]) => {
		const record = `${key}=${value}\n`;
		const partLength = encoder.encode(record).length + 1;
		let totalLength = partLength + String(partLength).length;
		totalLength = partLength + String(totalLength).length;
		return `${totalLength} ${record}`;
	}).join(""));
	return {
		paxHeader: createTarHeader({
			name: decoder.decode(encoder.encode(`PaxHeader/${header.name}`).slice(0, 100)),
			size: paxBody.length,
			type: "pax-header",
			mode: 420,
			mtime: header.mtime,
			uname: header.uname,
			gname: header.gname,
			uid: header.uid,
			gid: header.gid
		}),
		paxBody
	};
}
function findUstarSplit(path) {
	const totalPathBytes = encoder.encode(path).length;
	if (totalPathBytes <= 100 || totalPathBytes > USTAR_SPLIT_MAX_SIZE) return null;
	for (let i = path.length - 1; i > 0; i--) {
		if (path[i] !== "/") continue;
		const prefix = path.slice(0, i);
		const name = path.slice(i + 1);
		if (encoder.encode(prefix).length <= 155 && encoder.encode(name).length <= 100) return {
			prefix,
			name
		};
	}
	return null;
}
//#endregion
//#region src/tar/header.ts
function createTarHeader(header) {
	const view = new Uint8Array(512);
	const size = isBodyless(header) ? 0 : header.size ?? 0;
	let name = header.name;
	let prefix = "";
	if (!header.pax?.path) {
		const split = findUstarSplit(name);
		if (split) {
			name = split.name;
			prefix = split.prefix;
		}
	}
	writeString(view, 0, 100, name);
	writeOctal(view, 100, 8, header.mode ?? (header.type === "directory" ? 493 : 420));
	writeOctal(view, 108, 8, header.uid ?? 0);
	writeOctal(view, 116, 8, header.gid ?? 0);
	writeOctal(view, 124, 12, size);
	writeOctal(view, 136, 12, Math.floor((header.mtime?.getTime() ?? Date.now()) / 1e3));
	writeString(view, 156, 1, TYPEFLAG[header.type ?? "file"]);
	writeString(view, 157, 100, header.linkname);
	writeString(view, 257, 6, "ustar\0");
	writeString(view, 263, 2, "00");
	writeString(view, 265, 32, header.uname);
	writeString(view, 297, 32, header.gname);
	writeString(view, 345, 155, prefix);
	writeChecksum(view);
	return view;
}
function parseUstarHeader(block, strict) {
	if (strict && !validateChecksum(block)) throw new Error("Invalid tar header checksum.");
	const typeflag = readString(block, 156, 1);
	const header = {
		name: readString(block, 0, 100),
		mode: readOctal(block, 100, 8),
		uid: readNumeric(block, 108, 8),
		gid: readNumeric(block, 116, 8),
		size: readNumeric(block, 124, 12),
		mtime: /* @__PURE__ */ new Date(readNumeric(block, 136, 12) * 1e3),
		type: FLAGTYPE[typeflag] || "file",
		linkname: readString(block, 157, 100)
	};
	const magic = readString(block, 257, 6);
	if (isBodyless(header)) header.size = 0;
	if (magic.trim() === "ustar") {
		header.uname = readString(block, 265, 32);
		header.gname = readString(block, 297, 32);
	}
	if (magic === "ustar") header.prefix = readString(block, 345, 155);
	return header;
}
const PAX_MAPPING = {
	path: ["name", (v) => v],
	linkpath: ["linkname", (v) => v],
	size: ["size", (v) => parseInt(v, 10)],
	mtime: ["mtime", parseFloat],
	uid: ["uid", (v) => parseInt(v, 10)],
	gid: ["gid", (v) => parseInt(v, 10)],
	uname: ["uname", (v) => v],
	gname: ["gname", (v) => v]
};
function parsePax(buffer) {
	const decoder = new TextDecoder("utf-8");
	const overrides = Object.create(null);
	const pax = Object.create(null);
	let offset = 0;
	while (offset < buffer.length) {
		const spaceIndex = buffer.indexOf(32, offset);
		if (spaceIndex === -1) break;
		const length = parseInt(decoder.decode(buffer.subarray(offset, spaceIndex)), 10);
		if (Number.isNaN(length) || length === 0) break;
		const recordEnd = offset + length;
		const [key, value] = decoder.decode(buffer.subarray(spaceIndex + 1, recordEnd - 1)).split("=", 2);
		if (key && value !== void 0) {
			pax[key] = value;
			if (Object.hasOwn(PAX_MAPPING, key)) {
				const [targetKey, parser] = PAX_MAPPING[key];
				const parsedValue = parser(value);
				if (typeof parsedValue === "string" || !Number.isNaN(parsedValue)) overrides[targetKey] = parsedValue;
			}
		}
		offset = recordEnd;
	}
	if (Object.keys(pax).length > 0) overrides.pax = pax;
	return overrides;
}
function applyOverrides(header, overrides) {
	if (overrides.name !== void 0) header.name = overrides.name;
	if (overrides.linkname !== void 0) header.linkname = overrides.linkname;
	if (overrides.size !== void 0) header.size = overrides.size;
	if (overrides.mtime !== void 0) header.mtime = /* @__PURE__ */ new Date(overrides.mtime * 1e3);
	if (overrides.uid !== void 0) header.uid = overrides.uid;
	if (overrides.gid !== void 0) header.gid = overrides.gid;
	if (overrides.uname !== void 0) header.uname = overrides.uname;
	if (overrides.gname !== void 0) header.gname = overrides.gname;
	if (overrides.pax) header.pax = Object.assign({}, header.pax ?? {}, overrides.pax);
}
function getMetaParser(type) {
	switch (type) {
		case "pax-global-header":
		case "pax-header": return parsePax;
		case "gnu-long-name": return (data) => ({ name: readString(data, 0, data.length) });
		case "gnu-long-link-name": return (data) => ({ linkname: readString(data, 0, data.length) });
		default: return;
	}
}
function getHeaderBlocks(header) {
	const base = createTarHeader(header);
	const pax = generatePax(header);
	if (!pax) return [base];
	const paxPadding = -pax.paxBody.length & 511;
	const paddingBlocks = paxPadding > 0 ? [ZERO_BLOCK.subarray(0, paxPadding)] : [];
	return [
		pax.paxHeader,
		pax.paxBody,
		...paddingBlocks,
		base
	];
}
//#endregion
//#region src/tar/packer.ts
const EOF_BUFFER = new Uint8Array(512 * 2);
function unpacker_CPCEF5CT_createTarPacker(onData, onError, onFinalize) {
	let currentHeader = null;
	let bytesWritten = 0;
	let finalized = false;
	const fail = (message) => {
		const error = new Error(message);
		onError(error);
		throw error;
	};
	return {
		add(header) {
			if (finalized) fail("No new tar entries after finalize.");
			if (currentHeader !== null) fail("Previous entry must be completed before adding a new one");
			const size = isBodyless(header) ? 0 : header.size;
			if (!Number.isSafeInteger(size) || size < 0) fail("Invalid tar entry size.");
			try {
				const headerBlocks = getHeaderBlocks({
					...header,
					size
				});
				for (const block of headerBlocks) onData(block);
				currentHeader = {
					...header,
					size
				};
				bytesWritten = 0;
			} catch (error) {
				onError(error);
			}
		},
		write(chunk) {
			if (!currentHeader) fail("No active tar entry.");
			if (finalized) fail("Cannot write data after finalize.");
			const newTotal = bytesWritten + chunk.length;
			if (newTotal > currentHeader.size) fail(`"${currentHeader.name}" exceeds given size of ${currentHeader.size} bytes.`);
			try {
				bytesWritten = newTotal;
				onData(chunk);
			} catch (error) {
				onError(error);
			}
		},
		endEntry() {
			if (!currentHeader) fail("No active entry to end.");
			if (finalized) fail("Cannot end entry after finalize.");
			try {
				if (bytesWritten !== currentHeader.size) fail(`Size mismatch for "${currentHeader.name}".`);
				const paddingSize = -currentHeader.size & 511;
				if (paddingSize > 0) onData(new Uint8Array(paddingSize));
				currentHeader = null;
				bytesWritten = 0;
			} catch (error) {
				onError(error);
				throw error;
			}
		},
		finalize() {
			if (finalized) fail("Archive has already been finalized");
			if (currentHeader !== null) fail("Cannot finalize while an entry is still active");
			try {
				onData(EOF_BUFFER);
				finalized = true;
				if (onFinalize) onFinalize();
			} catch (error) {
				onError(error);
			}
		}
	};
}
//#endregion
//#region src/tar/chunk-queue.ts
const INITIAL_CAPACITY = 256;
function createChunkQueue() {
	let chunks = new Array(INITIAL_CAPACITY);
	let capacityMask = chunks.length - 1;
	let head = 0;
	let tail = 0;
	let totalAvailable = 0;
	const consumeFromHead = (count) => {
		const chunk = chunks[head];
		if (count === chunk.length) {
			chunks[head] = EMPTY;
			head = head + 1 & capacityMask;
		} else chunks[head] = chunk.subarray(count);
		totalAvailable -= count;
		if (totalAvailable === 0 && chunks.length > INITIAL_CAPACITY) {
			chunks = new Array(INITIAL_CAPACITY);
			capacityMask = INITIAL_CAPACITY - 1;
			head = 0;
			tail = 0;
		}
	};
	function pull(bytes, callback) {
		if (callback) {
			let fed = 0;
			let remaining = Math.min(bytes, totalAvailable);
			while (remaining > 0) {
				const chunk = chunks[head];
				const toFeed = Math.min(remaining, chunk.length);
				const segment = toFeed === chunk.length ? chunk : chunk.subarray(0, toFeed);
				consumeFromHead(toFeed);
				remaining -= toFeed;
				fed += toFeed;
				if (!callback(segment)) break;
			}
			return fed;
		}
		if (totalAvailable < bytes) return null;
		if (bytes === 0) return EMPTY;
		const firstChunk = chunks[head];
		if (firstChunk.length >= bytes) {
			const view = firstChunk.length === bytes ? firstChunk : firstChunk.subarray(0, bytes);
			consumeFromHead(bytes);
			return view;
		}
		const result = new Uint8Array(bytes);
		let copied = 0;
		let remaining = bytes;
		while (remaining > 0) {
			const chunk = chunks[head];
			const toCopy = Math.min(remaining, chunk.length);
			result.set(toCopy === chunk.length ? chunk : chunk.subarray(0, toCopy), copied);
			copied += toCopy;
			remaining -= toCopy;
			consumeFromHead(toCopy);
		}
		return result;
	}
	return {
		push: (chunk) => {
			if (chunk.length === 0) return;
			let nextTail = tail + 1 & capacityMask;
			if (nextTail === head) {
				const oldLen = chunks.length;
				const newLen = oldLen * 2;
				const newChunks = new Array(newLen);
				const count = tail - head + oldLen & oldLen - 1;
				if (head < tail) for (let i = 0; i < count; i++) newChunks[i] = chunks[head + i];
				else if (count > 0) {
					const firstPart = oldLen - head;
					for (let i = 0; i < firstPart; i++) newChunks[i] = chunks[head + i];
					for (let i = 0; i < tail; i++) newChunks[firstPart + i] = chunks[i];
				}
				chunks = newChunks;
				capacityMask = newLen - 1;
				head = 0;
				tail = count;
				nextTail = tail + 1 & capacityMask;
			}
			chunks[tail] = chunk;
			tail = nextTail;
			totalAvailable += chunk.length;
		},
		available: () => totalAvailable,
		peek: (bytes) => {
			if (totalAvailable < bytes) return null;
			if (bytes === 0) return EMPTY;
			const firstChunk = chunks[head];
			if (firstChunk.length >= bytes) return firstChunk.length === bytes ? firstChunk : firstChunk.subarray(0, bytes);
			const result = new Uint8Array(bytes);
			let copied = 0;
			let index = head;
			while (copied < bytes) {
				const chunk = chunks[index];
				const toCopy = Math.min(bytes - copied, chunk.length);
				if (toCopy === chunk.length) result.set(chunk, copied);
				else result.set(chunk.subarray(0, toCopy), copied);
				copied += toCopy;
				index = index + 1 & capacityMask;
			}
			return result;
		},
		discard: (bytes) => {
			if (bytes > totalAvailable) throw new Error("Too many bytes consumed");
			if (bytes === 0) return;
			let remaining = bytes;
			while (remaining > 0) {
				const chunk = chunks[head];
				const toConsume = Math.min(remaining, chunk.length);
				consumeFromHead(toConsume);
				remaining -= toConsume;
			}
		},
		pull
	};
}
//#endregion
//#region src/tar/unpacker.ts
const STATE_HEADER = 0;
const STATE_BODY = 1;
const truncateErr = /* @__PURE__ */ new Error("Tar archive is truncated.");
function createUnpacker(options = {}) {
	const strict = options.strict ?? false;
	const { available, peek, push, discard, pull } = createChunkQueue();
	let state = STATE_HEADER;
	let ended = false;
	let done = false;
	let eof = false;
	let currentEntry = null;
	const paxGlobals = {};
	let nextEntryOverrides = {};
	const unpacker = {
		isEntryActive: () => state === STATE_BODY,
		isBodyComplete: () => !currentEntry || currentEntry.remaining === 0,
		canFinish: () => !currentEntry || available() >= currentEntry.remaining + currentEntry.padding,
		write(chunk) {
			if (ended) throw new Error("Archive already ended.");
			push(chunk);
		},
		end() {
			ended = true;
		},
		readHeader() {
			if (state !== STATE_HEADER) throw new Error("Cannot read header while an entry is active");
			if (done) return void 0;
			while (!done) {
				if (available() < 512) {
					if (ended) {
						if (available() > 0 && strict) throw truncateErr;
						done = true;
						return;
					}
					return null;
				}
				const headerBlock = peek(512);
				if (isZeroBlock(headerBlock)) {
					if (available() < 512 * 2) {
						if (ended) {
							if (strict) throw truncateErr;
							done = true;
							return;
						}
						return null;
					}
					if (isZeroBlock(peek(512 * 2).subarray(512))) {
						discard(512 * 2);
						done = true;
						eof = true;
						return;
					}
					if (strict) throw new Error("Invalid tar header.");
					discard(512);
					continue;
				}
				let internalHeader;
				try {
					internalHeader = parseUstarHeader(headerBlock, strict);
				} catch (err) {
					if (strict) throw err;
					discard(512);
					continue;
				}
				const metaParser = getMetaParser(internalHeader.type);
				if (metaParser) {
					const paddedSize = internalHeader.size + (-internalHeader.size & 511);
					if (available() < 512 + paddedSize) {
						if (ended && strict) throw truncateErr;
						return null;
					}
					discard(512);
					const overrides = metaParser(pull(paddedSize).subarray(0, internalHeader.size));
					const target = internalHeader.type === "pax-global-header" ? paxGlobals : nextEntryOverrides;
					for (const key in overrides) target[key] = overrides[key];
					continue;
				}
				discard(512);
				const header = internalHeader;
				if (internalHeader.prefix) header.name = `${internalHeader.prefix}/${header.name}`;
				applyOverrides(header, paxGlobals);
				applyOverrides(header, nextEntryOverrides);
				if (header.name.endsWith("/") && header.type === "file") header.type = unpacker_CPCEF5CT_DIRECTORY;
				nextEntryOverrides = {};
				currentEntry = {
					header,
					remaining: header.size,
					padding: -header.size & 511
				};
				state = STATE_BODY;
				return header;
			}
		},
		streamBody(callback) {
			if (state !== STATE_BODY || !currentEntry || currentEntry.remaining === 0) return 0;
			const bytesToFeed = Math.min(currentEntry.remaining, available());
			if (bytesToFeed === 0) return 0;
			const fed = pull(bytesToFeed, callback);
			currentEntry.remaining -= fed;
			return fed;
		},
		skipPadding() {
			if (state !== STATE_BODY || !currentEntry) return true;
			if (currentEntry.remaining > 0) throw new Error("Body not fully consumed");
			if (available() < currentEntry.padding) return false;
			discard(currentEntry.padding);
			currentEntry = null;
			state = STATE_HEADER;
			return true;
		},
		skipEntry() {
			if (state !== STATE_BODY || !currentEntry) return true;
			const toDiscard = Math.min(currentEntry.remaining, available());
			if (toDiscard > 0) {
				discard(toDiscard);
				currentEntry.remaining -= toDiscard;
			}
			if (currentEntry.remaining > 0) return false;
			return unpacker.skipPadding();
		},
		validateEOF() {
			if (strict) {
				if (!eof) throw truncateErr;
				if (available() > 0) {
					if (pull(available()).some((byte) => byte !== 0)) throw new Error("Invalid EOF.");
				}
			}
		}
	};
	return unpacker;
}
function isZeroBlock(block) {
	if (block.byteOffset % 8 === 0) {
		const view = new BigUint64Array(block.buffer, block.byteOffset, block.length / 8);
		for (let i = 0; i < view.length; i++) if (view[i] !== 0n) return false;
		return true;
	}
	for (let i = 0; i < block.length; i++) if (block[i] !== 0) return false;
	return true;
}
//#endregion


// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__(1455);
// EXTERNAL MODULE: external "node:os"
var external_node_os_ = __webpack_require__(8161);
// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__(6760);
// EXTERNAL MODULE: external "node:stream"
var external_node_stream_ = __webpack_require__(7075);
// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__(3024);
;// CONCATENATED MODULE: ./node_modules/modern-tar/dist/fs/index.js






//#region src/fs/cache.ts
const createCache = () => {
	const m = /* @__PURE__ */ new Map();
	return {
		get(k) {
			const v = m.get(k);
			if (m.delete(k)) m.set(k, v);
			return v;
		},
		set(k, v) {
			if (m.set(k, v).size > 1e4) m.delete(m.keys().next().value);
		}
	};
};
//#endregion
//#region src/fs/path.ts
const unicodeCache = createCache();
const normalizeUnicode = (s) => {
	for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) >= 128) {
		const cached = unicodeCache.get(s);
		if (cached !== void 0) return cached;
		const normalized = s.normalize("NFD");
		unicodeCache.set(s, normalized);
		return normalized;
	}
	return s;
};
function validateBounds(targetPath, destDir, errorMessage) {
	const target = normalizeUnicode(external_node_path_.resolve(targetPath));
	const dest = external_node_path_.resolve(destDir);
	if (target !== dest && !target.startsWith(dest + external_node_path_.sep)) throw new Error(errorMessage);
}
const win32Reserved = {
	":": "",
	"<": "",
	">": "",
	"|": "",
	"?": "",
	"*": "",
	"\"": ""
};
function normalizeName(name) {
	const path = name.replace(/\\/g, "/");
	if (path.split("/").includes("..") || /^[a-zA-Z]:\.\./.test(path)) throw new Error(`${name} points outside extraction directory`);
	let relative = path;
	if (/^[a-zA-Z]:/.test(relative)) relative = relative.replace(/^[a-zA-Z]:[/\\]?/, "");
	else if (relative.startsWith("/")) relative = relative.replace(/^\/+/, "");
	if (process.platform === "win32") return relative.replace(/[<>:"|?*]/g, (char) => win32Reserved[char]);
	return relative;
}
const normalizeHeaderName = (s) => normalizeUnicode(normalizeName(s.replace(/\/+$/, "")));
//#endregion
//#region src/fs/pack.ts
const packTarSources = (/* unused pure expression or super */ null && (packTar));
function packTar(sources, options = {}) {
	const stream = new Readable({ read() {} });
	(async () => {
		const packer = createTarPacker((chunk) => stream.push(Buffer.from(chunk)), stream.destroy.bind(stream), () => stream.push(null));
		const { dereference = false, filter, map, baseDir, concurrency = cpus().length || 8 } = options;
		const isDir = typeof sources === "string";
		const directoryPath = isDir ? path.resolve(sources) : null;
		const jobs = isDir ? (await fs$1.readdir(directoryPath, { withFileTypes: true })).map((entry) => ({
			type: entry.isDirectory() ? DIRECTORY : FILE,
			source: path.join(directoryPath, entry.name),
			target: entry.name
		})) : sources;
		const results = /* @__PURE__ */ new Map();
		const resolvers = /* @__PURE__ */ new Map();
		const seenInodes = /* @__PURE__ */ new Map();
		let jobIndex = 0;
		let writeIndex = 0;
		let activeWorkers = 0;
		let allJobsQueued = false;
		const writer = async () => {
			const readBufferSmall = Buffer.alloc(64 * 1024);
			let readBufferLarge = null;
			while (true) {
				if (stream.destroyed) return;
				if (allJobsQueued && writeIndex >= jobs.length) break;
				if (!results.has(writeIndex)) {
					await new Promise((resolve) => resolvers.set(writeIndex, resolve));
					continue;
				}
				const result = results.get(writeIndex);
				results.delete(writeIndex);
				resolvers.delete(writeIndex);
				if (!result) {
					writeIndex++;
					continue;
				}
				packer.add(result.header);
				if (result.body) if (result.body instanceof Uint8Array) {
					if (result.body.length > 0) packer.write(result.body);
				} else if (result.body instanceof Readable || result.body instanceof ReadableStream) try {
					for await (const chunk of result.body) {
						if (stream.destroyed) break;
						packer.write(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
					}
				} catch (error) {
					stream.destroy(error);
					return;
				}
				else {
					const { handle, size } = result.body;
					const readBuffer = size > 1048576 ? readBufferLarge ??= Buffer.alloc(512 * 1024) : readBufferSmall;
					try {
						let bytesLeft = size;
						while (bytesLeft > 0 && !stream.destroyed) {
							const toRead = Math.min(bytesLeft, readBuffer.length);
							const { bytesRead } = await handle.read(readBuffer, 0, toRead, null);
							if (bytesRead === 0) break;
							packer.write(readBuffer.subarray(0, bytesRead));
							bytesLeft -= bytesRead;
						}
					} catch (error) {
						stream.destroy(error);
						return;
					} finally {
						await handle.close();
					}
				}
				packer.endEntry();
				writeIndex++;
			}
		};
		const controller = () => {
			if (stream.destroyed || allJobsQueued) return;
			while (activeWorkers < concurrency && jobIndex < jobs.length) {
				activeWorkers++;
				const currentIndex = jobIndex++;
				processJob(jobs[currentIndex], currentIndex).catch(stream.destroy.bind(stream)).finally(() => {
					activeWorkers--;
					controller();
				});
			}
			if (activeWorkers === 0 && jobIndex >= jobs.length) {
				allJobsQueued = true;
				resolvers.get(writeIndex)?.();
			}
		};
		const processJob = async (job, index) => {
			let jobResult = null;
			const target = normalizeName(job.target);
			try {
				if (job.type === "content" || job.type === "stream") {
					let body;
					let size;
					const isDir = target.endsWith("/");
					if (job.type === "stream") {
						if (!isDir && job.size <= 0 || isDir && job.size !== 0) throw new Error(isDir ? "Streams for directories must have size 0." : "Streams require a positive size.");
						size = job.size;
						body = job.content;
					} else {
						const content = await normalizeBody(job.content);
						size = content.length;
						body = content;
					}
					const stat = {
						size: isDir ? 0 : size,
						isFile: () => !isDir,
						isDirectory: () => isDir,
						isSymbolicLink: () => false,
						mode: job.mode,
						mtime: job.mtime ?? /* @__PURE__ */ new Date(),
						uid: job.uid ?? 0,
						gid: job.gid ?? 0
					};
					if (filter && !filter(target, stat)) return;
					let header = {
						name: target,
						type: isDir ? DIRECTORY : FILE,
						size: isDir ? 0 : size,
						mode: stat.mode,
						mtime: stat.mtime,
						uid: stat.uid,
						gid: stat.gid,
						uname: job.uname,
						gname: job.gname
					};
					if (map) header = map(header);
					jobResult = {
						header,
						body: isDir ? void 0 : body
					};
					return;
				}
				let stat = await fs$1.lstat(job.source, { bigint: true });
				if (dereference && stat.isSymbolicLink()) {
					const linkTarget = await fs$1.readlink(job.source);
					const resolved = path.resolve(path.dirname(job.source), linkTarget);
					const resolvedBase = baseDir ?? directoryPath ?? process.cwd();
					if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) return;
					stat = await fs$1.stat(job.source, { bigint: true });
				}
				if (filter && !filter(job.source, stat)) return;
				let header = {
					name: target,
					size: 0,
					mode: job.mode ?? Number(stat.mode),
					mtime: job.mtime ?? stat.mtime,
					uid: job.uid ?? Number(stat.uid),
					gid: job.gid ?? Number(stat.gid),
					uname: job.uname,
					gname: job.gname,
					type: FILE
				};
				let body;
				if (stat.isDirectory()) {
					header.type = DIRECTORY;
					header.name = target.endsWith("/") ? target : `${target}/`;
					try {
						for (const d of await fs$1.readdir(job.source, { withFileTypes: true })) jobs.push({
							type: d.isDirectory() ? DIRECTORY : FILE,
							source: path.join(job.source, d.name),
							target: `${header.name}${d.name}`
						});
					} catch {}
				} else if (stat.isSymbolicLink()) {
					header.type = SYMLINK;
					header.linkname = await fs$1.readlink(job.source);
				} else if (stat.isFile()) {
					header.size = Number(stat.size);
					if (stat.nlink > 1 && seenInodes.has(stat.ino)) {
						header.type = LINK;
						header.linkname = seenInodes.get(stat.ino);
						header.size = 0;
					} else {
						if (stat.nlink > 1) seenInodes.set(stat.ino, target);
						if (header.size > 0) if (header.size < 32 * 1024) body = await fs$1.readFile(job.source);
						else body = {
							handle: await fs$1.open(job.source, "r"),
							size: header.size
						};
					}
				} else return;
				if (map) header = map(header);
				jobResult = {
					header,
					body
				};
			} finally {
				results.set(index, jobResult);
				resolvers.get(index)?.();
			}
		};
		controller();
		await writer();
		if (!stream.destroyed) packer.finalize();
	})().catch((error) => stream.destroy(error));
	return stream;
}
//#endregion
//#region src/fs/concurrency.ts
const createOperationQueue = (concurrency) => {
	let active = 0;
	const tasks = [];
	let head = 0;
	let idle = null;
	let resolveIdle = null;
	const ensureIdle = () => idle ??= new Promise((resolve) => resolveIdle = resolve);
	const flush = () => {
		while (active < concurrency && head < tasks.length) {
			const task = tasks[head++];
			active++;
			task().finally(() => {
				active--;
				flush();
			});
		}
		if (head === tasks.length) {
			tasks.length = 0;
			head = 0;
			if (active === 0 && resolveIdle) {
				resolveIdle();
				idle = null;
				resolveIdle = null;
			}
		}
	};
	return {
		add(op) {
			const wasIdle = active === 0 && head === tasks.length;
			return new Promise((resolve, reject) => {
				tasks.push(() => Promise.resolve().then(op).then(resolve, reject));
				if (wasIdle) ensureIdle();
				flush();
			});
		},
		onIdle() {
			return active === 0 && head === tasks.length ? Promise.resolve() : ensureIdle();
		}
	};
};
//#endregion
//#region src/fs/file-sink.ts
const BATCH_BYTES = 256 * 1024;
const OPEN_FLAGS = external_node_fs_.constants.O_WRONLY | external_node_fs_.constants.O_CREAT | external_node_fs_.constants.O_TRUNC | (external_node_fs_.constants.O_NOFOLLOW ?? 0);
const STATE_UNOPENED = 0;
const STATE_OPENING = 1;
const STATE_OPEN = 2;
const STATE_CLOSED = 3;
const STATE_FAILED = 4;
const DRAINED_PROMISE = Promise.resolve();
function createFileSink(path, { mode = 438, mtime } = {}) {
	let state = STATE_UNOPENED;
	let flushing = false;
	let fd = null;
	let queue = [];
	let spare = [];
	let bytes = 0;
	let storedError = null;
	let endPromise = null;
	let endResolve = null;
	let endReject = null;
	const waitResolves = [];
	const waitRejects = [];
	const settleWaiters = () => {
		if (waitResolves.length === 0) return;
		for (let i = 0; i < waitResolves.length; i++) waitResolves[i]();
		waitResolves.length = 0;
		waitRejects.length = 0;
	};
	const failWaiters = (error) => {
		if (waitRejects.length === 0) return;
		for (let i = 0; i < waitRejects.length; i++) waitRejects[i](error);
		waitRejects.length = 0;
		waitResolves.length = 0;
	};
	const resetBuffers = () => {
		bytes = 0;
		queue.length = 0;
		spare.length = 0;
	};
	const finish = () => {
		state = STATE_CLOSED;
		endResolve?.();
		settleWaiters();
	};
	const swapQueues = () => {
		const current = queue;
		queue = spare;
		spare = current;
		queue.length = 0;
		return current;
	};
	const fail = (error) => {
		if (storedError) return;
		storedError = error;
		state = STATE_FAILED;
		resetBuffers();
		flushing = false;
		const fdToClose = fd;
		fd = null;
		if (fdToClose !== null) external_node_fs_.ftruncate(fdToClose, 0, () => external_node_fs_.close(fdToClose));
		endReject?.(error);
		failWaiters(error);
	};
	const close = () => {
		if (fd === null) {
			finish();
			return;
		}
		const fdToClose = fd;
		fd = null;
		if (mtime) external_node_fs_.futimes(fdToClose, mtime, mtime, (err) => {
			if (err) return fail(err);
			external_node_fs_.close(fdToClose, (closeErr) => {
				if (closeErr) fail(closeErr);
				else finish();
			});
		});
		else external_node_fs_.close(fdToClose, (err) => {
			if (err) fail(err);
			else finish();
		});
	};
	const flush = () => {
		if (flushing || queue.length === 0 || state !== STATE_OPEN) return;
		flushing = true;
		const bufs = swapQueues();
		const onDone = (err, written = 0) => {
			if (err) return fail(err);
			flushing = false;
			bytes -= written;
			spare.length = 0;
			if (bytes < BATCH_BYTES) settleWaiters();
			if (queue.length > 0) flush();
			else if (endResolve) close();
		};
		if (bufs.length === 1) {
			const buf = bufs[0];
			external_node_fs_.write(fd, buf, 0, buf.length, null, onDone);
		} else external_node_fs_.writev(fd, bufs, onDone);
	};
	const open = () => {
		if (state !== STATE_UNOPENED) return;
		state = STATE_OPENING;
		external_node_fs_.open(path, OPEN_FLAGS, mode, (err, openFd) => {
			if (err) return fail(err);
			if (state === STATE_CLOSED || state === STATE_FAILED) {
				external_node_fs_.close(openFd);
				return;
			}
			fd = openFd;
			state = STATE_OPEN;
			if (endResolve) if (queue.length > 0) flush();
			else close();
			else if (bytes >= BATCH_BYTES && !flushing) flush();
			else settleWaiters();
		});
	};
	const write = (chunk) => {
		if (storedError || state >= STATE_CLOSED || endResolve) return false;
		if (state !== STATE_OPEN && state !== STATE_OPENING) open();
		const buf = Buffer.isBuffer(chunk) ? chunk : chunk instanceof Uint8Array ? Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength) : Buffer.from(chunk);
		if (buf.length === 0) return bytes < BATCH_BYTES;
		queue.push(buf);
		bytes += buf.length;
		if (state === STATE_OPEN && !flushing && bytes >= BATCH_BYTES) flush();
		return bytes < BATCH_BYTES;
	};
	const waitDrain = () => {
		if (bytes < BATCH_BYTES || state !== STATE_OPEN) return DRAINED_PROMISE;
		return new Promise((resolve, reject) => {
			waitResolves.push(resolve);
			waitRejects.push(reject);
		});
	};
	const end = () => {
		if (state >= STATE_CLOSED) return DRAINED_PROMISE;
		if (storedError) return Promise.reject(storedError);
		if (endPromise) return endPromise;
		endPromise = new Promise((resolve, reject) => {
			endResolve = resolve;
			endReject = reject;
			if (state !== STATE_OPEN && state !== STATE_OPENING) open();
			else if (state === STATE_OPEN && !flushing) if (queue.length > 0) flush();
			else close();
		});
		return endPromise;
	};
	const destroy = (error) => {
		if (error) {
			fail(error);
			return;
		}
		if (state >= STATE_CLOSED || storedError) return;
		resetBuffers();
		flushing = false;
		if (fd !== null) {
			const fdToClose = fd;
			fd = null;
			external_node_fs_.close(fdToClose);
		}
		finish();
	};
	return {
		write,
		end,
		destroy,
		waitDrain
	};
}
//#endregion
//#region src/fs/path-cache.ts
const ENOENT = "ENOENT";
const createPathCache = (destDirPath, options) => {
	const { maxDepth = 1024, dmode } = options;
	const dirPromises = createCache();
	const pathConflicts = /* @__PURE__ */ new Map();
	const deferredLinks = [];
	const realDirCache = createCache();
	const initializeDestDir = async (destDirPath) => {
		const symbolic = normalizeUnicode(external_node_path_.resolve(destDirPath));
		try {
			await promises_.mkdir(symbolic, { recursive: true });
		} catch (err) {
			if (err.code === ENOENT) {
				const parentDir = external_node_path_.dirname(symbolic);
				if (parentDir === symbolic) throw err;
				await promises_.mkdir(parentDir, { recursive: true });
				await promises_.mkdir(symbolic, { recursive: true });
			} else throw err;
		}
		try {
			return {
				symbolic,
				real: await promises_.realpath(symbolic)
			};
		} catch (err) {
			if (err.code === ENOENT) return {
				symbolic,
				real: symbolic
			};
			throw err;
		}
	};
	const destDirPromise = initializeDestDir(destDirPath);
	destDirPromise.catch(() => {});
	const getRealDir = async (dirPath, errorMessage) => {
		const destDir = await destDirPromise;
		if (dirPath === destDir.symbolic) {
			validateBounds(destDir.real, destDir.real, errorMessage);
			return destDir.real;
		}
		let promise = realDirCache.get(dirPath);
		if (!promise) {
			promise = promises_.realpath(dirPath).then((realPath) => {
				validateBounds(realPath, destDir.real, errorMessage);
				return realPath;
			});
			realDirCache.set(dirPath, promise);
		}
		const realDir = await promise;
		validateBounds(realDir, destDir.real, errorMessage);
		return realDir;
	};
	const prepareDirectory = async (dirPath, mode) => {
		let promise = dirPromises.get(dirPath);
		if (promise) return promise;
		promise = (async () => {
			if (dirPath === (await destDirPromise).symbolic) return;
			await prepareDirectory(external_node_path_.dirname(dirPath));
			try {
				const stat = await promises_.lstat(dirPath);
				if (stat.isDirectory()) return;
				if (stat.isSymbolicLink()) try {
					const realPath = await getRealDir(dirPath, `Symlink "${dirPath}" points outside the extraction directory.`);
					if ((await promises_.stat(realPath)).isDirectory()) return;
				} catch (err) {
					if (err.code === ENOENT) throw new Error(`Symlink "${dirPath}" points outside the extraction directory.`);
					throw err;
				}
				throw new Error(`"${dirPath}" is not a valid directory component.`);
			} catch (err) {
				if (err.code === ENOENT) {
					await promises_.mkdir(dirPath, { mode: mode ?? options.dmode });
					return;
				}
				throw err;
			}
		})();
		dirPromises.set(dirPath, promise);
		return promise;
	};
	return {
		async ready() {
			await destDirPromise;
		},
		async preparePath(header) {
			const { name, linkname, type, mode, mtime } = header;
			const normalizedName = normalizeHeaderName(name);
			const destDir = await destDirPromise;
			const outPath = external_node_path_.join(destDir.symbolic, normalizedName);
			validateBounds(outPath, destDir.symbolic, `Entry "${name}" points outside the extraction directory.`);
			if (maxDepth !== Infinity) {
				let depth = 1;
				for (const char of normalizedName) if (char === "/" && ++depth > maxDepth) throw new Error("Tar exceeds max specified depth.");
			}
			const prevOp = pathConflicts.get(normalizedName);
			if (prevOp) {
				if (prevOp === "directory" && type !== "directory" || prevOp !== "directory" && type === "directory") throw new Error(`Path conflict ${type} over existing ${prevOp} at "${name}"`);
				return;
			}
			const parentDir = external_node_path_.dirname(outPath);
			switch (type) {
				case unpacker_CPCEF5CT_DIRECTORY: {
					pathConflicts.set(normalizedName, unpacker_CPCEF5CT_DIRECTORY);
					const safeMode = mode ? mode & 511 : void 0;
					await prepareDirectory(outPath, dmode ?? safeMode);
					if (mtime) await promises_.lutimes(outPath, mtime, mtime).catch(() => {});
					return;
				}
				case unpacker_CPCEF5CT_FILE:
					pathConflicts.set(normalizedName, unpacker_CPCEF5CT_FILE);
					await prepareDirectory(parentDir);
					return outPath;
				case unpacker_CPCEF5CT_SYMLINK:
					pathConflicts.set(normalizedName, unpacker_CPCEF5CT_SYMLINK);
					if (!linkname) return;
					await prepareDirectory(parentDir);
					validateBounds(external_node_path_.resolve(parentDir, linkname), destDir.symbolic, `Symlink "${linkname}" points outside the extraction directory.`);
					await promises_.symlink(linkname, outPath);
					if (mtime) await promises_.lutimes(outPath, mtime, mtime).catch(() => {});
					return;
				case unpacker_CPCEF5CT_LINK: {
					pathConflicts.set(normalizedName, unpacker_CPCEF5CT_LINK);
					if (!linkname) return;
					const normalizedLink = normalizeUnicode(linkname);
					if (external_node_path_.isAbsolute(normalizedLink)) throw new Error(`Hardlink "${linkname}" points outside the extraction directory.`);
					const linkTarget = external_node_path_.join(destDir.symbolic, normalizedLink);
					validateBounds(linkTarget, destDir.symbolic, `Hardlink "${linkname}" points outside the extraction directory.`);
					await prepareDirectory(external_node_path_.dirname(linkTarget));
					const realTargetParent = await getRealDir(external_node_path_.dirname(linkTarget), `Hardlink "${linkname}" points outside the extraction directory.`);
					validateBounds(external_node_path_.join(realTargetParent, external_node_path_.basename(linkTarget)), destDir.real, `Hardlink "${linkname}" points outside the extraction directory.`);
					if (linkTarget !== outPath) {
						await prepareDirectory(parentDir);
						deferredLinks.push({
							linkTarget,
							outPath
						});
					}
					return;
				}
				default: return;
			}
		},
		async applyLinks() {
			for (const { linkTarget, outPath } of deferredLinks) try {
				await promises_.link(linkTarget, outPath);
			} catch (err) {
				if (err.code === ENOENT) throw new Error(`Hardlink target "${linkTarget}" does not exist for link at "${outPath}".`);
				throw err;
			}
		}
	};
};
//#endregion
//#region src/fs/unpack.ts
function unpackTar(directoryPath, options = {}) {
	const unpacker = createUnpacker(options);
	const opQueue = createOperationQueue(options.concurrency || (0,external_node_os_.cpus)().length || 8);
	const pathCache = createPathCache(directoryPath, options);
	let currentFileStream = null;
	let currentWriteCallback = null;
	let queuedError = null;
	const onQueuedError = (err) => {
		queuedError ??= err;
		if (!writable.destroyed) writable.destroy(err);
	};
	const writable = new external_node_stream_.Writable({
		async write(chunk, _, cb) {
			try {
				unpacker.write(chunk);
				if (unpacker.isEntryActive()) {
					if (currentFileStream && currentWriteCallback) {
						let needsDrain = false;
						const writeCallback = currentWriteCallback;
						while (!unpacker.isBodyComplete()) {
							needsDrain = false;
							if (unpacker.streamBody(writeCallback) === 0) if (needsDrain) await currentFileStream.waitDrain();
							else {
								cb();
								return;
							}
						}
						while (!unpacker.skipPadding()) {
							cb();
							return;
						}
						const streamToClose = currentFileStream;
						if (streamToClose) opQueue.add(() => streamToClose.end()).catch(onQueuedError);
						currentFileStream = null;
						currentWriteCallback = null;
					} else if (!unpacker.skipEntry()) {
						cb();
						return;
					}
				}
				while (true) {
					const header = unpacker.readHeader();
					if (header === void 0 || header === null) {
						cb();
						return;
					}
					const transformedHeader = transformHeader(header, options);
					if (!transformedHeader) {
						if (!unpacker.skipEntry()) {
							cb();
							return;
						}
						continue;
					}
					const outPath = await opQueue.add(() => pathCache.preparePath(transformedHeader));
					if (outPath) {
						const safeMode = transformedHeader.mode ? transformedHeader.mode & 511 : void 0;
						const fileStream = createFileSink(outPath, {
							mode: options.fmode ?? safeMode,
							mtime: transformedHeader.mtime ?? void 0
						});
						let needsDrain = false;
						const writeCallback = (chunk) => {
							const writeOk = fileStream.write(chunk);
							if (!writeOk) needsDrain = true;
							return writeOk;
						};
						while (!unpacker.isBodyComplete()) {
							needsDrain = false;
							if (unpacker.streamBody(writeCallback) === 0) if (needsDrain) await fileStream.waitDrain();
							else {
								currentFileStream = fileStream;
								currentWriteCallback = writeCallback;
								cb();
								return;
							}
						}
						while (!unpacker.skipPadding()) {
							currentFileStream = fileStream;
							currentWriteCallback = writeCallback;
							cb();
							return;
						}
						opQueue.add(() => fileStream.end()).catch(onQueuedError);
					} else if (!unpacker.skipEntry()) {
						cb();
						return;
					}
				}
			} catch (err) {
				cb(err);
			}
		},
		async final(cb) {
			try {
				unpacker.end();
				unpacker.validateEOF();
				await pathCache.ready();
				await opQueue.onIdle();
				if (queuedError) throw queuedError;
				await pathCache.applyLinks();
				cb();
			} catch (err) {
				cb(err);
			}
		},
		destroy(error, callback) {
			(async () => {
				if (currentFileStream) {
					currentFileStream.destroy(error ?? void 0);
					currentFileStream = null;
					currentWriteCallback = null;
				}
				await opQueue.onIdle();
			})().then(() => callback(error ?? null), (e) => callback(error ?? (e instanceof Error ? e : /* @__PURE__ */ new Error("Stream destroyed"))));
		}
	});
	return writable;
}
//#endregion



/***/ })

};
;