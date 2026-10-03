import React from 'react';
import { ServiceBootstrapLayout } from './ServiceBootstrapLayout.jsx';
import imgPopulationAwarenessHome from '../../content/Home Images/PopulationAwarenessHomePage.jpg';

export function Iec() {
  return (
    <ServiceBootstrapLayout
      title="Population Awareness & IEC Activities"
      imageUrl={imgPopulationAwarenessHome}
      imageAlt="Community information and education campaign on population awareness"
      intro={
        <p>
          <b>Population Awareness and Information, Education, and Communication Activities (IEC)</b> is a service that focuses on making complex population issues easy for the general public to understand. The goal is to create a "Population-Aware" community that understands how family size and migration affect their quality of life.
          We conduct mobile "rekorida" (public announcements) and community assemblies to discuss topics like the Responsible Parenthood and Reproductive Health Act (RPRH Law) and gender equality.
          Our office leads the local celebration of significant milestones such as <b>World Population Day (July 11)</b> and <b>Family Planning Month (August)</b>, using these events to highlight the success of local families and promote government services.
        </p>
      }
    >
      <h2>Development and Distribution of IEC Materials</h2>
      <p>
        To ensure that information sticks, our office produces localized and easy-to-digest educational tools. We translate national policies into the local dialect and visual formats that every citizen can understand.
      </p>

      <div className="sf-card">
        <h3>Printed Resources</h3>
        <p>
          We design and distribute brochures, posters, and flyers covering topics such as modern family planning methods, the dangers of teenage pregnancy, and the roles of men in the family (KATROPA).
        </p>
        <h3>Audio-Visual Presentations</h3>
        <p>
          We produce and screen short educational videos in barangay health centers and waiting areas to educate clients while they wait for services.
        </p>
        <h3>Visual Aids for Workers</h3>
        <p>
          We provide specialized "Flipcharts" and kits to Barangay Population Workers, enabling them to conduct effective house-to-house counseling and small-group discussions.
        </p>
      </div>

      <h2>Peer Education and Volunteer Mobilization</h2>
      <p>
        Awareness is most effective when it comes from a trusted peer. We train local leaders and youth to become "Advocates" within their own circles.
      </p>

      <div className="sf-card">
        <h3>Peer Facilitator Training</h3>
        <p>
          We identify and train student leaders to become "Peer Educators" who can provide a safe space for their classmates to ask questions about reproductive health.
        </p>
        <h3>Barangay Population Volunteer Training</h3>
        <p>
          We provide continuous education to our community volunteers, ensuring they are updated on the latest health protocols and communication techniques for their house-to-house visits.
        </p>
      </div>
    </ServiceBootstrapLayout>
  );
}
