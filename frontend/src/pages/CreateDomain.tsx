// CreateDomain.tsx (fixed)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./CreateDomain.css";

interface ApiResponse {
    domain?: {
        _id: string;
        name: string;
        createdAt?: string;
        domainSitemap?: Array<{
            url: string;
            lastModified: string;
            xmlHash: string;
        }>;
    };
    token?: string;
    error?: string;
}

interface SitemapEntry {
    url: string;
    lastModified: string;
}

const CreateDomain = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string>("");

    // Sitemap state
    const [showSitemapSection, setShowSitemapSection] = useState(false);
    const [sitemaps, setSitemaps] = useState<SitemapEntry[]>([
        { url: "", lastModified: new Date().toISOString().split('T')[0] }
    ]);
    const [addingSitemaps, setAddingSitemaps] = useState(false);
    const [sitemapSuccess, setSitemapSuccess] = useState(false);
    const [sitemapError, setSitemapError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(null);

        try {
            const response = await axiosInstance.post("/domain/createDomain", { name });
            const resData = response.data.data; // <-- access the actual payload

            if (resData.domain) {
                setSuccess(resData);
                setShowSitemapSection(true);
                localStorage.setItem('domainToken', resData.token || '');
            } else {
                setError(resData.error || "Something went wrong");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSitemap = () => {
        setSitemaps([...sitemaps, { url: "", lastModified: new Date().toISOString().split('T')[0] }]);
    };

    const handleRemoveSitemap = (index: number) => {
        if (sitemaps.length > 1) {
            const newSitemaps = sitemaps.filter((_, i) => i !== index);
            setSitemaps(newSitemaps);
        }
    };

    const handleSitemapChange = (index: number, field: keyof SitemapEntry, value: string) => {
        const newSitemaps = [...sitemaps];
        newSitemaps[index][field] = value;
        setSitemaps(newSitemaps);
    };

    const handleSubmitSitemaps = async () => {
        const validSitemaps = sitemaps.filter(s => s.url.trim() !== "");

        if (validSitemaps.length === 0) {
            setSitemapError("Please add at least one valid sitemap URL");
            return;
        }

        setAddingSitemaps(true);
        setSitemapError("");

        try {
            const token = localStorage.getItem('domainToken');
            const response = await axiosInstance.post("/domain/addSitemap",
                { sitemaps: validSitemaps },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data) {
                setSitemapSuccess(true);
                setSitemaps([{ url: "", lastModified: new Date().toISOString().split('T')[0] }]);

                setSuccess(prev => ({
                    ...prev!,
                    domain: {
                        ...prev!.domain!,
                        domainSitemap: response.data.domainSitemap
                    }
                }));

                setTimeout(() => setSitemapSuccess(false), 3000);
            }
        } catch (err: any) {
            setSitemapError(err.response?.data?.error || "Failed to add sitemaps");
        } finally {
            setAddingSitemaps(false);
        }
    };

    return (
        <div className="domain-container">
            {/* Navigation */}
            <nav className="nav-bar">
                <div className="nav-content">
                    <div className="nav-logo">
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                    <button
                        className="nav-button"
                        onClick={() => navigate('/getYourPages')}
                    >
                        Get Your Pages →
                    </button>
                </div>
            </nav>

            <div className="main-content">
                {/* Hero Section */}
                <div className="hero-section">
                    <h1 className="hero-title">
                        Monitor your website's SEO performance
                    </h1>
                    <p className="hero-subtitle">
                        Add your domain to start crawling, analyzing, and optimizing your website's search engine presence.
                    </p>
                </div>

                <div className="content-wrapper">
                    {/* Left Column - Information */}
                    <div className="info-column">
                        <div className="info-card">
                            <h2>Why add your domain?</h2>

                            <div className="feature-list">
                                <div className="feature-item">
                                    <div className="feature-icon">🔍</div>
                                    <div className="feature-text">
                                        <h3>Deep Crawling</h3>
                                        <p>Our crawler scans up to 10 levels deep, analyzing every page for SEO optimization.</p>
                                    </div>
                                </div>

                                <div className="feature-item">
                                    <div className="feature-icon">📊</div>
                                    <div className="feature-text">
                                        <h3>SEO Analysis</h3>
                                        <p>Get detailed insights about meta tags, headings, keywords, and content structure.</p>
                                    </div>
                                </div>

                                <div className="feature-item">
                                    <div className="feature-icon">🔗</div>
                                    <div className="feature-text">
                                        <h3>Backlink Detection</h3>
                                        <p>Identify internal and external links to understand your site's link structure.</p>
                                    </div>
                                </div>

                                <div className="feature-item">
                                    <div className="feature-icon">⚡</div>
                                    <div className="feature-text">
                                        <h3>Performance Metrics</h3>
                                        <p>Track page load times, response codes, and overall site health.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="stats-preview">
                                <div className="stat">
                                    <span className="stat-value">10K+</span>
                                    <span className="stat-label">Domains crawled</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">50M+</span>
                                    <span className="stat-label">Pages analyzed</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">99.9%</span>
                                    <span className="stat-label">Uptime</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="form-column">
                        <div className="form-card">
                            <h2>Add New Domain</h2>

                            {!showSitemapSection ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="name">Domain Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="example.com"
                                            required
                                        />
                                        <span className="input-hint">
                                            Enter domain without http:// or https://
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        className="submit-button"
                                        disabled={loading}
                                    >
                                        {loading ? 'Adding domain...' : 'Add Domain'}
                                    </button>
                                </form>
                            ) : (
                                <div className="sitemap-section">
                                    <div className="sitemap-header">
                                        <h3>Add Sitemaps (Optional)</h3>
                                        <p className="sitemap-description">
                                            Adding sitemaps helps us crawl your site more efficiently. You can add multiple sitemaps or skip this step.
                                        </p>
                                    </div>

                                    <div className="sitemaps-list">
                                        {sitemaps.map((sitemap, index) => (
                                            <div key={index} className="sitemap-item">
                                                <div className="sitemap-input-group">
                                                    <input
                                                        type="url"
                                                        placeholder="https://example.com/sitemap.xml"
                                                        value={sitemap.url}
                                                        onChange={(e) => handleSitemapChange(index, 'url', e.target.value)}
                                                        className="sitemap-input"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={sitemap.lastModified}
                                                        onChange={(e) => handleSitemapChange(index, 'lastModified', e.target.value)}
                                                        className="date-input"
                                                    />
                                                </div>
                                                {sitemaps.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="remove-button"
                                                        onClick={() => handleRemoveSitemap(index)}
                                                        title="Remove sitemap"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="add-more-button"
                                        onClick={handleAddSitemap}
                                    >
                                        + Add another sitemap
                                    </button>

                                    <div className="sitemap-actions">
                                        <button
                                            type="button"
                                            className="primary-button"
                                            onClick={handleSubmitSitemaps}
                                            disabled={addingSitemaps}
                                        >
                                            {addingSitemaps ? 'Saving...' : 'Save Sitemaps'}
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => navigate('/getYourPages')}
                                        >
                                            Skip for now
                                        </button>
                                    </div>

                                    {sitemapSuccess && (
                                        <div className="success-message">
                                            ✓ Sitemaps added successfully
                                        </div>
                                    )}

                                    {sitemapError && (
                                        <div className="error-message">
                                            ⚠ {sitemapError}
                                        </div>
                                    )}
                                </div>
                            )}

                            {success && success.domain && !showSitemapSection && (
                                <div className="success-card">
                                    <div className="success-icon">✓</div>
                                    <h3>Domain Added Successfully!</h3>
                                    <p className="domain-name">{success.domain.name}</p>

                                    <div className="token-container">
                                        <label>Access Token</label>
                                        <div className="token-display">
                                            <code>{success.token}</code>
                                            <button
                                                className="copy-button"
                                                onClick={() => navigator.clipboard.writeText(success.token || '')}
                                                title="Copy to clipboard"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p className="token-warning">
                                            Save this token - you'll need it for API requests
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="error-card">
                                    <div className="error-icon">⚠</div>
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDomain;