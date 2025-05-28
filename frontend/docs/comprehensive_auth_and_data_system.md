# Comprehensive Authentication and Data Flow System

## Table of Contents

- [Comprehensive Authentication and Data Flow System](#comprehensive-authentication-and-data-flow-system)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Authentication Flow](#authentication-flow)
    - [Strava OAuth Authentication Flow](#strava-oauth-authentication-flow)
    - [Credentials Authentication Flow](#credentials-authentication-flow)
    - [Token Management](#token-management)
    - [Session Handling](#session-handling)
    - [Error Handling](#error-handling)
    - [User Role Management](#user-role-management)
    - [Security Considerations](#security-considerations)
  - [Database Structure](#database-structure)
    - [Core Tables](#core-tables)
    - [Strava-Specific Tables](#strava-specific-tables)
    - [Relationships Between Tables](#relationships-between-tables)
  - [Strava Data Integration](#strava-data-integration)
    - [Data Retrieval Process](#data-retrieval-process)
    - [Activity Data Processing](#activity-data-processing)
    - [Heart Rate Data Handling](#heart-rate-data-handling)
    - [Data Transformation and Storage](#data-transformation-and-storage)
  - [System Architecture Diagram](#system-architecture-diagram)
  - [Potential Issues and Considerations](#potential-issues-and-considerations)

## Introduction

This document provides a comprehensive overview of the authentication and data flow system implemented in the application. The system integrates NextAuth.js with Strava OAuth for authentication and uses Supabase as the database backend. The application allows users to connect their Strava accounts, retrieve their activity data, and analyze their performance metrics, particularly heart rate data.

## Authentication Flow

The authentication system is built using NextAuth.js and integrates with both Strava OAuth for social login and Supabase for credentials-based authentication. This section details the complete flow from user login to session management.

### Strava OAuth Authentication Flow

The Strava OAuth authentication flow follows these steps:

1. **Initiation**:
   - User clicks the "Continue with Strava" button in the `LoginForm` component.
   - The `handleStravaLogin` function calls `signIn('strava')` from NextAuth.js.

2. **Redirect to Strava**:
   - NextAuth redirects the user to the Strava authorization page.
   - The authorization request includes the scopes defined in `auth.ts`: `read,activity:read_all,profile:read_all`.

3. **User Authorization**:
   - User logs into Strava (if not already logged in).
   - Strava prompts the user to authorize the application with the requested permissions.

4. **Callback Processing**:
   - Upon authorization, Strava redirects back to the application's callback URL.
   - NextAuth.js processes the callback in the `[...nextauth]/route.ts` handler.
   - The `signIn` callback in `auth.ts` is executed.

5. **User Creation/Update**:
   - The system checks if the Strava athlete already exists in the `strava_athletes` table.
   - If the athlete exists, their information is updated with the latest data from Strava.
   - If the athlete doesn't exist:
     - A new record is created in the `strava_athletes` table.
     - The system checks if a user with the same email exists in the `users` table.
     - If a user exists, their record is updated to link to the Strava athlete.
     - If no user exists, a new user record is created and linked to the Strava athlete.

6. **Token Storage**:
   - The access token, refresh token, and token expiration time from Strava are stored in the `strava_athletes` table.
   - These tokens are also added to the JWT for use in API requests.

7. **Session Establishment**:
   - NextAuth.js creates a session for the authenticated user.
   - The user is redirected to the dashboard.

### Credentials Authentication Flow

The credentials-based authentication flow uses Supabase Auth and follows these steps:

1. **Initiation**:
   - User enters email and password in the `LoginForm` component.
   - The `handleEmailLogin` function calls `signIn('credentials')` with the provided credentials.

2. **Credential Verification**:
   - The `authorize` function in the Credentials provider (defined in `auth.ts`) is executed.
   - The function calls `supabaseAdmin.auth.signInWithPassword()` to verify the credentials against Supabase Auth.

3. **User Retrieval**:
   - If authentication is successful, the function retrieves the user's record from the `users` table.
   - The user object is returned to NextAuth.js to establish a session.

4. **Session Establishment**:
   - NextAuth.js creates a session for the authenticated user.
   - The user is redirected to the dashboard.

### Token Management

The system handles OAuth tokens as follows:

1. **Token Storage**:
   - Access tokens, refresh tokens, and expiration times are stored in:
     - The `strava_athletes` table in the database.
     - The JWT created by NextAuth.js.

2. **Token Refresh**:
   - When an access token expires, the system uses the refresh token to obtain a new access token.
   - This process is typically handled when making API requests to Strava.
   - The new tokens are stored in both the database and the JWT.

3. **Token Expiration Detection**:
   - The system checks the `strava_token_expires_at` field to determine if a token has expired.
   - If the token has expired, a refresh is triggered before making API requests.

### Session Handling

Sessions are managed by NextAuth.js as follows:

1. **Session Creation**:
   - After successful authentication, NextAuth.js creates a session.
   - The session includes user information and, for Strava users, the access token, refresh token, and Strava ID.

2. **Session Access**:
   - Server-side: Sessions can be accessed using `getServerSession(authOptions)`.
   - Client-side: Sessions can be accessed using the `useSession()` hook from `next-auth/react`.

3. **Session Customization**:
   - The `session` callback in `auth.ts` customizes the session object to include additional data like the user ID and Strava ID.

### Error Handling

The authentication system includes comprehensive error handling:

1. **Error Types**:
   - OAuth errors (e.g., user denies access, API issues).
   - Database errors (e.g., failed to create/update records).
   - Credential errors (e.g., invalid email/password).

2. **Error Propagation**:
   - Errors are logged server-side for debugging.
   - User-friendly error messages are displayed to the user.

3. **Error Mapping**:
   - The `LoginForm` component maps error codes to user-friendly messages using the `errorMessages` object.
   - This ensures users receive clear feedback when authentication fails.

### User Role Management

The system supports different user roles:

1. **Regular Users**:
   - Standard users who can access their own data.
   - Created when a user signs up or connects their Strava account.

2. **Admin Users**:
   - Users with elevated privileges.
   - Admin status is typically stored in the `users` table or managed through Supabase RLS policies.

3. **Role-Based Access Control**:
   - Access to certain features or data is controlled based on user roles.
   - Implemented through Supabase Row Level Security (RLS) policies.

### Security Considerations

The authentication system implements several security measures:

1. **Token Security**:
   - Sensitive tokens are stored securely in the database.
   - Tokens are never exposed to the client except through secure, encrypted channels.

2. **JWT Security**:
   - JWTs are signed using the `NEXTAUTH_SECRET` to prevent tampering.
   - Sensitive information in JWTs is minimized.

3. **HTTPS**:
   - All communication is over HTTPS to prevent man-in-the-middle attacks.

4. **Error Messages**:
   - Generic error messages are shown to users to prevent information leakage.
   - Detailed error information is only logged server-side.

5. **Row Level Security**:
   - Supabase RLS policies ensure users can only access their own data.

## Database Structure

The database is structured to efficiently store user information, authentication data, and Strava-related data. This section details the schema and relationships between tables.

### Core Tables

1. **`users` Table**:
   - Primary table for application users.
   - Key fields:
     - `id`: UUID primary key.
     - `email`: User's email address (unique).
     - `strava_athlete_id`: Foreign key to the `strava_athletes` table (nullable).
     - `display_name`: User's display name.
     - `app_preferences`: JSON field for user preferences.
   - This table links application users to their Strava profiles.

2. **`profiles` Table**:
   - Extends the `auth.users` table with additional profile information.
   - Key fields:
     - `id`: UUID primary key.
     - `user_id`: Foreign key to `auth.users` (unique).
     - `strava_athlete_id`: Foreign key to the `strava_athletes` table (nullable).
     - `first_name`, `last_name`: User's name.
     - `profile_picture_url`: URL to the user's profile picture.
   - This table provides a layer of abstraction between the authentication system and application-specific user data.

### Strava-Specific Tables

1. **`strava_athletes` Table**:
   - Stores detailed information about Strava athletes.
   - Key fields:
     - `strava_id`: Strava's unique identifier (primary key).
     - `username`, `firstname`, `lastname`: Basic profile information.
     - `bio`, `city`, `state`, `country`: Location and biographical information.
     - `profile`, `profile_medium`: URLs to profile pictures.
     - `strava_access_token`, `strava_refresh_token`: OAuth tokens.
     - `strava_token_expires_at`: Token expiration timestamp.
     - `strava_scope`: Granted OAuth scopes.
   - This table is the central repository for Strava athlete data and OAuth tokens.

2. **`strava_activities` Table**:
   - Stores detailed information about Strava activities.
   - Key fields:
     - `strava_id`: Strava's unique identifier for the activity (primary key).
     - `athlete_id`: Foreign key to the `strava_athletes` table.
     - `name`, `description`: Basic activity information.
     - `distance`, `moving_time`, `elapsed_time`: Activity metrics.
     - `activity_type`, `sport_type`: Type of activity.
     - `start_date`, `start_date_local`: Activity timestamps.
     - `map`: JSON field containing map data, including polylines.
     - Various metrics: `average_speed`, `max_speed`, `average_heartrate`, `max_heartrate`, etc.
   - This table stores comprehensive data about each activity.

3. **`strava_activity_laps` Table**:
   - Stores lap data for activities.
   - Key fields:
     - `strava_id`: Strava's unique identifier for the lap (primary key).
     - `activity_id`: Foreign key to the `strava_activities` table.
     - `athlete_id`: Foreign key to the `strava_athletes` table.
     - `lap_index`: The index of the lap within the activity.
     - `elapsed_time`, `moving_time`: Duration metrics.
     - `distance`: Length of the lap in meters.
     - Various metrics: `average_speed`, `max_speed`, `average_cadence`, `average_watts`, etc.
   - This table provides detailed information about each lap within an activity.

4. **`strava_activity_streams` Table**:
   - Stores time-series data for activities.
   - Key fields:
     - `id`: UUID primary key.
     - `activity_id`: Foreign key to the `strava_activities` table.
     - `time`, `latlng`, `distance`, `altitude`, `heartrate`, etc.: JSON arrays of time-series data.
   - This table stores raw stream data from Strava, which can be used for detailed analysis.

5. **`strava_activity_photos` Table**:
   - Stores metadata about photos associated with activities.
   - Key fields:
     - `strava_id`: Strava's identifier for the photo (primary key).
     - `activity_id`: Foreign key to the `strava_activities` table.
     - `athlete_id`: Foreign key to the `strava_athletes` table.
     - `caption`: Photo caption.
     - `urls`: JSON object containing URLs for different photo sizes.
   - This table stores references to photos, not the actual image data.

6. **`strava_activity_hr_stream_points` Table**:
   - Stores individual heart rate data points.
   - Key fields:
     - `id`: UUID primary key.
     - `activity_id`: Foreign key to the `strava_activities` table.
     - `athlete_id`: Foreign key to the `strava_athletes` table.
     - `time_offset`: Time in seconds from the start of the activity.
     - `heart_rate`: Heart rate in beats per minute.
   - This table provides a more efficient way to query and analyze heart rate data compared to parsing the JSON arrays in the `strava_activity_streams` table.

7. **`strava_gear` Table**:
   - Stores information about athlete equipment (bikes, shoes).
   - Key fields:
     - `strava_id`: Strava's unique identifier for the gear (primary key, can be alphanumeric).
     - `athlete_id`: Foreign key to the `strava_athletes` table.
     - `name`: Gear name (e.g., "Cannondale Synapse").
     - `nickname`: User-defined nickname.
     - `distance`: Total distance recorded with this gear in meters.
     - `brand_name`, `model_name`: Manufacturer information.
   - This table tracks the equipment used by athletes during activities.

8. **`strava_segments` Table**:
   - Stores information about Strava segments (portions of road or trail).
   - Key fields:
     - `strava_id`: Strava's unique identifier for the segment (primary key).
     - `name`: Segment name.
     - `activity_type`: Type of activity (e.g., "Ride", "Run").
     - `distance`: Length of the segment in meters.
     - `average_grade`, `maximum_grade`: Elevation metrics.
     - `map`: JSON field containing polyline data.
   - This table stores information about specific segments that can be part of multiple activities.

9. **`strava_segment_efforts` Table**:
   - Stores data about athlete efforts on segments.
   - Key fields:
     - `strava_id`: Strava's unique identifier for the segment effort (primary key).
     - `segment_id`: Foreign key to the `strava_segments` table.
     - `activity_id`: Foreign key to the `strava_activities` table.
     - `athlete_id`: Foreign key to the `strava_athletes` table.
     - `elapsed_time`, `moving_time`: Duration metrics.
     - `kom_rank`, `pr_rank`: Achievement rankings.
   - This table records each attempt by an athlete on a specific segment.

10. **`strava_routes` Table**:
    - Stores details about routes created by athletes.
    - Key fields:
      - `strava_id`: Strava's unique identifier for the route (primary key).
      - `athlete_id`: Foreign key to the `strava_athletes` table.
      - `name`, `description`: Basic route information.
      - `type`: Type of route (1: Ride, 2: Run).
      - `distance`: Length of the route in meters.
      - `map`: JSON field containing polyline data.
    - This table stores predefined routes that athletes can follow.

11. **`strava_clubs` Table**:
    - Stores information about Strava clubs.
    - Key fields:
      - `strava_id`: Strava's unique identifier for the club (primary key).
      - `name`: Club name.
      - `sport_type`: Primary sport type (e.g., "cycling", "running").
      - `city`, `state`, `country`: Location information.
      - `member_count`: Number of members in the club.
    - This table stores general information about clubs.

12. **`strava_athlete_clubs` Table**:
    - Junction table for the many-to-many relationship between athletes and clubs.
    - Key fields:
      - `athlete_id`: Foreign key to the `strava_athletes` table (part of composite primary key).
      - `club_id`: Foreign key to the `strava_clubs` table (part of composite primary key).
      - `membership`: Membership status (e.g., "member", "pending").
      - `admin`, `owner`: Boolean flags indicating role in the club.
    - This table manages the relationships between athletes and clubs.

### Relationships Between Tables

The database schema establishes several key relationships:

1. **User to Strava Athlete (One-to-One)**:
   - A user can be linked to at most one Strava athlete.
   - This relationship is established through the `strava_athlete_id` foreign key in the `users` table.

2. **Strava Athlete to Activities (One-to-Many)**:
   - A Strava athlete can have many activities.
   - This relationship is established through the `athlete_id` foreign key in the `strava_activities` table.

3. **Activity to Streams (One-to-One)**:
   - An activity has one set of streams.
   - This relationship is established through the `activity_id` foreign key in the `strava_activity_streams` table.

4. **Activity to Heart Rate Points (One-to-Many)**:
   - An activity can have many heart rate data points.
   - This relationship is established through the `activity_id` foreign key in the `strava_activity_hr_stream_points` table.

5. **Activity to Laps (One-to-Many)**:
   - An activity can have many laps.
   - This relationship is established through the `activity_id` foreign key in the `strava_activity_laps` table.

6. **Activity to Photos (One-to-Many)**:
   - An activity can have many photos.
   - This relationship is established through the `activity_id` foreign key in the `strava_activity_photos` table.

7. **Athlete to Gear (One-to-Many)**:
   - An athlete can have many gear items (bikes, shoes).
   - This relationship is established through the `athlete_id` foreign key in the `strava_gear` table.

8. **Activity to Gear (Many-to-One)**:
   - Many activities can use the same gear item.
   - This relationship is established through the `gear_id` foreign key in the `strava_activities` table.

9. **Athlete to Routes (One-to-Many)**:
   - An athlete can create many routes.
   - This relationship is established through the `athlete_id` foreign key in the `strava_routes` table.

10. **Segment to Segment Efforts (One-to-Many)**:
    - A segment can have many efforts by different athletes.
    - This relationship is established through the `segment_id` foreign key in the `strava_segment_efforts` table.

11. **Activity to Segment Efforts (One-to-Many)**:
    - An activity can include many segment efforts.
    - This relationship is established through the `activity_id` foreign key in the `strava_segment_efforts` table.

12. **Athlete to Segment Efforts (One-to-Many)**:
    - An athlete can have many segment efforts.
    - This relationship is established through the `athlete_id` foreign key in the `strava_segment_efforts` table.

13. **Athlete to Clubs (Many-to-Many)**:
    - An athlete can be a member of many clubs, and a club can have many athletes.
    - This relationship is established through the `strava_athlete_clubs` junction table.

## Strava Data Integration

The application integrates with the Strava API to retrieve and process user activity data. This section details how data is fetched, processed, and stored.

### Data Retrieval Process

The process of retrieving data from Strava follows these steps:

1. **Authentication**:
   - The application uses the stored access token to authenticate with the Strava API.
   - If the token has expired, the refresh token is used to obtain a new access token.

2. **API Requests**:
   - The application makes requests to various Strava API endpoints:
     - `/athlete`: To retrieve the athlete's profile information.
     - `/athlete/activities`: To retrieve the athlete's activities.
     - `/activities/{id}`: To retrieve detailed information about a specific activity.
     - `/activities/{id}/streams`: To retrieve time-series data for an activity.

3. **Pagination and Rate Limiting**:
   - The application handles pagination for endpoints that return multiple items.
   - It respects Strava's rate limits to avoid being throttled.

4. **Error Handling**:
   - The application handles various API errors, such as:
     - Authentication errors (e.g., invalid token).
     - Rate limiting errors.
     - Resource not found errors.

### Activity Data Processing

Once activity data is retrieved, it is processed as follows:

1. **Data Normalization**:
   - The raw JSON data from Strava is normalized to fit the database schema.
   - This includes extracting relevant fields and transforming data formats.

2. **Data Storage**:
   - The processed data is stored in the appropriate tables:
     - Basic activity information goes into the `strava_activities` table.
     - Lap data goes into the `strava_activity_laps` table.
     - Stream data goes into the `strava_activity_streams` table.
     - Photo metadata goes into the `strava_activity_photos` table.

3. **Data Updates**:
   - If an activity already exists in the database, its information is updated with the latest data from Strava.
   - This ensures that the database always has the most up-to-date information.

### Heart Rate Data Handling

Heart rate data is handled with special attention due to its importance for analysis:

1. **Data Extraction**:
   - Heart rate data is extracted from the `heartrate` stream in the activity streams.
   - Each data point consists of a time offset and a heart rate value.

2. **Data Storage**:
   - Individual heart rate data points are stored in the `strava_activity_hr_stream_points` table.
   - This allows for more efficient querying and analysis compared to parsing the JSON array in the `strava_activity_streams` table.

3. **Data Granularity**:
   - Heart rate data is typically provided at regular intervals (e.g., every second or every few seconds).
   - The exact granularity depends on the recording device and settings used during the activity.
   - The system preserves the original granularity of the data.

### Data Transformation and Storage

The system performs several transformations when storing data:

1. **Date and Time Handling**:
   - Timestamps from Strava are converted to ISO 8601 format for storage in the database.
   - Time zones are preserved to ensure accurate representation of when activities occurred.

2. **Geographical Data**:
   - Latitude and longitude coordinates are stored as JSON arrays.
   - Map polylines are stored as provided by Strava, which uses an encoded format to represent routes.

3. **Metrics Conversion**:
   - Some metrics may be converted to different units for consistency or analysis.
   - For example, speeds might be converted from meters per second to kilometers per hour.

4. **Data Enrichment**:
   - The system may calculate additional metrics not provided by Strava.
   - For example, it might calculate heart rate zones based on the athlete's maximum heart rate.

## System Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Interface │     │  NextAuth.js    │     │  Strava API     │
│  (Next.js)      │◄────┤  Authentication │◄────┤                 │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  API Routes     │     │  Supabase       │
│  (Next.js)      │◄────┤  Database       │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

This diagram illustrates the high-level architecture of the system:

1. The user interacts with the Next.js frontend.
2. Authentication is handled by NextAuth.js, which integrates with Strava OAuth.
3. After authentication, the application can make requests to the Strava API.
4. Data is processed by API routes in Next.js.
5. Processed data is stored in the Supabase database.

This architecture provides a secure, scalable, and maintainable system for authenticating users and managing their Strava data.

## Potential Issues and Considerations

Based on analysis of the codebase, here are several potential issues that developers should be aware of:

1. **Database Schema Discrepancies**:
   - There's a discrepancy between the `profiles` table (which references `auth.users`) and the `users` table (in the public schema). This dual-table approach could cause confusion about which table should be the source of truth for user data.
   - The `nextauth_implementation.md` mentions using the `@next-auth/supabase-adapter`, but the actual implementation in `auth.ts` uses a custom approach instead.

2. **Token Refresh Mechanism**:
   - While the system stores Strava refresh tokens, there doesn't appear to be a robust implementation for automatically refreshing expired access tokens. This could lead to API failures when tokens expire.
   - Implement a middleware or utility function that checks token expiration before making Strava API requests and refreshes tokens as needed.

3. **Type Safety Concerns**:
   - Several instances of type casting (e.g., `as unknown as Record<string, unknown>`) are used to bypass TypeScript's type checking, which could lead to runtime errors if the actual data structure differs from what's expected.
   - The Supabase client is initialized with `any` types rather than proper database types, which reduces type safety.
   - Consider generating proper TypeScript types for the database schema using Supabase's type generation tools.

4. **Transaction Management**:
   - The `signIn` callback performs multiple database operations without wrapping them in a transaction. If one operation succeeds but another fails, it could leave the database in an inconsistent state.
   - Consider implementing database transactions for operations that need to maintain data consistency.

5. **Error Handling Edge Cases**:
   - While error handling is generally thorough, some edge cases might not be covered, particularly around token expiration, network failures, or Strava API rate limiting.
   - Implement more robust error handling for API requests, including retry logic for transient failures and rate limit handling.

6. **Environment Variable Handling**:
   - The approach of providing fallbacks for missing environment variables but then throwing errors if they're missing could mask issues during build time but cause runtime failures.
   - Consider using a more consistent approach to environment variable validation.

7. **Session Strategy Inconsistency**:
   - The documentation mentions using the `database` session strategy, but the code uses the `jwt` strategy, which could lead to confusion and potential issues.
   - Ensure documentation and implementation are aligned regarding session strategy.

8. **Row Level Security (RLS) Integration**:
   - It's not entirely clear how Supabase RLS policies are integrated with NextAuth.js sessions, which could lead to security vulnerabilities if not properly configured.
   - Ensure RLS policies are properly set up to restrict data access based on user identity.

9. **Performance Concerns with Large Data**:
   - Tables like `strava_activity_streams` and `strava_activity_hr_stream_points` could grow very large, potentially causing performance issues without proper indexing and query optimization.
   - Consider implementing data archiving strategies or time-based partitioning for large tables.
   - Ensure queries against these tables are optimized and use appropriate indexes.

10. **Concurrent User Management**:
    - The system doesn't appear to have explicit handling for cases where a user might try to link multiple Strava accounts or where multiple users might try to link the same Strava account.
    - Implement proper constraints and validation to handle these edge cases.

11. **Data Synchronization Strategy**:
    - The current implementation doesn't clearly define how and when Strava data is synchronized (e.g., on-demand, scheduled, or real-time).
    - Consider implementing a clear strategy for data synchronization, including handling of rate limits and large data volumes.

12. **Webhook Integration**:
    - There doesn't appear to be support for Strava webhooks, which would allow for real-time updates when new activities are created.
    - Consider implementing webhook support to keep data in sync with Strava.

Addressing these issues will help ensure a more robust, maintainable, and error-resistant system.