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
            // Meta tags Dublin Core com o resumo (DC.description)
            'metadatavocabulary' => [
                'factories' => [
                    \Bdtd\MetadataVocabulary\DublinCore::class => \Laminas\ServiceManager\Factory\InvokableFactory::class,
                ],
                'aliases' => [
                    'dublincore' => \Bdtd\MetadataVocabulary\DublinCore::class,
                ],
            ],
            // Campos exibidos na página do registro (escolhidos pelo driver)
            'recorddataformatter_specs' => [
                'factories' => [
                    \Bdtd\RecordDataFormatter\Specs\Bdtd::class
                        => \VuFind\RecordDataFormatter\Specs\DefaultRecordFactory::class,
                ],
            ],
        ],
    ],
];
