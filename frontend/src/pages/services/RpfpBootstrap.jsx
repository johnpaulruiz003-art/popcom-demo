import React, { useState } from 'react';
import { ServiceBootstrapLayout } from './ServiceBootstrapLayout.jsx';
import { tabButtonId, tabPanelId } from './ServiceDetailLayout.jsx';
import imgResponsibleParenthoodHome from '../../content/Home Images/ResponsibleParenthoodHomePage.jpg';

const RPFP_SUBSERVICES = [
  { label: 'Family Planning', value: 'family-planning' },
  { label: 'BIBA', value: 'biba' },
  { label: 'Parent-Teen Talk', value: 'parent-teen-talk' },
  { label: 'U4U Teen Trail', value: 'u4u-teen-trail' },
];

const TABS_ID = 'rpfp';

export function RpfpBootstrap() {
  const [active, setActive] = useState('family-planning');
  return (
    <ServiceBootstrapLayout
      title="Responsible Parenthood and Family Development (RPFP)"
      imageUrl={imgResponsibleParenthoodHome}
      imageAlt="Couples and parents taking part in a Responsible Parenthood and Family Development session"
      intro={
        <p>
          <b>Responsible Parenthood and Family Development (RPFP)</b> supports couples, parents, and young people in understanding responsible parenthood, planning their families, and making informed decisions about their health and well-being.
        </p>
      }
      tabs={{
        id: TABS_ID,
        items: RPFP_SUBSERVICES,
        activeId: active,
        onChange: setActive,
      }}
    >

      {(
        <div
          role="tabpanel"
          id={tabPanelId(TABS_ID, 'family-planning')}
          aria-labelledby={tabButtonId(TABS_ID, 'family-planning')}
          tabIndex={0}
          className="sf-tabs__panel"
          hidden={active !== 'family-planning'}
        >
          <h2>Family Planning</h2>

          <div className="sf-card">
            <h3>Overview</h3>
            <p>
              Responsible Parenthood & Family Planning (RPFP) is a major component of the Philippine government’s population
              management and health initiatives. It is led by the Commission on Population and Development (CPD/POPCOM) in
              coordination with other agencies and local government units. The RPFP program deals with sexual and
              reproductive health, fertility concerns, and family planning, and is designed to help couples and individuals
              make informed decisions about their reproductive lives.
            </p>
          </div>

          <div className="sf-card-pair">
            <div className="sf-card">
              <h3>Purpose and Importance</h3>
              <ul>
                <li>Enable couples to achieve desired timing, spacing, and number of children based on their capacity.</li>
                <li>Improve maternal, neonatal, child health, and nutrition (MNCHN).</li>
                <li>Reduce unwanted and high-risk pregnancies that contribute to poor health outcomes.</li>
                <li>Promote maternal/child health, empower women, improve financial stability, and control population growth.</li>
                <li> Helps families build financial security by limiting family size to what they can afford to support, thereby alleviating poverty.</li>
              </ul>
            </div>
            <div className="sf-card">
              <h3>Core Strategies</h3>
              <ul>
                <li>Accessible and culturally acceptable information on natural and modern family planning methods.</li>
                <li>Community-based outreach through health workers, barangay volunteers, and NGO partnerships.</li>
                <li>Demand generation to improve health-seeking behavior and uptake of services.</li>
                <li>Training of service providers to ensure quality counseling and client support.</li>
                <li>Public advocacy and communication campaigns to promote responsible parenthood.</li>
              </ul>
            </div>
          </div>

          <div className="sf-card">
            <h3>What “Family Planning” Means</h3>
            <p>
              Family planning involves education, counseling, and provision of services so that couples/individuals can
              choose when and how many children to have. It includes:
            </p>
            <ul>
              <li>Natural family planning methods</li>
              <li>Modern contraceptive methods (e.g., condoms, pills, implants, IUDs — where available at health centers)</li>
              <li>Information on reproductive health rights and responsibilities</li>
              <li>Counseling on healthy timing and spacing of pregnancies to reduce health risks</li>
            </ul>
            <hr />
            <p className="sf-muted">
              These services aim to promote informed choice, responsible decision-making, and improved health outcomes for
              families.
            </p>
          </div>

          <div className="sf-card">
            <h3>How to request counseling</h3>
            <p>
              Counseling requests for RPFP (including family planning, BIBA, Parent-Teen Talk, and U4U Teen Trail) can
              now be initiated from the main Services page alongside Pre‑Marriage Orientation and Usapan-Series.
            </p>
            <p className="sf-muted">
              Use the "Book RPFP Counseling" button on the Services page to send your details to the Municipal
              Population Office. A staff member will contact you to confirm your schedule.
            </p>
          </div>
        </div>
      )}

      {(
        <div
          role="tabpanel"
          id={tabPanelId(TABS_ID, 'biba')}
          aria-labelledby={tabButtonId(TABS_ID, 'biba')}
          tabIndex={0}
          className="sf-tabs__panel"
          hidden={active !== 'biba'}
        >
          <h2>BIBA Program</h2>
          <p className="sf-muted">Batang Ina, Batang Ama (Young Mother, Young Father)</p>

          <div className="sf-card">
            <h3>Overview</h3>
            <p>
              The BIBA Program (short for “Batang Ina, Batang Ama”) is an initiative implemented in various parts of the
              Philippines to address adolescent pregnancy and support young parents. It addresses the physical, emotional,
              social, and health-related aspects of early parenthood.
            </p>
          </div>

          <div className="sf-card-pair">
            <div className="sf-card">
              <h3>Origins and Purpose</h3>
              <ul>
                <li>Implemented in local government areas (e.g., Brooke’s Point, Palawan, and Manila).</li>
                <li>Provides education and support to teenage mothers and fathers.</li>
                <li>
                  Equips young parents with knowledge on pregnancy care, self-care, parenting responsibilities, and
                  prevention of repeat pregnancies.
                </li>
              </ul>
            </div>
            <div className="sf-card">
              <h3>Key Activities</h3>
              <ul>
                <li>Usapang BIBA sessions/fora: guided discussions with peer sharing and practical guidance.</li>
                <li>Counseling on pregnancy and childbirth: prenatal care, danger signs, and healthy lifestyles.</li>
                <li>
                  Parenting guidance: child care, breastfeeding, immunization, scheduling check-ups, and responsible
                  upbringing.
                </li>
              </ul>
            </div>
          </div>

          <div className="sf-card">
            <h3>Impact</h3>
            <p>
              BIBA helps reduce stigma for young parents, empowers them with health and life skills, and encourages
              responsible family-making in youth — critical to reducing the high incidence of teen pregnancy in many
              communities.
            </p>
          </div>
        </div>
      )}

      {(
        <div
          role="tabpanel"
          id={tabPanelId(TABS_ID, 'parent-teen-talk')}
          aria-labelledby={tabButtonId(TABS_ID, 'parent-teen-talk')}
          tabIndex={0}
          className="sf-tabs__panel"
          hidden={active !== 'parent-teen-talk'}
        >
          <h2>Parent-Teen Talk</h2>
          <p className="sf-muted">Building trust and healthy dialogue between parents and adolescents</p>

          <div className="sf-card">
            <h3>Why It Matters</h3>
            <p>
              Parents are often the primary source of guidance for adolescent children, but many feel uncomfortable talking
              about sexuality and reproductive health. This communication gap can lead teens to seek information from peers
              or unreliable sources, increasing the risk of risky behavior, including early sexual activity and teenage
              pregnancy.
            </p>
          </div>

          <div className="sf-card-pair">
            <div className="sf-card">
              <h3>Core Goals</h3>
              <ul>
                <li>Equip parents with effective communication skills on sensitive topics.</li>
                <li>Encourage mutual listening and understanding between parents and teens.</li>
                <li>Build trust at home, creating safer spaces for discussions and decision-making.</li>
              </ul>
            </div>
            <div className="sf-card">
              <h3>How It Works</h3>
              <ul>
                <li>Interactive discussions, group activities, and role-plays to ease sensitive conversations.</li>
                <li>Age-appropriate information on physical and emotional changes in teens.</li>
                <li>Tools and strategies for parents to maintain open communication beyond the sessions.</li>
              </ul>
            </div>
          </div>

          <div className="sf-card">
            <h3>Benefits</h3>
            <ul>
              <li>Helps families break down communication barriers about sexuality, peer pressure, and risk behaviors.</li>
              <li>Encourages adolescents to make informed and responsible choices with parental support.</li>
            </ul>
          </div>
        </div>
      )}

      {(
        <div
          role="tabpanel"
          id={tabPanelId(TABS_ID, 'u4u-teen-trail')}
          aria-labelledby={tabButtonId(TABS_ID, 'u4u-teen-trail')}
          tabIndex={0}
          className="sf-tabs__panel"
          hidden={active !== 'u4u-teen-trail'}
        >
          <h2>U4U Teen Trail</h2>
          <p className="sf-muted">You-for-You (U4U) youth-oriented health education</p>

          <div className="sf-card">
            <h3>What U4U Stands For</h3>
            <p>
              U4U means You-for-You — emphasizing peer-led learning and youth empowerment. It aims to reach Filipino
              adolescents and young people with accurate, culturally-relevant information about sexual and reproductive
              health and rights (SRHR).
            </p>
          </div>

          <div className="sf-card-pair">
            <div className="sf-card">
              <h3>Teen Trail Explained</h3>
              <p>
                U4U Teen Trail is an interactive experiential learning journey held in schools and communities. It is
                facilitated by trained teen peer educators and includes:
              </p>
              <ul>
                <li>Interactive exhibits about puberty, self-image, relationships, and risky behaviors.</li>
                <li>Games, songs, and workshops that make learning engaging and relevant.</li>
                <li>
                  Discussion stations on delayed sexual debut, consent, prevention of teen pregnancy/STIs, and healthy
                  decision-making.
                </li>
              </ul>
            </div>
            <div className="sf-card">
              <h3>Why It’s Effective</h3>
              <ul>
                <li>Uses peer-to-peer learning, making teens more receptive to youth-delivered messages.</li>
                <li>
                  Reduces stigma and encourages open dialogue on taboo topics, promoting self-respect and responsible
                  behavior.
                </li>
                <li>Recognized for broad reach and impact in empowering young people with essential life skills.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </ServiceBootstrapLayout>
  );
}
