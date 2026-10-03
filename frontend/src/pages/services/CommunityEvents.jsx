import React from 'react';
import { ServiceBootstrapLayout } from './ServiceBootstrapLayout.jsx';
import imgCommunityEventsHome from '../../content/Home Images/CommunityEventsHomePage.jpg';

export function CommunityEvents() {
  return (
    <ServiceBootstrapLayout
      title="Support During Community Events"
      imageUrl={imgCommunityEventsHome}
      imageAlt="LGU health caravan bringing Population Office services to a remote barangay"
      intro={
        <p>
          Participation in LGU caravans and mobile population education activities to bring services to remote barangays. This involves joint outreach activities conducted with agencies such as the Philippine Red Cross, local youth organizations, and the Rural Health Unit (RHU) of San Fabian.
        </p>
      }
    >
      <h2>Health Caravans and Outreach</h2>
      <p>
        Health caravans may include basic health consultations, counseling on responsible parenthood and adolescent health, and information drives. While San Fabian is a key partner, collaboration is not limited to the Municipality of San Fabian, Pangasinan and may extend to provincial or national agencies as needed.
      </p>
    </ServiceBootstrapLayout>
  );
}
