// EnqueueUrl.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./EnqueueUrl.css";

interface ApiResponse {
    message?: string;
    job?: {
        domainId: string;
        url: string;
    };
    error?: string;
}

const EnqueueUrl = () => {
    const navigate = useNavigate();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string>("");
    const [validationError, setValidationError] = useState<string>("");

    const validateUrl = (input: string): boolean => {
        try {
            new URL(input);
            return true;
        } catch {
            return false;
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUrl(value);

        if (value && !validateUrl(value)) {
            setValidationError("Please enter a valid URL (including http:// or https://)");
        } else {
            setValidationError("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateUrl(url)) {
            setValidationError("Please enter a valid URL");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess(null);

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setError("No access token found. Please add a domain first.");
                setLoading(false);
                return;
            }

            const response = await axiosInstance.post<ApiResponse>(
                "/domainPage/enqueueUrl",
                { url },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.message) {
                setSuccess(response.data);
                setUrl(""); // Clear form on success

                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                    setSuccess(null);
                }, 5000);
            } else {
                setError(response.data.error || "Failed to enqueue URL");
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Session expired. Please add your domain again.");
            } else {
                setError(err.response?.data?.error || "Network error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnother = () => {
        setSuccess(null);
        setUrl("");
    };

    const handleViewPages = () => {
        navigate('/getYourPages');
    };

    return (
        <div className="enqueue-container">
            <nav className="nav-bar">
                <div className="nav-content">
                    <div className="nav-logo">
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                    <div className="nav-actions">
                        <button
                            className="nav-button secondary"
                            onClick={() => navigate('/createDomain')}
                        >
                            ← Add Domain
                        </button>
                        <button
                            className="nav-button primary"
                            onClick={() => navigate('/getYourPages')}
                        >
                            View Pages →
                        </button>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                <div className="header-section">
                    <div className="header-left">
                        <h1 className="page-title">Enqueue URL for Crawling</h1>
                        <p className="page-subtitle">
                            Add individual URLs to be crawled and analyzed by our SEO crawler
                        </p>
                    </div>
                </div>
                <div className="info-cards">
                    <div className="info-card">
                        <div className="info-icon">🔍</div>
                        <div className="info-content">
                            <h3>What happens next?</h3>
                            <p>The URL will be added to our crawling queue and processed within minutes. You'll be able to view the results in your pages list.</p>
                        </div>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">⚡</div>
                        <div className="info-content">
                            <h3>Queue Information</h3>
                            <p>URLs are processed in order of submission. Each URL is crawled with up to 3 retry attempts if needed.</p>
                        </div>
                    </div>
                </div>
                <div className="form-card">
                    <div className="form-card-header">
                        <h2>Add URL to Queue</h2>
                        <span className="header-badge">Single URL</span>
                    </div>

                    <form onSubmit={handleSubmit} className="enqueue-form">
                        <div className="form-group">
                            <label htmlFor="url">
                                URL to Crawl
                                <span className="required-star">*</span>
                            </label>
                            <div className="input-wrapper">
                                <input
                                    id="url"
                                    type="url"
                                    value={url}
                                    onChange={handleUrlChange}
                                    placeholder="https://example.com/page-to-crawl"
                                    required
                                    className={validationError ? 'error' : ''}
                                    disabled={loading}
                                />
                                {url && !validationError && (
                                    <span className="input-valid">✓</span>
                                )}
                            </div>
                            {validationError && (
                                <div className="validation-error">
                                    <span className="error-icon">⚠</span>
                                    {validationError}
                                </div>
                            )}
                            <div className="input-hint">
                                Include full URL with http:// or https://
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={loading || !!validationError || !url}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Adding to Queue...
                                    </>
                                ) : (
                                    <>
                                        <span className="button-icon">➕</span>
                                        Enqueue URL
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => navigate('/getYourPages')}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                    {success && (
                        <div className="success-card">
                            <div className="success-icon">✓</div>
                            <div className="success-content">
                                <h3>URL Enqueued Successfully!</h3>
                                <p className="success-message">{success.message}</p>
                                {success.job && (
                                    <div className="job-details">
                                        <div className="detail-item">
                                            <span className="detail-label">URL:</span>
                                            <span className="detail-value">{success.job.url}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Domain ID:</span>
                                            <span className="detail-value">{success.job.domainId}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Status:</span>
                                            <span className="status-badge">Queued</span>
                                        </div>
                                    </div>
                                )}
                                <div className="success-actions">
                                    <button
                                        className="primary-button"
                                        onClick={handleAddAnother}
                                    >
                                        Add Another URL
                                    </button>
                                    <button
                                        className="secondary-button"
                                        onClick={handleViewPages}
                                    >
                                        View My Pages
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="error-card">
                            <div className="error-icon">⚠</div>
                            <div className="error-content">
                                <h3>Failed to Enqueue URL</h3>
                                <p>{error}</p>
                                <button
                                    className="retry-button"
                                    onClick={() => setError("")}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="queue-info-section">
                    <h3>About URL Queueing</h3>
                    <div className="queue-features">
                        <div className="queue-feature">
                            <span className="feature-number">1</span>
                            <div className="feature-details">
                                <h4>Validation</h4>
                                <p>URLs are validated for correct format before being added to queue</p>
                            </div>
                        </div>
                        <div className="queue-feature">
                            <span className="feature-number">2</span>
                            <div className="feature-details">
                                <h4>Retry Logic</h4>
                                <p>Failed crawls are retried up to 3 times with exponential backoff</p>
                            </div>
                        </div>
                        <div className="queue-feature">
                            <span className="feature-number">3</span>
                            <div className="feature-details">
                                <h4>Unique Jobs</h4>
                                <p>Duplicate URLs for the same domain are automatically deduplicated</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tips Section */}
                <div className="tips-section">
                    <h3>Tips for Better Results</h3>
                    <ul className="tips-list">
                        <li>Ensure the URL is publicly accessible</li>
                        <li>Include the full protocol (https://)</li>
                        <li>Check robots.txt for crawling restrictions</li>
                        <li>Large pages may take longer to process</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EnqueueUrl;