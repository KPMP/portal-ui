// @flow
import React from 'react';
import _ from 'lodash';
import {
  RepositoryCasesLink,
  RepositoryFilesLink,
} from '@ncigdc/components/Links/RepositoryLink';
import AddCaseFilesToCartButton from '@ncigdc/components/AddCaseFilesToCartButton';
import ProjectLink from '@ncigdc/components/Links/ProjectLink';
import CaseLink from '@ncigdc/components/Links/CaseLink';
import { Th, Td, ThNum, TdNum } from '@ncigdc/uikit/Table';
import { makeFilter } from '@ncigdc/utils/filters';
import ageDisplay from '@ncigdc/utils/ageDisplay';
import withRouter from '@ncigdc/utils/withRouter';
import {
  createDataCategoryColumns,
  createSelectColumn,
  createDataTypeColumns
} from '@ncigdc/tableModels/utils';
import { AnnotationCountLink } from '@ncigdc/components/Links/AnnotationCountLink';

import ImageViewerLink from '@ncigdc/components/Links/ImageViewerLink';
import { RepositorySlideCount } from '@ncigdc/modern_components/Counts';
import { MicroscopeIcon } from '@ncigdc/theme/icons';
import { DISPLAY_SLIDES } from '@ncigdc/utils/constants';
import { Tooltip } from '@ncigdc/uikit/Tooltip';
import { ForTsvExport } from '@ncigdc/components/DownloadTableToTsvButton';



const dataTypeColumns = createDataTypeColumns({
  title: 'Available Files per Data Type',
  countKey: 'file_count',
  Link: RepositoryFilesLink,
  getCellLinkFilters: node => [
    {
      field: 'cases.samples.sample_id',
      value: node.samples.sample_id,
    },
  ],
  getTotalLinkFilters: hits => [],
});

const FilesLink = ({ node, fields = [], children }) =>
  children === '0' ? (
    <span>0</span>
  ) : (
    <RepositoryFilesLink
      query={{
        filters: makeFilter([
          { field: 'Case.samples.sample_id', value: [node.samples.sample_id] },
          ...fields,
        ]),
      }}
    >
      {children}
    </RepositoryFilesLink>
  );


const casesTableModel = [
  {
    name: 'Sample ID',
    id: 'samples.sample_id',
    downloadable: false,
    th: () => (
      <Th key="sample_id" rowSpan="2">
        Sample ID
      </Th>
    ),
    td: ({ node, index }) => (
      <Td key="sample_id">
      	{_.capitalize(node.samples.sample_id) || '--'}
      </Td>
    ),
  },
  {
    name: 'Sex',
    id: 'demographics.sex',
    sortable: true,
    downloadable: false,
    th: () => (
      <Th key="demographics.sex" rowSpan="2">
        Sex
      </Th>
    ),
    td: ({ node }) => (
      <Td key="demographics.sex">
        {_.capitalize(node.demographics.sex) || '--'}
      </Td>
    ),
  },
  {
    name: 'Provider',
    id: 'provider',
    sortable: false,
    downloadable: false,
    hidden: false,
    th: () => <Th rowSpan="2">Provider</Th>,
    td: ({ node }) => <Td>{node.provider}</Td>,
  },
  {
    name: 'Age at diagnosis',
    id: 'demographics.age',
    sortable: false,
    downloadable: false,
    hidden: false,
    th: () => <Th rowSpan="2">Age at diagnosis</Th>,
    td: ({ node }) => {

      return (
        <Td>{node.demographics.age ? node.demographics.age : '--'}</Td>
      );
    },
  },
  ...dataTypeColumns,

];

export default casesTableModel;
