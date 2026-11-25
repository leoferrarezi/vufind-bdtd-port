/*global VuFind, vegaEmbed, tippy, WordCloud */
/**
 * BDTD: gráficos da página de indicadores (indicators/home), com as facetas da API de
 * busca do próprio VuFind.
 *
 * Baseado no indicators-chart.js, vega-options.js, base.js e languages.js do legado.
 * Os gráficos são os mesmos; o site é só em português, então rótulos e números saem
 * sempre em português (o legado escolhia pelo idioma do navegador). A seção de evolução
 * (evolution-indicators.js) não é portada: dependia da oasisbr-api, descontinuada.
 */

const INDICATORS_FACETS =
  'search?type=AllFields&page=0&limit=0&sort=relevance&facet[]=author_facet&facet[]=dc.subject.por.fl_str_mv&facet[]=eu_rights_str_mv&facet[]=dc.publisher.program.fl_str_mv&facet[]=dc.subject.cnpq.fl_str_mv&facet[]=publishDate&facet[]=language&facet[]=format&facet[]=institution&facet[]=dc.contributor.advisor1.fl_str_mv';

// Traduções usadas nos gráficos (languages.js do legado)
const translations = new Map([
  ['eng', 'Inglês'],
  ['fra', 'Francês'],
  ['ita', 'Italiano'],
  ['por', 'Português'],
  ['spa', 'Espanhol'],
  ['article', 'Artigo'],
  ['bachelorThesis', 'TCC'],
  ['book', 'Livro'],
  ['bookPart', 'Capítulo de livro'],
  ['conferenceObject', 'Artigo de conferência'],
  ['dataset', 'Conjunto de dados'],
  ['doctoralThesis', 'Tese'],
  ['masterThesis', 'Dissertação'],
  ['other', 'Outros'],
  ['patent', 'Patente'],
  ['report', 'Relatório'],
  ['review', 'Artigo (review)'],
  ['workingPaper', 'Artigo (working paper)'],
  ['closedAccess', 'Acesso fechado'],
  ['embargoedAccess', 'Acesso embargado'],
  ['openAccess', 'Acesso aberto'],
  ['restrictedAccess', 'Acesso restrito'],
  ['Subject', 'Assunto'],
  ['Author', 'Autor'],
  ['Title', 'Título'],
  ['Count', 'Quantidade'],
]);

function t(key) {
  return translations.get(key) || key;
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Opções do vega-embed (vega-options.js do legado, só a parte em português)
const vegaOptions = {
  formatLocale: {
    decimal: ',',
    thousands: '.',
    grouping: [3],
    currency: ['R$', ''],
  },
  timeFormatLocale: {
    dateTime: '%A, %e de %B de %Y. %X',
    date: '%d/%m/%Y',
    time: '%H:%M:%S',
    periods: ['AM', 'PM'],
    days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    shortDays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    shortMonths: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  },
  actions: {
    export: true,
    source: false,
    compiled: false,
    editor: false,
  },
  i18n: {
    CLICK_TO_VIEW_ACTIONS: 'Clique para ver as ações',
    PNG_ACTION: 'Salvar como PNG',
    SVG_ACTION: 'Salvar como SVG',
  },
  fontSize: 14,
};

function setStatus(text) {
  const status = document.getElementById('indicatorsStatus');
  if (status && status.textContent !== text) {
    status.textContent = text;
  }
}

function panelTitle(element) {
  return element.closest('.panel').querySelector('.panel-heading').textContent.trim();
}

function renderDataTable(container, title, columns, rows) {
  container.querySelectorAll(':scope > .indicators-data').forEach((old) => old.remove());
  const wrapper = document.createElement('div');
  const table = document.createElement('table');
  table.className = 'table table-sm';
  const caption = table.createCaption();
  caption.textContent = title;
  const headRow = table.createTHead().insertRow();
  columns.forEach((column) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column;
    headRow.appendChild(th);
  });
  const body = table.createTBody();
  rows.forEach((cells) => {
    const row = body.insertRow();
    cells.forEach((cell, index) => {
      const td = row.insertCell();
      if (cell instanceof Node) {
        td.appendChild(cell);
      } else {
        td.textContent = cell;
      }
      if (index > 0) {
        td.className = 'text-end';
      }
    });
  });
  wrapper.className = 'indicators-data';
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  return wrapper;
}

