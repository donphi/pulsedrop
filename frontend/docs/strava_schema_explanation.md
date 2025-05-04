# Strava Data Supabase Schema Explanation

This document explains the PostgreSQL schema designed for storing comprehensive Strava data within a Supabase project. The schema aims to capture the majority of data available through the Strava API V3, assuming full user permissions (`activity:read_all`, `profile:read_all`, etc.).

## Overall Design Philosophy

The schema is designed with the following principles in mind:

1.  **Normalization:** Data is normalized where appropriate to reduce redundancy (e.g., separate tables for athletes, activities, segments).
2.  **Strava IDs:** Strava's unique identifiers (`strava_id`, typically `bigint` or `text` for gear) are used as primary keys for Strava-specific entities to facilitate easy mapping and updates from the API.
3.  **Application User Link:** A central `users` table links the application's user accounts to their corresponding `strava_athletes` profile via `strava_athlete_id`.
4.  **Flexibility:** `JSONB` is used for fields containing variable structures, nested data, or data where the exact schema might evolve (e.g., `map` polylines, `achievements`, `activity_streams`).
5.  **Relationships:** Foreign key constraints are established to maintain referential integrity between related entities (e.g., activities link to athletes, segment efforts link to segments and activities). `ON DELETE` clauses are set (mostly `CASCADE` or `SET NULL`) to define behavior when related records are removed.
6.  **Timestamps:** Standard `created_at` and `updated_at` columns track record modifications within our database. `last_fetched_at` columns are included to track the freshness of data synced from the Strava API. An automated trigger updates `updated_at` on modifications.
7.  **Indexing:** Indexes are added to foreign keys and commonly queried columns to improve query performance.

## Table Definitions and Relationships

Below is a breakdown of each table and its purpose:

---

### 1. `public.users`

*   **File:** [`users.sql`](./users.sql)
*   **Purpose:** Stores the application's own user accounts. This table is central to linking application users with their Strava data.
*   **Key Columns:**
    *   `id` (uuid, PK): Unique identifier for the application user.
    *   `email` (text, UNIQUE): User's login email.
    *   `strava_athlete_id` (bigint, UNIQUE, FK -> `strava_athletes.strava_id`): Links to the user's Strava profile. Nullable if the user hasn't connected Strava.
*   **Relationships:**
    *   One-to-One (optional) with `strava_athletes` via `strava_athlete_id`.

---

### 2. `public.strava_athletes`

*   **File:** [`strava_athlete.sql`](./strava_athlete.sql)
*   **Purpose:** Stores detailed profile information for a Strava athlete, fetched from the Strava API.
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's unique ID for the athlete.
    *   `username`, `firstname`, `lastname`, `city`, `state`, `country`, `sex`, `weight`, `profile` URLs, `premium`/`summit` status, etc.
    *   `strava_access_token`, `strava_refresh_token`, `strava_token_expires_at`, `strava_scope`: OAuth details (handle with care, consider RLS).
*   **Relationships:**
    *   One-to-One (optional) with `users` via `users.strava_athlete_id`.
    *   One-to-Many with `strava_activities`, `strava_gear`, `strava_segment_efforts`, `strava_routes`, `strava_athlete_clubs`.

---

### 3. `public.strava_gear`

*   **File:** [`strava_gear.sql`](./strava_gear.sql)
*   **Purpose:** Stores information about an athlete's equipment (bikes, shoes).
*   **Key Columns:**
    *   `strava_id` (text, PK): Strava's unique ID for the gear item (can be alphanumeric).
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): The owner of the gear.
    *   `name`, `nickname`, `brand_name`, `model_name`, `distance` (meters), `retired`.
*   **Relationships:**
    *   Many-to-One with `strava_athletes`.
    *   One-to-Many with `strava_activities` (an activity can use one piece of gear).

---

### 4. `public.strava_activities`

*   **File:** [`strava_activities.sql`](./strava_activities.sql)
*   **Purpose:** Stores comprehensive details about a specific Strava activity.
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's unique ID for the activity.
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): The athlete who performed the activity.
    *   `name`, `description`, `distance`, `moving_time`, `elapsed_time`, `total_elevation_gain`, `activity_type`, `sport_type`, `start_date`, `start_latlng`, `end_latlng`, `map` (JSONB), `average_speed`, `average_heartrate`, `average_watts`, `gear_id` (FK -> `strava_gear.strava_id`), etc.
*   **Relationships:**
    *   Many-to-One with `strava_athletes`.
    *   Many-to-One with `strava_gear` (optional).
    *   One-to-Many with `strava_activity_laps`.
    *   One-to-One with `strava_activity_streams` (assuming one stream set per activity).
    *   One-to-Many with `strava_activity_photos`.
    *   One-to-Many with `strava_segment_efforts`.

---

### 5. `public.strava_activity_laps`

*   **File:** [`strava_activities.sql`](./strava_activities.sql)
*   **Purpose:** Stores data for each lap within an activity.
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's unique ID for the lap.
    *   `activity_id` (bigint, FK -> `strava_activities.strava_id`): The parent activity.
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): Denormalized athlete ID.
    *   `lap_index`, `elapsed_time`, `moving_time`, `distance`, `average_speed`, `average_watts`, etc.
*   **Relationships:**
    *   Many-to-One with `strava_activities`.
    *   Many-to-One with `strava_athletes`.

---

### 6. `public.strava_activity_streams`

*   **File:** [`strava_activities.sql`](./strava_activities.sql)
*   **Purpose:** Stores the time-series data (lat/lng, heart rate, power, etc.) for an activity.
*   **Key Columns:**
    *   `id` (uuid, PK): Internal unique ID.
    *   `activity_id` (bigint, UNIQUE, FK -> `strava_activities.strava_id`): The parent activity.
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): Denormalized athlete ID.
    *   `time`, `latlng`, `distance`, `altitude`, `heartrate`, `watts`, etc. (all stored as `JSONB` arrays).
