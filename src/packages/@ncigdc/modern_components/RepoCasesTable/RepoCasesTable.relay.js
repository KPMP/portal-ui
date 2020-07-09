/* @flow */
/* eslint fp/no-class:0 */

import React from 'react';
import { graphql } from 'react-relay';
import { compose, withPropsOnChange } from 'recompose';
import { withRouter } from 'react-router-dom';
import { parse } from 'query-string';
import {
  parseIntParam,
  parseFilterParam,
  parseJSONParam,
} from '@ncigdc/utils/uri';
import Query from '@ncigdc/modern_components/Query';

export default (Component: React.Class<*>) =>
  compose(
    withRouter,
    withPropsOnChange(
      ['location', 'defaultFilters'],
      ({ location, defaultFilters = null, defaultSize = 10 }) => {
        const q = parse(location.search);
        return {
          variables: {
            cases_offset: parseIntParam(q.cases_offset, 0),
            cases_size: parseIntParam(q.cases_size, 20),
            cases_sort: parseJSONParam(q.cases_sort, null),
            filters: parseFilterParam(q.filters, defaultFilters),
            score: 'annotations.annotation_id',
          },
        };
      },
    ),
  )((props: Object) => {
    return (
      <Query
        parentProps={props}
        name="RepoCasesTable"
        minHeight={387}
        variables={props.variables}
        Component={Component}
        query={graphql`
          query RepoCasesTable_relayQuery(
            $cases_size: Int
            $cases_offset: Int
            $cases_sort: [Sort]
            $filters: JSON
          ) {
            viewer {
                Case {
                  hits(
                    first: $cases_size
                    offset: $cases_offset
                    sort: $cases_sort
                    filters: $filters
                  ) {
                    total
                    edges {
                      node {
                        samples {
                        	sample_id
                        }
                        demographics {
                          sex
                          age
                        }
                        provider
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
