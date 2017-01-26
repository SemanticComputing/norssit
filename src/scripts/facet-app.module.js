/*
 * facetApp module definition
 */
(function() {

    'use strict';

    angular.module('facetApp', [
        'ui.router',
        'seco.facetedSearch',
        'ngTable',
        'angular.filter'
    ])

    .constant('_', _) // eslint-disable-line no-undef
    .constant('RESULTS_PER_PAGE', 25)
    .constant('PAGES_PER_QUERY', 1)

    .config(function($urlMatcherFactoryProvider) {
        $urlMatcherFactoryProvider.strictMode(false);
    })

    .config(function($urlRouterProvider){
        $urlRouterProvider.otherwise('/');
    })

    .config(function($stateProvider) {
        $stateProvider
        .state('facetApp', {
            url: '/',
            templateUrl: 'views/norssit.html',
            controller: 'MainController',
            controllerAs: 'vm'
        });
    });
})();
