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
        vm.startYear = [];
        vm.topTitles = [];
        vm.topOrgs = [];
		vm.removeFacetSelections = removeFacetSelections;

		google.charts.load('current', {packages: ['corechart', 'line', 'sankey']});

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
            	google.charts.setOnLoadCallback(drawSankeyChart);
            	google.charts.setOnLoadCallback(function () { drawPieChart('occupation', 'Arvo tai ammatti', 'chart_occupation'); });
            	google.charts.setOnLoadCallback(function () { drawPieChart('organization', 'Työpaikka tai oppilaitos', 'chart_organization'); });
            	google.charts.setOnLoadCallback(function () { drawPieChart('education', 'Koulutus', 'chart_education'); });
            	google.charts.setOnLoadCallback(function () { drawHistoChart('enrollmentYear', 'Aloitusvuosi', 'chart_enrollmentYear')});
            	google.charts.setOnLoadCallback(function () { drawHistoChart('matriculationYear', 'Valmistumisvuosi', 'chart_matriculationYear') });
            	google.charts.setOnLoadCallback(function () { drawColumnChart(vm.topTitles, 'Viisi yleisintä virkaa vuosikymmenittäin', 'chart_topeducation') });
            	google.charts.setOnLoadCallback(function () { drawColumnChart(vm.topOrgs, 'Viisi suosituinta organisaatiota vuosikymmenittäin', 'chart_toporganization') });
            	
            	// google.charts.setOnLoadCallback(drawbirthPlace);
            	// google.charts.setOnLoadCallback(drawHobbies);
            	return;
	         });
        }

        function drawbirthPlace() { drawPieChart('birthPlace', 'Synnyinpaikka', 'chart_birthPlace'); }
        
        function drawHobbies() { drawPieChart('hobby', 'Harrastukset', 'chart_hobbies');}
        
        function drawEnrollmentYear() {drawHistoChart('enrollmentYear', 'Aloitusvuosi', 'chart_enrollmentYear')}
        
        
        function drawColumnChart(data, label, target) {
        	
        	var timegap = 10,
        		res = {};
        	$.each(data, function( i, value ) {
        		if (value.hasOwnProperty('label')) {
					var y = value['label'];
					if (!res.hasOwnProperty(y)) res[y]={};
					res[y][value['year']] = value['count'];
				}
			});
        	
        	var data = new google.visualization.DataTable();
            data.addColumn('number', 'X');
            
        	var rows = {}, 
        		iter = 1;
        	$.each(res, function( key, values ) {
        		data.addColumn('number', key);
        		$.each(values, function( y, count ) {
        			var year = Math.floor(parseInt(y)/timegap)*timegap;
            		if (!rows.hasOwnProperty(year)) rows[year] = [parseInt(year),0,0,0,0,0];
            		rows[year][iter] += parseInt(count);
    			});
        		iter++;
			});
        	
        	rows = $.map( rows, function( value, key ) {
				return [ value ];
			});
            data.addRows(rows);
            
            var options = {
            		title: label,
            		hAxis: {
            			title: 'Vuosikymmen'
            		},
            		vAxis: {
            			title: 'Henkilöä'
            		}
            	};

            var chart = new google.visualization.ColumnChart(document.getElementById(target));
            chart.draw(data, options);
          }
        
       
        
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
				    histogram: { bucketSize: 1.0, hideBucketItems: true, maxNumBuckets:150 },
				    hAxis: {
				    	slantedText:false, 
				    	maxAlternation: 1, 
				    	format: '' 
				    	},
			    	width: '95%', 
			    	height:500
				  },
			
				chart = new google.visualization.Histogram(document.getElementById(target));
		  
			data.addColumn('number');
			data.addRows(countByYear(vm.years, prop));
		  
			chart.draw(data, options);
		}
    
		function drawSankeyChart() {
			
			var prop 	= 'education',
				prop2 	= 'organization',
				res 	= {},
				res2	= {},
				N = 10;
			
			$.each(vm.people, function( i, value ) {
				if (value.hasOwnProperty(prop) && value.hasOwnProperty(prop2)) {
					var y=value[prop],
						y2=value[prop2];
					
					if (res.hasOwnProperty(y)) {
						res[y] += 1;
					} else {
						res[y] = 1;
					}
					
					if (res2.hasOwnProperty(y2)) {
						res2[y2] += 1;
					} else {
						res2[y2] = 1;
					}
				}
			});
			
			res = $.map( res, function( value, key ) { return [[key, value]]; })
				.sort(function(a, b){ return b[1]-a[1] });
			
			res2 = $.map( res2, function( value, key ) { return [[key, value]];})
				.sort(function(a, b){ return b[1]-a[1] });
			
			var sear = {}, 
				sear2 = {};
			
			$.each(res,  function( i, value ) { 
				sear[value[0]] = {
						index: (i<N-1 ? i : N-1)
						}
				});
		
		
			$.each(res2, function( i, value ) { 
				sear2[value[0]] = {
						index: (i<N-1 ? i : N-1)
						}
				});
			
			
			var arr = $.map(new Array(Math.min(N,res.length)), function(i,v) { 
				return [ $.map(new Array(Math.min(N,res2.length)), function(i,v) {return 0;}) ];
				});
			
			$.each(vm.people, function( i, value ) {
				if (value.hasOwnProperty(prop) && value.hasOwnProperty(prop2)) {
					var y = value[prop], y2 = value[prop2];
					arr[sear[y]['index']][sear2[y2]['index']] += 1;
				}
			});
			
			var arr2 = [];
			for (var i=0; i<arr.length; i++) {
				for (var j=0; j<arr[i].length; j++) {
					arr2.push( [
						j<N-1 ? res2[j][0] : 'muu laitos',
						i<N-1 ? res[i][0] : 'muu arvo',
						arr[i][j] ] );
				}
			}
			
			var data = new google.visualization.DataTable();
	        data.addColumn('string', prop2);
	        data.addColumn('string', prop);
	        data.addColumn('number', 'Weight');
	        data.addRows(arr2);

	        // Sets chart options.
	        var options = {
	        		title: 'Otsikko',
	        		sankey: {
	        	        node: 	{ 
	        	        		label: { fontSize: 14,
	        	                         color: '#000',
	        	                         bold: true },
	        	                labelPadding: 12
	        	                }
	        				},
	        };

	        // Instantiates and draws our chart, passing in some options.
	        var chart = new google.visualization.Sankey(document.getElementById('chart_sankey'));
	        chart.draw(data, options);
	        
		}
		
		
		function countByProperty(data, prop) {
			return countProperties(data, prop)
				.sort(function(a, b){ return b[1]-a[1] });
    	}
		
    	
		function countByYear(data, prop) {
			var res = [];
			$.each(data, function( i, value ) {
				if (value.hasOwnProperty(prop)) {
					res.push([parseInt(value[prop])]);
				}
			});
			return res ;
    	}
		
		function countProperties(data, prop) {
			var res = {};
			$.each(data, function( i, value ) {
				if (value.hasOwnProperty(prop)) {
					var y=value[prop];
					
					if (res.hasOwnProperty(y)) {
						res[y] += 1;
					} else {
						res[y] = 1;
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
            vm.years = [];
            vm.topTitles = [];
            vm.topOrgs = [];
            vm.error = undefined;

            var updateId = _.uniqueId();
            latestUpdate = updateId;

            return norssitVisuService.getResults(facetSelections).then(function(res) {
            	if (latestUpdate !== updateId) {
                    return;
                }
               
                vm.isLoadingResults = false;
                vm.people = res[0];
                vm.years = res[1];
                vm.topTitles = res[2];
                vm.topOrgs = res[3];
                
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
