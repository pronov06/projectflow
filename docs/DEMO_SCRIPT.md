# 5-Minute Demo Recording Script

**Goal (from the brief):** log in with the same account on web and mobile, create a task on one, and show it on the other.

## Before you hit record

1. **Wake the API.** Open `https://<api-host>/api/health` and wait for `{"status":"ok"}`. The free server sleeps after 15 minutes idle and needs about 50 seconds to wake.
2. Phone: install the APK (or open the project in Expo Go). Log out of any previous session.
3. Desktop: open the web app in a normal browser window. Logged out.
4. Recording: a screen recorder for the desktop (OBS, or Win+G Xbox Game Bar), with the phone mirrored using **scrcpy** or **Windows Phone Link**. Or film the phone next to the screen.
5. Use the demo account `alice@example.com` / `Password123!`, or register a fresh test user live.

## Script (about 5 minutes)

| Time | Where | What to do and say |
|---|---|---|
| 0:00–0:20 | — | "This is ProjectFlow: a React web app and an Android app on the same Node/Express API and PostgreSQL database." |
| 0:20–1:00 | Web | **Register** a new user (e.g. `demo.reviewer@example.com`). Show a validation error first: a bad email or short password. Land on the **dashboard** with zeros. |
| 1:00–1:40 | Web | **Create a project** ("Launch Plan", In Progress, with dates). Open it and create a task: "Write release notes", High, due tomorrow. Point out the progress bar and the dashboard numbers changing. |
| 1:40–2:30 | Phone | Open the app and **log in with the same account**. Show the dashboard with the same numbers. Open Projects → "Launch Plan" → the task created on the web is there. |
| 2:30–3:15 | Phone | **Create a task on mobile**: "Record demo video", Medium. Tap the checkbox on "Write release notes" to **mark it completed**. Change a priority with the chips. |
| 3:15–3:50 | Web | **Refresh** the web page. The mobile task appears and "Write release notes" shows Completed. The dashboard's completed count went up. |
| 3:50–4:20 | Phone | Change something on the web (e.g. edit the task name). On the phone, **pull down to refresh**: it updates. Show **search** and the **status/priority filters**. |
| 4:20–4:45 | Phone | Turn on **airplane mode** and pull to refresh. Show the offline banner and the friendly message (no crash). Turn airplane mode off. |
| 4:45–5:00 | Both | **Log out** on both. "Tokens are in the Android Keystore via SecureStore, passwords are bcrypt-hashed, and users can only see their own data." |

## After recording

Upload to Google Drive or YouTube (**unlisted**, viewable by anyone with the link) and put the link in the README's *Live links* table.
