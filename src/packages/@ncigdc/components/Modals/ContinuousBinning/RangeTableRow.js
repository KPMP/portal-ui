import React from 'react';
import { isFinite } from 'lodash';
import OutsideClickHandler from 'react-outside-click-handler';
import Button from '@ncigdc/uikit/Button';
import BinningInput from './BinningInput';

const rowStyles = {
  fieldsWrapper: {
    display: 'flex',
    flex: '1 0 0',
  },
  optionsButton: {
    display: 'inline-block',
    margin: '2px 0 0 5px',
    textAlign: 'center',
    width: '40px',
  },
};

class RangeTableRow extends React.Component {
  state = {
    fieldValues: {
      from: '',
      name: '',
      to: '',
    },
    fieldErrors: {
      from: '',
      name: '',
      to: '',
    },
    isActive: true,
  };

  fieldsOrder = [
    'name',
    'from',
    'to',
  ];

  handleSave = function() {
    const validateFieldsResult = this.validateFields();
    this.setState({ fieldErrors: validateFieldsResult });
    const rowIsValid = Object.keys(validateFieldsResult)
      .filter(field => validateFieldsResult[field].length > 0).length === 0;

    if (rowIsValid) {
      const { handleUpdateRow, rowIndex } = this.props;
      const { fieldValues, isActive } = this.state;
      const nextRow = {
        active: false,
        fields: fieldValues,
      };
      this.setState({ isActive: false });
      handleUpdateRow(rowIndex, nextRow);
    }
  };

  handleEdit = function() {
    const { handleToggleActiveRow, rowIndex } = this.props;
    this.setState({ isActive: true });
    handleToggleActiveRow(rowIndex, true);
  }

  handleCancel = function() {
    const { handleToggleActiveRow, rowIndex } = this.props;
    this.setState({ isActive: false });
    handleToggleActiveRow(rowIndex, false);
  }

  updateInput = target => {
    const inputKey = target.id.split('-')[3];
    const inputValue = target.value;

    const { fieldValues } = this.state;

    this.setState({
      fieldValues: {
        ...fieldValues,
        [inputKey]: inputValue,
      },
    });
  };

  validateFields = () => {
    const {
      fieldValues,
    } = this.state;
    // check empty & NaN errors first
    // then make sure that from < to
    const errorsEmptyOrNaN = Object.keys(fieldValues).reduce((acc, curr) => {
      const currentValue = fieldValues[curr];
      const currentValueNumber = Number(currentValue);

      const nextErrors = currentValue === '' 
        ? 'Required field.' : curr === 'name' 
          ? '' : isFinite(currentValueNumber) 
            ? '' : `'${currentValue}' is not a number.`;

      return ({
        ...acc,
        [curr]: nextErrors,
      });
    }, {});
    console.log('errorsEmptyOrNaN', errorsEmptyOrNaN);

    const checkMinMaxValues = errorsEmptyOrNaN.to === ''
      && errorsEmptyOrNaN.from === ''
      && Number(fieldValues.to.value) < Number(fieldValues.from.value);

    return checkMinMaxValues ? ({
      from: `'From' must be less than ${fieldValues.to}.`,
      name: '',
      to: `'To' must be greater than ${fieldValues.from}.`,
    }) : errorsEmptyOrNaN;
  };

  // resetToModalState = () => {
  //   const {
  //     from,
  //     name,
  //     to,
  //   } = this.state;
  //   this.setState({
  //     fieldValues: {
  //       from,
  //       name,
  //       to,
  //     },
  //   });
  // }

  // componentDidMount = () => {
  //   console.log("mounted")
  //   this.resetToModalState();
  // };

  render = () => {
    const {
      handleRemoveRow,
      rangeMethodActive,
      rowActive,
      rowIndex,
      styles,
    } = this.props;

    const { fieldErrors, fieldValues } = this.state;

    return (
      <OutsideClickHandler
        disabled={!rowActive || !rangeMethodActive}
        display="flex"
        onOutsideClick={() => {
          console.log('click!');
          // this.handleSave()
        }}
      >
        <div style={rowStyles.fieldsWrapper}>
          {
            this.fieldsOrder.map(rowItem => (
              <div
                key={`range-row-${rowIndex}-${rowItem}`}
                style={styles.column}
              >
                <BinningInput
                  binningMethod="range"
                  disabled={!rowActive || !rangeMethodActive}
                  handleChange={e => {
                    this.updateInput(e.target);
                  }}
                  handleClick={() => { console.log('todo: select binning method or make the field editable'); }}
                  inputError={fieldErrors[rowItem]}
                  inputId={`range-row-${rowIndex}-${rowItem}`}
                  inputKey={rowItem}
                  key={`range-row-${rowIndex}-${rowItem}`}
                  rowIndex={rowIndex}
                  valid={fieldErrors[rowItem].length === 0}
                  value={fieldValues[rowItem]}
                />
              </div>
            ))
          }
        </div>
        <div style={styles.optionsColumn}>
          {rowActive ? (
            <React.Fragment>
              <Button
                aria-label="Save"
                buttonContentStyle={{ justifyContent: 'center' }}
                disabled={!rangeMethodActive}
                id={`range-row-${rowIndex}-save`}
                onClick={() => {
                  this.handleSave();
                }}
                style={{
                  ...rowStyles.optionsButton,
                  ...(!rangeMethodActive || { background: 'green' }),
                }}
              >
                <i aria-hidden="true" className="fa fa-check" />
              </Button>
              <Button
                aria-label="Cancel"
                buttonContentStyle={{ justifyContent: 'center' }}
                disabled={!rangeMethodActive}
                id={`range-row-${rowIndex}-cancel`}
                onClick={() => {
                  this.handleCancel();
                }}
                style={{
                  ...rowStyles.optionsButton,
                  ...(!rangeMethodActive || { background: 'red' }),
                }}
              >
                <i aria-hidden="true" className="fa fa-close" />
              </Button>
            </React.Fragment>
          ) : (
              <Button
                aria-label="Edit"
                disabled={!rangeMethodActive}
                id={`range-row-${rowIndex}-edit`}
                onClick={() => {
                  this.handleEdit();
                }}
                style={{ ...rowStyles.optionsButton }}
              >
                <i aria-hidden="true" className="fa fa-pencil" />
              </Button>
            )}
          <Button
            aria-label="Remove"
            buttonContentStyle={{ justifyContent: 'center' }}
            disabled={!rangeMethodActive}
            id={`range-row-${rowIndex}-remove`}
            onClick={() => { 
              handleRemoveRow(rowIndex); 
            }}
            style={{ ...rowStyles.optionsButton }}
          >
            <i aria-hidden="true" className="fa fa-trash" />
          </Button>
        </div>
      </OutsideClickHandler>
    );
  }
}

export default RangeTableRow;