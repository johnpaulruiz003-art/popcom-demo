import React from 'react';
import { ServiceBootstrapLayout } from './ServiceBootstrapLayout.jsx';
import imgDemographicHome from '../../content/Home Images/DemographicHomePage.jpg';

export function PopulationProfiling() {
  return (
    <ServiceBootstrapLayout
      title="Demographic Data Collection & Population Profiling"
      imageUrl={imgDemographicHome}
      imageAlt="Barangay population worker interviewing a family during a local demographic survey"
      intro={
        <p>
          <b>Demographic Data Collection and Population Profiling</b>  is the "raw" gathering of facts. Unlike a national census that happens every few years, the local Population Office often conducts more frequent, localized surveys to keep their records "live."
          Population workers (often volunteer Barangay Population Workers) go house-to-house to interview families.
          The data is then compiled and used to create population profiles, which are used to plan and implement programs and services.
        </p>
      }
    >
      <div className="sf-card">
        <h2>Key Data Points:</h2>
        <ul>
          <li><b>Family Size & Composition:</b> Number of children, seniors, and working adults.</li>
          <li><b>Health Status:</b> Use of family planning, immunization records, and nutrition levels (to identify malnourished children).</li>
          <li><b>Socio-Economic Info:</b> Income levels, occupation, and educational attainment.</li>
          <li><b>Housing & Sanitation:</b> Type of housing material, access to clean water, and presence of sanitary toilets.</li>
        </ul>
      </div>

      <p>
        <b>Population Profiling</b>  happens once the data is collected, it is then "profiled." Profiling means turning raw numbers into a story or a map that identifies the community's needs.
        A comprehensive report for each barangay that summarizes who lives there. For example, it might show that "Barangay X has a high number of pregnant teenagers" or "Barangay Y has a high percentage of unemployed fathers."
      </p>

      <div className="sf-card">
        <h2>Targeting Vulnerable Groups:</h2>
        <ul>
          <li><b>Indigent Families:</b> Those living below the poverty line who qualify for government subsidies.</li>
          <li><b>Out-of-School Youth (OSY):</b> Identifying teens who need vocational training.</li>
          <li><b>Solo Parents:</b> Ensuring they are registered to receive legal benefits.</li>
        </ul>
      </div>
    </ServiceBootstrapLayout>
  );
}
