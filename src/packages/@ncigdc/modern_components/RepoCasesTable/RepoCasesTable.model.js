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

const dataCategoryColumns = createDataCategoryColumns({
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
//  {
//    name: 'Case UUID',
//    id: 'case_id',
//    hidden: true,
//    downloadable: true,
//    th: () => (
//      <Th key="case_id" rowSpan="2">
//        Case UUID
//      </Th>
//    ),
//    td: ({ node }) => <Td>{node.case_id}</Td>,
//  },
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
//  {
//    name: 'Project',
//    id: 'project.project_id',
//    downloadable: true,
//    sortable: true,
//    th: () => (
//      <Th key="project_id" rowSpan="2">
//        Project
//      </Th>
//    ),
//    td: ({ node, index }) => (
//      <Td>
//        <ProjectLink
//          uuid={node.project.project_id}
//          id={`row-${index}-project-link`}
//        />
//      </Td>
//    ),
//  },
//  {
//    name: 'Primary Site',
//    id: 'primary_site',
//    sortable: true,
//    downloadable: true,
//    th: () => (
//      <Th key="primary_site" rowSpan="2">
//        Primary Site
//      </Th>
//    ),
//    td: ({ node }) => <Td key="primary_site">{node.primary_site}</Td>,
//  },

//  {
//    name: 'Files',
//    id: 'summary.file_count',
//    sortable: true,
//    downloadable: true,
//    th: () => (
//      <ThNum key="summary.file_count" rowSpan="2">
//        Files
//      </ThNum>
//    ),
//    td: ({ node }) => (
//      <TdNum key="summary.file_count">
//        <FilesLink node={node}>
//          {node.summary.file_count.toLocaleString()}
//        </FilesLink>
//      </TdNum>
//    ),
//    total: withRouter(({ hits, query }) => (
//      <TdNum>
//        <RepositoryCasesLink
//          query={{
//            filters: query.filters ? getProjectIdFilter(hits) : null,
//          }}
//        >
//          {hits.edges
//            .reduce((acc, val) => acc + val.node.summary.case_count, 0)
//            .toLocaleString()}
//        </RepositoryCasesLink>
//      </TdNum>
//    )),
//  },
//  ...dataCategoryColumns,
//  {
//    name: 'Annotations',
//    id: 'score',
//    sortable: true,
//    th: () => (
//      <ThNum key="score" rowSpan="2">
//        Annotations
//      </ThNum>
//    ),
//    td: ({ node }) => (
//      <TdNum key="score">
//        <AnnotationCountLink
//          hits={node.annotations.hits}
//          filters={makeFilter([
//            { field: 'annotations.case_id', value: node.case_id },
//          ])}
//        />
//      </TdNum>
//    ),
//  },
//  ...(DISPLAY_SLIDES && [
//    {
//      id: 'slides',
//      name: 'Slides',
//      sortable: false,
//      downloadable: false,
//      hidden: false,
//      th: () => <Th rowSpan="2">Slides</Th>,
//      td: ({ node }) => (
//        <Td style={{ textAlign: 'center' }}>
//          <RepositorySlideCount
//            filters={makeFilter([
//              { field: 'cases.case_id', value: node.case_id },
//            ])}
//          >
//            {count => [
//              <ForTsvExport key="slide-count-tsv-export">{count}</ForTsvExport>,
//              count ? (
//                <Tooltip Component="View Slide Image" key="slide-count">
//                  <ImageViewerLink
//                    isIcon
//                    query={{
//                      filters: makeFilter([
//                        { field: 'cases.case_id', value: node.case_id },
//                      ]),
//                    }}
//                  >
//                    <MicroscopeIcon style={{ maxWidth: '20px' }} /> ({count})
//                  </ImageViewerLink>
//                </Tooltip>
//              ) : (
//                <Tooltip Component="No slide images to view." key="slide-count">
//                  --
//                </Tooltip>
//              ),
//            ]}
//          </RepositorySlideCount>
//        </Td>
//      ),
//    },
//  ]),
//  {
//    name: 'Disease Type',
//    id: 'disease_type',
//    sortable: false,
//    downloadable: true,
//    hidden: true,
//    th: () => <Th rowSpan="2">Disease Type</Th>,
//    td: ({ node }) => <Td>{node.disease_type}</Td>,
//  },
//  {
//    name: 'Days to death',
//    id: 'demographic.days_to_death',
//    sortable: false,
//    downloadable: true,
//    hidden: true,
//    th: () => <Th rowSpan="2">Days to death</Th>,
//    td: ({ node }) => {
//      return (
//        <Td>
//          {(node.demographic && ageDisplay(node.demographic.days_to_death)) ||
//            '--'}
//        </Td>
//      );
//    },
//  },
//  {
//    name: 'Vital Status',
//    id: 'demographic.vital_status',
//    sortable: false,
//    downloadable: true,
//    hidden: true,
//    th: () => <Th rowSpan="2">Vital Status</Th>,
//    td: ({ node }) => {
//      return <Td>{node.demographic && node.demographic.vital_status}</Td>;
//    },
//  },
//  {
//    name: 'Primary Diagnosis',
//    id: 'diagnoses.primary_diagnosis',
//    sortable: false,
//    downloadable: true,
//    hidden: true,
//    th: () => <Th rowSpan="2">Primary Diagnosis</Th>,
//    td: ({ node }) => {
//      const primaryDiagnosis = node.diagnoses.hits.edges
//        .map(x => x.node)
//        .reduce(youngestDiagnosis, { age_at_diagnosis: Infinity });
//      return (
//        <Td>
//          {(node.diagnoses && primaryDiagnosis.primary_diagnosis) || '--'}
//        </Td>
//      );
//    },
//  },
//  {
//    name: 'Ethnicity',
//    id: 'demographic.ethnicity',
//    sortable: false,
//    downloadable: true,
//    hidden: true,
//    th: () => <Th rowSpan="2">Ethnicity</Th>,
//    td: ({ node }) => (
//      <Td>{(node.demographic && node.demographic.ethnicity) || '--'}</Td>
//    ),
//  },
//  {
//    name: 'Race',
//    id: 'demographic.race',
//    sortable: false,
//    downloadable: true,
//    hidden: true,
//    th: () => <Th rowSpan="2">Race</Th>,
//    td: ({ node }) => (
//      <Td>{(node.demographic && node.demographic.race) || '--'}</Td>
//    ),
//  },
];

export default casesTableModel;
