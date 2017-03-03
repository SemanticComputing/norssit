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
    .controller('CardsController', CardsController);

    /* @ngInject */
    function CardsController($scope, $location, $state, $uibModal, _, norssitService,
            FacetHandler, facetUrlStateHandlerService) {

        var vm = this;

        var nextPageNo;
        var maxPage;

        vm.openPage = openPage;
        vm.toArray = toArray;
        vm.nextPage = nextPage;
        vm.isScrollDisabled = isScrollDisabled;
        vm.removeFacetSelections = removeFacetSelections;
        vm.sortBy = sortBy;
        vm.getSortClass = getSortClass;

        vm.people = [];

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

        function removeFacetSelections() {
            $state.reload();
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

        var latestPageUpdate;
        function nextPage() {
            var updateId = _.uniqueId();
            latestPageUpdate = updateId;

            vm.isLoadingResults = true;
            if (nextPageNo++ <= maxPage) {
                vm.pager.getPage(nextPageNo-1, 24)
                .then(function(page) {
                    if (updateId !== latestPageUpdate) {
                        return;
                    }
                    vm.people = vm.people.concat(page);
                    vm.isLoadingResults = false;
                }).catch(handleError);
            } else {
                vm.isLoadingResults = false;
            }
        }

        function isScrollDisabled() {
            return vm.isLoadingResults || nextPageNo > maxPage;
        }

        function sortBy(sortBy) {
            var sort = $location.search().sortBy;
            if (sort === sortBy) {
                $location.search('desc', $location.search().desc ? null : true);
            }
            $location.search('sortBy', sortBy);
            return fetchResults({ constraint: vm.previousSelections });
        }

        function getSortBy() {
            var sortBy = $location.search().sortBy;
            if (!_.isString(sortBy)) {
                sortBy = '?ordinal';
            }
            var sort;
            if ($location.search().desc) {
                sort = 'DESC(' + sortBy + ')';
            } else {
                sort = sortBy;
            }
            return sortBy === '?ordinal' ? sort : sort + ' ?ordinal';
        }

        function getSortClass(sortBy, numeric) {
            var sort = $location.search().sortBy;
            var cls = numeric ? 'glyphicon-sort-by-order' : 'glyphicon-sort-by-alphabet';

            if (sort === sortBy) {
                if ($location.search().desc) {
                    return cls + '-alt';
                }
                return cls;
            }
        }

        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                    vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections);
        }

        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.people = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            nextPageNo = 0;
            norssitService.getResults(facetSelections, getSortBy())
            .then(function(pager) {
                return pager.getMaxPageNo().then(function(no) {
                    return [pager, no];
                });
            }).then(function(res) {
                if (latestUpdate !== updateId) {
                    return;
                }
                vm.pager = res[0];
                maxPage = res[1];
                vm.isLoadingResults = false;
                return nextPage();
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
