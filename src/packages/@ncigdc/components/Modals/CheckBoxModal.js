// @flow
import React from 'react';
import { compose, withState, lifecycle } from 'recompose';
import BaseModal from '@ncigdc/components/Modals/BaseModal';
import withRouter from '@ncigdc/utils/withRouter';
import { setModal } from '@ncigdc/dux/modal';

const enhance = compose(
  withState('agreed', 'setAgreed', false),
  lifecycle({
    componentWillReceiveProps(nextProps) {
      if (nextProps.user && !this.props.user) {
        nextProps.dispatch(setModal(null));
      }
    },
  }),
  withRouter,
);

const CheckBoxModal = ({
  dbGapList = [],
  extraButtons,
  dispatch,
  hidden = false,
  setAgreed,
  agreed,
  children,
  CustomButton,
}) => {
  let dbGapLink =
    dbGapList.length === 1
      ? 'https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=' +
        dbGapList[0]
      : 'https://www.ncbi.nlm.nih.gov/gap/?term=' +
        dbGapList.reduce((acc, d) => acc + '(' + d + '%5BStudy%5D)+OR+', '');
  if (dbGapLink.substr(dbGapLink.length - 4) === '+OR+') {
    dbGapLink = dbGapLink.slice(0, dbGapLink.length - 4);
  }
  return (
    <BaseModal
      title="Access Alert"
      extraButtons={CustomButton(agreed)}
      closeText="Cancel"
    >
      {children}
      {hidden ? null : (
        <div>
          <input
            type="checkbox"
            onClick={() => {
              setAgreed(!agreed);
            }}
            checked={agreed}
          />{' '}
          I agree to abide by the GDC{' '}
          <a
            href="https://gdc.cancer.gov/about-data/data-analysis-policies"
            target="_blank"
            rel="noopener noreferrer"
          >
            Data Use Agreement
          </a>{' '}
          and the study-specific Data Use Certification Agreement available in{' '}
          <a href={dbGapLink} target="_blank" rel="noopener noreferrer">
            dbGaP
          </a>.This means:
          <ul style={{ marginTop: '10px' }}>
            <li>
              I agree not to attempt to reidentify any individual participant in
              any study represented by GDC data, for any purpose whatever.
            </li>
            <li>
              I agree to have read and understand study-specific Data Use
              Agreements and to comply with any additional restrictions therein.
            </li>
          </ul>
        </div>
      )}
    </BaseModal>
  );
};

export default enhance(CheckBoxModal);
