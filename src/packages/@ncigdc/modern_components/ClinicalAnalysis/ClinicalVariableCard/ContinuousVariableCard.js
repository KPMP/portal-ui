import React, { Fragment } from 'react';
import {
  compose,
  lifecycle,
  setDisplayName,
  withProps,
  withPropsOnChange,
  withState,
} from 'recompose';
import DownCaretIcon from 'react-icons/lib/fa/caret-down';
import { connect } from 'react-redux';
import {
  find,
  get,
  groupBy,
  isEmpty,
  isEqual,
  map,
  maxBy,
  reject,
  sortBy,
} from 'lodash';

import { Row, Column } from '@ncigdc/uikit/Flex';
import Button from '@ncigdc/uikit/Button';
import { Tooltip, TooltipInjector } from '@ncigdc/uikit/Tooltip';
import { visualizingButton, zDepth1 } from '@ncigdc/theme/mixins';

import EntityPageHorizontalTable from '@ncigdc/components/EntityPageHorizontalTable';
import Dropdown from '@ncigdc/uikit/Dropdown';
import DropdownItem from '@ncigdc/uikit/DropdownItem';
import Hidden from '@ncigdc/components/Hidden';
import BarChart from '@ncigdc/components/Charts/BarChart';
import { CreateExploreCaseSetButton, AppendExploreCaseSetButton, RemoveFromExploreCaseSetButton } from '@ncigdc/modern_components/withSetAction';

import { setModal } from '@ncigdc/dux/modal';
import SaveSetModal from '@ncigdc/components/Modals/SaveSetModal';
import AppendSetModal from '@ncigdc/components/Modals/AppendSetModal';
import RemoveSetModal from '@ncigdc/components/Modals/RemoveSetModal';
import DownloadVisualizationButton from '@ncigdc/components/DownloadVisualizationButton';
import wrapSvg from '@ncigdc/utils/wrapSvg';
import {
  DAYS_IN_YEAR,
} from '@ncigdc/utils/ageDisplay';
import { downloadToTSV } from '@ncigdc/components/DownloadTableToTsvButton';
import QQPlotQuery from '@ncigdc/modern_components/QQPlot/QQPlotQuery';
import BoxPlotWrapper from '@oncojs/boxplot';

// survival plot
import SurvivalPlotWrapper from '@ncigdc/components/SurvivalPlotWrapper';
import {
  getSurvivalCurvesArray,
  MAXIMUM_CURVES,
  MINIMUM_CASES,
} from '@ncigdc/utils/survivalplot';
import '../survivalPlot.css';
import {
  SpinnerIcon,
  CloseIcon,
  SurvivalIcon,
  BarChartIcon,
  BoxPlot,
} from '@ncigdc/theme/icons';
import { withTheme } from '@ncigdc/theme';

import {
  removeClinicalAnalysisVariable,
  updateClinicalAnalysisVariable,
} from '@ncigdc/dux/analysis';
import {
  humanify,
  createFacetFieldString,
  parseContinuousValue,
  parseContinuousKey,
  createContinuousGroupName,
} from '@ncigdc/utils/string';
import termCapitaliser from '@ncigdc/utils/customisation';
import timestamp from '@ncigdc/utils/timestamp';

import { analysisColors } from '@ncigdc/utils/constants';
import ContinuousCustomBinsModal from '@ncigdc/components/Modals/ContinuousBinning/ContinuousCustomBinsModal';
import ClinicalHistogram from './ClinicalHistogram';

import {
  BOX_PLOT_RATIO,
  boxTableAllowedStats,
  boxTableRenamedStats,
  CHART_HEIGHT,
  colors,
  dataDimensions,
  getCardFilters,
  getHeadings,
  QQ_PLOT_RATIO,
  getCountLink,
} from './helpers';

import '../boxplot.css';
import '../qq.css';

interface ITableHeading {
  key: string;
  title: string;
  style?: React.CSSProperties;
}

type TPlotType = 'continuous';
type TActiveChart = 'box' | 'survival' | 'histogram';
type TActiveCalculation = 'number' | 'percentage';
type TVariableType =
  | 'Demographic'
  | 'Diagnosis'
  | 'Exposure'
  | 'Treatment'
  | 'Follow_up' // confirm type name
  | 'Molecular_test'; // confirm type name

interface IVariable {
  bins: any[]; // tbd - bins still need spec
  active_calculation: TActiveCalculation;
  active_chart: TActiveChart;
  plotTypes: TPlotType;
  type: TVariableType;
}

interface IVariableCardProps {
  variable: IVariable;
  fieldName: string;
  plots: any[];
  style: React.CSSProperties;
  theme: IThemeProps;
  dispatch: (arg: any) => void;
  id: string;
  survivalData: any[];
}

interface IVizButton {
  title: string;
  icon: JSX.Element;
  action: (
    payload: IAnalysisPayload
  ) => { type: string, payload: IAnalysisPayload };
}

interface IVizButtons {
  survival: IVizButton;
  histogram: IVizButton;
  box: IVizButton;
  delete: IVizButton;
}

