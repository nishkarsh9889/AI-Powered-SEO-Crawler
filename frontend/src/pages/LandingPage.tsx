import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-content">
                    <div className="logo">
                        <span className="logo-icon">🔍</span>
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                {/* Hero Section */}
                <section className="hero-section">
                    <h1 className="hero-title">
                        SEO Crawler & Analyzer
                    </h1>
                    <p className="hero-subtitle">
                        Automatically crawl your website, analyze SEO metrics, and get AI-powered insights
                        to improve your search engine rankings.
                    </p>
                    <button
                        className="cta-button"
                        onClick={() => navigate('/createDomain')}
                    >
                        Create Your Domain
                        <span className="button-arrow">→</span>
                    </button>
                </section>

                {/* Features Grid */}
                <section className="features-section">
                    <h2 className="section-title">What You Can Do</h2>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🌐</div>
                            <h3>Domain Management</h3>
                            <p>Add and manage multiple domains for comprehensive SEO analysis across all your websites.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔍</div>
                            <h3>Deep Page Crawling</h3>
                            <p>Automatically discover and analyze every page on your domain, including all links and resources.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>SEO Score Analysis</h3>
                            <p>Get detailed SEO scores for each page with metrics for performance, accessibility, and best practices.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🎯</div>
                            <h3>Keyword Tracking</h3>
                            <p>Monitor keyword usage, frequency, and placement in titles, headers, and meta descriptions.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🔗</div>
                            <h3>Link Analysis</h3>
                            <p>Track internal and external links, identify broken links, and analyze link distribution.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🤖</div>
                            <h3>AI Summaries</h3>
                            <p>Generate intelligent summaries of your pages and get AI-powered recommendations for improvement.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>Core Web Vitals</h3>
                            <p>Monitor LCP, FID, CLS, and other performance metrics that impact user experience and rankings.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📁</div>
                            <h3>Node Grouping</h3>
                            <p>Group related pages into nodes (like /blog or /products) for aggregated analysis and insights.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="how-it-works">
                    <h2 className="section-title">How It Works</h2>

                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Create Domain</h3>
                            <p>Add your website domain to the system. The crawler will begin analyzing your site structure.</p>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Automatic Crawling</h3>
                            <p>Our crawler systematically visits every page, collecting SEO data, links, and performance metrics.</p>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Get Detailed Reports</h3>
                            <p>View comprehensive SEO scores, keyword analysis, link reports, and AI-generated insights for each page.</p>
                        </div>

                        <div className="step">
                            <div className="step-number">4</div>
                            <h3>Create Nodes</h3>
                            <p>Group related pages into nodes for aggregated analysis and track performance across sections.</p>
                        </div>
                    </div>
                </section>

                {/* Key Metrics */}
                <section className="metrics-section">
                    <h2 className="section-title">What You'll Get</h2>

                    <div className="metrics-grid">
                        <div className="metric-card">
                            <span className="metric-value">SEO Score</span>
                            <span className="metric-label">Overall page ranking</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-value">Keywords</span>
                            <span className="metric-label">Frequency & placement</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-value">Core Web Vitals</span>
                            <span className="metric-label">Performance metrics</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-value">Link Analysis</span>
                            <span className="metric-label">Internal & external</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-value">Technical SEO</span>
                            <span className="metric-label">Crawlability & security</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-value">AI Insights</span>
                            <span className="metric-label">Smart recommendations</span>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="final-cta">
                    <h2>Ready to analyze your website?</h2>
                    <button
                        className="cta-button large"
                        onClick={() => navigate('/createDomain')}
                    >
                        Create Your Domain Now
                        <span className="button-arrow">→</span>
                    </button>
                    <p className="cta-note">Free trial • No credit card required</p>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="footer">
                <p>© 2026 SEO Crawler. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;