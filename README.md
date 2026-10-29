# EduApp

A React Native maths study app for IB, CBSE and other secondary-school students.

- **IB Mathematics AA and AI** – topic questions with answers, worked solutions and calculator / no-calculator markers.
- **CBSE Grade 12** – worked examples by chapter, rendered with proper maths typesetting (LaTeX), plus final answers.
- **Topics** – each topic shows how much is mastered, a Practise button (unmastered questions first), a "Review missed" set, and every question with its answer and solution a tap away. "Show solutions" opens them all for reading through.
- **Practice sessions** – one question at a time: try it, reveal the answer, mark "Got it" or "Not yet". Missed questions come back for review (spaced repetition). Courses also offer mixed practice across topics, a 15-minute timed test and, for IB, a no-calculator set.
- **Today** – a daily-goal ring (5, 10, 20 or 30 questions), streak, questions due for review, "Continue" for the last topic, saved questions and mistakes, and search across topics and questions.
- **Tutor** – an AI maths tutor that knows the student's board and grade and writes maths in LaTeX. It can also be opened on a specific question or topic. Students agree once before anything is sent to OpenAI, and can report any answer.
- **Accounts** – sign up, sign in, forgot password, view and edit profile, sign out, delete account. Only name, grade and board are collected.
- **Design** – follows Apple's Human Interface Guidelines: large titles, grouped lists, capsule controls and Liquid Glass-style floating controls (tab bar, toolbar buttons, action bars). The app follows the phone's light or dark appearance.

