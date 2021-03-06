/* @flow */
/* eslint jsx-a11y/no-static-element-interactions: 0, max-len: 1 */

import React from 'react';
import Relay from 'react-relay/classic';

import _ from 'lodash';
import {
  compose,
  withState,
  setDisplayName,
  lifecycle,
  withPropsOnChange,
} from 'recompose';
import { connect } from 'react-redux';

import Modal from '@ncigdc/uikit/Modal';
import SuggestionFacet from '@ncigdc/components/Aggregations/SuggestionFacet';
import FacetSelection from '@ncigdc/components/FacetSelection';
import FacetWrapper from '@ncigdc/components/FacetWrapper';
import FacetHeader from '@ncigdc/components/Aggregations/FacetHeader';

import withFacetSelection from '@ncigdc/utils/withFacetSelection';
import escapeForRelay from '@ncigdc/utils/escapeForRelay';
import tryParseJSON from '@ncigdc/utils/tryParseJSON';

import { IBucket } from '@ncigdc/components/Aggregations/types';

import { withTheme } from '@ncigdc/theme';
import FileIcon from '@ncigdc/theme/icons/File';
import { Row } from '@ncigdc/uikit/Flex';

const presetFacets = [
  { title: 'File', field: 'file_id', full: 'file_id', type: 'keyword' },
  { field: 'data_category', full: 'data_category', type: 'keyword' },
  { field: 'data_type', full: 'data_type', type: 'keyword' },
  {
    field: 'experimental_strategy',
    full: 'experimental_strategy',
    type: 'keyword',
  },
  { field: 'data_format', full: 'data_format', type: 'keyword' },
  { field: 'platform', full: 'platform', type: 'keyword' },
  { field: 'access', full: 'access', type: 'keyword' },
  { field: 'sample_id', full: 'sample_id', type: 'keyword'}
];

const presetFacetFields = presetFacets.map(x => x.field);
const entityType = 'Files';

const enhance = compose(
  setDisplayName('RepoFileAggregations'),
  withFacetSelection({
    entityType,
    presetFacetFields,
    validFacetDocTypes: ['files'],
  }),
  connect((state, props) => ({
    userSelectedFacets: state.customFacets[entityType],
  })),
  withState('fileIdCollapsed', 'setFileIdCollapsed', false),
  withPropsOnChange(
    ['filters', 'userSelectedFacets'],
    ({ filters, relay, userSelectedFacets }) =>
      relay.setVariables({
        filters,
        filesCustomFacetFields: userSelectedFacets
          .map(({ field }) => field)
          .join(','),
      }),
  ),
  withPropsOnChange(['facets'], ({ facets }) => ({
    parsedFacets: facets.facets ? tryParseJSON(facets.facets, {}) : {},
  })),
  lifecycle({
    componentDidMount(): void {
      const { filters, relay, userSelectedFacets } = this.props;
      relay.setVariables({
        filters,
        filesCustomFacetFields: userSelectedFacets
          .map(({ field }) => field)
          .join(','),
      });
    },
  }),
);

const styles = {
  link: {
    textDecoration: 'underline',
    color: '#2a72a5',
  },
};

export type TProps = {
  relay: Object,
  fileIdCollapsed: boolean,
  setFileIdCollapsed: Function,
  facets: { facets: string },
  parsedFacets: Object,
  aggregations: {
    access: { buckets: [IBucket] },
    data_category: { buckets: [IBucket] },
    data_format: { buckets: [IBucket] },
    data_type: { buckets: [IBucket] },
    experimental_strategy: { buckets: [IBucket] },
    platform: { buckets: [IBucket] },
    sample_id: { buckets: [IBucket] },
  },
  theme: Object,
  filters: Object,
  suggestions: Array<Object>,
  setAutocomplete: Function,

  userSelectedFacets: Array<{
    description: String,
    doc_type: String,
    field: String,
    full: String,
    type: 'id' | 'string' | 'long',
  }>,
  handleSelectFacet: Function,
  handleResetFacets: Function,
  handleRequestRemoveFacet: Function,
  presetFacetFields: Array<String>,
  shouldShowFacetSelection: Boolean,
  facetExclusionTest: Function,
  setShouldShowFacetSelection: Function,
};

