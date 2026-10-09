import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../../app-v5.js", import.meta.url), "utf8");
const start = source.indexOf("function getVideoExtension(file)");
const end = source.indexOf("async function uploadLargeRankedEvidence(", start);
assert.ok(start > 0 && end > start);
const snippet = source.slice(start, end);
const runtime = {
  Blob, Uint8Array, DataView, Number, String, Object, Math, Promise, Error,
  setTimeout, clearTimeout,
  URL: { createObjectURL: () => "blob:video-test", revokeObjectURL: () => {} },
  document: {
    createElement: () => ({
      load() { queueMicrotask(() => this.onerror?.()); },
      removeAttribute() {},
      set src(value) {},
      readyState: 0,
    }),
  },
};
runInNewContext(snippet + "\nglobalThis.api={getVideoExtension,videoUploadContentType,getIsoBmffVideoDuration,getVideoDuration};", runtime);
const { getIsoBmffVideoDuration, getVideoDuration, videoUploadContentType } = runtime.api;

function atom(type, bytes) {
  const data = Buffer.from(bytes);
  const out = Buffer.alloc(8 + data.length);
  out.writeUInt32BE(out.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  return out;
}
function makeMovie(seconds, version = 0) {
  const mvhd = Buffer.alloc(version === 0 ? 24 : 36);
  mvhd[0] = version;
  if (version === 0) {
    mvhd.writeUInt32BE(1000, 12);
    mvhd.writeUInt32BE(Math.floor(seconds * 1000), 16);
  } else {
    mvhd.writeUInt32BE(1000, 20);
    mvhd.writeBigUInt64BE(BigInt(Math.floor(seconds * 1000)), 24);
  }
  const mp4 = Buffer.concat([
    atom("ftyp", Buffer.from("isom0000")),
    atom("mdat", Buffer.alloc(120000, 42)),
    atom("moov", atom("mvhd", mvhd)),
  ]);
  return Object.assign(new Blob([mp4], { type: "application/octet-stream" }), { name: "iPhone_clip.MOV" });
}

test("MOV metadata at the end of the file works even when browser rejects it", async () => {
  const file = makeMovie(8);
  assert.equal(videoUploadContentType(file), "video/quicktime");
  assert.equal(await getIsoBmffVideoDuration(file), 8);
  assert.equal(await getVideoDuration(file), 8);
});

test("MOV v1 metadata is supported and can reject videos exceeding one minute", async () => {
  const file = makeMovie(62, 1);
  const duration = await getVideoDuration(file);
  assert.equal(duration, 62);
  assert.ok(duration > 60, "caller must reject above-limit videos");
});

test("generic file manager MIME is normalized to an allowed Supabase type", () => {
  const mov = Object.assign(new Blob([]), { name: "victoria.mov" });
  const mp4 = Object.assign(new Blob([]), { name: "victoria.mp4" });
  const bad = Object.assign(new Blob([]), { name: "document.pdf" });
  assert.equal(videoUploadContentType(mov), "video/quicktime");
  assert.equal(videoUploadContentType(mp4), "video/mp4");
  assert.equal(videoUploadContentType(bad), null);
});

test("all three modules reuse the duration helper or storage MIME normalization", () => {
  const daily = source.slice(source.indexOf("async function dailyUploadVictoryVideo()"), source.indexOf("async function dailySubmitClaim(", source.indexOf("async function dailyUploadVictoryVideo()")));
  assert.match(daily, /getVideoDuration\(file\)/);
  assert.match(daily, /contentType:mime/);
  assert.doesNotMatch(daily, /setTimeout\(\(\)=>reject\(Error\('NO SE PUDO COMPROBAR LA DURACIÓN DEL VIDEO'\)/);
  assert.match(source, /bucketName:'ranked-match-videos'.*contentType:videoUploadContentType\(file\)/);
  assert.match(source, /from\('dynamic-videos'\).upload\(path,file,\{contentType,upsert:false\}\)/);
});
