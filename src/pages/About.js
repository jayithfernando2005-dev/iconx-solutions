import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/effect-cards";
import "swiper/css/effect-coverflow";
import "./About.css";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import iconxOuter from "../images/Storecard1.jpeg";
import iconxInner1 from "../images/Storecard2.jpeg";
import iconxInner2 from "../images/Storecard3.jpeg";
import iconxInner3 from "../images/Storecard4.jpeg";
import iconxInner4 from "../images/Storecard5.jpeg";
import Apple from "../images/apple.jpeg";
import aboutVideo from "../assets/Reveal.mp4";

const TESTIMONIALS = [
  {
    name: "Premium In-Store Experience",
    role: "IconX Showroom",
    img: iconxInner1,
  },
  {
    name: "Curated Apple Collection",
    role: "IconX Showroom",
    img: iconxInner2,
  },
  {
    name: "Modern Shopping Space",
    role: "IconX Showroom",
    img: iconxInner3,
  },
  {
    name: "Comfortable Experience",
    role: "IconX Showroom",
    img: iconxInner4,
  },
  {
    name: "Apple Accessories Zone",
    role: "IconX Showroom",
    img: iconxOuter,
  },
];

const FadeUp = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 60, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{
      duration: 0.85,
      delay,
      ease: [0.22, 1, 0.36, 1],
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const About = () => {
  return (
    <div className="about-page">
      <Header />

      <section className="contact-cta-section full-hero">
        <motion.div
          className="contact-cta-inner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img src={Apple} alt="Google Pixel Banner" className="hero-image" />
          <div className="hero-overlay-light" />

          <div className="trade-hero-text-a">
            <FadeUp delay={0.15}>
              <h1 className="hero-title-b">
                Empowering Your World Through Innovation
              </h1>
            </FadeUp>

            <FadeUp delay={0.25}>
              <p className="hero-subtitle-b">
                Discover premium devices at IconX and transform the way you
                connect work and live with powerful technology built for your
                everyday experience.
              </p>
            </FadeUp>

            <FadeUp delay={0.35}>
              <div className="stats-banner">
                <div className="stats-banner-item">
                  <div className="stats-banner-number">
                    5000<span>+</span>
                  </div>
                  <div className="stats-banner-label">Trusted Customers</div>
                </div>

                <div className="stats-banner-divider"></div>

                <div className="stats-banner-item">
                  <div className="stats-banner-number">
                    6<span>+</span>
                  </div>
                  <div className="stats-banner-label">Years Innovation</div>
                </div>

                <div className="stats-banner-divider"></div>

                <div className="stats-banner-item">
                  <div className="stats-banner-number">
                    100<span>%</span>
                  </div>
                  <div className="stats-banner-label">Genuine Products</div>
                </div>
              </div>
            </FadeUp>
          </div>
        </motion.div>
      </section>

      <section className="featured-section">
        <div className="featured-container">
          <FadeUp delay={0.1}>
            <h2 className="featured-title">ABOUT US</h2>
          </FadeUp>
        </div>
      </section>

      <section className="about-story-section">
        <div className="about-story-container">
          <div className="about-story-grid">
            <FadeUp delay={0.15} className="about-story-image-wrap">
              <video
                className="about-story-video"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src={aboutVideo} type="video/mp4" />
              </video>
            </FadeUp>

            <div className="about-story-content">
              <FadeUp delay={0.2}>
                <h2 className="gradient-text">Elevate Your Mobile Experience</h2>
              </FadeUp>

              <FadeUp delay={0.28}>
                <p>
                  At IconX Mobile Store, we bring together the latest smartphones,
                  tablets, audio gear, and essential accessories in one modern
                  shopping experience. Our goal is simple to help customers
                  discover premium technology with confidence, convenience, and
                  trusted support.
                </p>
              </FadeUp>

              <FadeUp delay={0.36}>
                <p>
                  From flagship Apple devices to everyday mobile essentials,
                  every product at IconX is carefully selected to deliver
                  quality, style, and reliability. Whether you are upgrading
                  your phone, exploring new accessories, or looking for expert
                  recommendations, our team is ready to guide you every step of
                  the way.
                </p>
              </FadeUp>

              <FadeUp delay={0.44}>
                <p>
                  We believe buying technology should feel exciting, easy, and
                  personal. That is why IconX focuses on genuine products,
                  customer-first service, and a showroom experience designed to
                  make every visit memorable.
                </p>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="featured-container">
          <FadeUp delay={0.1}>
            <h2 className="featured-title-why">WHY CHOOSE US</h2>
          </FadeUp>
        </div>
      </section>

      <div className="why-choose-grid">
        <FadeUp delay={0.12}>
          <div className="why-choose-card">
            <div className="why-choose-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3L4 12H10V21L20 10H14L12 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Instant Device Setup</h3>
            <p>
              Walk out with your device fully ready. We transfer your data,
              install apps, and optimize everything for you.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="why-choose-card">
            <div className="why-choose-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3L5 7V12C5 16.5 8 20 12 21C16 20 19 16.5 19 12V7L12 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>100% Authentic Products</h3>
            <p>
              Every product is genuine with warranty assurance, giving you
              complete confidence in your purchase.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.28}>
          <div className="why-choose-card">
            <div className="why-choose-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="6"
                  width="18"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M3 10H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3>Flexible Payment Options</h3>
            <p>
              Enjoy easy installment plans, trade-ins, and exclusive deals
              designed to make premium devices more affordable.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.36}>
          <div className="why-choose-card">
            <div className="why-choose-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Fast & Reliable Service</h3>
            <p>
              From quick purchases to same-day delivery, we focus on speed
              without compromising quality or experience.
            </p>
          </div>
        </FadeUp>
      </div>

      <section className="testimonials-section">
        <div className="container testimonials-container">
          <FadeUp delay={0.2}>
            <div className="section-label-abc">Our Store</div>
            <h2 className="gradient-text">
              Showroom <span className="accent">Experience</span>
            </h2>
          </FadeUp>

          <FadeUp delay={0.3}>
            <Swiper
              modules={[Autoplay, Pagination]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              spaceBetween={24}
              breakpoints={{
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1100: { slidesPerView: 3 },
              }}
              className="testimonials-swiper"
            >
              {TESTIMONIALS.map((t, i) => (
                <SwiperSlide key={i}>
                  <div className="testimonial-card image-only-card">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="testimonial-image"
                      loading="lazy"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </FadeUp>
        </div>
      </section>

      <section className="testimonials-section-a">
        <div className="container testimonials-container">
          <FadeUp delay={0.2}>
            <div className="section-label-ab">See It In Action</div>
            <h2 className="gradient-text">
              Experience Innovation<span className="accent"> Up Close</span>
            </h2>
          </FadeUp>
          <div className="about-story-content-a">     
              <FadeUp delay={0.38}>
                <p>
                  From unboxing to setup, our team ensures you get the most out
                  of every Apple product. Watch how we deliver the premium IconX
                  experience.
                </p>
              </FadeUp>        
              <div className="video-showcase-features">
                {[
                  "Premium unboxing experience",
                  "Expert device setup",
                  "Data transfer assistance",
                  "Same-day availability",
                ].map((f, i) => (
                  <FadeUp key={i} delay={0.46 + i * 0.08}>
                    <div className="showcase-feature">
                      <span className="feature-check">✓</span> {f}
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;