export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "white",
          borderRadius: "18px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#075e54",
            color: "white",
            padding: "20px",
          }}
        >
          <strong>NOMAD Property Assistant</strong>
          <div style={{ fontSize: "13px", marginTop: "4px" }}>
            Online
          </div>
        </div>

        <div style={{ padding: "24px", minHeight: "400px" }}>
          <div
            style={{
              background: "#f0f2f5",
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "80%",
            }}
          >
            Hi! 👋 I'm your property assistant.
            <br /><br />
            Are you looking to buy or rent a property in Dubai?
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "16px",
            borderTop: "1px solid #eee",
          }}
        >
          <input
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "20px",
              border: "1px solid #ddd",
            }}
          />

          <button
            style={{
              border: "none",
              background: "#075e54",
              color: "white",
              padding: "0 18px",
              borderRadius: "20px",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
