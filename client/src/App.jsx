import { useState } from "react";
import "./App.css";

// ============================================================
// 🖼️  IMAGE PATHS — swap in your own files from src/assets/
// ============================================================
const IMAGES = {
  heroIllustration:       "/src/assets/hero-illustration.png",   // megaphone SVG/PNG
  speedRoundIllustration: "/src/assets/speed-round.svg",
  quizTypeIllustration:   "/src/assets/quiz-type.svg",
  flashcardIllustration:  "/src/assets/flashcard.svg",
  progressionIllustration:"/src/assets/progression.svg",
  ctaMascot:              "/src/assets/cta-mascot.png",          // smiley star mascot
  teamMember1:            "/src/assets/team-john.png",
  teamMember2:            "/src/assets/team-jane.png",
  teamMember3:            "/src/assets/team-michael.png",
  teamMember4:            "/src/assets/team-emily.png",
  teamMember5:            "/src/assets/team-brian.png",
  teamMember6:            "/src/assets/team-sarah.png",
};
// ============================================================

const HOW_TO_STEPS = [
  {
    num: "01",
    title: "Consultation",
    body: "During the initial consultation, we will discuss your business goals and objectives, target audience, and current marketing efforts. This will allow us to understand your needs and tailor our services to best fit your requirements.",
  },
  { num: "02", title: "Research and Strategy Development", body: "" },
  { num: "03", title: "Implementation", body: "" },
  { num: "04", title: "Monitoring and Optimization", body: "" },
  { num: "05", title: "Reporting and Communication", body: "" },
  { num: "06", title: "Continual Improvement", body: "" },
];

const TEAM = [
  { img: IMAGES.teamMember1, name: "John Smith",     role: "CEO and Founder",          desc: "10+ years of experience in digital marketing. Expertise in SEO, PPC, and content strategy" },
  { img: IMAGES.teamMember2, name: "Jane Doe",       role: "Director of Operations",   desc: "7+ years of experience in project management and team leadership. Strong organizational and communication skills" },
  { img: IMAGES.teamMember3, name: "Michael Brown",  role: "Senior SEO Specialist",    desc: "5+ years of experience in SEO and content creation. Proficient in keyword research and on-page optimization" },
  { img: IMAGES.teamMember4, name: "Emily Johnson",  role: "PPC Manager",              desc: "3+ years of experience in paid search advertising. Skilled in campaign management and performance analysis" },
  { img: IMAGES.teamMember5, name: "Brian Williams", role: "Social Media Specialist",  desc: "4+ years of experience in social media marketing. Proficient in creating and scheduling content, analyzing metrics, and building engagement" },
  { img: IMAGES.teamMember6, name: "Sarah Kim",      role: "Content Creator",          desc: "2+ years of experience in writing and editing. Skilled in creating compelling, SEO-optimized content for various industries" },
];

export default function App() {
  const [openStep, setOpenStep] = useState(0);

  return (
    <div className="page">
      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">✕</span> Reviewly
        </div>
        <ul className="nav-links">
          <li><a href="#how-to">How to</a></li>
          <li><a href="#team">Team</a></li>
          <li><a href="#about">About us</a></li>
        </ul>
        <div className="nav-actions">
          <button className="btn-ghost">Sign up</button>
          <button className="btn-dark">Log in</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-text">
          <h1>Reviewly the Friendly AI Powered Reviewer</h1>
          <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the</p>
          <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the</p>
          <button className="btn-dark hero-cta">Start an Exam</button>
        </div>
        <div className="hero-image">
          <img src={IMAGES.heroIllustration} alt="Hero illustration" />
        </div>
      </section>

      {/* ── LETS GO ── */}
      <section className="lets-go">
        <div className="lets-go-header">
          <span className="section-tag">Let's Go!</span>
          <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy</p>
        </div>

        <div className="features-grid">
          <div className="feature-card dark">
            <div className="feature-card-content">
              <h3>Speed Round<br />Examination</h3>
              <a href="#" className="learn-more">▶ Learn more</a>
            </div>
            <div className="feature-card-img">
              <img src={IMAGES.speedRoundIllustration} alt="Speed Round" />
            </div>
          </div>

          <div className="feature-card light">
            <div className="feature-card-content">
              <h3>Quiz Type<br />Examination</h3>
              <a href="#" className="learn-more">▶ Learn more</a>
            </div>
            <div className="feature-card-img">
              <img src={IMAGES.quizTypeIllustration} alt="Quiz Type" />
            </div>
          </div>

          <div className="feature-card dark">
            <div className="feature-card-content">
              <h3>Flashcard<br />Game</h3>
              <a href="#" className="learn-more">▶ Learn more</a>
            </div>
            <div className="feature-card-img">
              <img src={IMAGES.flashcardIllustration} alt="Flashcard Game" />
            </div>
          </div>

          <div className="feature-card light">
            <div className="feature-card-content">
              <h3>Progression<br />Tracking</h3>
              <a href="#" className="learn-more">▶ Learn more</a>
            </div>
            <div className="feature-card-img">
              <img src={IMAGES.progressionIllustration} alt="Progression Tracking" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-banner">
        <div className="cta-text">
          <h2>Let's make things happen</h2>
          <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since</p>
          <button className="btn-light">Start Now!</button>
        </div>
        <div className="cta-mascot">
          <img src={IMAGES.ctaMascot} alt="Mascot" />
        </div>
      </section>

      {/* ── HOW TO ── */}
      <section className="how-to" id="how-to">
        <div className="how-to-header">
          <span className="section-tag">How to use:</span>
          <p>Step-by-Step Guide to Achieving<br />Your Dream Score</p>
        </div>

        <div className="accordion">
          {HOW_TO_STEPS.map((step, i) => (
            <div
              key={i}
              className={`accordion-item ${openStep === i ? "open" : ""}`}
              onClick={() => setOpenStep(openStep === i ? -1 : i)}
            >
              <div className="accordion-header">
                <div className="accordion-left">
                  <span className="step-num">{step.num}</span>
                  <span className="step-title">{step.title}</span>
                </div>
                <span className="accordion-icon">{openStep === i ? "−" : "+"}</span>
              </div>
              {openStep === i && step.body && (
                <div className="accordion-body">
                  <p>{step.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="team" id="team">
        <div className="team-header">
          <span className="section-tag">Team</span>
          <p>Meet the skilled and experienced team behind our<br />successful digital marketing strategies</p>
        </div>

        <div className="team-grid">
          {TEAM.map((member, i) => (
            <div className="team-card" key={i}>
              <div className="team-card-top">
                <img src={member.img} alt={member.name} className="team-photo" />
                <a href="#" className="linkedin-icon" aria-label="LinkedIn">in</a>
              </div>
              <div className="team-card-info">
                <h4>{member.name}</h4>
                <span className="team-role">{member.role}</span>
              </div>
              <p className="team-desc">{member.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT US ── */}
      <section className="about" id="about">
        <div className="about-inner">
          <div className="about-label">
            <span className="section-tag white">About us</span>
            <p>How it started</p>
          </div>
          <div className="about-quote">
            <blockquote>
              "We have been working with Positivus for the past year and have seen a significant increase in website traffic and leads as a result of their efforts. The team is professional, responsive, and truly cares about the success of our business. We highly recommend Positivus to any company looking to grow their online presence."
            </blockquote>
            <div className="about-footer">
              <a href="#" className="members-link">Members</a>
              <span className="group-tag">Group 4</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}