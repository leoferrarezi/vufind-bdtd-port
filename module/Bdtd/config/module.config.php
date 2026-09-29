<?php

/**
 * Configuração do módulo Bdtd.
 */

namespace Bdtd\Module\Configuration;

return [
    'vufind' => [
        'plugin_managers' => [
            // Registros do Solr passam a usar o driver da BDTD
            'recorddriver' => [
                'factories' => [
                    \Bdtd\RecordDriver\SolrDefault::class => \VuFind\RecordDriver\SolrDefaultFactory::class,
                ],
                'aliases' => [
                    'solrdefault' => \Bdtd\RecordDriver\SolrDefault::class,
                    \VuFind\RecordDriver\SolrDefault::class => \Bdtd\RecordDriver\SolrDefault::class,
                ],
            ],
        ],
    ],
];