function embedChart(selector, spec) {
  const element = document.querySelector(selector);
  const title = panelTitle(element);
  spec.description = 'Gráfico: ' + title;
  const fields = spec.encoding.tooltip;
  renderDataTable(
    element.parentElement,
    title,
    fields.map((field) => field.title),
    spec.data.values.map((value) => fields.map((field) => (
      field.type === 'quantitative' ? formatNumber(value[field.field]) : String(value[field.field])
    )))
  ).classList.add('visually-hidden');
  return vegaEmbed(selector, spec, vegaOptions).then((result) => {
    const summary = element.querySelector('summary');
    if (summary) {
      summary.setAttribute('aria-label', 'Ações do gráfico: ' + title);
    }
    return result;
  });
}

function setLoader(visible) {
  const loader = document.querySelector('#dashboard .loader');
  if (loader) {
    loader.style.display = visible ? 'block' : 'none';
  }
  if (visible) {
    setStatus('Carregando indicadores...');
  }
}

async function getIndicatorsFromVufindApi(lookfor, type) {
  let url = VuFind.path + '/api/v1/' + INDICATORS_FACETS;
  if (lookfor) {
    url = url + '&lookfor=' + encodeURIComponent(lookfor);
  }
  if (type) {
    url = url + '&type=' + encodeURIComponent(type);
  }
  setLoader(true);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    return await response.json();
  } finally {
    setLoader(false);
  }
}

function fillTotalDocuments(total) {
  document.getElementById('total-docs').textContent = formatNumber(total);
}

