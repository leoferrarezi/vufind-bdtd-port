<?php

/**
 * Driver de registro da BDTD.
 *
 * PHP version 8
 *
 * @category BDTD
 * @package  RecordDrivers
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://github.com/projetos-codic-ibict/vufind-bdtd
 */

namespace Bdtd\RecordDriver;

/**
 * Estende o SolrDefault do VuFind com os campos de teses e dissertações
 * (índice no formato LA Referencia / DSpace). Os métodos entram por partes.
 *
 * @category BDTD
 * @package  RecordDrivers
 * @license  http://opensource.org/licenses/gpl-2.0.php GNU General Public License
 * @link     https://github.com/projetos-codic-ibict/vufind-bdtd
 */
class SolrDefault extends \VuFind\RecordDriver\SolrDefault
{
    /**
     * Texto exibido quando a instituição não informou um campo.
     *
     * @var string
     */
    public const NA_MESSAGE = 'Não Informado pela instituição';

    /**
     * Valores, sem repetição, de um conjunto de campos do Solr.
     *
     * @param array $fields Campos
     *
     * @return array
     */
    public function getFieldsValuesDefault(array $fields): array
    {
        $values = [];
        foreach ($fields as $field) {
            if (isset($this->fields[$field])) {
                $values = array_merge($values, (array)$this->fields[$field]);
            }
        }
        return array_values(array_unique($values));
    }

    /**
     * Valores de um conjunto de campos; sem valores, devolve NA_MESSAGE.
     *
     * @param array $fields    Campos
     * @param bool  $naMessage Devolver NA_MESSAGE quando não houver valores?
     *
     * @return array
     */
    public function getFieldsValues(array $fields, bool $naMessage = true): array
    {
        $values = $this->getFieldsValuesDefault($fields);
        if (!$values && $naMessage) {
            $values[] = self::NA_MESSAGE;
        }
        return $values;
    }

    /**
     * Primeiro valor de um campo (ou NA_MESSAGE).
     *
     * @param string $field Campo
     *
     * @return string
     */
    public function getFieldValue(string $field): string
    {
        return $this->getFieldsValues([$field])[0];
    }

    /**
     * Autores sem repetição, com o perfil Lattes de cada um.
     *
     * @param array $dataFields Dados extras por autor (ver getAuthorDataFields)
     *
     * @return array
     */
    public function getDeduplicatedAuthors($dataFields = ['profile'])
    {
        return parent::getDeduplicatedAuthors($dataFields);
    }

    /**
     * Perfis Lattes dos autores.
     *
     * @return array
     */
    public function getPrimaryAuthorsProfiles(): array
    {
        return $this->getFieldsValues(['dc.contributor.authorLattes.fl_str_mv'], false);
    }

    /**
     * Orientadores, coorientadores e banca, cada um com os dados extras pedidos
     * (por padrão, o perfil Lattes). Usa get<Tipo>Authors e get<Tipo>AuthorsProfiles.
     *
     * @param array $dataFields Dados extras por pessoa
     *
     * @return array
     */
    public function getContributors(array $dataFields = ['profile']): array
    {
        $contributors = [];
        foreach (['advisor', 'coadvisor', 'referee'] as $type) {
            $contributors[$type] = $this->getAuthorDataFields($type, $dataFields);
        }
        return $contributors;
    }

    /**
     * Orientadores.
     *
     * @return array
     */
    public function getAdvisorAuthors(): array
    {
        return $this->getFieldsValues(
            ['dc.contributor.advisor1.fl_str_mv', 'dc.contributor.advisor2.fl_str_mv']
        );
    }

    /**
     * Perfis Lattes dos orientadores.
     *
     * @return array
     */
    public function getAdvisorAuthorsProfiles(): array
    {
        return $this->getFieldsValues(
            ['dc.contributor.advisor1Lattes.fl_str_mv', 'dc.contributor.advisor2Lattes.fl_str_mv'],
            false
        );
    }

    /**
     * Coorientadores.
     *
     * @return array
     */
    public function getCoadvisorAuthors(): array
    {
        return $this->getFieldsValues(['dc.contributor.co.fl_str_mv'], false);
    }

