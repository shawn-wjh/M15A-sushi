import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const history = useHistory();
  const [isVisible, setIsVisible] = useState(true);
  
  // References for sections that will fade in
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);
  const aboutRef = useRef(null);
  
  // References for hero animations
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const heroButtonRef = useRef(null);
  const sushiStackRef = useRef(null);
  const sushiRollRef = useRef(null);
  const sushiPlateRef = useRef(null);
  const invoicePaperRef = useRef(null);
  const sushiNigiriRef = useRef(null);
  const sushiMakiRef = useRef(null);
  const chopsticksRef = useRef(null);
  
  // References for workflow path
  const workflowContainerRef = useRef(null);
  const workflowPathRef = useRef(null);
  const documentIconRef = useRef(null);
  const workflowIconsRef = useRef([]);
  
  // References for features animations
  const featuresTitleRef = useRef(null);
  const featureCardsRef = useRef([]);
  const featureIconsRef = useRef([]);
  const featureIconBgRef = useRef([]);
  const featureTitleLinesRef = useRef([]);
  
  // Add refs for pricing animations
  const pricingTitleRef = useRef(null);
  const pricingCardsRef = useRef([]);
  const pricingFeaturesRef = useRef([]);
  const pricingButtonsRef = useRef([]);
  const popularBadgeRef = useRef(null);
  const particlesContainerRef = useRef(null);
  
  // Add refs for about section animations
  const aboutTitleRef = useRef(null);
  const aboutContentRef = useRef(null);
  const aboutImagesRef = useRef([]);
  const storyLinesRef = useRef([]);
  const aboutCTARef = useRef(null);
  const aboutBgPatternRef = useRef(null);
  
  // Add refs for timeline animations
  const timelineRef = useRef(null);
  const timelineDotsRef = useRef([]);
  const timelineContentRef = useRef([]);
  const timelineLineRef = useRef(null);
  const timelineIconsRef = useRef([]);
  
  // Add refs for FAQ section
  const faqRef = useRef(null);
  const faqTitleRef = useRef(null);
  const faqItemsRef = useRef([]);
  const faqQuestionsRef = useRef([]);
  const faqAnswersRef = useRef([]);
  const faqIconsRef = useRef([]);
  
  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Function to trigger animations for elements already in viewport on load
  const triggerInitialAnimations = () => {
    if (!window.anime) return;
    
    const anime = window.anime;
    const sections = [heroRef, featuresRef, pricingRef, timelineRef, aboutRef, faqRef];
    
    // Add the visibility class to all sections immediately
    sections.forEach(sectionRef => {
      if (sectionRef.current) {
        sectionRef.current.classList.add('section-visible');
        
        // Manually trigger the appropriate animations
        if (sectionRef === heroRef) {
          // Hero animations with more pronounced effects
          if (heroTitleRef.current) {
            // Create text animation for the hero title lines
            heroTitleRef.current.querySelectorAll('.hero-title-line').forEach((line, lineIndex) => {
              const text = line.textContent;
              line.innerHTML = '';
              line.style.opacity = '1'; // Make parent visible
              
              // Create span for each character
              [...text].forEach((char, i) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.transform = 'translateY(40px) rotateX(90deg)';
                line.appendChild(span);
              });
              
              // Animate each character with a staggered effect
              anime({
                targets: line.querySelectorAll('span'),
                opacity: [0, 1],
                translateY: [40, 0],
                rotateX: [90, 0],
                duration: 800,
                delay: anime.stagger(15, {start: 300 + (lineIndex * 200)}),
                easing: 'easeOutExpo'
              });
            });
            
            // Special animation for the accent text
            const accentElement = heroTitleRef.current.querySelector('.hero-title-accent');
            if (accentElement) {
              const accentText = accentElement.textContent;
              accentElement.innerHTML = '';
              accentElement.style.opacity = '1'; // Make parent visible
              
              // Create span for each character in the accent text
              [...accentText].forEach((char, i) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                accentElement.appendChild(span);
              });
              
              // Animate accent characters with a wave effect
              anime({
                targets: accentElement.querySelectorAll('span'),
                opacity: [0, 1],
                translateY: function(el, i) {
                  return [60, 0];
                },
                scale: [0.8, 1],
                rotateZ: [40, 0],
                delay: anime.stagger(40, {start: 1000, from: 'center'}),
                duration: 800,
                easing: 'easeOutCirc'
              });
              
              // Add the underline animation
              anime.timeline()
                .add({
                  targets: accentElement,
                  duration: 1200,
                  delay: 1500,
                  complete: function() {
                    // Create and append underline element
                    const underline = document.createElement('div');
                    underline.style.position = 'absolute';
                    underline.style.bottom = '0';
                    underline.style.left = '0';
                    underline.style.height = '8px';
                    underline.style.width = '0';
                    underline.style.backgroundColor = 'var(--accent-red)';
                    underline.style.borderRadius = '4px';
                    accentElement.style.position = 'relative';
                    accentElement.appendChild(underline);
                    
                    // Animate the underline
                    anime({
                      targets: underline,
                      width: ['0%', '100%'],
                      easing: 'easeInOutQuad',
                      duration: 800
                    });
                  }
                });
            }
          }
          
          if (heroSubtitleRef.current) {
            // Animate the subtitle with a typewriter-like effect
            heroSubtitleRef.current.innerHTML = '';
            heroSubtitleRef.current.style.opacity = '1'; // Make parent visible
            
            // Create a simple fade-in animation instead of the typewriter effect
            // This will be cleaner and avoid text layout issues
            anime({
              targets: heroSubtitleRef.current,
              opacity: [0, 1],
              translateY: [20, 0],
              easing: 'easeOutExpo',
              duration: 800,
              delay: 1500
            });
            
            // Add the properly formatted text
            heroSubtitleRef.current.textContent = "Generate beautiful invoices with the precision of sushi craftsmanship.";
          }
          
          if (heroButtonRef.current) {
            // Button animation with bounce effect
            anime.timeline()
              .add({
                targets: heroButtonRef.current,
                opacity: [0, 1],
                translateY: [40, 0],
                scale: [0.6, 1.1, 1],
                duration: 1500,
                delay: 1800,
                easing: 'easeOutElastic(1, .5)'
              });
          }
        }
        
        // Add other section animations as needed...
      }
    });
  };
  
  // Force all elements to be visible on page load
  useEffect(() => {
    // Immediately set style.opacity on all elements that should be visible right away
    if (sushiPlateRef.current) sushiPlateRef.current.style.opacity = '1';
    if (sushiRollRef.current) sushiRollRef.current.style.opacity = '1';
    if (sushiNigiriRef.current) sushiNigiriRef.current.style.opacity = '1';
    if (sushiMakiRef.current) sushiMakiRef.current.style.opacity = '1';
    if (chopsticksRef.current) chopsticksRef.current.style.opacity = '1';
    if (invoicePaperRef.current) invoicePaperRef.current.style.opacity = '1';
    if (workflowContainerRef.current) workflowContainerRef.current.style.opacity = '1';
    if (workflowPathRef.current) workflowPathRef.current.style.opacity = '0.6';
    
    // Add visibility class to all sections immediately
    const sections = [heroRef, featuresRef, pricingRef, timelineRef, aboutRef, faqRef];
    sections.forEach(sectionRef => {
      if (sectionRef.current) {
        sectionRef.current.classList.add('section-visible');
      }
    });

    // Animate the hero text with advanced anime.js techniques
    if (window.anime && heroRef.current) {
      const anime = window.anime;
      
      // Animate the logo when the page loads
      const logoText = document.querySelector('.logo-text');
      const logoDot = document.querySelector('.logo-dot');
      const logoInvoice = document.querySelector('.logo-invoice');
      
      if (logoText && logoDot && logoInvoice) {
        // Initial entrance animation
        anime.timeline()
          .add({
            targets: logoText,
            translateY: [-30, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          })
          .add({
            targets: logoDot,
            scale: [0, 1.5, 1],
            opacity: [0, 1],
            rotate: ['0deg', '360deg'],
            duration: 1000,
            easing: 'easeOutElastic(1, .5)'
          }, '-=400')
          .add({
            targets: logoInvoice,
            translateX: [-20, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutExpo'
          }, '-=600');
        
        // Add pulse animation to the dot
        anime({
          targets: logoDot,
          scale: [1, 1.2, 1],
          duration: 1500,
          easing: 'easeInOutQuad',
          loop: true
        });
        
        // Add hover effect to the entire logo
        const logo = document.querySelector('.logo');
        if (logo) {
          logo.addEventListener('mouseenter', () => {
            anime({
              targets: logoText,
              translateY: [0, -5, 0],
              duration: 600,
              easing: 'easeOutElastic(1, .5)'
            });
            
            anime({
              targets: logoDot,
              scale: [1, 1.5, 1],
              rotate: '360deg',
              duration: 600,
              easing: 'easeOutElastic(1, .5)'
            });
            
            anime({
              targets: logoInvoice,
              translateX: [0, 5, 0],
              duration: 600,
              easing: 'easeOutElastic(1, .5)'
            });
          });
        }
      }
      
      // Create text animation for the hero title lines
      if (heroTitleRef.current) {
        // Split each title line into characters for animation
        heroTitleRef.current.querySelectorAll('.hero-title-line').forEach((line, lineIndex) => {
          const text = line.textContent;
          line.innerHTML = '';
          line.style.opacity = '1'; // Make parent visible
          
          // Create span for each character
          [...text].forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(40px) rotateX(90deg)';
            line.appendChild(span);
          });
          
          // Animate each character with a staggered effect
          anime({
            targets: line.querySelectorAll('span'),
            opacity: [0, 1],
            translateY: [40, 0],
            rotateX: [90, 0],
            duration: 800,
            delay: anime.stagger(15, {start: 300 + (lineIndex * 200)}),
            easing: 'easeOutExpo'
          });
        });
        
        // Special animation for the accent text
        const accentElement = heroTitleRef.current.querySelector('.hero-title-accent');
        if (accentElement) {
          const accentText = accentElement.textContent;
          accentElement.innerHTML = '';
          accentElement.style.opacity = '1'; // Make parent visible
          
          // Create span for each character in the accent text
          [...accentText].forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            accentElement.appendChild(span);
          });
          
          // Animate accent characters with a wave effect
          anime({
            targets: accentElement.querySelectorAll('span'),
            opacity: [0, 1],
            translateY: function(el, i) {
              return [60, 0];
            },
            scale: [0.8, 1],
            rotateZ: [40, 0],
            delay: anime.stagger(40, {start: 1000, from: 'center'}),
            duration: 800,
            easing: 'easeOutCirc'
          });
          
          // Add the underline animation
          anime.timeline()
            .add({
              targets: accentElement,
              duration: 1200,
              delay: 1500,
              complete: function() {
                // Create and append underline element
                const underline = document.createElement('div');
                underline.style.position = 'absolute';
                underline.style.bottom = '0';
                underline.style.left = '0';
                underline.style.height = '8px';
                underline.style.width = '0';
                underline.style.backgroundColor = 'var(--accent-red)';
                underline.style.borderRadius = '4px';
                accentElement.style.position = 'relative';
                accentElement.appendChild(underline);
                
                // Animate the underline
                anime({
                  targets: underline,
                  width: ['0%', '100%'],
                  easing: 'easeInOutQuad',
                  duration: 800
                });
              }
            });
        }
      }
      
      if (heroSubtitleRef.current) {
        // Animate the subtitle with a typewriter-like effect
        heroSubtitleRef.current.innerHTML = '';
        heroSubtitleRef.current.style.opacity = '1'; // Make parent visible
        
        // Create a simple fade-in animation instead of the typewriter effect
        // This will be cleaner and avoid text layout issues
        anime({
          targets: heroSubtitleRef.current,
          opacity: [0, 1],
          translateY: [20, 0],
          easing: 'easeOutExpo',
          duration: 800,
          delay: 1500
        });
        
        // Add the properly formatted text
        heroSubtitleRef.current.textContent = "Generate beautiful invoices with the precision of sushi craftsmanship.";
      }
      
      if (heroButtonRef.current) {
        // Button animation with bounce effect
        anime.timeline()
          .add({
            targets: heroButtonRef.current,
            opacity: [0, 1],
            translateY: [40, 0],
            scale: [0.6, 1.1, 1],
            duration: 1500,
            delay: 1800,
            easing: 'easeOutElastic(1, .5)'
          });
      }
      
      // Create a nice entrance animation for the sushi plate
      if (sushiStackRef.current) {
        anime({
          targets: sushiStackRef.current,
          scale: [0.8, 1],
          rotate: [10, 0],
          duration: 1200,
          easing: 'easeOutElastic(1, 0.5)'
        });
        
        // Create subtle floating animation for sushi stack
        anime({
          targets: sushiStackRef.current,
          translateY: [0, -15],
          duration: 3000,
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutQuad',
          delay: 1000
        });
      }
      
      // Add a nice entrance animation for the workflow path
      if (workflowContainerRef.current) {
        anime({
          targets: workflowContainerRef.current,
          scale: [0.9, 1],
          opacity: [0.8, 1],
          duration: 1000,
          easing: 'easeOutExpo'
        });
      }
      
      // Setup hover interactions for sushi stack
      if (sushiStackRef.current) {
        // Add rotation based on mouse position
        heroRef.current.addEventListener('mousemove', (e) => {
          if (!sushiStackRef.current) return;
          
          // Calculate mouse position relative to the hero section
          const rect = heroRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
          
          // Apply rotation based on mouse position
          anime({
            targets: sushiStackRef.current,
            rotateY: -x,
            rotateX: y,
            duration: 400,
            easing: 'easeOutQuad'
          });
        });
      }

      // Animate document icon movement along the workflow path
      if (documentIconRef.current && workflowPathRef.current) {
        // Ensure the document icon is visible
        documentIconRef.current.style.opacity = '1';
        
        // Draw the workflow path with animation
        anime({
          targets: workflowPathRef.current,
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInOutSine',
          duration: 2000
        });
        
        // Reset document position and animate along the path
        documentIconRef.current.style.top = "0px";
        documentIconRef.current.style.left = "0px";

        anime({
          targets: documentIconRef.current,
          keyframes: [
            // Initial positioning at "Create" icon
            {translateX: 20, translateY: 80, opacity: 1, scale: 1, rotate: 0, duration: 100},
            // Path to "Validate"
            {translateX: 40, translateY: 60, rotate: -10, duration: 600},
            {translateX: 70, translateY: 40, rotate: -20, duration: 600},
            {translateX: 100, translateY: 55, rotate: -5, duration: 600},
            {translateX: 125, translateY: 80, rotate: 10, duration: 600},
            {translateX: 150, translateY: 100, rotate: 20, duration: 600},
            // Path to "Store"
            {translateX: 180, translateY: 130, rotate: 10, duration: 600},
            {translateX: 210, translateY: 160, rotate: 5, duration: 600},
            {translateX: 230, translateY: 180, rotate: 0, duration: 600},
            {translateX: 250, translateY: 200, rotate: -5, duration: 600},
            // Path to "Send"
            {translateX: 240, translateY: 230, rotate: -15, duration: 600},
            {translateX: 220, translateY: 260, rotate: -25, duration: 600},
            {translateX: 190, translateY: 290, rotate: -30, duration: 600},
            {translateX: 160, translateY: 310, rotate: -20, duration: 600},
            {translateX: 130, translateY: 315, rotate: -10, duration: 600},
            {translateX: 100, translateY: 310, rotate: -5, duration: 600},
            {translateX: 70, translateY: 280, rotate: 0, duration: 600},
            // Return to start (complete loop)
            {translateX: 60, translateY: 230, rotate: 10, duration: 600},
            {translateX: 50, translateY: 180, rotate: 15, duration: 600},
            {translateX: 40, translateY: 130, rotate: 10, duration: 600},
            {translateX: 30, translateY: 100, rotate: 5, duration: 600},
            {translateX: 20, translateY: 80, rotate: 0, duration: 600}
          ],
          duration: 15000,
          easing: 'linear',
          loop: true
        });
      }
      
      // Setup hover event for sushi stack explosion effect
      if (sushiStackRef.current && sushiRollRef.current && invoicePaperRef.current && 
          sushiPlateRef.current && sushiNigiriRef.current && sushiMakiRef.current && 
          chopsticksRef.current) {
        
        // Setup hover animation
        sushiStackRef.current.addEventListener('mouseenter', () => {
          anime({
            targets: sushiPlateRef.current,
            scale: [1, 1.1],
            duration: 500,
            easing: 'easeOutQuad'
          });
          
          anime({
            targets: sushiRollRef.current,
            translateY: '-120%',
            translateX: '-60%',
            rotateZ: [0, -15],
            scale: 1.2,
            duration: 800,
            easing: 'easeOutElastic(1, .6)'
          });
          
          anime({
            targets: invoicePaperRef.current,
            translateY: '-150%',
            translateX: '50%',
            rotateZ: [0, 15],
            scale: 1.2,
            duration: 800,
            easing: 'easeOutElastic(1, .6)'
          });
          
          anime({
            targets: sushiNigiriRef.current,
            translateY: '-120%',
            translateX: '-100%',
            rotateZ: [0, -25],
            opacity: 1,
            scale: 1,
            duration: 700,
            easing: 'easeOutElastic(1, .6)'
          });
          
          anime({
            targets: sushiMakiRef.current,
            translateY: '-60%',
            translateX: '120%',
            rotateZ: [0, 35],
            opacity: 1,
            scale: 1,
            duration: 700,
            easing: 'easeOutElastic(1, .6)'
          });
          
          anime({
            targets: chopsticksRef.current,
            rotateZ: [30, 45],
            translateX: [0, 30],
            translateY: [0, -20],
            opacity: 1,
            duration: 600,
            easing: 'easeOutQuad'
          });
        });
        
        // Reset on mouse leave
        sushiStackRef.current.addEventListener('mouseleave', () => {
          anime({
            targets: sushiPlateRef.current,
            scale: 1,
            duration: 600,
            easing: 'easeOutQuad'
          });
          
          anime({
            targets: sushiRollRef.current,
            translateY: '-80%',
            translateX: '-50%',
            rotateZ: 0,
            scale: 1,
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          });
          
          anime({
            targets: invoicePaperRef.current,
            translateY: '-110%',
            translateX: '10%',
            rotateZ: 0,
            scale: 1,
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          });
          
          anime({
            targets: sushiNigiriRef.current,
            translateY: '-50%',
            translateX: '-50%',
            rotateZ: 0,
            opacity: 0.7,
            scale: 0.8,
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          });
          
          anime({
            targets: sushiMakiRef.current,
            translateY: '60%',
            translateX: '30%',
            rotateZ: 0,
            opacity: 0.7,
            scale: 0.8,
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          });
          
          anime({
            targets: chopsticksRef.current,
            rotateZ: 30,
            translateX: 0,
            translateY: 0,
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          });
        });
      }
    }

    // Apply animations in a setTimeout to ensure DOM is fully processed
    setTimeout(() => {
      triggerInitialAnimations();
    }, 100);
  }, []);
  
  // Initialize animations when component mounts
  useEffect(() => {
    // Immediately trigger animations regardless of anime.js loading state
    triggerInitialAnimations();
    
    // Function to animate the logo
    const animateLogo = () => {
      if (!window.anime) return;
      
      const anime = window.anime;
      const logoText = document.querySelector('.logo-text');
      const logoDot = document.querySelector('.logo-dot');
      const logoInvoice = document.querySelector('.logo-invoice');
      
      if (logoText && logoDot && logoInvoice) {
        // Initial entrance animation
        anime.timeline()
          .add({
            targets: logoText,
            translateY: [-30, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          })
          .add({
            targets: logoDot,
            scale: [0, 1.5, 1],
            opacity: [0, 1],
            rotate: ['0deg', '360deg'],
            duration: 1000,
            easing: 'easeOutElastic(1, .5)'
          }, '-=400')
          .add({
            targets: logoInvoice,
            translateX: [-20, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutExpo'
          }, '-=600');
        
        // Add pulse animation to the dot
        anime({
          targets: logoDot,
          scale: [1, 1.2, 1],
          duration: 1500,
          easing: 'easeInOutQuad',
          loop: true
        });
        
        // Add hover effect to the entire logo
        const logo = document.querySelector('.logo');
        if (logo) {
          logo.addEventListener('mouseenter', () => {
            anime({
              targets: logoText,
              translateY: [0, -5, 0],
              duration: 600,
              easing: 'easeOutElastic(1, .5)'
            });
            
            anime({
              targets: logoDot,
              scale: [1, 1.5, 1],
              rotate: '360deg',
              duration: 600,
              easing: 'easeOutElastic(1, .5)'
            });
            
            anime({
              targets: logoInvoice,
              translateX: [0, 5, 0],
              duration: 600,
              easing: 'easeOutElastic(1, .5)'
            });
          });
        }
      }
    };
    
    // Make sure anime.js is available
    if (typeof window !== 'undefined') {
      // Ensure anime.js is loaded
      if (!window.anime) {
        console.error('Anime.js is not loaded! Loading it from CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
        script.async = true;
        script.onload = () => {
          console.log('Anime.js loaded successfully');
          // Trigger animations for elements in the initial viewport again when anime loads
          triggerInitialAnimations();
          
          // Animate the logo when anime.js is loaded
          animateLogo();
        };
        document.body.appendChild(script);
      } else {
        // If anime.js is already loaded, trigger logo animation immediately
        animateLogo();
      }
    }
    
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
          
          // Make sure we have anime.js available
          if (!window.anime) {
            console.error('Anime.js is not loaded! Animations will not work.');
            return;
          }
          
          const anime = window.anime;
          
          // Hero section animations - AVOID REAPPLYING ANIMATIONS TO HERO SECTION
          if (entry.target === heroRef.current) {
            // Skip all hero section animations when scrolling, as they're already set up in the initial load
            return;
          }
          
          // Animate timeline section when it becomes visible
          if (entry.target === timelineRef.current && window.anime) {
            // Rest of timeline animations remain unchanged
            const mainTimeline = anime.timeline({
              easing: 'easeOutExpo',
              autoplay: true
            });
            
            // Add line animation to main timeline
            if (timelineLineRef.current) {
              mainTimeline.add({
                targets: timelineLineRef.current,
                scaleX: [0, 1],
                opacity: [0, 1],
                easing: 'easeInOutQuad',
                duration: 1000
              });
            }
            
            // Add dots animation to main timeline
            const timelineDots = timelineDotsRef.current.filter(dot => dot !== null);
            if (timelineDots.length) {
              mainTimeline.add({
                targets: timelineDots,
                scale: [0, 1],
                opacity: [0, 1],
                delay: anime.stagger(200),
                easing: 'easeOutElastic(1, .5)',
                duration: 800
              }, '-=700'); // Start slightly before line finishes
            }
            
            // Add content animation to main timeline
            const timelineContents = timelineContentRef.current.filter(content => content !== null);
            if (timelineContents.length) {
              mainTimeline.add({
                targets: timelineContents,
                translateY: [40, 0],
                opacity: [0, 1],
                delay: anime.stagger(200),
                easing: 'easeOutQuad',
                duration: 800
              }, '-=500'); // Overlap with dots animation
            }
            
            // Add icons animation to main timeline
            const timelineIcons = timelineIconsRef.current.filter(icon => icon !== null);
            if (timelineIcons.length) {
              mainTimeline.add({
                targets: timelineIcons,
                rotateY: [90, 0],
                opacity: [0, 1],
                scale: [0.5, 1],
                delay: anime.stagger(200, {start: 300}),
                easing: 'easeOutElastic(1, .5)',
                duration: 1000
              }, '-=800'); // Start while content is animating
            }
            
            // Add hover interactions for each timeline item
            timelineDots.forEach((dot, index) => {
              if (!dot || !timelineContents[index] || !timelineIcons[index]) return;
              
              const hoverTimeline = anime.timeline({
                autoplay: false,
                direction: 'normal'
              });
              
              // Create hover animation
              hoverTimeline
                .add({
                  targets: dot,
                  scale: 1.3,
                  backgroundColor: '#ff3b30',
                  duration: 300,
                  easing: 'easeOutQuad'
                })
                .add({
                  targets: timelineContents[index],
                  translateY: -10,
                  scale: 1.03,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  duration: 300,
                  easing: 'easeOutQuad'
                }, '-=300')
                .add({
                  targets: timelineIcons[index],
                  scale: 1.2,
                  rotate: 5,
                  duration: 300,
                  easing: 'easeOutQuad'
                }, '-=300');
              
              // Create leave animation
              const leaveTimeline = anime.timeline({
                autoplay: false
              });
              
              leaveTimeline
                .add({
                  targets: dot,
                  scale: 1,
                  backgroundColor: index === 0 ? '#ff3b30' : '#666',
                  duration: 300,
                  easing: 'easeOutQuad'
                })
                .add({
                  targets: timelineContents[index],
                  translateY: 0,
                  scale: 1,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  duration: 300,
                  easing: 'easeOutQuad'
                }, '-=300')
                .add({
                  targets: timelineIcons[index],
                  scale: 1,
                  rotate: 0,
                  duration: 300,
                  easing: 'easeOutQuad'
                }, '-=300');
              
              // Add event listeners
              const itemContainer = dot.parentElement;
              
              itemContainer.addEventListener('mouseenter', () => {
                hoverTimeline.play();
              });
              
              itemContainer.addEventListener('mouseleave', () => {
                leaveTimeline.play();
              });
            });
            
            // Animating active state transitions when clicking on a dot
            timelineDots.forEach((dot, index) => {
              dot.addEventListener('click', () => {
                // Trigger state change animation for all dots
                const progressionTimeline = anime.timeline({
                  easing: 'easeOutExpo'
                });
                
                // Reset all dots to inactive
                progressionTimeline.add({
                  targets: timelineDots,
                  backgroundColor: '#666',
                  boxShadow: '0 0 0 4px rgba(102, 102, 102, 0.2)',
                  scale: 1,
                  duration: 400
                });
                
                // Set clicked dot and all previous dots to active
                progressionTimeline.add({
                  targets: timelineDots.slice(0, index + 1),
                  backgroundColor: '#ff3b30',
                  boxShadow: '0 0 0 4px rgba(255, 59, 48, 0.2)',
                  scale: 1.1,
                  delay: anime.stagger(100),
                  duration: 400
                }, '-=400');
                
                // Update dot classes for styling
                timelineDots.forEach((d, i) => {
                  if (i <= index) {
                    d.classList.add('active');
                  } else {
                    d.classList.remove('active');
                  }
                });
              });
            });
          }
          
          // Animate features section when it becomes visible
          if (entry.target === featuresRef.current && window.anime) {
            const anime = window.anime;
            
            // Animate section title with staggered letters
            if (featuresTitleRef.current) {
              // Split the title into individual letters
              const titleText = featuresTitleRef.current.textContent;
              featuresTitleRef.current.innerHTML = '';
              
              // Create span for each letter
              [...titleText].forEach((letter, i) => {
                const span = document.createElement('span');
                span.textContent = letter === ' ' ? '\u00A0' : letter;
                span.style.opacity = '0';
                span.style.display = 'inline-block';
                span.style.transformOrigin = 'center';
                featuresTitleRef.current.appendChild(span);
              });
              
              // Animate each letter
              anime({
                targets: featuresTitleRef.current.querySelectorAll('span'),
                opacity: [0, 1],
                scale: [0.5, 1],
                rotate: [
                  { value: '-20deg', duration: 0 },
                  { value: '20deg', duration: 400 },
                  { value: '0deg', duration: 400 }
                ],
                translateY: [
                  { value: -30, duration: 0 },
                  { value: 30, duration: 400 },
                  { value: 0, duration: 600 }
                ],
                delay: anime.stagger(40),
                easing: 'easeOutElastic(1, .6)',
                duration: 800
              });
              
              // Animate the underline
              anime({
                targets: featuresTitleRef.current.querySelector('::after'),
                width: [0, 80],
                opacity: [0, 1],
                easing: 'easeOutExpo',
                duration: 1000,
                delay: 800
              });
            }
            
            // Animate feature cards with cascading effect
            if (featureCardsRef.current.length) {
              anime({
                targets: featureCardsRef.current,
                opacity: [0, 1],
                translateY: [50, 0],
                scale: [0.9, 1],
                delay: anime.stagger(150, {start: 300}),
                easing: 'easeOutExpo',
                duration: 800
              });
              
              // Rotate icons as they enter
              anime({
                targets: featureIconsRef.current,
                scale: [0, 1],
                rotate: [
                  { value: '0deg', duration: 0 },
                  { value: '360deg', duration: 1200 }
                ],
                delay: anime.stagger(150, {start: 500}),
                easing: 'easeOutElastic(1, .6)',
                duration: 1200
              });
              
              // Animate icon backgrounds
              anime({
                targets: featureIconBgRef.current,
                rotate: '360deg',
                easing: 'linear',
                duration: 20000,
                loop: true
              });
              
              // Draw lines under feature titles on hover
              featureCardsRef.current.forEach((card, index) => {
                card.addEventListener('mouseenter', () => {
                  anime({
                    targets: featureTitleLinesRef.current[index].parentNode.querySelector('::after'),
                    width: ['0%', '100%'],
                    opacity: [0, 1],
                    easing: 'easeOutQuad',
                    duration: 400
                  });
                  
                  // Add tilt effect on hover
                  anime({
                    targets: card,
                    translateY: -10,
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                    easing: 'easeOutQuad',
                    duration: 400
                  });
                  
                  // Pulse the icon
                  anime({
                    targets: featureIconsRef.current[index],
                    scale: [1, 1.2, 1],
                    duration: 600,
                    easing: 'easeInOutQuad'
                  });
                });
                
                card.addEventListener('mouseleave', () => {
                  anime({
                    targets: card,
                    translateY: 0,
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
                    easing: 'easeOutQuad',
                    duration: 400
                  });
                });
              });
            }
          }
          
          // Animate pricing section when it becomes visible
          if (entry.target === pricingRef.current && window.anime) {
            const anime = window.anime;
            
            // Create floating particles for the featured plan
            if (particlesContainerRef.current) {
              // Create particles
              for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.width = `${Math.random() * 6 + 2}px`;
                particle.style.height = particle.style.width;
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                particle.style.opacity = '0';
                particlesContainerRef.current.appendChild(particle);
              }
              
              // Animate particles
              anime({
                targets: particlesContainerRef.current.querySelectorAll('.particle'),
                opacity: [0, 0.6, 0],
                translateY: function() { return [anime.random(0, 100), anime.random(-100, 0)]; },
                translateX: function() { return [anime.random(-50, 50), anime.random(-50, 50)]; },
                scale: [1, 0],
                easing: 'easeOutExpo',
                duration: function() { return anime.random(3000, 8000); },
                delay: function() { return anime.random(0, 2000); },
                loop: true,
                complete: function(anim) {
                  anim.restart();
                }
              });
            }
            
            // Animate section title with "typing" effect
            if (pricingTitleRef.current) {
              const titleText = pricingTitleRef.current.textContent;
              pricingTitleRef.current.innerHTML = '';
              
              // Create span for each letter
              [...titleText].forEach((letter, i) => {
                const span = document.createElement('span');
                span.textContent = letter === ' ' ? '\u00A0' : letter;
                span.style.opacity = '0';
                span.style.display = 'inline-block';
                pricingTitleRef.current.appendChild(span);
              });
              
              // Animate each letter with a typing effect
              anime({
                targets: pricingTitleRef.current.querySelectorAll('span'),
                opacity: [0, 1],
                scale: [0.8, 1],
                duration: 20,
                easing: 'easeInExpo',
                delay: anime.stagger(50)
              });
              
              // Animate the title's underline
              anime({
                targets: pricingTitleRef.current.querySelector('::after'),
                width: [0, 80],
                opacity: [0, 1],
                easing: 'easeInOutExpo',
                duration: 800,
                delay: titleText.length * 50 + 100
              });
            }
            
            // Animate pricing cards with 3D staggered effect
            if (pricingCardsRef.current.length) {
              anime({
                targets: pricingCardsRef.current,
                opacity: [0, 1],
                translateY: [100, 0],
                rotateX: [45, 0],
                duration: 1200,
                delay: anime.stagger(200, {start: 500}),
                easing: 'easeOutExpo'
              });
              
              // Animated glow effect for featured card
              if (pricingCardsRef.current[1]) {
                anime({
                  targets: pricingCardsRef.current[1].querySelector('.featured-tag'),
                  opacity: [0, 1],
                  translateX: [50, 0],
                  duration: 800,
                  delay: 900,
                  easing: 'easeOutExpo'
                });
              }
              
              // Animate list items in each card
              pricingFeaturesRef.current.forEach((featureList, cardIndex) => {
                if (featureList) {
                  anime({
                    targets: featureList.querySelectorAll('li'),
                    opacity: [0, 1],
                    translateX: [-20, 0],
                    duration: 600,
                    delay: anime.stagger(100, {start: 1000 + cardIndex * 200}),
                    easing: 'easeOutQuad'
                  });
                }
              });
              
              // Animate buttons with pulse effect
              pricingButtonsRef.current.forEach((button, index) => {
                if (button) {
                  anime({
                    targets: button,
                    opacity: [0, 1],
                    scale: [0.8, 1.1, 1],
                    duration: 1000,
                    delay: 1500 + index * 200,
                    easing: 'easeOutElastic(1, .6)'
                  });
                }
              });
            }
          }
          
          // Animate about section when it becomes visible
          if (entry.target === aboutRef.current && window.anime) {
            const anime = window.anime;
            
            // Animate the section title with ripple effect
            if (aboutTitleRef.current) {
              const titleText = aboutTitleRef.current.textContent;
              aboutTitleRef.current.innerHTML = '';
              
              // Create span for each letter
              [...titleText].forEach((letter, i) => {
                const span = document.createElement('span');
                span.textContent = letter === ' ' ? '\u00A0' : letter;
                span.style.opacity = '0';
                span.style.display = 'inline-block';
                aboutTitleRef.current.appendChild(span);
              });
              
              // Animate each letter with a ripple effect
                  anime({
                targets: aboutTitleRef.current.querySelectorAll('span'),
                opacity: [0, 1],
                translateY: [20, 0],
                scale: [0.8, 1],
                delay: anime.stagger(30, {from: 'center'}),
                easing: 'easeOutExpo',
                duration: 800
              });
              
              // Fix for title underline animation
              // Instead of trying to animate the pseudo-element directly,
              // create a real element to animate
              const underline = document.createElement('div');
              underline.className = 'title-underline';
              underline.style.position = 'absolute';
              underline.style.bottom = '-10px';
              underline.style.left = '0';
              underline.style.width = '0px';
              underline.style.height = '4px';
              underline.style.backgroundColor = 'var(--accent-red)';
              underline.style.borderRadius = '2px';
              underline.style.opacity = '0';
              
              // Append the underline to the title
              aboutTitleRef.current.appendChild(underline);
              
              // Animate the real underline element
              setTimeout(() => {
                  anime({
                  targets: underline,
                  width: [0, 80],
                  opacity: [0, 1],
                  easing: 'easeOutExpo',
                  duration: 800
                });
              }, 800);
            }
            
            // Animate background pattern
            if (aboutBgPatternRef.current) {
              anime({
                targets: aboutBgPatternRef.current,
                opacity: [0, 0.1],
                scale: [1.5, 1],
                easing: 'easeOutQuad',
                duration: 1200
              });
              
              // Create subtle movement for the pattern
              anime({
                targets: aboutBgPatternRef.current,
                translateX: [0, 5, 0, -5, 0],
                translateY: [0, 5, 0, -5, 0],
                easing: 'easeInOutSine',
                duration: 10000,
                loop: true
              });
            }
            
            // Safely handle image animations
            const imageElements = aboutImagesRef.current.filter(el => el !== null);
            if (imageElements.length > 0) {
              // Initial image entrance animation
              anime({
                targets: imageElements,
                opacity: [0, 1],
                translateY: [40, 0],
                scale: [0.8, 1],
                duration: 1000,
                easing: 'easeOutExpo'
              });

              // Add continuous floating animation
              anime({
                targets: imageElements,
                translateY: [0, -20],
                rotate: [0, 2],
                duration: 3000,
                direction: 'alternate',
                loop: true,
                    easing: 'easeInOutQuad'
                  });
                  
              // Add hover effect that temporarily pauses the floating
              imageElements.forEach((img) => {
                if (!img) return;

                img.addEventListener('mouseenter', () => {
                    anime({
                    targets: img,
                    translateY: -30,
                    scale: 1.05,
                    rotate: [-2, 2],
                    boxShadow: '0 30px 50px rgba(0, 0, 0, 0.4)',
                    easing: 'easeOutElastic(1, .6)',
                    duration: 800
                  });
                });

                img.addEventListener('mouseleave', () => {
                  anime({
                    targets: img,
                    scale: 1,
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
                    easing: 'easeOutExpo',
                      duration: 600,
                    complete: () => {
                      // Resume the floating animation
                      anime({
                        targets: img,
                        translateY: [0, -20],
                        rotate: [0, 2],
                        duration: 3000,
                        direction: 'alternate',
                        loop: true,
                      easing: 'easeInOutQuad'
                    });
                  }
                });
                });
              });
            }
                
            // Animate about text with staggered lines - safely handle references
            const storyLines = storyLinesRef.current.filter(el => el !== null);
            if (storyLines.length) {
                  anime({
                targets: storyLines,
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(150, {start: 500}),
                easing: 'easeOutQuad',
                duration: 800
              });
            }
            
            // Animate CTA button with bounce effect
            if (aboutCTARef.current) {
              anime({
                targets: aboutCTARef.current,
                opacity: [0, 1],
                translateY: [20, 0],
                scale: [0.8, 1.1, 1],
                delay: 1200,
                easing: 'easeOutElastic(1, .5)',
                duration: 1200
              });
              
              // Add hover effect
              aboutCTARef.current.addEventListener('mouseenter', () => {
                anime({
                  targets: aboutCTARef.current,
                  scale: 1.05,
                  duration: 400,
                  easing: 'easeOutQuad'
                });
              });
              
              aboutCTARef.current.addEventListener('mouseleave', () => {
                anime({
                  targets: aboutCTARef.current,
                    scale: 1,
                    duration: 400,
                    easing: 'easeOutQuad'
                  });
                });
            }
          }
          
          // Animate FAQ section when it becomes visible
          if (entry.target === faqRef.current && window.anime) {
            const anime = window.anime;
            
            // Animate section title
            if (faqTitleRef.current) {
              const titleText = faqTitleRef.current.textContent;
              faqTitleRef.current.innerHTML = '';
              
              // Create separate spans for each character
              [...titleText].forEach(char => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.display = 'inline-block';
                span.style.opacity = 0;
                faqTitleRef.current.appendChild(span);
              });
              
              // Animate each character
              anime({
                targets: faqTitleRef.current.querySelectorAll('span'),
                opacity: [0, 1],
                translateY: [20, 0],
                scale: [0.8, 1],
                duration: 800,
                delay: anime.stagger(30),
                easing: 'easeOutExpo'
              });
            }
            
            // Animate FAQ items staggered entrance
            const faqItems = faqItemsRef.current.filter(item => item !== null);
            if (faqItems.length) {
              anime({
                targets: faqItems,
                translateY: [60, 0],
                opacity: [0, 1],
                delay: anime.stagger(150, {start: 400}),
                easing: 'easeOutExpo',
                duration: 800
              });
            }
            
            // Setup accordion functionality with animations
            faqQuestionsRef.current.forEach((question, index) => {
              if (!question || !faqAnswersRef.current[index] || !faqIconsRef.current[index]) return;
              
              const answer = faqAnswersRef.current[index];
              const icon = faqIconsRef.current[index];
              
              // Set initial heights
              answer.style.height = '0px';
              answer.style.overflow = 'hidden';
              
              // Calculate proper height for the answer
              const calculateHeight = () => {
                // Temporarily reset height for accurate measurement
                answer.style.height = 'auto';
                answer.style.opacity = 0;
                answer.style.display = 'block';
                
                const height = answer.scrollHeight;
                
                // Reset to initial state
                answer.style.height = '0px';
                answer.style.opacity = 1;
                
                return height;
              };
              
              question.addEventListener('click', () => {
                const isOpen = answer.classList.contains('open');
                const answerHeight = calculateHeight();
                
                // Toggle icon rotation animation
                anime({
                  targets: icon,
                  rotate: isOpen ? 0 : 45,
                  scale: [1, 1.2, 1],
                  duration: 400,
                  easing: 'easeOutQuad'
                });
                
                // Toggle answer expand/collapse animation
                anime({
                  targets: answer,
                  height: isOpen ? [answerHeight, 0] : [0, answerHeight],
                  opacity: isOpen ? [1, 0] : [0, 1],
                  duration: 400,
                  easing: isOpen ? 'easeOutQuad' : 'easeOutExpo'
                });
                
                // Get the span inside the question
                const questionText = question.querySelector('span');
                
                // Toggle question styles - using transform instead of padding
                anime({
                  targets: question,
                  color: isOpen ? ['#ff3b30', '#ffffff'] : ['#ffffff', '#ff3b30'],
                  duration: 400,
                  easing: 'easeOutQuad'
                });
                
                // Animate the question text with transform
                if (isOpen) {
                  // If it's already open, reset the text position to original state
                  anime({
                    targets: questionText,
                    translateX: 0,
                    duration: 400,
                    easing: 'easeOutQuad'
                  });
                } else {
                  // If it's closed, move the text to indented position
                  anime({
                    targets: questionText,
                    translateX: 20,
                    duration: 400,
                    easing: 'easeOutQuad'
                  });
                }
                
                // Toggle the open class
                if (isOpen) {
                  answer.classList.remove('open');
                  question.classList.remove('active');
                } else {
                  answer.classList.add('open');
                  question.classList.add('active');
                }
                
                // Close other answers (optional)
                faqAnswersRef.current.forEach((otherAnswer, i) => {
                  if (i !== index && otherAnswer && otherAnswer.classList.contains('open')) {
                    const otherQuestion = faqQuestionsRef.current[i];
                    const otherIcon = faqIconsRef.current[i];
                    const otherQuestionText = otherQuestion.querySelector('span');
                    
                    otherAnswer.classList.remove('open');
                    otherQuestion.classList.remove('active');
                    
                    anime({
                      targets: otherAnswer,
                      height: 0,
                      opacity: 0,
                      duration: 400,
                      easing: 'easeOutQuad'
                    });
                    
                    anime({
                      targets: otherIcon,
                      rotate: 0,
                      duration: 400,
                      easing: 'easeOutQuad'
                    });
                    
                    anime({
                      targets: otherQuestion,
                      color: '#ffffff',
                      duration: 400,
                      easing: 'easeOutQuad'
                    });
                    
                    // Reset other question text position explicitly to initial state
                    anime({
                      targets: otherQuestionText,
                      translateX: 0,
                      duration: 400,
                      easing: 'easeOutQuad'
                    });
                  }
                });
              });
            });
          }
          
          // Once the animation is applied, we can stop observing this element
          observer.unobserve(entry.target);
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    // Observe all sections
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (pricingRef.current) observer.observe(pricingRef.current);
    if (timelineRef.current) observer.observe(timelineRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);
    if (faqRef.current) observer.observe(faqRef.current);
    
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
        <div className="logo" onClick={scrollToTop}>
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

      <header ref={heroRef} className="hero">
        <div className="hero-content">
          <h1 ref={heroTitleRef} className="hero-title">
            <span className="hero-title-line">Premium</span>
            <span className="hero-title-line">Invoice</span>
            <span className="hero-title-line">Generation with</span>
            <span className="hero-title-accent">Precision</span>
          </h1>
          <p ref={heroSubtitleRef} className="hero-subtitle">
            Generate beautiful invoices with the precision of sushi craftsmanship.
          </p>
          <div ref={heroButtonRef} className="hero-cta">
            <button className="cta-button primary" onClick={() => history.push('#features')}>Learn More</button>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-image">
            <div ref={sushiStackRef} className="sushi-stack">
              <div ref={sushiPlateRef} className="sushi-plate"></div>
              <div ref={sushiRollRef} className="sushi-roll"></div>
              <div ref={sushiNigiriRef} className="sushi-nigiri"></div>
              <div ref={sushiMakiRef} className="sushi-maki"></div>
              <div ref={chopsticksRef} className="chopsticks">
                <div className="chopstick"></div>
                <div className="chopstick"></div>
              </div>
              <div ref={invoicePaperRef} className="invoice-paper"></div>
            </div>
            
            <div ref={workflowContainerRef} className="workflow-container">
              <svg width="300" height="400" viewBox="0 0 300 400">
                <path
                  ref={workflowPathRef}
                  className="workflow-path"
                  d="M20,80 C70,10 120,50 150,100 S230,150 250,200 C270,250 240,300 190,320 C140,340 90,320 70,280"
                />
              </svg>
              
              <div 
                ref={el => workflowIconsRef.current[0] = el} 
                className="workflow-icon" 
                style={{top: '70px', left: '10px'}}
                data-step="Create">
                📄
              </div>
              
              <div 
                ref={el => workflowIconsRef.current[1] = el} 
                className="workflow-icon" 
                style={{top: '90px', left: '150px'}}
                data-step="Validate">
                ✓
              </div>
              
              <div 
                ref={el => workflowIconsRef.current[2] = el} 
                className="workflow-icon" 
                style={{top: '200px', left: '250px'}}
                data-step="Store">
                💾
              </div>
              
              <div 
                ref={el => workflowIconsRef.current[3] = el} 
                className="workflow-icon" 
                style={{top: '310px', left: '100px'}}
                data-step="Send">
                📤
              </div>
              
              <div ref={documentIconRef} className="document-icon"></div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" ref={featuresRef} className="features-section fade-in-section">
        <h2 ref={featuresTitleRef} className="section-title">Crafted to Perfection</h2>
        <div className="features-grid">
          <div ref={el => featureCardsRef.current[0] = el} className="feature-card">
            <div className="feature-icon-container">
              <div ref={el => featureIconBgRef.current[0] = el} className="feature-icon-bg"></div>
              <div ref={el => featureIconsRef.current[0] = el} className="feature-icon">🍣</div>
            </div>
            <h3>
              <span ref={el => featureTitleLinesRef.current[0] = el}>Premium Templates</span>
            </h3>
            <p>Beautifully designed invoice templates that showcase professionalism.</p>
          </div>
          <div ref={el => featureCardsRef.current[1] = el} className="feature-card">
            <div className="feature-icon-container">
              <div ref={el => featureIconBgRef.current[1] = el} className="feature-icon-bg"></div>
              <div ref={el => featureIconsRef.current[1] = el} className="feature-icon">🔪</div>
            </div>
            <h3>
              <span ref={el => featureTitleLinesRef.current[1] = el}>Precise Automation</span>
            </h3>
            <p>Automate your invoicing with the precision of a sushi chef.</p>
          </div>
          <div ref={el => featureCardsRef.current[2] = el} className="feature-card">
            <div className="feature-icon-container">
              <div ref={el => featureIconBgRef.current[2] = el} className="feature-icon-bg"></div>
              <div ref={el => featureIconsRef.current[2] = el} className="feature-icon">🍱</div>
            </div>
            <h3>
              <span ref={el => featureTitleLinesRef.current[2] = el}>All-in-One Solution</span>
            </h3>
            <p>From generation to payment tracking, everything in one elegant box.</p>
          </div>
          <div ref={el => featureCardsRef.current[3] = el} className="feature-card">
            <div className="feature-icon-container">
              <div ref={el => featureIconBgRef.current[3] = el} className="feature-icon-bg"></div>
              <div ref={el => featureIconsRef.current[3] = el} className="feature-icon">🥢</div>
            </div>
            <h3>
              <span ref={el => featureTitleLinesRef.current[3] = el}>Easy Integration</span>
            </h3>
            <p>Connect seamlessly with your favorite accounting tools.</p>
          </div>
        </div>
      </section>

      <section id="pricing" ref={pricingRef} className="pricing-section fade-in-section">
        <h2 ref={pricingTitleRef} className="section-title">Select Your Roll</h2>
        <div className="pricing-grid">
          <div ref={el => pricingCardsRef.current[0] = el} className="pricing-card">
            <div className="pricing-header">
              <h3>Maki</h3>
              <div className="price">
                <span className="dollar-sign">$</span>19<span className="period">/month</span>
              </div>
            </div>
            <ul ref={el => pricingFeaturesRef.current[0] = el} className="pricing-features">
              <li>50 invoices per month</li>
              <li>5 templates</li>
              <li>Email support</li>
              <li>Basic reporting</li>
            </ul>
            <div className="pricing-cta">
              <button ref={el => pricingButtonsRef.current[0] = el} className="cta-button" onClick={handleSignUp}>Get Started</button>
            </div>
          </div>
          
          <div ref={el => pricingCardsRef.current[1] = el} className="pricing-card featured">
            <div ref={particlesContainerRef} className="particles-container"></div>
            <div className="pricing-header">
              <span className="featured-tag">Most Popular</span>
              <h3>Nigiri</h3>
              <div className="price">
                <span className="dollar-sign">$</span>49<span className="period">/month</span>
              </div>
            </div>
            <ul ref={el => pricingFeaturesRef.current[1] = el} className="pricing-features">
              <li>Unlimited invoices</li>
              <li>All templates</li>
              <li>Priority support</li>
              <li>Advanced reporting</li>
              <li>Client portal</li>
            </ul>
            <div className="pricing-cta">
              <button ref={el => pricingButtonsRef.current[1] = el} className="cta-button primary" onClick={handleSignUp}>Get Started</button>
            </div>
          </div>
          
          <div ref={el => pricingCardsRef.current[2] = el} className="pricing-card">
            <div className="pricing-header">
              <h3>Omakase</h3>
              <div className="price">
                <span className="dollar-sign">$</span>99<span className="period">/month</span>
              </div>
            </div>
            <ul ref={el => pricingFeaturesRef.current[2] = el} className="pricing-features">
              <li>Everything in Nigiri</li>
              <li>White-label solution</li>
              <li>API access</li>
              <li>Dedicated account manager</li>
              <li>Custom templates</li>
            </ul>
            <div className="pricing-cta">
              <button ref={el => pricingButtonsRef.current[2] = el} className="cta-button" onClick={handleSignUp}>Get Started</button>
            </div>
          </div>
        </div>
      </section>

      <section id="timeline" ref={timelineRef} className="timeline-section fade-in-section">
        <h2 className="section-title">Your Journey With Us</h2>
        <div className="timeline-container">
          <div ref={timelineLineRef} className="timeline-line"></div>
          
          <div className="timeline-item">
            <div 
              ref={el => { timelineDotsRef.current[0] = el; }} 
              className="timeline-dot active"
            ></div>
            <div 
              ref={el => { timelineIconsRef.current[0] = el; }}
              className="timeline-icon"
            >
              <i className="fas fa-user-plus"></i>
            </div>
            <div 
              ref={el => { timelineContentRef.current[0] = el; }} 
              className="timeline-content"
            >
              <h3>Sign Up</h3>
              <p>Create your Sushi Invoice account in seconds. No credit card required to get started.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div 
              ref={el => { timelineDotsRef.current[1] = el; }} 
              className="timeline-dot"
            ></div>
            <div 
              ref={el => { timelineIconsRef.current[1] = el; }}
              className="timeline-icon"
            >
              <i className="fas fa-paint-brush"></i>
            </div>
            <div 
              ref={el => { timelineContentRef.current[1] = el; }} 
              className="timeline-content"
            >
              <h3>Personalize</h3>
              <p>Add your company branding, customize templates, and set up your preferred settings.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div 
              ref={el => { timelineDotsRef.current[2] = el; }} 
              className="timeline-dot"
            ></div>
            <div 
              ref={el => { timelineIconsRef.current[2] = el; }}
              className="timeline-icon"
            >
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div 
              ref={el => { timelineContentRef.current[2] = el; }} 
              className="timeline-content"
            >
              <h3>Create Invoices</h3>
              <p>Generate professional invoices in seconds. Add line items, taxes, and discounts effortlessly.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div 
              ref={el => { timelineDotsRef.current[3] = el; }} 
              className="timeline-dot"
            ></div>
            <div 
              ref={el => { timelineIconsRef.current[3] = el; }}
              className="timeline-icon"
            >
              <i className="fas fa-paper-plane"></i>
            </div>
            <div 
              ref={el => { timelineContentRef.current[3] = el; }} 
              className="timeline-content"
            >
              <h3>Send & Get Paid</h3>
              <p>Send invoices directly from the platform and receive payments through integrated payment gateways.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div 
              ref={el => { timelineDotsRef.current[4] = el; }} 
              className="timeline-dot"
            ></div>
            <div 
              ref={el => { timelineIconsRef.current[4] = el; }}
              className="timeline-icon"
            >
              <i className="fas fa-chart-line"></i>
            </div>
            <div 
              ref={el => { timelineContentRef.current[4] = el; }} 
              className="timeline-content"
            >
              <h3>Analyze & Grow</h3>
              <p>Track payments, generate reports, and gain insights to help your business thrive.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" ref={aboutRef} className="about-section fade-in-section">
        <div style={{ height: "30px" }}></div> {/* Add a small spacer */}
        <div ref={aboutBgPatternRef} className="about-bg-pattern"></div>
        <h2 ref={aboutTitleRef} className="section-title">The Sushi Difference</h2>
        <div ref={aboutContentRef} className="about-content">
          <div className="about-left">
            <div ref={el => { aboutImagesRef.current[0] = el; }} className="about-image main-image">
              <img src="/images/meal.png" alt="Sushi Chef at Work" />
            </div>
          </div>
          
          <div className="about-right">
          <div className="about-text">
              <p ref={el => { storyLinesRef.current[0] = el; }}>
                Just as master sushi chefs train for years to perfect their craft, we've dedicated 
                ourselves to creating the perfect invoicing experience.
              </p>
              <p ref={el => { storyLinesRef.current[1] = el; }}>
                Founded by a team of accounting experts and software engineers, 
                Sushi Invoice combines financial precision with elegant design.
              </p>
              <p ref={el => { storyLinesRef.current[2] = el; }}>
                Our mission is to make financial paperwork as satisfying as a 
                perfectly crafted sushi meal - beautiful, precise, and surprisingly enjoyable.
              </p>
              <p ref={el => { storyLinesRef.current[3] = el; }}>
                We bring the attention to detail of traditional sushi making to modern business 
                processes, creating an invoicing system that blends artistry with functionality.
              </p>
              <button ref={aboutCTARef} className="cta-button secondary" onClick={handleSignUp}>
                Join Our Story
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" ref={faqRef} className="faq-section fade-in-section">
        <h2 ref={faqTitleRef} className="section-title">Common Questions</h2>
        <div className="faq-container">
          <div ref={el => { faqItemsRef.current[0] = el; }} className="faq-item">
            <div ref={el => { faqQuestionsRef.current[0] = el; }} className="faq-question">
              <span>How much does Sushi Invoice cost?</span>
              <div ref={el => { faqIconsRef.current[0] = el; }} className="faq-icon">+</div>
            </div>
            <div ref={el => { faqAnswersRef.current[0] = el; }} className="faq-answer">
              <p>We offer three pricing tiers to suit businesses of all sizes: Maki ($19/month), Nigiri ($49/month), and Omakase ($99/month). Each plan includes different features and invoice limits. You can view detailed pricing on our pricing section.</p>
            </div>
          </div>
          
          <div ref={el => { faqItemsRef.current[1] = el; }} className="faq-item">
            <div ref={el => { faqQuestionsRef.current[1] = el; }} className="faq-question">
              <span>Can I try Sushi Invoice before purchasing?</span>
              <div ref={el => { faqIconsRef.current[1] = el; }} className="faq-icon">+</div>
            </div>
            <div ref={el => { faqAnswersRef.current[1] = el; }} className="faq-answer">
              <p>Absolutely! We offer a 14-day free trial with no credit card required. You'll have access to all features during the trial period, allowing you to fully experience the platform before making a decision.</p>
            </div>
          </div>
          
          <div ref={el => { faqItemsRef.current[2] = el; }} className="faq-item">
            <div ref={el => { faqQuestionsRef.current[2] = el; }} className="faq-question">
              <span>Is my data secure with Sushi Invoice?</span>
              <div ref={el => { faqIconsRef.current[2] = el; }} className="faq-icon">+</div>
            </div>
            <div ref={el => { faqAnswersRef.current[2] = el; }} className="faq-answer">
              <p>Yes, we take data security very seriously. All data is encrypted in transit and at rest using industry-standard encryption. We maintain strict access controls, regular security audits, and comply with relevant data protection regulations.</p>
            </div>
          </div>
          
          <div ref={el => { faqItemsRef.current[3] = el; }} className="faq-item">
            <div ref={el => { faqQuestionsRef.current[3] = el; }} className="faq-question">
              <span>Can I customize invoice templates?</span>
              <div ref={el => { faqIconsRef.current[3] = el; }} className="faq-icon">+</div>
            </div>
            <div ref={el => { faqAnswersRef.current[3] = el; }} className="faq-answer">
              <p>Yes, all plans include template customization options. You can add your logo, change colors, adjust layouts, and save custom templates. Our Omakase plan includes fully custom template design capabilities for businesses that need specific branding requirements.</p>
            </div>
          </div>
          
          <div ref={el => { faqItemsRef.current[4] = el; }} className="faq-item">
            <div ref={el => { faqQuestionsRef.current[4] = el; }} className="faq-question">
              <span>Which payment gateways do you support?</span>
              <div ref={el => { faqIconsRef.current[4] = el; }} className="faq-icon">+</div>
            </div>
            <div ref={el => { faqAnswersRef.current[4] = el; }} className="faq-answer">
              <p>Sushi Invoice integrates with all major payment gateways including Stripe, PayPal, Square, and more. This allows your clients to pay invoices directly through various payment methods including credit cards, ACH transfers, and digital wallets.</p>
            </div>
          </div>
          
          <div ref={el => { faqItemsRef.current[5] = el; }} className="faq-item">
            <div ref={el => { faqQuestionsRef.current[5] = el; }} className="faq-question">
              <span>Can I cancel my subscription anytime?</span>
              <div ref={el => { faqIconsRef.current[5] = el; }} className="faq-icon">+</div>
            </div>
            <div ref={el => { faqAnswersRef.current[5] = el; }} className="faq-answer">
              <p>Yes, you can cancel your subscription at any time without any cancellation fees. Your account will remain active until the end of your current billing period. We also offer a 30-day money-back guarantee for all new subscribers.</p>
            </div>
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