# Photo dates

Construction photographs can show when they were taken and when someone last confirmed that the picture still matches the building’s condition.

Visitors only see a date that a person has entered. An empty date is omitted. The site never prints “current condition” or “recently updated” from a missing or automatic timestamp.

## Where to edit

Edit one file:

`src/config/assets.ts`

Each construction photograph may include:

```ts
takenAt?: string;        // YYYY-MM-DD, the original capture date
lastVerifiedAt?: string; // YYYY-MM-DD, a later check that the photo still matches the site
```

Do not add these fields to `logo`.

`takenAt` stays as first entered unless it was wrong and you are correcting it. `lastVerifiedAt` changes only after someone has looked at the real building (or another reliable source) and confirmed that this photograph still shows the current condition. Do not change either date just to make an older photograph look new.

After the edit, commit and push. Publishing still depends on the production deploy workflow being on `master` with its secrets configured. That workflow is not on `master` yet, so a push of this metadata does not by itself update the live site.

## Example

These dates are an editing example. They are not dates for this project. Do not paste them onto a photograph unless you have confirmed them.

```ts
previewEntrance: {
  id: "preview-entrance",
  // ...src, size, alt, caption, and original stay as they are
  takenAt: "2026-08-15",
  lastVerifiedAt: "2026-10-15",
},
```

Bangla then shows:

- ছবি তোলা: ১৫ আগস্ট ২০২৬
- সর্বশেষ অবস্থা যাচাই: ১৫ অক্টোবর ২০২৬

English shows:

- Photo taken: 15 August 2026
- Condition last verified: 15 October 2026

Labels live in `src/content/bn.ts` and `src/content/en.ts` under `photoDates`. The formatted date is produced from the ISO value; you do not type the Bangla or English sentence into the photo entry.

A value that is not a real `YYYY-MM-DD` date is ignored, same as leaving the field off.

## What is still unconfirmed

No capture date in this repository is reliable enough to publish. Every construction photograph below has `takenAt` and `lastVerifiedAt` unset.

| Photo key | Original file | Why the date is unset |
| --- | --- | --- |
| `heroExterior` | `collections/3e3cba6d-f9fd-4992-b21a-49c638600d19.jpg` | The filename is an identifier, not a capture date. |
| `constructionStreet` | `collections/WhatsApp Image 2026-10-14 at 18.02.17.jpeg` | `2026-10-14` is a WhatsApp send or export stamp, not proof of when the camera took the picture. |
| `previewEntrance` | `collections/WhatsApp Image 2026-10-14 at 18.02.16 (1).jpeg` | Same WhatsApp stamp. |
| `previewArches` | `collections/WhatsApp Image 2026-10-14 at 04.36.25 (1).jpeg` | Same WhatsApp stamp. |
| `previewGate` | `collections/WhatsApp Image 2026-10-14 at 18.02.16.jpeg` | Same WhatsApp stamp. |
| `streetFrontage` | `collections/WhatsApp Image 2026-10-14 at 04.36.25 (2).jpeg` | Same WhatsApp stamp. |
| `exteriorSide` | `collections/WhatsApp Image 2026-10-14 at 04.36.26 (1).jpeg` | Same WhatsApp stamp. |
| `entranceAlcove` | `collections/WhatsApp Image 2026-10-14 at 04.36.26.jpeg` | Same WhatsApp stamp. |

File creation time, upload time, and Git commit time were not used. `lastVerifiedAt` is unset on all of them because nobody has recorded a check that the photograph still matches the construction.

To publish a date, confirm it outside these filenames, then set that field on the matching key in `src/config/assets.ts`.
