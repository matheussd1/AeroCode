import * as readline from 'readline';
import { Database } from './data/Database';
import { Aeronave } from './models/Aeronave';
import { Funcionario } from './models/Funcionario';
import { Peca } from './models/Peca';
import { Etapa } from './models/Etapa';
import { Teste } from './models/Teste';
import { Relatorio } from './models/Relatorio';
import { TipoAeronave, NivelPermissao, TipoPeca, StatusPeca, TipoTeste, ResultadoTeste, StatusEtapa } from './enums';

const db = new Database();
db.carregarDados();

// cria um adm padrão caso o banco esteja vazio
if (db.funcionarios.length === 0) {
    const adminPadrao = new Funcionario("001", "Administrador Chefe", "0000-0000", "Sede Aerocode", "admin", "admin123", NivelPermissao.ADMINISTRADOR);
    db.funcionarios.push(adminPadrao);
    db.salvarDados();
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let usuarioLogado: Funcionario | null = null;


//login
function telaLogin(): void {
    console.clear();
    console.log(`=========================================`);
    console.log(`🔒 AEROCODE - TELA DE AUTENTICAÇÃO`);
    console.log(`=========================================`);
    console.log(`Dica -> Usuário: admin | Senha: admin123\n`);

    rl.question('Usuário: ', (usuarioInput) => {
        rl.question('Senha: ', (senhaInput) => {
            const dadoSalvo = db.funcionarios.find(f => f.usuario === usuarioInput);

            if (dadoSalvo) {
                const func = new Funcionario(dadoSalvo.id, dadoSalvo.nome, dadoSalvo.telefone, dadoSalvo.endereco, dadoSalvo.usuario, dadoSalvo.senha, dadoSalvo.nivelPermissao);
                
                if (func.autenticar(usuarioInput, senhaInput)) {
                    usuarioLogado = func;
                    exibirMenuPrincipal();
                } else {
                    falhaLogin();
                }
            } else {
                falhaLogin();
            }
        });
    });
}

function falhaLogin(): void {
    console.log('\n❌ Falha na autenticação. Usuário ou senha incorretos.');
    rl.question('Pressione [ENTER] para tentar novamente...', () => {
        telaLogin();
    });
}

//menu principal
function exibirMenuPrincipal(): void {
    console.clear();
    console.log(`=========================================`);
    console.log(`✈️  AEROCODE - PAINEL PRINCIPAL`);
    console.log(`👤 Usuário: ${usuarioLogado?.nome} [${usuarioLogado?.nivelPermissao}]`);
    console.log(`=========================================`);
    console.log(`1. Cadastrar nova Aeronave`);
    console.log(`2. Listar Aeronaves`);
    console.log(`3. Cadastrar Funcionário (Apenas Admin)`);
    console.log(`4. Adicionar Peça a uma Aeronave`);
    console.log(`5. Registrar Etapa de Produção`);
    console.log(`6. Realizar Teste em Aeronave`);
    console.log(`7. Gerar Relatório de Entrega (.txt)`);
    console.log(`0. Sair do Sistema`);
    console.log(`=========================================`);
    
    rl.question('Escolha uma opção: ', (opcao) => {
        switch (opcao.trim()) {
            case '1': cadastrarAeronave(); break;
            case '2': listarAeronaves(); break;
            case '3': 
                if (usuarioLogado?.nivelPermissao === NivelPermissao.ADMINISTRADOR) cadastrarFuncionario();
                else acessoNegado();
                break;
            case '4': adicionarPeca(); break;
            case '5': registrarEtapa(); break;
            case '6': registrarTeste(); break;
            case '7': gerarRelatorio(); break;
            case '0':
                console.log('\nSalvando dados e encerrando a Aerocode. Até logo! ✈️');
                db.salvarDados();
                rl.close();
                break;
            default:
                console.log('\n❌ Opção inválida! Tente novamente.');
                pausaParaMenu();
                break;
        }
    });
}

function pausaParaMenu(): void {
    rl.question('\nPressione [ENTER] para voltar ao menu...', () => {
        exibirMenuPrincipal(); 
    });
}

function acessoNegado(): void {
    console.log('\n⛔ Acesso Negado! Apenas administradores podem executar esta ação.');
    pausaParaMenu();
}

//cadastros avioes
function cadastrarAeronave(): void {
    console.log('\n--- CADASTRAR AERONAVE ---');
    rl.question('Código da aeronave (ex: AC-001): ', (codigo) => {
        if (db.aeronaves.some(a => a.codigo === codigo)) {
            console.log(`\n❌ Erro: O código '${codigo}' já está em uso!`);
            return pausaParaMenu();
        }
        rl.question('Modelo (ex: E-190): ', (modelo) => {
            const novaAeronave = new Aeronave(codigo, modelo, TipoAeronave.COMERCIAL, 110, 4500);
            novaAeronave.pecas = [];
            novaAeronave.etapas = [];
            novaAeronave.testes = [];
            
            db.aeronaves.push(novaAeronave);
            db.salvarDados();
            console.log(`\n✅ Aeronave ${codigo} cadastrada com sucesso!`);
            pausaParaMenu();
        });
    });
}

function listarAeronaves(): void {
    console.log('\n--- 📋 AERONAVES CADASTRADAS ---');
    if (db.aeronaves.length === 0) console.log('Nenhuma aeronave.');
    else {
        db.aeronaves.forEach((a, i) => {
            console.log(`✈️  ${i + 1}. [${a.codigo}] Modelo: ${a.modelo} | Peças: ${a.pecas?.length || 0} | Etapas: ${a.etapas?.length || 0} | Testes: ${a.testes?.length || 0}`);
        });
    }
    pausaParaMenu();
}

function cadastrarFuncionario(): void {
    console.log('\n--- CADASTRAR FUNCIONÁRIO ---');
    rl.question('ID: ', (id) => {
        rl.question('Nome: ', (nome) => {
            rl.question('Usuário de login: ', (usuario) => {
                rl.question('Senha de login: ', (senha) => {
                    const novoFuncionario = new Funcionario(id, nome, "-", "-", usuario, senha, NivelPermissao.ENGENHEIRO);
                    db.funcionarios.push(novoFuncionario);
                    db.salvarDados();
                    console.log(`\n✅ Funcionário ${nome} cadastrado!`);
                    pausaParaMenu();
                });
            });
        });
    });
}

// encontra o aviao pelo codigo e garante que ele tem as listas iniciadas
function buscarAeronave(codigo: string): Aeronave | undefined {
    const a = db.aeronaves.find(a => a.codigo === codigo);
    if (a) {
        if (!a.pecas) a.pecas = [];
        if (!a.etapas) a.etapas = [];
        if (!a.testes) a.testes = [];
    }
    return a;
}

function adicionarPeca(): void {
    console.log('\n--- ADICIONAR PEÇA ---');
    rl.question('Código da Aeronave: ', (codigo) => {
        const aeronave = buscarAeronave(codigo);
        if (!aeronave) {
            console.log('❌ Aeronave não encontrada.');
            return pausaParaMenu();
        }
        rl.question('Nome da Peça (ex: Turbina): ', (nomePeca) => {
            const novaPeca = new Peca(nomePeca, TipoPeca.IMPORTADA, "AirParts", StatusPeca.PRONTA);
            aeronave.pecas.push(novaPeca);
            db.salvarDados();
            console.log(`\n✅ Peça '${nomePeca}' instalada na aeronave ${codigo}!`);
            pausaParaMenu();
        });
    });
}

function registrarEtapa(): void {
    console.log('\n--- REGISTRAR ETAPA ---');
    rl.question('Código da Aeronave: ', (codigo) => {
        const aeronave = buscarAeronave(codigo);
        if (!aeronave) {
            console.log('❌ Aeronave não encontrada.');
            return pausaParaMenu();
        }
        rl.question('Nome da Etapa (ex: Montagem das Asas): ', (nomeEtapa) => {
            const novaEtapa = new Etapa(nomeEtapa, "10 dias");
            novaEtapa.status = StatusEtapa.CONCLUIDA; // Simulando que a etapa já foi finalizada
            aeronave.etapas.push(novaEtapa);
            db.salvarDados();
            console.log(`\n✅ Etapa '${nomeEtapa}' concluída na aeronave ${codigo}!`);
            pausaParaMenu();
        });
    });
}

function registrarTeste(): void {
    console.log('\n--- REGISTRAR TESTE ---');
    rl.question('Código da Aeronave: ', (codigo) => {
        const aeronave = buscarAeronave(codigo);
        if (!aeronave) {
            console.log('❌ Aeronave não encontrada.');
            return pausaParaMenu();
        }
        const novoTeste = new Teste(TipoTeste.ELETRICO, ResultadoTeste.APROVADO);
        aeronave.testes.push(novoTeste);
        db.salvarDados();
        console.log(`\n✅ Teste Elétrico APROVADO e registrado na aeronave ${codigo}!`);
        pausaParaMenu();
    });
}

function gerarRelatorio(): void {
    console.log('\n--- GERAR RELATÓRIO DE ENTREGA ---');
    rl.question('Código da Aeronave pronta: ', (codigo) => {
        const aeronave = buscarAeronave(codigo);
        if (!aeronave) {
            console.log('❌ Aeronave não encontrada.');
            return pausaParaMenu();
        }
        
        const relatorio = new Relatorio();
        relatorio.gerarRelatorioAeronave(aeronave);
        pausaParaMenu();
    });
}

//inicia
telaLogin();