async function createChartByYear(data) {
  let values = data.map((item) => {
    return { year: item.translated, count: item.count };
  });

  values.sort(function (a, b) {
    return a.year - b.year;
  });

  values = values.slice(values.length - 10, values.length);
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'bar', tooltip: true, color: '#008e67' },
    width: 460,
    // height: 250,
    encoding: {
      x: {
        field: 'year',
        type: 'nominal',
        title: null,
        axis: { labelAngle: 0, labelFontSize: 14 },
      },
      y: {
        field: 'count',
        type: 'quantitative',
        title: null,
        axis: {
          labelFontSize: 14,
        },
      },
      tooltip: [
        { field: 'year', type: 'nominal', title: 'Ano' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visYear', yourVlSpec);
}

async function createChartByType(data) {
  const values = data.map((item) => {
    return { type: t(item.translated), count: item.count };
  });

  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'arc', tooltip: true },
    view: { stroke: null },
    encoding: {
      theta: { field: 'count', type: 'quantitative', stack: true },
      color: {
        field: 'type',
        type: 'nominal',
        legend: {
          title: null,
          labelFontSize: 14,
        },
      },
      tooltip: [
        { field: 'type', type: 'nominal', title: 'Tipo de documento' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visType', yourVlSpec);
}

async function createChartByInstitution(data) {
  let values = data.map((item) => {
    return { inst: item.translated, count: item.count };
  });

  values = values.slice(0, 10);
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'bar', tooltip: true, color: '#008e67' },
    width: 460,
    labelFontSize: 14,
    encoding: {
      x: {
        field: 'inst',
        type: 'nominal',
        title: null,
        axis: { labelAngle: 45, labelFontSize: 14 },
        sort: { field: 'count', order: 'descending' },
      },
      y: {
        field: 'count',
        type: 'quantitative',
        title: null,
        axis: { labelFontSize: 14 },
      },
      tooltip: [
        { field: 'inst', type: 'nominal', title: 'Instituição' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visInst', yourVlSpec);
}

async function createChartByLanguage(data) {
  let values = data.map((item) => {
    return {
      language: item.translated ? t(item.translated) : 'Others',
      count: item.count,
    };
  });
  values = values.slice(0, 5);
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'arc', tooltip: true, innerRadius: 50 },
    view: { stroke: null },
    encoding: {
      theta: { field: 'count', type: 'quantitative', stack: true },
      color: {
        field: 'language',
        type: 'nominal',
        legend: {
          title: null,
          labelFontSize: 14,
        },
      },
      tooltip: [
        { field: 'language', type: 'nominal', title: 'Idioma' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visLang', yourVlSpec);
}

async function createChartByAuthor(data) {
  let values = data.map((item) => {
    return { author: item.translated, count: item.count };
  });
  values = values.slice(0, 10);
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'bar', color: '#008e67' },
    width: 460,
    // height: 250,
    labelFontSize: 14,
    transform: [
      {
        filter: 'datum.author != "sem informação"',
      },
    ],
    encoding: {
      x: {
        field: 'author',
        type: 'nominal',
        title: null,
        axis: { labelAngle: 45, labelFontSize: 14 },
        sort: { field: 'value', order: 'descending' },
      },
      y: {
        field: 'count',
        type: 'quantitative',
        title: null,
        axis: { labelFontSize: 14 },
      },
      tooltip: [
        { field: 'author', type: 'nominal', title: 'Autor' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visAuthor', yourVlSpec);
}

async function createChartByAdvisors(data) {
  let values = data.map((item) => {
    return { advisor: item.translated, count: item.count };
  });
  values = values.slice(0, 10);
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'bar', color: '#008e67' },
    width: 460,
    // height: 250,
    transform: [
      {
        filter: 'datum.advisor != "sem informação"',
      },
    ],
    labelFontSize: 14,
    encoding: {
      x: {
        field: 'advisor',
        type: 'nominal',
        title: null,
        axis: { labelAngle: 45, labelFontSize: 14 },
        sort: { field: 'value', order: 'descending' },
      },
      y: {
        field: 'count',
        type: 'quantitative',
        title: null,
        axis: { labelFontSize: 14 },
      },
      tooltip: [
        { field: 'advisor', type: 'nominal', title: 'Orientador' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visAdv', yourVlSpec);
}

function keywordSearchUrl(keyword, lookfor, type) {
  let search = VuFind.path + '/Search/Results?';
  if (lookfor && type) {
    search = search + `lookfor=${encodeURIComponent(lookfor)}&type=${encodeURIComponent(type)}&`;
  }
  return search + `filter%5B%5D=dc.subject.por.fl_str_mv%3A%22${encodeURIComponent(keyword)}%22`;
}

async function createWordCloud(data, lookfor, type) {
  // data = data.slice(0, 10)

  const values = [];
  let divisor = 2;
  if (data[0].count > 10000) {
    divisor = 1000;
  } else if (data[0].count > 5000) {
    divisor = 500;
  } else if (data[0].count > 3000) {
    divisor = 300;
  } else if (data[0].count > 2000) {
    divisor = 200;
  } else if (data[0].count > 1000) {
    divisor = 100;
  } else if (data[0].count < 10) {
    divisor = 0.3;
  }
  data.forEach((item) => {
    values.push([item.translated, item.count / divisor, item.count]);
  });

  // const tippyElement = tippy('#cloudTopic', {
  //   trigger: 'manual'
  // })

  const tippyElement = tippy(document.querySelector('#cloudTopic'), {
    trigger: 'manual',
  });
  const visAuthor = document.getElementById('cloudTopic');
  const title = panelTitle(visAuthor);
  visAuthor.setAttribute('role', 'img');
  visAuthor.setAttribute('aria-label', 'Nuvem de palavras: ' + title);
  renderDataTable(
    visAuthor.parentElement,
    title,
    ['Palavra-chave', t('Count')],
    data.map((item) => {
      const link = document.createElement('a');
      link.href = keywordSearchUrl(item.translated, lookfor, type);
      link.textContent = item.translated;
      return [link, formatNumber(item.count)];
    })
  ).classList.add('visually-hidden-focusable');
  const options = {
    list: values,
    gridSize: 16,
    color: 'random-light',
    weightFactor: 3,
    fontFamily: 'Lato, sans-serif',
    color: '#000',
    click: function (item) {
      window.location = keywordSearchUrl(item[0], lookfor, type);
    },
    hover: function (item, dimension) {
      tippyElement.setContent(item[0] + ': ' + formatNumber(item[2]));
      // tippyElement.setProps({
      //   getReferenceClientRect: () => ({
      //     width: dimension.w,
      //     height: dimension.h,
      //     left: visAuthor.offsetLeft + dimension.w + dimension.x,
      //     top: visAuthor.offsetTop + dimension.h + dimension.y
      //   })
      // })
      tippyElement.show();
    },
    backgroundColor: '#FFF',
  };

  WordCloud(visAuthor, options);
}

async function createChartByPpg(data) {
  let values = data.map((item) => {
    return { PPG: item.translated, count: item.count };
  });
  values = values.slice(0, 10);
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'bar', tooltip: true, color: '#008e67' },
    width: 460,
    labelFontSize: 14,
    encoding: {
      x: {
        field: 'PPG',
        type: 'nominal',
        title: null,
        axis: { labelAngle: 45, labelFontSize: 14 },
        sort: { field: 'count', order: 'descending' },
      },
      y: {
        field: 'count',
        type: 'quantitative',
        title: null,
        axis: { labelFontSize: 14 },
      },
      tooltip: [
        { field: 'PPG', type: 'nominal', title: 'PPG' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visPpg', yourVlSpec);
}

async function createChartByRights(data) {
  const values = data.map((item) => {
    return {
      right: t(item.translated),
      count: item.count,
    };
  });
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'arc', tooltip: true },
    view: { stroke: null },
    encoding: {
      theta: { field: 'count', type: 'quantitative', stack: true },
      color: {
        field: 'right',
        type: 'nominal',
        legend: {
          title: null,
          labelFontSize: 14,
        },
      },
      tooltip: [
        { field: 'right', type: 'nominal', title: 'Tipo de acesso' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visRights', yourVlSpec);
}

function cleanCNPqTag(fullTag) {
  const split = fullTag.split('::');
  return split[split.length - 1];
}

async function createChartByCnpq(data) {
  let values = data.map((item) => {
    return { CNPq: cleanCNPqTag(item.translated), count: item.count };
  });
  values = values.slice(0, 10);
  const yourVlSpec = {
    data: {
      values: values,
    },
    mark: { type: 'bar', tooltip: true, color: '#008e67' },
    width: 460,
    // height: 250,
    labelFontSize: 14,
    encoding: {
      x: {
        field: 'CNPq',
        type: 'nominal',
        title: null,
        axis: {
          labelAngle: 45,
          labelFontSize: 14,
        },
        sort: { field: 'count', order: 'descending' },
      },
      y: {
        field: 'count',
        type: 'quantitative',
        title: null,
        axis: {
          labelFontSize: 14,
        },
      },
      tooltip: [
        { field: 'CNPq', type: 'nominal', title: 'Área do conhecimento' },
        {
          field: 'count',
          type: 'quantitative',
          format: ',.0f',
          title: t('Count'),
        },
      ],
    },
  };
  embedChart('#visCnpq', yourVlSpec);
}

function processForm(e) {
  e.preventDefault();
  loadData(this.elements.filter.value, this.elements.type.value);
  return false;
}

async function loadData(lookfor, type) {
  const initTime = performance.now();
  let indicators;
  try {
    indicators = await getIndicatorsFromVufindApi(lookfor, type);
  } catch (error) {
    console.error(error);
    setStatus('Não foi possível carregar os indicadores.');
    return;
  }
  const endTime = performance.now();
  fillSearchResults(lookfor, indicators, type, endTime, initTime);
  const total = formatNumber(indicators.resultCount) + ' documentos';
  setStatus(lookfor ? 'Indicadores atualizados: ' + total + ' para a busca "' + lookfor + '"' : 'Indicadores carregados: ' + total);
  createChartByYear(indicators.facets.publishDate);
  createChartByType(indicators.facets.format);
  createChartByInstitution(indicators.facets.institution);
  createChartByLanguage(indicators.facets.language);
  createChartByAuthor(indicators.facets.author_facet);
  createChartByAdvisors(indicators.facets['dc.contributor.advisor1.fl_str_mv']);
  createWordCloud(indicators.facets['dc.subject.por.fl_str_mv'], lookfor, type);
  createChartByRights(indicators.facets.eu_rights_str_mv);
  createChartByCnpq(indicators.facets['dc.subject.cnpq.fl_str_mv']);
  createChartByPpg(indicators.facets['dc.publisher.program.fl_str_mv']);
}

function fillSearchResults(lookfor, indicators, type, endTime, initTime) {
  const results = document.getElementById('results');
  if (!lookfor) {
    // só pega o total sem filtro
    fillTotalDocuments(indicators.resultCount);
    results.style.display = 'none';
  } else {
    results.style.display = 'block';
    const resultTotal = document.getElementById('total-docs-results');
    resultTotal.textContent = formatNumber(indicators.resultCount);

    const filtersSearch = document.getElementById('filters-search');
    let filters = '';
    if (type) {
      filters = `por ${t(type)} `;
    }
    filters = filters + `"${lookfor}"`;
    filtersSearch.textContent = filters;

    const timeSearch = document.getElementById('time-search');
    timeSearch.textContent = `${formatNumber((endTime - initTime) / 1000)}s`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelector('[data-form-filter]').addEventListener('submit', processForm);
  await loadData(null, null);
});
