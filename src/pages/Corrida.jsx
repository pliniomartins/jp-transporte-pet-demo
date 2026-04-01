import { useState, useRef, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Polyline, useMapEvents, Popup,
} from "react-leaflet";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

// ─── Seu WhatsApp ──────────────────────────────────────────────────────────────
const SEU_WHATSAPP = "5581998400492";

// ─── Áreas de risco ────────────────────────────────────────────────────────────
const AREAS_RISCO = [
  "brejo da guabiraba", "nova descoberta", "córrego da areia", "corrego da areia",
  "córrego do joaquim", "corrego do joaquim", "ibura", "camaragibe", "macaxeira",
  "mangueira", "córrego da bica", "corrego da bica", "passarinho",
  "brasília teimosa", "brasilia teimosa", "muribeca", "barra de jangada",
  "prazeres", "peixinhos", "sítio novo", "sitio novo", "águas compridas",
  "aguas compridas", "sapucaia", "caixa d'água", "caixa dagua", "aguazinha",
  "alto da nação", "alto da nacao", "bultrins", "fragoso",
  "parque do janga", "maranguape 2", "engenho maranguape",
  "comunidade do tururu", "tururu", "artur lundgren 2",
];

const AREAS_SO_ATE_22H = [
  "olinda", "paulista", "abreu e lima", "planalto", "matinha", "caetés velho", "caetes velho",
];

function verificarArea(endereco) {
  const texto = endereco.toLowerCase();
  return {
    ehRisco: AREAS_RISCO.some((a) => texto.includes(a)),
    ehSoAte22h: AREAS_SO_ATE_22H.some((a) => texto.includes(a)),
  };
}

async function geocodificar(texto) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&format=json&limit=5&countrycodes=br`
  );
  return await res.json();
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || "";
  } catch { return ""; }
}

async function calcularSegmento(de, para) {
  const url = `https://router.project-osrm.org/route/v1/driving/${de[1]},${de[0]};${para[1]},${para[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes?.length) return null;
  return {
    distanciaKm: data.routes[0].distance / 1000,
    pontos: data.routes[0].geometry.coordinates.map((p) => [p[1], p[0]]),
  };
}

// ─── Componente clique no mapa ─────────────────────────────────────────────────
function ClickMapa({ aoClicar }) {
  useMapEvents({ click: (e) => aoClicar(e.latlng.lat, e.latlng.lng) });
  return null;
}

