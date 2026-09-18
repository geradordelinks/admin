/* =========================================
   GESTOK - PAINEL ADMINISTRATIVO DE LOJAS
   ========================================= */

const dbAdmin = firebase.firestore();
const listaLojas = document.getElementById("listaLojas");
const campoBusca = document.getElementById("campoBusca");
const filtroStatus = document.getElementById("filtroStatus");
const btnAtualizar = document.getElementById("btnAtualizar");
const statusCarregamento = document.getElementById("statusCarregamento");
const modalLoja = document.getElementById("modalLoja");

let lojasCache = [];

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function dataFormatada(timestamp) {
    if (!timestamp) return "—";
    const data = typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);
    if (Number.isNaN(data.getTime())) return "—";
    return data.toLocaleDateString("pt-BR");
}

function statusLoja(loja) {
    const assinatura = loja.assinatura || {};
    if (assinatura.status) return assinatura.status;
    if (loja.ativo === false) return "inativa";
    return "desconhecida";
}

function textoStatus(status) {
    const mapa = {
        ativa: "Ativa",
        aguardando_pagamento: "Aguardando pagamento",
        inativa: "Inativa",
        expirada: "Expirada",
        cancelada: "Cancelada"
    };
    return mapa[status] || status || "Não informado";
}

async function carregarResumoLoja(lojaDoc) {
    const loja = lojaDoc.data() || {};
    const produtosSnap = await lojaDoc.ref.collection("produtos").get();
    const usuariosSnap = await lojaDoc.ref.collection("usuarios").get();
    const movimentacoesSnap = await lojaDoc.ref.collection("movimentacoes").get();

    return {
        id: lojaDoc.id,
        ...loja,
        quantidadeProdutos: produtosSnap.size,
        quantidadeUsuarios: usuariosSnap.size,
        quantidadeMovimentacoes: movimentacoesSnap.size
    };
}

async function carregarLojas() {
    statusCarregamento.textContent = "Carregando...";
    listaLojas.innerHTML = `<tr><td colspan="8" class="empty-cell">Carregando lojas...</td></tr>`;

    try {
        const usuario = firebase.auth().currentUser;

        if (!usuario) {
            listaLojas.innerHTML = `<tr><td colspan="8" class="empty-cell">Faça login no Gestok para acessar este painel.</td></tr>`;
            statusCarregamento.textContent = "Não autenticado";
            return;
        }

        const lojasSnap = await dbAdmin.collection("lojas").get();
        lojasCache = await Promise.all(
            lojasSnap.docs.map(carregarResumoLoja)
        );

        lojasCache.sort((a, b) => {
            const nomeA = String(a.nome || "").toLowerCase();
            const nomeB = String(b.nome || "").toLowerCase();
            return nomeA.localeCompare(nomeB, "pt-BR");
        });

        atualizarResumo();
        renderizarLojas();
        statusCarregamento.textContent = `${lojasCache.length} loja(s)`;
    } catch (erro) {
        console.error("Erro ao carregar lojas:", erro);
        listaLojas.innerHTML = `<tr><td colspan="8" class="empty-cell">Não foi possível carregar as lojas. Verifique as regras do Firestore.</td></tr>`;
        statusCarregamento.textContent = "Erro ao carregar";
    }
}

function atualizarResumo() {
    const total = lojasCache.length;
    const ativas = lojasCache.filter(loja => statusLoja(loja) === "ativa").length;
    const pendentes = lojasCache.filter(loja => statusLoja(loja) === "aguardando_pagamento").length;
    const produtos = lojasCache.reduce((totalProdutos, loja) => totalProdutos + loja.quantidadeProdutos, 0);

    document.getElementById("totalLojas").textContent = total;
    document.getElementById("lojasAtivas").textContent = ativas;
    document.getElementById("lojasPendentes").textContent = pendentes;
    document.getElementById("totalProdutos").textContent = produtos;
}

