/* =========================================
   GESTOK - PAINEL ADMINISTRATIVO
   PROJETO SEPARADO DO GESTOK
   ========================================= */

const db = firebase.firestore();

const adminView = document.getElementById("adminView");
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

    let data;

    if (timestamp && typeof timestamp.toDate === "function") {
        data = timestamp.toDate();
    } else if (timestamp && timestamp.seconds) {
        data = new Date(timestamp.seconds * 1000);
    } else {
        data = new Date(timestamp);
    }

    if (Number.isNaN(data.getTime())) return "—";

    return data.toLocaleDateString("pt-BR");
}

function statusLoja(loja) {
    const assinatura = loja.assinatura || {};

    if (assinatura.status) {
        return String(assinatura.status).toLowerCase();
    }

    if (loja.ativo === false) {
        return "inativa";
    }

    return "desconhecida";
}

function textoStatus(status) {
    const mapa = {
        ativa: "Ativa",
        aguardando_pagamento: "Aguardando pagamento",
        inativa: "Inativa",
        expirada: "Expirada",
        cancelada: "Cancelada",
        desconhecida: "Não informado"
    };

    return mapa[status] || status || "Não informado";
}

async function carregarResumoLoja(lojaDoc) {
    const loja = lojaDoc.data() || {};

    const [produtosSnap, usuariosSnap, movimentacoesSnap] =
        await Promise.all([
            lojaDoc.ref.collection("produtos").get(),
            lojaDoc.ref.collection("usuarios").get(),
            lojaDoc.ref.collection("movimentacoes").get()
        ]);

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
    listaLojas.innerHTML =
        `<tr><td colspan="8" class="empty-cell">Carregando lojas...</td></tr>`;

    try {
        const lojasSnap = await db.collection("lojas").get();

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

        statusCarregamento.textContent =
            `${lojasCache.length} loja(s) encontrada(s)`;

    } catch (erro) {
        console.error("Erro ao carregar lojas:", erro);

        let mensagem =
            "Não foi possível carregar as lojas.";

        if (erro.code === "permission-denied") {
            mensagem =
                "Acesso negado pelo Firestore. As regras ainda precisam permitir o acesso administrativo.";
        }

        listaLojas.innerHTML =
            `<tr><td colspan="8" class="empty-cell">${escaparHtml(mensagem)}</td></tr>`;

        statusCarregamento.textContent = "Erro";
    }
}

