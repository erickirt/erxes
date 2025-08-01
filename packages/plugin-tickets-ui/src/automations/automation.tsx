import React from 'react';
import BoardItemForm from './containers/BoardItemForm';
import SelectBoard from './components/SelectBoard';
import ActionResult from './components/ActionResult';
import TriggerForm from './components/TriggerForm';

const Automations = (props) => {
  const { componentType, target } = props;

  switch (componentType) {
    case 'actionForm':
      return <BoardItemForm {...props} />;

    case 'selectBoard':
      return <SelectBoard {...props} />;

    case 'historyActionResult':
      return <ActionResult {...props} />;

    case 'historyName':
      return target.name;
    case 'triggerForm':
      return <TriggerForm {...props} />;

    default:
      return null;
  }
};

export default Automations;
