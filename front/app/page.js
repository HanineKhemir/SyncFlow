"use client"; 
import Navbar from './components/navbar/Navbar';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
  return (
    <div className={styles.container}>
      <Navbar />
      
      {/* Animated Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingShape1}></div>
        <div className={styles.floatingShape2}></div>
        <div className={styles.floatingShape3}></div>
        <div className={styles.gridPattern}></div>
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTitle}>
            <span className={styles.titlePrimary}>Collaborate</span>
            <span className={styles.titleAccent}>Beyond</span>
            <span className={styles.titlePrimary}>Boundaries</span>
          </div>
          <p className={styles.heroSubtitle}>
            Experience the future of collaborative work with AI-powered tools, 
            real-time synchronization, and immersive team experiences that 
            transform how creative minds connect and create together.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryButton}
            onClick={() => router.push('/Login')}>
              <span className={styles.buttonText}>Start Creating</span>
              <div className={styles.buttonGlow}></div>
            </button>
            
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>10K+</span>
              <span className={styles.statLabel}>Active Teams</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>99.9%</span>
              <span className={styles.statLabel}>Uptime</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>&lt;100ms</span>
              <span className={styles.statLabel}>Response Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Powerful Features</h2>
            <p className={styles.sectionSubtitle}>Everything you need to collaborate at the speed of thought</p>
          </div>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>⚡</div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Lightning Fast Sync</h3>
              <p className={styles.featureDescription}>
                Real-time collaboration with sub-millisecond latency. See changes as they happen across all devices instantly.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>🧠</div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>AI-Powered Insights</h3>
              <p className={styles.featureDescription}>
                Smart suggestions, automated workflows, and predictive analytics that adapt to your team's unique patterns.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>🔒</div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Enterprise Security</h3>
              <p className={styles.featureDescription}>
                Military-grade encryption, zero-trust architecture, and compliance with SOC2, HIPAA, and GDPR standards.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>🌐</div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Global Workspace</h3>
              <p className={styles.featureDescription}>
                Connect teams across continents with localized interfaces, timezone management, and cultural adaptation tools.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>📊</div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Advanced Analytics</h3>
              <p className={styles.featureDescription}>
                Deep insights into productivity patterns, collaboration health, and performance metrics with beautiful visualizations.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>🚀</div>
                <div className={styles.iconGlow}></div>
              </div>
              <h3 className={styles.featureTitle}>Infinite Scale</h3>
              <p className={styles.featureDescription}>
                From startup to enterprise, our platform grows with you. Handle millions of users without breaking a sweat.
              </p>
              <div className={styles.featureAccent}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <div className={styles.testimonialsContainer}>
          <h2 className={styles.sectionTitle}>Loved by Teams Worldwide</h2>
          <div className={styles.testimonialsGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialQuote}>"Game-changing platform that revolutionized our workflow"</div>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}></div>
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>Sarah Chen</div>
                  <div className={styles.authorTitle}>Lead Designer, TechCorp</div>
                </div>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialQuote}>"The AI features saved us 40% of our project time"</div>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}></div>
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>Marcus Johnson</div>
                  <div className={styles.authorTitle}>CTO, StartupXYZ</div>
                </div>
              </div>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.testimonialQuote}>"Seamless collaboration across 12 time zones"</div>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}></div>
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>Elena Rodriguez</div>
                  <div className={styles.authorTitle}>PM, GlobalTech</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      
      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerMain}>
            <div className={styles.footerBrand}>
              <h3 className={styles.brandName}>CollabSpace</h3>
              <p className={styles.brandDescription}>
                Empowering teams to create extraordinary things together.
              </p>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLink}>𝕏</a>
                <a href="#" className={styles.socialLink}>in</a>
                <a href="#" className={styles.socialLink}>f</a>
                <a href="#" className={styles.socialLink}>ig</a>
              </div>
            </div>
            <div className={styles.footerSection}>
              <h4 className={styles.footerTitle}>Product</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>Features</a></li>
                <li><a href="#" className={styles.footerLink}>Pricing</a></li>
                <li><a href="#" className={styles.footerLink}>Security</a></li>
                <li><a href="#" className={styles.footerLink}>Integrations</a></li>
                <li><a href="#" className={styles.footerLink}>API</a></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4 className={styles.footerTitle}>Company</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>About</a></li>
                <li><a href="#" className={styles.footerLink}>Blog</a></li>
                <li><a href="#" className={styles.footerLink}>Careers</a></li>
                <li><a href="#" className={styles.footerLink}>Press</a></li>
                <li><a href="#" className={styles.footerLink}>Contact</a></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4 className={styles.footerTitle}>Resources</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#" className={styles.footerLink}>Help Center</a></li>
                <li><a href="#" className={styles.footerLink}>Documentation</a></li>
                <li><a href="#" className={styles.footerLink}>Community</a></li>
                <li><a href="#" className={styles.footerLink}>Webinars</a></li>
                <li><a href="#" className={styles.footerLink}>Status</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.copyright}>
              © 2024 CollabSpace. All rights reserved.
            </p>
            <div className={styles.footerLegal}>
              <a href="#" className={styles.legalLink}>Privacy</a>
              <a href="#" className={styles.legalLink}>Terms</a>
              <a href="#" className={styles.legalLink}>Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}