Built with React Native 0.88 (New Architecture), React Navigation 7 and [Appwrite](https://appwrite.io) for accounts, data and server functions. The AI tutor calls OpenAI from an Appwrite Function, so no secret key ships inside the app.

## Project layout

```
App.tsx                      Providers (safe area, auth, study progress) and navigation
src/
  auth/AuthContext.js        Session, sign in/up/out, profile, password reset, account deletion
  navigation/                Root stack (switches on auth state) and the glass tab bar
  screens/                   Sign in/up, forgot password, profile form, home, course, topic, practice,
                             search, tutor, question tutor, profile
  components/                Shared UI (glass, lists, buttons, rings, icons), MathText
                             (text with $...$ / $$...$$ formulas) and MathView (one formula)
  math/                      The maths engine (MathJax 4: TeX → drawing), its font files,
                             and the prepared sizes of the bundled formulas
  study/                     Progress, spaced repetition, streaks and daily goal (saved to the account)
  theme.js                   Light and dark colours, text styles and corner radii
  services/                  Profile rows and the AI tutor client
  content/                   Loads and groups the question data
  lib/                       Appwrite client, error messages, validation, maths parsing
  mathTopics/                Question data (JSON)
appwrite/functions/          Server code: ask-ai (OpenAI proxy) and delete-account
web/reset-password/          Static page that completes password resets
scripts/                     Content validation/repair, maths preparation, icon generation,
                             profile migration
__tests__/                   Jest tests (auth flows, screens, functions, content)
```

## Requirements

- Node.js 22.11 or newer
- Android: Android Studio with SDK Platform 37, build tools 37.0.0 and NDK 27.1.12297006; JDK 17 or newer
- iOS: macOS with Xcode 26 or newer, Ruby and Bundler (for CocoaPods)
- An Appwrite project (Appwrite Cloud or self-hosted 1.6+) and an OpenAI API key

## Getting started

```bash
npm install
cp .env.example .env          # then fill in the values (see "Configuration")

# iOS only
bundle install
cd ios && bundle exec pod install && cd ..

npm start                     # Metro
npm run android               # or: npm run ios
```

After changing `.env`, restart Metro with `npm start -- --reset-cache` so the new values are compiled in.

If required settings are missing, the app opens on an "App setup needed" screen that lists them.

## Configuration

All settings live in `.env` (never committed). They are compiled into the app, so they must not contain secrets.

| Variable | Required | Where to find it |
| --- | --- | --- |
| `APPWRITE_ENDPOINT` | yes | Appwrite console → Overview (e.g. `https://fra.cloud.appwrite.io/v1`) |
| `APPWRITE_PROJECT_ID` | yes | Appwrite console → Overview |
| `APPWRITE_DATABASE_ID` | yes | Databases → your database (was `database1Id` in the old `constants.js`) |
| `APPWRITE_USER_ACCOUNTS_TABLE_ID` | yes | The `UserAccounts` table (was `UserAccountsId`) |
| `APPWRITE_AI_FUNCTION_ID` | for the Tutor | ID of the deployed `ask-ai` function |
| `APPWRITE_DELETE_ACCOUNT_FUNCTION_ID` | for account deletion | ID of the deployed `delete-account` function |
| `PASSWORD_RESET_URL` | for "Forgot password?" | Where you host `web/reset-password/index.html` |
| `PRIVACY_POLICY_URL` | for the stores | Your public privacy policy page |
| `SUPPORT_EMAIL` | optional | Shown on the profile screen |

> Upgrading from the old `constants.js`: copy the endpoint, project, database and table IDs into `.env`, move the OpenAI key to the `ask-ai` function (below), revoke the old OpenAI key (it was compiled into earlier builds), then delete `constants.js`.

## Appwrite setup

### 1. Authentication

In **Auth → Settings**, make sure **Email/Password** is enabled. Recommended: turn on password dictionary and personal-data checks. Appwrite Cloud sends recovery emails out of the box; self-hosted servers need SMTP configured.

### 2. Profiles table

The app uses Appwrite's TablesDB API (Appwrite 1.8+), where collections are called tables, attributes columns and documents rows. Create a **TablesDB** database, then a `UserAccounts` table in it. The table stores one row per user, using the user's ID as the row ID. It needs these **string** columns:

| Column | Suggested size |
| --- | --- |
| `userId` | 36 |
| `email` | 254 |
| `name` | 128 |
| `age` | 3, not required |
| `grade` | 3 |
| `school` | 128, not required |
| `educationBoard` | 2 (stores `1`–`6`, see `src/constants/educationBoards.js`) |

The app no longer asks for `age` or `school`; it saves them empty, which clears values left by older versions. Keep both columns (untick **Required** if it's set): Appwrite rejects fields a table doesn't define, so deleting them would make profile saves fail.

Study progress (mastered questions, review queue, streak, daily goal) is saved in the user's account preferences, so it needs no table.

Permissions, so students can only see their own profile:

1. Table **Settings → Row security**: **on**.
2. Table **Permissions**: role **Users** with **Create** only. Remove any `Any` or `Users` read/update permissions.

The app gives each new profile read and update access for its owner only. Profiles created by older versions of the app have no per-user permissions; grant them once with:

```bash
APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_DATABASE_ID=... \
APPWRITE_USER_ACCOUNTS_TABLE_ID=... APPWRITE_API_KEY=<rows.read + rows.write> \
node scripts/migrate-profile-permissions.mjs          # dry run; add --apply to save
```

### 3. Functions

Both functions are plain Node.js with no dependencies. Create them in **Functions → Create function → Manual** (upload the folder) or with the Appwrite CLI using `appwrite.json` (set your project ID first, then run `appwrite push functions`).

**`ask-ai`** (folder `appwrite/functions/ask-ai`)
- Runtime Node.js 22, entrypoint `src/main.js`, timeout 30 seconds
- Execute access: **Users**
- Environment variables: `OPENAI_API_KEY` (required), `OPENAI_MODEL` (optional, default `gpt-4.1-mini`), `OPENAI_MAX_TOKENS` (optional, default `1000`)
- Set a monthly budget limit for the key in the OpenAI dashboard.
- Answers students report from the app are logged by this function as `REPORTED REPLY` (see its Executions → Errors).

**`delete-account`** (folder `appwrite/functions/delete-account`)
- Runtime Node.js 22, entrypoint `src/main.js`, timeout 15 seconds
- Execute access: **Users**
- Scopes: `users.write` and `rows.write`
- Environment variables: `APPWRITE_DATABASE_ID`, `APPWRITE_USER_ACCOUNTS_TABLE_ID` (same values as `.env`)

Put the two function IDs in `.env`.

### 4. Password reset page

1. In `web/reset-password/index.html`, set `APPWRITE_ENDPOINT` and `APPWRITE_PROJECT_ID`.
2. Host the folder on HTTPS (GitHub Pages, Netlify, Appwrite Sites, ...).
3. In Appwrite, add the page's hostname as a **Web platform** (Overview → Add platform). Appwrite only sends reset links to registered hostnames.
4. Set `PASSWORD_RESET_URL` in `.env` to the page's full URL.

## Scripts

| Command | What it does |
| --- | --- |
| `npm test` | Unit, screen-flow, function and content tests |
| `npm run lint` | ESLint |
| `npm run validate:content` | Checks every question has its fields, every formula draws with the app's maths engine, and the prepared sizes are up to date |
| `npm run prepare:math` | Saves the size of every bundled formula to `src/math/sizes.json` (run after editing questions) |
| `node scripts/repair-cbse-data.mjs` | Re-applies the automatic CBSE data repairs (safe to re-run) |
| `python3 scripts/generate-app-icons.py [art.png]` | Regenerates the app icons (needs Pillow) |
| `node scripts/migrate-profile-permissions.mjs` | One-time profile permission migration (see above) |

## Question content

- `src/mathTopics/CBSEMath12fc_fixed.json`: CBSE questions. Each entry has `Title` (chapter), `Subtitle` (concept, optional), `Example` (question), `Solution`, `Final_answer` (optional) and `chapter` (same as `Title`).
- `src/mathTopics/IBMathAATopicData.json` and `IBMathAITopicData.json`: IB topics with `topicNumber`, `topic`, `level` and `questions` (`subtopic`, `question`, `answer`, `working`, `calculator: "yes" | "no"`).
- Maths is written in LaTeX: `$...$` inline and `$$...$$` on its own line. Inside JSON every backslash must be doubled (`"\\frac{1}{2}"`); a single backslash silently turns `\frac` or `\neq` into control characters.
- Put all maths inside `$...$`, including symbols such as ∫, √ or ∩, and words inside maths in `\text{...}` (`$P(\text{not an ace})$`). Leave a space between a formula and the words next to it.
- A question's id (used for saved progress and bookmarks) is made from its text. When you correct the wording of a question that has been released, keep its old id by adding it to the question as `"id"`.
- After editing, run `npm run prepare:math` and then `npm run validate:content`; the check reports the exact question and formula that fails.

### How maths is drawn

`src/math/engine.js` turns TeX into drawing instructions with [MathJax 4](https://www.mathjax.org/) (SVG output, New Computer Modern font), and `MathView` draws them with `react-native-svg`, so formulas look the same on every device and need no web view. The same engine runs in Node for `prepare:math` and `validate:content`, so what the check passes is what the app shows.

- Inline formulas sit on the text baseline. One that doesn't fit at the end of a line moves to the next line whole; one wider than a line breaks between its parts (between clauses such as `x = 1, y = 2`, after the commas of a list, before `=` or `+`, never inside brackets), and one that can't break like that is set on lines of its own.
- Display formulas a little too wide are drawn slightly smaller; wider ones are broken into lines (between clauses where they fit), and anything that still doesn't fit (such as a large matrix) is drawn a little smaller again or, failing that, scrolls sideways.
- Formulas follow the system text size. Each one is converted a moment after it first appears (a few milliseconds each, a few at a time) and kept for reuse; the bundled questions' sizes are known in advance, so the page doesn't jump while they are drawn.
- The font's extra character files (arrows, script and double-struck letters, ...) are bundled; other scripts and monospace letters would fall back to plain text, which the content check reports.

## Releasing

See [docs/RELEASING.md](docs/RELEASING.md) for signing, versioning and the App Store / Google Play checklist.