// ─── Função de envio WhatsApp ──────────────────────────────────────────────────
function enviarWhatsApp({ endOrigem, paradas, porte, idaVolta, valor, detalhes, avisos }) {
  const hora = new Date().toLocaleString("pt-BR");
  const porteTexto = porte === "grande" ? "Grande (R$ 6/km)" : "Médio (R$ 5/km)";
  const tipoTexto = idaVolta ? "Ida e volta 🔄" : "Só ida 🚗";

  const paradasTexto = paradas
    .filter((p) => p.coords)
    .map((p, i) => `  ${i === 0 ? "🏁 Destino" : `🛑 Parada ${i + 1}`}: ${p.label}`)
    .join("\n");

  const avisosTexto = avisos.length > 0
    ? "\n\n⚠️ *Avisos:*\n" + avisos.map((a) => `  ${a.texto}`).join("\n")
    : "";

  const mensagem =
`🐾 *Nova Corrida - JP Transporte Pet*
📅 ${hora}

📍 *Origem:* ${endOrigem}
${paradasTexto}

🐕 *Porte:* ${porteTexto}
🚦 *Tipo:* ${tipoTexto}
📏 *Distância:* ${detalhes?.distanciaTotal || "—"} km${avisosTexto}

💰 *Valor total: R$ ${valor}*

_Corrida salva no sistema ✅_`;

  const url = `https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  container: { padding: 20, maxWidth: 600, margin: "0 auto" },
  titulo: { textAlign: "center", marginBottom: 16 },
  label: { fontWeight: "bold", fontSize: 13, marginTop: 12, display: "block" },
  input: {
    width: "100%", padding: "10px 12px", fontSize: 15,
    borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box", marginTop: 4,
  },
  sugestoes: {
    background: "#fff", border: "1px solid #ddd", borderRadius: 8,
    marginTop: 2, zIndex: 1000, position: "relative",
  },
  sugestaoItem: {
    padding: "10px 12px", cursor: "pointer", fontSize: 13,
    borderBottom: "1px solid #f0f0f0",
  },
  botao: {
    display: "block", width: "100%", padding: "12px", marginTop: 10,
    fontSize: 15, cursor: "pointer", borderRadius: 8, border: "none",
    background: "#2196f3", color: "white", fontWeight: "bold",
  },
  botaoSalvar: {
    display: "block", width: "100%", padding: "12px", marginTop: 16,
    fontSize: 15, cursor: "pointer", borderRadius: 8, border: "none",
    background: "#4caf50", color: "white", fontWeight: "bold",
  },
  botaoRemover: {
    marginLeft: 8, padding: "4px 10px", fontSize: 12,
    borderRadius: 6, border: "none", background: "#ef5350", color: "white", cursor: "pointer",
  },
  botaoAdicionar: {
    display: "block", width: "100%", padding: "10px", marginTop: 8,
    fontSize: 14, cursor: "pointer", borderRadius: 8,
    border: "2px dashed #90caf9", background: "transparent", color: "#1565c0",
  },
  select: {
    width: "100%", padding: 11, borderRadius: 8, marginTop: 4,
    fontSize: 15, border: "1px solid #ccc", boxSizing: "border-box",
  },
  toggle: { display: "flex", gap: 8, marginTop: 8 },
  toggleBtn: (ativo) => ({
    flex: 1, padding: "10px", borderRadius: 8, fontSize: 14, cursor: "pointer",
    border: "2px solid #2196f3", fontWeight: "bold",
    background: ativo ? "#2196f3" : "#fff",
    color: ativo ? "#fff" : "#2196f3",
  }),
  aviso: (tipo) => ({
    marginTop: 10, padding: "10px 14px", borderRadius: 8,
    fontSize: 13, fontWeight: "bold", textAlign: "center",
    background: tipo === "bloqueado" ? "#ffebee" : tipo === "risco" ? "#fff8e1" : "#e3f2fd",
    color: tipo === "bloqueado" ? "#c62828" : tipo === "risco" ? "#f57f17" : "#1565c0",
    border: `1px solid ${tipo === "bloqueado" ? "#ef9a9a" : tipo === "risco" ? "#ffe082" : "#90caf9"}`,
  }),
  valorBox: {
    textAlign: "center", marginTop: 20, padding: 16,
    background: "#f1f8e9", borderRadius: 12, border: "1px solid #c5e1a5",
  },
};

// ─── Campo de endereço com busca ───────────────────────────────────────────────
function CampoEndereco({ label, valor, onChange, onSelecionar, placeholder }) {
  const [sugestoes, setSugestoes] = useState([]);
  const timerRef = useRef(null);

  const handleChange = (e) => {
    const txt = e.target.value;
    onChange(txt);
    clearTimeout(timerRef.current);
    if (txt.length < 3) { setSugestoes([]); return; }
    timerRef.current = setTimeout(async () => {
      const res = await geocodificar(txt + ", Pernambuco");
      setSugestoes(res.slice(0, 5));
    }, 500);
  };

  const selecionar = (item) => {
    onSelecionar({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
    setSugestoes([]);
  };

  return (
    <div>
      <span style={s.label}>{label}</span>
      <input
        style={s.input}
        value={valor}
        onChange={handleChange}
        placeholder={placeholder || "Digite o endereço..."}
      />
      {sugestoes.length > 0 && (
        <div style={s.sugestoes}>
          {sugestoes.map((item, i) => (
            <div key={i} style={s.sugestaoItem} onClick={() => selecionar(item)}>
              📍 {item.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function Corrida() {
  const [modoEntrada, setModoEntrada] = useState("texto");
  const [posicao, setPosicao] = useState(null);
  const [endOrigem, setEndOrigem] = useState("");
  const [paradas, setParadas] = useState([{ label: "", coords: null }]);
  const [idaVolta, setIdaVolta] = useState(false);
  const [porte, setPorte] = useState("medio");
  const [rota, setRota] = useState([]);
  const [valor, setValor] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [calculando, setCalculando] = useState(false);

  const posicaoRef = useRef(null);
  const mapClickAlvo = useRef(null);

  const pegarLocalizacao = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosicao(coords);
        posicaoRef.current = coords;
        const end = await reverseGeocode(coords[0], coords[1]);
        setEndOrigem(end.split(",").slice(0, 2).join(","));
      },
      (e) => { alert("Erro ao pegar localização"); console.error(e); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selecionarOrigem = (item) => {
    setPosicao([item.lat, item.lng]);
    posicaoRef.current = [item.lat, item.lng];
    setEndOrigem(item.label.split(",").slice(0, 3).join(","));
  };

  const atualizarParada = (index, campo, val) => {
    setParadas((prev) => {
      const novo = [...prev];
      novo[index] = { ...novo[index], [campo]: val };
      return novo;
    });
  };

  const adicionarParada = () => {
    if (paradas.length >= 4) return;
    setParadas((prev) => [...prev, { label: "", coords: null }]);
  };

  const removerParada = (index) => {
    setParadas((prev) => prev.filter((_, i) => i !== index));
  };

  const aoClicarMapa = useCallback(async (lat, lng) => {
    const end = await reverseGeocode(lat, lng);
    const label = end.split(",").slice(0, 3).join(",");
    const alvo = mapClickAlvo.current;
    if (alvo === "origem") {
      setPosicao([lat, lng]);
      posicaoRef.current = [lat, lng];
      setEndOrigem(label);
    } else if (typeof alvo === "number") {
      atualizarParada(alvo, "coords", [lat, lng]);
      atualizarParada(alvo, "label", label);
    }
  }, []);

  const calcular = async () => {
    const pos = posicaoRef.current;
    if (!pos) { alert("Defina a origem primeiro"); return; }
    const paradasValidas = paradas.filter((p) => p.coords);
    if (paradasValidas.length === 0) { alert("Defina ao menos um destino"); return; }

    setCalculando(true);
    setAvisos([]);
    setValor(null);

    try {
      const hora = new Date().getHours();
      const pontos = [pos, ...paradasValidas.map((p) => p.coords)];
      if (idaVolta) pontos.push(pos);

      let distanciaTotal = 0;
      let rotaTotal = [];
      const avisosNovos = [];

      for (let i = 0; i < pontos.length - 1; i++) {
        const seg = await calcularSegmento(pontos[i], pontos[i + 1]);
        if (!seg) { alert("Não foi possível calcular um trecho da rota"); setCalculando(false); return; }
        distanciaTotal += seg.distanciaKm;
        rotaTotal = [...rotaTotal, ...seg.pontos];
      }

      for (const parada of paradasValidas) {
        const { ehRisco, ehSoAte22h } = verificarArea(parada.label);
        if (ehSoAte22h && hora >= 22) {
          avisosNovos.push({ tipo: "bloqueado", texto: `⛔ Sem atendimento após 22h: ${parada.label.split(",")[0]}` });
        }
        if (ehRisco) {
          avisosNovos.push({ tipo: "risco", texto: `⚠️ Área de risco: ${parada.label.split(",")[0]} — taxa de R$ 20,00 adicionada` });
        }
      }

      const temBloqueado = avisosNovos.some((a) => a.tipo === "bloqueado");
      if (temBloqueado) {
        setAvisos(avisosNovos);
        setValor(0);
        setRota(rotaTotal);
        setCalculando(false);
        return;
      }

      const precoKm = porte === "grande" ? 6 : 5;
      let total = distanciaTotal * precoKm;

      if (hora >= 22) {
        const adicNoite = porte === "grande" ? 70 : 50;
        total += adicNoite;
        avisosNovos.push({ tipo: "noite", texto: `🌙 Tarifa noturna: +R$ ${adicNoite},00` });
      }

      const qtdRisco = avisosNovos.filter((a) => a.tipo === "risco").length;
      total += qtdRisco * 20;

      setRota(rotaTotal);
      setValor(Number(total.toFixed(2)));
      setDetalhes({ distanciaTotal: distanciaTotal.toFixed(1), paradas: paradasValidas.length, idaVolta });
      setAvisos(avisosNovos);

    } catch (e) {
      console.error(e);
      alert("Erro ao calcular rota");
    } finally {
      setCalculando(false);
    }
  };

  // ─── Salvar + enviar WhatsApp ────────────────────────────────────────────────
  const salvarCorrida = async () => {
    if (!posicao || paradas.filter((p) => p.coords).length === 0) {
      alert("Preencha origem e destino");
      return;
    }
    if (avisos.some((a) => a.tipo === "bloqueado")) {
      alert("Corrida bloqueada — não é possível salvar.");
      return;
    }
    try {
      await addDoc(collection(db, "corridas"), {
        origem: posicao,
        enderecoOrigem: endOrigem,
        paradas: paradas.filter((p) => p.coords),
        idaVolta,
        porte,
        valor,
        data: new Date(),
        areaRisco: avisos.some((a) => a.tipo === "risco"),
      });

      // ✅ Abre WhatsApp com os dados da corrida após salvar no Firebase
      enviarWhatsApp({ endOrigem, paradas, porte, idaVolta, valor, detalhes, avisos });

    } catch (e) {
      console.error(e);
      alert("Erro ao salvar");
    }
  };

  const todasCoordenadas = [
    posicao,
    ...paradas.filter((p) => p.coords).map((p) => p.coords),
  ].filter(Boolean);

  return (
    <div style={s.container}>
      <h2 style={s.titulo}>🐾 Nova Corrida</h2>

      {/* ── Porte ── */}
      <span style={s.label}>Porte do pet</span>
      <select value={porte} onChange={(e) => setPorte(e.target.value)} style={s.select}>
        <option value="medio">Até porte médio (R$ 5/km)</option>
        <option value="grande">Porte grande (R$ 6/km)</option>
      </select>

      {/* ── Ida e volta ── */}
      <span style={s.label}>Tipo de corrida</span>
      <div style={s.toggle}>
        <button style={s.toggleBtn(!idaVolta)} onClick={() => setIdaVolta(false)}>🚗 Só ida</button>
        <button style={s.toggleBtn(idaVolta)} onClick={() => setIdaVolta(true)}>🔄 Ida e volta</button>
      </div>

      {/* ── Origem ── */}
      <span style={s.label}>📍 Sua localização (origem)</span>
      <div style={s.toggle}>
        <button style={s.toggleBtn(modoEntrada === "gps")} onClick={() => { setModoEntrada("gps"); pegarLocalizacao(); }}>
          📡 Usar GPS
        </button>
        <button style={s.toggleBtn(modoEntrada === "texto")} onClick={() => setModoEntrada("texto")}>
          ✏️ Digitar endereço
        </button>
        <button style={s.toggleBtn(modoEntrada === "mapa")} onClick={() => { setModoEntrada("mapa"); mapClickAlvo.current = "origem"; }}>
          🗺️ Clicar no mapa
        </button>
      </div>

      {modoEntrada === "texto" && (
        <CampoEndereco
          label=""
          valor={endOrigem}
          onChange={setEndOrigem}
          onSelecionar={selecionarOrigem}
          placeholder="Ex: Rua das Flores, 123, Recife"
        />
      )}
      {posicao && (
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          ✅ Origem definida: {endOrigem || `${posicao[0].toFixed(4)}, ${posicao[1].toFixed(4)}`}
        </div>
      )}

      {/* ── Paradas / Destinos ── */}
      <span style={{ ...s.label, marginTop: 16 }}>🏁 Destino(s)</span>
      {paradas.map((parada, i) => (
        <div key={i} style={{ marginTop: 8, padding: "10px 12px", background: "#f5f5f5", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: "bold", color: "#555" }}>
              {i === 0 ? "Destino principal" : `Parada ${i + 1}`}
            </span>
            {i > 0 && (
              <button style={s.botaoRemover} onClick={() => removerParada(i)}>✕ Remover</button>
            )}
          </div>

          <CampoEndereco
            label=""
            valor={parada.label}
            onChange={(txt) => atualizarParada(i, "label", txt)}
            onSelecionar={(item) => {
              atualizarParada(i, "coords", [item.lat, item.lng]);
              atualizarParada(i, "label", item.label.split(",").slice(0, 3).join(","));
            }}
            placeholder="Digite o endereço do destino..."
          />

          <button
            style={{ ...s.botaoAdicionar, marginTop: 6, fontSize: 12 }}
            onClick={() => { mapClickAlvo.current = i; }}
          >
            🗺️ Ou clique no mapa para definir este destino
          </button>

          {parada.coords && (
            <div style={{ fontSize: 11, color: "#4caf50", marginTop: 4 }}>
              ✅ {parada.label || `${parada.coords[0].toFixed(4)}, ${parada.coords[1].toFixed(4)}`}
            </div>
          )}
        </div>
      ))}

      {paradas.length < 4 && (
        <button style={s.botaoAdicionar} onClick={adicionarParada}>
          ➕ Adicionar parada ({paradas.length}/4)
        </button>
      )}

      {/* ── Mapa ── */}
      {(posicao || todasCoordenadas.length > 0) && (
        <MapContainer
          center={posicao || todasCoordenadas[0]}
          zoom={13}
          style={{ height: "350px", marginTop: 16, borderRadius: 12 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickMapa aoClicar={aoClicarMapa} />
          {posicao && (
            <Marker position={posicao}>
              <Popup>📍 Origem</Popup>
            </Marker>
          )}
          {paradas.filter((p) => p.coords).map((p, i) => (
            <Marker key={i} position={p.coords}>
              <Popup>{i === 0 ? "🏁 Destino" : `🛑 Parada ${i + 1}`}</Popup>
            </Marker>
          ))}
          {rota.length > 0 && <Polyline positions={rota} color="#2196f3" weight={4} />}
        </MapContainer>
      )}

      {/* ── Botão calcular ── */}
      <button style={s.botao} onClick={calcular} disabled={calculando}>
        {calculando ? "⏳ Calculando..." : "📊 Calcular corrida"}
      </button>

      {/* ── Avisos ── */}
      {avisos.map((av, i) => (
        <div key={i} style={s.aviso(av.tipo)}>{av.texto}</div>
      ))}

      {/* ── Valor ── */}
      {valor !== null && !avisos.some((a) => a.tipo === "bloqueado") && (
        <div style={s.valorBox}>
          {detalhes && (
            <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              📏 {detalhes.distanciaTotal} km •{" "}
              {detalhes.paradas} {detalhes.paradas === 1 ? "destino" : "paradas"} •{" "}
              {detalhes.idaVolta ? "Ida e volta" : "Só ida"}
            </div>
          )}
          <h2 style={{ margin: 0, color: "#2e7d32" }}>💰 R$ {valor}</h2>
        </div>
      )}

      {/* ── Botão salvar + WhatsApp ── */}
      {valor !== null && !avisos.some((a) => a.tipo === "bloqueado") && (
        <button style={s.botaoSalvar} onClick={salvarCorrida}>
          💾 Salvar e Enviar para WhatsApp 📲
        </button>
      )}
    </div>
  );
}

