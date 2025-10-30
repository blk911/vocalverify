export default function Home(){
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0f172a"}}>
      <div style={{background:"white",padding:24,borderRadius:16,width:480,maxWidth:"90%"}}>
        <h1 style={{fontSize:24,fontWeight:700,margin:0}}>AM I HUMAN</h1>
        <p style={{marginTop:8,color:"#475569"}}>Baseline home page check.</p>
        <a
          href="/member-dashboard?memberCode=demo"
          style={{display:"inline-block",marginTop:12,padding:"8px 14px",border:"1px solid #e2e8f0",borderRadius:10,textDecoration:"none"}}
        >
          Member
        </a>
        <a
          href="/admin-dashboard"
          style={{display:"inline-block",marginLeft:8,marginTop:12,padding:"8px 14px",border:"1px solid #e2e8f0",borderRadius:10,textDecoration:"none"}}
        >
          Admin
        </a>
      </div>
    </main>
  );
}
