# CargaRadar System

Sistema de monitoramento e liberação de cargas para o Atacadista Dia a Dia.

## Funcionalidades

- **Expedição**: Registro de saída de carga com classificação detalhada de paletes.
- **Central de Monitoramento**: Validação de lacres e autorização de despacho em tempo real com integração de mapas e IA.
- **Auditoria & Gestão**: Controle de gate, registro de ocorrências com fotos e gestão de usuários.
- **Análise de Dados**: Dashboards e relatórios de desempenho logístico.

## Tecnologias Utilizadas

- **React 19** com **TypeScript**
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Google Gemini AI** para insights logísticos
- **jsPDF** para exportação de relatórios
- **Lucide React** para ícones
- **Framer Motion** para animações

## Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/cargorelease-system.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto e adicione sua chave da API do Gemini:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy no GitHub Pages

O projeto está configurado para deploy automático no GitHub Pages através de GitHub Actions sempre que houver um push para a branch `main`.

### Configuração Manual (Opcional)

Se desejar realizar o deploy manualmente:

1. Execute o comando de deploy:
   ```bash
   npm run deploy
   ```

### Notas de Configuração

- **Vite Base Path**: O arquivo `vite.config.ts` está configurado com `base: './'` para garantir compatibilidade com o GitHub Pages, permitindo que os ativos sejam carregados corretamente independentemente do nome do repositório.
- **Tailwind CSS v4**: O projeto utiliza a versão 4 do Tailwind CSS, integrada diretamente via plugin do Vite.

## Estrutura do Projeto

- `/src`: Código fonte da aplicação.
  - `/components`: Componentes reutilizáveis.
  - `/views`: Telas principais do sistema.
  - `types.ts`: Definições de tipos TypeScript.
- `/public`: Ativos estáticos.
