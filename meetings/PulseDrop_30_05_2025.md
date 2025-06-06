# PulseDrop Project - Meeting Notes (30/05/2025)

## 🗣️ Talking Points - Quick Overview

*   **🔑 How Users Log In:**
    *   **Strava Login:** Super easy! Click "Continue with Strava" ➡️ Log in to Strava ➡️ Grant permission ➡️ You're in! (Secure & uses Strava's system).
    *   **Email/Password Login:** Traditional way. Enter email & password ➡️ We check it securely with Supabase ➡️ You're in!
    *   **Goal:** Securely know who the user is so they can see their stuff.

*   **📡 How We Get Strava Data (Webhooks):**
    *   **What's a Webhook?** Like an instant text message from Strava to our app.
    *   **How it works:** User does something on Strava (new run!) ➡️ Strava pings our app ➡️ Our app quickly says "Got it!" ➡️ Later, our app fetches all the details (distance, time, ❤️ heart rate!).
    *   **Why?** Keeps data fresh automatically! No manual syncing needed.

*   **🗄️ Our Database (Supabase) - What We Store:**
    *   **User Info:** Account details, link to Strava, secure tokens (not passwords!).
    *   **Strava Profile:** Basic stuff like name & picture.
    *   **Activity Details:** The main course!
        *   Basics: Name, sport type, distance, time.
        *   Performance: Speed, elevation.
        *   Maps: Where they went.
        *   ❤️ **Heart Rate:** Average, max, AND a detailed second-by-second stream for deep analysis. This is key for PulseDrop!
    *   **Why?** This data powers all the cool charts and insights in the app. It's stored securely in Supabase.

---

## 📝 Detailed Notes for Review

This document provides a simplified explanation of some key technical aspects of the PulseDrop project, focusing on how users log in, how we get data from Strava, and what data we store.

### 1. How Users Log In (Authentication)

Think of this as the process of a user proving who they are to use the app. We offer two main ways for users to log in:

#### a) Login with Strava (Easy & Quick)

*   **What the user sees:** They click a "Continue with Strava" button.
*   **What happens:**
    1.  Our app sends the user to Strava's official website.
    2.  The user logs into their Strava account (if they aren't already) and gives our app permission to access their Strava data. This is like saying, "Yes, PulseDrop, you can see my activities."
    3.  Strava then tells our app, "This user is legitimate, and they've given you permission."
    4.  Our app either logs them into their existing PulseDrop account or creates a new one linked to their Strava profile.
*   **Why it's good:** It's secure (uses Strava's own login) and convenient for users who already have a Strava account.

#### b) Login with Email and Password (Traditional)

*   **What the user sees:** They type their email address and a password they created for PulseDrop.
*   **What happens:**
    1.  Our app takes this information and securely checks it against our records using a trusted service called **Supabase Authentication**.
    2.  If the email and password match, the user is logged in.
*   **Security:** We don't store passwords directly; Supabase handles this securely.

**In simple terms:** Whether they use Strava or email/password, the goal is to securely verify the user's identity so they can access their data and features in PulseDrop. Once logged in, the app "remembers" them for a while (this is called a "session") so they don't have to log in every single time they open it.

### 2. How We Get Strava Data (Webhooks & API)

"Webhooks" are like an automated notification system. Once a user connects their Strava account, PulseDrop needs to know when they record new activities or update old ones.

#### a) What are Webhooks?

*   Imagine you've asked Strava to send PulseDrop a text message (a "webhook notification") every time something important happens with your Strava data.
*   When a user connects their Strava, our app tells Strava: "Hi Strava, if this user creates a new activity, updates one, or even decides to disconnect from our app, please send a message to this special PulseDrop web address."

#### b) How it Works:

1.  **Event Happens on Strava:** A user records a new bike ride, run, or updates an existing activity on Strava.
2.  **Strava Sends a Notification:** Strava automatically sends a small, instant message to our app's special web address (our "webhook endpoint"). This message basically says, "Hey, user X just did Y."
3.  **PulseDrop Receives Notification:**
    *   Our app very quickly responds to Strava, "Got it, thanks!" (This is important because Strava expects a fast reply).
    *   Our app then notes down this notification (e.g., "User 123 created activity 789").
4.  **PulseDrop Fetches Details (Asynchronously):**
    *   A little later (usually almost instantly), a background part of our app looks at the notification.
    *   If it's a new activity, our app then asks Strava (using something called the "Strava API") for all the details of that activity: distance, time, speed, map, and importantly, **heart rate data**.
    *   If an activity was updated, our app fetches the new details.
    *   If a user disconnected their Strava account, our app updates its records to reflect that.
5.  **Data Stored:** The fetched data is then stored in our database (see section 3).

**Why are webhooks useful?** They allow PulseDrop to keep the user's data fresh and up-to-date automatically, without the user needing to manually sync or refresh. It makes the experience seamless.

### 3. Our Database (Supabase) - What We Capture

Think of our database as a highly organized digital filing cabinet. We use a service called **Supabase** to provide this secure and reliable "filing cabinet." Here's a simplified overview of what kind of information we store:

#### a) User Account Information:

*   **PulseDrop Account Details:** Email address, display name, user preferences.
*   **Link to Strava:** If they connected Strava, we store their unique Strava ID to link their PulseDrop account to their Strava data.
*   **Secure Tokens:** Special, secure codes from Strava that allow PulseDrop to fetch their data without needing their Strava password every time. These are stored very securely.

#### b) Strava Athlete Profile:

*   Basic information from their Strava profile like their name, username, and profile picture.

#### c) Detailed Strava Activity Data:

This is the core data that powers most of PulseDrop's features. For *each* activity a user syncs:
*   **Basic Info:** Name of the activity (e.g., "Morning Run"), description, type of sport (cycling, running, etc.).
*   **Timings & Distance:** When it started, how long it took (moving time, total time), distance covered.
*   **Performance Metrics:** Average speed, max speed, elevation gain.
*   **Map Data:** The route they took (often shown as a line on a map).
*   **Heart Rate Data:** This is a key focus for PulseDrop. We store:
    *   Average and maximum heart rate for the activity.
    *   A detailed stream of their heart rate throughout the activity (e.g., heart rate recorded every few seconds). This allows for in-depth analysis of their effort and recovery.
*   **Laps:** If their activity has laps (like in a running race), we store data for each lap.
*   **Photos:** Links to any photos they attached to the activity on Strava.

#### d) Other Strava-Related Data (More Advanced):

We also store information about:
*   **Gear:** Bikes, shoes they used for activities.
*   **Segments & Efforts:** Popular sections of routes ("segments") and how the user performed on them.
*   **Routes:** Custom routes they might have created on Strava.
*   **Clubs:** Strava clubs they are part of.

#### e) Webhook Event Log:

*   We keep a log of all the "notifications" (webhook events) we receive from Strava. This helps us track if data is flowing correctly and troubleshoot any issues.

**Why is this data important?**
*   It's the foundation of PulseDrop. All the charts, analysis, and insights the app provides come from this data.
*   Storing it in Supabase allows us to manage it securely and efficiently, so the app can quickly retrieve information to show to the user.
*   We are careful to only request and store data that is necessary for PulseDrop's features and that the user has given us permission to access.

---

We hope this explanation helps clarify these technical components!