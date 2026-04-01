import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>🐾 JP Transporte Pet</h1>

      <button style={styles.botao} onClick={() => nav("/corrida")}>
        🚗 Solicitar Corrida
      </button>

      <button style={styles.botao} onClick={() => nav("/historico")}>
        📜 Histórico
      </button>

      <a style={styles.whats} href="https://wa.me/5581998400492">
        💬 WhatsApp
      </a>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    padding: 40,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  botao: {
    width: "80%",
    padding: 15,
    fontSize: 16,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#2ecc71",
    color: "#fff",
  },
  whats: {
    marginTop: 20,
    color: "green",
    textDecoration: "none",
    fontWeight: "bold",
  },
};