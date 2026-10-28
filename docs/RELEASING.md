# Releasing EduApp

Checklist for shipping to Google Play and the App Store. App identity: **EduApp**, bundle ID / package **`com.aamaeyprakash.eduapp`** (it can't be changed after the first release).

## 1. Before the first release

- [ ] Appwrite is configured as described in the README: table permissions, both functions deployed, function IDs in `.env`.
- [ ] Existing profiles migrated with `scripts/migrate-profile-permissions.mjs`.
- [ ] The password reset page is hosted, registered as a Web platform, and `PASSWORD_RESET_URL` is set.
- [ ] A public **privacy policy** exists and `PRIVACY_POLICY_URL` is set. It must say that chat messages (and the student's board and grade) are sent to OpenAI to generate tutor answers, and how to delete an account.
- [ ] The OpenAI key that was in the old `constants.js` has been **revoked** (it was compiled into earlier builds and can be extracted). Use a new key in the `ask-ai` function only, with a monthly budget limit.
- [ ] `npm run lint`, `npm test` and `npm run validate:content` pass.
- [ ] Replace the placeholder icon if you have branding: `python3 scripts/generate-app-icons.py your-icon-1024.png`.
- [ ] Decide the youngest age you support (see "Children's privacy" below).
- [ ] Create a **demo account** for app reviewers (both stores ask for one because the app requires sign-in).

## 2. Versions

Raise both numbers for every store upload:

| | Visible version | Build number |
| --- | --- | --- |
| Android (`android/app/build.gradle`) | `versionName "1.0"` | `versionCode 1` (must always increase) |
| iOS (Xcode → target eduApp → General) | Version (`MARKETING_VERSION`) | Build (`CURRENT_PROJECT_VERSION`) |

## 3. Android (Google Play)

The project targets Android 16 (API 36), which Google Play requires for new apps.

**Upload key (once).** Keep the keystore and passwords somewhere safe; you need them for every update.

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/eduapp-upload.keystore \
  -alias eduapp-upload -keyalg RSA -keysize 2048 -validity 10000
```

Add to `~/.gradle/gradle.properties` (outside the repo; `*.keystore` is already git-ignored):

```properties
EDUAPP_UPLOAD_STORE_FILE=eduapp-upload.keystore
EDUAPP_UPLOAD_KEY_ALIAS=eduapp-upload
EDUAPP_UPLOAD_STORE_PASSWORD=...
EDUAPP_UPLOAD_KEY_PASSWORD=...
```

**Build.** `cd android && ./gradlew bundleRelease` produces `android/app/build/outputs/bundle/release/app-release.aab`. Test a release build on a device first with `npm run android -- --mode release`.

**Play Console.**
- [ ] New personal developer accounts must run a closed test (at least 12 testers for 14 days) before production access.
- [ ] Store listing: 512×512 icon (`assets/store/play-store-icon-512.png`), 1024×500 feature graphic, phone screenshots.
- [ ] App content → Privacy policy URL.
- [ ] App content → App access: give the demo account's email and password.
- [ ] App content → Data safety. Collected: name, email address, user ID, other info (grade, education board), app activity (practice progress and saved questions), and messages to the AI tutor. All are sent over HTTPS; users can delete their data.
- [ ] Data safety → account deletion: in-app (Profile → Delete Account) **and a web link** where people can ask for deletion without the app (for example a page with your support email).
- [ ] App content → Target audience and content, plus the content rating questionnaire.
- [ ] Generative AI policy: AI replies can be reported in the app (the "Report" link under each answer). Reports appear in Appwrite → Functions → ask-ai → Executions, marked `REPORTED REPLY`. Review them regularly.

## 4. iOS (App Store)

The project uses the UIScene lifecycle that apps built with the iOS 27 SDK require. Build with the latest Xcode.

- [ ] Register the bundle ID `com.aamaeyprakash.eduapp` in your Apple Developer account and create the app in App Store Connect.
- [ ] In Xcode, open `ios/eduApp.xcworkspace`, select the eduApp target → Signing & Capabilities → choose your Team.
- [ ] Product → Archive, then Distribute App → App Store Connect.
- [ ] App Store Connect → App Privacy: the same data types as the Play Data safety form (name, email address, user ID, other user content, other data), linked to the user, used for app functionality and not for tracking. These are already declared in `ios/eduApp/PrivacyInfo.xcprivacy`; keep the two in sync if you collect anything new.
- [ ] Privacy policy URL, support URL, age rating questionnaire, screenshots (6.9" iPhone at minimum; the app is iPhone-only).
- [ ] App Review Information: the demo account, plus a note that the Tutor asks for permission before sending messages to OpenAI (guideline 5.1.2(i)) and that accounts can be deleted from Profile (guideline 5.1.1(v)).
- [ ] Export compliance: the app only uses standard HTTPS. If you agree it qualifies for the exemption, add `ITSAppUsesNonExemptEncryption` = `NO` to `Info.plist` to skip the question on each upload.

## 5. Children's privacy

The sign-up form collects name, grade and education board (it no longer asks for age or school), and MYP/IGCSE students can be under 13. If children under 13 (or under the local age of digital consent, up to 16 in parts of the EU) may use the app, laws such as COPPA and GDPR require parental consent, and both stores apply extra rules (Google Play Families policy; Apple's Kids category rules). The simplest option is to require users to be 13 or older and say so in the store listings, terms and privacy policy; since the app doesn't ask for age, it doesn't check this itself. Get advice if you plan to serve younger students.

## 6. Content notes

- `IBMathAITopicData.json` currently contains the same questions as the AA file; replace it with Applications & Interpretation questions.
- The "Grade 12 CBSE" data also includes Class 11 chapters (for example Sets, Conic Sections, Binomial Theorem). Consider renaming the course card or splitting the chapters.
- IB Topic 4 (Statistics and Probability) has no questions yet.
