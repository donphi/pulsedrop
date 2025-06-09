// app/(legal)/terms/page.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useScrollToTop } from '@/lib/useScrollToTop';

export default function TermsAndConditions() {
  // Use the scroll to top hook
  useScrollToTop();
  
  // Format the date on the client side
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const termsMarkdown = `
**Last updated:** ${currentDate}

## 1. Agreement to Terms

These Terms and Conditions ("Terms") constitute a legally binding agreement made between you ("you," "your," or "user") and the Pulse Drop research team ("Pulse Drop," "we," "us," or "our"), concerning your access to and use of the Pulse Drop mobile application and any related services (collectively, the "Application").

By accessing or using the Application, you agree that you have read, understood, and agree to be bound by all of these Terms. **If you do not agree with all of these Terms, then you are expressly prohibited from using the Application and you must discontinue use immediately.**

Supplemental terms and conditions or documents that may be posted on the Application from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Terms at any time and for any reason.

## 2. About Pulse Drop

Pulse Drop is a research application developed as part of a PhD research project focused on understanding high-intensity exercise. The Application allows users to connect their Strava accounts to contribute their activity data for this academic research. Your use of the Application is primarily for the purpose of participating in this research study.

## 3. User Eligibility and Responsibilities

### 3.1. Eligibility
You must be at least 18 years of age to use the Application. By using the Application, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms.

### 3.2. Account Registration
You may need to register for an account to use certain features of the Application. You agree to:
*   Provide true, accurate, current, and complete information about yourself as prompted by the registration form.
*   Maintain and promptly update your registration data to keep it true, accurate, current, and complete.
*   Maintain the security of your password and accept all risks of unauthorized access to your account and the information you provide to us.
*   Notify us immediately if you discover or otherwise suspect any security breaches related to the Application or your account.

### 3.3. Compliance with Laws
You agree to use the Application in compliance with all applicable local, state, national, and international laws, rules, and regulations.

## 4. Use of the Application

### 4.1. Permitted Use
Pulse Drop grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Application strictly for your personal, non-commercial participation in the PhD research study, in accordance with these Terms.

### 4.2. Prohibited Activities
You agree not to use the Application for any purpose that is illegal or prohibited by these Terms. You specifically agree not to:
*   Use the Application for any commercial purpose.
*   Access the Application through automated or non-human means, whether through a bot, script, or otherwise, except as expressly permitted by us.
*   Systematically retrieve data or other content from the Application to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.
*   Circumvent, disable, or otherwise interfere with security-related features of the Application.
*   Engage in unauthorized framing of or linking to the Application.
*   Trick, defraud, or mislead us or other users, especially in any attempt to learn sensitive account information such as user passwords.
*   Make improper use of our support services or submit false reports of abuse or misconduct.
*   Use any information obtained from the Application in order to harass, abuse, or harm another person.
*   Use the Application as part of any effort to compete with us or otherwise use the Application and/or the Content for any revenue-generating endeavor or commercial enterprise.
*   Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Application.
*   Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Application.

## 5. Strava Integration

To use Pulse Drop, you must authorize the Application to access your Strava account data.
*   You are solely responsible for your Strava account, including compliance with Strava's terms of service and privacy policy.
*   Pulse Drop retrieves data from Strava based on the permissions you grant. The types of data collected are detailed in our [Privacy Policy](#/legal/privacy).
*   Pulse Drop is not affiliated with, endorsed by, or sponsored by Strava. We are not responsible for the Strava service, its availability, or its accuracy.

## 6. Intellectual Property Rights

### 6.1. The Application
Unless otherwise indicated, the Application is our proprietary property. All source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Application (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws.

### 6.2. Your Data
You retain ownership of your personal data that you provide or make available through Strava. By using the Application and connecting your Strava account, you grant Pulse Drop a worldwide, non-exclusive, royalty-free license to access, use, process, copy, distribute, perform, export, and display your data solely for the purposes of:
*   Operating and providing the Application's functionalities to you.
*   Conducting the PhD research as described in our [Privacy Policy](#/legal/privacy).
*   Anonymizing or aggregating your data for research analysis and publication (in a form that does not personally identify you).

### 6.3. Research Output
Any academic publications, reports, or presentations resulting from the PhD research will use anonymized and/or aggregated data. You will not have any intellectual property rights in such research outputs.

## 7. Research Participation

Your use of Pulse Drop constitutes your voluntary participation in the PhD research project.
*   You understand that your data will be used for academic research purposes as detailed in our [Privacy Policy](#/legal/privacy).
*   You have the right to withdraw from the research study at any time by discontinuing your use of the Application and requesting the deletion of your data as outlined in the [Privacy Policy](#/legal/privacy).
*   There is no guarantee of direct personal benefit from participating in this research. The primary aim is to contribute to academic knowledge.

## 8. Disclaimers

THE APPLICATION IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. YOU AGREE THAT YOUR USE OF THE APPLICATION WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE APPLICATION AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE APPLICATION'S CONTENT OR THE CONTENT OF ANY WEBSITES LINKED TO THE APPLICATION AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE APPLICATION, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE APPLICATION, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE APPLICATION BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE APPLICATION.

PULSE DROP IS A RESEARCH TOOL AND DOES NOT PROVIDE MEDICAL ADVICE. THE INFORMATION AND DATA PROVIDED BY THE APPLICATION ARE FOR INFORMATIONAL AND RESEARCH PURPOSES ONLY AND ARE NOT INTENDED AS A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.

## 9. Limitation of Liability

TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE OR OUR RESEARCHERS, SUPERVISORS, OR AFFILIATES BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE APPLICATION, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

## 10. Indemnification

You agree to defend, indemnify, and hold us harmless, including our researchers, supervisors, and affiliates, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys’ fees and expenses, made by any third party due to or arising out of: (1) your use of the Application; (2) your breach of these Terms; (3) any breach of your representations and warranties set forth in these Terms; or (4) your violation of the rights of a third party, including but not limited to intellectual property rights.

## 11. Term and Termination

These Terms shall remain in full force and effect while you use the Application.
WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE APPLICATION (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE APPLICATION OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.

If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party.
You may terminate your use of the Application at any time by discontinuing use and requesting deletion of your account as described in the [Privacy Policy](#/legal/privacy).
Provisions of these Terms that by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.

## 12. Governing Law and Dispute Resolution

These Terms and your use of the Application are governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law principles.

If you are a resident of Scotland, you may also benefit from any mandatory provisions of Scottish law. If you are a resident of Ireland, you may also benefit from any mandatory provisions of Irish law.

Any disputes arising from or relating to these Terms or the Application will first be attempted to be resolved through amicable negotiations. If a dispute cannot be resolved through negotiation, it shall be subject to the exclusive jurisdiction of the courts of England and Wales. However, if you are a resident of Scotland or Ireland, you may also be able to bring proceedings in your local courts.

## 13. Changes to Terms and Conditions

We may modify these Terms from time to time. We will alert you about any changes by updating the "Last updated" date of these Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Terms to stay informed of updates. Your continued use of the Application after the date such revised Terms are posted will be deemed to be an acceptance of the changes.

## 14. Contact Us

If you have questions or comments about these Terms, please contact us at:

**Pulse Drop Research Team**
Email: [tempdon279@gmail.com](mailto:tempdon279@gmail.com)
Institution: Westminster University
`;

  return (
    <>
      <p className="text-base/7 font-semibold text-primary">
        Pulse Drop
      </p>
      <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Terms and Conditions
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
            {termsMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </>
  );
}