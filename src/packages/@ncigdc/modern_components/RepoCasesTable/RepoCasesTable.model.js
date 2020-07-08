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
} from '@ncigdc/tableModels/utils';
import { AnnotationCountLink } from '@ncigdc/components/Links/AnnotationCountLink';

import ImageViewerLink from '@ncigdc/components/Links/ImageViewerLink';
import { RepositorySlideCount } from '@ncigdc/modern_components/Counts';
import { MicroscopeIcon } from '@ncigdc/theme/icons';
import { DISPLAY_SLIDES } from '@ncigdc/utils/constants';
import { Tooltip } from '@ncigdc/uikit/Tooltip';
import { ForTsvExport } from '@ncigdc/components/DownloadTableToTsvButton';
import { features } from '../../../../features';

const youngestDiagnosis = (
  p: { age_at_diagnosis: number },
  c: { age_at_diagnosis: number },
): { age_at_diagnosis: number } =>
  c.age_at_diagnosis < p.age_at_diagnosis ? c : p;

const dataCategoryColumns = createDataCategoryColumns({
  title: 'Available Files per Data Category',
  countKey: 'file_count',
  Link: RepositoryFilesLink,
  getCellLinkFilters: node => [
    {
      field: 'cases.case_id',
      value: node.case_id,
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
          { field: 'cases.case_id', value: [node.case_id] },
          ...fields,
        ]),
      }}
    >
      {children}
    </RepositoryFilesLink>
  );

const getProjectIdFilter = projects =>
  makeFilter([
    {
      field: 'cases.project.project_id',
      value: projects.edges.map(({ node: p }) => p.project_id),
    },
  ]);

const casesTableModel = [
//  createSelectColumn({ idField: 'case_id', headerRowSpan: 2 }),
//  {
//    name: 'Cart',
//    id: 'cart',
//    th: () => (
//      <Th key="cart" rowSpan="2">
//        Cart
//      </Th>
//    ),
//    td: ({ node, edges, index }) => (
//      <Td>
//        <AddCaseFilesToCartButton
//          caseId={node.case_id}
//          hasFiles={
//            _.sum(
//              node.summary.data_categories.map(
//                dataCategory => dataCategory.file_count,
//              ),
//            ) > 0
//          }
//          fileCount={node.summary.file_count}
//          dropdownStyle={
//            index > edges.length - 3 ? { top: 'auto', bottom: '100%' } : {}
//          }
//        />
//      </Td>
//    ),
//  }},
  {
    name: 'Sample ID',
    id: 'sample_id',
    hidden: true,
    downloadable: true,
    th: () => (
      <Th key="sample_id" rowSpan="2">
        Case UUID
      </Th>
    ),
    td: ({ node }) => <Td>{node.samples.sample_id}</Td>,
  },

  {
    name: 'Sex',
    id: 'demographics.sex',
    sortable: true,
    downloadable: true,
    th: () => (
      <Th key="demographics.sex" rowSpan="2">
        Gender
      </Th>
    ),
    td: ({ node }) => (
      <Td key="demographics.sex">
        {_.capitalize(node.demographics.sex) || '--'}
      </Td>
    ),
  },
  {
    name: 'Files',
    id: 'summary.file_count',
    sortable: true,
    downloadable: true,
    th: () => (
      <ThNum key="summary.file_count" rowSpan="2">
        Files
      </ThNum>
    ),
    td: ({ node }) => (
      <TdNum key="summary.file_count">
        <FilesLink node={node}>
          {node.summary.file_count.toLocaleString()}
        </FilesLink>
      </TdNum>
    ),
    total: withRouter(({ hits, query }) => (
      <TdNum>
        <RepositoryCasesLink
          query={{
            filters: query.filters ? getProjectIdFilter(hits) : null,
          }}
        >
          {hits.edges
            .reduce((acc, val) => acc + val.node.summary.case_count, 0)
            .toLocaleString()}
        </RepositoryCasesLink>
      </TdNum>
    )),
  },
  ...dataCategoryColumns,
  {
    name: 'Age at diagnosis',
    id: 'demographics.age',
    sortable: false,
    downloadable: true,
    hidden: true,
    th: () => <Th rowSpan="2">Age at diagnosis</Th>,
    td: ({ node }) => {
      // Use diagnosis with minimum age
      const age = node.diagnoses.hits.edges
        .map(x => x.node)
        .reduce(
          (p, c) => (c.age_at_diagnosis < p ? c.age_at_diagnosis : p),
          Infinity,
        );
      return (
        <Td>{age !== Infinity && node.diagnoses ? ageDisplay(age) : '--'}</Td>
      );
    },
  },

];

export default casesTableModel;