export const FileAggregationsComponent = (props: TProps) => (
  <div className="test-file-aggregations">
    <div
      className="text-right"
      style={{
        padding: '10px 15px',
        borderBottom: `1px solid ${props.theme.greyScale5}`,
      }}
    >
      {!!props.userSelectedFacets.length && (
        <span>
          <a onClick={props.handleResetFacets} style={styles.link}>
            Reset
          </a>{' '}
          &nbsp;|&nbsp;
        </span>
      )}
      <a
        onClick={() => props.setShouldShowFacetSelection(true)}
        style={styles.link}
      >
        Add a File Filter
      </a>
    </div>
    <Modal
      isOpen={props.shouldShowFacetSelection}
      style={{ content: { border: 0, padding: '15px' } }}
    >
      <FacetSelection
        title="Add a File Filter"
        docType="files"
        onSelect={props.handleSelectFacet}
        onRequestClose={() => props.setShouldShowFacetSelection(false)}
        excludeFacetsBy={props.facetExclusionTest}
        additionalFacetData={props.parsedFacets}
      />
    </Modal>

    {props.userSelectedFacets.map(facet => (
      <FacetWrapper
        isRemovable
        relayVarName="filesCustomFacetFields"
        key={facet.full}
        facet={facet}
        aggregation={props.parsedFacets[facet.field]}
        relay={props.relay}
        onRequestRemove={() => props.handleRequestRemoveFacet(facet)}
        style={{ borderBottom: `1px solid ${props.theme.greyScale5}` }}
      />
    ))}
    <FacetHeader
      title="File"
      field="file_id"
      collapsed={props.fileIdCollapsed}
      setCollapsed={props.setFileIdCollapsed}
      description="Enter File UUID or name"
    />
    <SuggestionFacet
      title="File"
      collapsed={props.fileIdCollapsed}
      doctype="files"
      fieldNoDoctype="file_id"
      placeholder="e.g. 142682.bam, 4f6e2e7a-b..."
      hits={props.suggestions}
      setAutocomplete={props.setAutocomplete}
      style={{ borderBottom: `1px solid ${props.theme.greyScale5}` }}
      dropdownItem={x => (
        <Row>
          <FileIcon style={{ paddingRight: '1rem', paddingTop: '1rem' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{x.file_id}</div>
            <div style={{ fontSize: '80%' }}>{x.submitter_id}</div>
            {x.file_name}
          </div>
        </Row>
      )}
    />
    {_.reject(presetFacets, { full: 'file_id' }).map(facet => (
      <FacetWrapper
        key={facet.full}
        facet={facet}
        title={facet.title}
        aggregation={props.aggregations[escapeForRelay(facet.field)]}
        relay={props.relay}
        style={{ borderBottom: `1px solid ${props.theme.greyScale5}` }}
        additionalProps={facet.additionalProps}
      />
    ))}
  </div>
);

export const FileAggregationsQuery = {
  initialVariables: {
    filesCustomFacetFields: '',
    filters: null,
  },
  fragments: {
    facets: () => Relay.QL`
      fragment on Files {
        facets(facets: $filesCustomFacetFields filters: $filters)
      }
    `,
    aggregations: () => Relay.QL`
      fragment on FileAggregations {
        data_category {
          buckets {
            doc_count
            key
          }
        }
        data_type {
          buckets {
            doc_count
            key
          }
        }
        experimental_strategy {
          buckets {
            doc_count
            key
          }
        }

        data_format {
          buckets {
            doc_count
            key
          }
        }

        access {
          buckets {
            doc_count
            key
          }
        }
        
        sample_id {
        	buckets {
        		doc_count
        		key
        	}
        }
        
        platform {
        	buckets {
        		doc_count
        		key
        	}
        }
        		
      }
    `,
  },
};

const FileAggregations = Relay.createContainer(
  enhance(withTheme(FileAggregationsComponent)),
  FileAggregationsQuery,
);

export default FileAggregations;
