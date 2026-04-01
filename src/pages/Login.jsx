import { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Login() {
  const [modo, setModo] = useState("login"); // "login" | "cadastro" | "recuperar"
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [tipoRecuperacao, setTipoRecuperacao] = useState("email"); // "email" | "telefone"
  const [telefoneRecuperacao, setTelefoneRecuperacao] = useState("");
  const nav = useNavigate();

  const login = async () => {
  if (!email || !senha) {
    alert("Preencha email e senha");
    return;
  }

  setCarregando(true);

  setTimeout(() => {
    alert("Modo demonstração 🔒\nLogin simulado com sucesso!");
    nav("/home");
    setCarregando(false);
  }, 1000);
};
  const cadastrar = async () => {
  if (!nome || !telefone || !email || !senha) {
    alert("Preencha todos os campos");
    return;
  }

  setCarregando(true);

  setTimeout(() => {
    alert(`Conta simulada criada! Bem-vindo(a), ${nome} 🐾`);
    nav("/home");
    setCarregando(false);
  }, 1000);
};

 const recuperarPorEmail = async () => {
  if (!email) {
    alert("Digite seu email");
    return;
  }

  setCarregando(true);

  setTimeout(() => {
    alert("Modo demonstração 🔒\nEmail de recuperação simulado!");
    setModo("login");
    setCarregando(false);
  }, 1000);
};
  const recuperarPorTelefone = async () => {
  if (!telefoneRecuperacao) {
    alert("Digite seu telefone");
    return;
  }

  setCarregando(true);

  setTimeout(() => {
    alert("Modo demonstração 🔒\nConta encontrada (simulado)!");
    setModo("login");
    setCarregando(false);
  }, 1000);
};
  return (
    <div style={styles.container}>
      <img src={logo} alt="JP Transporte Pet" style={styles.logo} />
      <h1 style={styles.titulo}>JP Transporte Pet</h1>

      {/* ── Abas login / cadastro ── */}
      {modo !== "recuperar" && (
        <div style={styles.abas}>
          <button style={styles.aba(modo === "login")} onClick={() => setModo("login")}>
            Entrar
          </button>
          <button style={styles.aba(modo === "cadastro")} onClick={() => setModo("cadastro")}>
            Criar Conta
          </button>
        </div>
      )}

      {/* ── ABA RECUPERAR ── */}
      {modo === "recuperar" && (
        <div style={{ ...styles.abas, justifyContent: "center" }}>
          <button style={{ ...styles.aba(true), flex: "none", paddingInline: 24 }}>
            🔑 Recuperar Senha
          </button>
        </div>
      )}

      <div style={styles.card}>

        {/* ── RECUPERAR SENHA ── */}
        {modo === "recuperar" && (
          <>
            {/* Seletor email / telefone */}
            <div style={styles.seletorRecuperar}>
              <button
                style={styles.opcaoRecuperar(tipoRecuperacao === "email")}
                onClick={() => setTipoRecuperacao("email")}
              >
                📧 Por Email
              </button>
              <button
                style={styles.opcaoRecuperar(tipoRecuperacao === "telefone")}
                onClick={() => setTipoRecuperacao("telefone")}
              >
                📱 Por Telefone
              </button>
            </div>

            {tipoRecuperacao === "email" ? (
              <>
                <p style={styles.dica}>
                  Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
                </p>
                <input
                  type="email"
                  placeholder="📧 Seu email"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  style={{ ...styles.botao, opacity: carregando ? 0.7 : 1 }}
                  onClick={recuperarPorEmail}
                  disabled={carregando}
                >
                  {carregando ? "⏳ Enviando..." : "Enviar link de recuperação"}
                </button>
              </>
            ) : (
              <>
                <p style={styles.dica}>
                  Digite seu telefone cadastrado e enviaremos o link de recuperação para o email vinculado.
                </p>
                <input
                  type="tel"
                  placeholder="📱 Seu telefone / WhatsApp"
                  style={styles.input}
                  value={telefoneRecuperacao}
                  onChange={(e) => setTelefoneRecuperacao(e.target.value)}
                />
                <button
                  style={{ ...styles.botao, opacity: carregando ? 0.7 : 1 }}
                  onClick={recuperarPorTelefone}
                  disabled={carregando}
                >
                  {carregando ? "⏳ Buscando..." : "Buscar minha conta"}
                </button>
              </>
            )}

            <p style={styles.trocar}>
              <span style={styles.link} onClick={() => setModo("login")}>
                ← Voltar para o login
              </span>
            </p>
          </>
        )}

        {/* ── CADASTRO ── */}
        {modo === "cadastro" && (
          <>
            <input
              type="text"
              placeholder="👤 Nome do tutor"
              style={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <input
              type="tel"
              placeholder="📱 Telefone / WhatsApp"
              style={styles.input}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </>
        )}

        {/* ── EMAIL e SENHA (login e cadastro) ── */}
        {modo !== "recuperar" && (
          <>
            <input
              type="email"
              placeholder="📧 Email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="🔒 Senha"
              style={styles.input}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </>
        )}

        {modo === "cadastro" && (
          <p style={styles.dica}>A senha deve ter no mínimo 6 caracteres.</p>
        )}

        {modo !== "recuperar" && (
          <button
            style={{ ...styles.botao, opacity: carregando ? 0.7 : 1 }}
            onClick={modo === "login" ? login : cadastrar}
            disabled={carregando}
          >
            {carregando
              ? "⏳ Aguarde..."
              : modo === "login"
              ? "Entrar"
              : "Criar Conta 🐾"}
          </button>
        )}

        {/* ── Link esqueci senha (só no login) ── */}
        {modo === "login" && (
          <p style={{ ...styles.trocar, marginTop: -4 }}>
            <span style={styles.link} onClick={() => setModo("recuperar")}>
              Esqueci minha senha
            </span>
          </p>
        )}

        {modo !== "recuperar" && (
          <p style={styles.trocar}>
            {modo === "login" ? "Não tem conta? " : "Já tem conta? "}
            <span
              style={styles.link}
              onClick={() => setModo(modo === "login" ? "cadastro" : "login")}
            >
              {modo === "login" ? "Cadastre-se" : "Fazer login"}
            </span>
          </p>
        )}
      </div>

      <p style={styles.rodape}>Transporte seguro para seu pet 🐾</p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f0f",
  },
  logo: {
    width: 180,
    marginBottom: 10,
  },
  titulo: {
    color: "#FFD700",
    marginBottom: 16,
  },
  abas: {
    display: "flex",
    marginBottom: 0,
    borderRadius: "12px 12px 0 0",
    overflow: "hidden",
    width: 300,
  },
  aba: (ativa) => ({
    flex: 1,
    padding: "10px 0",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 14,
    background: ativa ? "#FFD700" : "#2a2a2a",
    color: ativa ? "#000" : "#aaa",
    transition: "all 0.2s",
  }),
  card: {
    background: "#1c1c1c",
    padding: 30,
    borderRadius: "0 0 15px 15px",
    width: 300,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#000",
    color: "#fff",
    fontSize: 14,
  },
  botao: {
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
  },
  dica: {
    color: "#888",
    fontSize: 11,
    margin: "-6px 0",
    textAlign: "center",
  },
  trocar: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
    margin: 0,
  },
  link: {
    color: "#FFD700",
    cursor: "pointer",
    fontWeight: "bold",
    textDecoration: "underline",
  },
  rodape: {
    marginTop: 20,
    color: "#aaa",
    fontSize: 12,
  },
  seletorRecuperar: {
    display: "flex",
    gap: 8,
  },
  opcaoRecuperar: (ativa) => ({
    flex: 1,
    padding: "10px 0",
    border: `2px solid ${ativa ? "#FFD700" : "#333"}`,
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 13,
    background: ativa ? "#FFD700" : "#000",
    color: ativa ? "#000" : "#aaa",
    transition: "all 0.2s",
  }),
};