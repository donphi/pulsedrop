// app/(legal)/privacy/page.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useScrollToTop } from '@/lib/useScrollToTop';

export default function PrivacyPolicy() {
  // Use the scroll to top hook
  useScrollToTop();
  
  // Format the date on the client side
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const privacyPolicyMarkdown = `
**Last updated:** ${currentDate}

## 1. Introduction

Welcome to Pulse Drop! This Privacy Policy explains how Pulse Drop ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our application and services. Pulse Drop is a research application developed for a PhD research project focusing on high-intensity exercise.

We are committed to protecting your privacy and handling your data in an open and transparent manner, in compliance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.

Please read this policy carefully. By using Pulse Drop, you acknowledge that you have understood the terms of this Privacy Policy.

## 2. About Pulse Drop

Pulse Drop is a research tool designed to collect and analyze fitness data, primarily from Strava, to support a PhD research project on high-intensity exercise. Your participation and the data you provide are crucial for this academic research.

## 3. Information We Collect

We collect various types of information in connection with the services we provide, including:

### 3.1. Information You Provide Directly

*   **Account Information**: When you create a Pulse Drop account, we may collect your name and email address.
*   **Strava Profile Information**: When you connect your Strava account, we collect information from your Strava profile, which may include your Strava ID, username, first name, last name, bio, city, state, country, sex, profile pictures, and weight.
*   **Preferences**: Application preferences you set within Pulse Drop.

### 3.2. Information from Strava (When Connected)

Subject to your authorization on Strava, we collect the following data:

*   **Activity Data**: Details of your fitness activities, such as type (e.g., Run, Ride), name, description, distance, duration (moving and elapsed time), elevation (gain, high, low), start and end times, timezone, and location data (start/end lat/long, city, state, country, map polylines).
*   **Health and Biometric Data (Special Category Data)**:
    *   Heart rate data (average, maximum, and time-series streams).
    *   Cadence, power (watts), and temperature, if available and provided by Strava.
    *   *We treat this health and biometric data as "special category data" under GDPR, requiring explicit consent and enhanced protection.*
*   **Gear Data**: Information about your equipment (e.g., bikes, shoes) linked to your activities, including name, brand, model, and distance.
*   **Route Data**: Details of routes you have created or used, including map data.
*   **Segment Data**: Information about segments you have attempted, including your efforts and rankings.
*   **Social Data**: Kudos, comments, and follower/friend counts related to your activities, if you choose to share them.

### 3.3. Information We Collect Automatically

*   **Usage Data**: Information about how you interact with the Pulse Drop application, such as features used, pages visited, and actions taken.
*   **Technical Data**: IP address, browser type and version, device information (operating system, model), and other technical details related to your access.

## 4. How We Use Your Information

We use your information for the following purposes:

*   **Primary Purpose - PhD Research**: The core use of your data, particularly activity and biometric data, is for academic research related to high-intensity exercise. Data used for research will be anonymized or pseudonymized wherever possible.
*   **Provide and Maintain Services**: To operate the Pulse Drop application, allow you to connect your Strava account, display your data, and use application features.
*   **Personalization**: To personalize your experience within Pulse Drop, such as displaying your activities and progress.
*   **Communication**: To send you important notices about the application, your account, or changes to our policies. We may also contact you for research-related communications if you have consented.
*   **Improvement and Development**: To analyze usage patterns, improve the application's functionality, and develop new features.
*   **Security and Integrity**: To protect the security of our application, prevent fraud, and enforce our terms.
*   **Legal Compliance**: To comply with applicable legal obligations, court orders, or government requests.

## 5. Legal Basis for Processing Your Information

We process your personal data based on the following legal grounds under GDPR:

*   **Consent (Article 6(1)(a) and Article 9(2)(a) GDPR)**: We rely on your explicit consent for:
    *   Collecting and processing your personal data when you create an account and connect Strava.
    *   Collecting and processing your special category data (health and biometric data like heart rate) for the research project and application functionality.
    *   You can withdraw your consent at any time (see Section 9).
*   **Scientific Research Purposes (Article 9(2)(j) GDPR)**: For the processing of special category data (health and biometric data) for the specific PhD research project, in conjunction with your explicit consent and appropriate safeguards.
*   **Legitimate Interests (Article 6(1)(f) GDPR)**: We may process some data for our legitimate interests, such as improving our application, ensuring security, and for administrative purposes, provided these interests are not overridden by your rights and interests.

## 6. Data Sharing and Disclosure

We do not sell your personal data. We may share your information in the following limited circumstances:

*   **PhD Researcher(s) & Supervisors**: Anonymized or pseudonymized data will be accessible to the PhD researcher(s) and their academic supervisors at [Mention University/Institution if applicable, otherwise state "the relevant academic institution"] for the sole purpose of conducting the PhD research.
*   **Service Providers**: We use third-party service providers to help us operate Pulse Drop. These include:
    *   **Supabase**: For database hosting, authentication, and backend infrastructure.
    *   **Vercel**: For hosting our application.
    *   These providers act as data processors on our behalf and are contractually obligated to protect your data and only process it according to our instructions.
*   **Legal Obligations**: We may disclose your information if required by law, subpoena, or other legal process, or if we have a good faith belief that disclosure is reasonably necessary to (i) comply with a legal obligation, (ii) protect and defend our rights or property, (iii) prevent or investigate possible wrongdoing in connection with the Service, or (iv) protect the personal safety of users of the Service or the public.
*   **Aggregated or Anonymized Data**: We may share aggregated or anonymized data (which does not identify you) for research publications, presentations, or reports.
*   **Strava**: Data is retrieved from your Strava account based on your authorization. We do not share your Pulse Drop-specific data back to Strava unless explicitly stated and consented to.

## 7. Data Security

We implement robust technical and organizational measures to protect your personal information, including:

*   **Encryption**: OAuth tokens from Strava are encrypted at rest (e.g., using pgcrypto). Data is transmitted over HTTPS.
*   **Access Controls**: Row Level Security (RLS) policies are implemented in our Supabase database to restrict data access based on user authentication and roles.
*   **Secure Development Practices**: We follow secure coding practices and regularly review our security measures.

While we take significant steps to secure your data, please be aware that no security system is impenetrable, and we cannot guarantee the absolute security of your information.

## 8. Data Retention

We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including for the PhD research, providing our services, and complying with legal obligations.

*   **User Account Data**: Retained as long as your Pulse Drop account is active.
*   **Strava Data (Activities, Biometrics, etc.)**: Retained for the duration of the PhD research project or as long as your account is active and connected to Strava, unless you request deletion. Specific retention periods (e.g., 10 years for activity/heart rate data for research, 2 years for location data, 1 year for Strava tokens) are defined in our internal data retention policy, after which data is anonymized or deleted.
*   **Anonymized Research Data**: Anonymized data used for research may be retained indefinitely for research integrity and archival purposes.
*   **Consent Records**: Retained for as long as necessary to demonstrate compliance (e.g., 10 years).

You can request the deletion of your data at any time (see Section 9).

## 9. Your Data Protection Rights (GDPR)

As a user, you have the following rights regarding your personal data under GDPR:

*   **Right to Access**: You can request a copy of the personal data we hold about you.
*   **Right to Rectification**: You can request correction of inaccurate or incomplete personal data.
*   **Right to Erasure ('Right to be Forgotten')**: You can request deletion of your personal data. Please note that for research integrity, some anonymized data may be retained. We will inform you if this is the case.
*   **Right to Restrict Processing**: You can request that we limit the processing of your personal data under certain conditions.
*   **Right to Data Portability**: You can request to receive your personal data in a structured, commonly used, and machine-readable format, and have the right to transmit that data to another controller.
*   **Right to Object to Processing**: You can object to our processing of your personal data based on legitimate interests.
*   **Right to Withdraw Consent**: You can withdraw your consent at any time where consent is our legal basis for processing. This will not affect the lawfulness of processing based on consent before its withdrawal. To withdraw consent, you can [describe mechanism, e.g., "use the settings in your Pulse Drop account" or "contact us directly"]. Withdrawing consent may affect your ability to use Pulse Drop.

To exercise any of these rights, please contact us at [support@pulsedrop.phd](mailto:support@pulsedrop.phd). We will respond to your request within one month.

## 10. International Data Transfers

Your information may be stored and processed in countries outside of your country of residence, including [mention specific regions if known, e.g., "the United States or other regions where Supabase/Vercel servers are located"]. These countries may have data protection laws that are different from those in your country. We take steps to ensure that your data is treated securely and in accordance with this Privacy Policy and applicable law, including using Standard Contractual Clauses where necessary.

## 11. Children's Privacy

Pulse Drop is not intended for individuals under the age of 18. We do not knowingly collect personal data from children under 18. If we become aware that a child under 18 has provided us with personal data, we will take steps to delete such information.

## 12. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and, where appropriate, through other communication channels (e.g., via email or in-app notification). We encourage you to review this Privacy Policy periodically.

## 13. Contact Us

If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:

**Pulse Drop Research Team** | 
Email: [support@pulsedrop.phd](mailto:support@pulsedrop.phd) | 
Institution: Westminster University
`;

  return (
    <>
      <p className="text-base/7 font-semibold text-primary">
        Pulse Drop
      </p>
      <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Privacy Policy
      </h1>
      <div className="mt-10 mx-auto max-w-3xl mb-16">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <style jsx global>{`
            .prose p {
              text-align: justify;
            }
            .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
              color: var(--color-foreground);
              font-weight: 600;
            }
            .prose a {
              color: var(--color-primary);
              font-weight: 500;
              text-decoration: none;
            }
            .prose a:hover {
              opacity: 0.8;
            }
            .prose ul > li::marker,
            .prose ol > li::marker {
              color: var(--color-primary);
            }
            /* .prose p, .prose li {
              color: var(--color-mutedText);
            } */
            /* .prose strong {
              color: var(--color-foreground);
            } */
          `}</style>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {privacyPolicyMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
}