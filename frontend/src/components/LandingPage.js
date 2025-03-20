import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const history = useHistory();
  const [isVisible, setIsVisible] = useState(false);
  
  // References for sections that will fade in
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const aboutRef = useRef(null);
  
  useEffect(() => {
    setIsVisible(true);
    
    // Create intersection observer to detect when sections are visible
    const observerOptions = {
      root: null, // Use viewport as root
      rootMargin: '0px',
      threshold: 0.25 // Trigger when 25% of the element is visible
    };
    
    const handleIntersect = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
          // Once the animation is applied, we can stop observing this element
          observer.unobserve(entry.target);
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    // Observe all sections
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (pricingRef.current) observer.observe(pricingRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);
    
    return () => {
      // Clean up the observer when component unmounts
      observer.disconnect();
    };
  }, []);

  const handleSignUp = () => {
    history.push('/signup');
  };
  
  const handleLogin = () => {
    history.push('/login');
  };

  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-text">Sushi</span>
          <span className="logo-dot">.</span>
          <span className="logo-invoice">Invoice</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <button className="cta-button secondary" onClick={handleLogin}>Log In</button>
          <button className="cta-button" onClick={handleSignUp}>Sign Up</button>
        </div>
      </nav>

      <header className={`hero ${isVisible ? 'visible' : ''}`}>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-line">Premium Invoice</span>
            <span className="hero-title-line">Generation with</span>
            <span className="hero-title-accent">Precision</span>
          </h1>
          <p className="hero-subtitle">
            Slicing through paperwork like a master chef. 
            Generate beautiful invoices with the precision of sushi craftsmanship.
          </p>
          <div className="hero-cta">
            <button className="cta-button primary" onClick={() => history.push('#features')}>Learn More</button>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-image">
            <div className="sushi-roll"></div>
            <div className="sushi-plate"></div>
            <div className="invoice-paper"></div>
          </div>
        </div>
      </header>

      <section id="features" ref={featuresRef} className="features-section fade-in-section">
        <h2 className="section-title">Crafted to Perfection</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🍣</div>
            <h3>Premium Templates</h3>
            <p>Beautifully designed invoice templates that showcase professionalism.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔪</div>
            <h3>Precise Automation</h3>
            <p>Automate your invoicing with the precision of a sushi chef.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🍱</div>
            <h3>All-in-One Solution</h3>
            <p>From generation to payment tracking, everything in one elegant box.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🥢</div>
            <h3>Easy Integration</h3>
            <p>Connect seamlessly with your favorite accounting tools.</p>
          </div>
        </div>
      </section>

      <section id="pricing" ref={pricingRef} className="pricing-section fade-in-section">
        <h2 className="section-title">Select Your Roll</h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Maki</h3>
              <div className="price">$19<span>/month</span></div>
            </div>
            <ul className="pricing-features">
              <li>50 invoices per month</li>
              <li>5 templates</li>
              <li>Email support</li>
              <li>Basic reporting</li>
            </ul>
            <button className="cta-button" onClick={handleSignUp}>Get Started</button>
          </div>
          <div className="pricing-card featured">
            <div className="pricing-header">
              <span className="featured-tag">Most Popular</span>
              <h3>Nigiri</h3>
              <div className="price">$49<span>/month</span></div>
            </div>
            <ul className="pricing-features">
              <li>Unlimited invoices</li>
              <li>All templates</li>
              <li>Priority support</li>
              <li>Advanced reporting</li>
              <li>Client portal</li>
            </ul>
            <button className="cta-button primary" onClick={handleSignUp}>Get Started</button>
          </div>
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Omakase</h3>
              <div className="price">$99<span>/month</span></div>
            </div>
            <ul className="pricing-features">
              <li>Everything in Nigiri</li>
              <li>White-label solution</li>
              <li>API access</li>
              <li>Dedicated account manager</li>
              <li>Custom templates</li>
            </ul>
            <button className="cta-button" onClick={handleSignUp}>Get Started</button>
          </div>
        </div>
      </section>

      <section id="about" ref={aboutRef} className="about-section fade-in-section">
        <h2 className="section-title">The Sushi Difference</h2>
        <div className="about-content">
          <div className="about-image"></div>
          <div className="about-text">
            <p>Just as master sushi chefs train for years to perfect their craft, we've dedicated ourselves to creating the perfect invoicing experience.</p>
            <p>Founded by a team of accounting experts and software engineers, Sushi Invoice combines financial precision with elegant design.</p>
            <p>Our mission is to make financial paperwork as satisfying as a perfectly crafted sushi meal - beautiful, precise, and surprisingly enjoyable.</p>
            <button className="cta-button secondary" onClick={handleSignUp}>Join Our Story</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Sushi Invoice</h4>
            <p>Precision invoicing for modern businesses</p>
          </div>
          <div className="footer-section">
            <h4>Links</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#terms">Terms</a></li>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#security">Security</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:support@sushi-invoice.com">support@sushi-invoice.com</a></li>
              <li><a href="tel:+1234567890">+1 (234) 567-890</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Sushi Invoice. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 