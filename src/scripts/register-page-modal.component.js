(function() {
    'use strict';

    angular.module('facetApp')

    .component('registerPageModal', {
        templateUrl: 'views/page-modal.html',
        controller: RegisterPageModalController,
        bindings: {
            resolve: '<',
            close: '&',
            dismiss: '&'
        }
    });

    /* @ngInject */
    function RegisterPageModalController($scope) {
        var vm = this;

        vm.close = close;

        vm.$onInit = function() {
            vm.person = vm.resolve.person;
        };

        function close() {
            return $scope.$close();
        }
    }
})();
