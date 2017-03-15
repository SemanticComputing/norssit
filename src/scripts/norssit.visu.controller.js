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
            	google.charts.setOnLoadCallback(drawOccupation);
            	google.charts.setOnLoadCallback(drawOrganization);
            	google.charts.setOnLoadCallback(drawEducation);
            	google.charts.setOnLoadCallback(drawEnrollmentYear);
            	google.charts.setOnLoadCallback(drawMatriculationYear);
            	google.charts.setOnLoadCallback(drawbirthPlace);
            	google.charts.setOnLoadCallback(drawHobbies);
            	return;
	         });
        }

        function drawbirthPlace() {
        	drawPieChart('birthPlace', 'Synnyinpaikka', 'chart_birthPlace');
        }
        
        function drawOrganization() {
        	drawPieChart('organization', 'Työpaikka tai oppilaitos', 'chart_organization');
        }
        
        function drawOccupation() {
        	drawPieChart('occupation', 'Arvo tai ammatti', 'chart_occupation');
        }
        
        function drawEducation() {
        	drawPieChart('education', 'Koulutus', 'chart_education');
        }
        
        function drawHobbies() {
        	drawPieChart('hobby', 'Harrastukset', 'chart_hobbies');
        }
        
        function drawEnrollmentYear() {
        	drawLineChart('enrollmentYear', 'Aloitusvuosi', 'chart_enrollmentYear')
        }
        
        function drawMatriculationYear() {
        	drawLineChart('matriculationYear', 'Valmistumisvuosi', 'chart_matriculationYear')
        }
        
        
        function drawPieChart(prop, label, target) {
        	
        	var arr = countByProperty(vm.people, prop),
        	
            	data = google.visualization.arrayToDataTable( [[label, 'Lukumäärä']].concat(arr)),
            
            	options = { title: label },
            	
            	chart = new google.visualization.PieChart(document.getElementById(target));

            chart.draw(data, options);
        }
        
        
		function drawLineChart(prop, label, target) {
			var data = new google.visualization.DataTable(),
	
				options = {
						title: label
					},
			
				chart = new google.visualization.LineChart(document.getElementById(target));
		  
			data.addColumn('number', 'X');
			data.addColumn('number', 'Henkilöä');
			data.addRows(countByYear(vm.people, prop));
		  
			chart.draw(data, options);
		}
    
		
		function countByProperty(people, prop) {
			return countProperties(people, prop)
				.sort(function(a, b){ return b[1]-a[1] });
    	}
		
		
		function countByYear(people, prop) {
			var arr = countProperties(people, prop),
				res={},
				minY=2017, maxY=0;
			
			$.each(arr, function( i, value ) {
				var y=parseInt(value[0]);
				if (y<minY) minY=y;
				if (y>maxY) maxY=y;
				res[y]=value[1];
			});
			
			//	fill years with value of zero:
			for (var y=minY; y<=maxY; y++) {
				if (!(res.hasOwnProperty(y))) {
					res[y]=0;
				}
			}
			
			return $
				.map( res, function( value, key ) { return [[parseInt(key), value]]; })	
				.sort(function(a, b){ return a[0]-b[0] });
			
    	}
    	
		function countProperties(data, prop) {
			var res = {};
			
			$.each(data, function( i, value ) {
				if (value.hasOwnProperty(prop)) {
					var arr=value[prop];
					if (typeof arr === 'string') { arr=[arr]; }
					
					$.each(arr, function( i, y ) {
						if (res.hasOwnProperty(y)) {
							res[y] += 1;
						} else {
							res[y] = 1;
						}
					});
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

            return norssitVisuService.getResults(facetSelections)
            .then(function(pager) {
            	return pager.getTotalCount().then(function (count) { 
            		if (count>1000) {
            			return $q.reject('Too many results.');
            		}
            		return pager;
            	})  
            })
            .then(function(pager) {
                return pager.getAllSequentially(5000);
            }).then(function(res) {
                if (latestUpdate !== updateId) {
                    return;
                }
               
                vm.isLoadingResults = false;
                vm.people = res;
                return res;
            }).catch(handleError);
        }

        function handleError(error) {
            vm.isLoadingResults = false;
            vm.error = error;
        }
    }
})();
