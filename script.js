/* =====================================================
   GESTOK - PAINEL ADMINISTRATIVO
   LOGIN + LOJAS + NOTIFICAÇÕES
===================================================== */

const auth = firebase.auth();
const db = firebase.firestore();


/* =====================================================
   LOGIN
===================================================== */

const loginView =
    document.getElementById("loginView");

const adminView =
    document.getElementById("adminView");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginSenha =
    document.getElementById("loginSenha");

const btnLogin =
    document.getElementById("btnLogin");

const loginStatus =
    document.getElementById("loginStatus");


/* =====================================================
   ADMIN
===================================================== */

const adminNome =
    document.getElementById("adminNome");

const adminEmail =
    document.getElementById("adminEmail");

const btnSair =
    document.getElementById("btnSair");


/* =====================================================
   LOJAS
===================================================== */

const listaLojas =
    document.getElementById("listaLojas");

const campoBusca =
    document.getElementById("campoBusca");

const filtroStatus =
    document.getElementById("filtroStatus");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const statusCarregamento =
    document.getElementById("statusCarregamento");


/* =====================================================
   MODAL
===================================================== */

const modalLoja =
    document.getElementById("modalLoja");

const fecharModal =
    document.getElementById("fecharModal");


/* =====================================================
   NOTIFICAÇÕES
===================================================== */

const formNotificacao =
    document.getElementById("formNotificacao");

const tituloNotificacao =
    document.getElementById("tituloNotificacao");

const tipoNotificacao =
    document.getElementById("tipoNotificacao");

const mensagemNotificacao =
    document.getElementById("mensagemNotificacao");

const btnEnviarNotificacao =
    document.getElementById("btnEnviarNotificacao");

const statusEnvio =
    document.getElementById("statusEnvio");

const contadorMensagem =
    document.getElementById("contadorMensagem");

const listaNotificacoes =
    document.getElementById("listaNotificacoes");

const statusNotificacoes =
    document.getElementById("statusNotificacoes");

const contadorNotificacoes =
    document.getElementById("contadorNotificacoes");

const totalNotificacoes =
    document.getElementById("totalNotificacoes");

const notificacoesTodas =
    document.getElementById("notificacoesTodas");

const notificacoesAtivas =
    document.getElementById("notificacoesAtivas");

const ultimaNotificacao =
    document.getElementById("ultimaNotificacao");


/* =====================================================
   CACHE
===================================================== */

let lojasCache = [];

let notificacoesCache = [];


/* =====================================================
   UTILITÁRIOS
===================================================== */

