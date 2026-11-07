"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("demo@ushika.local");
  const [password, setPassword] = useState("Demo@123");
  const [loginError, setLoginError] = useState("");
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("Bank statement");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoginError("");
    try {
      const r = await fetch(`${API}/login/`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({email, password})
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Login failed");
      setLoggedIn(true);
    } catch (err) { setLoginError(err.message); }
  }

  async function loadDocs() {
    try {
      const r = await fetch(`${API}/documents/`);
      if (r.ok) setDocs(await r.json());
    } catch {}
  }

  useEffect(() => {
    if (!loggedIn) return;
    loadDocs();
    const timer = setInterval(loadDocs, 4000);
    return () => clearInterval(timer);
  }, [loggedIn]);

  async function upload(e) {
    e.preventDefault();
    if (!file) { setMessage("Please select a PDF or image."); return; }
    setBusy(true); setMessage("");
    const body = new FormData();
    body.append("file", file);
    body.append("document_type", type);
    try {
      const r = await fetch(`${API}/documents/upload/`, {method:"POST", body});
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Upload failed");
      setMessage(`Uploaded successfully. Document #${data.id} queued for processing.`);
      setFile(null);
      e.target.reset();
      await loadDocs();
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  const counts = useMemo(() => ({
    total: docs.length,
    pending: docs.filter(d => ["PENDING","PROCESSING"].includes(d.status)).length,
    completed: docs.filter(d => d.status === "COMPLETED").length,
    failed: docs.filter(d => d.status === "FAILED").length
  }), [docs]);

  if (!loggedIn) return (
    <main className="loginShell">
      <section className="loginCard">
        <div className="brandMark">U</div>
        <p className="eyebrow">USHIKA DIGITAL BANKING</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your banking documents.</p>
        <form onSubmit={login} className="stack">
          <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required /></label>
          <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required /></label>
          {loginError && <p className="error">{loginError}</p>}
          <button className="primary">Sign in to portal</button>
        </form>
        <div className="demoHint"><strong>POC demo access</strong><br/>demo@ushika.local / Demo@123</div>
        <p className="tiny">Demonstration application only. Do not enter real banking credentials.</p>
      </section>
    </main>
  );

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark small">U</span><span>USHIKA</span></div>
        <p className="navLabel">WORKSPACE</p>
        <div className="navItem active">▦ &nbsp; Overview</div>
        <div className="navItem">▤ &nbsp; Documents</div>
        <div className="navItem">◷ &nbsp; Processing activity</div>
        <div className="sideBottom"><div className="avatar">DC</div><div><b>Demo Customer</b><small>Customer account</small></div></div>
      </aside>
      <section className="content">
        <header className="topbar"><div><p className="eyebrow">CUSTOMER WORKSPACE</p><h1>Document overview</h1></div><button className="logout" onClick={()=>setLoggedIn(false)}>Sign out</button></header>
        <div className="welcome"><div><h2>Your documents, in one place.</h2><p>Upload a document and follow its processing progress.</p></div><span className="secure">● Demo environment</span></div>
        <div className="stats">
          <Stat label="Total documents" value={counts.total} symbol="▤"/>
          <Stat label="In progress" value={counts.pending} symbol="◷"/>
          <Stat label="Completed" value={counts.completed} symbol="✓"/>
          <Stat label="Failed" value={counts.failed} symbol="!"/>
        </div>
        <div className="panel uploadPanel">
          <div><p className="eyebrow">DOCUMENT INTAKE</p><h3>Upload a document</h3><p className="muted">PDF, PNG or JPG · Maximum 10 MB</p></div>
          <form onSubmit={upload} className="uploadForm">
            <label>Document category<select value={type} onChange={e=>setType(e.target.value)}><option>Bank statement</option><option>Identity document</option><option>Invoice</option><option>Other financial document</option></select></label>
            <label>Select file<input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0] || null)} /></label>
            <button className="primary" disabled={busy}>{busy ? "Uploading..." : "Upload and process"}</button>
          </form>
          {message && <p className="notice">{message}</p>}
        </div>
        <div className="panel">
          <div className="tableHeading"><div><p className="eyebrow">DOCUMENT REGISTER</p><h3>Recent documents</h3></div><button className="refresh" onClick={loadDocs}>↻ Refresh</button></div>
          <div className="tableWrap"><table><thead><tr><th>DOCUMENT</th><th>CATEGORY</th><th>UPLOADED</th><th>STATUS</th></tr></thead>
          <tbody>{docs.length === 0 ? <tr><td colSpan="4" className="empty">No documents yet. Upload a sample document to begin.</td></tr> :
            docs.map(d=><tr key={d.id}><td><b>▧ &nbsp;{d.original_name}</b><small>Reference #{d.id}</small></td><td>{d.document_type}</td><td>{new Date(d.created_at).toLocaleString()}</td><td><Status value={d.status}/></td></tr>)}
          </tbody></table></div>
        </div>
        {docs.filter(d=>d.status==="COMPLETED").slice(0,3).map(d=><div className="panel result" key={d.id}><p className="eyebrow">DEMO EXTRACTION RESULT · DOCUMENT #{d.id}</p><h3>{d.original_name}</h3><p className="muted">The following fields are simulated sample data, not extracted from your file.</p><div className="resultGrid">{Object.entries(d.extracted_data || {}).map(([k,v])=><div key={k}><small>{k.replaceAll("_"," ").toUpperCase()}</small><b>{v}</b></div>)}</div></div>)}
        <footer>USHIKA Banking Document Portal · Internal POC · Not for real financial data</footer>
      </section>
    </main>
  );
}

function Stat({label,value,symbol}) {
  return <div className="stat"><span>{symbol}</span><small>{label}</small><strong>{value}</strong></div>;
}
function Status({value}) {
  const cls = value === "COMPLETED" ? "done" : value === "FAILED" ? "failed" : "working";
  return <span className={`status ${cls}`}>{value}</span>;
}