function atualizarResumo() {
    const total = lojasCache.length;

    const ativas = lojasCache.filter(
        loja => statusLoja(loja) === "ativa"
    ).length;

    const pendentes = lojasCache.filter(
        loja => statusLoja(loja) === "aguardando_pagamento"
    ).length;

    const produtos = lojasCache.reduce(
        (totalProdutos, loja) =>
            totalProdutos + Number(loja.quantidadeProdutos || 0),
        0
    );

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
            loja.id,
            loja.donoUid
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return (
            texto.includes(busca) &&
            (filtro === "todos" || status === filtro)
        );
    });

    if (!lojasFiltradas.length) {
        listaLojas.innerHTML =
            `<tr><td colspan="8" class="empty-cell">Nenhuma loja encontrada.</td></tr>`;
        return;
    }

    listaLojas.innerHTML = lojasFiltradas.map(loja => {
        const status = statusLoja(loja);

        const classesPermitidas = [
            "ativa",
            "aguardando_pagamento",
            "inativa",
            "expirada",
            "cancelada"
        ];

        const classeStatus =
            classesPermitidas.includes(status)
                ? status
                : "desconhecida";

        const responsavel =
            loja.responsavel ||
            loja.nomeResponsavel ||
            loja.nome ||
            "—";

        return `
            <tr>
                <td>
                    <strong>${escaparHtml(loja.nome || "Sem nome")}</strong>
                    <span class="sub">ID: ${escaparHtml(loja.id)}</span>
                </td>

                <td>
                    <strong>${escaparHtml(loja.codigo || "—")}</strong>
                </td>

                <td>
                    ${escaparHtml(responsavel)}
                </td>

                <td>
                    ${escaparHtml(loja.email || "—")}
                </td>

                <td>
                    ${Number(loja.quantidadeProdutos || 0)}
                </td>

                <td>
                    <span class="status ${classeStatus}">
                        ${escaparHtml(textoStatus(status))}
                    </span>
                </td>

                <td>
                    ${dataFormatada(loja.criadaEm)}
                </td>

                <td>
                    <button
                        class="view-button"
                        data-loja-id="${escaparHtml(loja.id)}">
                        Ver
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function abrirDetalhes(lojaId) {
    const loja = lojasCache.find(
        item => item.id === lojaId
    );

    if (!loja) return;

    const assinatura = loja.assinatura || {};

    const responsavel =
        loja.responsavel ||
        loja.nomeResponsavel ||
        loja.nome ||
        "—";

    document.getElementById("modalNome").textContent =
        loja.nome || "Sem nome";

    document.getElementById("modalCodigo").textContent =
        `Código: ${loja.codigo || "—"}`;

    document.getElementById("modalResponsavel").textContent =
        responsavel;

    document.getElementById("modalEmail").textContent =
        loja.email || "—";

    document.getElementById("modalProdutos").textContent =
        loja.quantidadeProdutos || 0;

    document.getElementById("modalUsuarios").textContent =
        loja.quantidadeUsuarios || 0;

    document.getElementById("modalMovimentacoes").textContent =
        loja.quantidadeMovimentacoes || 0;

    document.getElementById("modalStatus").textContent =
        textoStatus(statusLoja(loja));

    document.getElementById("modalPlano").textContent =
        assinatura.plano ||
        loja.plano ||
        "—";

    document.getElementById("modalPagamento").textContent =
        assinatura.pagamento ||
        assinatura.statusPagamento ||
        loja.pagamento ||
        "—";

    document.getElementById("modalVencimento").textContent =
        dataFormatada(assinatura.vencimento);

    document.getElementById("modalUid").textContent =
        loja.donoUid || "—";

    modalLoja.classList.remove("hidden");
}

function fecharModal() {
    modalLoja.classList.add("hidden");
}

loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = adminEmail.value.trim();
    const senha = adminSenha.value;

    loginErro.textContent = "";
    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando...";

    try {
        await auth.signInWithEmailAndPassword(email, senha);
    } catch (erro) {
        console.error("Erro no login administrativo:", erro);

        const mapa = {
            "auth/invalid-email":
                "E-mail inválido.",
            "auth/user-not-found":
                "Usuário não encontrado.",
            "auth/wrong-password":
                "Senha incorreta.",
            "auth/invalid-credential":
                "E-mail ou senha incorretos.",
            "auth/too-many-requests":
                "Muitas tentativas. Aguarde um pouco.",
            "auth/network-request-failed":
                "Falha de conexão."
        };

        loginErro.textContent =
            mapa[erro.code] ||
            "Não foi possível entrar. Verifique os dados.";
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Entrar";
    }
});

btnAtualizar.addEventListener(
    "click",
    carregarLojas
);

campoBusca.addEventListener(
    "input",
    renderizarLojas
);

filtroStatus.addEventListener(
    "change",
    renderizarLojas
);

listaLojas.addEventListener("click", event => {
    const botao = event.target.closest("[data-loja-id]");

    if (botao) {
        abrirDetalhes(botao.dataset.lojaId);
    }
});

document.getElementById("fecharModal")
    .addEventListener("click", fecharModal);

document.querySelector("[data-fechar-modal]")
    .addEventListener("click", fecharModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        fecharModal();
    }
});
document.addEventListener("DOMContentLoaded", () => {
    adminView.classList.remove("hidden");
    carregarLojas();
});