const styles = {
  actionMenuItem: {
    cursor: 'pointer',
    lineHeight: '1.5',
  },
  actionMenuItemDisabled: (theme: IThemeProps) => ({
    ':hover': {
      backgroundColor: 'transparent',
      color: theme.greyScale5,
      cursor: 'not-allowed',
    },
    color: theme.greyScale5,
    cursor: 'not-allowed',
  }),
  activeButton: (theme: IThemeProps) => ({
    ...styles.common(theme),
    backgroundColor: theme.primary,
    border: `1px solid ${theme.primary}`,
    color: '#fff',
  }),
  chartIcon: {
    height: '14px',
    width: '14px',
  },
  common: (theme: IThemeProps) => ({
    ':hover': {
      backgroundColor: 'rgb(0,138,224)',
      border: '1px solid rgb(0,138,224)',
      color: '#fff',
    },
    backgroundColor: 'transparent',
    border: `1px solid ${theme.greyScale4}`,
    color: theme.greyScale2,
    justifyContent: 'flex-start',
  }),
  histogram: (theme: IThemeProps) => ({
    axis: {
      fontSize: '1.1rem',
      fontWeight: '500',
      stroke: theme.greyScale4,
      textFill: theme.greyScale3,
    },
  }),
};

const vizButtons: IVizButtons = {
  box: {
    action: updateClinicalAnalysisVariable,
    icon: <BoxPlot style={styles.chartIcon} />,
    title: 'Box/QQ Plot',
  },
  delete: {
    action: removeClinicalAnalysisVariable,
    icon: <CloseIcon style={styles.chartIcon} />,
    title: 'Remove Card',
  },
  histogram: {
    action: updateClinicalAnalysisVariable,
    icon: <BarChartIcon style={styles.chartIcon} />,
    title: 'Histogram',
  },
  survival: {
    action: updateClinicalAnalysisVariable,
    icon: <SurvivalIcon style={styles.chartIcon} />,
    title: 'Survival Plot',
  },
};

const getTableData = (
  binData,
  getContinuousBuckets,
  fieldName,
  totalDocs,
  selectedSurvivalValues,
  setId,
  selectedBuckets,
  setSelectedBuckets,
  variable,
  updateSelectedSurvivalValues,
  selectedSurvivalLoadingIds,
) => {
  if (isEmpty(binData)) {
    return [];
  }

  const displayData = binData
    .sort((a, b) => a.keyArray[0] - b.keyArray[0])
    .reduce(getContinuousBuckets, []);

  return displayData.map(bin => Object.assign(
    {},
    bin,
    {
      select: (
        <input
          aria-label={`${fieldName} ${bin.key}`}
          checked={!!find(selectedBuckets, { key: bin.key })}
          disabled={bin.doc_count === 0}
          id={`${fieldName}-${bin.key}`}
          onChange={() => {
            if (find(selectedBuckets, { key: bin.key })) {
              setSelectedBuckets(
                reject(selectedBuckets, r => r.key === bin.key)
              );
            } else {
              setSelectedBuckets(selectedBuckets.concat(bin));
            }
          }}
          style={{
            marginLeft: 3,
            pointerEvents: 'initial',
          }}
          type="checkbox"
          value={bin.key}
          />
      ),
    },
    variable.active_chart === 'survival' && {
      survival: (
        <Tooltip
          Component={
            bin.key === '_missing' || bin.chart_doc_count < MINIMUM_CASES
              ? 'Not enough data'
              : selectedSurvivalValues.indexOf(bin.key) > -1
                ? `Click icon to remove "${bin.groupName || bin.key}"`
                : selectedSurvivalValues.length < MAXIMUM_CURVES
                  ? `Click icon to plot "${bin.groupName || bin.key}"`
                  : `Maximum plots (${MAXIMUM_CURVES}) reached`
          }
          >
          <Button
            disabled={
              bin.key === '_missing' ||
              bin.chart_doc_count < MINIMUM_CASES ||
              (selectedSurvivalValues.length >= MAXIMUM_CURVES &&
                selectedSurvivalValues.indexOf(bin.key) === -1)
            }
            onClick={() => {
              updateSelectedSurvivalValues(displayData, bin);
            }}
            style={{
              backgroundColor:
                selectedSurvivalValues.indexOf(bin.key) === -1
                  ? '#666'
                  : colors(selectedSurvivalValues.indexOf(bin.key)),
              color: 'white',
              margin: '0 auto',
              opacity:
                bin.key === '_missing' ||
                  bin.chart_doc_count < MINIMUM_CASES ||
                  (selectedSurvivalValues.length >= MAXIMUM_CURVES &&
                    selectedSurvivalValues.indexOf(bin.key) === -1)
                  ? '0.33'
                  : '1',
              padding: '2px 3px',
              position: 'static',
            }}
            >
            {selectedSurvivalLoadingIds.indexOf(bin.key) !== -1
              ? <SpinnerIcon />
              : <SurvivalIcon />}

            <Hidden>add to survival plot</Hidden>
          </Button>
        </Tooltip>
      ),
    },
  ));
};

const getBoxTableData = (data = {}) => (
  Object.keys(data).length
    ? sortBy(Object.keys(data), datum => boxTableAllowedStats.indexOf(datum.toLowerCase()))
      .reduce(
        (tableData, stat) => (
          boxTableAllowedStats.includes(stat.toLowerCase())
            ? tableData.concat({
              count: parseContinuousValue(data[stat]),
              stat: boxTableRenamedStats[stat] || stat, // Shows the descriptive label
            })
            : tableData
        ), []
      )
    : []
);

