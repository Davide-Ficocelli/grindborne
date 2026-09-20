import { useAuth } from "../context/AuthContext";

function DebugPanel() {
  const { isAuthenticated, accessToken, login, logout } = useAuth();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        background: "#eee",
        padding: 8,
      }}
    >
      <p>Authenticated: {String(isAuthenticated)}</p>
      <p>Token: {accessToken?.slice(0, 20) ?? "null"}…</p>
      <button
        onClick={() => login("davide.ficocelli.dev@gmail.com", "ilcorsaronero")}
      >
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

export default DebugPanel;
