import React from 'react';
import { ServiceBootstrapLayout } from './ServiceBootstrapLayout.jsx';
import imgAdolescentHome from '../../content/Home Images/AdolescentHomePage.jpg';

export function Ahdp() {
  const videoUrl = 'https://www.youtube.com/embed/uFBxi76S6dw';

  return (
    <ServiceBootstrapLayout
      title="Adolescent Health and Development Program (AHDP)"
      imageUrl={imgAdolescentHome}
      imageAlt="Young participants taking part in an Adolescent Health and Development Program session"
      intro={
        <p>
          The <b>Adolescent Health and Development Program (AHDP)</b> is the Population Office’s primary response to the complex challenges facing today’s youth. Recognizing that adolescence is a critical period of physical, emotional, and social transition, this program moves beyond traditional healthcare to provide a holistic support system. Our mission is to ensure that every adolescent in our community is well-informed, empowered, and healthy. We focus on reducing the incidence of teenage pregnancy, preventing the spread of STIs and HIV/AIDS, and mitigating risky behaviors such as substance abuse and early sexual involvement. By investing in the youth today, we are securing a more sustainable and productive population for the future.
        </p>
      }
      video={{ src: videoUrl, title: 'Adolescent Health and Development Program (AHDP)' }}
    >

      <h2>Key Service Pillars</h2>

      <div className="sf-card">
        <h3>Peer Education and Youth Mobilization</h3>
        <p>
          One of the most effective ways to reach a teenager is through their friends. Our program heavily emphasizes "Peer-to-Peer" advocacy.
        </p>
        <div className="sf-subitems">
          <div className="sf-subitem">
            <h4>Peer Facilitation Training</h4>
            <p>
              We identify and train student leaders and community youth to become certified Peer Educators. They are equipped to facilitate "U4U" and "Teen Trail" workshops—interactive sessions that use games and dialogue to teach reproductive health, self-esteem, and decision-making.
            </p>
          </div>
          <div className="sf-subitem">
            <h4>Youth Leadership</h4>
            <p>
              By empowering young advocates, we ensure that accurate health information is shared naturally within social circles, correcting misconceptions and encouraging positive health-seeking behaviors among their peers.
            </p>
          </div>
        </div>
      </div>

      <div className="sf-card">
        <h3>Parent and Teen Talk and Family Support</h3>
        <p>
          Healthy adolescent development requires a supportive home environment. Many of our activities are designed to bridge the communication gap between generations.
        </p>
        <div className="sf-subitems">
          <div className="sf-subitem">
            <h4>Parenting the Adolescent (PAM)</h4>
            <p>
              We facilitate workshops that teach parents how to talk to their children about sensitive topics like sexuality and relationships. These sessions aim to move from "lecturing" to "listening," fostering trust and preventing domestic conflicts.
            </p>
          </div>
          <div className="sf-subitem">
            <h4>Service Delivery Network (SDN)</h4>
            <p>
              We maintain a strong referral system that links schools, barangay centers, and hospitals. This ensures that if a teen is in crisis—whether due to pregnancy, abuse, or mental health issues—there is a clear, fast, and supportive path to the professional help they need.
            </p>
          </div>
        </div>
      </div>
    </ServiceBootstrapLayout>
  );
}