const ContinuousVariableCard: React.ComponentType<IVariableCardProps> = ({
  binData,
  currentAnalysis,
  dataBuckets,
  dataDimension,
  dataValues,
  defaultContinuousData,
  dispatch,
  fieldName,
  filters,
  getContinuousBuckets,
  id,
  overallSurvivalData,
  plots,
  qqData,
  resetCustomBinsDisabled,
  selectedBuckets,
  selectedSurvivalData,
  selectedSurvivalLoadingIds,
  selectedSurvivalValues,
  setId,
  setQQData,
  setQQDataIsSet,
  setSelectedBuckets,
  style = {},
  survivalPlotLoading,
  theme,
  totalDocs,
  updateSelectedSurvivalValues,
  variable,
  wrapperId,
}) => {
  const tableData = variable.active_chart === 'box'
    ? getBoxTableData(dataValues)
    : getTableData(
      binData,
      getContinuousBuckets,
      fieldName,
      totalDocs,
      selectedSurvivalValues,
      setId,
      selectedBuckets,
      setSelectedBuckets,
      variable,
      updateSelectedSurvivalValues,
      selectedSurvivalLoadingIds,
    );

  const histogramData =
    variable.active_chart === 'histogram'
      ? tableData.map(d => ({
        fullLabel: d.groupName || d.key,
        label: d.groupName || d.key,
        tooltip: `${d.key}: ${
          d.chart_doc_count.toLocaleString()} (${
          (((d.chart_doc_count || 0) / totalDocs) * 100).toFixed(2)}%)`,
        value: variable.active_calculation === 'number'
          ? d.chart_doc_count
          : (d.chart_doc_count / totalDocs) * 100,
      }))
      : [];

  const maxKeyNameLength = (
    maxBy(histogramData.map(d => d.fullLabel), (item) => item.length) || ''
  ).length;

  // set action will default to cohort total when no buckets are selected
  const totalFromSelectedBuckets = selectedBuckets && selectedBuckets.length
    ? selectedBuckets.reduce((acc, bin) => acc + bin.chart_doc_count, 0)
    : totalDocs;

  const tsvSubstring = fieldName.replace(/\./g, '-');
  const cardFilters = getCardFilters(variable.plotTypes, selectedBuckets, fieldName, filters);
  const setActionsDisabled = get(selectedBuckets, 'length', 0) === 0;
  const disabledCharts = plotType => isEmpty(tableData) &&
    plotType !== 'delete';

  return (
    <Column
      className="clinical-analysis-categorical-card"
      style={{
        ...zDepth1,
        height: 560,
        justifyContent: 'space-between',
        margin: '0 1rem 1rem',
        padding: '0.5rem 1rem 1rem',
        ...style,
      }}
      >
      <Row
        id={wrapperId}
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '5px 0 10px',
        }}
        >
        <h2
          style={{
            fontSize: '1.8rem',
            marginBottom: 0,
            marginTop: 10,
          }}
          >
          {humanify({ term: termCapitaliser(fieldName).split('__').pop() })}
        </h2>
        <Row>
          {plots.concat('delete')
            .map(plotType => (
              <Tooltip Component={vizButtons[plotType].title} key={plotType}>
                <Button
                  className={`chart-button-${plotType}`}
                  disabled={disabledCharts(plotType)}
                  onClick={() => {
                    dispatch(
                      vizButtons[plotType].action({
                        fieldName,
                        id,
                        value: plotType,
                        variableKey: 'active_chart',
                      })
                    );
                  }}
                  style={{
                    ...(disabledCharts(plotType)
                      ? {}
                      : plotType === variable.active_chart
                        ? styles.activeButton(theme)
                        : styles.common(theme)),
                    margin: 2,
                  }}
                  >
                  <Hidden>{vizButtons[plotType].title}</Hidden>
                  {vizButtons[plotType].icon}
                </Button>
              </Tooltip>
            ))}
        </Row>
      </Row>
      {isEmpty(tableData)
        ? (
          <Row
            id={`${wrapperId}-container`}
            style={{
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
            }}
            >
            There is no data for this facet
          </Row>
        )
        : (
          <Fragment>
            <Column id={`${wrapperId}-container`}>
              {['histogram'].includes(variable.active_chart) && (
                <Row style={{ paddingLeft: 10 }}>
                  <form style={{ width: '100%' }}>
                    <label
                      htmlFor={`variable-percentage-radio-${fieldName}`}
                      style={{
                        fontSize: '1.2rem',
                        marginRight: 10,
                      }}
                      >
                      <input
                        aria-label="Percentage of cases"
                        checked={variable.active_calculation === 'percentage'}
                        id={`variable-percentage-radio-${fieldName}`}
                        onChange={() => dispatch(
                          updateClinicalAnalysisVariable({
                            fieldName,
                            id,
                            value: 'percentage',
                            variableKey: 'active_calculation',
                          })
                        )}
                        style={{ marginRight: 5 }}
                        type="radio"
                        value="percentage"
                        />
                      % of Cases
                    </label>
                    <label
                      htmlFor={`variable-number-radio-${fieldName}`}
                      style={{ fontSize: '1.2rem' }}
                      >
                      <input
                        aria-label="Number of cases"
                        checked={variable.active_calculation === 'number'}
                        id={`variable-number-radio-${fieldName}`}
                        onChange={() => dispatch(
                          updateClinicalAnalysisVariable({
                            fieldName,
                            id,
                            value: 'number',
                            variableKey: 'active_calculation',
                          })
                        )}
                        style={{ marginRight: 5 }}
                        type="radio"
                        value="number"
                        />
                      # of Cases
                    </label>
                    <DownloadVisualizationButton
                      data={histogramData.map(d => ({
                        label: d.fullLabel,
                        value: d.value,
                      }))}
                      key="download"
                      noText
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      slug={`${fieldName}-bar-chart`}
                      style={{
                        float: 'right',
                        marginRight: 2,
                      }}
                      svg={() => wrapSvg({
                        bottomBuffer: maxKeyNameLength * 3,
                        rightBuffer: maxKeyNameLength * 2,
                        selector: `#${wrapperId}-container .test-bar-chart svg`,
                        title: humanify({ term: fieldName }),
                      })}
                      tooltipHTML="Download image or data"
                      />
                  </form>
                </Row>
              )}

              {variable.active_chart === 'histogram' && (
                <ClinicalHistogram
                  active_calculation={variable.active_calculation}
                  histogramData={histogramData}
                  histogramStyles={styles.histogram}
                  theme={theme}
                  type={variable.type}
                  />
              )}

              {variable.active_chart === 'survival' && (
                <div
                  style={{
                    display: 'flex',
                    flex: '0 0 auto',
                    flexDirection: 'column',
                    height: '265px',
                    justifyContent: 'center',
                    margin: '5px 2px 10px',
                  }}
                  >
                  <SurvivalPlotWrapper
                    {...selectedSurvivalValues.length === 0
                      ? overallSurvivalData
                      : selectedSurvivalData}
                    height={202}
                    plotType={selectedSurvivalValues.length === 0
                      ? 'clinicalOverall'
                      : 'categorical'}
                    survivalPlotLoading={survivalPlotLoading}
                    uniqueClass="clinical-survival-plot"
                    />
                </div>
              )}

              {variable.active_chart === 'box' && (
                <Column
                  style={{
                    alignItems: 'space-between',
                    height: CHART_HEIGHT,
                    justifyContent: 'center',
                    marginBottom: 10,
                    minWidth: 300,
                  }}
                  >
                  <Row style={{ width: '100%' }}>
                    <Row
                      style={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginLeft: 10,
                        width: BOX_PLOT_RATIO,
                      }}
                      >
                      <span
                        style={{
                          color: theme.greyScale2,
                          fontSize: '1.2rem',
                        }}
                        >
                        Box Plot
                      </span>
                    </Row>
                    <Row>
                      <DownloadVisualizationButton
                        buttonStyle={{
                          fontSize: '1.2rem',
                          lineHeight: 0,
                          minHeight: 20,
                          minWidth: 22,
                          padding: 0,
                        }}
                        noText
                        slug={`boxplot-${fieldName}`}
                        svg={() => wrapSvg({
                          className: 'boxplot',
                          selector: `#${wrapperId}-boxplot-container figure svg`,
                          title: `${humanify({ term: fieldName })} Box Plot`,
                        })}
                        tooltipHTML="Download SVG or PNG"
                        />
                    </Row>
                    <Row
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 10,
                        width: QQ_PLOT_RATIO,
                      }}
                      >
                      <span
                        style={{
                          color: theme.greyScale2,
                          fontSize: '1.2rem',
                        }}
                        >
                        QQ Plot
                      </span>
                    </Row>
                    <Row>
                      <DownloadVisualizationButton
                        buttonStyle={{
                          fontSize: '1.2rem',
                          lineHeight: 0,
                          minHeight: 20,
                          minWidth: 22,
                          padding: 0,
                        }}
                        data={qqData}
                        noText
                        slug={`qq-plot-${fieldName}`}
                        svg={() => wrapSvg({
                          className: 'qq-plot',
                          selector: `#${wrapperId}-qqplot-container .qq-plot svg`,
                          title: `${humanify({ term: fieldName })} QQ Plot`,
                        })}
                        tooltipHTML="Download plot data"
                        tsvData={qqData}
                        />
                    </Row>
                  </Row>
                  <Row
                    style={{
                      height: CHART_HEIGHT,
                      justifyContent: 'space-between',
                    }}
                    >
                    <Column
                      id={`${wrapperId}-boxplot-container`}
                      style={{
                        height: CHART_HEIGHT + 10,
                        maxHeight: CHART_HEIGHT + 10,
                        minWidth: '150px',
                        width: '150px',
                      }}
                      >
                      <TooltipInjector>
                        <BoxPlotWrapper
                          color={analysisColors[variable.type]}
                          data={dataValues}
                          />
                      </TooltipInjector>
                    </Column>
                    <Column
                      id={`${wrapperId}-qqplot-container`}
                      style={{
                        height: CHART_HEIGHT + 10,
                        maxHeight: CHART_HEIGHT + 10,
                        width: QQ_PLOT_RATIO,
                      }}
                      >
                      <QQPlotQuery
                        chartHeight={CHART_HEIGHT + 10}
                        dataBuckets={dataBuckets}
                        dataHandler={data => setQQData(data)}
                        fieldName={fieldName}
                        filters={cardFilters}
                        first={totalDocs}
                        qqLineStyles={{ color: theme.greyScale2 }}
                        qqPointStyles={{ color: analysisColors[variable.type] }}
                        setDataHandler={() => setQQDataIsSet()}
                        setId={setId}
                        wrapperId={wrapperId}
                        />
                    </Column>
                  </Row>
                </Column>
              )}
            </Column>

            <Column>
              <Row
                style={{
                  justifyContent: 'space-between',
                  margin: '5px 0',
                }}
                >
                <Dropdown
                  button={(
                    <Button
                      rightIcon={<DownCaretIcon />}
                      style={{
                        ...visualizingButton,
                        padding: '0 12px',
                      }}
                      >
                  Select Action
                    </Button>
                  )}
                  dropdownStyle={{
                    left: 0,
                    minWidth: 205,
                  }}
                  >
                  {variable.active_chart === 'box' || [
                    <DropdownItem
                      key="save-set"
                      style={{
                        ...styles.actionMenuItem,
                        ...setActionsDisabled ? styles.actionMenuItemDisabled(theme) : {},
                      }}
                      >
                      <Row
                        onClick={() => setActionsDisabled || dispatch(setModal(
                          <SaveSetModal
                            CreateSetButton={CreateExploreCaseSetButton}
                            displayType="case"
                            filters={cardFilters}
                            score="gene.gene_id"
                            setName="Custom Case Selection"
                            sort={null}
                            title={`Save ${totalFromSelectedBuckets} Cases as New Set`}
                            total={totalFromSelectedBuckets}
                            type="case"
                            />
                        ))}
                        >
                        Save as new case set
                      </Row>
                    </DropdownItem>,
                    <DropdownItem
                      key="append-set"
                      style={{
                        ...styles.actionMenuItem,
                        ...setActionsDisabled ? styles.actionMenuItemDisabled(theme) : {},
                      }}
                      >
                      <Row
                        onClick={() => setActionsDisabled || dispatch(setModal(
                          <AppendSetModal
                            AppendSetButton={AppendExploreCaseSetButton}
                            displayType="case"
                            field="cases.case_id"
                            filters={cardFilters}
                            scope="explore"
                            score="gene.gene_id"
                            sort={null}
                            title={`Add ${totalFromSelectedBuckets} Cases to Existing Set`}
                            total={totalFromSelectedBuckets}
                            type="case"
                            />
                        ))}
                        >
                        Add to existing case set
                      </Row>
                    </DropdownItem>,
                    <DropdownItem
                      key="remove-set"
                      style={Object.assign(
                        {},
                        styles.actionMenuItem,
                        setActionsDisabled ? styles.actionMenuItemDisabled(theme) : {},
                      )}
                      >
                      <Row
                        onClick={() => setActionsDisabled || dispatch(setModal(
                          <RemoveSetModal
                            enableDragging
                            field="cases.case_id"
                            filters={cardFilters}
                            RemoveFromSetButton={RemoveFromExploreCaseSetButton}
                            selected={Object.keys(get(currentAnalysis, 'sets.case', {}))[0] || ''}
                            title={`Remove ${totalFromSelectedBuckets} Cases from Existing Set`}
                            type="case"
                            />
                        ))}
                        >
                        Remove from existing case set
                      </Row>
                    </DropdownItem>,
                  ]}

                  <DropdownItem
                    key="tsv"
                    onClick={() => downloadToTSV({
                      excludedColumns: [
                        'Select',
                        // others
                      ],
                      filename: `analysis-${
                        currentAnalysis.name}-${tsvSubstring}.${timestamp()}.tsv`,
                      selector: `#analysis-${tsvSubstring}-table`,
                    })}
                    style={{
                      ...styles.actionMenuItem,
                      borderTop: variable.active_chart !== 'box' ? `1px solid ${theme.greyScale5}` : '',
                    }}
                    >
                    Export TSV
                  </DropdownItem>
                </Dropdown>

                {variable.active_chart === 'box' || (
                  <Dropdown
                    button={(
                      <Button
                        rightIcon={<DownCaretIcon />}
                        style={{
                          ...visualizingButton,
                          padding: '0 12px',
                        }}
                        >
                        Customize Bins
                      </Button>
                    )}
                    dropdownStyle={{ right: 0 }}
                    >
                    <DropdownItem
                      onClick={() => dispatch(setModal(
                        <ContinuousCustomBinsModal
                          binData={binData}
                          continuousBinType={variable.continuousBinType}
                          continuousCustomInterval={variable.continuousCustomInterval}
                          continuousCustomRanges={variable.continuousCustomRanges}
                          defaultContinuousData={defaultContinuousData}
                          fieldName={humanify({ term: fieldName })}
                          onClose={() => dispatch(setModal(null))}
                          onUpdate={(
                            newBins,
                            continuousBinType,
                            continuousCustomInterval,
                            continuousCustomRanges,
                            continuousReset,
                          ) => {
                            dispatch(
                              updateClinicalAnalysisVariable({
                                fieldName,
                                id,
                                value: continuousReset
                                  ? defaultContinuousData.buckets
                                  : newBins,
                                variableKey: 'bins',
                              })
                            );
                            dispatch(
                              updateClinicalAnalysisVariable({
                                fieldName,
                                id,
                                value: continuousReset
                                  ? 'default'
                                  : continuousBinType,
                                variableKey: 'continuousBinType',
                              })
                            );
                            !continuousReset &&
                              continuousBinType === 'interval' &&
                              (
                                dispatch(
                                  updateClinicalAnalysisVariable({
                                    fieldName,
                                    id,
                                    value: continuousCustomInterval,
                                    variableKey: 'continuousCustomInterval',
                                  })
                                ));
                            !continuousReset &&
                              continuousBinType === 'range' &&
                              (
                                dispatch(
                                  updateClinicalAnalysisVariable({
                                    fieldName,
                                    id,
                                    value: continuousCustomRanges,
                                    variableKey: 'continuousCustomRanges',
                                  })
                                ));
                            continuousReset &&
                              (
                                dispatch(
                                  updateClinicalAnalysisVariable({
                                    fieldName,
                                    id,
                                    value: [],
                                    variableKey: 'continuousCustomRanges',
                                  })
                                ));
                            continuousReset &&
                              (
                                dispatch(
                                  updateClinicalAnalysisVariable({
                                    fieldName,
                                    id,
                                    value: {},
                                    variableKey: 'continuousCustomInterval',
                                  })
                                ));
                            dispatch(setModal(null));
                          }}
                          />
                      ))}
                      style={styles.actionMenuItem}
                      >
                      Edit Bins
                    </DropdownItem>

                    <DropdownItem
                      onClick={() => {
                        if (resetCustomBinsDisabled) return;
                        dispatch(
                          updateClinicalAnalysisVariable({
                            fieldName,
                            id,
                            value: defaultContinuousData.buckets,
                            variableKey: 'bins',
                          })
                        );
                        dispatch(
                          updateClinicalAnalysisVariable({
                            fieldName,
                            id,
                            value: 'default',
                            variableKey: 'continuousBinType',
                          })
                        );
                        dispatch(
                          updateClinicalAnalysisVariable({
                            fieldName,
                            id,
                            value: {},
                            variableKey: 'continuousCustomInterval',
                          })
                        );
                        dispatch(
                          updateClinicalAnalysisVariable({
                            fieldName,
                            id,
                            value: [],
                            variableKey: 'continuousCustomRanges',
                          })
                        );
                      }}
                      style={{
                        ...styles.actionMenuItem,
                        ...(resetCustomBinsDisabled 
                          ? styles.actionMenuItemDisabled(theme)
                          : {}),
                      }}
                      >
                      Reset to Default
                    </DropdownItem>
                  </Dropdown>
                )}
              </Row>

              <EntityPageHorizontalTable
                data={tableData.map(tableRow => Object.assign(
                  {},
                  tableRow,
                  // the key in the table needs to be the display name
                  {
                    key: tableRow.groupName === undefined
                    ? tableRow.key
                    : tableRow.groupName,
                  }
                ))}
                headings={getHeadings(variable.active_chart, dataDimension, fieldName)}
                tableContainerStyle={{
                  height: 175,
                }}
                tableId={`analysis-${tsvSubstring}-table`}
                />
            </Column>
          </Fragment>
      )}
    </Column>
  );
};

