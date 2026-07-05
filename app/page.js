'use client';

import { useState } from 'react';
import { BIBLE } from '../lib/bible-constants.js';

export default function Home() {
  const [formData, setFormData] = useState({
    address: '',
    assetType: 'Single Family',
    price: '',
    grossIncome: '',
    expenses: '',
    userName: '',
    fileData: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show file info
    setMessage({
      type: 'info',
      text: `Parsing ${file.name}... Please wait.`,
    });

    // In a real implementation, this would send to the API
    // For now, just note that a file was selected
    setFormData((prev) => ({
      ...prev,
      fileData: {
        name: file.name,
        size: file.size,
      },
    }));
  };

  const handleTextPaste = (e) => {
    const text = e.target.value;
    // Future: Parse pasted text for property data
    console.log('Text pasted:', text.substring(0, 100));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.address || !formData.price || !formData.grossIncome) {
      setMessage({
        type: 'error',
        text: 'Please fill in Address, Purchase Price, and Gross Annual Income.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: formData.address,
          assetType: formData.assetType,
          price: parseFloat(formData.price.replace(/,/g, '')),
          grossIncome: parseFloat(
            formData.grossIncome.replace(/,/g, '')
          ),
          expenses: formData.expenses
            ? parseFloat(formData.expenses.replace(/,/g, ''))
            : null,
          userName: formData.userName || 'Unknown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();

      setAnalysisResult(data);
      setMessage({
        type: 'success',
        text: `Analysis complete! PDFs generated and uploaded to Google Drive.`,
      });
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred during analysis.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="container">
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>
          Raw Deal Analyzer
        </h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
          Analyze real estate deals using Bible v11.24 underwriting standards
        </p>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Property Address */}
          <div className="form-group">
            <label htmlFor="address">Property Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="e.g., 123 Main St, Lancaster, PA 17601"
              required
            />
          </div>

          {/* Asset Type and Purchase Price */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="assetType">Asset Type</label>
              <select
                id="assetType"
                name="assetType"
                value={formData.assetType}
                onChange={handleInputChange}
              >
                {BIBLE.ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">Purchase Price *</label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 250000"
                required
              />
            </div>
          </div>

          {/* Gross Income and Expenses */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="grossIncome">
                Annual Gross Income *
              </label>
              <input
                type="text"
                id="grossIncome"
                name="grossIncome"
                value={formData.grossIncome}
                onChange={handleInputChange}
                placeholder="e.g., 36000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="expenses">
                Annual Expenses (optional)
              </label>
              <input
                type="text"
                id="expenses"
                name="expenses"
                value={formData.expenses}
                onChange={handleInputChange}
                placeholder="e.g., 9000"
              />
              <small style={{ color: '#666', marginTop: '0.25rem' }}>
                If not provided, {BIBLE.RESIDENTIAL.EXPENSE_FLOOR * 100}% of
                income will be used
              </small>
            </div>
          </div>

          {/* User Name */}
          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              placeholder="e.g., John Smith"
            />
          </div>

          {/* File Upload (Optional) */}
          <div className="form-group">
            <label htmlFor="file">Upload Property Document (optional)</label>
            <input
              type="file"
              id="file"
              onChange={handleFileUpload}
              accept=".pdf,.txt,.csv"
            />
            <small style={{ color: '#666', marginTop: '0.25rem' }}>
              Accepted: PDF, TXT, CSV
            </small>
          </div>

          {/* Text Paste (Optional) */}
          <div className="form-group">
            <label htmlFor="textPaste">Or Paste Property Data (optional)</label>
            <textarea
              id="textPaste"
              onChange={handleTextPaste}
              placeholder="Paste property information here..."
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="loading">⟳</span> Analyzing...
              </>
            ) : (
              'Analyze Deal'
            )}
          </button>
        </form>

        {/* Results Section */}
        {analysisResult && (
          <div className="results">
            <h3 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>
              Analysis Results
            </h3>

            <div className="result-row">
              <span className="result-label">Address:</span>
              <span className="result-value">{analysisResult.address}</span>
            </div>

            <div className="result-row">
              <span className="result-label">Asset Type:</span>
              <span className="result-value">{analysisResult.assetType}</span>
            </div>

            <div className="result-row">
              <span className="result-label">Purchase Price:</span>
              <span className="result-value">
                ${analysisResult.price.toLocaleString()}
              </span>
            </div>

            <div className="result-row">
              <span className="result-label">Bible NOI:</span>
              <span className="result-value">
                ${analysisResult.bibleNOI.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>

            <div className="result-row">
              <span className="result-label">Best Structure:</span>
              <span className="result-value badge badge-pass">
                {analysisResult.bestStructure}
              </span>
            </div>

            {analysisResult.bestPass && (
              <>
                <div className="result-row">
                  <span className="result-label">Annual Pocket:</span>
                  <span className="result-value">
                    ${analysisResult.bestPass.pocket.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )}
                  </span>
                </div>

                <div className="result-row">
                  <span className="result-label">Monthly Pocket:</span>
                  <span className="result-value">
                    ${(
                      analysisResult.bestPass.pocket / 12
                    ).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </>
            )}

            <div className="result-row">
              <span className="result-label">Passing Scenarios:</span>
              <span className="result-value">
                {analysisResult.passCount} of {analysisResult.scenarios.length}
              </span>
            </div>

            {analysisResult.driveFolderLink && (
              <div className="result-row">
                <span className="result-label">PDFs Location:</span>
                <span className="result-value">
                  <a
                    href={analysisResult.driveFolderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3498db', textDecoration: 'none' }}
                  >
                    View on Drive →
                  </a>
                </span>
              </div>
            )}

            {analysisResult.sheetsLink && (
              <div className="result-row">
                <span className="result-label">Sheet Updated:</span>
                <span className="result-value">
                  <a
                    href={analysisResult.sheetsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3498db', textDecoration: 'none' }}
                  >
                    View Sheet →
                  </a>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div
          style={{
            background: '#f9f9f9',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '800px',
            margin: '3rem auto',
            border: '1px solid #e0e0e0',
          }}
        >
          <h4 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            About Bible v11.24
          </h4>
          <ul style={{ lineHeight: '1.8', color: '#555' }}>
            <li>
              <strong>Residential:</strong> LTV 80%, 7% rate, 15% expense floor
            </li>
            <li>
              <strong>Commercial:</strong> LTV 75%, 7.25% rate, 35% expense floor
            </li>
            <li>
              <strong>DSCR Target:</strong> 1.25 minimum (1.15 alternative)
            </li>
            <li>
              <strong>Equity Structures:</strong> 8% IO, 8% Amortizing, or Seller
              Finance
            </li>
            <li>
              <strong>Output:</strong> Seller Letter + Team Analysis + Back
              Office PDFs
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
