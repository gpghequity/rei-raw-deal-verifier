import React, { useState } from 'react';

export default function Home() {
  const [form, setForm] = useState({
    address: '',
    asking_price: '',
    gross_income: '',
    seller_expenses: '',
    asset_type: 'Commercial',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [uploadError, setUploadError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileRead = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleParseData = async () => {
    setUploadError('');
    setUploadLoading(true);

    try {
      let fileContent = '';
      let textToParse = pastedText;

      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput?.files?.length) {
        const file = fileInput.files[0];
        const dataUrl = await handleFileRead(file);
        const base64 = dataUrl.split(',')[1];
        fileContent = base64;
      }

      if (!textToParse && !fileContent) {
        setUploadError('Please paste text or upload a file');
        return;
      }

      const res = await fetch('/api/parse-bulk-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToParse,
          fileContent: fileContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Failed to parse');
        return;
      }

      const parsed = data.parsed;

      if (parsed.address) setForm((prev) => ({ ...prev, address: parsed.address }));
      if (parsed.asking_price) setForm((prev) => ({ ...prev, asking_price: parsed.asking_price }));
      if (parsed.gross_income) setForm((prev) => ({ ...prev, gross_income: parsed.gross_income }));
      if (parsed.seller_expenses) setForm((prev) => ({ ...prev, seller_expenses: parsed.seller_expenses }));
      if (parsed.asset_type) setForm((prev) => ({ ...prev, asset_type: parsed.asset_type }));

      setPastedText('');
      if (fileInput) fileInput.value = '';
      setUploadError('');
    } catch (err) {
      setUploadError(String(err));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: form.address,
          asking_price: parseFloat(form.asking_price) || 0,
          gross_income: parseFloat(form.gross_income) || 0,
          seller_expenses: form.seller_expenses ? parseFloat(form.seller_expenses) : undefined,
          asset_type: form.asset_type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
        return;
      }

      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 40, fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1e3c72', marginBottom: 10 }}>Raw Deal Verifier</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>Bible-Based Property Analysis (All Asset Types)</p>

      {!result ? (
        <div>
          <div style={{ marginBottom: 40, padding: 20, background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 8 }}>
            <h2 style={{ color: '#1e3c72', marginBottom: 20, fontSize: '1.3rem' }}>Quick Load: Upload or Paste Data</h2>
            <p style={{ color: '#666', marginBottom: 15, fontSize: '0.95rem' }}>
              Accepts: .txt, .pdf, .doc, .docx, .xls, .xlsx. Parser will extract address, price, income, and expenses.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Upload File</label>
                <input
                  id="fileInput"
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Or Paste Text</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste property details here..."
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: 10,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontFamily: 'system-ui',
                  }}
                />
              </div>

              {uploadError && (
                <div style={{ color: '#c00', padding: 10, background: '#fee', borderRadius: 4 }}>{uploadError}</div>
              )}

              <button
                onClick={handleParseData}
                disabled={uploadLoading}
                style={{
                  padding: 10,
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                {uploadLoading ? 'Parsing...' : 'Parse Data'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Address *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State"
                required
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Asset Type *</label>
                <select
                  name="asset_type"
                  value={form.asset_type}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                >
                  <option>Commercial</option>
                  <option>Residential</option>
                  <option>Storage</option>
                  <option>MHP</option>
                  <option>RV Park</option>
                  <option>Mixed-Use</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Asking Price *</label>
                <input
                  type="number"
                  name="asking_price"
                  value={form.asking_price}
                  onChange={handleChange}
                  placeholder="700000"
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Annual Gross Income *</label>
                <input
                  type="number"
                  name="gross_income"
                  value={form.gross_income}
                  onChange={handleChange}
                  placeholder="75000"
                  required
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Seller Expenses (Optional)</label>
                <input
                  type="number"
                  name="seller_expenses"
                  value={form.seller_expenses}
                  onChange={handleChange}
                  placeholder="Leave blank to use Bible floor"
                  style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
                />
              </div>
            </div>

            {error && <div style={{ color: '#c00', padding: 10, background: '#fee', borderRadius: 4 }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 12,
                background: '#2a5298',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <button onClick={() => setResult(null)} style={{ marginBottom: 20, padding: 8, cursor: 'pointer' }}>
            ← Back
          </button>

          <h2 style={{ color: '#1e3c72', marginBottom: 20 }}>
            Team Analysis Report ({result.calculator_data.asset_type})
          </h2>

          {Object.entries(result.sections || {}).map(([key, section]: [string, any]) => (
            <div key={key} style={{ marginBottom: 30, border: '1px solid #ddd', padding: 20, borderRadius: 4 }}>
              <h3 style={{ color: '#1e3c72', marginBottom: 15 }}>{section.title}</h3>
              {section.rows ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    {section.rows.map((row, i) => (
                      <tr key={i} style={{ background: i === 0 ? '#e7e6e6' : i % 2 ? '#f2f2f2' : 'white' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: 10, border: '1px solid #ddd' }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ lineHeight: 1.6, color: '#555' }}>{section.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