    /**
     * Perfis Lattes dos coorientadores.
     *
     * @return array
     */
    public function getCoadvisorAuthorsProfiles(): array
    {
        return $this->getFieldsValues(
            ['dc.contributor.advisor-co1Lattes.fl_str_mv', 'dc.contributor.advisor-co2Lattes.fl_str_mv'],
            false
        );
    }

    /**
     * Membros da banca.
     *
     * @return array
     */
    public function getRefereeAuthors(): array
    {
        return $this->getFieldsValues($this->numberedFields('dc.contributor.referee%d.fl_str_mv', 5));
    }

    /**
     * Perfis Lattes dos membros da banca.
     *
     * @return array
     */
    public function getRefereeAuthorsProfiles(): array
    {
        return $this->getFieldsValues(
            $this->numberedFields('dc.contributor.referee%dLattes.fl_str_mv', 5),
            false
        );
    }

    /**
     * Assuntos de um campo, no formato de getAllSubjectHeadings().
     *
     * @param string $field    Campo do Solr
     * @param string $type     Tipo do assunto
     * @param string $source   Vocabulário de origem
     * @param bool   $extended Formato estendido (heading, type, source)?
     *
     * @return array
     */
    public function getSubjectsByField(string $field, string $type, string $source, bool $extended = false): array
    {
        return array_map(
            fn ($heading) => $extended
                ? ['heading' => [$heading], 'type' => $type, 'source' => $source]
                : [$heading],
            $this->getFieldsValues([$field], false)
        );
    }

    /**
     * Todos os assuntos: CNPq, inglês, espanhol e português.
     *
     * @param bool $extended Formato estendido?
     *
     * @return array
     */
    public function getAllSubjectHeadings($extended = false)
    {
        return array_merge(
            $this->getSubjectsByField('dc.subject.cnpq.fl_str_mv', 'cnpq', 'cnpq', $extended),
            $this->getSubjectsByField('dc.subject.eng.fl_str_mv', 'original', 'eng', $extended),
            $this->getSubjectsByField('dc.subject.spa.fl_str_mv', 'original', 'spa', $extended),
            $this->getSubjectsByField('dc.subject.por.fl_str_mv', 'original', 'por', $extended)
        );
    }

    /**
     * Assuntos CNPq.
     *
     * @return array
     */
    public function getCNPQSubjects(): array
    {
        return $this->getSubjectsByField('dc.subject.cnpq.fl_str_mv', 'cnpq', 'cnpq');
    }

    /**
     * Assuntos em inglês.
     *
     * @return array
     */
    public function getEngSubjects(): array
    {
        return $this->getSubjectsByField('dc.subject.eng.fl_str_mv', 'original', 'eng');
    }

    /**
     * Assuntos em espanhol.
     *
     * @return array
     */
    public function getSpaSubjects(): array
    {
        return $this->getSubjectsByField('dc.subject.spa.fl_str_mv', 'original', 'spa');
    }

    /**
     * Assuntos em português.
     *
     * @return array
     */
    public function getPorSubjects(): array
    {
        return $this->getSubjectsByField('dc.subject.por.fl_str_mv', 'original', 'por');
    }

    /**
     * Identificador OAI-PMH do registro na origem.
     *
     * @return ?string
     */
    public function getIdentifierOAI(): ?string
    {
        return $this->getFieldsValuesDefault(['oai_identifier_str'])[0] ?? null;
    }

    /**
     * Identificador do repositório de origem.
     *
     * @return ?string
     */
    public function getRepositoryID(): ?string
    {
        return $this->getFieldsValuesDefault(['repository_id_str'])[0] ?? null;
    }

    /**
     * Nomes de campos numerados (ex.: referee1 a referee5).
     *
     * @param string $pattern Padrão sprintf com %d
     * @param int    $count   Quantidade
     *
     * @return array
     */
    protected function numberedFields(string $pattern, int $count): array
    {
        return array_map(fn ($i) => sprintf($pattern, $i), range(1, $count));
    }
}
