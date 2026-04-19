// src/pages/site/PrivacyPolicy.tsx
// LEGAL NOTICE: This document is a good-faith template. Have a licensed attorney
// review it before going live. Replace [COMPANY_ADDRESS] with your registered address.
import React from "react";
import { Link } from "react-router-dom";
import { useBranding } from "../../context/BrandingContext";

const sections = [
  { id: "s1",  title: "1. Who We Are" },
  { id: "s2",  title: "2. Information We Collect" },
  { id: "s3",  title: "3. How We Use Your Information" },
  { id: "s4",  title: "4. Legal Basis for Processing" },
  { id: "s5",  title: "5. Data Sharing & Disclosure" },
  { id: "s6",  title: "6. International Data Transfers" },
  { id: "s7",  title: "7. Data Retention" },
  { id: "s8",  title: "8. Security" },
  { id: "s9",  title: "9. Your Privacy Rights" },
  { id: "s10", title: "10. Cookies & Tracking" },
  { id: "s11", title: "11. Children's Privacy" },
  { id: "s12", title: "12. Changes to This Policy" },
  { id: "s13", title: "13. Contact Us" },
];

const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed">{children}</li>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed mb-3">{children}</p>
);

const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-semibold text-slate-800">{children}</span>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[clamp(0.9rem,1.2vw,4rem)] font-semibold text-slate-800 mt-5 mb-2">{children}</h4>
);

