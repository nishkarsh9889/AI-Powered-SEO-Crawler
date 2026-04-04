import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import "./createNode.css";

interface ApiResponse {
    status: string;
    statusCode: number;
    message: string;
    data?: any;
    timestamp: string;
}

interface DomainNode {
    _id: string;
    nodePath: string;
    type: string;
}

const CreateNode = () => {
    const navigate = useNavigate();
    const [nodePath, setNodePath] = useState("");
    const [nodeType, setNodeType] = useState("baseNode");
    const [loading, setLoading] = useState(false);
    const [fetchingNodes, setFetchingNodes] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [nodes, setNodes] = useState<DomainNode[]>([]);

    // Fetch all nodes on component mount
    useEffect(() => {
        fetchAllNodes();
    }, []);

    const fetchAllNodes = async () => {
        setFetchingNodes(true);
        setError("");

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setError("No access token found. Please authenticate.");
                setFetchingNodes(false);
                return;
            }

            const response = await axiosInstance.post<ApiResponse>(
                "/domainNode/getAllNodes",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === "success" && response.data.data?.nodes) {
                setNodes(response.data.data.nodes);
            } else {
                setError(response.data.message || "Failed to fetch nodes");
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Session expired. Please authenticate again.");
            } else {
                setError(err.response?.data?.error || "Network error occurred");
            }
        } finally {
            setFetchingNodes(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem('domainToken');

            if (!token) {
                setError("No access token found. Please authenticate.");
                setLoading(false);
                return;
            }

            const response = await axiosInstance.post<ApiResponse>(
                "/domainNode/createOrUpdateDomainNode",
                {
                    nodePath: nodePath.trim(),
                    type: nodeType
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === "success") {
                setSuccess(response.data.message || "Node created/updated successfully!");
                setNodePath("");
                setNodeType("baseNode");

                // Refresh the nodes list
                fetchAllNodes();

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccess("");
                }, 3000);
            } else {
                setError(response.data.message || "Failed to create node");
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Session expired. Please authenticate again.");
            } else {
                setError(err.response?.data?.error || "Network error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const getNodeTypeBadgeClass = (type: string) => {
        switch (type) {
            case "baseNode": return "node-badge base";
            case "customNode": return "node-badge custom";
            default: return "node-badge";
        }
    };

    const getNodeTypeDisplayName = (type: string) => {
        switch (type) {
            case "baseNode": return "Base Node";
            case "customNode": return "Custom Node";
            default: return type;
        }
    };

    const handleNodeClick = (nodeId: string) => {
        navigate(`/nodeDetails/${nodeId}`);
    };

    return (
        <div className="create-node-container">
            {/* Navigation */}
            <nav className="nav-bar">
                <div className="nav-content">
                    <div className="nav-logo">
                        <span className="logo-text">SEO Crawler</span>
                        <span className="logo-badge">Beta</span>
                    </div>
                    <div className="nav-actions">
                        <button
                            className="nav-button"
                            onClick={() => navigate('/getYourPages')}
                        >
                            ← Back to Pages
                        </button>
                    </div>
                </div>
            </nav>

            <div className="main-content">
                {/* Header */}
                <div className="create-header">
                    <div>
                        <h1 className="page-title">Domain Nodes</h1>
                        <p className="page-subtitle">Create and manage nodes to group related pages</p>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="nodes-layout">
                    {/* Left Column - Create Node Form */}
                    <div className="create-form-column">
                        <div className="create-form-section">
                            <div className="form-icon">🌐</div>
                            <h2>Create New Node</h2>

                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="success-message">
                                    <span className="success-icon">✅</span>
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="nodePath">
                                        Node Path <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="nodePath"
                                        value={nodePath}
                                        onChange={(e) => setNodePath(e.target.value)}
                                        placeholder="e.g., /blog, /products, /about-us"
                                        required
                                        disabled={loading}
                                    />
                                    <p className="form-hint">
                                        Enter the URL path that identifies this node
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="nodeType">Node Type</label>
                                    <select
                                        id="nodeType"
                                        value={nodeType}
                                        onChange={(e) => setNodeType(e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="baseNode">Base Node</option>
                                        <option value="customNode">Custom Node</option>
                                    </select>
                                    <p className="form-hint">
                                        Base nodes are automatically created, custom nodes are user-defined
                                    </p>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="submit-button"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="loading-spinner-small"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <span className="button-icon">➕</span>
                                                Create Node
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - Existing Nodes List */}
                    <div className="nodes-list-column">
                        <div className="nodes-list-section">
                            <div className="nodes-header">
                                <h2>Existing Nodes</h2>
                                <div className="nodes-header-right">
                                    <span className="nodes-count">{nodes.length}</span>
                                    <button
                                        className="refresh-button"
                                        onClick={fetchAllNodes}
                                        disabled={fetchingNodes}
                                        title="Refresh list"
                                    >
                                        🔄
                                    </button>
                                </div>
                            </div>

                            {fetchingNodes ? (
                                <div className="nodes-loading">
                                    <div className="loading-spinner"></div>
                                    <p>Loading nodes...</p>
                                </div>
                            ) : nodes.length === 0 ? (
                                <div className="no-nodes">
                                    <div className="no-nodes-icon">📂</div>
                                    <p>No nodes created yet</p>
                                </div>
                            ) : (
                                <div className="nodes-list">
                                    {nodes.map((node) => (
                                        <div
                                            key={node._id}
                                            className="node-list-item"
                                            onClick={() => handleNodeClick(node._id)}
                                        >
                                            <span className={getNodeTypeBadgeClass(node.type)}>
                                                {getNodeTypeDisplayName(node.type)}
                                            </span>
                                            <span className="node-path-name">{node.nodePath}</span>
                                            <span className="node-view-icon">→</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateNode;