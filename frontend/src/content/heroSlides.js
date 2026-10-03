// Hero image carousel slides for the landing page.
//
// Every slide is { src, alt, caption }.
//   src     - the imported image (photos live in "content/Home Images").
//   alt     - describes the photo for screen readers.
//   caption - short line shown under the image + announced by the live region.
//
// All eight photos from "content/Home Images" are used, in service-menu order,
// with the original hero photo (community events) kept first as the default.
//
// To add or replace photos: import the image at the top of this file, then add
// (or edit) an entry in the array below. Keep the first entry as the default.
//
// NOTE: If this array has only ONE slide, the hero carousel hides the arrows
// and dots automatically and renders like a plain static figure.

import imgCommunityEventsHome from './Home Images/CommunityEventsHomePage.jpg';
import imgPMOHome from './Home Images/PMOHomePage.jpg';
import imgUsapanHome from './Home Images/UsapanSeriesHomePage.jpg';
import imgResponsibleParenthoodHome from './Home Images/ResponsibleParenthoodHomePage.jpg';
import imgAdolescentHome from './Home Images/AdolescentHomePage.jpg';
import imgPopulationAwarenessHome from './Home Images/PopulationAwarenessHomePage.jpg';
import imgDemographicHome from './Home Images/DemographicHomePage.jpg';
import imgSupportHome from './Home Images/SupportHomePage.jpg';

const heroSlides = [
  {
    src: imgCommunityEventsHome,
    alt: 'Population Office staff and health workers serving residents at an outdoor community event, with booths for free check-ups and child wellness services',
    caption: 'Support during community events',
  },
  {
    src: imgPMOHome,
    alt: 'A couple holding hands while meeting a Population Office counselor during a pre-marriage orientation session',
    caption: 'Pre-marriage orientation and counseling.',
  },
  {
    src: imgUsapanHome,
    alt: 'A mother with her sleeping child consulting a Population Office staff member at a Usapan Series table',
    caption: 'Usapan Series counseling and consultation.',
  },
  {
    src: imgResponsibleParenthoodHome,
    alt: 'Couples with their babies attending a responsible parenthood and family development session in a seminar room',
    caption: 'Responsible parenthood and family development.',
  },
  {
    src: imgAdolescentHome,
    alt: 'A facilitator speaking to students seated at tables during an adolescent health and development program session',
    caption: 'Adolescent health and development program sessions.',
  },
  {
    src: imgPopulationAwarenessHome,
    alt: 'A Population Office speaker on a small stage addressing a crowd at an outdoor population awareness and information activity',
    caption: 'Population awareness and IEC activities.',
  },
  {
    src: imgDemographicHome,
    alt: 'Population Office field workers interviewing residents during a demographic data collection and population profiling visit',
    caption: 'Demographic data collection and population profiling.',
  },
  {
    src: imgSupportHome,
    alt: 'Population Office staff assisting residents at a financial aid and livelihood support desk',
    caption: 'Financial aid and livelihood support.',
  },
];

export default heroSlides;
