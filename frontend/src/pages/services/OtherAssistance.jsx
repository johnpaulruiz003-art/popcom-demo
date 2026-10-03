import React from 'react';
import { ServiceBootstrapLayout } from './ServiceBootstrapLayout.jsx';
import { VideoEmbed } from './ServiceDetailLayout.jsx';
import imgSupportHome from '../../content/Home Images/SupportHomePage.jpg';

export function OtherAssistance() {
  return (
    <ServiceBootstrapLayout
      title="Other Assistance Service"
      imageUrl={imgSupportHome}
      imageAlt="Municipal staff providing referral-based assistance to a client"
      intro={
        <p>
          Other Assistance includes referral-based support that the LGU may provide depending on local arrangements.
          The focus is on counseling, information, and connecting clients to appropriate health or social welfare
          partners.
        </p>
      }
    >
      <h2>Health-Related Procedures: The "Referral Chain"</h2>

      <div className="sf-card">
        <h3>Vasectomy</h3>
        <VideoEmbed
          src="https://www.youtube.com/embed/W4sr_lOD3jk"
          title="What to Know Before Getting A Vasectomy | Kevin Campbell, MD | UF Health"
        />
        <p>
          Vasectomy is a permanent family planning option for men who are sure they do not want more children.
          Under the MNCHN (Maternal, Newborn, Child Health and Nutrition) guidelines, the LGU focuses on demand
          generation and navigation rather than performing the surgical procedure itself.
        </p>
        <p>
          Before any referral, clients undergo <strong>Pre‑Referral Counseling</strong>. This is a mandated
          session where a counselor uses the Decision‑Making Tool (DMT) to ensure that the client&apos;s decision is
          voluntary and fully informed.
        </p>

        <hr />

        <h3>Ligation</h3>
        <VideoEmbed src="https://www.youtube.com/embed/GxRJH2f--P0" title="Tubal Ligation Surgery" />
        <p>
          Ligation (tubal ligation) is a permanent family planning option for women who are sure they do not want
          more children. Similar to vasectomy, the LGU&apos;s role is to prepare and navigate clients toward accredited
          facilities that can safely perform the procedure.
        </p>
        <p>
          Through <strong>Ligation/Vasectomy Caravans</strong>, the LGU may consolidate 10–20 clients and provide a
          dedicated vehicle (often an ambulance or van) to transport them to DOH‑retained hospitals or
          PhilHealth‑accredited private clinics.
        </p>
        <p>
          LGU staff also help clients review their <strong>PhilHealth Member Data Record (MDR)</strong> so that
          eligible indigent clients can avail of <strong>No Balance Billing</strong> and pay zero out‑of‑pocket for
          the procedure.
        </p>
      </div>

      <h2>Civil Registration: The "Legal Gateway"</h2>

      <div className="sf-card">
        <h3>A. Late Birth Registration Process</h3>
        <VideoEmbed
          src="https://www.youtube.com/embed/aBll55Hk-FE"
          title="Late PSA Birth Certificate Registration in the Philippines: Step-by-Step Guide"
        />
        <p>
          Birth registration and mass weddings are managed by the Local Civil Registrar (LCR) under Republic Act No. 3753. For children in remote areas, the LGU helps parents complete late registration through <strong>Mobile Registration</strong> activities.
        </p>
        <p>
          The LGU first assists parents in obtaining a <strong>Negative Certification</strong> from the PSA to
          confirm that the child has not been registered elsewhere. If hospital records are missing (e.g., home
          births), staff coordinate with the Barangay Captain to identify two neighbors who can execute an
          <strong> Affidavit of Two Disinterested Persons</strong> to attest to the child&apos;s birth in that locality.
        </p>
        <p>
          For children of unmarried parents, the LGU helps implement <strong>RA 9255</strong> by assisting the
          father in signing the <strong>Affidavit of Admission of Paternity (AAP)</strong>, allowing the child to
          legally use the father&apos;s surname.
        </p>

        <hr />

        <h3>B. Kasalang Bayan (Mass Wedding) Screening</h3>
        <VideoEmbed
          src="https://www.youtube.com/embed/RAUW222iY5U"
          title="Mga dapat ihandang dokumento sa libreng kasalan"
        />
        <p>
          In partnership with the Mayor&apos;s Office, we organize and screen candidates for annual
          <strong> Kasalang Bayan</strong> (Mass Wedding) events. Beyond the ceremony, this serves as a legal vetting
          process.
        </p>
        <p>
          The LGU often assists couples in securing their <strong>CENOMAR (Certificate of No Marriage)</strong> to
          ensure that neither party is in an existing legal union. For couples who have lived together for five or
          more years, staff facilitate an <strong>Affidavit of Cohabitation</strong> under Article 34, allowing them
          to marry without the standard 10‑day posting of a marriage license.
        </p>
      </div>

      <h2>Special Population Case Management (OFW Families)</h2>

      <div className="sf-card">
        <h3>OFW Family Support</h3>
        <VideoEmbed src="https://www.youtube.com/embed/ZZ3nZ66ykcs" title="OFW Help Desk | TFC News EMEA" />
        <p>
          We offer specialized guidance and counseling for the families of Overseas Filipino Workers (OFWs), focusing
          on the <strong>social cost of migration</strong>. LGUs are now mandated to maintain an OFW Help Desk under
          RA 8042.
        </p>
        <p>
          For <strong>Left‑Behind Families (LBFs)</strong>, the LGU organizes OFW Family Circles (OFCs) — support
          groups where spouses and caregivers can discuss parenting, mental health, and shared challenges.
        </p>
        <p>
          In crisis situations (e.g., distressed or broken‑contract OFWs abroad), the LGU acts as a local link to <strong>OWWA</strong>, helping families process repatriation requests or insurance claims without having to
          travel to the regional center.
        </p>
        <p>
          Many LGUs also coordinate <strong>financial literacy</strong> activities with banks and partners, guiding
          families on how to channel remittances into productive investments such as micro‑enterprises, livelihood
          projects, or small family businesses.
        </p>
      </div>
    </ServiceBootstrapLayout>
  );
}
