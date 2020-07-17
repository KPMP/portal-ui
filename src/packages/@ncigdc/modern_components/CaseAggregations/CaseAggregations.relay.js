// @flow

import React from 'react';
import { graphql } from 'react-relay';
import { compose, withPropsOnChange } from 'recompose';
import { connect } from 'react-redux';
import { parse } from 'query-string';
import Query from '@ncigdc/modern_components/Query';
import { parseFilterParam } from '@ncigdc/utils/uri';
import withRouter from '@ncigdc/utils/withRouter';

const entityType = 'RepositoryCases';
export default (Component: ReactClass<*>) =>
  compose(
    withRouter,
    withPropsOnChange(
      ['location'],
      ({ location: { search }, defaultFilters = null }) => {
        const q = parse(search);
        const filters = parseFilterParam(q.filters, defaultFilters);
        return {
          filters,
        };
      },
    ),
    connect((state, props) => ({
      userSelectedFacets: state.customFacets[entityType],
    })),
    withPropsOnChange(
      ['userSelectedFacets', 'filters'],
      ({ userSelectedFacets, filters }) => {
        return {
          variables: {
            filters,
            repoCaseCustomFacetFields: userSelectedFacets
              .map(({ field }) => field)
              .join(','),
          },
        };
      },
    ),
  )((props: Object) => {
    return (
      <Query
        parentProps={props}
        minHeight={578}
        variables={props.variables}
        Component={Component}
        query={graphql`
          query CaseAggregations_relayQuery(
            $filters: JSON
          ) {
            viewer {
              Case { 
                  aggregations(
                    filters: $filters
                    aggregations_filter_themselves: false
                  ) {
                    provider {
                    	buckets {
                    		doc_count
                    		key
                    	}
                    }
                    demographics__sex {
                      buckets {
                        doc_count
                        key
                      }
                    }
    		  		demographics__age {
    		  			buckets {
    		  				doc_count
    		  				key
    		  			}
    		  		}
                    samples__tissue_type {
                    	buckets {
                    		doc_count
                    		key
                    	}
                    }
		    		samples__sample_type {
		    			buckets {
		    		  		doc_count
		    		  		key
		    		  	}
		    		},
		    		samples__sample_id {
		    			buckets {
		    				doc_count
		    				key
		    			}
		    		}
                  }
                }
              }
          }
        `}
      />
    );
  });
