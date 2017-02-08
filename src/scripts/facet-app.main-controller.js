/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
    * Controller for the results view.
    */
    .controller('MainController', MainController);

    /* @ngInject */
    function MainController($scope, $uibModal, _, RESULTS_PER_PAGE,
                norssitService, NgTableParams, FacetHandler, facetUrlStateHandlerService) {

        var vm = this;

        vm.openPage = openPage;
        vm.toArray = toArray;

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        norssitService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function toArray(value) {
            return _.castArray(value);
        }

        function openPage(person) {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return person; }
                }
            });
        }

        function getFacetOptions() {
            var options = norssitService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }

        function updateResults(event, facetSelections) {
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            vm.isLoadingResults = true;

            norssitService.getResults(facetSelections)
            .then(function(pager) {
                vm.pager = pager;
                return vm.pager.getPage(0);
            })
            .then(function(page) {
                vm.page = page;
                vm.isLoadingResults = false;
                return page;
            });
        }
    }
})();
