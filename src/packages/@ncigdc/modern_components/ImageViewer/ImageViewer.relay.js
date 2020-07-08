// @flow

import React from 'react';
import { graphql } from 'react-relay';
import { parse } from 'query-string';
import { withRouter } from 'react-router-dom';
import { parseIntParam, parseFilterParam } from '@ncigdc/utils/uri';
import { compose, withPropsOnChange, withProps, withState } from 'recompose';
import Query from '@ncigdc/modern_components/Query';
import { makeFilter, addInFilters } from '@ncigdc/utils/filters';

export default (Component: ReactClass<*>) =>
  compose(
    withRouter,
    //withProps(({ location: { search } }) => ({
    //query: parse(search),
    //defaultSize: 10,
    //})),
    withPropsOnChange(
      ['location'],
      ({ location: { search }, defaultSize = 10 }) => {
        const query = parse(search);
        return {
          offset: parseIntParam(query.cases_offset, 0),
          size: parseIntParam(query.cases_size, defaultSize),
          filters: query.filters,
        };
      },
    ),
    withProps(({ offset, size }) => ({
      firstLoadSize: offset > 0 ? offset + size : size,
    })),
    withState('firstLoad', 'setFirstLoad', true),
    withPropsOnChange(
      ['offset', 'size', 'filters', 'fileId'],
      ({
        filters,
        offset,
        size,
        defaultSize,
        firstLoad,
        setFirstLoad,
        firstLoadSize,
        fileId,
      }) => {
        const parsedFilters = parseFilterParam(filters, null);
        let slideFilters = [
          {
            field: 'data_type',
            value: ['Slide Image'],
          },
          {
            field: 'files.access',
            value: ['open'],
          },
        ];
        let caseFilters = {
          op: 'and',
          content: [
            {
              op: 'in',
              content: {
                field: 'summary.experimental_strategies.experimental_strategy',
                value: ['Tissue Slide', 'Diagnostic Slide'],
              },
            },
          ],
        };

        if (fileId) {
          caseFilters = {
            ...caseFilters,
            content: [
              ...caseFilters.content,
              {
                op: 'in',
                content: {
                  field: 'file_id',
                  value: fileId,
                },
              },
            ],
          };
          slideFilters = [
            ...slideFilters,
            {
              field: 'file_id',
              value: fileId,
            },
          ];
        }
        const newProps = {
          variables: {
            filters: addInFilters(parsedFilters, caseFilters),
            slideFilter: makeFilter(slideFilters),
            cases_offset: offset,
            cases_size: firstLoad ? firstLoadSize : size,
          },
        };

        setFirstLoad(false);
        return newProps;
      },
    ),
  )((props: Object) => {
    return (
      <Query
        parentProps={props}
        minHeight={350}
        variables={props.variables}
        Component={Component}
        query={graphql`
          query ImageViewer_relayQuery(
            $filters: JSON
            $cases_size: Int
            $cases_offset: Int
          ) {
            viewer {
              repository {
                cases {
                  hits(
                    filters: $filters
                    first: $cases_size
                    offset: $cases_offset
                  ) {
                    total
                    edges {
                      node {
                        id
                        samples {
    		  				sample_id
                        }
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