const PrivacyPolicy: React.FC = () => {
  const { brandName } = useBranding();
  const effectiveDate = "April 19, 2026";

  const content = (bn: string) => [

    /* ── 1. Who We Are ─────────────────────────────────────── */
    { id: "s1", num: "1", color: "bg-blue-100 text-blue-700", title: "Who We Are",
      content: (
        <div className="space-y-3 pl-[clamp(2.5rem,3.5vw,8rem)]">
          <P><B>{bn}, Inc.</B> ("Company," "we," "us," or "our") is a corporation incorporated in
          the State of Delaware, United States of America. We operate <B>{bn}</B>, a cloud-based
          workforce management platform that provides attendance tracking, time logging, and
          project management services (the "Service").</P>
          <P>For purposes of the EU General Data Protection Regulation (GDPR) and the UK GDPR,
          {bn}, Inc. is the <B>data controller</B> for personal data collected through the Service.
          Where we process personal data on behalf of your organization (e.g., your employees'
          records), we act as a <B>data processor</B> under a separate Data Processing Agreement
          (DPA) available upon request at <B>privacy@{bn.toLowerCase()}.io</B>.</P>
          <P>Our registered office is located at: <B>[COMPANY_ADDRESS], Wilmington, Delaware 19801,
          United States</B>. Please replace this placeholder with your actual registered address
          before publishing.</P>
        </div>
      ),
    },

    /* ── 2. Information We Collect ──────────────────────────── */
    { id: "s2", num: "2", color: "bg-violet-100 text-violet-700", title: "Information We Collect",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>We collect information in three ways: directly from you, automatically when you use
          the Service, and from your organization when it provisions your account.</P>

          <Sub>A. Account & Identity Information</Sub>
          <ul className="list-disc pl-6 space-y-1">
            <Li>Full name, email address, username, and password (hashed and salted).</Li>
            <Li>Profile photo (optional) and professional role/title.</Li>
            <Li>Organization name, billing address, and VAT/tax identification number (for paid plans).</Li>
          </ul>

          <Sub>B. Workforce & Usage Data</Sub>
          <ul className="list-disc pl-6 space-y-1">
            <Li>Check-in and check-out timestamps, shift records, leave requests, and attendance
            status generated through your use of the attendance module.</Li>
            <Li>Time entries: project name, task name, duration, billable flag, and notes you attach
            to each entry.</Li>
            <Li>Project and task data: names, descriptions, deadlines, priority levels, assignment
            history, and completion status.</Li>
            <Li>Team analytics data derived from the above (aggregated productivity metrics,
            weekly/monthly summaries).</Li>
          </ul>

          <Sub>C. Payment Information</Sub>
          <ul className="list-disc pl-6 space-y-1">
            <Li>Billing name, billing address, and the last four digits of a payment card. Full card
            numbers are processed and stored exclusively by our PCI-DSS-compliant payment processor
            (Stripe, Inc.) — we never store raw card numbers on our servers.</Li>
          </ul>

          <Sub>D. Technical & Device Data (Collected Automatically)</Sub>
          <ul className="list-disc pl-6 space-y-1">
            <Li>IP address, browser type and version, operating system, referring URLs, and device
            identifiers.</Li>
            <Li>Log files recording pages visited, features used, timestamps, and error events.</Li>
            <Li>Cookies and similar tracking technologies (see Section 10).</Li>
          </ul>

          <Sub>E. Communications</Sub>
          <ul className="list-disc pl-6 space-y-1">
            <Li>Email correspondence with our support team, feedback submissions, and survey responses.</Li>
          </ul>

          <P><B>Special Category / Sensitive Data:</B> We do not intentionally collect special
          category personal data as defined under GDPR (e.g., health data, biometric data, racial or
          ethnic origin). Attendance records may in some jurisdictions constitute employment-related
          personal data. We process such data solely as directed by your organization as data
          controller.</P>
        </div>
      ),
    },

    /* ── 3. How We Use Your Information ────────────────────── */
    { id: "s3", num: "3", color: "bg-teal-100 text-teal-700", title: "How We Use Your Information",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>We use personal data for the following purposes:</P>
          <ul className="list-disc pl-6 space-y-2">
            <Li><B>Providing the Service:</B> Creating and managing accounts, processing attendance
            records and time entries, generating reports, and delivering all platform features.</Li>
            <Li><B>Billing & Account Management:</B> Processing subscription payments, issuing
            invoices, and managing plan changes or cancellations.</Li>
            <Li><B>Customer Support:</B> Responding to support tickets, troubleshooting technical
            issues, and diagnosing errors.</Li>
            <Li><B>Security & Fraud Prevention:</B> Monitoring for unauthorized access, detecting
            abuse, enforcing our Acceptable Use Policy, and protecting the integrity of the
            platform.</Li>
            <Li><B>Product Improvement:</B> Analyzing aggregate, de-identified usage patterns to
            improve performance, reliability, and feature design. We do not use individual
            identifiable data for model training without your explicit consent.</Li>
            <Li><B>Legal Compliance:</B> Fulfilling obligations under applicable US federal and
            state law, and responding to lawful requests from public authorities.</Li>
            <Li><B>Communications:</B> Sending transactional emails (password resets, billing
            receipts, security alerts) and, where you have consented or we have a legitimate
            interest, product updates and feature announcements. You may opt out of marketing
            communications at any time.</Li>
          </ul>
          <P>We do <B>not</B> sell, rent, or exchange your personal data for monetary or other
          consideration. We do not use your data to serve third-party targeted advertising.</P>
        </div>
      ),
    },

    /* ── 4. Legal Basis for Processing ─────────────────────── */
    { id: "s4", num: "4", color: "bg-indigo-100 text-indigo-700", title: "Legal Basis for Processing (GDPR)",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>If you are located in the European Economic Area (EEA), the United Kingdom (UK), or
          Switzerland, we process your personal data under the following lawful bases pursuant to
          Article 6 of the GDPR:</P>
          <ul className="list-disc pl-6 space-y-2">
            <Li><B>Performance of a Contract (Art. 6(1)(b)):</B> Processing necessary to deliver
            the Service you have subscribed to — account creation, attendance tracking, time
            logging, billing, and support.</Li>
            <Li><B>Legitimate Interests (Art. 6(1)(f)):</B> Security monitoring, fraud prevention,
            abuse detection, and aggregate product analytics where these interests are not
            overridden by your rights and freedoms.</Li>
            <Li><B>Legal Obligation (Art. 6(1)(c)):</B> Compliance with US and EU/UK legal
            requirements, including responding to lawful authority requests.</Li>
            <Li><B>Consent (Art. 6(1)(a)):</B> Optional marketing communications and non-essential
            cookies, where we request your prior consent. You may withdraw consent at any time
            without affecting the lawfulness of prior processing.</Li>
          </ul>
          <P>For processing of employee attendance data by organizations, we act as a data processor
          under Article 28 GDPR. The relevant lawful basis (typically Art. 6(1)(b) or 6(1)(c))
          is determined by the organization as data controller.</P>
        </div>
      ),
    },

    /* ── 5. Data Sharing & Disclosure ───────────────────────── */
    { id: "s5", num: "5", color: "bg-green-100 text-green-700", title: "Data Sharing & Disclosure",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>We do not sell your personal data. We share personal data only in the following
          circumstances:</P>

          <Sub>A. Service Providers (Sub-processors)</Sub>
          <P>We engage trusted third-party service providers who process data solely on our
          behalf under written data processing agreements:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li><B>Cloud Hosting:</B> Amazon Web Services (AWS) — servers located in the United
            States.</Li>
            <Li><B>Payment Processing:</B> Stripe, Inc. — handles payment card data under PCI-DSS
            compliance.</Li>
            <Li><B>Transactional Email:</B> SendGrid / Twilio — for system-generated emails.</Li>
            <Li><B>Error Monitoring:</B> Sentry — anonymized error and performance diagnostics.</Li>
          </ul>
          <P>An up-to-date list of sub-processors is available upon written request to
          privacy@{bn.toLowerCase()}.io.</P>

          <Sub>B. Your Organization</Sub>
          <P>If your account was provisioned by an employer or organization, authorized
          administrators within that organization can access your profile, attendance records,
          time entries, and project activity as permitted by their plan and role configuration.</P>

          <Sub>C. Legal Requirements & Safety</Sub>
          <P>We may disclose personal data when required by applicable law, regulation, judicial
          process, or governmental authority (including US federal and state law), or where we
          believe in good faith that disclosure is necessary to protect the rights, property, or
          safety of {bn}, Inc., our users, or the public.</P>

          <Sub>D. Business Transfers</Sub>
          <P>In the event of a merger, acquisition, asset sale, or reorganization, personal data
          may be transferred to the successor entity. We will provide notice before your data is
          transferred and becomes subject to a different privacy policy.</P>

          <Sub>E. With Your Consent</Sub>
          <P>We may share your data with third parties when you explicitly direct us to do so or
          when you have given us your prior consent.</P>
        </div>
      ),
    },

    /* ── 6. International Data Transfers ────────────────────── */
    { id: "s6", num: "6", color: "bg-orange-100 text-orange-700", title: "International Data Transfers",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>{bn} is headquartered and primarily operates in the United States. If you are located
          outside the United States, your personal data will be transferred to, stored, and
          processed in the United States, where data protection laws may differ from those in
          your jurisdiction.</P>
          <P>For transfers of personal data from the EEA, UK, or Switzerland to the United States,
          we rely on the following transfer mechanisms as approved under GDPR Chapter V:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li><B>Standard Contractual Clauses (SCCs):</B> The European Commission's 2021 standard
            contractual clauses (for controller-to-processor and processor-to-processor transfers)
            are incorporated into our Data Processing Agreement and sub-processor agreements.</Li>
            <Li><B>UK International Data Transfer Agreement (IDTA):</B> For transfers from the UK
            we rely on the UK IDTA or the UK Addendum to the EU SCCs.</Li>
          </ul>
          <P>For users in other jurisdictions, we apply appropriate contractual or organizational
          safeguards consistent with the laws of those countries. To receive a copy of the
          relevant transfer safeguards, contact privacy@{bn.toLowerCase()}.io.</P>
        </div>
      ),
    },

    /* ── 7. Data Retention ──────────────────────────────────── */
    { id: "s7", num: "7", color: "bg-amber-100 text-amber-700", title: "Data Retention",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>We retain personal data for as long as necessary to fulfill the purposes described
          in this Policy, unless a longer retention period is required or permitted by law.</P>
          <ul className="list-disc pl-6 space-y-2">
            <Li><B>Active Accounts:</B> Account data, workforce records, and time entries are
            retained for the duration of your subscription and for up to <B>90 days</B> after
            account closure, to allow for reinstatement or data export.</Li>
            <Li><B>Billing Records:</B> Transaction records, invoices, and financial data are
            retained for <B>7 years</B> in compliance with US Internal Revenue Service (IRS)
            regulations and applicable state tax law.</Li>
            <Li><B>Security Logs:</B> Access and security event logs are retained for
            <B> 12 months</B> for fraud detection and incident response purposes.</Li>
            <Li><B>Backup Data:</B> Encrypted backups may persist for up to <B>30 days</B> after
            deletion before being permanently purged from our systems.</Li>
            <Li><B>Legal Hold:</B> Where personal data is subject to a legal hold, dispute,
            regulatory inquiry, or court order, we will retain the data until such matter is
            fully resolved.</Li>
          </ul>
          <P>After the applicable retention period, data is securely deleted or irreversibly
          anonymized. You may request earlier deletion subject to our legal obligations; see
          Section 9 for your rights.</P>
        </div>
      ),
    },

    /* ── 8. Security ────────────────────────────────────────── */
    { id: "s8", num: "8", color: "bg-red-100 text-red-700", title: "Security",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>We implement industry-standard technical and organizational security measures
          designed to protect your personal data against unauthorized access, disclosure,
          alteration, or destruction:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li><B>Encryption in Transit:</B> All data transmitted between your browser and our
            servers is encrypted using TLS 1.2 or higher (HTTPS).</Li>
            <Li><B>Encryption at Rest:</B> Databases containing personal data are encrypted at
            rest using AES-256.</Li>
            <Li><B>Password Storage:</B> Passwords are hashed using bcrypt with a unique salt;
            we never store plaintext passwords.</Li>
            <Li><B>Access Controls:</B> Internal access to production systems is restricted on a
            least-privilege basis, enforced by multi-factor authentication (MFA) and role-based
            access control (RBAC).</Li>
            <Li><B>Vulnerability Management:</B> We conduct regular security assessments, dependency
            audits, and penetration tests. Critical patches are applied within 72 hours of
            discovery.</Li>
            <Li><B>Incident Response:</B> We maintain a documented incident response plan.
            In the event of a personal data breach that triggers mandatory notification under
            applicable law (including GDPR Art. 33/34 and applicable US state breach notification
            laws), we will notify affected parties and relevant supervisory authorities within the
            legally required timeframes.</Li>
          </ul>
          <P>No security system is impenetrable. We encourage you to use strong, unique passwords,
          enable any available multi-factor authentication, and notify us immediately at
          security@{bn.toLowerCase()}.io if you suspect unauthorized account activity.</P>
        </div>
      ),
    },

    /* ── 9. Your Privacy Rights ─────────────────────────────── */
    { id: "s9", num: "9", color: "bg-pink-100 text-pink-700", title: "Your Privacy Rights",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>Depending on your location, you may have the following rights regarding your
          personal data. To exercise any of these rights, submit a verified request to
          privacy@{bn.toLowerCase()}.io. We will respond within the timeframe required by
          applicable law (generally 30–45 days).</P>

          <Sub>A. Rights Under GDPR (EEA, UK & Switzerland)</Sub>
          <ul className="list-disc pl-6 space-y-1">
            <Li><B>Right of Access (Art. 15):</B> Obtain a copy of the personal data we hold
            about you and information about how we process it.</Li>
            <Li><B>Right to Rectification (Art. 16):</B> Request correction of inaccurate or
            incomplete personal data.</Li>
            <Li><B>Right to Erasure / "Right to be Forgotten" (Art. 17):</B> Request deletion
            of your personal data where we no longer have a lawful basis to retain it.</Li>
            <Li><B>Right to Restriction of Processing (Art. 18):</B> Ask us to limit how we
            process your data in certain circumstances (e.g., while accuracy is contested).</Li>
            <Li><B>Right to Data Portability (Art. 20):</B> Receive your personal data in a
            structured, commonly used, machine-readable format (JSON or CSV) and transmit it to
            another controller.</Li>
            <Li><B>Right to Object (Art. 21):</B> Object to processing based on legitimate
            interests or for direct marketing purposes at any time.</Li>
            <Li><B>Rights Related to Automated Decision-Making (Art. 22):</B> We do not make
            solely automated decisions that produce significant legal effects. If we ever do,
            you have the right to human review.</Li>
            <Li><B>Right to Lodge a Complaint:</B> You have the right to lodge a complaint
            with your local supervisory authority (e.g., the Data Protection Authority in your
            EU member state, the ICO in the UK, or the FDPIC in Switzerland).</Li>
          </ul>

          <Sub>B. Rights Under California Privacy Law (CCPA / CPRA)</Sub>
          <P>California residents have the following rights under the California Consumer Privacy
          Act (CCPA) as amended by the California Privacy Rights Act (CPRA):</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li><B>Right to Know:</B> Request disclosure of the categories and specific pieces of
            personal information we have collected, the sources, purposes, and third parties with
            whom we share it.</Li>
            <Li><B>Right to Delete:</B> Request deletion of personal information we have collected,
            subject to certain exceptions.</Li>
            <Li><B>Right to Correct:</B> Request correction of inaccurate personal information.</Li>
            <Li><B>Right to Opt-Out of Sale or Sharing:</B> We do <B>not</B> sell or share
            personal information for cross-context behavioral advertising. No opt-out is required,
            but we provide this disclosure for transparency.</Li>
            <Li><B>Right to Limit Use of Sensitive Personal Information:</B> We do not use
            sensitive personal information for purposes beyond those permitted by the CPRA.</Li>
            <Li><B>Right to Non-Discrimination:</B> We will not discriminate against you for
            exercising any CCPA/CPRA rights.</Li>
          </ul>
          <P>To submit a verifiable consumer request, email privacy@{bn.toLowerCase()}.io with
          the subject line "California Privacy Request." We may need to verify your identity
          before processing your request.</P>

          <Sub>C. General Rights (All Users)</Sub>
          <ul className="list-disc pl-6 space-y-1">
            <Li>You may update your account information at any time via your account settings.</Li>
            <Li>You may request an export of your time entries and attendance data at any time.</Li>
            <Li>You may unsubscribe from marketing emails by clicking "Unsubscribe" in any
            marketing email or contacting us directly.</Li>
            <Li>Organization administrators may manage employee data access, roles, and deletion
            through the admin console.</Li>
          </ul>
        </div>
      ),
    },

    /* ── 10. Cookies & Tracking ─────────────────────────────── */
    { id: "s10", num: "10", color: "bg-cyan-100 text-cyan-700", title: "Cookies & Tracking Technologies",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>We use cookies and similar technologies (local storage, session tokens) to operate
          the Service, remember your preferences, and maintain your authenticated session.</P>
          <ul className="list-disc pl-6 space-y-2">
            <Li><B>Strictly Necessary Cookies:</B> Required for authentication sessions, CSRF
            protection, and core platform functionality. These cannot be disabled without
            breaking the Service.</Li>
            <Li><B>Functional Cookies:</B> Remember your language preferences, dashboard layout
            settings, and theme choices.</Li>
            <Li><B>Analytics Cookies:</B> Aggregate, anonymized data about feature usage and
            page performance (e.g., via a self-hosted analytics tool). No third-party behavioral
            tracking is used.</Li>
          </ul>
          <P>We do <B>not</B> use advertising cookies, third-party tracking pixels, or
          cross-site tracking technologies for marketing purposes.</P>
          <P>Where required by law (e.g., EU ePrivacy Directive, UK PECR), we obtain your
          consent before placing non-essential cookies. You may withdraw consent or manage
          cookie preferences at any time via your browser settings or our in-app preference
          center.</P>
        </div>
      ),
    },

    /* ── 11. Children's Privacy ─────────────────────────────── */
    { id: "s11", num: "11", color: "bg-yellow-100 text-yellow-700", title: "Children's Privacy",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>The Service is intended for use by businesses and professionals and is
          <B> not directed to children under the age of 13</B> (or, where applicable under
          local law, under the age of 16 for EU residents under the GDPR). We do not
          knowingly collect personal data from individuals under these ages.</P>
          <P>In compliance with the Children's Online Privacy Protection Act (COPPA), if we
          become aware that we have inadvertently collected personal information from a child
          under 13 without verifiable parental consent, we will take prompt steps to delete that
          information from our systems.</P>
          <P>If you believe we have collected information from a child under 13, please contact
          us immediately at privacy@{bn.toLowerCase()}.io.</P>
          <P>Organization administrators are responsible for ensuring that any employee accounts
          created in their workspace comply with applicable minimum age requirements in their
          jurisdiction.</P>
        </div>
      ),
    },

    /* ── 12. Changes to This Policy ─────────────────────────── */
    { id: "s12", num: "12", color: "bg-slate-200 text-slate-700", title: "Changes to This Policy",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>We may update this Privacy Policy from time to time to reflect changes in our
          practices, technology, legal requirements, or for other operational reasons. When we
          make material changes, we will:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li>Update the "Effective Date" at the top of this page.</Li>
            <Li>Display a notice within the platform (in-app banner or dashboard notification)
            at least <B>30 days</B> before the changes take effect for material changes.</Li>
            <Li>Send an email notification to registered account holders for significant
            changes that affect your rights.</Li>
          </ul>
          <P>Your continued use of the Service after the effective date of a revised Policy
          constitutes your acceptance of the updated terms. If you do not agree with any
          changes, you may close your account before the effective date.</P>
          <P>We encourage you to review this Policy periodically. Previous versions are
          available upon request from privacy@{bn.toLowerCase()}.io.</P>
        </div>
      ),
    },

    /* ── 13. Contact Us ─────────────────────────────────────── */
    { id: "s13", num: "13", color: "bg-blue-100 text-blue-700", title: "Contact Us",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>For any questions, concerns, or requests regarding this Privacy Policy or our
          data practices, please contact us through any of the following channels:</P>
          <ul className="list-none space-y-2">
            <Li><B>Privacy Inquiries & Rights Requests:</B> privacy@{bn.toLowerCase()}.io</Li>
            <Li><B>Security Incidents:</B> security@{bn.toLowerCase()}.io</Li>
            <Li><B>Legal & Compliance:</B> legal@{bn.toLowerCase()}.io</Li>
            <Li><B>Mailing Address:</B> {bn}, Inc. — Attn: Privacy Team, [COMPANY_ADDRESS],
            Wilmington, Delaware 19801, United States</Li>
          </ul>
          <P>For EU/EEA data subjects who wish to contact our EU Representative or escalate
          a complaint to a supervisory authority: we will appoint an EU Representative pursuant
          to Art. 27 GDPR prior to processing EU personal data at scale. Contact details will
          be published here upon appointment.</P>
          <P>We are committed to working with you to resolve any privacy concerns. If you are
          not satisfied with our response, you have the right to lodge a complaint with your
          local data protection authority.</P>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-slate-50">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 min-h-[420px] flex items-center py-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-blue-300/25 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[350px] h-[350px] bg-violet-300/25 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full border border-blue-200 mb-7">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700">Privacy Policy</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight text-slate-900">
              Your Data,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Handled Responsibly
              </span>
            </h1>

            <p className="text-slate-500 text-base mb-3">
              Effective date: <span className="text-slate-800 font-semibold">{effectiveDate}</span>
            </p>
            <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
              This policy applies to all users globally, with specific provisions for residents
              of the EEA/UK (GDPR) and California (CCPA/CPRA). Governing law: State of Delaware, USA.
            </p>

            <div className="flex justify-center gap-4">
              <Link to="/home" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-slate-300 hover:shadow-md transition-all duration-300">
                Back to Home
              </Link>
              <Link to="/terms" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-slate-300 hover:shadow-md transition-all duration-300">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
      <section className="py-[clamp(2.5rem,4vw,14rem)] px-[clamp(1.5rem,5vw,18rem)]">
        <div className="max-w-6xl 2xl:max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-[clamp(2rem,3vw,9rem)] items-start">

          {/* Sticky TOC */}
          <aside className="hidden lg:block lg:w-[clamp(16rem,18vw,52rem)] flex-shrink-0 sticky top-8">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-[clamp(1.5rem,2.5vw,7rem)]">
              <h3 className="text-[clamp(0.75rem,0.9vw,2.5rem)] font-bold text-slate-500 uppercase tracking-wide mb-[clamp(1rem,1.6vw,5rem)]">Contents</h3>
              <nav className="space-y-[clamp(0.25rem,0.4vw,1rem)]">
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="block text-[clamp(0.875rem,1.1vw,3.5rem)] text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-[clamp(0.75rem,1vw,3rem)] py-[clamp(0.5rem,0.8vw,2.5rem)] rounded-lg transition-all duration-200">
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Legal disclaimer card */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold block mb-1">Attorney Review Recommended</span>
                This document is a good-faith compliance template. Have a licensed attorney
                review it before publishing, and replace all <span className="font-mono bg-amber-100 px-1 rounded">[PLACEHOLDER]</span> fields.
              </p>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-[clamp(2rem,3vw,9rem)]">

              {/* Preamble */}
              <p className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed mb-[clamp(2rem,3vw,10rem)] pb-[clamp(2rem,3vw,10rem)] border-b border-slate-100">
                This Privacy Policy describes how <strong>{brandName}, Inc.</strong> ("we," "us," or "our")
                collects, uses, shares, and protects personal information when you access or use the{" "}
                <strong>{brandName}</strong> platform and related services (collectively, the "Service").
                It applies to all users worldwide, with additional provisions for residents of
                the European Economic Area, the United Kingdom, and the State of California.
                By using the Service, you acknowledge that you have read and understood this
                Privacy Policy. If you do not agree, please discontinue use of the Service.
              </p>

              <div className="space-y-[clamp(2.5rem,4vw,14rem)]">
                {content(brandName).map((section) => (
                  <div key={section.id} id={section.id} className="scroll-mt-24">
                    <h2 className="text-[clamp(1.125rem,2.8vw,7rem)] font-bold text-slate-900 mb-[clamp(1rem,1.6vw,5rem)] flex items-center gap-[clamp(0.75rem,1.2vw,4rem)]">
                      <span className={`w-[clamp(2rem,2.5vw,6rem)] h-[clamp(2rem,2.5vw,6rem)] ${section.color} rounded-lg flex items-center justify-center text-[clamp(0.75rem,1vw,3rem)] font-bold flex-shrink-0`}>
                        {section.num}
                      </span>
                      {section.title}
                    </h2>
                    {section.content}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom links */}
            <div className="mt-[clamp(2rem,3vw,10rem)] flex flex-col sm:flex-row gap-[clamp(1rem,2vw,7rem)]">
              <Link to="/home"
                className="flex items-center gap-[clamp(0.5rem,0.8vw,2rem)] px-[clamp(1.5rem,2.5vw,7rem)] py-[clamp(0.75rem,1.2vw,4rem)] bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:shadow-md transition-all duration-300 font-medium text-[clamp(0.875rem,1.1vw,3.5rem)]">
                <svg className="w-[clamp(1rem,1.2vw,3.5rem)] h-[clamp(1rem,1.2vw,3.5rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
              <Link to="/terms"
                className="flex items-center gap-[clamp(0.5rem,0.8vw,2rem)] px-[clamp(1.5rem,2.5vw,7rem)] py-[clamp(0.75rem,1.2vw,4rem)] bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:shadow-md transition-all duration-300 font-medium text-[clamp(0.875rem,1.1vw,3.5rem)]">
                Terms of Service
                <svg className="w-[clamp(1rem,1.2vw,3.5rem)] h-[clamp(1rem,1.2vw,3.5rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default PrivacyPolicy;
