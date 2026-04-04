// GetYourPages.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./GetYourPages.css";

interface PageData {
    _id: string;
    domainPageUrl: string;
}

interface ApiResponse {
    status: string;
    statusCode: number;
    message: string;
    data: {
        message: string;
        pages: PageData[];
    };
    timestamp: string;
}

const GetYourPages = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState<PageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredPages, setFilteredPages] = useState<PageData[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        uniqueDomains: 0,
        lastCrawled: "Never"
    });

    useEffect(() => {
        fetchPages();
    }, []);

    useEffect(() => {
        const filtered = pages.filter(page =>
            page.domainPageUrl.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPages(filtered);
    }, [searchTerm, pages]);

    const fetchPages = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setError("No access token found. Please add a domain first.");
                setLoading(false);
                return;
            }

            const response = await axiosInstance.post<ApiResponse>(
                "/domainPage/getDomainPages",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const pagesData: PageData[] = response.data.data.pages;

            if (pagesData && pagesData.length > 0) {
                setPages(pagesData);
                setFilteredPages(pagesData);

                // Calculate stats
                const uniqueDomains = new Set(
                    pagesData.map((page: PageData) =>
                        new URL(page.domainPageUrl).hostname
                    )
                ).size;

                setStats({
                    total: pagesData.length,
                    uniqueDomains,
                    lastCrawled: new Date().toLocaleString()
                });
            } else {
                setError("No pages found for this domain");
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

    const handleCopyUrl = (url: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking copy
        navigator.clipboard.writeText(url);
    };

    const handleRefresh = () => {
        fetchPages();
    };

    const handlePageClick = (pageId: string) => {
        navigate(`/pageDetail/${pageId}`);
    };

    return (
        <div className="pages-container">
            {/* Navigation */}
            <nav className="nav-bar">
                <div className="nav-content">
                    <div className="nav-logo">
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                    <button
                        className="nav-button"
                        onClick={() => navigate('/createDomain')}
                    >
                        ← Add New Domain
                    </button>
                </div>
            </nav>

            <div className="main-content">
                <div className="header-section">
                    <div className="header-left">
                        <h1 className="page-title">Your Crawled Pages</h1>
                        <p className="page-subtitle">
                            View and manage all pages discovered by our crawler
                        </p>
                    </div>
                    <div className="header-actions">
                        <button
                            className="create-node-button"
                            onClick={() => navigate(`/createNode`)}
                        >
                            <span className="button-icon">➕</span>
                            Create Node
                        </button>
                        <button
                            className="enqueue-button"
                            onClick={() => navigate('/enqueueUrl')}
                        >
                            <span className="button-icon">➕</span>
                            Enqueue URL
                        </button>
                        <button
                            className="refresh-button"
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <span className="refresh-icon">↻</span>
                            {loading ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📑</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.total.toLocaleString()}</span>
                            <span className="stat-label">Total Pages</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🌐</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.uniqueDomains}</span>
                            <span className="stat-label">Unique Domains</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏱️</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.lastCrawled}</span>
                            <span className="stat-label">Last Updated</span>
                        </div>
                    </div>
                </div>

                <div className="search-section">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by URL..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm("")}
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <div className="results-count">
                        Showing {filteredPages.length} of {pages.length} pages
                    </div>
                </div>

                {error && (
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Unable to load pages</h3>
                        <p>{error}</p>
                        <button
                            className="retry-button"
                            onClick={fetchPages}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Fetching your pages...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && pages.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-illustration">
                            <span className="empty-icon">📄</span>
                        </div>
                        <h3>No pages found yet</h3>
                        <p>Add a domain and start crawling to see your pages here</p>
                        <button
                            className="primary-button"
                            onClick={() => navigate('/createDomain')}
                        >
                            Add Your First Domain
                        </button>
                    </div>
                )}

                {!loading && !error && pages.length > 0 && (
                    <div className="pages-grid">
                        {filteredPages.map((page) => (
                            <div
                                key={page._id}
                                className="page-card clickable"
                                onClick={() => handlePageClick(page._id)}
                            >
                                <div className="page-icon">📄</div>
                                <div className="page-details">
                                    <h3 className="page-url" title={page.domainPageUrl}>
                                        {page.domainPageUrl}
                                    </h3>
                                    <div className="page-meta">
                                        <span className="page-id">
                                            ID: {page._id.slice(-8)}
                                        </span>
                                        <span className="page-status">
                                            Crawled
                                        </span>
                                    </div>
                                </div>
                                <div className="page-actions">
                                    <button
                                        className="icon-button copy"
                                        onClick={(e) => handleCopyUrl(page.domainPageUrl, e)}
                                        title="Copy URL"
                                    >
                                        📋
                                    </button>
                                    <a
                                        href={page.domainPageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="icon-button visit"
                                        title="Visit page"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        ↗
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && searchTerm && filteredPages.length === 0 && (
                    <div className="no-results">
                        <p>No pages match your search</p>
                        <button
                            className="clear-button"
                            onClick={() => setSearchTerm("")}
                        >
                            Clear Search
                        </button>
                    </div>
                )}

                {/* Footer Note */}
                {!loading && !error && pages.length > 0 && (
                    <div className="footer-note">
                        <p>
                            Showing {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GetYourPages;