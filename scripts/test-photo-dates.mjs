import assert from "node:assert/strict";
import { formatPhotoDate } from "../src/lib/photo-date.ts";

assert.equal(formatPhotoDate("2026-08-15", "bn"), "১৫ আগস্ট ২০২৬");
assert.equal(formatPhotoDate("2026-10-15", "bn"), "১৫ অক্টোবর ২০২৬");
assert.equal(formatPhotoDate("2026-08-15", "en"), "15 August 2026");
assert.equal(formatPhotoDate("2026-10-15", "en"), "15 October 2026");

assert.equal(formatPhotoDate("2026-01-01", "bn"), "১ জানুয়ারি ২০২৬");
assert.equal(formatPhotoDate("2024-02-29", "en"), "29 February 2024");
assert.equal(formatPhotoDate("2024-02-29", "bn"), "২৯ ফেব্রুয়ারি ২০২৪");

for (const value of [
  undefined,
  "",
  "2026-13-01",
  "2026-00-10",
  "2026-08-00",
  "2026-04-31",
  "2023-02-29",
  "2026-02-29",
  "15 August 2026",
  "2026-08-15T00:00:00Z",
  "2026-8-15",
]) {
  assert.equal(formatPhotoDate(value, "en"), null, value);
  assert.equal(formatPhotoDate(value, "bn"), null, value);
}

console.log("photo date formatting passed");
