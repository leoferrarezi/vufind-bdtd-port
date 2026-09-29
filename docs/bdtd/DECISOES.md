# Decisões do port BDTD para o VuFind 11

Cada item: a decisão e o motivo.

1. **Base: VuFind 11.1 (linha de manutenção `release-11.1`).** É a base
   da `main` deste repositório: a versão 11.1.0 com as correções
   publicadas depois dela. Futuras versões entram por merge.
2. **Nenhuma alteração no código do VuFind.** Tudo o que é da BDTD fica
   em `module/Bdtd`, `themes/bdtd` e `local/`. No sistema anterior (7.1.1)
   havia edições no núcleo, o que impedia atualizar.
3. **Configuração local versionada, segredos fora.** `local/config/vufind`
   guarda só o que difere do padrão do VuFind. Senhas e chaves ficam no
   servidor, lidas por opções `*_file` ou por uma camada de configuração
   do próprio servidor.
4. **Configuração baseada na produção, não no repositório anterior.** A
   produção tem ajustes que não estão no repositório do 7.1.1 (e-mails,
   idioma, limite de resultados). Os arquivos de produção servem de
   referência; só as diferenças em relação ao padrão entram aqui.
5. **Exportação em massa não portada.** O código anterior executava
   comandos do sistema com dados do usuário e buscava qualquer endereço
   informado na URL. Será reescrita sem esses problemas.
6. **O que é de cada servidor fica fora do repositório.** Conexão com o
   banco, endereço público do site, chaves (`ils_encryption_key`,
   `HMACkey`, reCAPTCHA) e servidor de e-mail ficam numa camada de
   configuração do próprio servidor, que herda `local/`.
7. **Erros evidentes da produção são corrigidos.** Fuso `America/New_York`
   passa a `America/Sao_Paulo`; `locale` `pt_br` passa a `pt_BR`; o
   assistente `/Install`, aberto na produção, é desligado.
8. **Opções sem efeito na produção não são portadas.** Ex.: links por DOI
   sem serviço configurado.
9. **Personalizações do núcleo viram configuração.** Tags desligadas por
   `[Social]` (o legado apagava arquivos do VuFind); assunto do e-mail de
   contato por `FeedbackForms.yaml` (o legado editava o `Form.php`).
10. **A oasisbr-api não é usada.** O serviço foi descontinuado. O sistema
    anterior a consultava para achar registros com ID alterado ou removidos
    do índice (editando o núcleo do VuFind) e em gráficos do tema; esse
    recurso não é portado, e o que dependia dela no tema é revisto página a
    página.
