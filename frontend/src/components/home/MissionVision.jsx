import React from 'react';

export default function MissionVision() {
  return (
    <section className="sf-section sf-section--tint" aria-labelledby="sf-mv-title">
      <div className="sf-section__inner">
        <div className="sf-section__head">
          <div>
            <h2 className="sf-section__title" id="sf-mv-title">
              Mission, Vision &amp; Core Beliefs
            </h2>
            <hr className="sf-section__rule" />
          </div>
        </div>

        <div className="sf-pillars">
          <article className="sf-pillar">
            <h3 className="sf-pillar__title">Mission</h3>
            <p className="sf-pillar__text">
              To strengthen institutional capacities to formulate, coordinate, and implement
              integrated population and development strategies, policies, and programs, grounded in
              socioeconomic and demographic data, information, and knowledge.
            </p>
          </article>

          <article className="sf-pillar">
            <h3 className="sf-pillar__title">Vision</h3>
            <p className="sf-pillar__text">
              To be the lead agency advancing the country&apos;s population and development policies
              and programs, increasing every Filipino&apos;s share in and opportunity for
              socioeconomic progress.
            </p>
          </article>

          <article className="sf-pillar">
            <h3 className="sf-pillar__title">Core Beliefs</h3>
            <ul className="sf-pillar__list">
              <li><strong>Excellence</strong> &mdash; To be the best.</li>
              <li><strong>Integrity</strong> &mdash; To be trusted.</li>
              <li><strong>Adaptiveness</strong> &mdash; To stay relevant.</li>
              <li><strong>Inclusivity</strong> &mdash; To be fair.</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
