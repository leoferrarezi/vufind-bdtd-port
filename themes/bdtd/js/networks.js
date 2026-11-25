/*global gridjs, VuFind */
/**
 * BDTD: tabela das instituições participantes (datasources/home), montada com a faceta
 * instname_str da API de busca do próprio VuFind.
 *
 * Baseado no networks.js do legado; usa fetch em vez do axios e das funções do base.js.
 * A exportação gera o arquivo no navegador (o legado abria um endereço data:, que os
 * navegadores atuais bloqueiam).
 */
(function networksPage() {
  function setStatus(text) {
    const status = document.getElementById("networksStatus");
    if (status && status.textContent !== text) {
      status.textContent = text;
    }
  }

  function setLoader(visible) {
    const loader = document.querySelector(".networks .loader");
    if (loader) {
      loader.style.display = visible ? "block" : "none";
    }
    if (visible) {
      setStatus("Carregando instituições...");
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function setAttribute(element, name, value) {
    if (!element) {
      return;
    }
    if (value === null) {
      element.removeAttribute(name);
    } else if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }

  const sortStates = {
    "gridjs-sort-asc": "ascending",
    "gridjs-sort-desc": "descending",
  };

  function enhanceGrid(wrapper) {
    setAttribute(wrapper.querySelector(".gridjs-search-input"), "aria-label", "Buscar por instituição");
    const table = wrapper.querySelector("table.gridjs-table");
    setAttribute(table, "role", null);
    setAttribute(table, "aria-label", "Instituições participantes");
    wrapper.querySelectorAll("th.gridjs-th-sort").forEach((th) => {
      const button = th.querySelector(".gridjs-sort");
      const state = button ? Object.keys(sortStates).find((name) => button.classList.contains(name)) : undefined;
      setAttribute(th, "aria-sort", state ? sortStates[state] : null);
    });
    wrapper.querySelectorAll(".gridjs-pages button").forEach((button) => {
      setAttribute(button, "aria-current", button.classList.contains("gridjs-currentPage") ? "page" : null);
    });
    const summary = wrapper.querySelector(".gridjs-summary");
    setStatus(summary ? summary.textContent.replace(/\s+/g, " ").trim() : "");
  }

  function watchGrid(wrapper) {
    new MutationObserver(() => enhanceGrid(wrapper)).observe(wrapper, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    wrapper.addEventListener("keydown", (event) => {
      const th = event.target.closest && event.target.closest("th.gridjs-th-sort");
      if (th && event.key === " ") {
        event.preventDefault();
        th.click();
      }
    });
    enhanceGrid(wrapper);
  }

  function showMessageError() {
    const wrapper = document.getElementById("networksWrapper");
    wrapper.innerHTML = '<div class="alert alert-danger" role="alert"></div>';
    wrapper.firstChild.textContent = "Não foi possível carregar as instituições. Tente novamente mais tarde.";
  }

  async function getAllInstitutions() {
    // VuFind.path só é definido pelo layout depois deste script
    const url = VuFind.path + "/api/v1/search?type=AllFields&facet[]=instname_str&sort=relevance&page=1&limit=0";
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const data = await response.json();
    return data.facets.instname_str;
  }

  function convertToCSV(allInstitutions) {
    let csv = "Instituição,Quantidade de itens\r\n";
    allInstitutions.forEach((item) => {
      csv += '"' + (item.value || "").replaceAll('"', '""') + '",' + item.count + "\r\n";
    });
    return csv;
  }

  function exportsCSV(allInstitutions) {
    const btnExport = document.querySelector(".btn-export-csv");
    btnExport.addEventListener("click", () => {
      // BOM para o Excel reconhecer o UTF-8
      const blob = new Blob(["\uFEFF" + convertToCSV(allInstitutions)], { type: "text/csv;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "instituicoes-participantes.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    let allInstitutions;
    try {
      setLoader(true);
      allInstitutions = await getAllInstitutions();
    } catch (error) {
      console.error(error);
      showMessageError();
      return;
    } finally {
      setLoader(false);
    }
    const wrapper = document.getElementById("networksWrapper");
    new gridjs.Grid({
      columns: [
        {
          name: "Instituição",
          sort: true,
        },
        {
          name: "Documentos",
          sort: true,
          formatter: (count, row) => gridjs.html(
            '<a href="../Search/Results' + escapeHtml(row.cells[2].data) + '">' + count
            + '<span class="visually-hidden"> documentos de ' + escapeHtml(row.cells[0].data) + "</span></a>"
          ),
        },
        {
          name: "Endereço",
          hidden: true,
        },
      ],
      search: {
        selector: (cell, rowIndex, cellIndex) => (cellIndex === 0 ? cell : ""),
      },
      pagination: {
        limit: 20,
        summary: true,
      },
      language: {
        search: {
          placeholder: "🔍 Buscar por...",
        },
        sort: {
          sortAsc: "Ordenar em ordem crescente",
          sortDesc: "Ordenar em ordem decrescente",
        },
        pagination: {
          previous: "Anterior",
          next: "Próximo",
          navigate: (page, pages) => `Página ${page} de ${pages}`,
          page: (page) => `Página ${page}`,
          showing: "Mostrando",
          to: "a",
          of: "de",
          results: () => "instituições",
        },
        loading: "Carregando...",
        noRecordsFound: "Nenhuma instituição encontrada",
        error: "Erro ao carregar os dados",
      },
      data: allInstitutions.map((institution) => [
        institution.value,
        Number(institution.count),
        institution.href,
      ]),
    }).render(wrapper);
    watchGrid(wrapper);
    exportsCSV(allInstitutions);
  });
})();
