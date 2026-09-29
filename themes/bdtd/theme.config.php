<?php

/**
 * Tema da BDTD (VuFind 11, Bootstrap 5).
 *
 * Estende o bootstrap5 do VuFind. O CSS do legado (style.css, compilado de
 * scss/style.scss, e custom.css) é carregado depois do compiled.css do
 * bootstrap5, sem alteração; bdtd-bs5.css traz os ajustes de compatibilidade.
 * As fontes são servidas pelo próprio site (bdtd-fonts.css).
 */
return [
    'extends' => 'bootstrap5',
    // Sem 'priority': saem depois do CSS do tema pai, na ordem abaixo.
    'css' => [
        ['file' => 'bdtd-fonts.css'],
        ['file' => 'style.css'],
        ['file' => 'custom.css'],
        ['file' => 'bdtd-bs5.css'],
    ],
    'favicon' => 'icons/favicon.ico',
    // Ícones do tema (no legado, Unicons e glyphicons via CDN); o FontAwesome 7 já
    // vem no bootstrap5. Uso: $this->icon('bdtd-home').
    'icons' => [
        'aliases' => [
            'bdtd-home' => 'FontAwesome:house',
            'bdtd-advanced' => 'FontAwesome:circle-plus',
        ],
    ],
];
