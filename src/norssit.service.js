(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
     * Casualty service
     */
    .service('norssitService', norssitService);

    /* @ngInject */
    function norssitService($q, _, FacetResultHandler) {

        /* Public API */

        // Get the results based on facet selections.
        // Return a promise.
        this.getResults = getResults;
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
            familyName: {
                facetId: 'familyName',
                predicate: '<http://schema.org/familyName>',
                name: 'Sukunimi'
            },
            birthPlace: {
                facetId: 'birthPlace',
                predicate: '<http://schema.org/birthPlace>',
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
            hobby: {
                facetId: 'hobby',
                predicate: '<http://schema.org/hobby>',
                name: 'Harrastus'
            }
        };

        var prefixes =
        ' PREFIX hobbies: <http://ldf.fi/hobbies/> ' +
        ' PREFIX norssit: <http://ldf.fi/norssit/> ' +
        ' PREFIX owl: <http://www.w3.org/2002/07/owl#> ' +
        ' PREFIX person_registry: <http://ldf.fi/schema/person_registry/> ' +
        ' PREFIX places: <http://ldf.fi/places/> ' +
        ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
        ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
        ' PREFIX relatives: <http://ldf.fi/relatives/> ' +
        ' PREFIX schema: <http://schema.org/> ' +
        ' PREFIX schemax: <http://topbraid.org/schemax/> ' +
        ' PREFIX xml: <http://www.w3.org/XML/1998/namespace> ' +
        ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ';

        // The query for the results.
        // ?id is bound to the norssit URI.
        var query =
        ' SELECT * WHERE {' +
        '  { ' +
        '    <RESULT_SET> ' +
        '  } ' +
        '  OPTIONAL { ?id schema:givenName ?givenName . }' +
        '  OPTIONAL { ?id schema:familyName ?familyName . }' +
        '  OPTIONAL { ?id schema:birthPlace ?birthPlace . }' +
        '  OPTIONAL { ?id schema:birthDate ?birthDate . }' +
        '  OPTIONAL { ?id schema:deathDate ?deathDate . }' +
        '  OPTIONAL { ?id schema:hobby ?hobby . }' +
        '  OPTIONAL { ?id person_registry:pageNumber ?pageNumber . }' +
        '  OPTIONAL { ?id person_registry:pageImageURL ?pageImageURL . }' +
        '  OPTIONAL { ?id person_registry:relatedNorssi ?relatedNorssi . }' +
        '  OPTIONAL { ?id person_registry:enrollmentYear ?enrollmentYear . }' +
        '  OPTIONAL { ?id person_registry:matriculationYear ?matriculationYear . }' +
        '  OPTIONAL { ?id person_registry:entryText ?entryText . }' +
        ' }';

        // The SPARQL endpoint URL
        var endpointUrl = 'http://localhost:3030/norssit/sparql';

        var facetOptions = {
            endpointUrl: endpointUrl,
            rdfClass: '<http://xmlns.com/foaf/0.1/Person>',
            preferredLang : 'fi'
        };

        var resultOptions = {
            queryTemplate: query,
            prefixes: prefixes,
            pagesPerQuery: 2 // get two pages of results per query
        };

        // The FacetResultHandler handles forming the final queries for results,
        // querying the endpoint, and mapping the results to objects.
        var resultHandler = new FacetResultHandler(endpointUrl, resultOptions);

        function getResults(facetSelections) {
            // Get the results sorted by ?name.
            // Any variable declared in facetOptions.constraint can be used in the sorting,
            // and any valid SPARQL ORDER BY sequence can be given.
            // The results are sorted by URI by default.
            return resultHandler.getResults(facetSelections, '?familyName ?givenName');
        }

        function getFacets() {
            // Translate the facet headers.
            var facetsCopy = angular.copy(facets);
            return $q.when(facetsCopy);
        }

        function getFacetOptions() {
            return facetOptions;
        }
    }
})();
