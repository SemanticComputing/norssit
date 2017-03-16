/*
 * Semantic faceted search
 *
 */

(function() {

    'use strict';

    angular.module('facetApp')

    /*
    * Controller for the results view.
    */
    .controller('VisuController', VisuController);

    /* @ngInject */
    function VisuController($scope, $location, $q, $state, _, norssitVisuService,
            FacetHandler, facetUrlStateHandlerService) {

        var vm = this;
   
        vm.people = []; 
		  vm.removeFacetSelections = removeFacetSelections;

		  google.charts.load('current', {packages: ['corechart', 'line']});
		  //google.charts.load('current', {'packages':['corechart']});

        var initListener = $scope.$on('sf-initial-constraints', function(event, config) {
            updateResults(event, config);
            initListener();
        });
        $scope.$on('sf-facet-constraints', updateResults);

        norssitVisuService.getFacets().then(function(facets) {
            vm.facets = facets;
            vm.facetOptions = getFacetOptions();
            vm.facetOptions.scope = $scope;
            vm.handler = new FacetHandler(vm.facetOptions);
        });

        function removeFacetSelections() {
            $state.reload();
        }

        function getFacetOptions() {
            var options = norssitVisuService.getFacetOptions();
            options.initialState = facetUrlStateHandlerService.getFacetValuesFromUrlParams();
            return options;
        }


        function updateResults(event, facetSelections) {
            if (vm.previousSelections && _.isEqual(facetSelections.constraint,
                    vm.previousSelections)) {
                return;
            }
            vm.previousSelections = _.clone(facetSelections.constraint);
            facetUrlStateHandlerService.updateUrlParams(facetSelections);
            return fetchResults(facetSelections).then(function (people) {
            	// console.log(people); 
            	google.charts.setOnLoadCallback(function () { drawPieChart('occupation', 'Arvo tai ammatti', 'chart_occupation'); });
            	google.charts.setOnLoadCallback(function () { drawPieChart('organization', 'Työpaikka tai oppilaitos', 'chart_organization'); });
            	google.charts.setOnLoadCallback(function () { drawPieChart('education', 'Koulutus', 'chart_education'); });
            	google.charts.setOnLoadCallback(function () { drawHistoChart('enrollmentYear', 'Aloitusvuosi', 'chart_enrollmentYear')});
            	google.charts.setOnLoadCallback(function () { drawHistoChart('matriculationYear', 'Valmistumisvuosi', 'chart_matriculationYear') });
            	// google.charts.setOnLoadCallback(drawbirthPlace);
            	// google.charts.setOnLoadCallback(drawHobbies);
            	return;
	         });
        }

        function drawbirthPlace() { drawPieChart('birthPlace', 'Synnyinpaikka', 'chart_birthPlace'); }
        
        function drawHobbies() { drawPieChart('hobby', 'Harrastukset', 'chart_hobbies');}
        
        function drawEnrollmentYear() {drawHistoChart('enrollmentYear', 'Aloitusvuosi', 'chart_enrollmentYear')}
        
        
        
        
        function drawPieChart(prop, label, target) {
        	
        	var arr = countByProperty(vm.people, prop),
        	
            	data = google.visualization.arrayToDataTable( [[label, 'Lukumäärä']].concat(arr)),
            
            	options = { title: label },
            	
            	chart = new google.visualization.PieChart(document.getElementById(target));

            chart.draw(data, options);
        }
        
        
		function drawHistoChart(prop, label, target) {
			var data = new google.visualization.DataTable(),
	
				options = {
				    title: label,
				    legend: { position: 'none' },
				    colors: ['green'],
				    histogram: { bucketSize: 1.0, hideBucketItems: true, maxNumBuckets:125 },
				    hAxis: {
				    	slantedText:false, 
				    	maxAlternation: 1, 
				    	format: '' 
				    	}
				  },
			
				chart = new google.visualization.Histogram(document.getElementById(target));
		  
			data.addColumn('number');
			data.addRows(countByYear(vm.people, prop));
		  
			chart.draw(data, options);
		}
    
		
		function countByProperty(people, prop) {
			return countProperties(people, prop)
				.sort(function(a, b){ return b[1]-a[1] });
    	}
		
    	
		function countByYear(data, prop) {
			var res = {};
			
			$.each(data, function( i, value ) {
				if (value.hasOwnProperty(prop)) {
					res[value['id']] = parseInt(value[prop]);
				}
			});
			var resyears = {};
			$.each(res, function( i, value ) {
				if (resyears.hasOwnProperty(value)) {
					resyears[value] += 1;
				} else {
					resyears[value] = 1;
				}
			});
			
			return $.map( res, function( value, key ) {
				return [[value]];
			});
    	}
		
		function countProperties(data, prop) {
			var res = {};
			
			$.each(data, function( i, value ) {
				if (value.hasOwnProperty(prop)) {
					var y=value[prop],
						c=parseInt(value['count']);
					
					if (res.hasOwnProperty(y)) {
						res[y] += c;
					} else {
						res[y] = c;
					}
				}
			});
			
			return $.map( res, function( value, key ) {
				return [[key, value]];
			});
    	}
		
		
        var latestUpdate;
        function fetchResults(facetSelections) {
            vm.isLoadingResults = true;
            vm.people = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return norssitVisuService.getResults(facetSelections).then(function(res) {
            	if (latestUpdate !== updateId) {
                    return;
                }
               
                vm.isLoadingResults = false;
                vm.people = res;
                return res;
            }).catch(handleError);
        }

        function handleError(error) {
        	console.log(error)
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