function renderizarLojas() {
    const busca = campoBusca.value.trim().toLowerCase();
    const filtro = filtroStatus.value;

    const lojasFiltradas = lojasCache.filter(loja => {
        const status = statusLoja(loja);
        const texto = [
            loja.nome,
            loja.codigo,
            loja.email,
            loja.id
        ].join(" ").toLowerCase();

        return texto.includes(busca) &&
            (filtro === "todos" || status === filtro);
    });

    if (!lojasFiltradas.length) {
        listaLojas.innerHTML = `<tr><td colspan="8" class="empty-cell">Nenhuma loja encontrada.</td></tr>`;
        return;
    }

    listaLojas.innerHTML = lojasFiltradas.map(loja => {
        const status = statusLoja(loja);
        const classeStatus = ["ativa", "aguardando_pagamento", "inativa"].includes(status)
            ? status
            : "desconhecida";

        return `
            <tr>
                <td>
                    <strong>${escaparHtml(loja.nome || "Sem nome")}</strong>
                    <span class="sub">ID: ${escaparHtml(loja.id)}</span>
                </td>
                <td><strong>${escaparHtml(loja.codigo || "—")}</strong></td>
                <td>${escaparHtml(loja.nome || "—")}</td>
                <td>${escaparHtml(loja.email || "—")}</td>
                <td>${loja.quantidadeProdutos}</td>
                <td><span class="status ${classeStatus}">${escaparHtml(textoStatus(status))}</span></td>
                <td>${dataFormatada(loja.criadaEm)}</td>
                <td><button class="view-button" data-loja-id="${escaparHtml(loja.id)}">Ver</button></td>
            </tr>
        `;
    }).join("");
}

function abrirDetalhes(lojaId) {
    const loja = lojasCache.find(item => item.id === lojaId);
    if (!loja) return;

    const assinatura = loja.assinatura || {};

    document.getElementById("modalNome").textContent = loja.nome || "Sem nome";
    document.getElementById("modalCodigo").textContent = `Código: ${loja.codigo || "—"}`;
    document.getElementById("modalResponsavel").textContent = loja.nome || "—";
    document.getElementById("modalEmail").textContent = loja.email || "—";
    document.getElementById("modalProdutos").textContent = loja.quantidadeProdutos;
    document.getElementById("modalUsuarios").textContent = loja.quantidadeUsuarios;
    document.getElementById("modalMovimentacoes").textContent = loja.quantidadeMovimentacoes;
    document.getElementById("modalStatus").textContent = textoStatus(statusLoja(loja));
    document.getElementById("modalPlano").textContent = assinatura.plano || "—";
    document.getElementById("modalPagamento").textContent = assinatura.pagamento || "—";
    document.getElementById("modalVencimento").textContent = dataFormatada(assinatura.vencimento);
    document.getElementById("modalUid").textContent = loja.donoUid || "—";

    modalLoja.classList.remove("hidden");
}

listaLojas.addEventListener("click", event => {
    const botao = event.target.closest("[data-loja-id]");
    if (botao) abrirDetalhes(botao.dataset.lojaId);
});

campoBusca.addEventListener("input", renderizarLojas);
filtroStatus.addEventListener("change", renderizarLojas);
btnAtualizar.addEventListener("click", carregarLojas);

document.getElementById("fecharModal").addEventListener("click", () => {
    modalLoja.classList.add("hidden");
});

document.querySelector("[data-fechar-modal]").addEventListener("click", () => {
    modalLoja.classList.add("hidden");
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") modalLoja.classList.add("hidden");
});

firebase.auth().onAuthStateChanged(usuario => {
    if (usuario) carregarLojas();
    else {
        statusCarregamento.textContent = "Não autenticado";
        listaLojas.innerHTML = `<tr><td colspan="8" class="empty-cell">Faça login no Gestok para acessar este painel.</td></tr>`;
    }
});
