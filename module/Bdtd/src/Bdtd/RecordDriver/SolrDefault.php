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
}