function escaparHtml(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function formatarData(data) {

    if (!data) {
        return "—";
    }

    let valor;

    try {

        if (
            data &&
            typeof data.toDate === "function"
        ) {

            valor = data.toDate();

        } else if (
            data instanceof Date
        ) {

            valor = data;

        } else {

            valor = new Date(data);

        }

    } catch (erro) {

        return "—";

    }

    if (
        !valor ||
        Number.isNaN(valor.getTime())
    ) {

        return "—";

    }

    return valor.toLocaleString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function obterStatusLoja(loja) {

    const assinatura =
        loja?.assinatura ||
        {};

    const ativa =
        assinatura.ativa === true ||
        loja?.ativa === true;

    if (ativa) {
        return "ativa";
    }

    const pagamento =
        String(
            assinatura.status ||
            loja?.status ||
            ""
        )
        .toLowerCase();

    if (
        pagamento.includes("pagamento") ||
        pagamento.includes("aguard") ||
        pagamento.includes("pendente")
    ) {

        return "pagamento";

    }

    return "inativa";
}


function textoStatusLoja(loja) {

    const status =
        obterStatusLoja(loja);

    if (status === "ativa") {
        return "Ativa";
    }

    if (status === "pagamento") {
        return "Aguardando pagamento";
    }

    return "Inativa";
}


/* =====================================================
   MOSTRAR / ESCONDER LOGIN
===================================================== */

function mostrarLogin() {

    if (loginView) {
        loginView.hidden = false;
    }

    if (adminView) {
        adminView.hidden = true;
    }

}


function mostrarPainelAdmin() {

    if (loginView) {
        loginView.hidden = true;
    }

    if (adminView) {
        adminView.hidden = false;
    }

    carregarLojas();

    carregarNotificacoes();

}


/* =====================================================
   VALIDAR ADMIN
===================================================== */

async function validarAdministrador(usuario) {

    if (!usuario) {
        return false;
    }

    try {

        const snapshot =
            await db
                .collection("admins")
                .doc(usuario.uid)
                .get();

        if (!snapshot.exists) {

            return false;

        }

        const dados =
            snapshot.data() || {};

        if (
            dados.ativo === false
        ) {

            return false;

        }

        if (adminNome) {

            adminNome.textContent =
                dados.nome ||
                "Administrador";

        }

        if (adminEmail) {

            adminEmail.textContent =
                dados.email ||
                usuario.email ||
                "—";

        }

        return true;

    } catch (erro) {

        console.error(
            "Erro ao validar administrador:",
            erro
        );

        return false;

    }

}


/* =====================================================
   LOGIN
===================================================== */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                loginEmail.value.trim();

            const senha =
                loginSenha.value;

            if (
                !email ||
                !senha
            ) {

                loginStatus.textContent =
                    "Preencha e-mail e senha.";

                loginStatus.className =
                    "login-status error";

                return;

            }

            btnLogin.disabled = true;

            btnLogin.textContent =
                "Entrando...";

            loginStatus.textContent =
                "";

            loginStatus.className =
                "login-status";

            try {

                const resultado =
                    await auth
                        .signInWithEmailAndPassword(
                            email,
                            senha
                        );

                const autorizado =
                    await validarAdministrador(
                        resultado.user
                    );

                if (!autorizado) {

                    await auth.signOut();

                    throw new Error(
                        "USUARIO_SEM_ACESSO"
                    );

                }

                loginForm.reset();

                mostrarPainelAdmin();

            } catch (erro) {

                console.error(
                    "Erro no login:",
                    erro
                );

                let mensagem =
                    "Não foi possível entrar.";

                if (
                    erro.code ===
                    "auth/invalid-credential"
                ) {

                    mensagem =
                        "E-mail ou senha incorretos.";

                }

                if (
                    erro.code ===
                    "auth/invalid-email"
                ) {

                    mensagem =
                        "O e-mail informado é inválido.";

                }

                if (
                    erro.code ===
                    "auth/too-many-requests"
                ) {

                    mensagem =
                        "Muitas tentativas. Aguarde alguns instantes.";

                }

                if (
                    erro.message ===
                    "USUARIO_SEM_ACESSO"
                ) {

                    mensagem =
                        "Este usuário não possui acesso ao painel administrativo.";

                }

                loginStatus.textContent =
                    mensagem;

                loginStatus.className =
                    "login-status error";

            } finally {

                btnLogin.disabled =
                    false;

                btnLogin.textContent =
                    "Entrar";

            }

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

if (btnSair) {

    btnSair.addEventListener(
        "click",
        async function () {

            try {

                await auth.signOut();

            } catch (erro) {

                console.error(
                    "Erro ao sair:",
                    erro
                );

            }

        }
    );

}


/* =====================================================
   AUTENTICAÇÃO
===================================================== */

auth.onAuthStateChanged(
    async function (usuario) {

        if (!usuario) {

            mostrarLogin();

            return;

        }

        const autorizado =
            await validarAdministrador(
                usuario
            );

        if (!autorizado) {

            await auth.signOut();

            if (loginStatus) {

                loginStatus.textContent =
                    "Este usuário não possui acesso ao painel administrativo.";

                loginStatus.className =
                    "login-status error";

            }

            mostrarLogin();

            return;

        }

        mostrarPainelAdmin();

    }
);


/* =====================================================
   CARREGAR USUÁRIO DA LOJA
===================================================== */

async function carregarUsuarioDaLoja(
    lojaDoc,
    loja
) {

    try {

        const donoUid =
            loja.donoUid ||
            loja.uid ||
            null;

        if (!donoUid) {

            return "—";

        }

        const usuarioSnapshot =
            await lojaDoc.ref
                .collection("usuarios")
                .doc(donoUid)
                .get();

        if (!usuarioSnapshot.exists) {

            return "—";

        }

        const usuario =
            usuarioSnapshot.data() || {};

        return (
            usuario.usuario ||
            usuario.nomeUsuario ||
            "—"
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar usuário:",
            erro
        );

        return "—";

    }

}


/* =====================================================
   CARREGAR LOJAS
===================================================== */

async function carregarLojas() {

    if (!listaLojas) {
        return;
    }

    statusCarregamento.textContent =
        "Carregando...";

    listaLojas.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="empty-cell"
            >
                Carregando lojas...
            </td>
        </tr>
    `;

    try {

        const lojasSnapshot =
            await db
                .collection("lojas")
                .get();

        const lojas = [];

        for (
            const documento
            of lojasSnapshot.docs
        ) {

            const dados =
                documento.data() || {};

            let quantidadeProdutos = 0;

            let quantidadeUsuarios = 0;

            let quantidadeMovimentacoes = 0;

            try {

                const resultado =
                    await Promise.all([

                        documento.ref
                            .collection("produtos")
                            .get(),

                        documento.ref
                            .collection("usuarios")
                            .get(),

                        documento.ref
                            .collection("movimentacoes")
                            .get()

                    ]);

                quantidadeProdutos =
                    resultado[0].size;

                quantidadeUsuarios =
                    resultado[1].size;

                quantidadeMovimentacoes =
                    resultado[2].size;

            } catch (erroInterno) {

                console.error(
                    "Erro ao carregar subcoleções da loja:",
                    documento.id,
                    erroInterno
                );

            }

            const usuario =
                await carregarUsuarioDaLoja(
                    documento,
                    dados
                );

            lojas.push({

                id:
                    documento.id,

                nome:
                    dados.nome ||
                    "Sem nome",

                codigo:
                    dados.codigo ||
                    dados.codigoLoja ||
                    "—",

                email:
                    dados.email ||
                    "—",

                donoUid:
                    dados.donoUid ||
                    null,

                usuario:
                    usuario,

                assinatura:
                    dados.assinatura ||
                    {},

                ativa:
                    dados.ativa,

                status:
                    dados.status,

                plano:
                    dados.plano,

                criadaEm:
                    dados.criadaEm,

                quantidadeProdutos,
                quantidadeUsuarios,
                quantidadeMovimentacoes

            });

        }

        lojasCache = lojas;

        atualizarResumoLojas();

        renderizarLojas();

        statusCarregamento.textContent =
            `${lojas.length} ${
                lojas.length === 1
                    ? "loja encontrada"
                    : "lojas encontradas"
            }.`;

    } catch (erro) {

        console.error(
            "Erro ao carregar lojas:",
            erro
        );

        lojasCache = [];

        atualizarResumoLojas();

        listaLojas.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-cell error-cell"
                >
                    Não foi possível carregar as lojas.
                </td>
            </tr>
        `;

        statusCarregamento.textContent =
            "Erro ao carregar.";

    }

}


/* =====================================================
   RESUMO DAS LOJAS
===================================================== */

function atualizarResumoLojas() {

    const total =
        lojasCache.length;

    const ativas =
        lojasCache.filter(
            function (loja) {

                return (
                    obterStatusLoja(loja) ===
                    "ativa"
                );

            }
        ).length;

    const pagamento =
        lojasCache.filter(
            function (loja) {

                return (
                    obterStatusLoja(loja) ===
                    "pagamento"
                );

            }
        ).length;

    const produtos =
        lojasCache.reduce(
            function (totalAtual, loja) {

                return (
                    totalAtual +
                    Number(
                        loja.quantidadeProdutos ||
                        0
                    )
                );

            },
            0
        );

    const elementoTotal =
        document.getElementById(
            "totalLojas"
        );

    const elementoAtivas =
        document.getElementById(
            "lojasAtivas"
        );

    const elementoPagamento =
        document.getElementById(
            "lojasPagamento"
        );

    const elementoProdutos =
        document.getElementById(
            "totalProdutos"
        );

    if (elementoTotal) {
        elementoTotal.textContent =
            total;
    }

    if (elementoAtivas) {
        elementoAtivas.textContent =
            ativas;
    }

    if (elementoPagamento) {
        elementoPagamento.textContent =
            pagamento;
    }

    if (elementoProdutos) {
        elementoProdutos.textContent =
            produtos;
    }

}


/* =====================================================
   RENDERIZAR LOJAS
===================================================== */

function renderizarLojas() {

    if (!listaLojas) {
        return;
    }

    const busca =
        String(
            campoBusca?.value ||
            ""
        )
        .trim()
        .toLowerCase();

    const filtro =
        filtroStatus?.value ||
        "";

    const filtradas =
        lojasCache.filter(
            function (loja) {

                const texto =
                    [

                        loja.nome,

                        loja.codigo,

                        loja.email,

                        loja.usuario

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const correspondeBusca =
                    !busca ||
                    texto.includes(
                        busca
                    );

                const correspondeStatus =
                    !filtro ||
                    obterStatusLoja(
                        loja
                    ) === filtro;

                return (
                    correspondeBusca &&
                    correspondeStatus
                );

            }
        );

    if (
        !filtradas.length
    ) {

        listaLojas.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-cell"
                >
                    Nenhuma loja encontrada.
                </td>
            </tr>
        `;

        return;

    }

    listaLojas.innerHTML =
        filtradas
            .map(
                function (loja) {

                    const status =
                        obterStatusLoja(
                            loja
                        );

                    return `
                        <tr>

                            <td>

                                <strong>
                                    ${escaparHtml(
                                        loja.nome
                                    )}
                                </strong>

                            </td>


                            <td>

                                ${escaparHtml(
                                    loja.codigo
                                )}

                            </td>


                            <td>

                                ${escaparHtml(
                                    loja.usuario
                                )}

                            </td>


                            <td>

                                ${escaparHtml(
                                    loja.email
                                )}

                            </td>


                            <td>

                                ${Number(
                                    loja.quantidadeProdutos ||
                                    0
                                )}

                            </td>


                            <td>

                                <span
                                    class="status-pill ${status}"
                                >
                                    ${textoStatusLoja(
                                        loja
                                    )}
                                </span>

                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="view-button"
                                    data-loja-id="${loja.id}"
                                >
                                    Ver
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =====================================================
   CLIQUE NO BOTÃO "VER"
   USANDO EVENT DELEGAÇÃO
===================================================== */

if (listaLojas) {

    listaLojas.addEventListener(
        "click",
        function (event) {

            const botao =
                event.target.closest(
                    ".view-button"
                );

            if (!botao) {
                return;
            }

            const lojaId =
                botao.getAttribute(
                    "data-loja-id"
                );

            if (!lojaId) {

                console.error(
                    "Botão sem ID da loja."
                );

                return;

            }

            abrirModalLoja(
                lojaId
            );

        }
    );

}


/* =====================================================
   FILTROS
===================================================== */

if (campoBusca) {

    campoBusca.addEventListener(
        "input",
        function () {

            renderizarLojas();

        }
    );

}


if (filtroStatus) {

    filtroStatus.addEventListener(
        "change",
        function () {

            renderizarLojas();

        }
    );

}


if (btnAtualizar) {

    btnAtualizar.addEventListener(
        "click",
        function () {

            carregarLojas();

        }
    );

}


/* =====================================================
   ABRIR MODAL DA LOJA
===================================================== */

function abrirModalLoja(id) {

    console.log(
        "Abrindo detalhes da loja:",
        id
    );

    const loja =
        lojasCache.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }
        );

    if (!loja) {

        console.error(
            "Loja não encontrada no cache:",
            id,
            lojasCache
        );

        alert(
            "Não foi possível localizar os dados desta loja."
        );

        return;

    }


    const nome =
        document.getElementById(
            "modalNomeLoja"
        );

    const codigo =
        document.getElementById(
            "modalCodigo"
        );

    const usuario =
        document.getElementById(
            "modalUsuario"
        );

    const email =
        document.getElementById(
            "modalEmail"
        );

    const produtos =
        document.getElementById(
            "modalProdutos"
        );

    const usuarios =
        document.getElementById(
            "modalUsuarios"
        );

    const movimentacoes =
        document.getElementById(
            "modalMovimentacoes"
        );

    const plano =
        document.getElementById(
            "modalPlano"
        );

    const status =
        document.getElementById(
            "modalStatus"
        );


    if (nome) {

        nome.textContent =
            loja.nome ||
            "Sem nome";

    }

    if (codigo) {

        codigo.textContent =
            loja.codigo ||
            "—";

    }

    if (usuario) {

        usuario.textContent =
            loja.usuario ||
            "—";

    }

    if (email) {

        email.textContent =
            loja.email ||
            "—";

    }

    if (produtos) {

        produtos.textContent =
            Number(
                loja.quantidadeProdutos ||
                0
            );

    }

    if (usuarios) {

        usuarios.textContent =
            Number(
                loja.quantidadeUsuarios ||
                0
            );

    }

    if (movimentacoes) {

        movimentacoes.textContent =
            Number(
                loja.quantidadeMovimentacoes ||
                0
            );

    }


    const assinatura =
        loja.assinatura ||
        {};


    if (plano) {

        plano.textContent =
            assinatura.plano ||
            assinatura.nomePlano ||
            loja.plano ||
            "—";

    }

    if (status) {

        status.textContent =
            textoStatusLoja(
                loja
            );

    }


    if (modalLoja) {

        modalLoja.hidden =
            false;

        modalLoja.classList.add(
            "active"
        );

    }

}


/* =====================================================
   FECHAR MODAL
===================================================== */

function fecharModalLoja() {

    if (!modalLoja) {
        return;
    }

    modalLoja.classList.remove(
        "active"
    );

    modalLoja.hidden =
        true;

}


if (fecharModal) {

    fecharModal.addEventListener(
        "click",
        function () {

            fecharModalLoja();

        }
    );

}


if (modalLoja) {

    modalLoja.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modalLoja
            ) {

                fecharModalLoja();

            }

        }
    );

}


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            fecharModalLoja();

        }

    }
);


