// @flow
import React from 'react';
import {
  compose,
  setDisplayName,
  withState,
  withProps,
  withHandlers,
} from 'recompose';

import { Column, Row } from '@ncigdc/uikit/Flex';
import { getDefaultCurve, enoughData } from '@ncigdc/utils/survivalplot';
import withFilters from '@ncigdc/utils/withFilters';
import { makeFilter, toggleFilters } from '@ncigdc/utils/filters';
import SsmsTable from '@ncigdc/modern_components/SsmsTable';
import SurvivalPlotWrapper from '@ncigdc/components/SurvivalPlotWrapper';
import { stringifyJSONParam } from '@ncigdc/utils/uri';
import removeEmptyKeys from '@ncigdc/utils/removeEmptyKeys';
import withPropsOnChange from '@ncigdc/utils/withPropsOnChange';

const styles = {
  card: {
    backgroundColor: 'white',
  },
  heading: {
    flexGrow: 1,
    fontSize: '2rem',
    marginBottom: 7,
    marginTop: 7,
  },
};

const initialState = {
  loading: true,
};

export default compose(
  setDisplayName('EnhancedMutationsTab'),
  withFilters(),
  withState('defaultSurvivalData', 'setDefaultSurvivalData', {}),
  withState('selectedSurvivalData', 'setSelectedSurvivalData', {}),
  withState('state', 'setState', initialState),
  withProps(
    ({
      defaultSurvivalData,
      filters,
      selectedSurvivalData,
      setDefaultSurvivalData,
      setSelectedSurvivalData,
      setState,
    }) => ({
      survivalData: {
        legend: selectedSurvivalData.legend || defaultSurvivalData.legend,
        rawData: selectedSurvivalData.rawData || defaultSurvivalData.rawData,
      },
      updateData: async () => {
        const survivalData = await getDefaultCurve({
          currentFilters: filters,
          slug: 'Explore',
        });

        setDefaultSurvivalData(survivalData);
        setSelectedSurvivalData({});

        setState(s => ({
          ...s,
          loading: false,
        }));
      },
    })
  ),
  withPropsOnChange(['filters'], ({ updateData }) => {
    updateData();
  }),
  withHandlers({
    handleClickMutation: ({ filters, push, query }) => ssm => {
      const newFilters = toggleFilters(
        filters,
        makeFilter([
          {
            field: 'ssms.ssm_id',
            value: [ssm.ssm_id],
          },
        ])
      );
      push({
        pathname: '/exploration',
        query: removeEmptyKeys({
          ...query,
          filters: newFilters && stringifyJSONParam(newFilters),
        }),
      });
    },
  })
)(
  ({
    defaultSurvivalData,
    filters,
    selectedSurvivalData,
    setSelectedSurvivalData,
    state: { loading },
    survivalData,
  }) => (
    <Column style={styles.card}>
      <h1
        id="mutated-genes"
        style={{
          ...styles.heading,
          padding: '1rem',
        }}
        >
        <i className="fa fa-bar-chart-o" style={{ paddingRight: '10px' }} />
        Somatic Mutations
      </h1>

      <Row>
        <Column
          flex="1"
          style={{
            padding: '0 20px',
            width: '50%',
          }}
          >
          <SurvivalPlotWrapper
            {...survivalData}
            height={240}
            onReset={() => setSelectedSurvivalData({})}
            plotType="mutation"
            survivalDataLoading={loading}
            />
        </Column>
        <Column flex="1" style={{ width: '50%' }} />
      </Row>

      <SsmsTable
        context="Cohort"
        defaultFilters={filters}
        hasEnoughSurvivalDataOnPrimaryCurve={enoughData(
          defaultSurvivalData.rawData
        )}
        selectedSurvivalData={selectedSurvivalData}
        setSelectedSurvivalData={setSelectedSurvivalData}
        showSurvivalPlot
        />
    </Column>
  )
);