*   **Relationships:**
    *   One-to-One with `strava_activities`.
    *   Many-to-One with `strava_athletes`.
*   **Performance Note:** This table can grow very large. Storing streams as `JSONB` offers flexibility but can be slow for querying individual data points within the streams. Consider alternative storage strategies (e.g., TimescaleDB extension, wider tables with columns per stream type) if high-performance stream analysis is a primary requirement. The `UNIQUE` constraint on `activity_id` assumes only one set of streams is stored per activity.

---

### 7. `public.strava_activity_photos`

*   **File:** [`strava_activities.sql`](./strava_activities.sql)
*   **Purpose:** Stores metadata about photos associated with an activity (not the image data itself).
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's photo ID within the activity context.
    *   `unique_id` (text, UNIQUE): Strava's potentially globally unique photo ID.
    *   `activity_id` (bigint, FK -> `strava_activities.strava_id`): The parent activity.
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): Denormalized athlete ID.
    *   `caption`, `urls` (JSONB), `sizes` (JSONB), `location` (JSONB).
*   **Relationships:**
    *   Many-to-One with `strava_activities`.
    *   Many-to-One with `strava_athletes`.

---

### 8. `public.strava_activity_hr_stream_points`

*   **File:** [`strava_heart_rate.sql`](./strava_heart_rate.sql)
*   **Purpose:** Stores individual heart rate data points extracted from the activity's time-series stream. This facilitates more efficient querying and analysis of heart rate data compared to parsing the `JSONB` stream in `strava_activity_streams`.
*   **Key Columns:**
    *   `id` (uuid, PK): Internal unique ID for the data point row.
    *   `activity_id` (bigint, FK -> `strava_activities.strava_id`): The parent activity.
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): Denormalized athlete ID.
    *   `time_offset` (integer): Time in seconds from the start of the activity.
    *   `heart_rate` (integer): Heart rate in BPM at this time offset.
*   **Relationships:**
    *   Many-to-One with `strava_activities`.
    *   Many-to-One with `strava_athletes`.
*   **Performance Note:** This table can become extremely large. Ensure appropriate indexing (`activity_id`, `time_offset`) is used. This table stores HR values, not raw RR intervals typically needed for precise HRV analysis, which are usually only in the original FIT file.

---

### 9. `public.strava_segments`

*   **File:** [`strava_segments.sql`](./strava_segments.sql)
*   **Purpose:** Stores details about Strava segments (portions of road or trail).
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's unique ID for the segment.
    *   `name`, `activity_type`, `distance`, `average_grade`, `climb_category`, `start_latlng`, `end_latlng`, `map` (JSONB).
*   **Relationships:**
    *   One-to-Many with `strava_segment_efforts`.

---

### 10. `public.strava_segment_efforts`

*   **File:** [`strava_segments.sql`](./strava_segments.sql)
*   **Purpose:** Records an athlete's attempt (effort) on a specific segment during an activity.
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's unique ID for the segment effort.
    *   `segment_id` (bigint, FK -> `strava_segments.strava_id`): The segment attempted.
    *   `activity_id` (bigint, FK -> `strava_activities.strava_id`): The activity during which the effort occurred.
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): The athlete who made the effort.
    *   `elapsed_time`, `moving_time`, `start_date`, `kom_rank`, `pr_rank`, `achievements` (JSONB).
*   **Relationships:**
    *   Many-to-One with `strava_segments`.
    *   Many-to-One with `strava_activities`.
    *   Many-to-One with `strava_athletes`.

---

### 11. `public.strava_routes`

*   **File:** [`strava_routes.sql`](./strava_routes.sql)
*   **Purpose:** Stores details about routes created by athletes.
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's unique ID for the route.
    *   `athlete_id` (bigint, FK -> `strava_athletes.strava_id`): The athlete who created the route.
    *   `name`, `description`, `type` (Ride/Run), `sub_type`, `distance`, `elevation_gain`, `map` (JSONB), `segments` (JSONB array of segment summaries).
*   **Relationships:**
    *   Many-to-One with `strava_athletes`.

---

### 12. `public.strava_clubs`

*   **File:** [`strava_clubs.sql`](./strava_clubs.sql)
*   **Purpose:** Stores general information about Strava clubs.
*   **Key Columns:**
    *   `strava_id` (bigint, PK): Strava's unique ID for the club.
    *   `name`, `description`, `sport_type`, `city`, `state`, `country`, `member_count`, `url`.
*   **Relationships:**
    *   Many-to-Many with `strava_athletes` via `strava_athlete_clubs`.

---

### 13. `public.strava_athlete_clubs`

*   **File:** [`strava_clubs.sql`](./strava_clubs.sql)
*   **Purpose:** A junction table managing the many-to-many relationship between athletes and clubs. It also stores relationship-specific details like membership status, admin/owner roles, which are specific to *that athlete* in *that club*.
*   **Key Columns:**
    *   `athlete_id` (bigint, PK, FK -> `strava_athletes.strava_id`): The athlete.
    *   `club_id` (bigint, PK, FK -> `strava_clubs.strava_id`): The club.
    *   `membership`, `admin`, `owner`.
*   **Relationships:**
    *   Many-to-One with `strava_athletes`.
    *   Many-to-One with `strava_clubs`.

---

This schema provides a comprehensive structure for storing a wide range of Strava data. Remember to implement appropriate Row Level Security (RLS) policies in Supabase, especially for tables containing sensitive information like athlete profiles or OAuth tokens, to ensure users can only access their own data or data they are permitted to see.