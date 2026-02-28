export default function Topbar() {
  return (
    <div
      style={{
        height: "70px",
        background: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
      }}
    >
      <input
        placeholder="Search"
        style={{
          width: "300px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
