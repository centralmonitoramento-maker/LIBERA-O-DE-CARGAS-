import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  Presentation, 
  Info, 
  FileText, 
  Truck, 
  ClipboardCheck, 
  LayoutDashboard, 
  ShieldCheck, 
  Layers, 
  Compass 
} from 'lucide-react';

interface GuideStep {
  id: number;
  title: string;
  role: string;
  icon: React.ComponentType<any>;
  image: string;
  summary: string;
  procedures: string[];
  keyValidations: string[];
  slideContent: {
    heading: string;
    bulletPoints: string[];
    keyMetric: string;
  };
  presentationTips: string;
  geminiPrompt: string;
}

export const GuideView: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const steps: GuideStep[] = [
    {
      id: 1,
      title: 'Passo 1: Portaria e Check-in de Veículos',
      role: 'Operador de Portaria / Prevenção de Perdas',
      icon: ClipboardCheck,
      image: '/src/assets/images/guia_passo_1_portaria_1783626314366.jpg',
      summary: 'Porta de entrada do sistema. É onde se inicia o controle operacional, identificando o veículo, motorista e registrando as primeiras evidências fotográficas obrigatórias.',
      procedures: [
        'Acessar o módulo "PORTARIA" no menu lateral do sistema.',
        'Localizar o veículo na lista de cargas agendadas ou realizar uma nova inclusão caso não esteja pré-cadastrado.',
        'Coletar e registrar os dados principais: Placa do veículo, Nome do Motorista e número do Lacre físico.',
        'Utilizar a câmera integrada ou upload para capturar as 3 fotos obrigatórias de evidência: Foto da Placa, Foto do Lacre Físico Integro, e Foto do Romaneio/Manifesto de Carga.'
      ],
      keyValidations: [
        'Conformidade física da placa em relação ao documento do veículo.',
        'Integridade física do lacre aplicado antes de permitir o fluxo.',
        'Checagem de itens pendentes na lista de checklist rápida.'
      ],
      slideContent: {
        heading: 'Controle de Portaria e Entrada Segura',
        bulletPoints: [
          'Cadastro e check-in imediato de veículos em trânsito com busca inteligente.',
          'Upload obrigatório de 3 evidências visuais críticas: Placa, Lacre e Romaneio.',
          'Checklist físico e sistêmico para mitigação de erros manuais no recebimento.',
          'Operabilidade offline garantida para portarias distantes do sinal principal de rede.'
        ],
        keyMetric: 'Meta de Check-in: < 3 minutos por veículo'
      },
      presentationTips: 'Destaque como a captura das 3 fotos obrigatórias na portaria protege a empresa contra fraudes e elimina disputas sobre a integridade do lacre logo na entrada.',
      geminiPrompt: `Crie um slide de apresentação corporativa profissional para o sistema CargaRadar com as seguintes especificações:
- TÍTULO: Controle de Entrada e Check-in de Portaria
- SUBTÍTULO: Primeira Barreira de Segurança e Registro de Evidências
- ESTRUTURA DOS TÓPICOS:
  * Registro Ágil: Pesquisa rápida por placa e check-in em menos de 3 minutos.
  * Tríade de Evidências Visuais: Registro fotográfico obrigatório da Placa do veículo, integridade do Lacre e Romaneio de carga.
  * Checklist Sistêmico: Verificação física integrada para garantir que nenhum veículo avance sem validação dos dados de origem.
  * Operação Resiliente: Funcionamento offline completo com sincronização em tempo real quando reestabelecido.
- MÉTRICA EM DESTAQUE: Tempo médio de registro reduzido para menos de 3 minutos.
- ESTILO VISUAL: Design limpo, alta tecnologia, fundo escuro com tons de roxo cósmico e detalhes em dourado.`
    },
    {
      id: 2,
      title: 'Passo 2: Expedição, Carregamento e Lacre',
      role: 'Operador de Expedição / Conferente',
      icon: Truck,
      image: '/src/assets/images/guia_passo_2_expedicao_1783626325381.jpg',
      summary: 'Fase de carregamento físico nas docas do Centro de Distribuição. Onde é feita a contagem exata dos paletes, o fechamento do baú e a aplicação e registro de lacre de segurança.',
      procedures: [
        'Acessar o módulo de "EXPEDIÇÃO" para visualizar os carregamentos em andamento.',
        'Inserir a quantidade exata de paletes carregados (Ex: 24 paletes padrão).',
        'Selecionar o tipo de carga (Seca, Fria, Perecíveis ou Mista) para correta classificação térmica.',
        'Identificar cargas classificadas de "Alto Risco" para alertar o monitoramento automático.',
        'Inserir o número de série do lacre aplicado à porta do caminhão e salvar o registro.'
      ],
      keyValidations: [
        'Confronto entre número de paletes físicos vs romaneio eletrônico.',
        'Correto acoplamento físico do lacre de metal/eletrônico.',
        'Identificação de cargas frias que exigem monitoramento de temperatura adicional.'
      ],
      slideContent: {
        heading: 'Expedição Eficiente e Aplicação de Lacre',
        bulletPoints: [
          'Registro detalhado de cubagem com quantidade exata de paletes por veículo.',
          'Sinalização automática em tela de cargas com alta sinistralidade (Alto Risco).',
          'Vinculação digital de lacre físico inviolável antes da saída das docas.',
          'Interface rápida e adaptada a coletores de dados portáteis de expedição.'
        ],
        keyMetric: 'Conformidade de Lacre: 100% dos carregamentos lacrados'
      },
      presentationTips: 'Aponte como a sinalização de cargas de "Alto Risco" desencadeia o monitoramento reforçado pela central eletrônica, protegendo cargas de alto valor.',
      geminiPrompt: `Crie um slide de apresentação corporativa profissional para o sistema CargaRadar com as seguintes especificações:
- TÍTULO: Expedição Segura, Carregamento e Lacre
- SUBTÍTULO: Garantia de Integridade de Carga na Saída das Docas
- ESTRUTURA DOS TÓPICOS:
  * Precisão Operacional: Registro exato de contagem de paletes e classificação por tipo de carga (Fria, Seca, Perecíveis, Mista).
  * Classificação de Risco: Sinalização de cargas de Alto Risco para acionar o protocolo prioritário de monitoramento eletrônico.
  * Vinculação de Segurança: Registro imediato do código de lacre único associado diretamente ao veículo.
  * Ergonomia no Pátio: Telas de alta usabilidade otimizadas para coletores e tablets industriais de doca.
- MÉTRICA EM DESTAQUE: 100% de conformidade regulatória nos lacres de saída.
- ESTILO VISUAL: Design profissional e dinâmico, paleta escura com destaques em dourado e roxo.`
    },
    {
      id: 3,
      title: 'Passo 3: Central de Monitoramento e Liberação',
      role: 'Analista de Central de Monitoramento / PP',
      icon: LayoutDashboard,
      image: '/src/assets/images/guia_passo_3_central_1783626335976.jpg',
      summary: 'O cérebro estratégico do sistema. Concentra em tempo real todas as cargas cadastradas no CD e as libera para rota se estiverem conformes, ou bloqueia preventivamente se houver inconsistências.',
      procedures: [
        'Acessar o painel da "CENTRAL" para ver a visão global da operação.',
        'Visualizar os cards de veículos ordenados por prioridade e urgência.',
        'Analisar se os checklists de portaria foram preenchidos e as fotos estão válidas.',
        'Alterar o status de forma assistida: Aprovar para "Em Trânsito" ou, se houver divergência, acionar "Bloqueado" para averiguação imediata.',
        'Filtrar por Status (Aguardando, Em Trânsito, Bloqueados) para controle de fluxo.'
      ],
      keyValidations: [
        'Avaliação de divergências nas fotos enviadas (Placa adulterada, lacre violado).',
        'Controle de tempo de pátio (Garantir que veículos não fiquem parados sem liberação).',
        'Liberação de rotas aprovada apenas após checagem completa de segurança.'
      ],
      slideContent: {
        heading: 'Central de Decisão e Monitoramento Ativo',
        bulletPoints: [
          'Painel de controle unificado com status em tempo real de toda a frota.',
          'Análise fotográfica assistida diretamente no dashboard da central de risco.',
          'Disparos imediatos de status para equipe de rota (Aprovado, Bloqueado, Finalizado).',
          'Pesquisa rápida por placa ou motorista para tomadas de ação em segundos.'
        ],
        keyMetric: 'Tempo de Análise: Média de < 5 minutos para liberação'
      },
      presentationTips: 'Enfatize que a Central de Monitoramento é o filtro de risco da empresa. Nenhum caminhão sai sem aprovação sistêmica e visual da central de segurança.',
      geminiPrompt: `Crie um slide de apresentação corporativa profissional para o sistema CargaRadar com as seguintes especificações:
- TÍTULO: Central de Monitoramento e Liberação Ativa
- SUBTÍTULO: Inteligência Operacional de Riscos em Tempo Real
- ESTRUTURA DOS TÓPICOS:
  * Painel de Controle Unificado: Visão 360 graus de todos os veículos em pátio, trânsito ou pendentes de liberação.
  * Validação Digital: Conferência direta e visual das fotos capturadas pela portaria para aprovação segura da viagem.
  * Tomada de Decisão Ágil: Alterações de status rápidas e assistidas entre Aguardando, Em Trânsito, Bloqueado e Concluído.
  * Gestão de Alertas: Filtros inteligentes que destacam inconformidades visuais e atrasos em docas.
- MÉTRICA EM DESTAQUE: Tomada de decisão e liberação em menos de 5 minutos por viagem.
- ESTILO VISUAL: Visual de centro de controle moderno, fundo escuro com elementos neon violeta e azul elétrico.`
    },
    {
      id: 4,
      title: 'Passo 4: Auditoria, Ocorrências e Usuários',
      role: 'Auditor de Segurança / Administrador do Sistema',
      icon: ShieldCheck,
      image: '/src/assets/images/guia_passo_4_auditoria_1783626349308.jpg',
      summary: 'Camada de supervisão e integridade. Trata as cargas que foram bloqueadas pela central por suspeitas de fraude ou sinistros, registra histórico de ocorrências e aprova novos usuários operacionais.',
      procedures: [
        'Navegar ao painel de "AUDITORIA" para avaliar inconformidades críticas.',
        'Selecionar cargas com status de "Bloqueado" para entender o motivo operacional.',
        'Inserir relatórios detalhados de Ocorrência (Ex: Lacre Rompido, Motorista Não Identificado) com fotos de prova.',
        'Gerenciar usuários pendentes: Aprovar novos operadores cadastrados, alterar senhas e atribuir cargos funcionais (Despachante, Auditor, Administrador).'
      ],
      keyValidations: [
        'Verificação e auditoria de sinistros de carga ocorridos nas rotas.',
        'Análise de Logs de Eventos (Rastreabilidade total das ações de cada usuário no sistema).',
        'Controle rígido de acessos para garantir confidencialidade operacional.'
      ],
      slideContent: {
        heading: 'Auditoria, Rastreabilidade e Gestão de Usuários',
        bulletPoints: [
          'Tratamento detalhado de sinistros com anexação de histórico de ocorrências.',
          'Módulo administrativo para auditoria de logs completos de ações dos usuários.',
          'Controle de acesso baseado em perfis (RBAC) com aprovação de novos cadastros.',
          'Segurança reforçada com auditoria forense de alterações de status críticos.'
        ],
        keyMetric: 'Rastreabilidade: 100% de auditoria de logs de segurança'
      },
      presentationTips: 'Mostre como a auditoria garante a integridade do processo. Se um lacre é quebrado em trânsito, a ocorrência é lavrada formalmente com fotos e histórico eterno.',
      geminiPrompt: `Crie um slide de apresentação corporativa profissional para o sistema CargaRadar com as seguintes especificações:
- TÍTULO: Auditoria de Segurança, Ocorrências e Acessos
- SUBTÍTULO: Governança, Rastreabilidade Completa e Controle de Risco
- ESTRUTURA DOS TÓPICOS:
  * Gestão de Sinistros: Tratamento e registro detalhado de ocorrências de segurança (lacre violado, avarias, desvios de rota).
  * Rastreabilidade Forense: Log sistêmico que grava toda ação de liberação, bloqueio e alteração com assinatura do operador.
  * Controle de Acesso (RBAC): Hierarquia rígida de cargos sistêmicos e aprovação de novos operadores para segurança da informação.
  * Resolução de Bloqueios: Processo guiado para auditoria e destravamento seguro de cargas retidas.
- MÉTRICA EM DESTAQUE: 100% das ações críticas rastreadas com log de auditoria ativo.
- ESTILO VISUAL: Tom de segurança corporativa sério, cores escuras, detalhes em rosa quente e roxo sóbrio.`
    },
    {
      id: 5,
      title: 'Passo 5: Logística Reversa e Transferência',
      role: 'Equipe de Logística / Recebimento de Lojas',
      icon: Layers,
      image: '/src/assets/images/guia_passo_5_reversa_1783626361741.jpg',
      summary: 'Tratamento do fluxo inverso de mercadorias. Gerencia o retorno de paletes de madeira, devoluções de produtos avariados das lojas filiais de volta para o Centro de Distribuição Central.',
      procedures: [
        'Acessar o módulo de "REVERSA & TRANSF." no menu lateral.',
        'Cadastrar retornos de paletes vazios (PBR/Plástico) ou devoluções de mercadorias danificadas.',
        'Selecionar a loja de origem do retorno e o destino operacional (CD Central).',
        'Informar a quantidade de vasilhames/paletes e vincular o veículo transportador.',
        'Gerar romaneio de reversa simplificado para acompanhamento físico.'
      ],
      keyValidations: [
        'Contagem física rigorosa de paletes devolvidos vs. quantidade declarada.',
        'Diferenciação correta de tipos de palete (Madeira Padrão, Plástico, Palete Descartável).',
        'Registro de avarias físicas para devoluções comerciais de fornecedores.'
      ],
      slideContent: {
        heading: 'Logística Reversa de Paletes e Devoluções',
        bulletPoints: [
          'Módulo ágil para devolução de paletes padrão (PBR) de lojas para o CD.',
          'Controle de ativos retornáveis de logística reduzindo perdas patrimoniais.',
          'Interface simplificada para operadores de loja lançarem devoluções em segundos.',
          'Geração de dados estatísticos de perdas em paletes no painel analítico.'
        ],
        keyMetric: 'Recuperação de Ativos: Redução de perdas de paletes em até 30%'
      },
      presentationTips: 'Destaque como esse módulo ajuda no controle patrimonial de ativos logísticos de alto giro, como paletes de madeira PBR que costumam "desaparecer" se não forem controlados.',
      geminiPrompt: `Crie um slide de apresentação corporativa profissional para o sistema CargaRadar com as seguintes especificações:
- TÍTULO: Logística Reversa e Controle de Ativos Logísticos
- SUBTÍTULO: Otimização do Fluxo Inverso e Recuperação de Ativos retornáveis
- ESTRUTURA DOS TÓPICOS:
  * Gestão de Ativos Logísticos: Controle rigoroso de devolução de paletes (PBR, Plástico) evitando perdas financeiras.
  * Fluxo Simplificado de Loja: Tela intuitiva para operadores de filiais registrarem retornos ao CD Central rapidamente.
  * Rastreamento de Devoluções: Vinculação do frete de retorno ao veículo transportador com romaneio digital simplificado.
  * Análise de Custos de Perda: Indicadores que cruzam os paletes enviados vs devolvidos para apuração de saldos.
- MÉTRICA EM DESTAQUE: Redução de perdas patrimoniais de paletes em até 30% após implementação.
- ESTILO VISUAL: Foco em sustentabilidade e eficiência, paleta escura com detalhes em verde neon/limão e índigo.`
    },
    {
      id: 6,
      title: 'Passo 6: Rastreamento em Tempo Real',
      role: 'Visualização Global / Lojas e Clientes',
      icon: Compass,
      image: '/src/assets/images/guia_passo_6_rastreamento_1783626373501.jpg',
      summary: 'Módulo de visibilidade em trânsito. Permite que as lojas de destino vejam quais caminhões estão a caminho, o horário estimado de entrega e se houve alguma intercorrência que atrase a descarga.',
      procedures: [
        'Acessar o módulo de "RASTREAMENTO" de cargas.',
        'Utilizar os cards de busca rápida por placa ou destino para filtrar as informações.',
        'Verificar a linha de status do veículo: Aguardando (Pátio CD), Em Trânsito (Rota), Bloqueado (Retido Central), ou Finalizado (Entregue na Loja).',
        'Consultar o histórico cronológico de status com data/hora de cada etapa.'
      ],
      keyValidations: [
        'Acompanhamento do SLA de tempo de viagem entre o CD e a loja destino.',
        'Verificação rápida da ocorrência caso o veículo esteja com status Bloqueado.',
        'Planejamento de equipe de recebimento em loja baseado em veículos "Em Trânsito".'
      ],
      slideContent: {
        heading: 'Rastreamento, Status Real-time e SLAs',
        bulletPoints: [
          'Visibilidade transparente das cargas para gerentes de filiais de destino.',
          'Linha do tempo cronológica com logs exatos de alteração de cada carga.',
          'Indicador gráfico intuitivo do status operacional em quatro níveis de cor.',
          'Previsibilidade de descarga reduzindo horas extras desnecessárias na loja.'
        ],
        keyMetric: 'SLA de Informação: Visibilidade do status em 100% do trânsito'
      },
      presentationTips: 'Frise que dar transparência das entregas para as lojas reduz ligações desnecessárias perguntando onde está o caminhão e melhora o planejamento da equipe de descarga.',
      geminiPrompt: `Crie um slide de apresentação corporativa profissional para o sistema CargaRadar com as seguintes especificações:
- TÍTULO: Rastreamento Operacional em Tempo Real
- SUBTÍTULO: Transparência e Eficiência Logística para Lojas e Filiais
- ESTRUTURA DOS TÓPICOS:
  * Linha do Tempo Cronológica: Histórico em tempo real de cada evento de trânsito (check-in, liberação, ocorrências, descarga).
  * Visibilidade Distribuída: Acesso para gerentes de loja planejarem suas equipes de descarga antes da chegada física do caminhão.
  * Status Semáforo Visual: Indicadores de cores intuitivos para rápido diagnóstico (Verde: Trânsito, Vermelho: Bloqueado, Azul: Finalizado).
  * Cumprimento de SLAs: Monitoramento de prazos de percurso reduzindo tempos ociosos e gargalos logísticos.
- MÉTRICA EM DESTAQUE: 100% de visibilidade das entregas sem ligações de cobrança.
- ESTILO VISUAL: Dashboard analítico, moderno, fundo escuro com tons de roxo cósmico e destaques em amarelo laser.`
    }
  ];

  const currentStep = steps[activeStepIndex];

  const handleNext = () => {
    setActiveStepIndex((prev) => (prev + 1) % steps.length);
  };

  const handlePrev = () => {
    setActiveStepIndex((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6" id="guia-operacional-view">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Presentation className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tight">
              Guia de Apresentação e Slides
            </h2>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Resumo funcional estruturado e ilustrações em alta resolução para criação de slides e treinamento de equipes pelo Gemini.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Versão para Impressão / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Container - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Steps Navigation and Slide Preview */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Slide Interactive Deck */}
          <div className="bg-white dark:bg-[#0a0915] border border-slate-200 dark:border-[#1f1b40] rounded-3xl overflow-hidden shadow-xl">
            {/* Header / Active Step */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#080714] border-b border-slate-200 dark:border-[#1f1b40] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-primary-gold/10 text-primary-gold rounded-lg font-mono font-bold text-xs">
                  {String(currentStep.id).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {currentStep.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {steps.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                      idx === activeStepIndex ? 'bg-primary-gold w-5' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Simulated Slide Visual Container */}
            <div className="relative aspect-video bg-slate-950 overflow-hidden group">
              <img 
                src={currentStep.image} 
                alt={currentStep.title} 
                className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay with subtle visual title on bottom */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-6 flex flex-col justify-end min-h-[30%]">
                <div className="flex items-center gap-3">
                  <span className="p-1.5 bg-primary-gold text-slate-950 rounded-lg shrink-0">
                    <currentStep.icon className="w-4 h-4" />
                  </span>
                  <h3 className="text-white text-base md:text-lg font-black uppercase tracking-tight">
                    {currentStep.title}
                  </h3>
                </div>
                <p className="text-slate-300 text-xs mt-1 font-medium max-w-2xl line-clamp-2">
                  {currentStep.summary}
                </p>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-primary-gold hover:text-slate-950 text-white rounded-full transition-all cursor-pointer backdrop-blur-md opacity-75 hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-primary-gold hover:text-slate-950 text-white rounded-full transition-all cursor-pointer backdrop-blur-md opacity-75 hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar for Image */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#080714]/80 border-t border-slate-200 dark:border-[#1f1b40] flex items-center justify-between text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary-gold" />
                <span>Esta imagem em alta resolução acima foi gerada para este passo operacional.</span>
              </div>
              <a
                href={currentStep.image}
                download={`Slide_${currentStep.id}_CargaRadar.jpg`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-primary-gold hover:underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Imagem</span>
              </a>
            </div>
          </div>

          {/* Operational Procedures & Checklists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step Procedures */}
            <div className="bg-white dark:bg-[#0a0915] border border-slate-200 dark:border-[#1f1b40] rounded-3xl p-6 shadow-md text-left space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                Instruções Passo a Passo
              </h4>
              <ul className="space-y-3">
                {currentStep.procedures.map((proc, index) => (
                  <li key={index} className="flex gap-3 items-start text-xs font-medium text-slate-600 dark:text-slate-350 leading-relaxed">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{proc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Checks */}
            <div className="bg-white dark:bg-[#0a0915] border border-slate-200 dark:border-[#1f1b40] rounded-3xl p-6 shadow-md text-left space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                Pontos Críticos de Validação
              </h4>
              <ul className="space-y-3">
                {currentStep.keyValidations.map((valid, index) => (
                  <li key={index} className="flex gap-3 items-start text-xs font-medium text-slate-600 dark:text-slate-350 leading-relaxed">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                      !
                    </span>
                    <span>{valid}</span>
                  </li>
                ))}
              </ul>
              
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                  <span className="uppercase font-black block mb-0.5">⚠️ Regra de Ouro:</span>
                  Qualquer divergência nestes pontos suspende imediatamente o fluxo e gera bloqueio preventivo da carga para averiguação central.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Gemini Slide Builder & Presentation Assistant */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Assistant Introduction */}
          <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-3xl p-5 text-left space-y-3.5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h4 className="text-xs font-black uppercase tracking-wider">Auxiliar de Apresentação</h4>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-350 leading-relaxed">
              Use este painel para estruturar seus slides! O Gemini ou qualquer criador de IA pode transformar os dados abaixo em uma apresentação dinâmica. Copie o prompt estruturado de cada passo abaixo.
            </p>
          </div>

          {/* Structured Slide Blueprint Card */}
          <div className="bg-white dark:bg-[#0a0915] border border-slate-200 dark:border-[#1f1b40] rounded-3xl p-6 shadow-md text-left space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Conteúdo do Slide
            </h4>
            
            <div className="space-y-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h5 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Título Sugerido</h5>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {currentStep.slideContent.heading}
              </p>
            </div>

            <div className="space-y-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h5 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pontos Chave do Slide</h5>
              <ul className="space-y-2">
                {currentStep.slideContent.bulletPoints.map((pt, idx) => (
                  <li key={idx} className="text-xs font-semibold text-slate-600 dark:text-slate-350 flex items-start gap-2 leading-relaxed">
                    <span className="text-primary-gold mt-1 shrink-0">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <h5 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Métrica Operacional Alvo</h5>
              <p className="text-xs font-mono font-black text-primary-gold bg-primary-gold/10 px-3 py-1.5 rounded-xl inline-block border border-primary-gold/20">
                {currentStep.slideContent.keyMetric}
              </p>
            </div>
          </div>

          {/* Presentation Tip */}
          <div className="bg-slate-50 dark:bg-[#080714] border border-slate-200 dark:border-[#1f1b40] rounded-3xl p-5 text-left space-y-2">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Presentation className="w-3.5 h-3.5 text-primary-gold" />
              Dica para o Orador
            </h5>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-350 leading-relaxed italic">
              "{currentStep.presentationTips}"
            </p>
          </div>

          {/* Copy Prompt Panel */}
          <div className="bg-white dark:bg-[#0a0915] border border-slate-200 dark:border-[#1f1b40] rounded-3xl p-6 shadow-md text-left space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Gerador de Slide (Gemini Prompt)
              </h4>
              <button
                onClick={() => copyToClipboard(currentStep.geminiPrompt, `prompt-${currentStep.id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-gold hover:bg-primary-gold/90 text-slate-950 font-black rounded-xl text-[10px] tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-md"
              >
                {copiedId === `prompt-${currentStep.id}` ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Prompt</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[10.5px] font-semibold text-slate-400 leading-relaxed">
              Copie o prompt abaixo, cole no Gemini, e peça para gerar o slide correspondente:
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <pre className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-450 leading-relaxed whitespace-pre-wrap select-all max-h-40 overflow-y-auto">
                {currentStep.geminiPrompt}
              </pre>
            </div>
          </div>

        </div>

      </div>

      {/* Complete Overview Section (Printable List) */}
      <div className="bg-white dark:bg-[#0a0915] border border-slate-200 dark:border-[#1f1b40] rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-8" id="overview-imprimir">
        <div className="border-b border-slate-150 dark:border-slate-800 pb-4">
          <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Visão Geral Completa - Guia de Treinamento Rápido
          </h3>
          <p className="text-xs font-bold text-slate-400">
            Abaixo estão todos os passos consolidados para impressão rápida, distribuição de equipe ou envio de e-mail corporativo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video bg-slate-900 relative">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm text-primary-gold border border-primary-gold/30 rounded-lg px-2 py-0.5 text-[9px] font-black font-mono">
                  PASSO {step.id}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white leading-snug line-clamp-1">
                  {step.title}
                </h4>
                <p className="text-[10px] font-black text-primary-gold uppercase tracking-wider">
                  Executor: {step.role}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {step.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
