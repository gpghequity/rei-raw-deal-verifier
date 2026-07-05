import React, { useState } from 'react';

const MISSING_FIELD_QUESTIONS = {
  Commercial: [
    'Current occupancy rate?',
    'Lease expiration dates?',
    'Tenant concentration (% of income)?',
    'Management quality?',
    'Year built / last major renovation?',
    'Renewal risk - expiring soon?',
    'Major capex needs?',
    'Rent roll stability?',
  ],
  Residential: [
    'Unit count and rent per unit?',
    'How long owned by seller?',
    'Tenant turnover rate?',
    'Lease expiration dates?',
    'Maintenance quality?',
    'Rent vs market?',
    'Eviction/problem tenant history?',
    'Utilities - tenant or owner paid?',
  ],
  Storage: [
    'Current occupancy rate?',
    'Lease terms (month-to-month vs annual)?',
    'Customer concentration?',
    'Management quality?',
    'Facility condition / age?',
    'Renewal risk - contracts expiring?',
    'Climate control / premium features?',
    'Rate competitiveness vs local market?',
  ],
  MHP: [
    'Number of occupied vs vacant lots?',
    'Average lot rent?',
    'Lot ownership vs resident-owned homes?',
    'Average resident tenure?',
    'Utilities - who pays?',
    'Major infrastructure needs?',
    'Pet / occupancy restrictions?',
    'Market demand - wait list?',
  ],
  'RV Park': [
    'Number of occupied vs vacant spaces?',
    'Average nightly/monthly rate?',
    'Seasonal vs year-round usage?',
    'Length of stay (transient vs long-term)?',
    'Amenities (hookups, facilities)?',
    'Infrastructure maintenance needs?',
    'Customer satisfaction / reviews?',
    'Competition in area?',
  ],
  'Mixed-Use': [
    'Breakdown by asset type and income %?',
    'Cross-tenant dependencies?',
    'Blended occupancy rate?',
    'Lease expiration clustering?',
    'Separate utilities / common area costs?',
    'Management complexity?',
    'Refinancing / loan structure?',
    'Market demand by use type?',
  ],
};

type Step = 'upload' | 'confirm' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [form, setForm] = useState({
    address: '',
    asking_price: '',
    gross_income: '',
    seller_expenses: '',
    asset_type: 'Commercial',
  });
  const [missingFieldAnswers, setMissingFieldAnswers] = useState<{ [key: number]: string }>({});
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

  const handleMissingFieldChange = (index: number, value: string) => {
    setMissingFieldAnswers((prev) => ({
      ...prev,
      [index]: value,
    }));
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
      setMissingFieldAnswers({});
      setStep('confirm');
    } catch (err) {
      setUploadError(String(err));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleConfirmAndAnalyze = async () => {
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
      setStep('results');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setForm({
      address: '',
      asking_price: '',
      gross_income: '',
      seller_expenses: '',
      asset_type: 'Commercial',
    });
    setMissingFieldAnswers({});
    setResult(null);
    setPastedText('');
  };

  const questions = MISSING_FIELD_QUESTIONS[form.asset_type as keyof typeof MISSING_FIELD_QUESTIONS] || [];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 40, fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1e3c72', marginBottom: 10 }}>Raw Deal Verifier</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>Bible-Based Property Analysis (All Asset Types)</p>

      {step === 'upload' && (
        <div>
          <div style={{ marginBottom: 40, padding: 20, background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 8 }}>
            <h2 style={{ color: '#1e3c72', marginBottom: 20, fontSize: '1.3rem' }}>STEP 1: Upload or Paste Data</h2>
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
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <div style={{ marginBottom: 30, padding: 20, background: '#e8f4f8', border: '1px solid #80c0d0', borderRadius: 8 }}>
            <h2 style={{ color: '#1e3c72', marginBottom: 20, fontSize: '1.3rem' }}>STEP 2: Confirm & Fill Missing Fields</h2>

            <div style={{ marginBottom: 30, padding: 15, background: 'white', border: '1px solid #ddd', borderRadius: 6 }}>
              <h3 style={{ color: '#1e3c72', marginBottom: 15, fontSize: '1.1rem' }}>SECTION A: Parsed Fields (All Editable)</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="123 Main St, City, State"
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
              </div>
            </div>

            <div style={{ padding: 15, background: 'white', border: '1px solid #ddd', borderRadius: 6 }}>
              <h3 style={{ color: '#1e3c72', marginBottom: 15, fontSize: '1.1rem' }}>SECTION B: Missing Field Questions ({form.asset_type})</h3>
              <p style={{ color: '#666', marginBottom: 15, fontSize: '0.95rem' }}>
                Answer these to refine your analysis (optional but recommended):
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((question, index) => (
                  <div key={index}>
                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 500, fontSize: '0.95rem' }}>
                      {index + 1}. {question}
                    </label>
                    <input
                      type="text"
                      value={missingFieldAnswers[index] || ''}
                      onChange={(e) => handleMissingFieldChange(index, e.target.value)}
                      placeholder="Enter answer..."
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && <div style={{ color: '#c00', padding: 10, background: '#fee', borderRadius: 4, marginTop: 15 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={handleBackToUpload}
                style={{
                  padding: 10,
                  background: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                ← Back to Upload
              </button>

              <button
                onClick={handleConfirmAndAnalyze}
                disabled={loading || !form.address || !form.asking_price || !form.gross_income}
                style={{
                  padding: 10,
                  background: loading ? '#ccc' : '#2a5298',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flex: 2,
                }}
              >
                {loading ? 'Analyzing...' : 'Confirm & Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'results' && result && (
        <div>
          <button
            onClick={handleBackToUpload}
            style={{
              marginBottom: 20,
              padding: 8,
              cursor: 'pointer',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            ← Back
          </button>

          <h2 style={{ color: '#1e3c72', marginBottom: 20 }}>
            STEP 3: Team Analysis Report ({result.calculator_data.asset_type})
          </h2>

          {Object.entries(result.sections || {}).map(([key, section]: [string, any]) => (
            <div key={key} style={{ marginBottom: 30, border: '1px solid #ddd', padding: 20, borderRadius: 4 }}>
              <h3 style={{ color: '#1e3c72', marginBottom: 15 }}>{section.title}</h3>
              {section.rows ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <tbody>
                      {section.rows.map((row: any, i: number) => (
                        <tr key={i} style={{ background: i === 0 ? '#e7e6e6' : i % 2 ? '#f2f2f2' : 'white' }}>
                          {row.map((cell: any, j: number) => (
                            <td key={j} style={{ padding: 10, border: '1px solid #ddd' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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


