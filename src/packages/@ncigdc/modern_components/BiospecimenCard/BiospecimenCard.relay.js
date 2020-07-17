// @flow

import React from 'react';
import { graphql } from 'react-relay';
import { makeFilter } from '@ncigdc/utils/filters';
import { compose, withPropsOnChange, branch, renderComponent } from 'recompose';
import Query from '@ncigdc/modern_components/Query';

export default (Component: ReactClass<*>) =>
  compose(
    branch(
      ({ caseId }) => !caseId,
      renderComponent(() => (
        <div>
          <pre>caseId</pre> must be provided
        </div>
      )),
    ),
    withPropsOnChange(['caseId'], ({ caseId }) => {
      return {
        variables: {
          filters: makeFilter([
            {
              field: 'cases.case_id',
              value: [caseId],
            },
          ]),
          fileFilters: makeFilter([
            { field: 'cases.case_id', value: [caseId] },
            {
              field: 'data_type',
              value: ['Biospecimen Supplement', 'Slide Image'],
            },
          ]),
        },
      };
    }),
  )((props: Object) => {
    return (
      <Query
        parentProps={props}
        minHeight={249}
        variables={props.variables}
        Component={Component}
        query={graphql`
          query BiospecimenCard_relayQuery(
            $filters: JSON
          ) {
            viewer {
                Case {
                  hits(first: 1, filters: $filters) {
                    edges {
                      node {
                        files {
                                file_name
                                file_size
                                data_format
                                file_id
                                access
                        }
                        samples {
                                sample_id
                                sample_type
                                tissue_type
                        }
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