export default compose(
  setDisplayName('EnhancedContinuousVariableCard'),
  connect((state: any) => ({ analysis: state.analysis })),
  withTheme,
  withState('selectedSurvivalData', 'setSelectedSurvivalData', {}),
  withState('selectedSurvivalValues', 'setSelectedSurvivalValues', []),
  withState('selectedSurvivalLoadingIds', 'setSelectedSurvivalLoadingIds', []),
  withState('survivalPlotLoading', 'setSurvivalPlotLoading', true),
  withState('selectedBuckets', 'setSelectedBuckets', []),
  withState('qqData', 'setQQData', []),
  withState('qqDataIsSet', 'setQQDataIsSet', false),
  withPropsOnChange(
    (props, nextProps) => !isEqual(props.data, nextProps.data),
    ({ data, fieldName }) => {
      const sanitisedId = fieldName.split('.').pop();
      const rawQueryData = get(data,
        `explore.cases.aggregations.${createFacetFieldString(fieldName)}`, data);
      const dataDimension = dataDimensions[sanitisedId] &&
        dataDimensions[sanitisedId].unit;

      return Object.assign(
        {
          dataBuckets: get(rawQueryData, 'range.buckets', []),
          dataValues: map(
            Object.assign(
              {},
              rawQueryData.stats,
              rawQueryData.percentiles,
            ),
            (value, stat) => {
              switch (dataDimension) {
                case 'Year': {
                  return ({
                    [stat]: parseContinuousValue(value / DAYS_IN_YEAR),
                  });
                }
                default:
                  return ({
                    [stat]: value,
                  });
              }
            }
          ).reduce((acc, item) => Object.assign({}, acc, item), {}),
          totalDocs: get(data, 'hits.total', 0),
          wrapperId: `${sanitisedId}-chart`,
        },
        dataDimensions[sanitisedId] && {
          axisTitle: dataDimensions[sanitisedId].axisTitle,
          dataDimension: dataDimensions[sanitisedId].unit,
          dataValues:
            map(
              Object.assign(
                {},
                rawQueryData.stats,
                rawQueryData.percentiles,
              ),
              (value, stat) => {
                switch (dataDimensions[sanitisedId].unit) {
                  case 'Years': {
                    return ({
                      [stat]: parseContinuousValue(value / DAYS_IN_YEAR),
                    });
                  }
                  default:
                    return ({
                      [stat]: value,
                    });
                }
              }
            ).reduce((acc, item) => Object.assign({}, acc, item), {}),
        },
      );
    }
  ),
  withPropsOnChange(
    (props, nextProps) => !isEqual(props.dataBuckets, nextProps.dataBuckets) ||
      props.setId !== nextProps.setId,
    ({
      dataBuckets,
      dispatch,
      fieldName,
      id,
      variable,
    }) => {
      dispatch(
        updateClinicalAnalysisVariable({
          fieldName,
          id,
          value: variable.continuousBinType === 'default'
            ? dataBuckets.reduce((acc, curr, index) => Object.assign(
              {},
              acc,
              {
                [dataBuckets[index].key]: Object.assign(
                  {},
                  dataBuckets[index],
                  { groupName: dataBuckets[index].key },
                ),
              },
            ), {})
            : Object.keys(variable.bins)
              .reduce((acc, curr, index) => Object.assign(
                {},
                acc,
                {
                  [curr]: Object.assign(
                    {},
                    variable.bins[curr],
                    {
                      doc_count: dataBuckets[index]
                      ? dataBuckets[index].doc_count
                      : 0,
                    }
                  ),
                }
              ), {}),
          variableKey: 'bins',
        }),
      );
    }
  ),
  withProps(
    ({
      data: { explore },
      dataBuckets,
      fieldName,
      setId,
      totalDocs,
      variable,
    }) => {
      const fieldNameUnderscores = createFacetFieldString(fieldName);

      if (!(explore &&
          explore.cases &&
          explore.cases.aggregations &&
          explore.cases.aggregations[fieldNameUnderscores])) {
        return;
      }

      const binsForBinData = explore.cases.aggregations[fieldNameUnderscores].range.buckets
        .reduce((acc, curr) => {
          const keyTrimIntegers = parseContinuousKey(curr.key).join('-');
          const currentBin = variable.bins[keyTrimIntegers] ||
              variable.bins[curr.key] ||
              { groupName: '--' };
          return Object.assign(
            {},
            acc,
            {
              [keyTrimIntegers]: {
                doc_count: curr.doc_count,
                groupName: currentBin.groupName,
                key: keyTrimIntegers,
              },
            }
          );
        }, {});

      return ({
        binData: map(groupBy(binsForBinData, bin => bin.groupName), (values, key) => ({
          doc_count: values.reduce((acc, value) => acc + value.doc_count, 0),
          key,
          keyArray: values.reduce((acc, value) => acc.concat(value.key), []),
        })).filter(bin => bin.key),
        bucketsOrganizedByKey: dataBuckets.reduce((acc, r) => Object.assign(
          {},
          acc,
          {
            [r.key]: Object.assign(
              {},
              r,
              { 
                groupName: r.groupName !== undefined &&
                  r.groupName !== '' 
                  ? r.groupName 
                  : r.key,
              }
            )
          }
        ), {}),
        getContinuousBuckets: (acc, { doc_count, key, keyArray }) => {
          const keyValues = parseContinuousKey(key);
          // survival doesn't have keyArray
          const keyArrayValues = keyArray
            ? parseContinuousKey(keyArray[0])
            : keyValues;

          const groupName = keyValues.length === 2 &&
            isFinite(keyValues[0]) &&
            isFinite(keyValues[1])
            ? createContinuousGroupName(key)
            : key;

          const [keyMin, keyMax] = keyArrayValues;
          const filters = {
            op: 'and',
            content: [
              {
                op: 'in',
                content: {
                  field: 'cases.case_id',
                  value: `set_id:${setId}`,
                },
              },
              {
                op: '>=',
                content: {
                  field: fieldName,
                  value: [keyMin],
                },
              },
              {
                op: '<',
                content: {
                  field: fieldName,
                  value: [keyMax],
                },
              },
            ],
          };

          return acc.concat(
            {
              chart_doc_count: doc_count,
              doc_count: getCountLink({
                doc_count,
                filters,
                totalDocs,
              }),
              filters,
              groupName,
              key: `${keyMin}-${keyMax}`,
              rangeValues: {
                max: keyMax,
                min: keyMin,
              },
            }
          );
        },
      });
    }
  ),
  withProps(({ data: { explore }, fieldName, variable }) => {
    const dataStats = explore
      ? explore.cases.aggregations[`${createFacetFieldString(fieldName)}`].stats
      : {
        Max: null,
        Min: null,
      };

    const defaultMin = dataStats.Min;
    const defaultMax = dataStats.Max + 1;
    // api excludes the max number

    const defaultQuarter = (defaultMax - defaultMin) / 4;

    const defaultNumberOfBuckets = 5;
    const defaultBucketSize = (defaultMax - defaultMin) / defaultNumberOfBuckets;

    const defaultBuckets = Array(defaultNumberOfBuckets).fill(1)
      .map((val, key) => {
        const from = key * defaultBucketSize + defaultMin;
        const to = (key + 1) === defaultNumberOfBuckets
          ? defaultMax
          : (defaultMin + (key + 1) * defaultBucketSize);
        const objKey = `${from}-${to}`;

        return ({
          [objKey]: {
            key: objKey,
          },
        });
      }).reduce((acc, curr) => Object.assign({}, acc, curr), {});

    return ({
      defaultContinuousData: {
        buckets: defaultBuckets,
        max: defaultMax,
        min: defaultMin,
        quarter: defaultQuarter,
      },
    });
  }),
  withProps(
    ({
      dataBuckets,
      fieldName,
      filters,
      getContinuousBuckets,
      selectedSurvivalValues,
      setSelectedSurvivalData,
      setSelectedSurvivalLoadingIds,
      setSelectedSurvivalValues,
      setSurvivalPlotLoading,
      variable,
    }) => ({
      populateSurvivalData: () => {
        setSurvivalPlotLoading(true);
        const dataForSurvival = dataBuckets.length > 0
          ? dataBuckets
            .sort((a, b) => parseContinuousKey(a.key)[0] - parseContinuousKey(b.key)[0])
            .reduce(getContinuousBuckets, [])
          : [];

        const filteredData = dataForSurvival
          .filter(x => x.chart_doc_count >= MINIMUM_CASES)
          .filter(x => x.key !== '_missing');

        const continuousTop2Values = filteredData
          .sort((a, b) => b.chart_doc_count - a.chart_doc_count)
          .slice(0, 2);

        const valuesForTable = continuousTop2Values
          .sort((a, b) => b.chart_doc_count - a.chart_doc_count)
          .map(d => d.key);

        const valuesForPlot = continuousTop2Values;

        setSelectedSurvivalValues(valuesForTable);
        setSelectedSurvivalLoadingIds(valuesForTable);

        getSurvivalCurvesArray({
          currentFilters: filters,
          field: fieldName,
          plotType: variable.plotTypes,
          values: valuesForPlot,
        }).then(data => {
          setSelectedSurvivalData(data);
          setSurvivalPlotLoading(false);
          setSelectedSurvivalLoadingIds([]);
        });
      },
      updateSelectedSurvivalValues: (data, value) => {
        if (
          selectedSurvivalValues.indexOf(value.key) === -1 &&
          selectedSurvivalValues.length >= MAXIMUM_CURVES
        ) {
          return;
        }
        setSurvivalPlotLoading(true);

        const nextValues =
          selectedSurvivalValues.indexOf(value.key) === -1
            ? selectedSurvivalValues.concat(value.key)
            : selectedSurvivalValues.filter(s => s !== value.key);

        setSelectedSurvivalValues(nextValues);
        setSelectedSurvivalLoadingIds(nextValues);

        const valuesForPlot = nextValues
          .map(v => data.filter(d => d.key === v)[0])
          .map(filteredData => Object.assign(
            {},
            filteredData,
            { doc_count: 0 },
          ));

        getSurvivalCurvesArray({
          currentFilters: filters,
          field: fieldName,
          plotType: variable.plotTypes,
          values: valuesForPlot,
        }).then(receivedData => {
          setSelectedSurvivalData(receivedData);
          setSurvivalPlotLoading(false);
          setSelectedSurvivalLoadingIds([]);
        });
      },
    })
  ),
  withPropsOnChange(
    (props, nextProps) => props.variable.active_chart !== nextProps.variable.active_chart ||
      !isEqual(props.data, nextProps.data) ||
      !isEqual(props.variable.bins, nextProps.variable.bins),
    ({ populateSurvivalData, variable }) => {
      if (variable.active_chart === 'survival') {
        populateSurvivalData();
      }
    }
  ),
  withPropsOnChange(
    (props, nextProps) => props.id !== nextProps.id,
    ({ setSelectedBuckets }) => setSelectedBuckets([])
  ),
  withPropsOnChange(
    (props, nextProps) => props.variable.continuousBinType !== nextProps.variable.continuousBinType,
    ({ variable: { continuousBinType } }) => ({
      resetCustomBinsDisabled: continuousBinType === 'default',
    })
  ),
  lifecycle({
    componentDidMount(): void {
      const {
        bucketsOrganizedByKey,
        dispatch,
        fieldName,
        id,
        variable,
        wrapperId,
      } = this.props;
      if (variable.bins === undefined || isEmpty(variable.bins)) {
        dispatch(
          updateClinicalAnalysisVariable({
            fieldName,
            id,
            value: bucketsOrganizedByKey,
            variableKey: 'bins',
          }),
        );
      }
      if (variable.scrollToCard === false) return;
      const offset = document.getElementById('header').getBoundingClientRect().bottom + 10;
      const $anchor = document.getElementById(`${wrapperId}-container`);
      if ($anchor) {
        const offsetTop = $anchor.getBoundingClientRect().top + window.pageYOffset;
        window.scroll({
          behavior: 'smooth',
          top: offsetTop - offset,
        });
      }

      dispatch(
        updateClinicalAnalysisVariable({
          fieldName,
          id,
          value: false,
          variableKey: 'scrollToCard',
        })
      );
    },
  })
)(ContinuousVariableCard);
