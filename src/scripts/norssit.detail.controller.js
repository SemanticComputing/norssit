(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the person detail view.
    */
    .controller('DetailController', DetailController);

    /* @ngInject */
    function DetailController($stateParams, $uibModal, _, norssitService) {

        var vm = this;

        vm.openPage = openPage;

        norssitService.getPerson($stateParams.personId).then(function(person) {
            person.image = person.image ? _.castArray(person.image) : ['images/person_placeholder.svg'];
            vm.person = person;
        });

        function openPage() {
            $uibModal.open({
                component: 'registerPageModal',
                size: 'lg',
                resolve: {
                    person: function() { return vm.person; }
                }
            });
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