/* =====================================================
   ABAS
===================================================== */

document
    .querySelectorAll(
        ".admin-tab"
    )
    .forEach(
        function (tab) {

            tab.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            ".admin-tab"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );

                    document
                        .querySelectorAll(
                            ".tab-content"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );

                    this.classList.add(
                        "active"
                    );

                    const nome =
                        this.dataset.tab;

                    const alvo =
                        document.getElementById(
                            nome === "lojas"
                                ? "tabContentLojas"
                                : "tabContentNotificacoes"
                        );

                    if (alvo) {

                        alvo.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );


/* =====================================================
   CONTADOR DE MENSAGEM
===================================================== */

if (mensagemNotificacao) {

    mensagemNotificacao.addEventListener(
        "input",
        function () {

            if (contadorMensagem) {

                contadorMensagem.textContent =
                    `${this.value.length} / 500`;

            }

        }
    );

}


/* =====================================================
   CARREGAR NOTIFICAÇÕES
===================================================== */

async function carregarNotificacoes() {

    if (!listaNotificacoes) {
        return;
    }

    statusNotificacoes.textContent =
        "Carregando...";

    listaNotificacoes.innerHTML = `
        <div class="empty-history">
            Carregando notificações...
        </div>
    `;

    try {

        const snapshot =
            await db
                .collection(
                    "notificacoes"
                )
                .get();


        notificacoesCache =
            snapshot.docs
                .map(
                    function (doc) {

                        return {

                            id:
                                doc.id,

                            ...doc.data()

                        };

                    }
                )
                .sort(
                    function (a, b) {

                        const dataA =
                            a.data &&
                            typeof a.data.toDate ===
                                "function"
                                ? a.data.toDate().getTime()
                                : 0;

                        const dataB =
                            b.data &&
                            typeof b.data.toDate ===
                                "function"
                                ? b.data.toDate().getTime()
                                : 0;

                        return (
                            dataB -
                            dataA
                        );

                    }
                );


        atualizarResumoNotificacoes();

        renderizarNotificacoes();


        statusNotificacoes.textContent =
            "Histórico atualizado.";

    } catch (erro) {

        console.error(
            "Erro ao carregar notificações:",
            erro
        );

        if (statusNotificacoes) {

            statusNotificacoes.textContent =
                "Erro ao carregar.";

        }

        listaNotificacoes.innerHTML = `
            <div class="empty-history error-text">
                Não foi possível carregar as notificações.
            </div>
        `;

    }

}


/* =====================================================
   RESUMO DAS NOTIFICAÇÕES
===================================================== */

function atualizarResumoNotificacoes() {

    const total =
        notificacoesCache.length;

    const todas =
        notificacoesCache.filter(
            function (item) {

                return (
                    item.destino === "todas" ||
                    item.lojasDestino === "todas"
                );

            }
        ).length;

    const ativas =
        notificacoesCache.filter(
            function (item) {

                return (
                    item.ativa !== false
                );

            }
        ).length;


    if (totalNotificacoes) {

        totalNotificacoes.textContent =
            total;

    }

    if (notificacoesTodas) {

        notificacoesTodas.textContent =
            todas;

    }

    if (notificacoesAtivas) {

        notificacoesAtivas.textContent =
            ativas;

    }

    if (contadorNotificacoes) {

        contadorNotificacoes.textContent =
            total;

    }


    if (
        !total ||
        !notificacoesCache[0]
    ) {

        if (ultimaNotificacao) {

            ultimaNotificacao.textContent =
                "—";

        }

        return;

    }


    if (ultimaNotificacao) {

        ultimaNotificacao.textContent =
            formatarData(
                notificacoesCache[0].data
            );

    }

}


/* =====================================================
   RENDERIZAR NOTIFICAÇÕES
===================================================== */

function renderizarNotificacoes() {

    if (!listaNotificacoes) {
        return;
    }

    if (
        !notificacoesCache.length
    ) {

        listaNotificacoes.innerHTML = `
            <div class="empty-history">
                Nenhuma notificação enviada ainda.
            </div>
        `;

        return;

    }


    listaNotificacoes.innerHTML =
        notificacoesCache
            .map(
                function (item) {

                    const tipo =
                        item.tipo ||
                        "informativa";

                    return `
                        <article
                            class="notification-history-card"
                        >

                            <div
                                class="history-card-icon ${escaparHtml(tipo)}"
                            >
                                !
                            </div>

                            <div
                                class="history-card-content"
                            >

                                <div
                                    class="history-card-top"
                                >

                                    <div>

                                        <strong>
                                            ${escaparHtml(
                                                item.titulo ||
                                                "Sem título"
                                            )}
                                        </strong>

                                        <span>
                                            ${escaparHtml(
                                                tipo
                                            )}
                                        </span>

                                    </div>

                                    <button
                                        type="button"
                                        class="delete-notification"
                                        data-id="${item.id}"
                                    >
                                        Excluir
                                    </button>

                                </div>


                                <p>
                                    ${escaparHtml(
                                        item.mensagem ||
                                        ""
                                    )}
                                </p>


                                <small>
                                    ${formatarData(
                                        item.data
                                    )}
                                    · Todas as lojas
                                </small>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");


    listaNotificacoes
        .querySelectorAll(
            ".delete-notification"
        )
        .forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    function () {

                        excluirNotificacao(
                            this.dataset.id
                        );

                    }
                );

            }
        );

}


/* =====================================================
   ENVIAR NOTIFICAÇÃO
===================================================== */

if (formNotificacao) {

    formNotificacao.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const titulo =
                tituloNotificacao.value
                    .trim();

            const mensagem =
                mensagemNotificacao.value
                    .trim();

            const tipo =
                tipoNotificacao.value;


            if (
                !titulo ||
                !mensagem
            ) {

                statusEnvio.textContent =
                    "Preencha título e mensagem.";

                statusEnvio.className =
                    "send-status error";

                return;

            }


            btnEnviarNotificacao.disabled =
                true;

            btnEnviarNotificacao.textContent =
                "Enviando...";

            statusEnvio.textContent =
                "";

            statusEnvio.className =
                "send-status";


            try {

                await db
                    .collection(
                        "notificacoes"
                    )
                    .add({

                        titulo:
                            titulo,

                        mensagem:
                            mensagem,

                        tipo:
                            tipo,

                        destino:
                            "todas",

                        lojasDestino:
                            "todas",

                        ativa:
                            true,

                        data:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp(),

                        criadoPorUid:
                            auth.currentUser?.uid ||
                            null,

                        criadoPorEmail:
                            auth.currentUser?.email ||
                            ""

                    });


                statusEnvio.textContent =
                    "Notificação enviada com sucesso.";

                statusEnvio.className =
                    "send-status success";


                formNotificacao.reset();


                if (contadorMensagem) {

                    contadorMensagem.textContent =
                        "0 / 500";

                }


                await carregarNotificacoes();

            } catch (erro) {

                console.error(
                    "Erro ao enviar notificação:",
                    erro
                );

                statusEnvio.textContent =
                    "Não foi possível enviar a notificação.";

                statusEnvio.className =
                    "send-status error";

            } finally {

                btnEnviarNotificacao.disabled =
                    false;

                btnEnviarNotificacao.textContent =
                    "Enviar notificação";

            }

        }
    );

}


/* =====================================================
   EXCLUIR NOTIFICAÇÃO
===================================================== */

async function excluirNotificacao(id) {

    const confirmar =
        window.confirm(
            "Deseja realmente excluir esta notificação?"
        );

    if (!confirmar) {
        return;
    }

    try {

        await db
            .collection("notificacoes")
            .doc(id)
            .delete();


        await carregarNotificacoes();

    } catch (erro) {

        console.error(
            "Erro ao excluir notificação:",
            erro
        );

        alert(
            "Não foi possível excluir a notificação."
        );

    }

}