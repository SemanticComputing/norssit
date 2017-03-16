(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .service('norssitVisuService', norssitVisuService);

    /* @ngInject */
    function norssitVisuService($q, $location, _, AdvancedSparqlService, objectMapperService) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
        this.getResults1 = getResults1;
        this.getResults2 = getResults2;
        // Get the facets.
        // Return a promise (because of translation).
        this.getFacets = getFacets;
        // Get the facet options.
        // Return an object.
        this.getFacetOptions = getFacetOptions;
        /* Implementation */

        var facets = {
            // Text search facet for name
            entryText: {
                facetId: 'entryText',
                predicate: '<http://ldf.fi/schema/person_registry/entryText>',
                name: 'Haku',
                enabled: true
            },
            link: {
                facetId: 'link',
                choices: [
                    {
                        id: 'wikipedia',
                        pattern: '?id <http://ldf.fi/norssit/wikipedia> [] .',
                        label: 'Wikipedia'
                    },
                    {
                        id: 'kansallisbiografia',
                        pattern: '?id <http://ldf.fi/norssit/kansallisbiografia> [] .',
                        label: 'Kansallisbiografia'
                    },
                    {
                        id: 'kirjasampo',
                        pattern: '?id <http://ldf.fi/norssit/kirjasampo> [] .',
                        label: 'Kirjasampo'
                    },
                    {
                        id: 'kulttuurisampo',
                        pattern: '?id <http://ldf.fi/norssit/kulttuurisampo> [] .',
                        label: 'Kulttuurisampo'
                    },
                    {
                        id: 'sotasampo',
                        pattern: '?id <http://ldf.fi/norssit/warsa> [] .',
                        label: 'Sotasampo'
                    },
                    {
                        id: 'blf',
                        pattern: '?id <http://ldf.fi/norssit/sls_biografi> [] .',
                        label: 'BLF'
                    },
                    {
                        id: 'wikidata',
                        pattern: '?id <http://ldf.fi/norssit/wikidata> [] .',
                        label: 'Wikidata'
                    },
                    {
                        id: 'ulan',
                        pattern: '?id <http://ldf.fi/norssit/ulan> [] .',
                        label: 'ULAN'
                    },
                    {
                        id: 'viaf',
                        pattern: '?id <http://ldf.fi/norssit/viaf> [] .',
                        label: 'VIAF'
                    },
                    {
                        id: 'genicom',
                        pattern: '?id <http://ldf.fi/norssit/genicom> [] .',
                        label: 'Geni.com'
                    }
                ],
                enabled: true,
                name: 'Linkit'
            },
            familyName: {
                facetId: 'familyName',
                predicate: '<http://schema.org/familyName>',
                name: 'Sukunimi'
            },
            birthPlace: {
                facetId: 'birthPlace',
                predicate: '<http://ldf.fi/schema/person_registry/birthPlace>',
                name: 'Syntymäpaikka',
                enabled: true
            },
            enrollmentYear: {
                facetId: 'enrollmentYear',
                predicate: '<http://ldf.fi/schema/person_registry/enrollmentYear>',
                name: 'Aloittamisvuosi',
                enabled: true
            },
            matriculationYear: {
                facetId: 'matriculationYear',
                predicate: '<http://ldf.fi/schema/person_registry/matriculationYear>',
                name: 'Valmistumisvuosi',
                enabled: true
            },
            occupation: {
                facetId: 'occupation',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/a',
                name: 'Arvo tai ammatti',
                enabled: true
            },
            education: {
                facetId: 'education',
                predicate: '^<http://ldf.fi/schema/bioc/education_inheres_in>/a',
                name: 'Koulutus',
                enabled: true
            },
            organization: {
                facetId: 'organization',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/<http://ldf.fi/schema/bioc/relates_to>',
                name: 'Työpaikka tai oppilaitos',
                enabled: true
            },
            hobby: {
                facetId: 'hobby',
                predicate: '<http://schema.org/hobby>',
                name: 'Harrastus'
            },
            medal: {
                facetId: 'medal',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/<http://ldf.fi/schema/bioc/relates_to_medal>',
                name: 'Kunniamerkit ja -mitalit',
                enabled: true
            },
            rank: {
                facetId: 'rank',
                predicate: '^<http://ldf.fi/schema/bioc/title_inheres_in>/<http://ldf.fi/schema/bioc/relates_to_rank>',
                name: 'Sotilasarvo tai -toimi',
                enabled: true
            }
        };

        var prefixes =
        ' PREFIX hobbies: <http://ldf.fi/hobbies/> ' +
        ' PREFIX norssit: <http://ldf.fi/norssit/> ' +
        ' PREFIX nach: <http://ldf.fi/norssit/achievements/> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX person_registry: <http://ldf.fi/schema/person_registry/> ' +
        ' PREFIX places: <http://ldf.fi/places/> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX relatives: <http://ldf.fi/relatives/> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX schemax: <http://topbraid.org/schemax/> ' +
        ' PREFIX dct: <http://purl.org/dc/terms/> ' +
        ' PREFIX foaf: <http://xmlns.com/foaf/0.1/> ' +
        ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX bioc: <http://ldf.fi/schema/bioc/> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        // The query for the results.
        // ?id is bound to the norssit URI.
        var query = prefixes +
        	'  SELECT distinct ?occupation ?education ?organization ?id ' +
            '  WHERE {' +
            '  	 { <RESULT_SET> } ' +
            '    OPTIONAL { ?id ^bioc:title_inheres_in/a/skos:prefLabel ?occupation . }' +
            '    OPTIONAL { ?id ^bioc:education_inheres_in/a/skos:prefLabel ?education . }' +
            '	 OPTIONAL { ?id ^bioc:title_inheres_in/bioc:relates_to/skos:prefLabel ?organization . }' +
            '  } ';
            
       var queryYears = prefixes +
        	'  SELECT ?enrollmentYear ?matriculationYear ' +
            '  WHERE {' +
            '  	 { <RESULT_SET> } ' +
            '    OPTIONAL { ?id person_registry:enrollmentYear ?enrollmentYear . }' +
            '    OPTIONAL { ?id person_registry:matriculationYear ?matriculationYear . }' +
            '  } ';

        
        // The SPARQL endpoint URL
        var endpointUrl = 'https://ldf.fi/norssit/sparql';

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://xmlns.com/foaf/0.1/Person>',
            preferredLang : 'fi'
        };

        var endpoint = new AdvancedSparqlService(endpointUrl, objectMapperService);
        
        function getResults1(facetSelections) {
        	var q2 = query.replace("<RESULT_SET>", facetSelections.constraint.join(' '));
        	return endpoint.getObjectsNoGrouping(q2);
        }
        
        function getResults2(facetSelections) {
        	var cons = facetSelections.constraint.join(' ');
        	return endpoint.getObjectsNoGrouping(queryYears.replace("<RESULT_SET>", cons));
        }
        
        function getResults(facetSelections) {
        	var promises = [
            	this.getResults1(facetSelections),
            	this.getResults2(facetSelections)
            ];
        	return $q.all(promises);
        }
        function getFacets() {
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }

    }
})();
