# Sala Rosa - Melhorias Futuras

Este arquivo registra ideias para evoluir o sistema Sala Rosa depois das funcionalidades principais de agenda, agendamentos, vendas, estoque, financeiro e cadastros.

## Objetivo

Transformar o Sala Rosa em uma plataforma mais completa para relacionamento com clientes, divulgacao de conteudo, atendimento automatico e apoio a gestao do negocio.

## 1. Aba de postagens / blog

Criar uma nova area no sistema para a gerente publicar conteudos, novidades e fotos, semelhante a um blog.

### Ideia principal

- Criar uma aba publica chamada `Blog`, `Novidades` ou `Conteudos`.
- Permitir que a gerente cadastre posts pelo painel logado.
- Cada post pode ter titulo, foto principal, texto, categoria e data de publicacao.
- Exibir as postagens em uma pagina publica para visitantes e clientes.

### Exemplos de conteudo

- Fotos de atendimentos autorizadas pela cliente.
- Antes e depois.
- Novidades da Sala Rosa.
- Dicas de beleza e autocuidado.
- Comunicados sobre turmas, workshops e treinamentos.
- Promocoes de produtos ou servicos.
- Historias de consultoras ou clientes.

### Funcionalidades sugeridas

- Cadastro, edicao e exclusao de posts pela gerente.
- Upload de imagem principal.
- Status do post: rascunho ou publicado.
- Categorias: Noticias, Inspiracao, Beleza, Turmas, Promocoes.
- Lista de posts recentes na pagina publica.
- Busca por palavra-chave.
- Filtro por categoria.
- Botao para compartilhar no WhatsApp.

### Paginas possiveis

- `/blog`: lista publica de postagens.
- `/blog/[slug]`: detalhe publico de uma postagem.
- `/logado/blog`: gerenciamento das postagens pela gerente.

### Campos sugeridos no banco

- `id`
- `titulo`
- `slug`
- `resumo`
- `conteudo`
- `imagem_url`
- `categoria`
- `status`
- `publicado_em`
- `criado_por_user_id`
- `created_at`
- `updated_at`

## 2. Chatbot no site

Adicionar um chatbot na area publica do site para responder duvidas frequentes e orientar visitantes.

### Ideia principal

O chatbot ficaria visivel no site publico, parecido com um botao flutuante de atendimento. Ele responderia perguntas simples e poderia direcionar a pessoa para WhatsApp, cadastro, login ou agendamento.

### Duvidas que o chatbot poderia responder

- Como agendar um horario?
- Quais servicos a Sala Rosa oferece?
- Como funciona uma turma ou workshop?
- Como virar consultora?
- Onde vejo meus agendamentos?
- Como remarcar ou cancelar?
- Quais formas de pagamento sao aceitas?
- Qual o contato da Sala Rosa?

### Primeira versao simples

- Chatbot com respostas fixas cadastradas no sistema.
- Lista de perguntas frequentes.
- Botoes rapidos para as principais duvidas.
- Encaminhamento para WhatsApp quando a pergunta precisar de atendimento humano.

### Versao futura com inteligencia artificial

- Chatbot conectado a uma IA.
- Base de conhecimento com informacoes da Sala Rosa.
- Respostas mais naturais.
- Capacidade de consultar horarios disponiveis.
- Capacidade de orientar o usuario ate o agendamento.

### Cuidados importantes

- O bot nao deve confirmar agendamentos sem validar disponibilidade real.
- O bot nao deve prometer precos ou horarios se essas informacoes puderem mudar.
- Para duvidas sensiveis, deve encaminhar para atendimento humano.
- Conversas devem respeitar privacidade dos clientes.

## 3. Area de destaque na home

Melhorar a pagina inicial com conteudos dinamicos vindos do sistema.

### Ideias

- Mostrar ultimas postagens do blog.
- Mostrar proximas turmas abertas.
- Mostrar servicos em destaque.
- Mostrar depoimentos autorizados.
- Botao direto para agendar.
- Botao direto para falar no WhatsApp.

## 4. Solicitacao para ser consultora

O cadastro publico ja tem a opcao "Tenho interesse em me tornar uma consultora da Sala Rosa". Essa ideia pode virar um fluxo completo.

### Funcionalidades sugeridas

- Enviar o interesse para o backend no momento do cadastro.
- Criar uma tela para a gerente aprovar ou recusar solicitacoes.
- Marcar a cliente como consultora depois da aprovacao.
- Enviar aviso para a cliente quando for aprovada.

## 5. Painel de pendencias da gerente

Adicionar no dashboard uma area com tarefas importantes do dia.

### Pendencias possiveis

- Agendamentos de hoje sem confirmacao.
- Pagamentos pendentes.
- Produtos com estoque baixo.
- Turmas aguardando aprovacao.
- Solicitacoes de consultora.
- Mensagens ou contatos recebidos pelo site.

## 6. Galeria de fotos

Criar uma area para exibir imagens da Sala Rosa, atendimentos, produtos e resultados.

### Ideias

- Galeria publica.
- Fotos vinculadas a posts do blog.
- Fotos vinculadas a servicos.
- Controle de status: rascunho ou publicado.
- Campo para confirmar autorizacao de uso da imagem.

## 7. Melhorias no relacionamento com clientes

### Ideias

- Perfil completo do cliente.
- Historico de atendimentos.
- Historico de compras.
- Observacoes internas da gerente.
- Preferencias da cliente.
- Lembretes automaticos por WhatsApp.
- Mensagem de aniversario.
- Mensagem pos-atendimento pedindo feedback.

## 8. Relatorios futuros

### Ideias

- Servicos mais agendados.
- Produtos mais vendidos.
- Clientes mais frequentes.
- Receita por periodo.
- Cancelamentos por periodo.
- Turmas com maior participacao.
- Origem das vendas: atendimento, produto avulso, turma ou indicacao.

## Prioridade sugerida

1. Painel de pendencias da gerente.
2. Fluxo de solicitacao para ser consultora.
3. Blog/postagens com foto.
4. Galeria de fotos.
5. Chatbot simples com perguntas frequentes.
6. Chatbot com inteligencia artificial.
7. Relatorios avancados.

## Observacao

As ideias de blog, galeria e chatbot ajudam a aproximar o sistema de uma experiencia mais completa, misturando gestao interna com presenca digital. Isso pode fazer o Sala Rosa deixar de ser apenas um sistema administrativo e virar tambem uma ferramenta de divulgacao, relacionamento e vendas.
