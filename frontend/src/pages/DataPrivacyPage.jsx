import React from 'react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Who we are',
    body: [
      <>
        The San Fabian Population Office (&ldquo;Office&rdquo;), under the Local Government Unit
        of <span className="dp-page__todo">[TODO: municipality, province]</span>, operates this
        website to provide information about population programs and services and to manage
        related citizen records.
      </>,
    ],
  },
  {
    title: '2. Personal information we collect',
    body: [
      <>
        Depending on how you use the website and our services, we may collect: your name,
        address, birthdate, sex, civil status, and contact details (mobile number, email
        address); information you provide when you register, apply for a service, or attend a
        program such as Pre-Marriage Orientation or the Usapan Series; account credentials if
        you have a login; messages you send us; and basic technical data needed to keep the
        site working and secure.
      </>,
    ],
  },
  {
    title: '3. Why we collect it',
    body: [
      <>
        To process and manage your records and applications; to schedule and confirm your
        attendance at programs and activities; to send you notifications by email or SMS about
        your requests, schedules, and announcements; to prepare population data and reports as
        required by law and by the Commission on Population and Development; and to secure the
        website and prevent misuse.
      </>,
    ],
  },
  {
    title: '4. Legal basis',
    body: [
      <>
        We process personal information under the Data Privacy Act of 2012 (RA 10173) on the
        basis of your consent, our functions as a government office, compliance with legal
        obligations, and the delivery of public services.
      </>,
    ],
  },
  {
    title: '5. Sharing and disclosure',
    body: [
      <>
        We do not sell your personal information. We may share it only with authorized personnel
        of the Office and the LGU, with government agencies where required by law or for program
        implementation, and with service providers that help us run the website (for example
        hosting, database, email, and SMS services) under agreements that require them to
        protect your data.
      </>,
    ],
  },
  {
    title: '6. Storage and retention',
    body: [
      <>
        Your information is stored securely and kept only as long as needed for the purposes
        above or as required by law and government records rules.{' '}
        <span className="dp-page__todo">[TODO: retention period as set by the LGU/DPO.]</span>{' '}
        When no longer needed, it is securely disposed of.
      </>,
    ],
  },
  {
    title: '7. Security',
    body: [
      <>
        We use reasonable organizational, physical, and technical safeguards, including access
        controls and encrypted connections (HTTPS), to protect your information against loss,
        misuse, and unauthorized access.
      </>,
    ],
  },
  {
    title: '8. Cookies and local storage',
    body: [
      <>
        This website uses only what is necessary for it to work, such as keeping you signed in
        and remembering that you acknowledged this notice. We do not use advertising or tracking
        cookies.{' '}
        <span className="dp-page__todo">[TODO: adjust if analytics are added later.]</span>
      </>,
    ],
  },
  {
    title: '9. Your rights',
    body: [
      <>
        Under the Data Privacy Act, you have the right to be informed; to access your personal
        information; to object to its processing; to correct inaccurate information; to request
        suspension, removal, or destruction of your data in certain cases; to data portability;
        to be indemnified for damages caused by inaccurate, unlawful, or unauthorized use of
        your data; and to file a complaint with the National Privacy Commission
        (www.privacy.gov.ph).
      </>,
    ],
  },
  {
    title: '10. Contact our Data Protection Officer',
    body: [
      <>
        For questions, requests, or concerns about your personal data:
        <br />
        Data Protection Officer: <span className="dp-page__todo">[TODO: name]</span>
        <br />
        Email: <span className="dp-page__todo">[TODO]</span>
        <br />
        Phone: <span className="dp-page__todo">[TODO]</span>
        <br />
        Office address: <span className="dp-page__todo">[TODO]</span>
      </>,
    ],
  },
  {
    title: '11. Changes to this notice',
    body: [
      <>
        We may update this notice from time to time. The latest version will always be posted on
        this page with its updated date.
      </>,
    ],
  },
];

export function DataPrivacyPage() {
  return (
    <div className="dp-page">
      <div className="dp-page__inner">
        <h1 className="dp-page__title">Data Privacy Notice</h1>
        <hr className="dp-page__rule" />
        <p className="dp-page__updated">
          Last updated: <span className="dp-page__todo">[TODO date]</span>
        </p>
        <p className="dp-page__intro">
          This notice explains how the San Fabian Population Office collects, uses, protects, and
          retains personal information through this website, in accordance with the Data Privacy
          Act of 2012 (Republic Act No. 10173).
        </p>

        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>
        ))}

        <p>
          <Link className="btn-secondary" to="/">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default DataPrivacyPage;
