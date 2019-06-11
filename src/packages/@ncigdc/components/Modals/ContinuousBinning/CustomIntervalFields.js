import React from 'react';
import BinningInput from './BinningInput';
import BinningMethodInput from './BinningMethodInput';

const styles = {
  inputWrapper: { maxWidth: '100px' },
  text: {
    lineHeight: '34px',
    padding: '0 10px',
  },
};

const CustomIntervalFields = ({
  customInterval,
  disabled,
  handleChange,
  handleUpdateBinningMethod,
  validateCustomInterval,
}) => {
  const CustomIntervalText = props => {
    const { children } = props;
    return (
      <div style={styles.text}>
        {children}
      </div>
    );
  };

  return (
    <div
      className="binning-interval"
      style={{
        display: 'flex',
        marginBottom: '15px',
      }}
      >
      <div>
        <BinningMethodInput
          binningMethod="interval"
          defaultChecked={!disabled}
          label="Bin Interval"
          onClick={handleUpdateBinningMethod}
          validateOnBlur={validateCustomInterval}
          />
      </div>
      <div style={styles.inputWrapper}>
        <BinningInput
          binningMethod="interval"
          disabled={disabled}
          handleChange={handleChange}
          inputError={customInterval.amount.error}
          inputId="custom-interval-amount"
          inputKey="amount"
          valid={customInterval.amount.error.length === 0}
          validateOnBlur={validateCustomInterval}
          value={customInterval.amount.value}
          />
      </div>
      <CustomIntervalText>limit values from</CustomIntervalText>
      <div style={styles.inputWrapper}>
        <BinningInput
          binningMethod="interval"
          disabled={disabled}
          handleChange={handleChange}
          inputError={customInterval.min.error}
          inputId="custom-interval-min"
          inputKey="min"
          valid={customInterval.min.error.length === 0}
          validateOnBlur={validateCustomInterval}
          value={customInterval.min.value}
          />
      </div>
      <CustomIntervalText>to</CustomIntervalText>
      <div style={styles.inputWrapper}>
        <BinningInput
          binningMethod="interval"
          disabled={disabled}
          handleChange={handleChange}
          inputError={customInterval.max.error}
          inputId="custom-interval-max"
          inputKey="max"
          valid={customInterval.max.error.length === 0}
          validateOnBlur={validateCustomInterval}
          value={customInterval.max.value}
          />
      </div>
    </div>
  );
};

export default CustomIntervalFields;