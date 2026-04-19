// src/pages/site/TermsOfService.tsx
// LEGAL NOTICE: This document is a good-faith template. Have a licensed attorney
// review it before going live. Replace [COMPANY_ADDRESS] with your registered address.
import React from "react";
import { Link } from "react-router-dom";
import { useBranding } from "../../context/BrandingContext";

const sections = [
  { id: "s1",  title: "1. Agreement to Terms" },
  { id: "s2",  title: "2. Eligibility" },
  { id: "s3",  title: "3. Accounts & Registration" },
  { id: "s4",  title: "4. Subscription Plans & Billing" },
  { id: "s5",  title: "5. License & Acceptable Use" },
  { id: "s6",  title: "6. Prohibited Activities" },
  { id: "s7",  title: "7. Data & Privacy" },
  { id: "s8",  title: "8. Intellectual Property" },
  { id: "s9",  title: "9. Third-Party Services" },
  { id: "s10", title: "10. Service Availability" },
  { id: "s11", title: "11. Disclaimers of Warranties" },
  { id: "s12", title: "12. Limitation of Liability" },
  { id: "s13", title: "13. Indemnification" },
  { id: "s14", title: "14. Dispute Resolution & Arbitration" },
  { id: "s15", title: "15. Governing Law" },
  { id: "s16", title: "16. International Users & Export Controls" },
  { id: "s17", title: "17. Termination" },
  { id: "s18", title: "18. General Provisions" },
  { id: "s19", title: "19. Contact Us" },
];

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed mb-3">{children}</p>
);

const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-semibold text-slate-800">{children}</span>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[clamp(0.9rem,1.2vw,4rem)] font-semibold text-slate-800 mt-5 mb-2">{children}</h4>
);

const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed">{children}</li>
);

const TermsOfService: React.FC = () => {
  const { brandName } = useBranding();
  const effectiveDate = "April 19, 2026";

  const content = (bn: string) => [

    /* ── 1. Agreement to Terms ──────────────────────────────── */
    { id: "s1", num: "1", color: "bg-blue-100 text-blue-700", title: "Agreement to Terms",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>These Terms of Service (the "Agreement" or "Terms") constitute a legally binding
          contract between you ("User," "you," or "your") and <B>{bn}, Inc.</B>, a Delaware
          corporation ("Company," "we," "us," or "our"), governing your access to and use of
          the <B>{bn}</B> platform, website, APIs, and all related features and services
          (collectively, the "Service").</P>
          <P>By creating an account, clicking "I Agree," or by accessing or using the Service
          in any manner, you acknowledge that you have read, understood, and agree to be bound
          by these Terms and our <Link to="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy</Link>, which is incorporated herein by reference.</P>
          <P>If you are entering into this Agreement on behalf of an organization (a corporation,
          partnership, employer, or other legal entity), you represent and warrant that you have
          the legal authority to bind that organization to this Agreement, in which case the
          terms "you" and "your" refer to that organization. If you do not have such authority,
          you must not accept this Agreement or use the Service.</P>
          <P><B>If you do not agree to these Terms, you must not access or use the Service.</B></P>
        </div>
      ),
    },

    /* ── 2. Eligibility ─────────────────────────────────────── */
    { id: "s2", num: "2", color: "bg-violet-100 text-violet-700", title: "Eligibility",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>To use the Service, you must meet all of the following requirements:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li>You must be at least <B>18 years of age</B> (or the age of legal majority in
            your jurisdiction, if higher) to create an account or enter into this Agreement.</Li>
            <Li>You must not be a person barred from receiving the Service under the laws of
            the United States, your jurisdiction of residence, or any other applicable
            jurisdiction.</Li>
            <Li>The Service is a B2B (business-to-business) platform intended for professional
            use by organizations and their employees. Use by consumers outside of a commercial
            context may be subject to additional consumer protection rights under applicable
            law.</Li>
            <Li>You may not use the Service for any purpose that is illegal, fraudulent, or
            prohibited by these Terms.</Li>
          </ul>
          <P>The Service is <B>not directed to children under the age of 13</B>. If we learn
          that a child under 13 has provided personal information without verified parental
          consent, we will delete such information promptly. Organization administrators are
          responsible for ensuring employee accounts comply with applicable age requirements
          in their jurisdiction.</P>
        </div>
      ),
    },

    /* ── 3. Accounts & Registration ─────────────────────────── */
    { id: "s3", num: "3", color: "bg-teal-100 text-teal-700", title: "Accounts & Registration",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Account Creation</Sub>
          <P>To access most features of the Service, you must register for an account. You agree
          to provide accurate, current, and complete information during registration, and to keep
          such information updated at all times. Providing false, misleading, or fraudulent
          information is grounds for immediate account suspension or termination.</P>

          <Sub>B. Account Security</Sub>
          <P>You are responsible for: (i) maintaining the confidentiality and security of your
          account credentials; (ii) all activities that occur under your account; and (iii)
          immediately notifying us at security@{bn.toLowerCase()}.io of any unauthorized use
          of your account or any other security breach. We will not be liable for any loss or
          damage resulting from your failure to maintain the security of your account.</P>

          <Sub>C. Organization Accounts</Sub>
          <P>An organization account ("Workspace") may be created by a designated administrator
          ("Admin"). The Admin may invite additional users ("Members") and configure roles and
          permissions. The Admin accepts these Terms on behalf of the organization and is
          responsible for ensuring that all Members comply with this Agreement. The organization
          is responsible for the actions of its Members within the Service.</P>

          <Sub>D. Account Ownership</Sub>
          <P>Individual accounts belong to the individual user. Workspace accounts belong to the
          subscribing organization. If you create a Workspace using a corporate email address,
          the organization associated with that email domain may claim administrative rights to
          the Workspace, subject to domain verification.</P>
        </div>
      ),
    },

    /* ── 4. Subscription Plans & Billing ────────────────────── */
    { id: "s4", num: "4", color: "bg-amber-100 text-amber-700", title: "Subscription Plans & Billing",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Plans</Sub>
          <P>The Service is offered under the following plan tiers: (i) a free Individual plan;
          (ii) paid Professional plans billed per user per month or per year; and (iii) custom
          Enterprise plans. Features, limits, and pricing for each plan are described on our
          pricing page and may change upon notice.</P>

          <Sub>B. Fees & Payment</Sub>
          <P>All fees are quoted and charged in U.S. Dollars (USD) unless otherwise stated.
          Paid plans are billed in advance on a recurring cycle (monthly or annual, as selected).
          Payment is processed by our third-party payment processor (Stripe, Inc.). By providing
          a payment method, you authorize us to charge all fees as they become due. You represent
          that the payment method belongs to you or that you are authorized to use it.</P>

          <Sub>C. Free Trials</Sub>
          <P>We may offer a free trial period for paid plans. At the end of the trial period,
          your subscription will automatically convert to the applicable paid plan and your
          payment method will be charged <B>unless you cancel before the trial ends</B>. We
          will provide advance notice of the trial end date.</P>

          <Sub>D. Automatic Renewal</Sub>
          <P>Subscriptions automatically renew at the end of each billing period unless you
          cancel via your account settings or by contacting billing@{bn.toLowerCase()}.io at
          least <B>3 business days</B> before the renewal date. Cancellation takes effect at
          the end of the current paid period; no refunds are issued for partial periods except
          as required by applicable law.</P>

          <Sub>E. Price Changes</Sub>
          <P>We reserve the right to change subscription fees. We will provide at least
          <B> 30 days' advance written notice</B> (via email to your registered address) before
          any price increase takes effect. Your continued use after the effective date constitutes
          acceptance of the new pricing.</P>

          <Sub>F. Taxes</Sub>
          <P>Fees are exclusive of all applicable taxes, levies, or duties imposed by taxing
          authorities. You are responsible for paying all such taxes. Where we are required by
          law to collect VAT, GST, or similar taxes, these will be added to your invoice.</P>

          <Sub>G. Refunds</Sub>
          <P>Except as required by applicable law (including consumer protection laws in certain
          jurisdictions), all fees are non-refundable. If you are a consumer in the EU or UK,
          you may have a statutory right of withdrawal within 14 days of purchasing a paid plan,
          subject to the conditions of the relevant consumer protection regulations. To exercise
          this right, contact billing@{bn.toLowerCase()}.io within 14 days of purchase.</P>

          <Sub>H. Late Payments</Sub>
          <P>Overdue invoices may accrue interest at the lesser of 1.5% per month or the maximum
          rate permitted by applicable law. We reserve the right to suspend access to paid
          features upon non-payment after a <B>10-day cure period</B> following written notice.</P>
        </div>
      ),
    },

    /* ── 5. License & Acceptable Use ────────────────────────── */
    { id: "s5", num: "5", color: "bg-green-100 text-green-700", title: "License & Acceptable Use",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. License Grant</Sub>
          <P>Subject to your compliance with these Terms and payment of applicable fees, we
          grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable
          license to access and use the Service solely for your internal business purposes
          during the term of your subscription.</P>

          <Sub>B. Restrictions</Sub>
          <P>You may not: (i) copy, modify, distribute, sell, sublicense, or create derivative
          works of the Service or any part thereof; (ii) reverse engineer, decompile,
          disassemble, or otherwise attempt to derive the source code of the Service;
          (iii) access the Service to build a competing product or service; (iv) remove or
          alter any proprietary notices, labels, or marks on the Service; (v) use the Service
          in any manner that violates applicable law or these Terms.</P>

          <Sub>C. API Access</Sub>
          <P>Where we provide API access, your use of the API is subject to additional API
          terms which are incorporated into this Agreement. We reserve the right to set and
          enforce rate limits on API calls to maintain platform stability.</P>
        </div>
      ),
    },

    /* ── 6. Prohibited Activities ───────────────────────────── */
    { id: "s6", num: "6", color: "bg-red-100 text-red-700", title: "Prohibited Activities",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>You agree not to engage in any of the following while using the Service:</P>
          <ul className="list-disc pl-6 space-y-2">
            <Li><B>Unauthorized Access:</B> Attempting to gain unauthorized access to the Service,
            other accounts, computer systems, or networks connected to the Service via hacking,
            password mining, credential stuffing, or any other means.</Li>
            <Li><B>Interference & Disruption:</B> Engaging in any action that imposes an
            unreasonable or disproportionate load on the Service infrastructure, or that
            disrupts or degrades the performance of the Service for other users (including
            DDoS attacks, scraping at excessive rates, or transmitting malware).</Li>
            <Li><B>Fraudulent or Misleading Conduct:</B> Impersonating any person or entity,
            falsely representing your identity or affiliation, or submitting false data into
            the Service.</Li>
            <Li><B>Unlawful Content or Conduct:</B> Using the Service to store, transmit, or
            process any content or data that: infringes third-party intellectual property rights;
            constitutes defamation, harassment, or hate speech; violates privacy rights; or is
            otherwise illegal under applicable US federal, state, or local law, or the laws of
            your jurisdiction.</Li>
            <Li><B>Circumventing Controls:</B> Attempting to bypass, disable, or circumvent any
            security feature, access control, usage limit, or technical protection measure.</Li>
            <Li><B>Data Mining & Scraping:</B> Using automated means to extract data from the
            Service beyond what is expressly permitted by an authorized API integration.</Li>
            <Li><B>Violation of Export Laws:</B> Using or exporting the Service in violation of
            US Export Administration Regulations (EAR) or any applicable export control laws.</Li>
          </ul>
          <P>Violation of these prohibitions may result in immediate account suspension or
          termination, at our sole discretion, and may expose you to civil and criminal liability.</P>
        </div>
      ),
    },

    /* ── 7. Data & Privacy ──────────────────────────────────── */
    { id: "s7", num: "7", color: "bg-indigo-100 text-indigo-700", title: "Data & Privacy",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Your Data</Sub>
          <P>All data you input, upload, or generate within the Service, including attendance
          records, time entries, project information, and employee profiles ("Customer Data"),
          remains your property (or your organization's property). We claim no ownership over
          Customer Data.</P>

          <Sub>B. License to Customer Data</Sub>
          <P>By using the Service, you grant us a limited, worldwide, non-exclusive license
          to access, process, host, reproduce, and display Customer Data solely as necessary
          to: (i) provide and maintain the Service; (ii) prevent or address technical or
          security issues; and (iii) comply with your instructions and applicable law. We do
          not use Customer Data to train machine learning models without your explicit consent.</P>

          <Sub>C. Data Processing Agreement</Sub>
          <P>Where you are processing personal data of EU/UK/Swiss individuals (e.g., employee
          attendance records), applicable data protection law (including GDPR Article 28) may
          require a Data Processing Agreement (DPA) between us. A standard DPA is available
          upon written request to privacy@{bn.toLowerCase()}.io and is incorporated into this
          Agreement upon execution.</P>

          <Sub>D. Privacy Policy</Sub>
          <P>Our collection and use of personal data is governed by our{" "}
          <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>,
          which is incorporated into this Agreement by reference. By using the Service, you
          acknowledge that you have read and agreed to our Privacy Policy.</P>

          <Sub>E. Data Export & Deletion</Sub>
          <P>You may export your Customer Data in standard formats (CSV, JSON) at any time
          through your account settings. Upon termination of your account, we will retain
          Customer Data for 90 days to allow for data retrieval, after which it will be
          permanently deleted from our production systems (subject to backup retention
          schedules and legal hold obligations described in the Privacy Policy).</P>
        </div>
      ),
    },

    /* ── 8. Intellectual Property ───────────────────────────── */
    { id: "s8", num: "8", color: "bg-orange-100 text-orange-700", title: "Intellectual Property",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Our IP</Sub>
          <P>The Service and all of its components — including but not limited to software,
          source code, algorithms, user interfaces, designs, text, graphics, logos, trademarks,
          trade secrets, and documentation — are the exclusive property of {bn}, Inc. and are
          protected by United States and international intellectual property laws, including
          the Copyright Act (17 U.S.C. § 101 et seq.), the Lanham Act, and applicable patent
          law. All rights not expressly granted in these Terms are reserved by {bn}, Inc.</P>

          <Sub>B. Trademarks</Sub>
          <P>"{bn}," the {bn} logo, and all related product names and taglines are trademarks
          or registered trademarks of {bn}, Inc. You may not use our trademarks without our
          prior written consent. Third-party trademarks referenced on the platform belong to
          their respective owners.</P>

          <Sub>C. Feedback</Sub>
          <P>If you submit ideas, suggestions, or feedback about the Service ("Feedback"), you
          grant us a perpetual, irrevocable, royalty-free, worldwide license to use, implement,
          modify, and exploit such Feedback for any purpose, without compensation or attribution
          to you. We are under no obligation to implement any Feedback.</P>

          <Sub>D. DMCA / Copyright Infringement</Sub>
          <P>We respect intellectual property rights. If you believe that content on the Service
          infringes your copyright, please send a written notice complying with the requirements
          of 17 U.S.C. § 512(c)(3) (the DMCA) to our designated agent:</P>
          <P>DMCA Agent: <B>legal@{bn.toLowerCase()}.io</B> | {bn}, Inc. — Attn: DMCA Agent,
          [COMPANY_ADDRESS], Wilmington, Delaware 19801, USA.</P>
          <P>We will respond to valid DMCA takedown notices in accordance with applicable law
          and reserve the right to terminate the accounts of repeat infringers.</P>
        </div>
      ),
    },

    /* ── 9. Third-Party Services ────────────────────────────── */
    { id: "s9", num: "9", color: "bg-cyan-100 text-cyan-700", title: "Third-Party Services",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>The Service may contain links to, or integrate with, third-party websites,
          applications, or services ("Third-Party Services") that are not owned or controlled
          by {bn}, Inc. These may include payment processors, calendar integrations, SSO
          providers, and analytics tools.</P>
          <P>We have no control over, and assume no responsibility for, the content, privacy
          policies, or practices of any Third-Party Services. We encourage you to review the
          terms and privacy policies of any Third-Party Services you use in connection with
          the Service.</P>
          <P>Your use of Third-Party Services is governed solely by the terms of those services.
          We are not a party to any transaction or relationship between you and any third-party
          provider, and we disclaim all liability arising from such transactions or relationships.</P>
        </div>
      ),
    },

    /* ── 10. Service Availability ───────────────────────────── */
    { id: "s10", num: "10", color: "bg-teal-100 text-teal-700", title: "Service Availability & Changes",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Availability</Sub>
          <P>We strive to maintain the Service with a target of 99.9% monthly uptime for paid
          plans. Planned maintenance will be announced at least 48 hours in advance via our
          status page (status.{bn.toLowerCase()}.io). We are not liable for any unavailability
          caused by circumstances beyond our reasonable control (see Section 18 — Force Majeure).</P>

          <Sub>B. Changes to the Service</Sub>
          <P>We reserve the right to modify, update, suspend, or discontinue any part of the
          Service at any time. For material changes that reduce functionality in your current
          paid plan, we will provide at least <B>30 days' written notice</B> and, where
          applicable, a pro-rated refund for the unused portion of your subscription.</P>

          <Sub>C. Beta Features</Sub>
          <P>We may offer certain features or functionality in a beta, preview, or early access
          state ("Beta Features"). Beta Features are provided "as is," without any warranty or
          SLA, and may be discontinued at any time. Beta Features are not covered by our
          standard support commitments.</P>
        </div>
      ),
    },

    /* ── 11. Disclaimers of Warranties ──────────────────────── */
    { id: "s11", num: "11", color: "bg-yellow-100 text-yellow-700", title: "Disclaimers of Warranties",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN
          <B> "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
          OR IMPLIED</B>, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AND ACCURACY.</P>
          <P>WE DO NOT WARRANT THAT: (I) THE SERVICE WILL MEET YOUR SPECIFIC REQUIREMENTS;
          (II) THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE; (III) ANY DEFECTS
          OR ERRORS IN THE SERVICE WILL BE CORRECTED; OR (IV) ANY DATA TRANSMITTED THROUGH
          THE SERVICE IS SECURE OR WILL NOT BE INTERCEPTED BY THIRD PARTIES.</P>
          <P>Some jurisdictions do not allow the exclusion of implied warranties or limitations
          on consumer statutory rights. In such jurisdictions, the above disclaimers apply to
          the fullest extent permitted by law. Consumers in the European Union retain applicable
          statutory rights under EU consumer protection law that cannot be excluded or waived
          by contract.</P>
        </div>
      ),
    },

    /* ── 12. Limitation of Liability ────────────────────────── */
    { id: "s12", num: "12", color: "bg-red-100 text-red-700", title: "Limitation of Liability",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</P>
          <P><B>(A) EXCLUSION OF CONSEQUENTIAL DAMAGES:</B> IN NO EVENT SHALL {bn.toUpperCase()},
          INC., ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, AFFILIATES, SUPPLIERS, OR LICENSORS
          BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
          DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF DATA,
          LOSS OF GOODWILL, BUSINESS INTERRUPTION, OR COST OF SUBSTITUTE SERVICES, ARISING OUT
          OF OR IN CONNECTION WITH YOUR USE OF (OR INABILITY TO USE) THE SERVICE, EVEN IF
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</P>
          <P><B>(B) AGGREGATE CAP ON LIABILITY:</B> OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR
          ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED
          THE GREATER OF: (I) THE TOTAL FEES PAID BY YOU TO {bn.toUpperCase()}, INC. IN THE
          TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY; OR
          (II) ONE HUNDRED U.S. DOLLARS (USD $100).</P>
          <P>These limitations reflect a fair allocation of risk between the parties and are a
          fundamental basis of the bargain between us. Some jurisdictions do not permit the
          exclusion or limitation of certain categories of damages. In those jurisdictions, our
          liability is limited to the fullest extent permitted by law. EU consumers retain any
          mandatory rights under applicable consumer protection legislation that cannot be
          excluded.</P>
        </div>
      ),
    },

    /* ── 13. Indemnification ────────────────────────────────── */
    { id: "s13", num: "13", color: "bg-pink-100 text-pink-700", title: "Indemnification",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>You agree to defend, indemnify, and hold harmless {bn}, Inc. and its officers,
          directors, employees, agents, contractors, affiliates, successors, and assigns from
          and against any claims, liabilities, damages, losses, penalties, and expenses
          (including reasonable attorneys' fees and court costs) arising out of or relating to:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li>Your access to or use of the Service in violation of these Terms.</Li>
            <Li>Your Customer Data, including any claim that it infringes the intellectual
            property rights, privacy rights, or other rights of a third party.</Li>
            <Li>Your violation of any applicable law, regulation, or order.</Li>
            <Li>Any misrepresentation made by you in connection with the Service.</Li>
          </ul>
          <P>We reserve the right to assume exclusive control of any matter subject to
          indemnification by you, at your expense. You agree to cooperate fully with our
          defense of such claims. You may not settle any claim that imposes liability or
          obligation on us without our prior written consent.</P>
        </div>
      ),
    },

    /* ── 14. Dispute Resolution & Arbitration ───────────────── */
    { id: "s14", num: "14", color: "bg-violet-100 text-violet-700", title: "Dispute Resolution & Arbitration",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Informal Resolution First</Sub>
          <P>Before initiating any formal dispute proceeding, you and {bn}, Inc. each agree
          to provide the other party with written notice of the dispute ("Notice of Dispute")
          and to attempt in good faith to resolve the dispute informally within <B>30 days</B>
          of receipt of such notice. Notices must be sent to: legal@{bn.toLowerCase()}.io
          (for notices to us) or your registered email address (for notices to you).</P>

          <Sub>B. Binding Arbitration</Sub>
          <P>If the parties are unable to resolve a dispute informally, <B>any dispute, claim,
          or controversy arising out of or relating to these Terms or the Service — including
          questions about the validity, enforceability, or scope of this arbitration clause —
          shall be resolved exclusively by binding arbitration</B>, except as set forth in
          Section 14(D) below.</P>
          <P>Arbitration shall be administered by JAMS (jamsadr.com) pursuant to its
          Comprehensive Arbitration Rules and Procedures, or its Streamlined Arbitration Rules
          for claims under $250,000 USD. The arbitration shall be conducted in English by a
          single arbitrator. The arbitration may be conducted by videoconference. The
          arbitrator's award shall be final and binding and may be entered as a judgment in
          any court of competent jurisdiction.</P>
          <P>The parties shall each bear their own costs and attorneys' fees in arbitration,
          except that: (i) the arbitrator may award fees and costs to the prevailing party
          as permitted by law; and (ii) if we initiate arbitration and you are an individual
          consumer, we will pay all JAMS filing fees and costs regardless of outcome.</P>

          <Sub>C. Class Action Waiver</Sub>
          <P><B>TO THE FULLEST EXTENT PERMITTED BY LAW, YOU WAIVE YOUR RIGHT TO PARTICIPATE IN
          A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.</B> All disputes must be brought
          on an individual basis only. The arbitrator does not have authority to consolidate
          claims of multiple parties or to award class-wide relief.</P>

          <Sub>D. Exceptions</Sub>
          <P>The following disputes are <B>not</B> subject to arbitration and may be pursued
          in court: (i) claims for emergency injunctive or equitable relief to prevent
          imminent harm; (ii) claims related to intellectual property infringement; and
          (iii) small claims court actions, where eligible. EU consumers retain the right to
          bring claims before their local courts and may also use the European Commission's
          Online Dispute Resolution platform (ec.europa.eu/odr).</P>

          <Sub>E. Opt-Out Right</Sub>
          <P>If you are a new user, you may opt out of the arbitration agreement by sending
          written notice to legal@{bn.toLowerCase()}.io with the subject line "Arbitration
          Opt-Out" within <B>30 days</B> of first accepting these Terms. Opting out will not
          affect any other provision of these Terms.</P>
        </div>
      ),
    },

    /* ── 15. Governing Law ──────────────────────────────────── */
    { id: "s15", num: "15", color: "bg-blue-100 text-blue-700", title: "Governing Law",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>These Terms and any dispute arising out of or related to them shall be governed
          by and construed in accordance with the laws of the <B>State of Delaware, United
          States of America</B>, without regard to its conflict-of-law principles.</P>
          <P>For disputes not subject to arbitration under Section 14, the parties consent to
          the exclusive personal jurisdiction of the federal and state courts located in
          <B> New Castle County, Delaware</B> and waive any objection to the exercise of
          jurisdiction by such courts.</P>
          <P><B>European Union and United Kingdom Users:</B> Nothing in this Section limits
          your right under mandatory EU or UK consumer protection law to bring proceedings
          in your local courts or to have your local mandatory law applied. EU consumers in
          particular retain all rights conferred by EU Directive 2019/771 on sale of goods
          and Directive 2011/83/EU on consumer rights.</P>
        </div>
      ),
    },

    /* ── 16. International Users & Export Controls ──────────── */
    { id: "s16", num: "16", color: "bg-green-100 text-green-700", title: "International Users & Export Controls",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>The Service is operated from the United States but is available to users
          worldwide. By accessing the Service from outside the United States, you acknowledge
          that your use may be subject to local laws in addition to these Terms. You are
          responsible for compliance with any applicable local laws.</P>
          <P><B>Export Controls:</B> The Service is subject to United States export control
          laws and regulations, including the Export Administration Regulations (15 C.F.R.
          Parts 730–774) administered by the U.S. Department of Commerce and the economic
          sanctions programs administered by the U.S. Department of the Treasury's Office
          of Foreign Assets Control (OFAC). You may not use, export, re-export, transfer,
          or access the Service:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li>To or from any country or territory that is subject to a comprehensive
            U.S. embargo (currently including Cuba, Iran, North Korea, Syria, and the
            Crimea/Donetsk/Luhansk regions of Ukraine).</Li>
            <Li>To any person or entity on the U.S. Treasury Department's Specially
            Designated Nationals (SDN) list, or on any applicable U.S. or UN sanctions
            list.</Li>
            <Li>For any end-use prohibited by U.S. export regulations, including weapons
            of mass destruction development or proliferation activities.</Li>
          </ul>
          <P>By using the Service, you represent and warrant that you are not located in any
          such country or territory, and that you are not on any such prohibited list. We
          reserve the right to terminate accounts or block access where export control laws
          require or recommend such action.</P>
          <P><B>EU / UK Users:</B> The Service complies with GDPR and UK GDPR as described
          in our Privacy Policy. EU users may also have rights under the EU Digital Services
          Act (DSA) and the EU Digital Markets Act (DMA) where applicable.</P>
          <P><B>Australia:</B> Users in Australia are protected by the Australian Consumer
          Law (Schedule 2 of the Competition and Consumer Act 2010). Nothing in these Terms
          limits statutory guarantees that cannot be excluded under Australian law.</P>
          <P><B>Canada:</B> {bn} complies with the Personal Information Protection and
          Electronic Documents Act (PIPEDA) for Canadian users. Quebec residents have
          additional rights under Law 25 (Act Respecting the Protection of Personal
          Information in the Private Sector).</P>
        </div>
      ),
    },

    /* ── 17. Termination ────────────────────────────────────── */
    { id: "s17", num: "17", color: "bg-red-100 text-red-700", title: "Termination",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Termination by You</Sub>
          <P>You may terminate your account at any time by using the account deletion feature
          in your settings or by contacting support@{bn.toLowerCase()}.io. Termination of a
          paid plan takes effect at the end of the current billing period. Fees already paid
          are non-refundable (except as required by applicable law).</P>

          <Sub>B. Termination or Suspension by Us</Sub>
          <P>We may suspend or terminate your access to the Service immediately, without prior
          notice, for any of the following reasons:</P>
          <ul className="list-disc pl-6 space-y-1">
            <Li>Material or repeated breach of these Terms.</Li>
            <Li>Non-payment of subscription fees after a 10-day cure period following
            written notice.</Li>
            <Li>Where we are required to do so by law, regulation, or court order.</Li>
            <Li>Where continued access poses a security risk to the Service or other users.</Li>
          </ul>
          <P>For non-material breaches, we will provide at least <B>14 days' written notice</B>
          and an opportunity to cure before termination.</P>

          <Sub>C. Effect of Termination</Sub>
          <P>Upon termination: (i) all licenses granted to you under these Terms immediately
          cease; (ii) you must cease all use of the Service; (iii) we will make your Customer
          Data available for export for 90 days post-termination, after which it will be
          permanently deleted. Sections 7, 8, 11, 12, 13, 14, 15, 17(C), and 18 survive
          termination of this Agreement.</P>
        </div>
      ),
    },

    /* ── 18. General Provisions ─────────────────────────────── */
    { id: "s18", num: "18", color: "bg-slate-200 text-slate-700", title: "General Provisions",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <Sub>A. Entire Agreement</Sub>
          <P>These Terms, together with our Privacy Policy, any Data Processing Agreement, and
          any other agreement expressly incorporated by reference, constitute the entire
          agreement between you and {bn}, Inc. with respect to the Service and supersede all
          prior understandings, negotiations, and agreements, whether written or oral.</P>

          <Sub>B. Modifications to Terms</Sub>
          <P>We reserve the right to modify these Terms at any time. For material changes,
          we will provide at least <B>30 days' advance written notice</B> via email and/or
          in-app notification. Your continued use of the Service after the effective date of
          revised Terms constitutes your acceptance of the changes. If you do not agree,
          you must discontinue using the Service before the changes take effect.</P>

          <Sub>C. Severability</Sub>
          <P>If any provision of these Terms is found invalid, illegal, or unenforceable by
          a court of competent jurisdiction, such provision shall be modified to the minimum
          extent necessary to make it enforceable, and the remaining provisions shall remain
          in full force and effect.</P>

          <Sub>D. Waiver</Sub>
          <P>Our failure to enforce any right or provision of these Terms shall not constitute
          a waiver of that right or provision. Any waiver must be in writing and signed by
          an authorized representative of {bn}, Inc. to be effective.</P>

          <Sub>E. Assignment</Sub>
          <P>You may not assign or transfer your rights or obligations under these Terms
          without our prior written consent. We may freely assign these Terms, including
          in connection with a merger, acquisition, or sale of all or substantially all of
          our assets, with 30 days' notice to you.</P>

          <Sub>F. Force Majeure</Sub>
          <P>Neither party shall be liable for any failure or delay in performance resulting
          from causes beyond its reasonable control, including acts of God, natural disasters,
          war, terrorism, riots, embargoes, acts of civil or military authority, fire, flood,
          pandemic, internet or telecommunications failures, or acts of governmental
          authorities.</P>

          <Sub>G. Notices</Sub>
          <P>Notices from us to you will be sent to your registered email address or posted
          within the Service. Legal notices to us must be sent to: {bn}, Inc. — Attn: Legal
          Department, [COMPANY_ADDRESS], Wilmington, Delaware 19801, USA, with a copy to
          legal@{bn.toLowerCase()}.io.</P>

          <Sub>H. No Third-Party Beneficiaries</Sub>
          <P>These Terms do not confer any rights or remedies upon any third party, except as
          expressly stated herein.</P>

          <Sub>I. Relationship of the Parties</Sub>
          <P>Nothing in these Terms creates a partnership, joint venture, agency, franchise,
          or employment relationship between you and {bn}, Inc. You are an independent
          contractor and have no authority to bind {bn}, Inc. in any way.</P>
        </div>
      ),
    },

    /* ── 19. Contact Us ─────────────────────────────────────── */
    { id: "s19", num: "19", color: "bg-blue-100 text-blue-700", title: "Contact Us",
      content: (
        <div className="pl-[clamp(2.5rem,3.5vw,8rem)] space-y-3">
          <P>For any questions, notices, or inquiries regarding these Terms, please contact us:</P>
          <ul className="list-none space-y-2">
            <li className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed">
              <B>General Support:</B> support@{bn.toLowerCase()}.io
            </li>
            <li className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed">
              <B>Billing:</B> billing@{bn.toLowerCase()}.io
            </li>
            <li className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed">
              <B>Legal / Compliance:</B> legal@{bn.toLowerCase()}.io
            </li>
            <li className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed">
              <B>Privacy / DMCA:</B> privacy@{bn.toLowerCase()}.io
            </li>
            <li className="text-slate-600 text-[clamp(0.875rem,1.1vw,3.5rem)] leading-relaxed">
              <B>Mailing Address:</B> {bn}, Inc. — Attn: Legal, [COMPANY_ADDRESS], Wilmington,
              Delaware 19801, United States
            </li>
          </ul>
          <p className="mt-4 italic text-slate-400 text-[clamp(0.75rem,0.9vw,2.5rem)]">
            We aim to respond to all legal inquiries within 5 business days.
          </p>
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
              <span className="text-sm font-medium text-blue-700">Terms of Service</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight text-slate-900">
              Clear Terms for a{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Trusted Platform
              </span>
            </h1>

            <p className="text-slate-500 text-base mb-3">
              Effective date: <span className="text-slate-800 font-semibold">{effectiveDate}</span>
            </p>
            <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
              Governing law: State of Delaware, USA. Additional provisions apply for EEA/UK
              (GDPR), California (CCPA/CPRA), and other jurisdictions. Binding arbitration
              applies for most disputes (see Section 14).
            </p>

            <div className="flex justify-center gap-4">
              <Link to="/home" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-slate-300 hover:shadow-md transition-all duration-300">
                Back to Home
              </Link>
              <Link to="/privacy" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:border-slate-300 hover:shadow-md transition-all duration-300">
                Privacy Policy
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
                These Terms of Service govern your access to and use of the <strong>{brandName}</strong> platform,
                operated by <strong>{brandName}, Inc.</strong>, a Delaware corporation. By using the Service,
                you agree to these Terms. Please read them carefully. If you are using the
                Service on behalf of an organization, you represent that you have authority
                to bind that organization to these Terms.
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
              <Link to="/privacy"
                className="flex items-center gap-[clamp(0.5rem,0.8vw,2rem)] px-[clamp(1.5rem,2.5vw,7rem)] py-[clamp(0.75rem,1.2vw,4rem)] bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:shadow-md transition-all duration-300 font-medium text-[clamp(0.875rem,1.1vw,3.5rem)]">
                Privacy Policy
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

export default TermsOfService;
