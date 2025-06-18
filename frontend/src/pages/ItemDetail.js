import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`http://localhost:3001/api/items/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Item not found');
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setItem(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching item:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="item-detail-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content">
            <div className="skeleton-field"></div>
            <div className="skeleton-field"></div>
            <div className="skeleton-field"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail-container">
        <div className="error-container">
          <h2>Error loading item</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
            <Link to="/" className="back-button">
              Back to Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-detail-container">
        <div className="error-container">
          <h2>Item not found</h2>
          <p>The item you're looking for doesn't exist.</p>
          <Link to="/" className="back-button">
            Back to Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail-container">
      <div className="item-detail-card">
        <div className="item-header">
          <Link to="/" className="back-link">
            ← Back to Items
          </Link>
          <h1 className="item-title">{item.name}</h1>
        </div>
        
        <div className="item-content">
          <div className="info-row">
            <span className="info-label">Category:</span>
            <span className="info-value category-badge">{item.category}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Price:</span>
            <span className="info-value price">${item.price.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;