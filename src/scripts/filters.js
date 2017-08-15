(function() {

    'use strict';

    angular.module('facetApp')

    .filter('castArray', castArray)
    .filter('dateOrYear', dateOrYear);

    /* @ngInject */
    function castArray(_) {
        return function(input) {
            return _.castArray(input);
        };
    }

    /* @ngInject */
    function dateOrYear($filter, dateFilter) {
        return function(input, format, timezone) {
            if (input.toString().match(/^\d{4}$/)) {
                return input;
            }
            return dateFilter(input, format, timezone);
        };
    }

})();
